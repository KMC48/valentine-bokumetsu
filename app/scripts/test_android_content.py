"""Negative cases use synthetic ZIPs; they are NOT Android build results."""
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from verify_android_content import ICHINOSE, verify


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.app = Path(self.tmp.name)
        self.assets = self.app / "android/app/src/main/assets"
        self.synced = self.assets / "public"
        files = {name: b"image" for name in ICHINOSE}
        files["assets/bgm/test.mp3"] = b"sound"
        for folder in ["public", "dist", "android/app/src/main/assets/public"]:
            for name, data in files.items():
                self.write(folder + "/" + name, data)
        for folder in ["dist", "android/app/src/main/assets/public"]:
            self.write(folder + "/index.html", b"<script src='assets/index.js'></script>")
            self.write(folder + "/assets/index.js", b"current story")
        self.write("android/app/src/main/assets/public/cordova.js", b"")
        self.write("android/app/src/main/assets/capacitor.config.json", json.dumps({
            "appId": "com.kmc48.valentinebokumetsu", "webDir": "dist",
            "server": {"androidScheme": "https"},
        }).encode())
        self.write("android/app/src/main/assets/capacitor.plugins.json", b"[]")
        self.write("android/app/build.gradle", b'versionCode 5\nversionName "1.0.4"')

    def write(self, name, data):
        path = self.app / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def archive(self, change=None, signed=False):
        path = self.app / "fixture.aab"
        with zipfile.ZipFile(path, "w") as out:
            out.writestr("base/manifest/AndroidManifest.xml", b"fixture")
            out.writestr("base/dex/classes.dex", b"fixture")
            for file in self.assets.rglob("*"):
                if file.is_file():
                    name = "base/assets/" + file.relative_to(self.assets).as_posix()
                    out.writestr(name, b"stale" if name == change else file.read_bytes())
            if signed:
                out.writestr("META-INF/TEST.SF", b"fixture")
                out.writestr("META-INF/TEST.RSA", b"fixture")
        return path

    def test_matching_content_and_unsigned_archive(self):
        verify(self.app, self.archive(), "unsigned")

    def test_missing_dedicated_image(self):
        (self.synced / sorted(ICHINOSE)[0]).unlink()
        with self.assertRaisesRegex(ValueError, "missing="):
            verify(self.app)

    def test_stale_story_bundle(self):
        (self.synced / "assets/index.js").write_bytes(b"old story")
        with self.assertRaisesRegex(ValueError, "changed="):
            verify(self.app)

    def test_extra_old_bundle(self):
        (self.synced / "assets/old.js").write_bytes(b"old")
        with self.assertRaisesRegex(ValueError, "extra="):
            verify(self.app)

    def test_altered_aab_asset(self):
        aab = self.archive("base/assets/public/" + sorted(ICHINOSE)[0])
        with self.assertRaisesRegex(ValueError, "Android -> AAB"):
            verify(self.app, aab)

    def test_remote_config_is_rejected(self):
        config_path = self.assets / "capacitor.config.json"
        config = json.loads(config_path.read_text())
        config["server"]["url"] = "https://example.com"
        config_path.write_text(json.dumps(config))
        with self.assertRaisesRegex(ValueError, "server.url"):
            verify(self.app)

    def test_unsigned_cannot_pass_signed_check(self):
        with self.assertRaisesRegex(ValueError, "signature"):
            verify(self.app, self.archive(), "signed")

    def test_signed_cannot_pass_ci_check(self):
        with self.assertRaisesRegex(ValueError, "must be unsigned"):
            verify(self.app, self.archive(signed=True), "unsigned")
