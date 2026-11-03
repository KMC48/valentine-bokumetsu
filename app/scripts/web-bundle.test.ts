import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STORIES } from "../src/data/stories";
import { ENDINGS } from "../src/data/endings";
import { ASSETS } from "../src/data/assets";
import { STUDENTS } from "../src/data/students";

const js = readdirSync("dist/assets").filter((name) => name.endsWith(".js"))
  .map((name) => readFileSync(`dist/assets/${name}`, "utf8")).join("\n");

describe("productionビルドに含まれるゲーム内容", () => {
  it("公開HTMLと同じポリシー全文をJS内に同梱し、外部リソースの取得を必要としない", () => {
    const policy = readFileSync("public/privacy.html", "utf8");
    expect(readFileSync("dist/privacy.html", "utf8")).toBe(policy);
    // Viteのraw importはテンプレートリテラルになる場合もあるため、全行を比較。
    for (const line of policy.trim().split("\n")) expect(js).toContain(line);
    expect(policy).not.toMatch(/<script|<link|<img|<iframe|@import|url\(/i);
  });

  it("現行ソースの全ストーリー・エンディングのタイトルと台詞を含む", () => {
    for (const scene of [...STORIES, ...ENDINGS]) {
      for (const text of [scene.title, ...scene.lines.flatMap((line) => [line.speaker, line.text])]) {
        if (text) expect(js, `${scene.id}: ${text}`).toContain(JSON.stringify(text).slice(1, -1));
      }
    }
  });

  it("一ノ瀬の通常・振り向き・会話画像と専用生徒データを含む", () => {
    for (const asset of [ASSETS.ichinose, ASSETS.ichinoseTurn, ASSETS.bustIchinose]) {
      expect(js).toContain(asset.src);
    }
    const ichinose = STUDENTS.find((student) => student.id === "l3-l-05")!;
    expect(ichinose.image).toBe(ASSETS.ichinose.src);
    expect(js).toContain(ichinose.id);
    for (const hint of ichinose.hints) expect(js).toContain(JSON.stringify(hint).slice(1, -1));
  });
});
