/**
 * 画像素材の一元管理。
 *
 * `status` が "ready" 以外のものは、利用側で仮表示（SVG/CSS）へフォールバックする。
 * 実体パスは `assets/...`（`public/assets/...` の中身）。
 *
 * 素材の来歴：
 * - backgrounds / title / endings：生成AI一枚絵をそのまま使用（人物込みの完成CG）。
 * - characters：生成AI原稿（市松模様が焼き込まれたRGB画像）から、
 *   scripts/remove_checker_bg.py で実際のアルファチャンネルへ変換したもの。
 *   明暗どちらの背景でも輪郭のにじみがないことを目視確認済み（2026-09-14）。
 * - items：小物シートを6分割し、同スクリプトで透過したもの。
 */

export type AssetStatus = "ready" | "needs-alpha" | "needs-review" | "missing";
export type AssetKind = "background" | "title" | "ending" | "character" | "item";

export type GameAsset = {
  src: string;
  status: AssetStatus;
  kind: AssetKind;
};

/**
 * パスの先頭にスラッシュを付けないこと。
 *
 * GitHub Pages では `https://<user>.github.io/<リポジトリ名>/` というサブパスで配信される。
 * "/assets/..." と書くとドメイン直下を指してしまい、すべての画像が404になる。
 * このアプリはURLのパスを使わない（?stage= などのクエリのみ）ので、
 * 相対パスなら開発サーバーでも公開先でも同じように解決できる。
 */
