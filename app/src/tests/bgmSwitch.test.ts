/**
 * BGMの切り替え。曲の読み込みが終わる順番と、画面が変わる順番が食い違っても、
 * 最後に要求された曲だけが鳴ることを確かめる。
 *
 * 実際に起きた不具合：ストーリーの曲を読み込んでいる間にスキップすると、
 * 探索中もストーリーの曲が鳴り続けた。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Engine = typeof import("../game/audioEngine");

/** 曲ごとに「読み込み完了」を手動で起こせるようにした fetch。 */
function controllableFetch() {
  const waiting = new Map<string, () => void>();
  const fetchMock = vi.fn((url: string) => {
    return new Promise((resolve) => {
      waiting.set(url, () => resolve({ arrayBuffer: async () => new ArrayBuffer(8) }));
    });
  });
  /** ファイル名の一部を指定して、その曲の読み込みを完了させる。 */
  const finish = async (part: string) => {
    const key = [...waiting.keys()].find((k) => k.includes(part));
    if (!key) throw new Error(`読み込み中の曲が無い: ${part}`);
    waiting.get(key)!();
    waiting.delete(key);
    // fetch → arrayBuffer → decode → 再生開始 までの待ちを流す。
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };
  return { fetchMock, finish };
}

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  resume = async () => {};
  decodeAudioData = async () => ({ duration: 60 });
  createGain() {
    return {
      gain: {
        value: 0,
        linearRampToValueAtTime() {},
        cancelScheduledValues() {},
        setValueAtTime() {},
        setTargetAtTime() {},
      },
      connect() {},
    };
  }
  createBufferSource() {
    return { buffer: null, loop: false, loopStart: 0, loopEnd: 0, connect() {}, start() {}, stop() {} };
  }
}

describe("BGMの切り替え", () => {
  let engine: Engine;
  let finish: (part: string) => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    const listeners: Array<() => void> = [];
    vi.stubGlobal("window", {
      AudioContext: FakeAudioContext,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: () => {},
    });
    const controlled = controllableFetch();
    finish = controlled.finish;
    vi.stubGlobal("fetch", controlled.fetchMock);

    engine = await import("../game/audioEngine");
    // 最初の操作があったことにして、音を解禁する。
    engine.unlockOnFirstGesture();
    listeners[0]!();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("読み込み中に元の曲へ戻ったら、あとから読み込みが終わった曲は鳴らさない", async () => {
    // タイトル：ポップが鳴っている。
    void engine.playBgm("pop");
    await finish("01_valentine_pop");
    expect(engine.currentBgmId()).toBe("pop");

    // ストーリーへ進み（dark を読み込み始める）、読み込みが終わる前にスキップして探索へ（pop）。
    void engine.playBgm("dark");
    void engine.playBgm("pop");
    await finish("03_twisted_school_rules");

    expect(engine.currentBgmId()).toBe("pop");
  });

  it("続けて2曲を要求したら、読み込みが終わる順番に関係なく最後の曲が鳴る", async () => {
    void engine.playBgm("dark");
    void engine.playBgm("youth");

    // 後から要求した曲が先に読み終わり、古い要求があとから終わる。
    await finish("02_after_school_youth");
    await finish("03_twisted_school_rules");

    expect(engine.currentBgmId()).toBe("youth");
  });

  it("止めたあとで、読み込み中だった曲が鳴り出さない", async () => {
    void engine.playBgm("dark");
    engine.stopBgm();
    await finish("03_twisted_school_rules");

    expect(engine.currentBgmId()).toBeNull();
  });
});
