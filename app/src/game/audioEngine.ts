/**
 * BGM再生エンジン（Web Audio API）。
 *
 * 【なぜ <audio loop> ではないのか】
 * <audio loop> はループ時に再生位置を巻き戻すだけで、
 * 曲間のクロスフェードや、フォーマットごとのループ位置の指定ができない。
 * Web Audio なら、デコード済みバッファの loopStart / loopEnd を明示できる。
 *
 * 【ブラウザの自動再生制限】
 * ユーザーの操作（クリック／タップ／キー入力）が一度もない状態では音を鳴らせない。
 * `unlockOnFirstGesture()` が最初の操作を拾って AudioContext を起こす。
 *
 * 【状態の持ち方】
 * Reactの外に置いたシングルトン。画面の再描画で音が切れないようにするため。
 */

import { BGM, BGM_CROSSFADE_SECONDS, BGM_FORMAT, bgmSrc, type BgmId } from "../data/bgm";

type Playing = {
  id: BgmId;
  source: AudioBufferSourceNode;
  gain: GainNode;
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let playing: Playing | null = null;
/** ユーザー操作待ちで保留になっている曲。 */
let pendingId: BgmId | null = null;
let unlocked = false;
/** ユーザー設定の音量（0〜1）。 */
let userVolume = 0.6;

const buffers = new Map<BgmId, AudioBuffer>();
const loading = new Map<BgmId, Promise<AudioBuffer | null>>();

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  // 古い環境やテスト環境では AudioContext が無いことがある。
  const Ctor =
    typeof window !== "undefined"
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctor) return null;

  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = userVolume;
  masterGain.connect(ctx.destination);
  return ctx;
}

async function loadBuffer(id: BgmId): Promise<AudioBuffer | null> {
  const cached = buffers.get(id);
  if (cached) return cached;

  const inFlight = loading.get(id);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const context = ensureContext();
    if (!context) return null;
    try {
      const res = await fetch(bgmSrc(BGM[id]));
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await context.decodeAudioData(arrayBuffer);
      buffers.set(id, buffer);
      return buffer;
    } catch {
      // 音が鳴らなくてもゲームは続行する。
      return null;
    } finally {
      loading.delete(id);
    }
  })();

  loading.set(id, promise);
  return promise;
}

function stopWithFade(target: Playing, at: number, fade: number): void {
  target.gain.gain.cancelScheduledValues(at);
  target.gain.gain.setValueAtTime(target.gain.gain.value, at);
  target.gain.gain.linearRampToValueAtTime(0, at + fade);
  target.source.stop(at + fade + 0.05);
}

/** 指定の曲を再生する。同じ曲が既に鳴っていれば何もしない（頭出しを避ける）。 */
export async function playBgm(id: BgmId | null): Promise<void> {
  if (id === null) return;

  // 同じ曲なら継続。場所移動やモーダル開閉で曲が頭出しされないように。
  if (playing?.id === id) return;

  if (!unlocked) {
    // まだ音を鳴らせないので、最初の操作まで覚えておく。
    pendingId = id;
    return;
  }

  const context = ensureContext();
  if (!context || !masterGain) return;

  const buffer = await loadBuffer(id);
  if (!buffer) return;

  // 読み込んでいる間に別の曲へ切り替わっていたら破棄する。
  if (pendingId !== null && pendingId !== id) return;
  if (playing?.id === id) return;

  const track = BGM[id];
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  // WAVはファイル全体がループ1周分なので、バッファ全体をそのまま回す。
  // ここで資料の秒数を使うと、リサンプリングの誤差で末尾がわずかに切れる。
  // MP3の場合はパディングが付くので、資料の「原音の終了秒」で切り詰める。
  source.loopEnd =
    BGM_FORMAT === "wav" ? buffer.duration : Math.min(track.loopEnd, buffer.duration);

  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(masterGain);

  const now = context.currentTime;
  const fade = BGM_CROSSFADE_SECONDS;
  gain.gain.linearRampToValueAtTime(track.gain, now + fade);
  source.start(now);

  if (playing) stopWithFade(playing, now, fade);
  playing = { id, source, gain };
  pendingId = null;
}

/** BGMを止める。 */
export function stopBgm(): void {
  if (!playing || !ctx) return;
  stopWithFade(playing, ctx.currentTime, 0.3);
  playing = null;
}

/** ユーザー設定の音量（0〜1）。0 で実質ミュート。 */
export function setBgmVolume(volume: number): void {
  userVolume = Math.min(1, Math.max(0, volume));
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(userVolume, ctx.currentTime, 0.05);
  }
}

/**
 * 最初のユーザー操作で音を鳴らせるようにする。
 * ブラウザの自動再生制限のため、これより前には音を出せない。
 */
export function unlockOnFirstGesture(): () => void {
  if (typeof window === "undefined") return () => {};

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const context = ensureContext();
    void context?.resume();
    // 操作前に要求されていた曲があれば、ここで鳴らし始める。
    if (pendingId) void playBgm(pendingId);
    remove();
  };

  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
  const remove = () => events.forEach((e) => window.removeEventListener(e, unlock));
  events.forEach((e) => window.addEventListener(e, unlock, { once: false }));
  return remove;
}

/** テスト・デバッグ用。 */
export function currentBgmId(): BgmId | null {
  return playing?.id ?? null;
}
