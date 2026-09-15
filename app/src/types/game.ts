/** ゲーム全体で使う型定義。データファイルはすべてこの型に従う。 */

/** チョコの種類。得点はすべて data/score.ts 側で決まる。 */
export type ChocolateType = "none" | "friend" | "honmei" | "honmei_special";

/** ステージ（1周回 = 3ステージ）。 */
export type StageId = "morning" | "lunch" | "afterSchool";

/** 周回。1 = 公立高校 / 2 = 私立進学校 / 3 = エリート校。 */
export type LoopId = 1 | 2 | 3;

/** 画面遷移の単位。 */
export type ScreenId =
  | "title"
  | "loopSelect"
  | "settings"
  | "story"
  | "stage"
  | "stageResult"
  | "finalResult"
  | "ending";

/**
 * 生徒が見た目で持っている物。画像素材が入るまでは CSS/SVG で描画する。
 * 「紙袋 = チョコ確定」ではない点が本作の肝なので、chocolateType とは独立させる。
 */
export type VisibleItem =
  | "none"
  | "paper_bag"
  | "decoy_bag"
  | "lunch_box"
  | "book_case"
  | "pouch"
  | "sports_bag";

/** 女子生徒（＝通報ターゲット）1人分のデータ。 */
export type Student = {
  id: string;
  name: string;

  /** 立ち絵パス。null の場合はプレースホルダー（SVG）で描画する。 */
  image: string | null;

  chocolateType: ChocolateType;

  loop: LoopId;
  stage: StageId;
  /** どの場所にいるか（data/areas.ts のID）。 */
  area: string;

  /** 背景上の配置。% 指定（px にしない）。 */
  position: { x: number; y: number };

  /** 0〜100。ミニマップ／「!」マーカーの表示判定に使う。 */
  suspicionLevel: number;

  /** 観察モーダルに出る推理材料。前にあるものほど有力。 */
  hints: string[];

  dialogue?: string[];
  behavior?: string[];

  /** 見た目の持ち物。 */
  visibleItem?: VisibleItem;

  /** ダミー（紛らわしい無実／偽装）フラグ。難易度調整と図鑑用。 */
  isDecoy?: boolean;

  /** 告白相手の男子生徒ID（honmei_special 用）。 */
  targetBoyId?: string;

  /** 通報結果モーダルで出す固有テキスト。 */
  reportResultText?: string;

  /** プレースホルダー描画用の見た目。画像が入れば不要。 */
  appearance?: {
    hair: string;
    ribbon: string;
  };
};

/** 通報の判定結果。 */
export type ReportOutcome = {
  chocolateType: ChocolateType;
  success: boolean;
  basePoints: number;
  /** コンボ倍率適用後の実際の増減値。 */
  gainedPoints: number;
  comboBefore: number;
  comboAfter: number;
  multiplier: number;
  headline: string;
  detail: string;
};

/** 机の中身。人物と違い「誤認通報」が無い代わりに、調べるのに時間がかかる。 */
export type DeskContent = "none" | "friend" | "honmei";

/** 教室の机（調べられるスポット）。 */
export type DeskSpot = {
  id: string;
  loop: LoopId;
  stage: StageId;
  /** どの場所にあるか（data/areas.ts のID）。 */
  area: string;
  /** 「窓際・前から3番目の席」など。 */
  label: string;
  /**
   * ゲームエリアに対する%。
   * 生徒と違い床の台形マッピングは通さない（机は備品なので背景の見た目に直接合わせる）。
   */
  position: { x: number; y: number };
  /** マーカーの大きさ（ゲームエリア高さに対する%）。 */
  size: number;
  content: DeskContent;
  /** 調べた結果のテキスト。 */
  resultText: string;
  /** 人物ターゲットにつながる推理材料（あれば）。 */
  clue?: string;
  /** 机の画像。null ならCSS/SVGの仮マーカーで描画する。 */
  image: string | null;
};

/** 机を調べた結果。 */
export type DeskOutcome = {
  deskId: string;
  label: string;
  content: DeskContent;
  found: boolean;
  gainedPoints: number;
  comboAfter: number;
  multiplier: number;
  /** 消費した秒数。 */
  timeCost: number;
  headline: string;
  detail: string;
  clue?: string;
};

/** ストーリー（ADV）1行分。 */
export type StoryLine = {
  speaker: string;
  text: string;
  character?: string;
  background?: string;
};

/** ストーリーシーン。 */
export type StoryScene = {
  id: string;
  loop: LoopId;
  /** opening → morning前 / interlude1 → lunch前 / interlude2 → afterSchool前 */
  slot: "opening" | "interlude1" | "interlude2";
  title: string;
  lines: StoryLine[];
};

/** ステージ定義。 */
export type StageDef = {
  id: StageId;
  label: string;
  /** ミッション文言。{total} が対象人数に置換される。 */
  mission: string;
  timeLimit: number;
  background: string | null;
  /** 背景プレースホルダーのトーン。 */
  palette: "morning" | "lunch" | "after";
  locations: string[];
};

/** 周回ごとの難易度設定。 */
export type LoopConfig = {
  id: LoopId;
  schoolName: string;
  theme: string;
  difficultyLabel: string;
  /** 1.0 = 怪しい生徒が全員マーカー表示。下げるほど見えなくなる。 */
  suspicionVisibility: number;
  /** ダミー／フェイクの混入率（演出・図鑑表記用）。 */
  fakeRate: number;
  /** 観察モーダルで開示するヒント数。 */
  hintCount: number;
};

/** 1周分の集計。 */
export type RunStats = {
  score: number;
  maxCombo: number;
  correctReports: number;
  falseReports: number;
  friendCount: number;
  honmeiCount: number;
  specialCount: number;
  /** 机から見つけたチョコの数。 */
  deskFinds: number;
  /** 摘発率（0〜1）。 */
  annihilationRate: number;
};

/** ランク。 */
export type Rank = "S" | "A" | "B" | "C" | "D";

/** エンディング定義。 */
export type EndingDef = {
  id: string;
  title: string;
  rank: Rank | "special";
  lines: StoryLine[];
};

/** localStorage に保存する内容。 */
export type SaveData = {
  unlockedLoop: LoopId;
  bestScores: Partial<Record<`loop${LoopId}`, number>>;
  endings: string[];
  settings: {
    bgmVolume: number;
    seVolume: number;
  };
};
