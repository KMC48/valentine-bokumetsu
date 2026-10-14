"""Compare public -> dist -> Capacitor assets -> AAB without third-party packages.

Run after a fresh production build and cap sync. This verifies content, not
Android runtime behaviour, Play eligibility, or ownership of the signing key.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

APP = Path(__file__).resolve().parents[1]
CAPACITOR_EXTRAS = {"cordova.js", "cordova_plugins.js"}
ICHINOSE = {
    "assets/characters/ichinose.webp",
    "assets/characters/ichinose_turn.webp",
    "assets/characters/bust_ichinose.webp",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(root):
    require(root.is_dir(), f"Missing directory: {root}")
    files = {}
    for path in sorted(root.rglob("*")):
        require(not path.is_symlink(), f"Symlink is not supported: {path}")
        if path.is_file():
            files[path.relative_to(root).as_posix()] = digest(path.read_bytes())
    require(files, f"Empty directory: {root}")
    return files


def compare(expected, actual, label, allowed_extra=frozenset()):
    missing = sorted(expected.keys() - actual.keys())
    extra = sorted(actual.keys() - expected.keys() - allowed_extra)
    changed = sorted(key for key in expected.keys() & actual.keys() if expected[key] != actual[key])
    require(not (missing or extra or changed),
            f"{label}: missing={missing}, extra={extra}, changed={changed}")


def verify(app, aab=None, signature=None):
    public = inventory(app / "public")
    dist = inventory(app / "dist")
    require(ICHINOSE <= public.keys(), "The three dedicated Ichinose images are required")
    require("index.html" in dist and any(p.endswith(".js") for p in dist), "Missing Web entry point")
    # Vite adds generated JS/CSS; every public file must still be byte-identical.
    compare(public, {p: h for p, h in dist.items() if p in public}, "public -> dist")

    assets = app / "android/app/src/main/assets"
    synced = inventory(assets / "public")
    compare(dist, synced, "dist -> Android", CAPACITOR_EXTRAS)
    config = json.loads((assets / "capacitor.config.json").read_text(encoding="utf-8"))
    require(config.get("appId") == "com.kmc48.valentinebokumetsu", "Wrong Capacitor appId")
    require(config.get("webDir") == "dist", "Capacitor must package dist")
    require(not config.get("server", {}).get("url"), "Remote server.url would bypass bundled content")
    require(config.get("server", {}).get("androidScheme") == "https", "Unexpected Android scheme")

    gradle = (app / "android/app/build.gradle").read_text(encoding="utf-8")
    version_code = int(re.search(r"\bversionCode\s+(\d+)", gradle)[1])
    version_name = re.search(r'\bversionName\s+"([^"]+)"', gradle)[1]
    result = {
        "versionCodeFromGradle": version_code, "versionNameFromGradle": version_name,
        "publicFiles": len(public), "distFiles": len(dist), "androidFiles": len(synced),
        "ichinoseSHA256": {name: dist[name] for name in sorted(ICHINOSE)},
        "distSHA256": dist,
    }
    if aab:
        with zipfile.ZipFile(aab) as archive:
            names = [info.filename for info in archive.infolist() if not info.is_dir()]
            require(len(names) == len(set(names)), "Duplicate entries in AAB")
            require("base/manifest/AndroidManifest.xml" in names, "Missing Android manifest")
            require(any(n.startswith("base/dex/") and n.endswith(".dex") for n in names), "Missing Android code")
            prefix = "base/assets/public/"
            bundled = {n[len(prefix):]: digest(archive.read(n)) for n in names if n.startswith(prefix)}
            compare(synced, bundled, "Android -> AAB")
            for name in ["capacitor.config.json", "capacitor.plugins.json"]:
                require(digest(archive.read(f"base/assets/{name}")) == digest((assets / name).read_bytes()),
                        f"AAB contains a stale {name}")
            has_sf = any(n.upper().startswith("META-INF/") and n.upper().endswith(".SF") for n in names)
            has_cert = any(n.upper().startswith("META-INF/") and n.upper().endswith((".RSA", ".DSA", ".EC")) for n in names)
            if signature == "signed":
                require(has_sf and has_cert, "AAB is missing JAR signature entries")
            if signature == "unsigned":
                require(not (has_sf or has_cert), "CI AAB must be unsigned")
            result.update({"aabFilesVerified": len(bundled), "aabSHA256": digest(aab.read_bytes()),
                           "signatureEntriesPresent": has_sf and has_cert})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--aab", type=Path)
    signatures = parser.add_mutually_exclusive_group()
    signatures.add_argument("--expect-signed", action="store_true")
    signatures.add_argument("--expect-unsigned", action="store_true")
    args = parser.parse_args()
    if (args.expect_signed or args.expect_unsigned) and not args.aab:
        parser.error("signature checks require --aab")
    signature = "signed" if args.expect_signed else "unsigned" if args.expect_unsigned else None
    result = verify(APP, args.aab, signature)
    result["sourceCommit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=APP, text=True).strip()
    result["trackedWorktreeChanges"] = bool(subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=no"], cwd=APP, text=True).strip())
    output = APP / "android/build/content-verification.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS public={result['publicFiles']} dist={result['distFiles']} Android={result['androidFiles']}")
    print(f"Gradle version: {result['versionNameFromGradle']} ({result['versionCodeFromGradle']})")
    if args.aab:
        print(f"PASS AAB content; SHA-256={result['aabSHA256']}")
    print(f"Report: {output}")


if __name__ == "__main__":
    main()