export const ASSETS = {
  // ---------- 背景 ----------
  bgSchoolMorning: { src: "assets/backgrounds/school_morning.webp", status: "ready", kind: "background" },
  bgSchoolLunch: { src: "assets/backgrounds/school_lunch.webp", status: "ready", kind: "background" },
  bgSchoolAfter: { src: "assets/backgrounds/school_after.webp", status: "ready", kind: "background" },
  bgSchoolLoop2: { src: "assets/backgrounds/school_loop2.webp", status: "ready", kind: "background" },
  bgSchoolLoop3: { src: "assets/backgrounds/school_loop3.webp", status: "ready", kind: "background" },
  bgRooftop: { src: "assets/backgrounds/school_rooftop.webp", status: "ready", kind: "background" },
  // 2・3周目の時間帯差分（0914追加）。これで暖色フィルターの代用が不要になった。
  bgSchoolLoop2Lunch: { src: "assets/backgrounds/school_loop2_lunch.webp", status: "ready", kind: "background" },
  bgSchoolLoop2After: { src: "assets/backgrounds/school_loop2_after.webp", status: "ready", kind: "background" },
  bgSchoolLoop3Lunch: { src: "assets/backgrounds/school_loop3_lunch.webp", status: "ready", kind: "background" },
  bgSchoolLoop3After: { src: "assets/backgrounds/school_loop3_after.webp", status: "ready", kind: "background" },
  // 場所切り替え用（0914追加）。いずれも1周目の公立校。
  placeGate: { src: "assets/backgrounds/place_gate.webp", status: "ready", kind: "background" },
  placeCourtyard: { src: "assets/backgrounds/place_courtyard.webp", status: "ready", kind: "background" },
  placeStairs: { src: "assets/backgrounds/place_stairs.webp", status: "ready", kind: "background" },
  placeShop: { src: "assets/backgrounds/place_shop.webp", status: "ready", kind: "background" },
  // 1周目の追加（0914-b）
  placeClubrooms: { src: "assets/backgrounds/place_clubrooms.webp", status: "ready", kind: "background" },
  placeGateAfter: { src: "assets/backgrounds/place_gate_after.webp", status: "ready", kind: "background" },
  placeCourtyardAfter: { src: "assets/backgrounds/place_courtyard_after.webp", status: "ready", kind: "background" },
  // 2周目の場所（0914-b）。これで2周目も場所切り替えができる。
  loop2Gate: { src: "assets/backgrounds/loop2_gate.webp", status: "ready", kind: "background" },
  loop2Courtyard: { src: "assets/backgrounds/loop2_courtyard.webp", status: "ready", kind: "background" },
  loop2Classroom: { src: "assets/backgrounds/loop2_classroom.webp", status: "ready", kind: "background" },
  loop2Shop: { src: "assets/backgrounds/loop2_shop.webp", status: "ready", kind: "background" },
  loop2Stairs: { src: "assets/backgrounds/loop2_stairs.webp", status: "ready", kind: "background" },
  loop2GymBack: { src: "assets/backgrounds/loop2_gym_back.webp", status: "ready", kind: "background" },
  loop2Rooftop: { src: "assets/backgrounds/loop2_rooftop.webp", status: "ready", kind: "background" },
  // 3周目の場所（0914-b）
  loop3Gate: { src: "assets/backgrounds/loop3_gate.webp", status: "ready", kind: "background" },
  loop3Courtyard: { src: "assets/backgrounds/loop3_courtyard.webp", status: "ready", kind: "background" },
  loop3Classroom: { src: "assets/backgrounds/loop3_classroom.webp", status: "ready", kind: "background" },
  loop3Shop: { src: "assets/backgrounds/loop3_shop.webp", status: "ready", kind: "background" },
  loop3Stairs: { src: "assets/backgrounds/loop3_stairs.webp", status: "ready", kind: "background" },
  loop3GymBack: { src: "assets/backgrounds/loop3_gym_back.webp", status: "ready", kind: "background" },
  // 教室の背景（差し替え）。通路の左右に机が並び、手前の机が画面の角で切れる構図。
  classroomLoop1: { src: "assets/backgrounds/classroom_loop1.webp", status: "ready", kind: "background" },
  classroomLoop2: { src: "assets/backgrounds/classroom_loop2.webp", status: "ready", kind: "background" },
  classroomLoop3: { src: "assets/backgrounds/classroom_loop3.webp", status: "ready", kind: "background" },
  loop3Rooftop: { src: "assets/backgrounds/loop3_rooftop.webp", status: "ready", kind: "background" },

  // ---------- タイトル ----------
  titleBackground: { src: "assets/backgrounds/title_background.webp", status: "ready", kind: "title" },

  // ---------- エンディング ----------
  endingS: { src: "assets/endings/ending_s.webp", status: "ready", kind: "ending" },
  endingA: { src: "assets/endings/ending_a.webp", status: "ready", kind: "ending" },
  endingB: { src: "assets/endings/ending_b.webp", status: "ready", kind: "ending" },
  endingC: { src: "assets/endings/ending_c.webp", status: "ready", kind: "ending" },
  endingSpecial: { src: "assets/endings/ending_special.webp", status: "ready", kind: "ending" },
  // 学校別のエンディングCG。2・3周目も5種類ずつ揃っている。
  loop2EndingS: { src: "assets/endings/loop2_ending_s.webp", status: "ready", kind: "ending" },
  loop2EndingA: { src: "assets/endings/loop2_ending_a.webp", status: "ready", kind: "ending" },
  loop2EndingB: { src: "assets/endings/loop2_ending_b.webp", status: "ready", kind: "ending" },
  loop2EndingC: { src: "assets/endings/loop2_ending_c.webp", status: "ready", kind: "ending" },
  loop2EndingSpecial: { src: "assets/endings/loop2_ending_special.webp", status: "ready", kind: "ending" },
  loop3EndingS: { src: "assets/endings/loop3_ending_s.webp", status: "ready", kind: "ending" },
  loop3EndingA: { src: "assets/endings/loop3_ending_a.webp", status: "ready", kind: "ending" },
  loop3EndingB: { src: "assets/endings/loop3_ending_b.webp", status: "ready", kind: "ending" },
  loop3EndingC: { src: "assets/endings/loop3_ending_c.webp", status: "ready", kind: "ending" },
  loop3EndingSpecial: { src: "assets/endings/loop3_ending_special.webp", status: "ready", kind: "ending" },

  // ---------- 人物：全身（ステージ配置用。実体ぴったりにトリミング済み） ----------
  player: { src: "assets/characters/player.webp", status: "ready", kind: "character" },
  teacher: { src: "assets/characters/teacher.webp", status: "ready", kind: "character" },
  boy001: { src: "assets/characters/boy_001.webp", status: "ready", kind: "character" },
  girl001: { src: "assets/characters/girl_001.webp", status: "ready", kind: "character" },
  girl002: { src: "assets/characters/girl_002.webp", status: "ready", kind: "character" },
  girl003: { src: "assets/characters/girl_003.webp", status: "ready", kind: "character" },
  girl004: { src: "assets/characters/girl_004.webp", status: "ready", kind: "character" },
  girl005: { src: "assets/characters/girl_005.webp", status: "ready", kind: "character" },

  // ---------- 人物：バストアップ（ストーリー画面のノベルゲーム表示用） ----------
  bustPlayer: { src: "assets/characters/bust_player.webp", status: "ready", kind: "character" },
  loop2BustPlayer: { src: "assets/characters/loop2_bust_player.webp", status: "ready", kind: "character" },
  loop3BustPlayer: { src: "assets/characters/loop3_bust_player.webp", status: "ready", kind: "character" },
  bustTeacher: { src: "assets/characters/bust_teacher.webp", status: "ready", kind: "character" },
  bustBoy001: { src: "assets/characters/bust_boy_001.webp", status: "ready", kind: "character" },
  bustGirl001: { src: "assets/characters/bust_girl_001.webp", status: "ready", kind: "character" },
  bustGirl002: { src: "assets/characters/bust_girl_002.webp", status: "ready", kind: "character" },
  bustGirl003: { src: "assets/characters/bust_girl_003.webp", status: "ready", kind: "character" },
  bustGirl004: { src: "assets/characters/bust_girl_004.webp", status: "ready", kind: "character" },
  bustGirl005: { src: "assets/characters/bust_girl_005.webp", status: "ready", kind: "character" },

  // ---------- 人物：肩越しの主人公（ステージ手前の前景） ----------
  playerBack: { src: "assets/characters/player_back.webp", status: "ready", kind: "character" },
  loop2PlayerBack: { src: "assets/characters/loop2_player_back.webp", status: "ready", kind: "character" },
  loop3PlayerBack: { src: "assets/characters/loop3_player_back.webp", status: "ready", kind: "character" },

  // ---------- 主人公の顔アイコン（画面下のセリフ欄） ----------
  // 学校が変わっても使い回せるよう、制服がほとんど写らない顔のアップになっている。
  faceNormal: { src: "assets/ui/player_face_normal.webp", status: "ready", kind: "item" },
  faceFocus: { src: "assets/ui/player_face_focus.webp", status: "ready", kind: "item" },
  faceConfident: { src: "assets/ui/player_face_confident.webp", status: "ready", kind: "item" },
  faceHurry: { src: "assets/ui/player_face_hurry.webp", status: "ready", kind: "item" },

  // ---------- 人物：振り向き差分（選択中に切り替える） ----------
  girl001Turn: { src: "assets/characters/girl_001_turn.webp", status: "ready", kind: "character" },
  girl002Turn: { src: "assets/characters/girl_002_turn.webp", status: "ready", kind: "character" },
  girl003Turn: { src: "assets/characters/girl_003_turn.webp", status: "ready", kind: "character" },
  girl004Turn: { src: "assets/characters/girl_004_turn.webp", status: "ready", kind: "character" },
  girl005Turn: { src: "assets/characters/girl_005_turn.webp", status: "ready", kind: "character" },

  // ---------- 新規5人（1周目の紺制服。振り向き差分あり） ----------
  girl006: { src: "assets/characters/girl_006.webp", status: "ready", kind: "character" },
  girl006Turn: { src: "assets/characters/girl_006_turn.webp", status: "ready", kind: "character" },
  girl007: { src: "assets/characters/girl_007.webp", status: "ready", kind: "character" },
  girl007Turn: { src: "assets/characters/girl_007_turn.webp", status: "ready", kind: "character" },
  girl008: { src: "assets/characters/girl_008.webp", status: "ready", kind: "character" },
  girl008Turn: { src: "assets/characters/girl_008_turn.webp", status: "ready", kind: "character" },
  girl009: { src: "assets/characters/girl_009.webp", status: "ready", kind: "character" },
  girl009Turn: { src: "assets/characters/girl_009_turn.webp", status: "ready", kind: "character" },
  girl010: { src: "assets/characters/girl_010.webp", status: "ready", kind: "character" },
  girl010Turn: { src: "assets/characters/girl_010_turn.webp", status: "ready", kind: "character" },

  // ---------- 学校別の制服差分（振り向き差分は無い） ----------
  loop2Girl01: { src: "assets/characters/loop2_girl_01.webp", status: "ready", kind: "character" },
  loop2Girl02: { src: "assets/characters/loop2_girl_02.webp", status: "ready", kind: "character" },
  loop2Girl03: { src: "assets/characters/loop2_girl_03.webp", status: "ready", kind: "character" },
  loop2Girl04: { src: "assets/characters/loop2_girl_04.webp", status: "ready", kind: "character" },
  loop2Girl05: { src: "assets/characters/loop2_girl_05.webp", status: "ready", kind: "character" },
  loop3Girl01: { src: "assets/characters/loop3_girl_01.webp", status: "ready", kind: "character" },
  loop3Girl02: { src: "assets/characters/loop3_girl_02.webp", status: "ready", kind: "character" },
  loop3Girl03: { src: "assets/characters/loop3_girl_03.webp", status: "ready", kind: "character" },
  loop3Girl04: { src: "assets/characters/loop3_girl_04.webp", status: "ready", kind: "character" },
  loop3Girl05: { src: "assets/characters/loop3_girl_05.webp", status: "ready", kind: "character" },

  // ---------- モブ生徒（奥を歩く背景の人。タップ対象にしない） ----------
  mobBoy1: { src: "assets/characters/mob/mob_boy_1.webp", status: "ready", kind: "character" },
  mobBoy2: { src: "assets/characters/mob/mob_boy_2.webp", status: "ready", kind: "character" },
  mobBoy3: { src: "assets/characters/mob/mob_boy_3.webp", status: "ready", kind: "character" },
  mobGirl1: { src: "assets/characters/mob/mob_girl_1.webp", status: "ready", kind: "character" },
  mobGirl2: { src: "assets/characters/mob/mob_girl_2.webp", status: "ready", kind: "character" },
  mobGirl3: { src: "assets/characters/mob/mob_girl_3.webp", status: "ready", kind: "character" },
  // 立ち止まっている／座っている／談笑しているモブ（0915追加）。
  // 既存の6人は「鞄を持って歩き去る後ろ姿」しか無く、室内には置けなかった。
  mobSit1: { src: "assets/characters/mob/mob_sit_1.webp", status: "ready", kind: "character" },
  mobSit2: { src: "assets/characters/mob/mob_sit_2.webp", status: "ready", kind: "character" },
  mobSit3: { src: "assets/characters/mob/mob_sit_3.webp", status: "ready", kind: "character" },
  mobBlackboard: { src: "assets/characters/mob/mob_blackboard.webp", status: "ready", kind: "character" },
  mobTalkA1: { src: "assets/characters/mob/mob_talk_a1.webp", status: "ready", kind: "character" },
  mobTalkA2: { src: "assets/characters/mob/mob_talk_a2.webp", status: "ready", kind: "character" },
  mobTalkB1: { src: "assets/characters/mob/mob_talk_b1.webp", status: "ready", kind: "character" },
  mobTalkB2: { src: "assets/characters/mob/mob_talk_b2.webp", status: "ready", kind: "character" },
  mobStand1: { src: "assets/characters/mob/mob_stand_1.webp", status: "ready", kind: "character" },
  mobStand2: { src: "assets/characters/mob/mob_stand_2.webp", status: "ready", kind: "character" },

  // ---------- 校内掲示物（壁に重ねる） ----------
  signNoSweets: { src: "assets/signage/sign_no_sweets.webp", status: "ready", kind: "item" },
  // 校舎に掛かる横断幕。たるみとロープ付きで、学校ごとに布と書体が違う。
  bannerLoop1: { src: "assets/signage/banner_loop1.webp", status: "ready", kind: "item" },
  bannerLoop2: { src: "assets/signage/banner_loop2.webp", status: "ready", kind: "item" },
  bannerLoop3: { src: "assets/signage/banner_loop3.webp", status: "ready", kind: "item" },
  signClassroomPlate: { src: "assets/signage/sign_classroom_plate.webp", status: "ready", kind: "item" },

  // ---------- UIアイコン ----------
  iconMegaphone: { src: "assets/ui/icon_megaphone.webp", status: "ready", kind: "item" },
  iconBinoculars: { src: "assets/ui/icon_binoculars.webp", status: "ready", kind: "item" },
  iconHandbook: { src: "assets/ui/icon_handbook.webp", status: "ready", kind: "item" },
  iconClipboard: { src: "assets/ui/icon_clipboard.webp", status: "ready", kind: "item" },
  navHome: { src: "assets/ui/nav_home.webp", status: "ready", kind: "item" },
  navStory: { src: "assets/ui/nav_story.webp", status: "ready", kind: "item" },
  navEncyclopedia: { src: "assets/ui/nav_encyclopedia.webp", status: "ready", kind: "item" },
  navMission: { src: "assets/ui/nav_mission.webp", status: "ready", kind: "item" },
  navShop: { src: "assets/ui/nav_shop.webp", status: "ready", kind: "item" },

  // ---------- 小物（通報結果演出） ----------
  itemChocolateFriend: { src: "assets/items/chocolate_friend.webp", status: "ready", kind: "item" },
  itemChocolateHonmei: { src: "assets/items/chocolate_honmei.webp", status: "ready", kind: "item" },
  itemChocolateSpecial: { src: "assets/items/chocolate_special.webp", status: "ready", kind: "item" },
  itemBagPink: { src: "assets/items/bag_pink.webp", status: "ready", kind: "item" },
  itemLunchbox: { src: "assets/items/lunchbox.webp", status: "ready", kind: "item" },
  itemHandbook: { src: "assets/items/student_handbook.webp", status: "ready", kind: "item" },
  // 机チェック用（0914-b）
  deskSingle: { src: "assets/items/desk_single.webp", status: "ready", kind: "item" },
  deskInsideEmpty: { src: "assets/items/desk_inside_empty.webp", status: "ready", kind: "item" },
  iconSearch: { src: "assets/ui/icon_search.webp", status: "ready", kind: "item" },
  // 双眼鏡アイテム用（双眼鏡素材）
  binocularViewFrame: { src: "assets/ui/binocular_view_frame.webp", status: "ready", kind: "item" },
  itemButtonFrame: { src: "assets/ui/item_button_frame.webp", status: "ready", kind: "item" },
  iconBinocularsEmpty: { src: "assets/ui/icon_binoculars_empty.webp", status: "ready", kind: "item" },
} as const satisfies Record<string, GameAsset>;

export type AssetId = keyof typeof ASSETS;

/** status !== 'ready' の場合は呼び出し側で仮表示に切り替えること。 */
export function assetSrc(id: AssetId): string | null {
  const a = ASSETS[id];
  return a.status === "ready" ? a.src : null;
}
