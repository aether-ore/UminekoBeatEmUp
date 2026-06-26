const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const healthBar = document.getElementById("healthBar");
const resolveBar = document.getElementById("resolveBar");
const resolveMeter = resolveBar.parentElement;
const waveLabel = document.getElementById("waveLabel");
const scoreLabel = document.getElementById("scoreLabel");
const parryTip = document.getElementById("parryTip");
const runDetailsPanel = document.getElementById("runDetailsPanel");
const runDetailsList = document.getElementById("runDetailsList");
const runDetailsClose = document.getElementById("runDetailsClose");

const W = canvas.width;
const H = canvas.height;
const FLOOR_Y = 562;
const PLAY_AREA_TOP = FLOOR_Y - 94;
const PLAY_AREA_BOTTOM = H - 46;
const STAGE_W = 3600;
const PLAYER_SCALE = 1.45;
const SPECIAL_BEAM_DRAIN = 42;
const SPECIAL_BEAM_DAMAGE = 38;
const CHARGED_ATTACK_HOLD_TIME = 0.34;
const CHARGED_ATTACK_RESOLVE_COST = 25;
const SUPER_CHARGE_DAMAGE_MULTIPLIER = 1.25;
const SUPER_CHARGE_SHOCKWAVE_RADIUS = 220;
const SUPER_CHARGE_SHOCKWAVE_LIFT = 430;
const SUPER_CHARGE_SHOCKWAVE_DRIFT = 150;
const RESOLVE_GAIN_MULTIPLIER = 0.5;
const DUO_CHARGE_TIME = 1.35;
const DUO_STAGE_DURATION = 0.78;
const DUO_SPIRAL_DURATION = 3.2;
const DUO_HOLD_DURATION = 0.45;
const DUO_LAMBDA_VANISH_DURATION = 0.9;
const DUO_BERN_EXIT_DELAY = 0.35;
const DUO_BERN_VANISH_DURATION = 1.15;
const DUO_DURATION = DUO_STAGE_DURATION + DUO_SPIRAL_DURATION + DUO_HOLD_DURATION + DUO_LAMBDA_VANISH_DURATION + DUO_BERN_EXIT_DELAY + DUO_BERN_VANISH_DURATION;
const DUO_DAMAGE = 240;
const DUO_LAUNCH_LIFT = 650;
const DUO_LAUNCH_DRIFT = 340;
const DUO_ABSORB_DURATION = 0.9;
const LAMBDA_DUO_SPLASH_DURATION = 0.95;
const ENEMY_DEFEAT_FADE_DURATION = 1.25;
const ENEMY_SUMMON_GRACE = 1;
const MESSAGE_BOTTLE_FLIGHT_TIME = 1.15;
const MESSAGE_BOTTLE_THROW_DELAY = 0.48;
const ENEMY_HEALTH_FIVE_WAVE_BONUS = 8;
const BOSS_WAVE_INTERVAL = 10;
const GLOBAL_ENEMY_DROP_RATE = 0.28;
const LOCAL_SCOREBOARD_KEY = "uminekoBeatEmUpHighScoresV1";
const LOCAL_SCOREBOARD_LIMIT = 10;
const ITEM_DROP_RATES = {
  crystalShard: 1,
  konpeito: 0.7,
  plumTea: 0.55,
  oneWingedEagle: 0.45
};
const ITEM_TUTORIALS = {
  crystalShard: {
    title: "Crystal Shard",
    label: "SHARD",
    tip: "Stacks up to 5 times. Each shard has its own cooldown and calls down a falling crystal on an enemy."
  },
  konpeito: {
    title: "Konpeito",
    label: "KONPEITO",
    tip: "Summons Lambdadelta. She lobs candy bursts that launch enemies, but Battler can be caught too."
  },
  plumTea: {
    title: "Plum Tea",
    label: "PLUM TEA",
    tip: "Summons Bernkastel. She fires crystal barrages and can revive Battler once before the tea goes cold."
  },
  oneWingedEagle: {
    title: "One-Winged Eagle Crest",
    label: "CREST",
    tip: "Mirrors Battler's attacks from behind him, dealing half damage and copying launch effects. Pick up more Crests to extend its range up to level 5."
  }
};

function clampPlayY(y) {
  return clamp(y, PLAY_AREA_TOP, PLAY_AREA_BOTTOM);
}

function clampBackgroundCompanionY(y) {
  return clamp(y, PLAY_AREA_TOP - 22, PLAY_AREA_BOTTOM - 62);
}
const LAMBDA_BLESSINGS = [
  {
    id: "launchExtension",
    source: "Lambdadelta",
    title: "Blessing of Certainty: +1 Launch Extension",
    text: "Once per combo target, Battler may launch or ground bounce one extra time before that attack becomes a prorated juggle."
  },
  {
    id: "superCharge",
    source: "Lambdadelta",
    title: "Blessing of Certainty: Super Charge",
    text: "Charged attacks teleport Battler to the nearest enemy, deal more damage, and release a candy shockwave."
  },
  {
    id: "lambdaKonpeitoSpecial",
    source: "Lambdadelta",
    title: "Blessing of Certainty: Candy Cataclysm",
    text: "Special summons a hovering konpeito that pulses three times before bursting into candy shrapnel."
  },
  {
    id: "paperArmor",
    source: "Lambdadelta",
    title: "Blessing of Certainty: +1 Super Paper Armor",
    text: "While attacking, Battler gains poise that can ignore non-launch interruptions up to 25% of his health."
  }
];
const BERN_BLESSINGS = [];
BERN_BLESSINGS.push(
  {
    id: "miracleRevival",
    source: "Bernkastel",
    title: "Blessing of Miracles: +1 Revival",
    text: "Once per blessing, defeat is rewritten without making the Plum Tea go cold."
  },
  {
    id: "miracleShardFollowup",
    source: "Bernkastel",
    title: "Blessing of Miracles: Crystal Follow-Up",
    text: "Stage 3 attacks call down a delayed crystal shard follow-up."
  },
  {
    id: "miracleCrystalShardPlus",
    source: "Bernkastel",
    title: "Blessing of Miracles: Crystal Shard+",
    text: "Crystal shards erupt upward after impact, catching enemies in a second strike."
  },
  {
    id: "miracleRisk",
    source: "Bernkastel",
    title: "Blessing of Miracles: Cruel Equation",
    text: "Battler deals 50% more damage, but also takes 50% more damage."
  }
);
const EAGLE_CREST_DAMAGE_MULTIPLIER = 0.5;
const EAGLE_CREST_PICKUP_SIZE = 58;
const EAGLE_CREST_ECHO_WIDTH = 285;
const EAGLE_CREST_ECHO_HEIGHT = 218;
const EAGLE_CREST_HIT_WIDTH = 266;
const EAGLE_CREST_HIT_HEIGHT = 150;
const EAGLE_CREST_BACK_OFFSET_X = 214;
const EAGLE_CREST_BACK_OFFSET_Y = 205;
const EAGLE_CREST_MAX_LEVEL = 5;
const EAGLE_CREST_MIN_RANGE_SCALE = 0.46;
const CRYSTAL_SHARD_INTERVAL = 5;
const CRYSTAL_SHARD_MAX_STACKS = 5;
const CRYSTAL_SHARD_FALL_SPEED = 1180;
const CRYSTAL_SHARD_DAMAGE = 34;
const CRYSTAL_SHARD_RADIUS = 86;
const BERN_CRYSTAL_SHOCKWAVE_DAMAGE = 14;
const MIRACLE_CRYSTAL_FOLLOWUP_DELAY = 0.3;
const CRYSTAL_SHARD_PLUS_DELAY = 0.3;
const CRYSTAL_SHARD_PLUS_LIFE = 0.58;
const CRYSTAL_SHARD_PLUS_DAMAGE = 18;
const CRYSTAL_SHARD_PLUS_RADIUS = 96;
const CRYSTAL_SHARD_PLUS_LIFT = 330;
const CRYSTAL_SHARD_PLUS_DRIFT = 78;
const CRYSTAL_SHARD_PLUS_EXIT_MARGIN = 170;
const GOAT_POUND_DAMAGE = 32;
const GOAT_POUND_DETECTION_RANGE = 210;
const GOAT_POUND_RANGE = 203;
const GOAT_POUND_NEAR_WIDTH = 58;
const GOAT_POUND_FAR_WIDTH = 118;
const GOAT_POUND_SEMICIRCLE_Y_SCALE = 0.46;
const GOAT_POUND_DEPTH = 92;
const GOAT_POUND_SHOCKWAVE_RADIUS = 58;
const GOAT_POUND_LIFT = 500;
const GOAT_POUND_DRIFT = 210;
const GOAT_POUND_PARRY_RING_RADIUS = 92;
const GOAT_POUND_PARRY_WINDOW = 18;
const GOAT_POUND_PARRY_START_RADIUS = 146;
const GOAT_POUND_PARRY_FAIL_FADE = 0.42;
const GOAT_HIT_STUN_DURATION = 0.72;
const GOAT_DEFEAT_FADE_DURATION = 0.58;
const GOAT_CHARGE_NO_DETECT_TIME = 10;
const GOAT_CHARGE_DISTANCE = 430;
const GOAT_CHARGE_SPEED = 760;
const GOAT_CHARGE_DAMAGE = 24;
const GOAT_CHARGE_LIFT = 380;
const GOAT_CHARGE_DRIFT = 260;
const GOAT_CHARGE_WIDTH = 92;
const GOAT_CHARGE_MAX_LANE_ANGLE = Math.PI / 6;
const STAGE3_KICK_STARTUP_TIME = 0.34;
const STAGE3_KICK_ACTIVE_END = 0.52;
const STAGE3_KICK_GRAVITY = 1320;
const STAGE3_KICK_START_VZ = 455;
const STAGE3_KICK_START_SPEED = 86;
const STAGE3_KICK_FALL_SPEED = 315;
const STAGE3_KICK_LANE_SPEED = 42;
const STAGE3_KICK_BOUNCE_FALL_HEIGHT = 118;
const STAGE3_KICK_BOUNCE_FALL_SPEED = 620;
const STAGE3_KICK_BOUNCE_DELAY = 0.32;
const STAGE3_KICK_BOUNCE_LIFT = 315;
const STAGE3_KICK_BOUNCE_DRIFT = 150;
const KONPEITO_COOLDOWN = 10;
const KONPEITO_DAMAGE = 30;
const KONPEITO_RADIUS = 118;
const KONPEITO_SHOCKWAVE_MAX_RADIUS = 230;
const KONPEITO_DOME_BURST_DURATION = 0.82;
const LAMBDA_SPECIAL_KONPEITO_PULSE_DAMAGE = 18;
const LAMBDA_SPECIAL_KONPEITO_PULSE_RADIUS = 154;
const LAMBDA_SPECIAL_KONPEITO_PULSE_INTERVAL = 0.42;
const LAMBDA_SPECIAL_KONPEITO_PULSE_COUNT = 3;
const LAMBDA_SPECIAL_KONPEITO_CAST_LAUNCH_LIFT = 420;
const LAMBDA_SPECIAL_KONPEITO_CAST_LAUNCH_DRIFT = 126;
const LAMBDA_SPECIAL_KONPEITO_PULSE_LAUNCH_LIFT = 355;
const LAMBDA_SPECIAL_KONPEITO_PULSE_LAUNCH_DRIFT = 88;
const LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_RADIUS = 174;
const LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_LIFT = 300;
const LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_DRIFT = 128;
const LAMBDA_SPECIAL_KONPEITO_SUCTION_RADIUS = 245;
const LAMBDA_SPECIAL_KONPEITO_SUCTION_STRENGTH = 520;
const LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_COUNT = 16;
const LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_DAMAGE = 8;
const LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_RADIUS = 46;
const LAMBDA_SPECIAL_KONPEITO_DURATION = 1.62;
const LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS = 52;
const LAMBDA_SPECIAL_KONPEITO_LAUNCH_SPEED = 760;
const LAMBDA_SPECIAL_KONPEITO_LAUNCH_LANE_SPEED = 150;
const LAMBDA_SPECIAL_KONPEITO_LAUNCH_UP_SPEED = -250;
const LAMBDA_SPECIAL_KONPEITO_LAUNCH_GRAVITY = 620;
const LAMBDA_SPECIAL_KONPEITO_LAUNCH_LIFE = 1.55;
const LAMBDA_KONPEITO_INTERVAL = 8;
const KONPEITO_SHEET_CELL = 146;
const KONPEITO_SHEET_COLS = 7;
const KONPEITO_FRAME_INDICES = [
  0, 1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25
];
const KONPEITO_FRAME_COUNT = KONPEITO_FRAME_INDICES.length;
const LAMBDA_SUMMON_LAUNCH_RADIUS = 150;
const LAMBDA_SUMMON_FLASH_DURATION = 0.16;
const LAMBDA_MOVE_ANIM_RATE = 9;
const EXPERIMENTAL_LAMBDA_KONPEITO_RETALIATION = true;
const LAMBDA_KONPEITO_RETALIATION_RADIUS = KONPEITO_RADIUS;
const LAMBDA_RETALIATION_RED_DURATION = 2.2;
const LAMBDA_RETALIATION_LAUGH_START_DELAY = 0.12;
const LAMBDA_RETALIATION_LAUGH_INITIAL_DELAY = 0.28;
const LAMBDA_RETALIATION_LAUGH_MIN_DELAY = 0.012;
const BEATRICE_STAKE_INTERVAL = 5;
const BEATRICE_STAKE_BOUNCES = 6;
const BEATRICE_STAKE_RICOCHET_SPEED = 860;
const BEATRICE_STAKE_FAST_RICOCHET_SPEED = 2850;
const BEATRICE_STAKE_PENULTIMATE_RICOCHET_SPEED = 1120;
const BEATRICE_STAKE_LAUNCH_SPEED = 880;
const BEATRICE_STAKE_RETURN_SPEED = 2850;
const BEATRICE_STAKE_RETURN_FREEZE = 0.58;
const BEATRICE_STAKE_RETURN_LINE_TIME = 0.58;
const BEATRICE_STAKE_RADIUS = 15;
const BEATRICE_STAKE_RETICLE_RADIUS = 78;
const BEATRICE_STAKE_PARRY_RADIUS = 72;
const BEATRICE_STAKE_PARRY_WINDOW = 0.42;
const BEATRICE_STAKE_PARRY_RING_RADIUS = 31;
const BEATRICE_STAKE_PARRY_START_RADIUS = 96;
const BEATRICE_STAKE_PARRY_DISTANCE = 110;
const BEATRICE_STAKE_TRAIL_TIME = 0.22;
const BEATRICE_STAKE_SHOCKWAVE_TIME = 0.48;
const BEATRICE_GOAT_TRIAL_WALL_PADDING = 46;
const BEATRICE_RING_ATTACK_DELAY = 1.15;
const BEATRICE_RING_ATTACK_DAMAGE = 18;
const BEATRICE_RING_ATTACK_LIFT = 430;
const BEATRICE_RING_ATTACK_DRIFT = 150;
const BEATRICE_RING_ATTACK_RADIUS = 186;
const LEVIATHAN_SLASH_ACTIVE_FRAME = 519;
const LEVIATHAN_SLASH_ANIM_SPEED = 13;
const SATAN_AERIAL_ACTIVE_FRAME = 489;
const SATAN_AERIAL_ANIM_SPEED = 15;
const SATAN_AERIAL_LIFT = 820;
const SATAN_AERIAL_DRIFT = 88;
const SATAN_AERIAL_HOVER = 250;
const BELPHEGOR_SLAM_ACTIVE_FRAME = 479;
const BELPHEGOR_SLAM_ANIM_SPEED = 15;
const BELPHEGOR_SLAM_HOVER = 410;
const BELPHEGOR_SLAM_DOWN_SPEED = 820;
const BELPHEGOR_SLAM_DRIFT = 150;
const BELPHEGOR_SIDE_OFFSET = 112;
const BELPHEGOR_SPAWN_DELAY = 0.3;
const BEATRICE_NEXT_MECHANIC_DELAY = 0.85;
const BEATRICE_GOAT_RUSH_TELEGRAPH_TIME = 1.35;
const BEATRICE_GOAT_RUSH_WAVES = 3;
const BEATRICE_GOAT_RUSH_WAVE_GAP = 0.72;
const BEATRICE_GOAT_RUSH_STAGGER = 0.26;
const BEATRICE_GOAT_RUSH_LANES = 4;
const BEATRICE_GOAT_RUSH_DANGER_LANES = 2;
const BEATRICE_GOAT_RUSH_SPEED_MULTIPLIER = 1.45;
const BEATRICE_TOWER_VOLLEY_EMERGE_TIME = 0.62;
const BEATRICE_TOWER_VOLLEY_TELEGRAPH_TIME = 1.18;
const BEATRICE_TOWER_VOLLEY_SWEEP_TIME = 2.35;
const BEATRICE_TOWER_VOLLEY_WAVE_GAP = 0.58;
const BEATRICE_TOWER_VOLLEY_RETREAT_TIME = 0.72;
const BEATRICE_TOWER_VOLLEY_RADIUS = 58;
const BEATRICE_TOWER_VOLLEY_SPACING = 29;
const BEATRICE_TOWER_VOLLEY_SCREEN_SCATTER = 18;
const BEATRICE_TOWER_VOLLEY_LANE_SCATTER = 38;
const BEATRICE_TOWER_VOLLEY_OUTSIDE_BIAS = 0.74;
const BEATRICE_TOWER_VOLLEY_TIMING_SCATTER = 0.2;
const BEATRICE_TOWER_VOLLEY_MISSILE_TIME = 0.28;
const BEATRICE_TOWER_VOLLEY_TRAIL_POINTS = 10;
const BEATRICE_TOWER_VOLLEY_SAFE_CLEAR_X = 170;
const BEATRICE_TOWER_VOLLEY_SAFE_CLEAR_Y = 86;
const BEATRICE_TOWER_VOLLEY_DAMAGE = 18;
const BEATRICE_TOWER_VOLLEY_LIFT = 470;
const BEATRICE_TOWER_VOLLEY_DRIFT = 155;
const BEATRICE_TOWER_VOLLEY_TOWER_SCALE = 1.08;
const BEATRICE_TOWER_VOLLEY_EDGE_OVERHANG = 22;
const BEATRICE_TOWER_VOLLEY_TOWER_SEPARATION = 176;
const BEATRICE_MECHANIC_CHOICES = ["goatTrial", "ringAttack", "teleportAttack", "goatRush", "towerVolley"];
const DEBUG_START_BEATRICE_BOSS_WAVE = false;
const DEBUG_BEATRICE_TELEPORT_PREP_TEST = false;
const BEATRICE_TELEPORT_PREP_JUMPS = 7;
const BEATRICE_TELEPORT_PREP_JUMP_TIME = 0.14;
const BEATRICE_TELEPORT_PREP_AFTERIMAGE_TIME = 0.58;
const BEATRICE_MELEE_KICK_DAMAGE = 22;
const BEATRICE_MELEE_KICK_RANGE = 154;
const BEATRICE_MELEE_KICK_DEPTH = 76;
const BEATRICE_MELEE_KICK_LIFT = 420;
const BEATRICE_MELEE_KICK_DRIFT = 190;
const BEATRICE_MELEE_KICK_PARRY_RING_RADIUS = 66;
const BEATRICE_MELEE_KICK_PARRY_START_RADIUS = 132;
const BEATRICE_MELEE_KICK_PARRY_WINDOW = 16;
const BEATRICE_MELEE_KICK_PARRY_FAIL_FADE = 0.46;
const BEATRICE_MELEE_KICK_TELEGRAPH_WIDTH = 190;
const BEATRICE_MELEE_KICK_TELEGRAPH_DEPTH = 92;
const BEATRICE_MELEE_KICK_WALL_SLAM_TIME = 0.34;
const BEATRICE_MELEE_PARRY_BEATRICE_RECOIL_SPEED = 1320;
const BEATRICE_MELEE_PARRY_BATTLER_RECOIL_SPEED = 760;
const BEATRICE_MELEE_PARRY_RECOIL_DRAG = 4.2;
const BEATRICE_ASMO_DROP_KICK_DAMAGE = 18;
const BEATRICE_ASMO_DROP_KICK_APPEAR_TIME = 0.18;
const BEATRICE_ASMO_DROP_KICK_ACTIVE_FRAME = 370;
const BEELZEBUB_DROP_SLASH_ACTIVE_FRAME = 509;
const BEELZEBUB_DROP_SLASH_HOVER = 360;
const BEELZEBUB_DROP_SLASH_ANIM_SPEED = 20;
const BEATRICE_ASMO_UPPERCUT_LIFT = 650;
const BEATRICE_ASMO_UPPERCUT_DRIFT = 210;
const BEATRICE_ASMO_DROP_KICK_HOVER = 220;
const BEATRICE_ASMO_DROP_KICK_SIDE_OFFSET = 92;
const BEATRICE_ASMO_DROP_KICK_DOWN_SPEED = 760;
const BEATRICE_ASMO_DROP_KICK_DRIFT = 340;
const BEATRICE_ASMO_DROP_KICK_CATCH_OFFSET = 54;
const BEATRICE_ASMO_DROP_KICK_BOUNCE_DELAY = 0.16;
const BEATRICE_ASMO_DROP_KICK_BOUNCE_LIFT = 310;
const BEATRICE_ASMO_DROP_KICK_BOUNCE_DRIFT = 115;
const BEATRICE_BOSS_HP_MULTIPLIER = 3;
const BEATRICE_BARRIER_MAX = 100;
const BEATRICE_MELEE_PARRY_BARRIER_DAMAGE = 50;
const BEATRICE_BARRIER_BREAK_DRIFT = 260;
const BEATRICE_BARRIER_BREAK_FADE_START = 0.18;
const BEATRICE_BARRIER_BREAK_FADE_END = 0.82;
const BEATRICE_DIZZY_HURT_DAMAGE_PUSH = 16;
const BEATRICE_STUN_IDLE_TIMEOUT = 5;
const BEATRICE_STUN_DAMAGE_TIMEOUT = 10;
const BEATRICE_STUN_FULL_DAMAGE_FRACTION = 0.25;
const BEATRICE_STUN_OVER_CAP_DAMAGE_MULTIPLIER = 0.15;
const BEATRICE_LAUNCH_LIFT = 470;
const BEATRICE_LAUNCH_DRIFT = 150;
const BEATRICE_LAUNCH_GRAVITY = 980;
const BEATRICE_DOWNED_DURATION = 0.95;
const BEATRICE_STUN_RECOVERY_TIME = 0.58;
const BEATRICE_SPRITE_SCALE = 1.2;
const BEATRICE_BOSS_HEALTH_GROWTH = 0.25;
const BEATRICE_DEFEAT_DISSIPATE_TIME = 1.35;
const BEATRICE_DEFEAT_MOVE_TIME = 0.82;
const BEATRICE_DEFEAT_FINAL_SPEED = 8.2;
const BEATRICE_DEFEAT_WISP_COUNT = 64;
const BEATRICE_TUTORIAL_TRIGGER_RANGE = 360;
const BEATRICE_TUTORIAL_TRIGGER_DEPTH = 128;
const BEATRICE_TUTORIAL_SKIP_DELAY = 0.5;
const BEATRICE_STAKE_TUTORIAL_PARRY_LOCKOUT = 1;
const BEATRICE_TUTORIAL_DIALOGUE = [
  { speaker: "Battler", portrait: "BattlerPointAngry", text: "Get back here and let me hit you, Beatrice!" },
  { speaker: "Beatrice", portrait: "BeatoPipeSmug", text: "Why would I let you do that?" },
  { speaker: "Beatrice", portrait: "BeatoPipeMocking", text: "Don't tell me you can't even muster the strength to have a bit of back of forth with me like old times?" },
  { speaker: "Battler", portrait: "BattlerPensive", text: "Like old times? Then...", thought: true },
  { speaker: "Battler", portrait: "BattlerMuster", text: "So what you're saying..." },
  { speaker: "Battler", portrait: "BattlerHappy", text: "Is that if I grab those busty onee-chans and stab them right back into you... you'll come crawling back to me for a beating?" },
  { speaker: "Beatrice", portrait: "BeatriceChallenge", text: "Kuhiyahahahyiahaha! Says the troglodyte who comes rushing in at a witch with a glowing golden health bar!" },
  { speaker: "Beatrice", portrait: "BeatriceDarkChallenge", text: "I welcome you to try, you incompetent button masher. If you do, I promise I'll welcome every inch! Kuhiayahahahaiyahaiyaihayhahaha!" },
  { speaker: "Battler", portrait: "BattlerPensive", thought: true, parryHint: true }
];
const BEATRICE_STAKE_TUTORIAL_SKIP_DELAY = 0.5;
const BEATRICE_STAKE_TUTORIAL_DIALOGUE = {
  hint: {
    speaker: "Battler",
    portrait: "BattlerPointAngry",
    stakeHint: true
  },
  parryNow: {
    speaker: "Battler",
    portrait: "BattlerPointAngry",
    text: "Parry now!",
    parryNow: true
  }
};
const LAMBDA_GAME_OVER_DIALOGUE = [
  { portrait: "SurprisedLambda1", text: "What? You died even with me around?", duration: 3.2 },
  { portrait: "FrustratedLambda1", text: "You're supposed to be invincible with my help!", duration: 3.2 },
  { portrait: "SmugLambda1", text: "Oh well, at least you have infinite lives.", duration: 3.2 },
  { portrait: "SmugLambda2", text: "So don't give up, okay?", duration: 10 },
  { portrait: "DarkLambda1", text: "Keep playing forever!", duration: 5 },
  { portrait: "GrinningLambda1", text: "Press Enter to continue!", duration: 10, locked: true },
  { portrait: "ImpatientLambda1", text: "Hello? Press Enter to continue!", duration: 10, locked: true },
  { portrait: "FrustratedLambda2", text: "PRESS ENTER TO CONTINUE!", duration: Infinity, locked: true }
];
const BERN_CRYSTAL_INTERVAL = 10;
const BERN_TELEPORT_FRAME_SPEED = 12;
const BERN_CRYSTAL_CHARGE_TIME = 0.5;
const BERN_CRYSTAL_ORBIT_OFFSET = 184;
const BERN_BARRAGE_ARC_HEIGHT = 370;
const BERN_BARRAGE_ARC_LIFT = 58;
const BERN_REVIVE_HAZARD_ENABLED = true;
const BERN_REVIVE_HAZARD_INTERVAL = 30;
const BERN_REVIVE_HAZARD_TEST_MODE = false;
const BERN_REVIVE_HAZARD_TEST_INTERVAL = 10;
const BERN_REVIVE_HAZARD_SHARD_DAMAGE = 16;
const BERN_HAZARD_AMUSE_BASE_CHANCE = 0.01;
const BERN_HAZARD_AMUSE_KILL_BONUS = 0.01;
const BERN_HAZARD_PARRY_ENABLED = true;
const BERN_HAZARD_PARRY_RING_RADIUS = 62;
const BERN_HAZARD_PARRY_WINDOW = 13;
const BERN_HAZARD_PARRY_CYCLE = 1.15;
const BERN_HAZARD_PARRY_LAUNCH_DURATION = 1.18;
const BERN_HAZARD_PARRY_SUCCESS_RESPAWN = 10;
const BERN_HAZARD_PARRY_FAIL_RESPAWN = 20;
const BERN_HAZARD_PARRY_FAIL_FADE = 0.46;
const BERN_CAT_FORM_ENABLED = false;
const BERN_CAT_FORM_CHANCE = 0.18;
const DEBUG_FORCE_BERN_CAT_FORM = false;
const DEBUG_START_WITH_PLUM_TEA = false;
const DEBUG_START_WITH_KONPEITO = false;
const DEBUG_START_WITH_CANDY_CATACLYSM = false;
const DEBUG_START_WITH_CRYSTAL_FOLLOWUP = false;
const DEBUG_START_WITH_CRYSTAL_SHARD_PLUS = false;
const BERN_CAT_FADE_TIME = 0.34;
const BERN_CAT_SHEET_CELL = 209;
const BERN_CAT_SHEET_COLS = 6;
const BERN_CAT_WALK_FRAMES = Array.from({ length: 24 }, (_, i) => i).filter((i) => i !== 23);
const DASH_START_INVULN = 0.5;
const DASH_COOLDOWN = 1.5;
const DASH_START_DURATION = 0.24;
const DASH_RUN_ACCEL_TIME = 0.78;
const DASH_TAP_DODGE_BRAKE_DURATION = 0.32;
const DASH_TAP_DODGE_DRIFT = 122;
const DASH_TAP_DODGE_DRIFT_SPEED = 520;
const EXPERIMENTAL_JUGGLE_LAMBDA_KONPEITO = true;
const DEBUG_JUGGLED_KONPEITO_TARGETS_LAMBDA = false;
const LAMBDA_KONPEITO_JUGGLE_DURATION = 0.56;
const LAMBDA_KONPEITO_JUGGLE_ARC = 210;
const LAMBDA_KONPEITO_JUGGLE_PUSH = 260;
const keys = new Set();
const mouse = {
  x: W / 2,
  y: FLOOR_Y,
  worldX: 240,
  laneY: FLOOR_Y,
  inside: false
};
const runDetailsButton = { x: 0, y: 0, w: 0, h: 0, visible: false };
let resolveSpendFlashTimer = 0;
let latestRunRecord = null;
let latestRunRankInfo = null;
const itemTutorial = {
  active: false,
  type: "",
  previousState: "playing",
  dismissDelay: 0
};
const attackHolds = {
  punch: { key: "j", down: false, timer: 0, triggered: false },
  kick: { key: "k", down: false, timer: 0, triggered: false }
};

const frames = {
  idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  walk: [51, 52, 53, 54, 55, 56, 57, 58],
  runStart: [93, 94, 95],
  run: [97, 96, 98, 99, 100, 101, 102, 103, 104, 105],
  runBrake: [106, 107, 108, 109, 110],
  punch: [217, 218, 219, 220, 221, 222, 223, 224],
  punch1: [193, 194, 195],
  punch2: [217, 218, 219, 220, 221, 222, 223, 224],
  punch3: [336, 337, 338, 339, 340, 342, 341, 343, 344],
  dashPunch: [347, 348, 349],
  kick: [210, 211, 212, 213, 214, 215, 216],
  kick1: [199, 200, 201, 202, 203, 204],
  kick2: [210, 211, 212, 213, 214, 215, 216],
  kick3: [91, 294, 295, 296, 296, 297],
  special: [326, 327, 328, 329, 330, 331, 332],
  specialBeam: [333, 334, 335],
  stakeParryPose: [333, 334, 335],
  beatriceMeleeParry: [409, 410, 411, 412, 413],
  duoCharge: [326, 327, 328, 329, 330, 331, 332],
  duoBeamPose: [333, 334, 335],
  hurt: [118, 119, 120, 121, 122, 123],
  down: [152, 153, 154, 155, 156, 157, 158],
  win: [500, 520, 540]
};
const lambdaFrames = {
  summon: [689, 690, 692, 691, 693, 695, 694, 697, 696, 688],
  idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  moveWindup: [56],
  moveIntro: [57, 58],
  move: [59, 60, 61, 62, 63, 64, 65],
  moveBack: [66, 67, 68, 69, 70, 71, 72, 73],
  konpeitoKnockdown: [154, 155, 156, 157, 158, 159, 160],
  konpeitoCast: [
    425, 426, 427, 428, 429, 430, 431, 432,
    433, 434, 435, 436, 437, 438, 439, 440,
    441, 442, 443, 444, 445, 446, 447, 448,
    449, 450, 451, 452, 453, 454, 455, 456,
    457, 458, 459, 460, 461, 462, 463, 464,
    465, 466, 467, 468, 469, 470, 471, 472
  ],
  duoAttack: [661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679],
  duoAttackLoop: [678, 679],
  laugh: [601, 602, 603, 604, 605, 606, 607],
  laughLoop: [602, 603, 604, 605, 606, 607],
  gameOver: [608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628],
  gameOverLoop: [624, 625, 626, 627, 628]
};
const bernFrames = {
  summon: [691, 692, 693, 694, 762, 763, 764, 765],
  idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  move: [55, 56, 57, 58, 59, 60, 61, 62],
  moveBack: [63, 64, 65, 66, 67, 68, 69, 70],
  teleportOut: [460, 461, 462, 463, 464, 465, 466, 467, 468, 469],
  teleportIn: [470, 471, 472, 473, 474, 475, 476, 477, 478, 479],
  teleportBackOut: [460, 461, 462, 463, 464, 465, 466, 467, 468, 469],
  teleportBackIn: [470, 471, 472, 473, 474, 475, 476, 477, 478, 479],
  hazardTeleportIn: [470, 471, 472, 473, 474, 475, 476, 477, 478, 479],
  hazardTeleportOut: [460, 461, 462, 463, 464, 465, 466, 467, 468, 469],
  hazardCharge: [491, 492, 493, 494, 495, 496, 497, 498, 499, 500],
  hazardParried: [207, 208, 209, 210, 211],
  crystalCharge: [491, 492, 493, 494, 495, 496, 497, 498, 499, 500],
  duoAttack: [667, 668, 669, 670, 671, 672, 673, 674, 675, 676],
  duoAttackLoop: [672, 673, 674, 675, 676],
  sacrifice: [685, 686, 687, 688, 689, 690, 691, 692, 693, 694]
};

const attackData = {
  punch1: { kind: "punch", stage: 1, lock: 0.26, range: 140, depth: 50, damage: 8, gain: 8, activeFrames: [194] },
  kick1: { kind: "kick", stage: 1, lock: 0.4, range: 160, depth: 64, damage: 10, gain: 9, activeFrames: [201, 202], pushback: 52 },
  punch2: { kind: "punch", stage: 2, lock: 0.54, range: 240, depth: 58, damage: 18, gain: 13, activeFrames: [221] },
  kick2: { kind: "kick", stage: 2, lock: 0.58, range: 190, depth: 70, damage: 22, gain: 15, activeFrames: [213, 214] },
  punch3: { kind: "punch", stage: 3, lock: 0.72, range: 220, depth: 78, damage: 24, gain: 18, activeFrames: [340, 342, 341], knockdown: true, launch: true, lunge: 118 },
  kick3: { kind: "kick", stage: 3, lock: 1.15, range: 250, depth: 88, damage: 28, gain: 20, activeFrames: [296], knockdown: true, groundBounce: true, launchLift: STAGE3_KICK_BOUNCE_LIFT, launchDrift: STAGE3_KICK_BOUNCE_DRIFT },
  dashPunch: { kind: "dashPunch", lock: 0.34, range: 260, depth: 72, damage: 26, gain: 16, activeFrames: [348, 349], knockdown: true, launch: true, launchLift: 500, launchDrift: 260, lunge: 150 },
  special: { lock: 0.7, activeFrames: [] }
};
const enemyAttackData = {
  punch: { lock: 0.54, range: 96, depth: 54, damage: 8, activeFrames: [221] },
  kick: { lock: 0.58, range: 128, depth: 62, damage: 10, activeFrames: [213, 214] }
};
const ENEMY_ATTACK_TELEGRAPH_TIME = 0.22;
const ENEMY_PUNCH_TELEGRAPH_RANGE = 112;
const ENEMY_PUNCH_TELEGRAPH_DEPTH = 58;
const ENEMY_KICK_TELEGRAPH_RADIUS = 104;
const ENEMY_KICK_TELEGRAPH_Y_SCALE = 0.46;
const launchFallFrames = [153, 154, 155];
const enemyFrames = [60, 100, 130, 150];
const goatFrames = {
  idle: [740, 741, 742, 741, 740],
  pound: [679, 680, 682, 681, 683, 684, 685, 686],
  recover: [687, 688, 689, 690],
  chargeWindup: [690, 691, 692, 693, 694, 695, 696, 697, 698],
  charge: [699, 700],
  chargeRecover: [701, 702, 703],
  hurt: [725, 726, 727, 728, 729, 730, 731],
  defeat: [755, 756, 757, 758]
};
const beatriceFrames = {
  idle: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  puff: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  stakeCast: [321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331],
  teleportPrep: [470, 471, 472, 473, 474],
  meleeKick: [269, 270, 271, 272, 273, 274, 275, 276, 277],
  asmoDropKick: [366, 367, 368, 369, 370, 371, 372, 373, 374],
  barrierBreak: [196, 197, 198, 199, 200, 201, 202, 203, 204, 205],
  dizzy: [591, 592, 593, 594, 595, 596, 597, 598, 599, 600],
  hurt: [153, 154, 155, 156, 157, 158, 159, 160, 161],
  launchedUp: [206, 207],
  launchedFall: [208],
  downed: [209, 210, 211, 212, 213],
  defeatMove: [819, 820, 821],
  defeatFinal: [822, 823, 824, 825, 826, 827, 828, 829, 830, 831],
  defeatLoop: [829, 830, 831]
};
const beelzebubFrames = [503, 504, 505, 506, 507, 508, 509, 510, 511, 512];
const leviathanFrames = [513, 514, 515, 516, 517, 518, 519, 520, 521, 522];
const satanFrames = [483, 484, 485, 486, 487, 488, 489, 490, 491, 492];
const belphegorFrames = [473, 474, 475, 476, 477, 478, 479, 480, 481, 482];
const beatriceDefeatLoopAnchors = {
  829: 139.3,
  830: 137.9,
  831: 136.3
};
const images = {};
const goatImages = {};
const goatFrameBounds = {};
const goatIdleFrameAnchors = {};
let goatIdleAnchor = null;
const beatriceImages = {};
const beatriceFrameBounds = {};
const lambdaImages = {};
const lambdaPortraits = {};
const dialoguePortraits = {};
const lambdaKonpeitoAnchors = {};
const lambdaKnockdownAnchors = {};
const bernImages = {};
const effectImages = {};
const bernCatFrameBounds = [];
const bernCatFrameAnchors = [];
const frameOffsets = {
  51: [24, 0],
  52: [-9, 0],
  53: [12, 0],
  54: [-14, 0],
  55: [-3, 0],
  56: [-24, 0],
  57: [12, 0],
  58: [2, 0]
};
const actionFrameOffsets = {
  punch: {
    217: [0, 0],
    218: [3, 0],
    219: [11, 0],
    220: [-34, 0],
    221: [-119, 0],
    222: [28, 0],
    223: [-35, 0],
    224: [-11, 0]
  },
  down: {
    152: [-16, 0],
    153: [-32, 0],
    154: [-2, 0],
    155: [-22, 0],
    156: [2, 0],
    157: [109, 0],
    158: [116, 0]
  },
  runStart: {
    93: [-41, 0],
    94: [-41, 0],
    95: [-43, 0]
  },
  run: {
    97: [6, 0],
    96: [51, 0],
    98: [-1, 0],
    99: [-20, 0],
    100: [-30, 0],
    101: [60, 0],
    102: [-5, 0],
    103: [3, 0],
    104: [-32, 0],
    105: [-32, 0]
  },
  runBrake: {
    106: [0, 0],
    107: [1, 0],
    108: [3, 0],
    109: [6, 0],
    110: [-1, 0]
  },
  kick1: {
    199: [33, 0],
    200: [-2, 0],
    201: [19, 0],
    202: [-57, 0],
    203: [62, 0],
    204: [86, 0]
  },
  punch3: {
    336: [30, 0],
    337: [15, 0],
    338: [10, 0],
    339: [3, 0],
    340: [0, 0],
    342: [-47, 0],
    341: [-47, 0],
    343: [18, 0],
    344: [3, 0]
  },
  dashPunch: {
    347: [24, 0],
    348: [-38, 0],
    349: [-38, 0]
  },
  kick3: {
    91: [0, 0],
    294: [0, 0],
    295: [0, 0],
    296: [56, 0],
    297: [56, 0]
  },
  specialBeam: {
    333: [-34, 0],
    334: [-34, 0],
    335: [-34, 0]
  },
  duoBeamPose: {
    333: [-34, 0],
    334: [-34, 0],
    335: [-34, 0]
  }
};
const frameBounds = {
  0: [0, 0, 102, 264],
  1: [0, 0, 102, 264],
  2: [0, 0, 102, 264],
  3: [0, 0, 102, 265],
  4: [0, 0, 102, 265],
  5: [0, 0, 103, 265],
  6: [0, 0, 102, 265],
  7: [0, 0, 102, 265],
  8: [0, 0, 102, 264],
  9: [0, 0, 102, 264],
  10: [0, 0, 104, 263],
  11: [0, 0, 109, 261],
  51: [0, 0, 157, 255],
  52: [0, 0, 113, 257],
  53: [0, 0, 66, 260],
  54: [0, 0, 91, 258],
  55: [0, 0, 154, 256],
  56: [0, 0, 111, 257],
  57: [0, 0, 69, 259],
  58: [0, 0, 93, 257],
  60: [0, 0, 117, 255],
  63: [0, 0, 119, 250],
  65: [0, 0, 116, 259],
  68: [0, 0, 134, 217],
  70: [0, 0, 126, 168],
  91: [1, 1, 115, 141],
  95: [0, 0, 100, 250],
  93: [0, 0, 107, 236],
  94: [0, 0, 107, 234],
  96: [0, 0, 264, 196],
  97: [0, 0, 170, 193],
  98: [0, 0, 158, 202],
  99: [0, 0, 208, 207],
  100: [0, 0, 234, 184],
  101: [0, 0, 262, 196],
  102: [0, 0, 169, 192],
  103: [0, 0, 157, 198],
  104: [0, 0, 219, 208],
  105: [0, 0, 237, 187],
  106: [0, 0, 182, 211],
  107: [0, 0, 168, 190],
  108: [0, 0, 180, 212],
  109: [0, 0, 195, 225],
  110: [0, 0, 165, 260],
  115: [0, 0, 114, 248],
  118: [0, 0, 142, 254],
  119: [0, 0, 121, 258],
  120: [0, 0, 148, 247],
  121: [0, 0, 160, 246],
  122: [0, 0, 150, 240],
  123: [0, 0, 151, 242],
  125: [0, 0, 113, 250],
  130: [0, 0, 125, 164],
  140: [0, 0, 276, 70],
  150: [0, 0, 149, 124],
  152: [0, 0, 170, 260],
  153: [0, 0, 231, 176],
  154: [0, 0, 235, 129],
  155: [0, 0, 244, 139],
  156: [0, 0, 246, 113],
  157: [0, 0, 258, 91],
  158: [0, 0, 271, 75],
  160: [0, 0, 233, 156],
  170: [0, 0, 91, 281],
  180: [0, 0, 128, 197],
  190: [0, 0, 145, 180],
  193: [0, 0, 116, 264],
  194: [0, 0, 173, 264],
  195: [0, 0, 122, 265],
  199: [0, 0, 111, 266],
  200: [0, 0, 122, 262],
  201: [0, 0, 168, 255],
  202: [0, 0, 256, 250],
  203: [0, 0, 134, 265],
  204: [0, 0, 96, 264],
  210: [0, 0, 77, 257],
  211: [0, 0, 93, 252],
  212: [0, 0, 104, 234],
  213: [0, 0, 271, 237],
  214: [0, 0, 218, 241],
  215: [0, 0, 125, 258],
  216: [0, 0, 116, 264],
  217: [0, 0, 108, 228],
  218: [0, 0, 103, 247],
  219: [0, 0, 145, 253],
  220: [0, 0, 164, 223],
  221: [0, 0, 249, 194],
  222: [0, 0, 176, 174],
  223: [0, 0, 163, 200],
  224: [0, 0, 152, 254],
  230: [0, 0, 166, 159],
  233: [0, 0, 111, 262],
  234: [0, 0, 141, 254],
  235: [0, 0, 237, 230],
  236: [0, 0, 189, 243],
  237: [0, 0, 285, 242],
  238: [0, 0, 259, 190],
  239: [0, 0, 181, 184],
  240: [0, 0, 175, 208],
  250: [0, 0, 111, 160],
  260: [0, 0, 134, 239],
  280: [0, 0, 180, 159],
  294: [1, 1, 114, 184],
  295: [1, 1, 118, 308],
  296: [1, 1, 238, 180],
  297: [1, 1, 143, 244],
  300: [0, 0, 129, 301],
  320: [0, 0, 148, 222],
  326: [0, 0, 107, 268],
  327: [0, 0, 101, 269],
  328: [0, 0, 93, 268],
  329: [0, 0, 93, 267],
  330: [0, 0, 93, 268],
  331: [0, 0, 93, 269],
  332: [0, 0, 96, 265],
  333: [0, 0, 177, 266],
  334: [0, 0, 177, 268],
  335: [0, 0, 177, 267],
  336: [0, 0, 144, 234],
  337: [0, 0, 166, 218],
  338: [0, 0, 164, 215],
  339: [0, 0, 171, 211],
  340: [0, 0, 178, 203],
  341: [0, 0, 221, 247],
  342: [0, 0, 221, 247],
  343: [0, 0, 155, 252],
  344: [0, 0, 114, 261],
  347: [0, 0, 256, 256],
  348: [0, 0, 512, 256],
  349: [0, 0, 512, 256],
  360: [0, 0, 173, 237],
  380: [0, 0, 189, 178],
  387: [0, 0, 99, 261],
  388: [0, 0, 111, 263],
  389: [0, 0, 153, 255],
  390: [0, 0, 206, 272],
  391: [0, 0, 160, 260],
  392: [0, 0, 108, 261],
  393: [0, 0, 107, 264],
  400: [0, 0, 153, 274],
  420: [0, 0, 164, 159],
  440: [0, 0, 107, 260],
  460: [0, 0, 103, 236],
  480: [0, 0, 98, 257],
  500: [0, 0, 200, 268],
  520: [0, 0, 108, 259],
  540: [0, 0, 200, 268]
};
const lambdaFrameBounds = {
  0: [0, 0, 140, 234],
  1: [0, 0, 146, 234],
  2: [0, 0, 158, 235],
  3: [0, 0, 163, 235],
  4: [0, 0, 164, 235],
  5: [0, 0, 164, 235],
  6: [0, 0, 164, 235],
  7: [0, 0, 161, 234],
  8: [0, 0, 154, 234],
  9: [0, 0, 145, 234],
  10: [0, 0, 140, 234],
  11: [0, 0, 140, 233],
  12: [0, 0, 141, 233],
  13: [0, 0, 134, 224],
  56: [0, 0, 138, 231],
  57: [0, 0, 142, 234],
  58: [0, 0, 146, 234],
  59: [0, 0, 156, 232],
  60: [0, 0, 171, 230],
  61: [0, 0, 177, 227],
  62: [0, 0, 181, 220],
  63: [0, 0, 160, 224],
  64: [0, 0, 142, 232],
  65: [0, 0, 155, 234],
  66: [0, 0, 132, 234],
  67: [0, 0, 143, 234],
  68: [0, 0, 137, 234],
  69: [0, 0, 124, 234],
  70: [0, 0, 132, 234],
  71: [0, 0, 143, 234],
  72: [0, 0, 138, 234],
  73: [0, 0, 124, 234],
  118: [0, 0, 133, 235],
  119: [0, 0, 137, 234],
  120: [0, 0, 136, 233],
  121: [0, 0, 136, 233],
  122: [0, 0, 154, 233],
  601: [0, 0, 139, 235],
  602: [0, 0, 136, 236],
  603: [0, 0, 135, 235],
  604: [0, 0, 136, 234],
  605: [0, 0, 138, 230],
  606: [0, 0, 138, 234],
  607: [0, 0, 137, 235],
  608: [0, 0, 140, 235],
  609: [0, 0, 139, 236],
  610: [0, 0, 143, 236],
  611: [0, 0, 139, 234],
  612: [0, 0, 138, 235],
  613: [0, 0, 137, 235],
  614: [0, 0, 136, 235],
  615: [0, 0, 142, 234],
  616: [0, 0, 148, 234],
  617: [0, 0, 150, 234],
  618: [0, 0, 149, 234],
  619: [0, 0, 147, 234],
  620: [0, 0, 142, 234],
  621: [0, 0, 138, 234],
  622: [0, 0, 133, 234],
  623: [0, 0, 130, 234],
  624: [0, 0, 138, 234],
  625: [0, 0, 135, 234],
  626: [0, 0, 131, 234],
  627: [0, 0, 134, 234],
  628: [0, 0, 130, 234],
  688: [0, 0, 138, 232],
  689: [0, 0, 140, 228],
  690: [0, 0, 140, 226],
  691: [0, 0, 141, 225],
  692: [0, 0, 172, 228],
  693: [0, 0, 200, 234],
  694: [0, 0, 190, 233],
  695: [0, 0, 173, 233],
  696: [0, 0, 171, 233],
  697: [0, 0, 170, 234]
};
const lambdaFootAnchors = {
  601: 56,
  602: 50.5,
  603: 50.5,
  604: 55.5,
  605: 58,
  606: 56.5,
  607: 51.5,
  608: 51.5,
  609: 50.5,
  610: 55.5,
  611: 59,
  612: 56,
  613: 53,
  614: 51,
  615: 57,
  616: 57,
  617: 57,
  618: 57,
  619: 57,
  620: 57,
  621: 63.5,
  622: 60.5,
  623: 58.5,
  624: 58.5,
  625: 59.5,
  626: 55.5,
  627: 54.5,
  628: 58.5
};
const lambdaDuoBodyAnchors = {
  661: 55.5,
  662: 55,
  663: 54,
  664: 54,
  665: 56,
  666: 56,
  667: 56,
  668: 59,
  669: 55.5,
  670: 55.5,
  671: 52,
  672: 69,
  673: 64.5,
  674: 64.5,
  675: 65,
  676: 66,
  677: 78,
  678: 88.5,
  679: 88.5
};
const lambdaDuoVerticalAnchors = {
  678: 258,
  679: 258
};
const bernFrameBounds = {
  0: [0, 0, 114, 224],
  1: [0, 0, 115, 223],
  2: [0, 0, 115, 224],
  3: [0, 0, 114, 224],
  4: [0, 0, 115, 225],
  5: [0, 0, 131, 224],
  6: [0, 0, 142, 225],
  7: [0, 0, 151, 224],
  8: [0, 0, 151, 225],
  9: [0, 0, 140, 225],
  55: [0, 0, 127, 228],
  56: [0, 0, 127, 228],
  57: [0, 0, 128, 228],
  58: [0, 0, 129, 228],
  59: [0, 0, 130, 228],
  60: [0, 0, 131, 228],
  61: [0, 0, 131, 228],
  62: [0, 0, 130, 228],
  63: [0, 0, 137, 226],
  64: [0, 0, 139, 226],
  65: [0, 0, 141, 226],
  66: [0, 0, 141, 226],
  67: [0, 0, 139, 226],
  68: [0, 0, 136, 226],
  69: [0, 0, 136, 226],
  70: [0, 0, 135, 226],
  460: [0, 0, 116, 222],
  461: [0, 0, 108, 223],
  462: [0, 0, 103, 219],
  463: [0, 0, 121, 222],
  464: [0, 0, 145, 228],
  465: [0, 0, 161, 234],
  466: [0, 0, 162, 235],
  467: [0, 0, 161, 234],
  468: [0, 0, 162, 234],
  469: [0, 0, 176, 235],
  470: [0, 0, 152, 234],
  471: [0, 0, 167, 234],
  472: [0, 0, 163, 234],
  473: [0, 0, 172, 234],
  474: [0, 0, 173, 230],
  475: [0, 0, 163, 223],
  476: [0, 0, 157, 219],
  477: [0, 0, 137, 217],
  478: [0, 0, 113, 223],
  479: [0, 0, 109, 223],
  491: [0, 0, 126, 222],
  492: [0, 0, 137, 224],
  493: [0, 0, 135, 238],
  494: [0, 0, 129, 239],
  495: [0, 0, 129, 239],
  496: [0, 0, 154, 209],
  497: [0, 0, 174, 201],
  498: [0, 0, 169, 192],
  499: [0, 0, 172, 192],
  500: [0, 0, 168, 192],
  685: [0, 0, 107, 214],
  686: [0, 0, 110, 226],
  687: [0, 0, 111, 202],
  688: [0, 0, 109, 150],
  691: [0, 0, 114, 133],
  692: [0, 0, 108, 137],
  693: [0, 0, 107, 109],
  694: [0, 0, 110, 102],
  689: [0, 0, 97, 117],
  690: [0, 0, 107, 102],
  762: [0, 0, 113, 133],
  763: [0, 0, 99, 136],
  764: [0, 0, 101, 150],
  765: [0, 0, 109, 211],
  766: [0, 0, 139, 224]
};
const particles = [];
const enemies = [];

let state = "loading";
let cameraX = 0;
let lastTime = 0;
let score = 0;
let wave = 1;
let waveMode = "normal";
let messageTimer = 0;
let message = "Press Enter";
let screenFlashTimer = 0;
let screenShakeTimer = 0;
let enemyFreezeTimer = 0;
let beatriceStakeParryFreezeTimer = 0;
let bernParryOverlayTimer = 0;
const bossBlessingChoice = {
  active: false,
  choices: [],
  pendingBoss: false,
  selected: 0
};
const beatriceTutorial = {
  active: false,
  seen: false,
  index: 0,
  skipCooldown: 0,
  scroll: 0
};
const beatriceStakeTutorial = {
  active: false,
  armed: false,
  explained: false,
  stage: "hint",
  stake: null,
  skipCooldown: 0,
  scroll: 0
};
const pickups = [];
const crystalShards = [];
const pendingMiracleCrystalFollowups = [];
const upwardCrystalShards = [];
const crystalTrails = [];
const crystalShockwaves = [];
const konpeitoShots = [];
const konpeitoShockwaves = [];
const konpeitoGeysers = [];
const konpeitoDomeBursts = [];
const lambdaSpecialKonpeitos = [];
const lambdaSpecialShrapnel = [];
const beatriceStakes = [];
const beatriceStakeTrails = [];
const beatriceStakeShockwaves = [];
const beatriceStakeSparkles = [];
const beatriceTowerVolley = {
  active: false,
  phase: "",
  timer: 0,
  wave: 0,
  side: -1,
  towers: [],
  points: [],
  safeZones: [],
  missiles: [],
  hitWaves: []
};
const beatriceDefeatWisps = [];
const beatriceDefeatTrails = [];
const beatriceStakeParryLine = {
  life: 0,
  max: 0,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0
};
const beatriceStakeParryPendingHit = {
  active: false,
  direction: 1
};
const asmodeusAttacks = [];
const beelzebubAttacks = [];
const leviathanAttacks = [];
const satanAttacks = [];
const belphegorAttacks = [];
const beatriceAfterimages = [];
const messageBottles = [];
const summonPillars = [];
const duoAttack = {
  active: false,
  timer: 0,
  centerX: 0,
  centerY: FLOOR_Y - 80,
  singularityX: 0,
  singularityY: FLOOR_Y - 210,
  angle: 0,
  detonated: false,
  side: 1,
  lambdaEndX: 0,
  bernEndX: 0,
  lambdaStartX: 0,
  lambdaStartY: FLOOR_Y,
  bernStartX: 0,
  bernStartY: FLOOR_Y,
  vanishFlash: false,
  shardTimer: 0,
  lambdaLockedFacing: -1,
  lambdaSplashTimer: 0,
  lambdaSplashShown: false,
  lambdaExitStarted: false,
  bernExitStarted: false,
  stageComplete: false,
  crystalShots: []
};
const lambdaGameOverDialogue = {
  active: false,
  index: 0,
  timer: 0,
  skipCooldown: 0
};
const lambdaKonpeitoQuestion = {
  active: false,
  selection: 0
};
const lambdaRetaliation = {
  active: false,
  timer: 0,
  laughTimer: 0,
  laughDelay: LAMBDA_RETALIATION_LAUGH_INITIAL_DELAY,
  laughCount: 0
};
const beatriceBoss = {
  active: false,
  x: 0,
  y: FLOOR_Y - 18,
  facing: -1,
  anim: 0,
  hoverOffset: 52,
  stakeTimer: BEATRICE_STAKE_INTERVAL,
  mechanic: "idle",
  lastMechanic: "",
  wallsActive: false,
  wallTop: FLOOR_Y - 72,
  wallBottom: FLOOR_Y + 34,
  trialGoat: null,
  rewardStakePending: false,
  nextMechanicTimer: 0,
  rings: [],
  ringAttackStarted: false,
  goatRushTelegraphs: [],
  goatRushTimer: 0,
  goatRushSpawned: false,
  towerVolleyStarted: false,
  flavor: "idle",
  flavorTimer: 2.4,
  stakeCastFired: false,
  teleportPrepTimer: 0,
  teleportPrepIndex: 0,
  teleportPrepSide: 1,
  teleportPrepPoints: [],
  materializeTimer: 0,
  meleeKickHit: false,
  meleeKickParried: false,
  meleeKickParryFailed: false,
  meleeKickParryFailFade: 0,
  meleeParryRecoilVx: 0,
  asmoDropKickPending: false,
  asmoDropKickTimer: 0,
  asmoDropKickHit: false,
  asmoDropKickSide: 1,
  hp: 1,
  maxHp: 1,
  stunDamageTaken: 0,
  defeatTimer: 0,
  defeatPhase: "",
  defeatMoveTimer: 0,
  defeatTrailTimer: 0,
  defeatStartX: 0,
  defeatStartY: 0,
  defeatTargetX: 0,
  defeatTargetY: 0,
  barrierActive: true,
  barrierMax: BEATRICE_BARRIER_MAX,
  barrierHp: BEATRICE_BARRIER_MAX,
  vulnerable: false,
  breakVx: 0,
  breakFade: 0,
  z: 0,
  vz: 0,
  airVx: 0,
  launchSource: "",
  juggleCount: 0,
  battlerLaunchSpent: false,
  battlerGroundBounceSpent: false,
  battlerExtraLaunchExtensionSpent: false,
  groundBouncePending: false,
  groundBounceTimer: 0,
  groundBounceDirection: 0,
  groundBounceSource: "",
  groundBounceLift: 0,
  groundBounceDrift: 0,
  downTime: 0,
  stunIdleTimer: 0,
  stunDamageTimer: 0,
  recoveryTimer: 0
};
const runStats = {
  wavesCompleted: 0,
  enemiesDefeated: 0,
  itemsPickedUp: 0,
  companionsEncountered: new Set(),
  damageDealt: 0,
  damageReceived: 0,
  hitsReceived: 0,
  specialsUnleashed: 0,
  duoAttacksUnleashed: 0,
  launchedByLambdadelta: 0,
  revivedByBernkastel: 0,
  parriesPerformed: 0,
  bossesDefeated: 0
};

function resetRunStats() {
  runStats.wavesCompleted = 0;
  runStats.enemiesDefeated = 0;
  runStats.itemsPickedUp = 0;
  runStats.companionsEncountered = new Set();
  runStats.damageDealt = 0;
  runStats.damageReceived = 0;
  runStats.hitsReceived = 0;
  runStats.specialsUnleashed = 0;
  runStats.duoAttacksUnleashed = 0;
  runStats.launchedByLambdadelta = 0;
  runStats.revivedByBernkastel = 0;
  runStats.parriesPerformed = 0;
  runStats.bossesDefeated = 0;
}

function damageEnemy(enemy, amount) {
  if (!enemy || amount <= 0) return 0;
  const scaledAmount = player.blessings.miracleRisk ? amount * 1.5 : amount;
  const actual = Math.max(0, Math.min(enemy.hp, scaledAmount));
  enemy.hp -= scaledAmount;
  runStats.damageDealt += actual;
  return actual;
}

function beatriceCanBeDamaged() {
  const vulnerableFlavor = ["dizzy", "hurt", "launched", "downed"].includes(beatriceBoss.flavor);
  return beatriceBoss.active
    && beatriceBoss.vulnerable
    && !beatriceBoss.barrierActive
    && vulnerableFlavor
    && beatriceBoss.hp > 0;
}

function beatriceHurtbox() {
  if (beatriceBoss.flavor === "launched") {
    return {
      x: beatriceBoss.x - 98,
      y: beatriceBoss.y - (beatriceBoss.z || 0) - 172,
      w: 196,
      h: 168
    };
  }
  if (beatriceBoss.flavor === "downed") {
    return {
      x: beatriceBoss.x - 132,
      y: beatriceBoss.y - 76,
      w: 264,
      h: 96
    };
  }
  return {
    x: beatriceBoss.x - 86,
    y: beatriceBoss.y - 88,
    w: 172,
    h: 132
  };
}

function damageBeatrice(amount, direction = 0) {
  if (!beatriceCanBeDamaged() || amount <= 0) return 0;
  const incomingAmount = player.blessings.miracleRisk ? amount * 1.5 : amount;
  const fullDamageCap = beatriceBoss.maxHp * BEATRICE_STUN_FULL_DAMAGE_FRACTION;
  const fullDamageRemaining = Math.max(0, fullDamageCap - (beatriceBoss.stunDamageTaken || 0));
  const fullPortion = Math.min(incomingAmount, fullDamageRemaining);
  const reducedPortion = Math.max(0, incomingAmount - fullPortion) * BEATRICE_STUN_OVER_CAP_DAMAGE_MULTIPLIER;
  const scaledAmount = fullPortion + reducedPortion;
  const actual = Math.max(0, Math.min(beatriceBoss.hp, scaledAmount));
  beatriceBoss.hp -= actual;
  beatriceBoss.stunDamageTaken = (beatriceBoss.stunDamageTaken || 0) + actual;
  runStats.damageDealt += actual;
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  if (beatriceBoss.stunDamageTimer <= 0) beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
  if (beatriceBoss.flavor === "dizzy" || beatriceBoss.flavor === "hurt") {
    beatriceBoss.flavor = "hurt";
    beatriceBoss.anim = 0;
    beatriceBoss.x = clamp(beatriceBoss.x + direction * BEATRICE_DIZZY_HURT_DAMAGE_PUSH, 90, STAGE_W - 90);
  }
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 92, 10);
  screenShakeTimer = Math.max(screenShakeTimer, 0.06);
  return actual;
}

function damagePlayer(amount) {
  if (amount <= 0) return 0;
  const scaledAmount = player.blessings.miracleRisk ? amount * 1.5 : amount;
  const actual = Math.max(0, Math.min(player.hp, scaledAmount));
  player.hp -= scaledAmount;
  if (actual > 0) {
    runStats.damageReceived += actual;
    runStats.hitsReceived += 1;
    triggerBeatriceHitReaction();
  }
  return actual;
}

function canUseAttackPoise() {
  return Boolean(player.blessings.paperArmor)
    && player.attackLock > 0
    && attackData[player.action]
    && !player.airborne
    && !player.knockedDown;
}

function absorbPlayerPoise(amount, launch = false) {
  if (launch) {
    player.poise = 0;
    return false;
  }
  if (!canUseAttackPoise()) return false;
  if (player.poise <= 0) player.poise = 25;
  player.poise -= Math.max(0, amount);
  if (player.poise > 0) {
    burst(player.x, player.y - 92, "special");
    return true;
  }
  player.poise = 0;
  return false;
}

function triggerBeatriceHitReaction() {
  if (!beatriceBoss.active) return;
  if (beatriceBoss.flavor !== "idle") return;
  if (beatriceBoss.mechanic === "ringAttack") return;
  beatriceBoss.flavor = "puff";
  beatriceBoss.anim = 0;
}

function formatStatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function runPerformanceValue(record) {
  const waves = record.wavesCompleted || 0;
  const bosses = record.bossesDefeated || 0;
  const defeated = record.enemiesDefeated || 0;
  const hits = record.hitsReceived || 0;
  const damage = record.damageReceived || 0;
  const scoreValue = record.score || 0;
  const cleanRatio = defeated > 0 ? defeated / Math.max(1, defeated + hits * 2.2) : 0;
  return Math.round(
    waves * 12000
    + bosses * 18000
    + defeated * 520
    + cleanRatio * 2600
    + Math.sqrt(Math.max(0, scoreValue)) * 18
    - hits * 620
    - damage * 18
  );
}

function loadLocalScoreboard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_SCOREBOARD_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function saveLocalScoreboard(records) {
  try {
    localStorage.setItem(LOCAL_SCOREBOARD_KEY, JSON.stringify(records.slice(0, LOCAL_SCOREBOARD_LIMIT)));
  } catch (error) {
    // Local storage can be unavailable in some browser modes; the run still plays normally.
  }
}

function resetLocalScoreboard() {
  if (!window.confirm("Reset all saved run records?")) return;
  try {
    localStorage.removeItem(LOCAL_SCOREBOARD_KEY);
  } catch (error) {
    saveLocalScoreboard([]);
  }
  latestRunRankInfo = null;
  refreshRunDetailsPanel();
}

function currentRunRecord() {
  const record = {
    id: Date.now(),
    date: new Date().toISOString(),
    score,
    wavesCompleted: runStats.wavesCompleted,
    enemiesDefeated: runStats.enemiesDefeated,
    damageReceived: Math.round(runStats.damageReceived),
    hitsReceived: runStats.hitsReceived,
    damageDealt: Math.round(runStats.damageDealt),
    itemsPickedUp: runStats.itemsPickedUp,
    companionsEncountered: Array.from(runStats.companionsEncountered),
    specialsUnleashed: runStats.specialsUnleashed,
    duoAttacksUnleashed: runStats.duoAttacksUnleashed,
    launchedByLambdadelta: runStats.launchedByLambdadelta,
    revivedByBernkastel: runStats.revivedByBernkastel,
    parriesPerformed: runStats.parriesPerformed,
    bossesDefeated: runStats.bossesDefeated
  };
  record.performance = runPerformanceValue(record);
  return record;
}

function rankRunAgainstHistory(record, history) {
  const previous = history.filter((entry) => typeof entry.performance === "number");
  if (!previous.length) {
    return { letter: "S", label: "First record", percentile: 1, placement: 1, total: 1, personalBest: true };
  }
  const better = previous.filter((entry) => entry.performance > record.performance).length;
  const placement = better + 1;
  const percentile = 1 - better / previous.length;
  const best = previous.reduce((max, entry) => Math.max(max, entry.performance || -Infinity), -Infinity);
  let letter = "D";
  if (record.performance >= best) letter = "S";
  else if (percentile >= 0.8) letter = "A";
  else if (percentile >= 0.6) letter = "B";
  else if (percentile >= 0.35) letter = "C";
  return {
    letter,
    label: record.performance >= best ? "New personal best" : `Top ${Math.max(1, Math.round(percentile * 100))}%`,
    percentile,
    placement,
    total: previous.length + 1,
    personalBest: record.performance >= best
  };
}

function compareRunRecords(a, b) {
  return (b.performance || 0) - (a.performance || 0)
    || (b.bossesDefeated || 0) - (a.bossesDefeated || 0)
    || (b.wavesCompleted || 0) - (a.wavesCompleted || 0)
    || (b.enemiesDefeated || 0) - (a.enemiesDefeated || 0)
    || (b.score || 0) - (a.score || 0);
}

function recordCompletedRun() {
  const record = currentRunRecord();
  const history = loadLocalScoreboard();
  latestRunRecord = record;
  latestRunRankInfo = rankRunAgainstHistory(record, history);
  const updated = [record, ...history].sort(compareRunRecords).slice(0, LOCAL_SCOREBOARD_LIMIT);
  saveLocalScoreboard(updated);
}

function rankSummaryText() {
  if (!latestRunRankInfo || !latestRunRecord) return "Unranked";
  return `${latestRunRankInfo.letter} - ${latestRunRankInfo.label}`;
}

function runStatsRows() {
  return [
    ["Run rank", rankSummaryText()],
    ["Performance value", latestRunRecord ? latestRunRecord.performance : runPerformanceValue(currentRunRecord())],
    ["Waves completed", runStats.wavesCompleted],
    ["Bosses defeated", runStats.bossesDefeated],
    ["Enemies defeated", runStats.enemiesDefeated],
    ["Items picked up", runStats.itemsPickedUp],
    ["Companions encountered", runStats.companionsEncountered.size ? Array.from(runStats.companionsEncountered).join(", ") : "None"],
    ["Damage dealt", Math.round(runStats.damageDealt)],
    ["Damage received", Math.round(runStats.damageReceived)],
    ["Hits received", runStats.hitsReceived],
    ["Specials unleashed", runStats.specialsUnleashed],
    ["Duo attacks unleashed", runStats.duoAttacksUnleashed],
    ["Launched by Lambdadelta", runStats.launchedByLambdadelta],
    ["Revived by Bernkastel", runStats.revivedByBernkastel],
    ["Parries performed", runStats.parriesPerformed]
  ];
}

function refreshRunDetailsPanel() {
  if (!runDetailsList) return;
  runDetailsList.innerHTML = "";
  const summary = document.createElement("section");
  summary.className = "run-details__summary";
  const rank = document.createElement("strong");
  rank.textContent = latestRunRankInfo?.letter || "-";
  const text = document.createElement("div");
  const title = document.createElement("span");
  const subtitle = document.createElement("span");
  title.textContent = latestRunRankInfo?.label || "Current run";
  subtitle.textContent = latestRunRecord
    ? `Performance ${latestRunRecord.performance} | Personal rank #${latestRunRankInfo?.placement || 1} of ${latestRunRankInfo?.total || 1}`
    : "Run not completed yet";
  text.append(title, subtitle);
  summary.append(rank, text);
  runDetailsList.append(summary);

  for (const [label, value] of runStatsRows()) {
    const row = document.createElement("div");
    row.className = "run-details__row";
    const name = document.createElement("span");
    const stat = document.createElement("span");
    name.textContent = label;
    stat.textContent = typeof value === "number" ? formatStatNumber(value) : value;
    row.append(name, stat);
    runDetailsList.append(row);
  }

  const boardTitle = document.createElement("h3");
  boardTitle.className = "run-details__section-title";
  boardTitle.textContent = "Best Runs";
  runDetailsList.append(boardTitle);
  const records = loadLocalScoreboard();
  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "run-details__row";
    empty.append(document.createElement("span"), document.createElement("span"));
    empty.firstChild.textContent = "No saved runs yet";
    empty.lastChild.textContent = "Finish a run";
    runDetailsList.append(empty);
  } else {
    records.forEach((record, index) => {
      const row = document.createElement("div");
      row.className = "run-details__score-row";
      if (latestRunRecord && record.id === latestRunRecord.id) row.classList.add("is-current");
      const left = document.createElement("span");
      const right = document.createElement("span");
      const date = record.date ? new Date(record.date).toLocaleDateString() : "";
      left.textContent = `#${index + 1}  W${record.wavesCompleted || 0} / B${record.bossesDefeated || 0} / ${record.enemiesDefeated || 0} defeated`;
      right.textContent = `${record.performance || 0} pts${date ? ` - ${date}` : ""}`;
      row.append(left, right);
      runDetailsList.append(row);
    });
  }
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "run-details__reset";
  resetButton.textContent = "Reset Records";
  resetButton.addEventListener("click", resetLocalScoreboard);
  runDetailsList.append(resetButton);
}

function showRunDetails() {
  if (!runDetailsPanel) return;
  refreshRunDetailsPanel();
  runDetailsPanel.hidden = false;
}

function hideRunDetails() {
  if (runDetailsPanel) runDetailsPanel.hidden = true;
}

const lambdaCompanion = {
  active: false,
  summoned: false,
  x: 0,
  y: FLOOR_Y,
  facing: 1,
  anim: 0,
  state: "idle",
  moveSettle: 0,
  konpeitoTimer: LAMBDA_KONPEITO_INTERVAL,
  konpeitoCharge: 100,
  castHasFired: false,
  queuedKonpeito: false
};

const bernCompanion = {
  active: false,
  summoned: false,
  x: 0,
  y: FLOOR_Y,
  facing: 1,
  anim: 0,
  state: "idle",
  moveSettle: 0,
  crystalTimer: BERN_CRYSTAL_INTERVAL,
  crystalChargeGauge: 100,
  crystalCharge: 0,
  crystalHasFired: false,
  queuedCrystal: false,
  catForm: false,
  attackTargetX: 0,
  attackTargetY: FLOOR_Y,
  parryClock: 0,
  parryZ: 0,
  parryVx: 0,
  parryVz: 0,
  parryFade: 0,
  parryFailed: false,
  parryFailFade: 0
};

const player = {
  x: 240,
  y: FLOOR_Y,
  z: 0,
  vx: 0,
  vy: 0,
  facing: 1,
  hp: 100,
  resolve: 0,
  action: "idle",
  anim: 0,
  attackLock: 0,
  attackHasHit: false,
  crestAttackHasHit: false,
  superChargeShockwaveDone: false,
  comboStep: 0,
  comboTimer: 0,
  comboQueuedKind: "",
  currentAttack: "",
  attackConsumesResolve: false,
  pendingResolveAttack: false,
  attackLungeRemaining: 0,
  goatParryCounter: false,
  stage3KickAir: false,
  stage3KickTimer: 0,
  stage3KickVz: 0,
  airborne: false,
  vz: 0,
  airVx: 0,
  knockedDown: false,
  downTime: 0,
  beatriceDropKickBouncePending: false,
  beatriceDropKickBounceTimer: 0,
  beatriceDropKickBounceDirection: 1,
  wallSlamTimer: 0,
  wallSlamTargetX: 0,
  wallSlamStartX: 0,
  wallSlamHit: false,
  meleeParryRecoilVx: 0,
  runState: "none",
  runTimer: 0,
  runCharge: 0,
  dashCooldown: 0,
  brakeDrift: 0,
  brakeBurstTimer: 0,
  invuln: 0,
  duoCharge: 0,
  konpeitoGlowTimer: 0,
  konpeitoGlowPending: false,
  crystalShardActive: false,
  crystalShardTimer: 0,
  crystalShardStacks: [],
  konpeitoActive: false,
  konpeitoCooldown: 0,
  plumTeaActive: false,
  plumTeaBurned: false,
  oneWingedEagleActive: false,
  oneWingedEagleLevel: 0,
  blessings: {
    launchExtension: 0,
    superCharge: false,
    lambdaKonpeitoSpecial: false,
    paperArmor: false,
    miracleRevival: 0,
    miracleShardFollowup: false,
    miracleCrystalShardPlus: false,
    miracleRisk: false
  },
  poise: 0,
  bernHazardTimer: BERN_REVIVE_HAZARD_INTERVAL,
  bernHazardAmuseKills: 0,
  itemOrder: [],
  seenItemTutorials: new Set(),
  combo: 0
};

function fileName(id) {
  return `assets/battler/${String(id).padStart(8, "0")}.PNG`;
}

function lambdaFileName(id) {
  return `assets/lambdadelta/${String(id).padStart(8, "0")}.PNG`;
}

function bernFileName(id) {
  return `assets/bernkastel/${String(id).padStart(8, "0")}.PNG`;
}

function goatFileName(id) {
  return `assets/goat/${String(id).padStart(8, "0")}.png`;
}

function beatriceFileName(id) {
  return `assets/beatrice/${String(id).padStart(8, "0")}.png`;
}

function imageOpaqueBounds(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width;
  let minY = c.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 1);
      maxY = Math.max(maxY, y + 1);
    }
  }
  return maxX < 0 ? [0, 0, img.width, img.height] : [minX, minY, maxX, maxY];
}

function imageBottomFootAnchor(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data;
  let maxY = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 8) maxY = Math.max(maxY, y + 1);
    }
  }
  if (maxY < 0) return { x: img.width * 0.5, y: img.height };
  let sumX = 0;
  let count = 0;
  const fromY = Math.max(0, maxY - 10);
  for (let y = fromY; y < maxY; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] <= 8) continue;
      sumX += x;
      count += 1;
    }
  }
  return { x: count ? sumX / count : img.width * 0.5, y: maxY };
}

function removeWhiteBackground(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const image = g.getImageData(0, 0, c.width, c.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const gValue = data[i + 1];
    const b = data[i + 2];
    const whiteness = Math.min(r, gValue, b);
    const colorSpread = Math.max(r, gValue, b) - whiteness;
    if (whiteness > 244 && colorSpread < 18) {
      data[i + 3] = 0;
    } else if (whiteness > 226 && colorSpread < 24) {
      data[i + 3] = Math.min(data[i + 3], Math.max(0, (244 - whiteness) * 16));
    }
  }
  g.putImageData(image, 0, 0);
  return c;
}

function loadImages() {
  const ids = new Set([...Object.values(frames).flat(), ...enemyFrames]);
  const spriteLoads = [...ids].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[id] = img;
      resolve();
    };
    img.src = fileName(id);
  }));
  const lambdaLoads = [...new Set(Object.values(lambdaFrames).flat())].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      lambdaImages[id] = img;
      if (!lambdaFrameBounds[id]) lambdaFrameBounds[id] = imageOpaqueBounds(img);
      if (lambdaFrames.konpeitoCast.includes(id)) lambdaKonpeitoAnchors[id] = imageBottomFootAnchor(img);
      if (lambdaFrames.konpeitoKnockdown.includes(id)) lambdaKnockdownAnchors[id] = imageBottomFootAnchor(img);
      resolve();
    };
    img.src = lambdaFileName(id);
  }));
  const bernLoads = [...new Set(Object.values(bernFrames).flat())].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      bernImages[id] = img;
      resolve();
    };
    img.src = bernFileName(id);
  }));
  const goatLoads = [...new Set(Object.values(goatFrames).flat())].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      goatImages[id] = img;
      goatFrameBounds[id] = imageOpaqueBounds(img);
      resolve();
    };
    img.src = goatFileName(id);
  }));
  const beatriceLoads = [...new Set(Object.values(beatriceFrames).flat())].map((id) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      beatriceImages[id] = img;
      beatriceFrameBounds[id] = imageOpaqueBounds(img);
      resolve();
    };
    img.src = beatriceFileName(id);
  }));
  const lambdaPortraitNames = [...new Set([...LAMBDA_GAME_OVER_DIALOGUE.map(({ portrait }) => portrait), "DarkLambda2"])];
  const portraitLoads = lambdaPortraitNames.map((portrait) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      lambdaPortraits[portrait] = img;
      resolve();
    };
    img.src = `assets/lambdadelta/portraits/${portrait}.png`;
  }));
  const tutorialPortraitLoads = [...new Set(BEATRICE_TUTORIAL_DIALOGUE.map(({ portrait }) => portrait))].map((portrait) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      dialoguePortraits[portrait] = img;
      resolve();
    };
    img.src = `assets/dialogue/${portrait}.png`;
  }));
  const effectLoads = [
    ["konpeito", "assets/effects/Konpeito.PNG"],
    ["plumTea", "assets/effects/PlumTea.png"],
    ["oneWingedEagle", "assets/effects/OneWingedEagle.webp"],
    ["oneWingedEagleGlow", "assets/effects/OneWingedEagle - Glow.png"],
    ["beatriceStake", "assets/effects/BeatriceStake.png"],
    ["beatriceTowers", "assets/effects/BeatriceTowers.png"],
    ["asmo1", "assets/effects/Asmo1.png"],
    ["asmo2", "assets/effects/Asmo2.png"],
    ["asmo3", "assets/effects/Asmo3.png"],
    ["asmo4", "assets/effects/Asmo4.png"],
    ["beelzebub503", "assets/effects/Beelzebub1.png"],
    ["beelzebub504", "assets/effects/Beelzebub2.png"],
    ["beelzebub505", "assets/effects/Beelzebub3.png"],
    ["beelzebub506", "assets/effects/Beelzebub4.png"],
    ["beelzebub507", "assets/effects/Beelzebub5.png"],
    ["beelzebub508", "assets/effects/Beelzebub6.png"],
    ["beelzebub509", "assets/effects/Beelzebub7.png"],
    ["beelzebub510", "assets/effects/Beelzebub8.png"],
    ["beelzebub511", "assets/effects/Beelzebub9.png"],
    ["beelzebub512", "assets/effects/Beelzebub10.png"],
    ["leviathan513", "assets/effects/Leviathan1.png"],
    ["leviathan514", "assets/effects/Leviathan2.png"],
    ["leviathan515", "assets/effects/Leviathan3.png"],
    ["leviathan516", "assets/effects/Leviathan4.png"],
    ["leviathan517", "assets/effects/Leviathan5.png"],
    ["leviathan518", "assets/effects/Leviathan6.png"],
    ["leviathan519", "assets/effects/Leviathan7.png"],
    ["leviathan520", "assets/effects/Leviathan8.png"],
    ["leviathan521", "assets/effects/Leviathan9.png"],
    ["leviathan522", "assets/effects/Leviathan10.png"],
    ["satan483", "assets/effects/Satan1.png"],
    ["satan484", "assets/effects/Satan2.png"],
    ["satan485", "assets/effects/Satan3.png"],
    ["satan486", "assets/effects/Satan4.png"],
    ["satan487", "assets/effects/Satan5.png"],
    ["satan488", "assets/effects/Satan6.png"],
    ["satan489", "assets/effects/Satan7.png"],
    ["satan490", "assets/effects/Satan8.png"],
    ["satan491", "assets/effects/Satan9.png"],
    ["satan492", "assets/effects/Satan10.png"],
    ["belphegor482", "assets/effects/Belphegor1.png"],
    ["belphegor473", "assets/effects/Belphegor2.png"],
    ["belphegor474", "assets/effects/Belphegor3.png"],
    ["belphegor475", "assets/effects/Belphegor4.png"],
    ["belphegor476", "assets/effects/Belphegor5.png"],
    ["belphegor477", "assets/effects/Belphegor6.png"],
    ["belphegor478", "assets/effects/Belphegor7.png"],
    ["belphegor479", "assets/effects/Belphegor8.png"],
    ["belphegor480", "assets/effects/Belphegor9.png"],
    ["belphegor481", "assets/effects/Belphegor10.png"],
    ["bernParryOverlay", "assets/effects/BernParryOverlay.webp"],
    ["lambdaDuoSplash", "assets/lambdadelta/LambdaDuoSplash.png"],
    ["bernDuoSplash", "assets/bernkastel/BernDuoSplash.png"],
    ["bernCat", "assets/bernkastel/BernCatSheet (2).png"]
  ].map(([name, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      effectImages[name] = name === "beatriceStake" || name === "beatriceTowers" || name.startsWith("asmo") || name.startsWith("beelzebub") || name.startsWith("leviathan") || name.startsWith("satan") || name.startsWith("belphegor") ? removeWhiteBackground(img) : img;
      resolve();
    };
    img.src = src;
  }));
  return Promise.all([...spriteLoads, ...lambdaLoads, ...bernLoads, ...goatLoads, ...beatriceLoads, ...portraitLoads, ...tutorialPortraitLoads, ...effectLoads]).then(() => {
    alignGoatIdleFrames();
    prepareBernCatSheet();
  });
}

function prepareBernCatSheet() {
  const img = effectImages.bernCat;
  if (!img) return;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const pixels = g.getImageData(0, 0, c.width, c.height);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const gValue = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, gValue, b);
    const min = Math.min(r, gValue, b);
    const saturation = max - min;
    const nearlyBlackMatte = max < 4 && data[i + 3] > 245;
    if (nearlyBlackMatte || min > 132 && saturation < 124) {
      data[i + 3] = 0;
    }
  }
  g.putImageData(pixels, 0, 0);
  effectImages.bernCat = c;

  bernCatFrameBounds.length = 0;
  bernCatFrameAnchors.length = 0;
  for (let frameIndex = 0; frameIndex < BERN_CAT_WALK_FRAMES.length; frameIndex++) {
    const sheetIndex = BERN_CAT_WALK_FRAMES[frameIndex];
    const sx = (sheetIndex % BERN_CAT_SHEET_COLS) * BERN_CAT_SHEET_CELL;
    const sy = Math.floor(sheetIndex / BERN_CAT_SHEET_COLS) * BERN_CAT_SHEET_CELL;
    const visited = new Uint8Array(BERN_CAT_SHEET_CELL * BERN_CAT_SHEET_CELL);
    let best = null;
    for (let y = 0; y < BERN_CAT_SHEET_CELL; y++) {
      for (let x = 0; x < BERN_CAT_SHEET_CELL; x++) {
        const startLocal = y * BERN_CAT_SHEET_CELL + x;
        if (visited[startLocal]) continue;
        const px = sx + x;
        const py = sy + y;
        if (px >= c.width || py >= c.height) continue;
        if (data[(py * c.width + px) * 4 + 3] <= 18) continue;
        const stack = [[x, y]];
        visited[startLocal] = 1;
        let minX = x;
        let minY = y;
        let maxX = x + 1;
        let maxY = y + 1;
        let count = 0;
        while (stack.length) {
          const [cx, cy] = stack.pop();
          count += 1;
          minX = Math.min(minX, cx);
          minY = Math.min(minY, cy);
          maxX = Math.max(maxX, cx + 1);
          maxY = Math.max(maxY, cy + 1);
          const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
          for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= BERN_CAT_SHEET_CELL || ny >= BERN_CAT_SHEET_CELL) continue;
            const local = ny * BERN_CAT_SHEET_CELL + nx;
            if (visited[local]) continue;
            visited[local] = 1;
            const npx = sx + nx;
            const npy = sy + ny;
            if (npx >= c.width || npy >= c.height) continue;
            if (data[(npy * c.width + npx) * 4 + 3] <= 18) continue;
            stack.push([nx, ny]);
          }
        }
        if (!best || count > best.count) best = { minX, minY, maxX, maxY, count };
      }
    }
    if (best) {
      const pad = 3;
      const minX = Math.max(0, best.minX - pad);
      const minY = Math.max(0, best.minY - pad);
      const maxX = Math.min(BERN_CAT_SHEET_CELL, best.maxX + pad);
      const maxY = Math.min(BERN_CAT_SHEET_CELL, best.maxY + pad);
      bernCatFrameBounds.push([sx + minX, sy + minY, maxX - minX, maxY - minY]);
      let footSum = 0;
      let footCount = 0;
      for (let y = Math.max(0, best.maxY - 14); y < best.maxY; y++) {
        for (let x = best.minX; x < best.maxX; x++) {
          const px = sx + x;
          const py = sy + y;
          if (px >= c.width || py >= c.height) continue;
          if (data[(py * c.width + px) * 4 + 3] <= 18) continue;
          footSum += x;
          footCount += 1;
        }
      }
      bernCatFrameAnchors.push({
        x: (footCount ? footSum / footCount : (best.minX + best.maxX) * 0.5) - minX,
        y: best.maxY - minY
      });
    } else {
      bernCatFrameBounds.push([sx, sy, BERN_CAT_SHEET_CELL, BERN_CAT_SHEET_CELL]);
      bernCatFrameAnchors.push({ x: BERN_CAT_SHEET_CELL * 0.5, y: BERN_CAT_SHEET_CELL });
    }
  }
}

function alignGoatIdleFrames() {
  const uniqueIdleFrames = [...new Set(goatFrames.idle)];
  const anchors = uniqueIdleFrames.map((id) => {
    const img = goatImages[id];
    const bounds = goatFrameBounds[id];
    if (!img || !bounds) return null;
    const footAnchor = imageBottomFootAnchor(img);
    return {
      id,
      center: footAnchor.x,
      foot: footAnchor.y,
      width: bounds[2] - bounds[0],
      height: bounds[3] - bounds[1]
    };
  }).filter(Boolean);
  if (!anchors.length) return;
  goatIdleAnchor = {
    center: anchors.reduce((sum, anchor) => sum + anchor.center, 0) / anchors.length,
    foot: Math.max(...anchors.map((anchor) => anchor.foot))
  };
  for (const anchor of anchors) {
    goatIdleFrameAnchors[anchor.id] = {
      x: (goatIdleAnchor.center - anchor.center) * 1.22,
      y: (goatIdleAnchor.foot - anchor.foot) * 1.22
    };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function constrainLaneToBeatriceWalls(y) {
  if (!beatriceBoss.active || !beatriceBoss.wallsActive) return y;
  return clamp(y, beatriceBoss.wallTop + 8, beatriceBoss.wallBottom - 8);
}

function rectsTouch(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isPlayerInvulnerable() {
  return player.invuln > 0 || player.konpeitoGlowPending || player.konpeitoGlowTimer > 0 || player.action === "duoCharge" || duoAttack.active;
}

function bernHazardInterval() {
  return BERN_REVIVE_HAZARD_TEST_MODE ? BERN_REVIVE_HAZARD_TEST_INTERVAL : BERN_REVIVE_HAZARD_INTERVAL;
}

function bernHazardCanSpawn() {
  return BERN_REVIVE_HAZARD_ENABLED && (player.plumTeaBurned || BERN_REVIVE_HAZARD_TEST_MODE);
}

function isBernHazardActive() {
  return bernCompanion.active && bernCompanion.state.startsWith("hazard");
}

function hasBernLambdaDuo() {
  return player.resolve >= 100
    && player.konpeitoActive
    && player.plumTeaActive
    && !player.plumTeaBurned
    && lambdaCompanion.active
    && bernCompanion.active
    && lambdaCompanion.summoned
    && bernCompanion.summoned
    && !isBernHazardActive()
    && lambdaCompanion.state !== "gameOver"
    && bernCompanion.state !== "sacrifice";
}

function removeCompanionItem(type) {
  player.itemOrder = player.itemOrder.filter((item) => item !== type);
}

function baseAction(action) {
  return action.replace(/\d$/, "");
}

function isPlayerComboAttack(action) {
  return /^(punch|kick)[123]$/.test(action);
}

function isPlayerAtTopRunSpeed() {
  return player.runState === "running" && player.runCharge >= 0.98;
}

function nextComboAction(kind) {
  const stage = clamp(player.comboStep + 1, 1, 3);
  return `${kind}${stage}`;
}

function resetPlayerCombo() {
  player.comboStep = 0;
  player.comboTimer = 0;
  player.comboQueuedKind = "";
}

function resetAttackHolds() {
  for (const hold of Object.values(attackHolds)) {
    hold.down = false;
    hold.timer = 0;
    hold.triggered = false;
  }
}

function eagleCrestLevelScale() {
  const level = clamp(player.oneWingedEagleLevel || 0, 1, EAGLE_CREST_MAX_LEVEL);
  const t = (level - 1) / Math.max(1, EAGLE_CREST_MAX_LEVEL - 1);
  return EAGLE_CREST_MIN_RANGE_SCALE + (1 - EAGLE_CREST_MIN_RANGE_SCALE) * t;
}

function chooseItemDrop() {
  const entries = Object.entries(ITEM_DROP_RATES).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (!total) return null;
  let roll = Math.random() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

function maybeDropEnemyItem(enemy) {
  if (waveMode === "boss") return;
  if (Math.random() > GLOBAL_ENEMY_DROP_RATE) return;
  const type = chooseItemDrop();
  if (!type) return;
  spawnItemBottle(type, enemy.x, enemy.y);
}

function spawnPickup(type, x, y) {
  pickups.push({
    type,
    x,
    y,
    bob: Math.random() * Math.PI * 2,
    life: 18
  });
}

function maybeAmuseBernkastel() {
  if (!isBernHazardActive()) return;
  const chance = BERN_HAZARD_AMUSE_BASE_CHANCE + player.bernHazardAmuseKills * BERN_HAZARD_AMUSE_KILL_BONUS;
  if (Math.random() < chance) {
    player.bernHazardAmuseKills = 0;
    player.plumTeaBurned = false;
    player.plumTeaActive = false;
    player.itemOrder = player.itemOrder.filter((type) => type !== "plumTea");
    bernCompanion.summoned = false;
    message = "The witch is amused";
    messageTimer = 2.2;
  } else {
    player.bernHazardAmuseKills += 1;
  }
}

function defeatEnemy(enemy) {
  if (enemy.dead) return;
  const resolvesBeatriceTrial = enemy.bossMechanic === "beatriceGoatTrial";
  const wasAirborne = enemy.airborne;
  enemy.dead = true;
  enemy.knockedDown = false;
  enemy.hurt = 0;
  enemy.attack = 0;
  enemy.anim = 0;
  if (!wasAirborne) {
    enemy.airborne = false;
    enemy.z = 0;
    enemy.launchSource = "";
    enemy.juggleCount = 0;
  }
  if (enemy.type === "goat") {
    enemy.goatAction = "defeat";
    enemy.goatHasHit = false;
    enemy.goatParryFailed = false;
    enemy.goatParryFailFade = 0;
    enemy.goatArmorFlash = 0;
    enemy.anim = 0;
    enemy.fall = GOAT_DEFEAT_FADE_DURATION;
  } else {
    enemy.fall = ENEMY_DEFEAT_FADE_DURATION;
  }
  maybeAmuseBernkastel();
  maybeDropEnemyItem(enemy);
  runStats.enemiesDefeated += 1;
  score += 250;
  if (resolvesBeatriceTrial) resolveBeatriceGoatTrial();
}

function absorbEnemyIntoDuoSingularity(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.airborne = false;
  enemy.knockedDown = false;
  enemy.hurt = 0;
  enemy.attack = 0;
  enemy.anim = 0;
  enemy.z = 0;
  enemy.launchSource = "";
  enemy.juggleCount = 0;
  enemy.fall = 0;
  enemy.duoAbsorb = 1;
  enemy.duoSlamDamage = 0;
  runStats.enemiesDefeated += 1;
  score += 250;
}

function activatePickup(pickup) {
  runStats.itemsPickedUp += 1;
  if (!player.itemOrder.includes(pickup.type)) {
    player.itemOrder.push(pickup.type);
  }
  if (pickup.type === "crystalShard") {
    acquireCrystalShardStack();
    message = "Crystal Shard";
  } else if (pickup.type === "konpeito") {
    const firstSummon = !lambdaCompanion.summoned;
    player.konpeitoActive = true;
    if (firstSummon) summonLambda();
    else {
      addLambdaKonpeitoCharge(100);
      triggerLambdaKonpeito(true);
    }
    message = "Konpeito";
  } else if (pickup.type === "plumTea") {
    if (player.plumTeaBurned) {
      message = "The tea has gone cold...";
      messageTimer = 1.1;
      return;
    }
    const firstSummon = !bernCompanion.summoned;
    player.plumTeaActive = true;
    if (firstSummon) summonBernkastel();
    else {
      addBernCrystalCharge(100);
      triggerBernCrystalAttack(true);
    }
    message = "Plum Tea";
  } else if (pickup.type === "oneWingedEagle") {
    player.oneWingedEagleActive = true;
    player.oneWingedEagleLevel = clamp((player.oneWingedEagleLevel || 0) + 1, 1, EAGLE_CREST_MAX_LEVEL);
    message = "One-Winged Eagle Crest";
  }
  messageTimer = 1.1;
  showItemTutorial(pickup.type);
}

function debugGrantStartingPlumTea() {
  if (!DEBUG_START_WITH_PLUM_TEA) return;
  player.plumTeaActive = true;
  player.plumTeaBurned = false;
  if (!player.itemOrder.includes("plumTea")) player.itemOrder.push("plumTea");
  if (player.seenItemTutorials && typeof player.seenItemTutorials.add === "function") {
    player.seenItemTutorials.add("plumTea");
  }
  if (!bernCompanion.summoned) summonBernkastel();
  message = "Plum Tea";
  messageTimer = 1.1;
}

function debugGrantStartingKonpeito() {
  if (!DEBUG_START_WITH_KONPEITO) return;
  player.konpeitoActive = true;
  if (!player.itemOrder.includes("konpeito")) player.itemOrder.push("konpeito");
  if (player.seenItemTutorials && typeof player.seenItemTutorials.add === "function") {
    player.seenItemTutorials.add("konpeito");
  }
  if (!lambdaCompanion.summoned) summonLambda();
  message = "Konpeito";
  messageTimer = 1.1;
}

function showItemTutorial(type) {
  if (!ITEM_TUTORIALS[type]) return;
  if (!player.seenItemTutorials || typeof player.seenItemTutorials.has !== "function") {
    player.seenItemTutorials = new Set();
  }
  if (player.seenItemTutorials.has(type)) return;
  player.seenItemTutorials.add(type);
  itemTutorial.active = true;
  itemTutorial.type = type;
  itemTutorial.previousState = state === "playing" ? "playing" : state;
  itemTutorial.dismissDelay = 0.3;
  state = "itemTutorial";
  keys.clear();
  resetAttackHolds();
}

function dismissItemTutorial() {
  if (!itemTutorial.active) return;
  if (itemTutorial.dismissDelay > 0) return;
  itemTutorial.active = false;
  itemTutorial.type = "";
  itemTutorial.dismissDelay = 0;
  state = itemTutorial.previousState || "playing";
  if (state === "itemTutorial") state = "playing";
  keys.clear();
  resetAttackHolds();
}

function livingEnemies() {
  return enemies.filter((enemy) => !enemy.dead);
}

function nearestEnemyTo(x, y) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist < nearestDist) {
      nearest = enemy;
      nearestDist = dist;
    }
  }
  return nearest;
}

function strongestEnemyTo(x, y) {
  let strongest = null;
  let bestHp = -Infinity;
  let bestDist = -Infinity;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (enemy.hp > bestHp || (enemy.hp === bestHp && dist > bestDist)) {
      strongest = enemy;
      bestHp = enemy.hp;
      bestDist = dist;
    }
  }
  return strongest;
}

function companionChargeCooldown(charge, interval) {
  if (charge >= 100) return 0;
  return interval * (1 - clamp(charge / 100, 0, 1));
}

function addLambdaKonpeitoCharge(amount = 100) {
  lambdaCompanion.konpeitoCharge = Math.max(0, (lambdaCompanion.konpeitoCharge || 0) + amount);
  lambdaCompanion.konpeitoTimer = companionChargeCooldown(lambdaCompanion.konpeitoCharge, LAMBDA_KONPEITO_INTERVAL);
}

function addBernCrystalCharge(amount = 100) {
  bernCompanion.crystalChargeGauge = Math.max(0, (bernCompanion.crystalChargeGauge || 0) + amount);
  bernCompanion.crystalTimer = companionChargeCooldown(bernCompanion.crystalChargeGauge, BERN_CRYSTAL_INTERVAL);
}

function updateLambdaKonpeitoCharge(dt) {
  if (!player.konpeitoActive || state !== "playing") return;
  if ((lambdaCompanion.konpeitoCharge || 0) < 100) {
    lambdaCompanion.konpeitoCharge = Math.min(100, (lambdaCompanion.konpeitoCharge || 0) + (dt / LAMBDA_KONPEITO_INTERVAL) * 100);
  }
  lambdaCompanion.konpeitoTimer = companionChargeCooldown(lambdaCompanion.konpeitoCharge || 0, LAMBDA_KONPEITO_INTERVAL);
}

function updateBernCrystalGauge(dt) {
  if (!player.plumTeaActive || state !== "playing") return;
  if ((bernCompanion.crystalChargeGauge || 0) < 100) {
    bernCompanion.crystalChargeGauge = Math.min(100, (bernCompanion.crystalChargeGauge || 0) + (dt / BERN_CRYSTAL_INTERVAL) * 100);
  }
  bernCompanion.crystalTimer = companionChargeCooldown(bernCompanion.crystalChargeGauge || 0, BERN_CRYSTAL_INTERVAL);
}

function summonLambda() {
  runStats.companionsEncountered.add("Lambdadelta");
  lambdaCompanion.active = true;
  lambdaCompanion.summoned = true;
  lambdaCompanion.x = clamp(player.x - player.facing * 92, 90, STAGE_W - 130);
  lambdaCompanion.y = clampPlayY(player.y + 18);
  lambdaCompanion.facing = player.facing;
  lambdaCompanion.anim = 0;
  lambdaCompanion.state = "summon";
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.konpeitoCharge = 100;
  lambdaCompanion.konpeitoTimer = 0;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
  spawnKonpeitoGeyser(lambdaCompanion.x, lambdaCompanion.y);
  launchEnemiesFromLambdaSummon(lambdaCompanion.x, lambdaCompanion.y);
  screenFlashTimer = LAMBDA_SUMMON_FLASH_DURATION;
}

function launchEnemiesFromLambdaSummon(x, y) {
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist > LAMBDA_SUMMON_LAUNCH_RADIUS) continue;
    const direction = enemy.x >= x ? 1 : -1;
    launchEnemy(enemy, direction, 410, 150, "lambda:summon");
    burst(enemy.x, enemy.y - 58, "special");
  }
}

function summonBernkastel() {
  runStats.companionsEncountered.add("Bernkastel");
  bernCompanion.active = true;
  bernCompanion.summoned = true;
  bernCompanion.x = clamp(player.x - player.facing * 132, 90, STAGE_W - 130);
  bernCompanion.y = clampBackgroundCompanionY(player.y - 56);
  bernCompanion.facing = player.facing;
  bernCompanion.anim = 0;
  bernCompanion.state = "summon";
  bernCompanion.moveSettle = 0;
  bernCompanion.crystalChargeGauge = 100;
  bernCompanion.crystalTimer = 0;
  bernCompanion.crystalCharge = 0;
  bernCompanion.crystalHasFired = false;
  bernCompanion.queuedCrystal = false;
  bernCompanion.catForm = false;
}

function restoreOwnedCompanionsForNormalWave() {
  if (waveMode !== "normal" || state !== "playing") return;
  if (player.konpeitoActive && !lambdaCompanion.summoned) {
    summonLambda();
  }
  if (player.plumTeaActive && !player.plumTeaBurned && !bernCompanion.summoned) {
    summonBernkastel();
  }
}

function placeBernAboveTarget(target) {
  const targetDir = target.x >= player.x ? 1 : -1;
  bernCompanion.x = clamp(player.x + targetDir * 132, 90, STAGE_W - 130);
  bernCompanion.y = clampPlayY(player.y);
  bernCompanion.facing = target.x >= bernCompanion.x ? 1 : -1;
  bernCompanion.attackTargetX = target.x;
  bernCompanion.attackTargetY = target.y;
}

function placeBernAtFollowPosition() {
  bernCompanion.x = clamp(player.x - player.facing * 132, 90, STAGE_W - 130);
  bernCompanion.y = clampBackgroundCompanionY(player.y - 56);
  const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
  bernCompanion.facing = strongest ? (strongest.x >= bernCompanion.x ? 1 : -1) : player.facing;
}

function startBernCrystalAttack(force = false) {
  if (!bernCompanion.active || state !== "playing") return false;
  if (bernCompanion.state === "summon") return false;
  if ((bernCompanion.crystalChargeGauge || 0) < 100) return false;
  const target = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
  if (!target) {
    bernCompanion.crystalChargeGauge = Math.max(100, bernCompanion.crystalChargeGauge || 100);
    bernCompanion.crystalTimer = 0;
    bernCompanion.crystalCharge = 0;
    return false;
  }
  bernCompanion.crystalChargeGauge = Math.max(0, (bernCompanion.crystalChargeGauge || 0) - 100);
  bernCompanion.crystalTimer = companionChargeCooldown(bernCompanion.crystalChargeGauge, BERN_CRYSTAL_INTERVAL);
  bernCompanion.attackTargetX = target.x;
  bernCompanion.attackTargetY = target.y;
  bernCompanion.facing = target.x >= bernCompanion.x ? 1 : -1;
  if (bernCompanion.catForm) {
    bernCompanion.state = "catFadeOut";
    bernCompanion.anim = 0;
    bernCompanion.moveSettle = 0;
    bernCompanion.crystalCharge = 0;
    bernCompanion.crystalHasFired = false;
    return true;
  }
  bernCompanion.catForm = false;
  bernCompanion.state = "teleportOut";
  bernCompanion.anim = 0;
  bernCompanion.moveSettle = 0;
  bernCompanion.crystalCharge = 0;
  bernCompanion.crystalHasFired = false;
  return true;
}

function bernIsCrystalAttacking() {
  return bernCompanion.state === "catFadeOut"
    || bernCompanion.state === "catFadeIn"
    || bernCompanion.state === "teleportOut"
    || bernCompanion.state === "teleportIn"
    || bernCompanion.state === "crystalCharge"
    || bernCompanion.state === "teleportBackOut"
    || bernCompanion.state === "teleportBackIn";
}

function queueBernCrystalAttack() {
  if (!bernCompanion.active || state !== "playing") return false;
  if (!strongestEnemyTo(bernCompanion.x, bernCompanion.y)) {
    bernCompanion.crystalChargeGauge = Math.max(100, bernCompanion.crystalChargeGauge || 100);
    bernCompanion.crystalTimer = 0;
  }
  return true;
}

function beginQueuedBernCrystalBarrage() {
  if ((bernCompanion.crystalChargeGauge || 0) < 100) return false;
  const target = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
  if (!target) {
    bernCompanion.state = "teleportBackOut";
    bernCompanion.anim = 0;
    bernCompanion.crystalChargeGauge = Math.max(100, bernCompanion.crystalChargeGauge || 100);
    bernCompanion.crystalTimer = 0;
    return false;
  }
  bernCompanion.crystalChargeGauge = Math.max(0, (bernCompanion.crystalChargeGauge || 0) - 100);
  bernCompanion.crystalTimer = companionChargeCooldown(bernCompanion.crystalChargeGauge, BERN_CRYSTAL_INTERVAL);
  bernCompanion.catForm = false;
  bernCompanion.attackTargetX = target.x;
  bernCompanion.attackTargetY = target.y;
  bernCompanion.facing = target.x >= bernCompanion.x ? 1 : -1;
  bernCompanion.state = "crystalCharge";
  bernCompanion.anim = 0;
  bernCompanion.crystalCharge = BERN_CRYSTAL_CHARGE_TIME;
  bernCompanion.crystalHasFired = false;
  return true;
}

function triggerBernCrystalAttack(force = false) {
  if (bernIsCrystalAttacking()) return queueBernCrystalAttack();
  return startBernCrystalAttack(force);
}

function maybeBernCatForm() {
  const chance = DEBUG_FORCE_BERN_CAT_FORM ? 1 : BERN_CAT_FORM_CHANCE;
  bernCompanion.catForm = BERN_CAT_FORM_ENABLED && Math.random() < chance;
}

function fireBernColumnCrystals() {
  const target = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
  if (target) {
    bernCompanion.attackTargetX = target.x;
    bernCompanion.attackTargetY = target.y;
    bernCompanion.facing = target.x >= bernCompanion.x ? 1 : -1;
  }
  const layout = bernBarrageShardLayout();
  for (let i = 0; i < layout.length; i++) {
    const shard = layout[i];
    const startZ = 250 + i * 20;
    crystalShards.push({
      x: shard.startX,
      y: shard.startY + startZ + 24,
      targetX: shard.targetX,
      targetY: shard.targetY,
      z: startZ,
      startZ,
      speed: 1020,
      delay: i * 0.055,
      source: "bern",
      shockwaveDamage: BERN_CRYSTAL_SHOCKWAVE_DAMAGE,
      hit: false
    });
  }
  spawnBernShardStackRain(target || strongestEnemyTo(bernCompanion.x, bernCompanion.y));
}

function bernBarrageShardLayout() {
  const side = bernCompanion.facing || 1;
  const lineStartX = bernCompanion.x + side * 54;
  const lineStartY = clampPlayY(bernCompanion.y - 24);
  const targetX = bernCompanion.attackTargetX || lineStartX + side * 220;
  const targetY = bernCompanion.attackTargetY || bernCompanion.y;
  const placements = [0.12, 0.34, 0.56, 0.78, 1];
  return placements.map((t, i) => {
    const arcT = i / (placements.length - 1);
    const startX = bernCompanion.x + side * (-64 + arcT * 128);
    const startY = bernCompanion.y - BERN_BARRAGE_ARC_HEIGHT - Math.sin(arcT * Math.PI) * BERN_BARRAGE_ARC_LIFT;
    return {
      startX,
      startY,
      targetX: clamp(lineStartX + (targetX - lineStartX) * t, 80, STAGE_W - 120),
      targetY: clampPlayY(lineStartY + (targetY - lineStartY) * t)
    };
  });
}

function spawnBernShardStackRain(primaryTarget) {
  const stackCount = Array.isArray(player.crystalShardStacks) ? player.crystalShardStacks.length : 0;
  if (!stackCount) return;
  const targets = livingEnemies();
  if (!targets.length) return;
  for (let i = 0; i < stackCount; i++) {
    const target = i === 0 && primaryTarget && !primaryTarget.dead
      ? primaryTarget
      : targets[Math.floor(Math.random() * targets.length)];
    const spread = (i - (stackCount - 1) * 0.5) * 34 + (Math.random() - 0.5) * 26;
    const spawnOffsetX = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 220);
    const spawnOffsetY = -34 + Math.random() * 68;
    const targetX = clamp(target.x + spread, 80, STAGE_W - 120);
    const targetY = clampPlayY(target.y + (Math.random() - 0.5) * 42);
    crystalShards.push({
      x: targetX + spawnOffsetX,
      y: targetY + spawnOffsetY,
      targetX,
      targetY,
      z: 520 + i * 22,
      startZ: 520 + i * 22,
      speed: CRYSTAL_SHARD_FALL_SPEED + 150,
      delay: i * 0.07,
      source: "bern",
      shockwaveDamage: BERN_CRYSTAL_SHOCKWAVE_DAMAGE,
      hit: false
    });
  }
}

function startBernHazardAttack() {
  if (!bernHazardCanSpawn() || state !== "playing" || bernCompanion.active) return false;
  const preferredSide = player.facing || 1;
  let side = preferredSide;
  let x = player.x + side * 260;
  const minVisibleX = cameraX + 110;
  const maxVisibleX = cameraX + W - 110;
  if (x < minVisibleX || x > maxVisibleX) {
    side *= -1;
    x = player.x + side * 260;
  }
  bernCompanion.active = true;
  bernCompanion.summoned = false;
  bernCompanion.x = clamp(clamp(x, minVisibleX, maxVisibleX), 90, STAGE_W - 130);
  bernCompanion.y = clampPlayY(player.y);
  bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
  bernCompanion.attackTargetX = player.x;
  bernCompanion.attackTargetY = player.y;
  bernCompanion.anim = 0;
  bernCompanion.state = "hazardTeleportIn";
  bernCompanion.crystalCharge = BERN_CRYSTAL_CHARGE_TIME;
  bernCompanion.crystalHasFired = false;
  bernCompanion.moveSettle = 0;
  bernCompanion.parryClock = 0;
  bernCompanion.parryZ = 0;
  bernCompanion.parryVx = 0;
  bernCompanion.parryVz = 0;
  bernCompanion.parryFade = 0;
  bernCompanion.parryFailed = false;
  bernCompanion.parryFailFade = 0;
  return true;
}

function fireBernHazardCrystals() {
  bernCompanion.attackTargetX = player.x;
  bernCompanion.attackTargetY = player.y;
  bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
  const startX = bernCompanion.x + bernCompanion.facing * 44;
  const startY = bernCompanion.y - 34;
  const predictedX = clamp(player.x + player.vx * 0.55, 80, STAGE_W - 120);
  const predictedY = clampPlayY(player.y + player.vy * 0.55);
  const lineDx = predictedX - startX;
  const lineDy = predictedY - startY;
  const lineLen = Math.hypot(lineDx, lineDy) || 1;
  const extend = 150;
  const targetX = clamp(predictedX + (lineDx / lineLen) * extend, 80, STAGE_W - 120);
  const targetY = clampPlayY(predictedY + (lineDy / lineLen) * extend);
  const placements = [0.18, 0.42, 0.66, 0.88, 1];
  for (let i = 0; i < placements.length; i++) {
    const t = placements[i];
    crystalShards.push({
      x: startX,
      y: startY,
      targetX: startX + (targetX - startX) * t,
      targetY: clampPlayY(startY + (targetY - startY) * t),
      z: 260 + i * 18,
      startZ: 260 + i * 18,
      speed: 1080,
      delay: i * 0.12,
      source: "bernHazard",
      hit: false
    });
  }
}

function startDuoAttack() {
  if (!hasBernLambdaDuo() || duoAttack.active) return false;
  runStats.duoAttacksUnleashed += 1;
  duoAttack.active = true;
  duoAttack.timer = 0;
  duoAttack.angle = 0;
  duoAttack.detonated = false;
  duoAttack.centerX = clamp(cameraX + W * 0.5, 180, STAGE_W - 180);
  duoAttack.centerY = clamp(player.y - 28, PLAY_AREA_TOP - 18, PLAY_AREA_BOTTOM - 30);
  duoAttack.singularityX = duoAttack.centerX;
  duoAttack.singularityY = duoAttack.centerY - 340;
  duoAttack.side = 1;
  duoAttack.lambdaEndX = duoAttack.centerX;
  duoAttack.bernEndX = clamp(cameraX + 118, 80, STAGE_W - 80);
  duoAttack.lambdaStartX = lambdaCompanion.x || player.x - 72;
  duoAttack.lambdaStartY = lambdaCompanion.y || player.y;
  duoAttack.bernStartX = bernCompanion.x || player.x + 72;
  duoAttack.bernStartY = bernCompanion.y || player.y;
  duoAttack.vanishFlash = false;
  duoAttack.shardTimer = 0;
  duoAttack.lambdaSplashTimer = 0;
  duoAttack.lambdaSplashShown = false;
  duoAttack.lambdaExitStarted = false;
  duoAttack.bernExitStarted = false;
  duoAttack.stageComplete = false;
  duoAttack.crystalShots = [];
  duoAttack.shardIndex = 0;
  duoAttack.lambdaLockedFacing = duoAttack.bernEndX >= duoAttack.centerX ? 1 : -1;
  player.duoCharge = DUO_CHARGE_TIME;
  player.resolve = 0;
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.currentAttack = "";
  resetPlayerCombo();
  player.action = "duoBeamPose";
  player.anim = 0;
  player.attackHasHit = false;
  lambdaCompanion.active = true;
  lambdaCompanion.state = "move";
  lambdaCompanion.anim = 0;
  lambdaCompanion.queuedKonpeito = false;
  lambdaCompanion.x = duoAttack.lambdaStartX;
  lambdaCompanion.y = duoAttack.lambdaStartY;
  bernCompanion.active = true;
  bernCompanion.state = "move";
  bernCompanion.anim = 0;
  bernCompanion.queuedCrystal = false;
  bernCompanion.catForm = false;
  bernCompanion.x = duoAttack.bernStartX;
  bernCompanion.y = duoAttack.bernStartY;
  message = "Duo Attack";
  messageTimer = 1.2;
  screenShakeTimer = 0.3;
  return true;
}

function finishDuoAttack() {
  duoAttack.active = false;
  duoAttack.timer = 0;
  duoAttack.vanishFlash = false;
  duoAttack.lambdaSplashTimer = 0;
  duoAttack.lambdaSplashShown = false;
  duoAttack.lambdaExitStarted = false;
  duoAttack.bernExitStarted = false;
  duoAttack.stageComplete = false;
  duoAttack.crystalShots = [];
  duoAttack.shardIndex = 0;
  player.duoCharge = 0;
  player.konpeitoActive = false;
  player.plumTeaActive = false;
  player.plumTeaBurned = false;
  player.currentAttack = "";
  player.attackLock = 0;
  setAction("idle");
  removeCompanionItem("konpeito");
  removeCompanionItem("plumTea");
  lambdaCompanion.active = false;
  lambdaCompanion.summoned = false;
  lambdaCompanion.state = "idle";
  lambdaCompanion.anim = 0;
  bernCompanion.active = false;
  bernCompanion.summoned = false;
  bernCompanion.state = "idle";
  bernCompanion.anim = 0;
}

function updateDuoCharge(dt) {
  if (duoAttack.active) return;
  if (!keys.has("q") || !hasBernLambdaDuo()) {
    player.duoCharge = Math.max(0, player.duoCharge - dt * 2.8);
    if (player.action === "duoCharge") setAction("idle");
    return;
  }
  if (player.attackLock <= 0 && !player.airborne && !player.knockedDown) {
    if (player.action !== "duoCharge") {
      player.action = "duoCharge";
      player.anim = 0;
      player.attackHasHit = false;
      player.attackLungeRemaining = 0;
      player.currentAttack = "";
    }
    player.anim = Math.min(frames.duoCharge.length - 0.01, player.anim + dt * 8);
  }
  player.duoCharge = Math.min(DUO_CHARGE_TIME, player.duoCharge + dt);
  if (player.duoCharge >= DUO_CHARGE_TIME) startDuoAttack();
}

function updateResolveDuoOutline() {
  const fill = duoAttack.active ? 1 : clamp(player.duoCharge / DUO_CHARGE_TIME, 0, 1);
  if (fill <= 0) {
    resolveMeter.style.boxShadow = "";
    resolveMeter.style.borderColor = "";
    return;
  }
  const glow = 4 + fill * 18;
  resolveMeter.style.borderColor = `rgba(99, 244, 255, ${0.38 + fill * 0.54})`;
  resolveMeter.style.boxShadow = `0 0 0 ${1 + fill * 4}px rgba(83, 239, 255, ${0.12 + fill * 0.22}), 0 0 ${glow}px rgba(78, 239, 255, ${0.24 + fill * 0.36})`;
}

function updateResolveHud(dt = 0) {
  resolveSpendFlashTimer = Math.max(0, resolveSpendFlashTimer - dt);
  const value = clamp(player.resolve, 0, 100);
  const chargeCost = chargedAttackResolveCost();
  resolveBar.style.width = `${value}%`;
  resolveMeter.classList.toggle("resolve-ready", value >= chargeCost && value < 100);
  resolveMeter.classList.toggle("resolve-full", value >= 100);
  resolveMeter.classList.toggle("resolve-building", value > 0 && value < chargeCost);
  const flash = clamp(resolveSpendFlashTimer / 0.34, 0, 1);
  resolveBar.style.setProperty("--resolve-flash", flash.toFixed(3));
}

function detonateDuoAttack() {
  if (duoAttack.detonated) return;
  duoAttack.detonated = true;
  screenShakeTimer = 0.85;
  screenFlashTimer = 0.12;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    beginDuoAbsorb(enemy);
    if (enemy.hp > 0) damageEnemy(enemy, enemy.hp);
    enemy.duoSlamDamage = 0;
  }
  burst(duoAttack.centerX, duoAttack.centerY - 80, "special");
}

function beginDuoAbsorb(enemy) {
  if (!enemy || enemy.dead || enemy.duoAbsorb > 0) return;
  enemy.hurt = 0;
  enemy.attack = 0;
  enemy.airborne = false;
  enemy.knockedDown = false;
  enemy.duoAbsorb = 0.01;
  enemy.duoAbsorbSeed = Math.random() * Math.PI * 2;
  enemy.duoAbsorbStartX = enemy.x;
  enemy.duoAbsorbStartY = enemy.y;
  enemy.duoAbsorbStartZ = enemy.z || 0;
  enemy.duoSlamDamage = 0;
}

function duoBernOrbitShardPosition(index, lead = 0) {
  const angle = duoAttack.angle * 1.8 + index * (Math.PI * 2 / 5) + lead;
  const x = bernCompanion.x + Math.cos(angle) * 58;
  const y = bernCompanion.y - 126 + Math.sin(angle) * 28;
  return { x, y, angle };
}

function spawnDuoCrystalFeed() {
  const orbit = duoBernOrbitShardPosition(duoAttack.shardIndex || 0, 0);
  const startX = orbit.x;
  const startY = orbit.y;
  const targetX = duoAttack.singularityX;
  const targetY = duoAttack.singularityY;
  duoAttack.crystalShots.push({
    x1: startX,
    y1: startY,
    x2: targetX + (Math.random() - 0.5) * 28,
    y2: targetY + (Math.random() - 0.5) * 22,
    life: 0.2,
    max: 0.2,
    spin: Math.random() * Math.PI * 2
  });
  crystalTrails.push({
    x1: startX,
    y1: startY,
    x2: targetX + (Math.random() - 0.5) * 24,
    y2: targetY + (Math.random() - 0.5) * 20,
    life: 0.2,
    max: 0.2,
    width: 5,
    color: "rgba(103, 240, 255, 0.82)"
  });
  duoAttack.shardIndex = ((duoAttack.shardIndex || 0) + 1) % 5;
}

function updateDuoAttack(dt) {
  if (!duoAttack.active) return;
  duoAttack.timer += dt;
  duoAttack.angle += dt * 4.8;
  if (duoAttack.lambdaSplashTimer > 0) duoAttack.lambdaSplashTimer = Math.max(0, duoAttack.lambdaSplashTimer - dt);
  for (let i = duoAttack.crystalShots.length - 1; i >= 0; i--) {
    duoAttack.crystalShots[i].life -= dt;
    if (duoAttack.crystalShots[i].life <= 0) duoAttack.crystalShots.splice(i, 1);
  }
  player.action = "duoBeamPose";
  player.attackLock = 0.08;
  player.attackLungeRemaining = 0;
  player.anim += dt * 12;
  const stageT = clamp(duoAttack.timer / DUO_STAGE_DURATION, 0, 1);
  const stageEase = stageT * stageT * (3 - 2 * stageT);
  if (duoAttack.timer < DUO_STAGE_DURATION) {
    lambdaCompanion.state = "move";
    bernCompanion.state = "move";
    lambdaCompanion.anim += dt * 8.5;
    bernCompanion.anim += dt * 8.5;
    lambdaCompanion.x = clamp(duoAttack.lambdaStartX + (duoAttack.centerX - duoAttack.lambdaStartX) * stageEase, 80, STAGE_W - 80);
    lambdaCompanion.y = clamp(duoAttack.lambdaStartY + (duoAttack.centerY - duoAttack.lambdaStartY) * stageEase - Math.sin(stageT * Math.PI) * 42, PLAY_AREA_TOP - 76, PLAY_AREA_BOTTOM - 14);
    bernCompanion.x = clamp(duoAttack.bernStartX + (duoAttack.bernEndX - duoAttack.bernStartX) * stageEase, 80, STAGE_W - 80);
    bernCompanion.y = clamp(duoAttack.bernStartY + (duoAttack.centerY - duoAttack.bernStartY) * stageEase - Math.sin(stageT * Math.PI) * 58, PLAY_AREA_TOP - 96, PLAY_AREA_BOTTOM - 14);
    lambdaCompanion.facing = bernCompanion.x >= lambdaCompanion.x ? 1 : -1;
    bernCompanion.facing = duoAttack.bernEndX >= bernCompanion.x ? 1 : -1;
    return;
  }
  if (!duoAttack.stageComplete) {
    duoAttack.stageComplete = true;
    lambdaCompanion.state = "duoAttack";
    bernCompanion.state = "duoAttack";
    lambdaCompanion.anim = 0;
    bernCompanion.anim = 0;
    duoAttack.angle = 0;
  }
  const attackTimer = duoAttack.timer - DUO_STAGE_DURATION;
  const setupDuration = 0.8;
  const singularityStarts = 2.1;
  const exitT = clamp((attackTimer - DUO_SPIRAL_DURATION) / Math.max(0.1, DUO_HOLD_DURATION), 0, 1);
  const attackT = clamp((attackTimer - singularityStarts) / Math.max(0.1, DUO_SPIRAL_DURATION - singularityStarts), 0, 1);
  const setupT = clamp(attackTimer / setupDuration, 0, 1);
  const bernHoverY = duoAttack.singularityY + 108;
  const bernRiseT = clamp((attackTimer - singularityStarts + 0.08) / 0.58, 0, 1);
  const bernLowerStart = DUO_SPIRAL_DURATION + DUO_HOLD_DURATION - 0.52;
  const bernLowerT = clamp((attackTimer - bernLowerStart) / 0.52, 0, 1);
  const bernAirT = bernRiseT * (1 - bernLowerT);
  const isSpiral = attackTimer < DUO_SPIRAL_DURATION;
  const isHold = attackTimer >= DUO_SPIRAL_DURATION && attackTimer < DUO_SPIRAL_DURATION + DUO_HOLD_DURATION;
  const lambdaExitStart = DUO_SPIRAL_DURATION + DUO_HOLD_DURATION;
  const lambdaExitEnd = lambdaExitStart + DUO_LAMBDA_VANISH_DURATION;
  const bernExitStart = lambdaExitEnd + DUO_BERN_EXIT_DELAY;
  const isLambdaVanish = attackTimer >= lambdaExitStart && attackTimer < lambdaExitEnd;
  const isBernDelay = attackTimer >= lambdaExitEnd && attackTimer < bernExitStart;
  const isBernVanish = attackTimer >= bernExitStart;

  if (isSpiral) {
    lambdaCompanion.x = duoAttack.centerX;
    lambdaCompanion.y = clamp(duoAttack.centerY - Math.sin(setupT * Math.PI) * 46, PLAY_AREA_TOP - 56, PLAY_AREA_BOTTOM - 14);
    bernCompanion.x = clamp(duoAttack.bernEndX, 80, STAGE_W - 80);
    bernCompanion.y = duoAttack.centerY + (bernHoverY - duoAttack.centerY) * bernAirT;
  } else if (isHold) {
    lambdaCompanion.x = clamp(duoAttack.centerX + (duoAttack.lambdaEndX - duoAttack.centerX) * exitT, 80, STAGE_W - 80);
    lambdaCompanion.y = duoAttack.centerY;
    bernCompanion.x = clamp(duoAttack.bernEndX, 80, STAGE_W - 80);
    bernCompanion.y = duoAttack.centerY + (bernHoverY - duoAttack.centerY) * bernAirT;
  } else {
    lambdaCompanion.x = duoAttack.lambdaEndX;
    lambdaCompanion.y = duoAttack.centerY;
    bernCompanion.x = clamp(duoAttack.bernEndX, 80, STAGE_W - 80);
    bernCompanion.y = duoAttack.centerY;
  }
  lambdaCompanion.facing = attackTimer >= singularityStarts ? duoAttack.lambdaLockedFacing : bernCompanion.x >= lambdaCompanion.x ? 1 : -1;
  bernCompanion.facing = lambdaCompanion.x >= bernCompanion.x ? 1 : -1;

  if (isLambdaVanish) {
    if (!duoAttack.lambdaExitStarted) {
      duoAttack.lambdaExitStarted = true;
      lambdaCompanion.anim = 0;
    }
    lambdaCompanion.state = "summon";
    lambdaCompanion.anim += dt * (lambdaFrames.summon.length / DUO_LAMBDA_VANISH_DURATION);
    const vanishT = clamp((attackTimer - lambdaExitStart) / DUO_LAMBDA_VANISH_DURATION, 0, 1);
    if (!duoAttack.vanishFlash && vanishT >= 0.08) {
      duoAttack.vanishFlash = true;
      screenFlashTimer = DUO_LAMBDA_VANISH_DURATION + 0.14;
    }
    if (vanishT >= 0.45) lambdaCompanion.active = false;
  } else if (isBernDelay || isBernVanish) {
    lambdaCompanion.active = false;
  } else {
    lambdaCompanion.state = "duoAttack";
    lambdaCompanion.anim += dt * 8;
    if (!duoAttack.lambdaSplashShown) {
      const frameIndex = Math.floor(lambdaCompanion.anim);
      const frame = frameIndex < lambdaFrames.duoAttack.length
        ? lambdaFrames.duoAttack[frameIndex]
        : lambdaFrames.duoAttackLoop[(frameIndex - lambdaFrames.duoAttack.length) % lambdaFrames.duoAttackLoop.length];
      if (frame === 678) {
        duoAttack.lambdaSplashShown = true;
        duoAttack.lambdaSplashTimer = LAMBDA_DUO_SPLASH_DURATION;
        screenShakeTimer = Math.max(screenShakeTimer, 0.18);
      }
    }
  }

  if (isBernVanish) {
    if (!duoAttack.bernExitStarted) {
      duoAttack.bernExitStarted = true;
      bernCompanion.anim = 0;
    }
    bernCompanion.state = "sacrifice";
    bernCompanion.anim += dt * (bernFrames.sacrifice.length / DUO_BERN_VANISH_DURATION);
  } else {
    bernCompanion.state = "duoAttack";
    if (!isBernDelay) bernCompanion.anim += dt * 10;
  }

  if ((isSpiral || isHold) && attackTimer >= singularityStarts) {
    duoAttack.shardTimer -= dt;
    if (duoAttack.shardTimer <= 0) {
      duoAttack.shardTimer = 0.13;
      spawnDuoCrystalFeed();
    }
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      beginDuoAbsorb(enemy);
      const lift = enemy.z || 0;
      const dx = duoAttack.singularityX - enemy.x;
      const dy = duoAttack.singularityY - (enemy.y - lift);
      const dist = Math.hypot(dx, dy) || 1;
      const absorbing = enemy.duoAbsorb > 0;
      const pull = (absorbing ? 720 : 300) + attackT * (absorbing ? 950 : 720);
      enemy.x = clamp(enemy.x + (dx / dist) * Math.min(pull * dt, dist), 80, STAGE_W - 120);
      enemy.y = clamp(enemy.y + (dy / dist) * Math.min(pull * dt * (absorbing ? 0.5 : 0.28), dist), PLAY_AREA_TOP - 26, PLAY_AREA_BOTTOM);
      enemy.z = Math.max(0, lift + Math.max(0, -dy / dist) * pull * dt * (absorbing ? 0.95 : 0.62));
      if (absorbing) {
        enemy.duoAbsorb = Math.min(1, enemy.duoAbsorb + dt / DUO_ABSORB_DURATION);
        enemy.anim += dt * 14;
        if (enemy.duoAbsorb >= 1) absorbEnemyIntoDuoSingularity(enemy);
      }
      enemy.attack = 0;
      enemy.cooldown = 0.4;
    }
  }
  if (attackTimer >= DUO_SPIRAL_DURATION * 0.86) detonateDuoAttack();
  if (duoAttack.timer >= DUO_DURATION) finishDuoAttack();
}

function bernHazardParryRingRadius() {
  const phase = (bernCompanion.parryClock % BERN_HAZARD_PARRY_CYCLE) / BERN_HAZARD_PARRY_CYCLE;
  return 138 - phase * 96;
}

function bernHazardParryReady() {
  if (!BERN_HAZARD_PARRY_ENABLED || !bernCompanion.active) return false;
  if (bernCompanion.state !== "hazardTeleportIn" && bernCompanion.state !== "hazardCharge") return false;
  if (bernCompanion.parryFailed) return false;
  return Math.abs(bernHazardParryRingRadius() - BERN_HAZARD_PARRY_RING_RADIUS) <= BERN_HAZARD_PARRY_WINDOW;
}

function bernHazardParryIndicatorActive() {
  return BERN_HAZARD_PARRY_ENABLED
    && bernCompanion.active
    && (bernCompanion.state === "hazardTeleportIn" || bernCompanion.state === "hazardCharge")
    && !bernCompanion.parryFailed;
}

function beatriceMeleeKickFrame() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick") return 0;
  return beatriceFrames.meleeKick[Math.min(beatriceFrames.meleeKick.length - 1, Math.floor(beatriceBoss.anim))] || 0;
}

function beatriceMeleeKickParryRingRadius() {
  const activeIndex = beatriceFrames.meleeKick.indexOf(273);
  const t = clamp(beatriceBoss.anim / Math.max(1, activeIndex), 0, 1);
  return BEATRICE_MELEE_KICK_PARRY_START_RADIUS - t * (BEATRICE_MELEE_KICK_PARRY_START_RADIUS - BEATRICE_MELEE_KICK_PARRY_RING_RADIUS);
}

function beatriceMeleeKickTelegraph() {
  const facing = beatriceBoss.facing || 1;
  const front = beatriceBoss.x + facing * 20;
  const x1 = front - (facing < 0 ? BEATRICE_MELEE_KICK_TELEGRAPH_WIDTH : 0);
  return {
    x: x1,
    y: beatriceBoss.y - BEATRICE_MELEE_KICK_TELEGRAPH_DEPTH * 0.5,
    w: BEATRICE_MELEE_KICK_TELEGRAPH_WIDTH,
    h: BEATRICE_MELEE_KICK_TELEGRAPH_DEPTH
  };
}

function playerInBeatriceMeleeKickTelegraph() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick") return false;
  const zone = beatriceMeleeKickTelegraph();
  return player.x >= zone.x
    && player.x <= zone.x + zone.w
    && player.y >= zone.y
    && player.y <= zone.y + zone.h;
}

function playerInBeatriceMeleeKickRange() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick") return false;
  const forward = (player.x - beatriceBoss.x) * beatriceBoss.facing;
  return forward > -24
    && forward <= BEATRICE_MELEE_KICK_RANGE
    && Math.abs(player.y - beatriceBoss.y) <= BEATRICE_MELEE_KICK_DEPTH;
}

function beatriceMeleeKickParryReady() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick" || beatriceBoss.meleeKickParried) return false;
  if (beatriceBoss.meleeKickParryFailed) return false;
  if (!playerInBeatriceMeleeKickTelegraph()) return false;
  return Math.abs(beatriceMeleeKickParryRingRadius() - BEATRICE_MELEE_KICK_PARRY_RING_RADIUS) <= BEATRICE_MELEE_KICK_PARRY_WINDOW;
}

function beatriceMeleeKickParryIndicatorActive() {
  return beatriceBoss.active
    && beatriceBoss.flavor === "meleeKick"
    && !beatriceBoss.meleeKickParried
    && !beatriceBoss.meleeKickParryFailed
    && beatriceMeleeKickFrame() <= 273;
}

function startBernParryCounterPunch(direction) {
  const data = attackData.punch3;
  player.facing = direction;
  player.attackLock = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.currentAttack = "punch3";
  player.attackLungeRemaining = data.lunge || 0;
  player.comboTimer = 0;
  player.comboQueuedKind = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  setAction("punch3", data.lock);
  player.anim = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
}

function tryBernHazardParry() {
  if (!BERN_HAZARD_PARRY_ENABLED || !bernCompanion.active) return false;
  if (bernCompanion.state !== "hazardTeleportIn" && bernCompanion.state !== "hazardCharge") return false;
  if (bernCompanion.parryFailed) return false;
  if (!bernHazardParryReady()) {
    bernCompanion.parryFailed = true;
    bernCompanion.parryFailFade = BERN_HAZARD_PARRY_FAIL_FADE;
    message = "Parry failed";
    messageTimer = 0.55;
    burst(player.x, player.y - 104, "enemy");
    return true;
  }
  const direction = bernCompanion.x >= player.x ? 1 : -1;
  runStats.parriesPerformed += 1;
  startBernParryCounterPunch(direction);
  bernCompanion.state = "hazardParried";
  bernCompanion.anim = 0;
  bernCompanion.parryVx = direction * 360;
  bernCompanion.parryVz = 360;
  bernCompanion.parryZ = 0;
  bernCompanion.parryFade = BERN_HAZARD_PARRY_LAUNCH_DURATION;
  bernCompanion.parryFailed = false;
  bernCompanion.parryFailFade = 0;
  bernCompanion.crystalHasFired = true;
  enemyFreezeTimer = 1.15;
  screenShakeTimer = 0.7;
  bernParryOverlayTimer = 0.78;
  burst(bernCompanion.x, bernCompanion.y - 180, "special");
  message = "Parry";
  messageTimer = 0.75;
  return true;
}

function resolveBeatriceMeleeKickParry() {
  const recoilDirection = player.x >= beatriceBoss.x ? 1 : -1;
  beatriceBoss.meleeKickParried = true;
  beatriceBoss.meleeKickHit = true;
  beatriceBoss.meleeKickParryFailed = false;
  beatriceBoss.meleeKickParryFailFade = 0;
  beatriceBoss.flavor = "meleeParryHurt";
  beatriceBoss.anim = 0;
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.meleeParryRecoilVx = -Math.sign(player.x - beatriceBoss.x || beatriceBoss.facing || 1) * BEATRICE_MELEE_PARRY_BEATRICE_RECOIL_SPEED;
  player.facing = -recoilDirection;
  player.action = "beatriceMeleeParry";
  player.anim = 0;
  player.attackLock = 0.56;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.currentAttack = "";
  player.meleeParryRecoilVx = recoilDirection * BEATRICE_MELEE_PARRY_BATTLER_RECOIL_SPEED;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 42);
  spawnAsmodeusGoldenWisps(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 14);
  screenShakeTimer = Math.max(screenShakeTimer, 0.18);
  enemyFreezeTimer = Math.max(enemyFreezeTimer, 0.45);
  runStats.parriesPerformed += 1;
  const barrierDirection = Math.sign(beatriceBoss.x - player.x) || beatriceBoss.facing || 1;
  const barrierBroken = damageBeatriceBarrier(BEATRICE_MELEE_PARRY_BARRIER_DAMAGE, barrierDirection);
  if (!barrierBroken) {
    message = beatriceBoss.barrierActive ? "Parry - Barrier cracked" : "Parry";
    messageTimer = 0.85;
  }
}

function failBeatriceMeleeKickParry() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick") return false;
  beatriceBoss.meleeKickParryFailed = true;
  beatriceBoss.meleeKickParryFailFade = BEATRICE_MELEE_KICK_PARRY_FAIL_FADE;
  const activeIndex = Math.max(0, beatriceFrames.meleeKick.indexOf(273));
  beatriceBoss.anim = Math.max(beatriceBoss.anim, activeIndex);
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.meleeKickHit = true;
  applyBeatriceMeleeKickHit();
  message = "Parry failed";
  messageTimer = 0.55;
  return true;
}

function tryBeatriceMeleeKickParry() {
  if (!beatriceMeleeKickParryIndicatorActive()) return false;
  if (!beatriceMeleeKickParryReady()) {
    if (playerInBeatriceMeleeKickTelegraph()) return failBeatriceMeleeKickParry();
    return false;
  }
  resolveBeatriceMeleeKickParry();
  return true;
}

function goatPoundParryImpactIndex() {
  return Math.max(1, goatFrames.pound.findIndex((frame) => frame >= 684));
}

function goatPoundParryRingRadius(enemy) {
  const impactFrameIndex = goatPoundParryImpactIndex();
  const t = clamp(enemy.anim / impactFrameIndex, 0, 1);
  return GOAT_POUND_PARRY_START_RADIUS - t * (GOAT_POUND_PARRY_START_RADIUS - 70);
}

function goatPoundParryTimingReady(enemy) {
  if (enemy.type !== "goat" || enemy.dead || enemy.spawnGrace > 0) return false;
  if (enemy.goatAction !== "pound" || enemy.goatHasHit || enemy.goatParryFailed) return false;
  return Math.abs(goatPoundParryRingRadius(enemy) - GOAT_POUND_PARRY_RING_RADIUS) <= GOAT_POUND_PARRY_WINDOW;
}

function goatPoundParryIndicatorActive(enemy) {
  return enemy.type === "goat"
    && !enemy.dead
    && enemy.spawnGrace <= 0
    && enemy.goatAction === "pound"
    && !enemy.goatHasHit
    && !enemy.goatParryFailed;
}

function hasParryIndicatorActive() {
  return bernHazardParryIndicatorActive()
    || beatriceStakeParryIndicatorActive()
    || beatriceMeleeKickParryIndicatorActive()
    || enemies.some(goatPoundParryIndicatorActive);
}

function hasParryTimingReady() {
  return bernHazardParryReady()
    || beatriceStakes.some((stake) => {
      if (!beatriceStakeParryReady(stake)) return false;
      if (beatriceStakeTutorial.active && beatriceStakeTutorial.stage === "parryNow") {
        return beatriceStakeTutorial.skipCooldown <= 0;
      }
      return true;
    })
    || beatriceMeleeKickParryReady()
    || enemies.some(goatPoundParryReady);
}

function updateParryTipAlert() {
  if (!parryTip) return;
  const canShow = state === "playing" || state === "beatriceStakeTutorial";
  parryTip.classList.toggle("parry-alert", canShow && hasParryIndicatorActive());
  parryTip.classList.toggle("parry-ready", canShow && hasParryTimingReady());
}

function goatPoundParryReady(enemy) {
  if (enemy.type !== "goat" || enemy.dead || enemy.spawnGrace > 0) return false;
  if (enemy.goatAction !== "pound" || enemy.goatHasHit || enemy.goatParryFailed) return false;
  if (player.airborne || player.knockedDown) return false;
  if (!pointInGoatPoundCone(enemy, player.x, player.y)) return false;
  return goatPoundParryTimingReady(enemy);
}

function startGoatParryCounter(kind, direction) {
  const action = kind === "kick" ? "kick3" : "punch3";
  const data = attackData[action];
  player.facing = direction;
  player.attackLock = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.currentAttack = action;
  player.attackLungeRemaining = data.lunge || 0;
  player.comboTimer = 0;
  player.comboQueuedKind = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  player.goatParryCounter = true;
  if (action === "kick3") {
    player.stage3KickAir = true;
    player.stage3KickTimer = 0;
    player.stage3KickVz = STAGE3_KICK_START_VZ;
    player.z = Math.max(player.z, 8);
  } else {
    player.stage3KickAir = false;
    player.stage3KickTimer = 0;
    player.stage3KickVz = 0;
  }
  resetPlayerCombo();
  setAction(action, data.lock);
  player.anim = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
}

function tryGoatPoundParry(kind) {
  if (kind !== "punch" && kind !== "kick") return false;
  for (const enemy of enemies) {
    if (enemy.type !== "goat" || enemy.dead || enemy.spawnGrace > 0) continue;
    if (enemy.goatAction !== "pound" || enemy.goatHasHit || enemy.goatParryFailed) continue;
    if (player.airborne || player.knockedDown || !pointInGoatPoundCone(enemy, player.x, player.y)) continue;
    if (!goatPoundParryTimingReady(enemy)) {
      enemy.goatParryFailed = true;
      enemy.goatParryFailFade = GOAT_POUND_PARRY_FAIL_FADE;
      message = "Parry failed";
      messageTimer = 0.55;
      burst(player.x, player.y - 104, "enemy");
      return true;
    }
    const direction = enemy.x >= player.x ? 1 : -1;
    runStats.parriesPerformed += 1;
    startGoatParryCounter(kind, direction);
    if (enemy.bossMechanic === "beatriceGoatTrial") {
      enemy.hp = 0;
      enemyFreezeTimer = Math.max(enemyFreezeTimer, 1);
      screenShakeTimer = Math.max(screenShakeTimer, 0.48);
      burst(enemy.x, enemy.y - 150, "special");
      defeatEnemy(enemy);
      message = "Parry";
      messageTimer = 0.75;
      return true;
    }
    enemy.goatAction = "idle";
    enemy.goatHasHit = false;
    enemy.goatParryFailed = false;
    enemy.goatParryFailFade = 0;
    enemy.goatHurtAnim = 0;
    enemy.goatArmorHits = 0;
    enemy.goatArmorFlash = 0;
    enemy.hurt = 0;
    enemy.anim = 0;
    enemy.attack = 0;
    enemyFreezeTimer = Math.max(enemyFreezeTimer, 1);
    screenShakeTimer = Math.max(screenShakeTimer, 0.48);
    burst(enemy.x, enemy.y - 150, "special");
    message = "Parry";
    messageTimer = 0.75;
    return true;
  }
  return false;
}

function spawnKonpeitoGeyser(x, y) {
  const candies = [];
  for (let i = 0; i < 18; i++) {
    const frontLayer = i < 3;
    const angle = frontLayer ? -Math.PI / 2 + (i - 1) * 0.34 : (Math.PI * 2 * i) / 18;
    candies.push({
      angle,
      frontLayer,
      frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
      size: frontLayer ? 46 + Math.random() * 12 : 32 + Math.random() * 16,
      spin: (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.3),
      lift: frontLayer ? 188 + Math.random() * 58 : 112 + Math.random() * 92
    });
  }
  konpeitoGeysers.push({
    x,
    y,
    life: 1.25,
    max: 1.25,
    candies
  });
}

function spawnCrystalShardStrike() {
  const targets = livingEnemies();
  if (!targets.length) return;
  const target = targets[Math.floor(Math.random() * targets.length)];
  const spawnOffsetX = (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 290);
  const spawnOffsetY = -36 + Math.random() * 72;
  crystalShards.push({
    x: target.x + spawnOffsetX,
    y: target.y + spawnOffsetY,
    targetX: target.x,
    targetY: target.y,
    z: 520,
    startZ: 520,
    speed: CRYSTAL_SHARD_FALL_SPEED,
    hit: false
  });
}

function spawnMiracleCrystalFollowup(preferredTarget) {
  if (!player.blessings.miracleShardFollowup) return;
  const target = preferredTarget && !preferredTarget.dead && preferredTarget.hp > 0
    ? preferredTarget
    : strongestEnemyTo(player.x, player.y);
  if (!target) return;
  const spawnOffsetX = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 220);
  const spawnOffsetY = -34 + Math.random() * 68;
  const targetX = clamp(target.x + (Math.random() - 0.5) * 34, 80, STAGE_W - 120);
  const targetY = clampPlayY(target.y + (Math.random() - 0.5) * 36);
  crystalShards.push({
    x: targetX + spawnOffsetX,
    y: targetY + spawnOffsetY,
    targetX,
    targetY,
    z: 500,
    startZ: 500,
    speed: CRYSTAL_SHARD_FALL_SPEED + 170,
    delay: 0.05,
    source: "bern",
    shockwaveDamage: BERN_CRYSTAL_SHOCKWAVE_DAMAGE,
    hit: false
  });
}

function scheduleMiracleCrystalFollowup(preferredTarget) {
  if (!player.blessings.miracleShardFollowup) return;
  pendingMiracleCrystalFollowups.push({
    delay: MIRACLE_CRYSTAL_FOLLOWUP_DELAY,
    target: preferredTarget || null
  });
}

function scheduleCrystalShardPlus(x, y, source = "crystalShardPlus") {
  if (!player.blessings.miracleCrystalShardPlus) return;
  upwardCrystalShards.push({
    x,
    y,
    z: 0,
    life: CRYSTAL_SHARD_PLUS_LIFE,
    max: CRYSTAL_SHARD_PLUS_LIFE,
    delay: CRYSTAL_SHARD_PLUS_DELAY,
    source,
    touched: new Set()
  });
}

function triggerCrystalShardStack(stack) {
  spawnCrystalShardStrike();
  stack.cooldown = CRYSTAL_SHARD_INTERVAL;
  player.crystalShardTimer = crystalShardHudCooldown();
}

function crystalShardHudCooldown() {
  if (!player.crystalShardStacks.length) return 0;
  return Math.min(...player.crystalShardStacks.map((stack) => stack.cooldown));
}

function acquireCrystalShardStack() {
  player.crystalShardActive = true;
  if (!Array.isArray(player.crystalShardStacks)) player.crystalShardStacks = [];
  if (player.crystalShardStacks.length < CRYSTAL_SHARD_MAX_STACKS) {
    const stack = { cooldown: 0 };
    player.crystalShardStacks.push(stack);
    triggerCrystalShardStack(stack);
    return;
  }
  let longest = player.crystalShardStacks[0];
  for (const stack of player.crystalShardStacks) {
    if (stack.cooldown > longest.cooldown) longest = stack;
  }
  longest.cooldown = 0;
  triggerCrystalShardStack(longest);
}

function updateMouseAim(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = clamp((event.clientX - rect.left) * (W / rect.width), 0, W);
  mouse.y = clamp((event.clientY - rect.top) * (H / rect.height), 0, H);
  mouse.worldX = clamp(cameraX + mouse.x, 80, STAGE_W - 120);
  mouse.laneY = clampPlayY(mouse.y);
  mouse.inside = true;
}

function fireKonpeito() {
  return;
  if (state !== "playing" || !player.konpeitoActive || player.konpeitoCooldown > 0) return;
  konpeitoShots.push({
    startScreenX: W / 2,
    startScreenY: H + 90,
    targetX: mouse.worldX,
    targetY: mouse.laneY,
    t: 0,
    duration: 0.82,
    frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
    spin: (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 1.4)
  });
  player.konpeitoCooldown = KONPEITO_COOLDOWN;
}

function startLambdaKonpeitoCast(force = false) {
  if (state !== "playing") return false;
  if (!lambdaCompanion.active || lambdaCompanion.state === "summon") return false;
  if (!force && lambdaCompanion.state === "konpeitoCast") return false;
  if ((lambdaCompanion.konpeitoCharge || 0) < 100) return false;
  if (!nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y)) return false;
  lambdaCompanion.konpeitoCharge = Math.max(0, (lambdaCompanion.konpeitoCharge || 0) - 100);
  lambdaCompanion.konpeitoTimer = companionChargeCooldown(lambdaCompanion.konpeitoCharge, LAMBDA_KONPEITO_INTERVAL);
  lambdaCompanion.state = "konpeitoCast";
  lambdaCompanion.anim = 0;
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.castHasFired = false;
  return true;
}

function triggerLambdaKonpeito(force = false) {
  if (lambdaCompanion.state === "konpeitoCast") {
    return force && (lambdaCompanion.konpeitoCharge || 0) >= 100 && Boolean(nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y));
  }
  return startLambdaKonpeitoCast(force);
}

function lambdaKonpeitoLandingPoint(target) {
  let targetX = target.x;
  let targetY = target.y;
  const safety = 22;
  const playerDist = Math.hypot(player.x - targetX, player.y - targetY);
  if (playerDist > KONPEITO_RADIUS + safety) {
    return { x: targetX, y: targetY };
  }

  let dirX = targetX - player.x;
  let dirY = targetY - player.y;
  let len = Math.hypot(dirX, dirY);
  if (len < 1) {
    dirX = targetX - lambdaCompanion.x;
    dirY = targetY - lambdaCompanion.y;
    len = Math.hypot(dirX, dirY);
  }
  if (len < 1) {
    dirX = player.facing || 1;
    dirY = 0;
    len = 1;
  }
  dirX /= len;
  dirY /= len;

  const neededOffset = KONPEITO_RADIUS + safety - playerDist;
  targetX += dirX * neededOffset;
  targetY += dirY * neededOffset;
  return {
    x: clamp(targetX, 80, STAGE_W - 120),
    y: clampPlayY(targetY)
  };
}

function fireLambdaKonpeito() {
  const target = nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y);
  if (!target) return false;
  const landing = lambdaKonpeitoLandingPoint(target);
  lambdaCompanion.facing = landing.x >= lambdaCompanion.x ? 1 : -1;
  konpeitoShots.push({
    source: "lambda",
    startX: lambdaCompanion.x + lambdaCompanion.facing * 22,
    startY: lambdaCompanion.y - 148,
    targetX: landing.x,
    targetY: landing.y,
    t: 0,
    duration: 0.9,
    juggled: false,
    frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
    spin: (Math.random() < 0.5 ? -1 : 1) * (2.8 + Math.random() * 1.5)
  });
  return true;
}

function startLambdaGameOver() {
  if (!lambdaCompanion.active) return;
  lambdaCompanion.state = "gameOver";
  lambdaCompanion.anim = 0;
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
  lambdaCompanion.facing = 1;
}

function startLambdaLaugh() {
  if (!lambdaCompanion.active || lambdaCompanion.state === "gameOver") return;
  lambdaCompanion.state = "laugh";
  lambdaCompanion.anim = 0;
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
}

function startLambdaKonpeitoQuestion() {
  if (!EXPERIMENTAL_LAMBDA_KONPEITO_RETALIATION || !lambdaCompanion.active) return;
  lambdaCompanion.state = "konpeitoKnockdown";
  lambdaCompanion.anim = 0;
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
  lambdaKonpeitoQuestion.active = true;
  lambdaKonpeitoQuestion.selection = 0;
  state = "lambdaChoice";
  keys.clear();
  resetAttackHolds();
}

function chooseLambdaKonpeitoAnswer(yes) {
  if (!lambdaKonpeitoQuestion.active) return;
  lambdaKonpeitoQuestion.active = false;
  if (yes) {
    lambdaRetaliation.active = true;
    lambdaRetaliation.timer = LAMBDA_RETALIATION_RED_DURATION;
    lambdaRetaliation.laughTimer = LAMBDA_RETALIATION_LAUGH_START_DELAY;
    lambdaRetaliation.laughDelay = LAMBDA_RETALIATION_LAUGH_INITIAL_DELAY;
    lambdaRetaliation.laughCount = 0;
    state = "lambdaRetaliation";
    screenShakeTimer = LAMBDA_RETALIATION_RED_DURATION;
    keys.clear();
    resetAttackHolds();
    return;
  }
  state = "playing";
  lambdaCompanion.state = "idle";
  lambdaCompanion.anim = 0;
  lambdaCompanion.konpeitoCharge = 0;
  lambdaCompanion.konpeitoTimer = LAMBDA_KONPEITO_INTERVAL;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
}

function handleLambdaKonpeitoChoiceKey(key) {
  if (!lambdaKonpeitoQuestion.active) return false;
  if (key === "arrowleft" || key === "a") {
    lambdaKonpeitoQuestion.selection = 0;
    return true;
  }
  if (key === "arrowright" || key === "d") {
    lambdaKonpeitoQuestion.selection = 1;
    return true;
  }
  if (key === "y") {
    chooseLambdaKonpeitoAnswer(true);
    return true;
  }
  if (key === "n") {
    chooseLambdaKonpeitoAnswer(false);
    return true;
  }
  if (key === "enter" || key === " ") {
    chooseLambdaKonpeitoAnswer(lambdaKonpeitoQuestion.selection === 0);
    return true;
  }
  return true;
}

function startLambdaGameOverDialogue() {
  if (!lambdaCompanion.summoned) return;
  lambdaGameOverDialogue.active = true;
  lambdaGameOverDialogue.index = 0;
  lambdaGameOverDialogue.timer = LAMBDA_GAME_OVER_DIALOGUE[0].duration;
  lambdaGameOverDialogue.skipCooldown = 5;
}

function advanceLambdaGameOverDialogue(manual = false) {
  if (!lambdaGameOverDialogue.active) return;
  if (manual && lambdaGameOverDialogue.skipCooldown > 0) return;
  if (manual && LAMBDA_GAME_OVER_DIALOGUE[lambdaGameOverDialogue.index].locked) return;
  if (lambdaGameOverDialogue.index >= LAMBDA_GAME_OVER_DIALOGUE.length - 1) return;
  lambdaGameOverDialogue.index += 1;
  lambdaGameOverDialogue.timer = LAMBDA_GAME_OVER_DIALOGUE[lambdaGameOverDialogue.index].duration;
  if (manual) lambdaGameOverDialogue.skipCooldown = 0.45;
}

function updateLambdaGameOverDialogue(dt) {
  if (!lambdaGameOverDialogue.active) return;
  lambdaGameOverDialogue.skipCooldown = Math.max(0, lambdaGameOverDialogue.skipCooldown - dt);
  if (!Number.isFinite(lambdaGameOverDialogue.timer)) return;
  lambdaGameOverDialogue.timer -= dt;
  if (lambdaGameOverDialogue.timer <= 0) advanceLambdaGameOverDialogue();
}

function launchEnemyFromKonpeito(enemy, centerX, source = "lambda:konpeito") {
  const direction = Math.sign(enemy.x - centerX || 1);
  if (launchEnemy(enemy, direction, 520, 210, source)) {
    enemy.x = clamp(enemy.x + direction * 22, 80, STAGE_W - 120);
  }
}

function launchPlayerFromKonpeito(centerX) {
  if (player.airborne || player.knockedDown || state !== "playing") return;
  runStats.launchedByLambdadelta += 1;
  const direction = Math.sign(player.x - centerX || 1);
  player.vx = 0;
  player.vy = 0;
  player.attackLock = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.currentAttack = "";
  player.action = "down";
  launchActor(player, direction, 360, 135);
  player.x = clamp(player.x + direction * 18, 70, STAGE_W - 90);
  player.konpeitoGlowPending = true;
  player.konpeitoGlowTimer = 0;
  resetPlayerCombo();
  startLambdaLaugh();
}

function konpeitoHitsLambda(shot) {
  if (state !== "playing") return false;
  if (!EXPERIMENTAL_LAMBDA_KONPEITO_RETALIATION) return false;
  if (!lambdaCompanion.active || !lambdaCompanion.summoned) return false;
  if (lambdaCompanion.state === "konpeitoKnockdown" || lambdaKonpeitoQuestion.active || lambdaRetaliation.active) return false;
  if (shot.source !== "lambda" || !shot.juggled) return false;
  return Math.hypot(lambdaCompanion.x - shot.targetX, lambdaCompanion.y - shot.targetY) <= LAMBDA_KONPEITO_RETALIATION_RADIUS;
}

function impactKonpeito(shot) {
  const damagedIds = new Set();
  konpeitoShockwaves.push({
    x: shot.targetX,
    y: shot.targetY,
    life: 0.52,
    max: 0.52,
    touched: new Set(),
    playerTouched: false,
    dome: shot.source === "lambda",
    launchSource: `${shot.source || "player"}:konpeito`
  });
  if (shot.source === "lambda") spawnKonpeitoDomeBurst(shot.targetX, shot.targetY);
  burst(shot.targetX, shot.targetY - 44, "special");
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const dist = Math.hypot(enemy.x - shot.targetX, enemy.y - shot.targetY);
    if (dist > KONPEITO_RADIUS) continue;
    damageEnemy(enemy, KONPEITO_DAMAGE);
    damagedIds.add(i);
    launchEnemyFromKonpeito(enemy, shot.targetX, `${shot.source || "player"}:konpeito`);
    if (enemy.hp <= 0) defeatEnemy(enemy);
  }
  if (shot.source === "lambda" && Math.hypot(player.x - shot.targetX, player.y - shot.targetY) <= KONPEITO_RADIUS) {
    launchPlayerFromKonpeito(shot.targetX);
    konpeitoShockwaves[konpeitoShockwaves.length - 1].playerTouched = true;
  }
  if (konpeitoHitsLambda(shot)) {
    startLambdaKonpeitoQuestion();
  }
  konpeitoShockwaves[konpeitoShockwaves.length - 1].touched = damagedIds;
}

function spawnKonpeitoDomeBurst(x, y) {
  const candies = [];
  const count = 22;
  const start = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = start + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.13;
    candies.push({
      angle,
      frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
      size: 18 + Math.random() * 9,
      lift: 92 + Math.random() * 86,
      outward: 8 + Math.random() * 42,
      delay: Math.random() * 0.12,
      spin: (Math.random() < 0.5 ? -1 : 1) * (2.4 + Math.random() * 3.4),
      frontLayer: Math.sin(angle) > 0
    });
  }
  konpeitoDomeBursts.push({
    x,
    y,
    life: KONPEITO_DOME_BURST_DURATION,
    max: KONPEITO_DOME_BURST_DURATION,
    candies
  });
}

function konpeitoShotPosition(shot) {
  const t = clamp(shot.t, 0, 1);
  const targetScreenX = shot.targetX - cameraX;
  const targetScreenY = shot.targetY - 44;
  const startScreenX = shot.source === "lambda" ? shot.startX - cameraX : shot.startScreenX;
  const startScreenY = shot.source === "lambda" ? shot.startY : shot.startScreenY;
  const x = startScreenX + (targetScreenX - startScreenX) * t;
  const groundY = startScreenY + (targetScreenY - startScreenY) * t;
  const arc = Math.sin(t * Math.PI) * (shot.source === "lambda" ? (shot.juggled ? LAMBDA_KONPEITO_JUGGLE_ARC : 170) : 220);
  return {
    x,
    y: groundY - arc,
    worldX: x + cameraX,
    t,
    startScreenX,
    startScreenY,
    targetScreenX,
    targetScreenY
  };
}

function juggleLambdaKonpeito(shot, hitX, hitY, data) {
  if (!EXPERIMENTAL_JUGGLE_LAMBDA_KONPEITO || shot.source !== "lambda" || shot.juggled) return false;
  const direction = player.facing || 1;
  const laneNudge = player.vy ? Math.sign(player.vy) * 36 : 0;
  shot.startX = hitX;
  shot.startY = hitY;
  if (DEBUG_JUGGLED_KONPEITO_TARGETS_LAMBDA && lambdaCompanion.active && lambdaCompanion.summoned) {
    shot.targetX = clamp(lambdaCompanion.x, 80, STAGE_W - 120);
    shot.targetY = clampPlayY(lambdaCompanion.y);
  } else {
    shot.targetX = clamp(hitX + direction * (LAMBDA_KONPEITO_JUGGLE_PUSH + (data.stage || 1) * 34), 80, STAGE_W - 120);
    shot.targetY = clampPlayY(player.y + laneNudge);
  }
  shot.t = 0;
  shot.duration = LAMBDA_KONPEITO_JUGGLE_DURATION;
  shot.juggled = true;
  shot.spin *= 1.45;
  burst(hitX, hitY - 12, "special");
  return true;
}

function applyKonpeitoJuggleHit(data) {
  if (!EXPERIMENTAL_JUGGLE_LAMBDA_KONPEITO || !data?.activeFrames) return false;
  const hitbox = {
    x: player.x + (player.facing === 1 ? 28 : -data.range - 28),
    y: player.y - player.z - data.depth * 1.35,
    w: data.range,
    h: data.depth * 2.5
  };
  let hit = false;
  for (const shot of konpeitoShots) {
    if (shot.source !== "lambda" || shot.juggled) continue;
    const pos = konpeitoShotPosition(shot);
    const candyBox = { x: pos.worldX - 34, y: pos.y - 34, w: 68, h: 68 };
    if (!rectsTouch(hitbox, candyBox)) continue;
    if (juggleLambdaKonpeito(shot, pos.worldX, pos.y, data)) hit = true;
  }
  return hit;
}

function launchActor(actor, direction, lift = 470, drift = 170) {
  actor.airborne = true;
  actor.knockedDown = false;
  actor.downTime = 0;
  if (actor === player) {
    actor.stage3KickAir = false;
    actor.stage3KickTimer = 0;
    actor.stage3KickVz = 0;
    actor.poise = 0;
  }
  actor.z = 6;
  actor.vz = lift;
  actor.airVx = direction * drift;
  actor.hurt = 0;
  actor.attack = 0;
  actor.anim = 0;
}

function juggleScaleFor(enemy) {
  enemy.juggleCount = (enemy.juggleCount || 0) + 1;
  return Math.max(0.25, Math.pow(0.78, enemy.juggleCount));
}

function isBattlerOwnedSource(source = "") {
  return source.startsWith("battler");
}

function resetBattlerLaunchComboFlags(target) {
  target.battlerLaunchSpent = false;
  target.battlerGroundBounceSpent = false;
  target.battlerExtraLaunchExtensionSpent = false;
}

function spendBattlerExtraLaunchExtension(target) {
  if ((player.blessings.launchExtension || 0) <= 0) return false;
  if (target.battlerExtraLaunchExtensionSpent) return false;
  target.battlerExtraLaunchExtensionSpent = true;
  return true;
}

function proratedEnemyJuggle(enemy, direction, source, lift = 260, drift = 90) {
  const scale = juggleScaleFor(enemy);
  enemy.airborne = true;
  enemy.knockedDown = false;
  enemy.z = Math.max(enemy.z || 0, 14);
  enemy.vz = Math.max(enemy.vz || 0, lift * 0.48 * scale);
  enemy.airVx = (enemy.airVx || 0) * 0.6 + direction * drift * 0.4 * scale;
  enemy.launchSource = source;
  enemy.anim = 0;
  enemy.hurt = 0;
  enemy.attack = 0;
  return true;
}

function launchEnemyByBattlerRules(enemy, direction, source, lift = 470, drift = 170) {
  if (isBattlerOwnedSource(source) && enemy.battlerLaunchSpent) {
    if (!spendBattlerExtraLaunchExtension(enemy)) {
      return proratedEnemyJuggle(enemy, direction, source, lift, drift);
    }
  } else if (isBattlerOwnedSource(source)) {
    enemy.battlerLaunchSpent = true;
  }
  return launchEnemy(enemy, direction, lift, drift, source);
}

function groundBounceEnemyByBattlerRules(enemy, direction, source, lift = STAGE3_KICK_BOUNCE_LIFT, drift = STAGE3_KICK_BOUNCE_DRIFT) {
  if (isBattlerOwnedSource(source) && enemy.battlerGroundBounceSpent) {
    if (!spendBattlerExtraLaunchExtension(enemy)) {
      return proratedEnemyJuggle(enemy, direction, source, lift, drift);
    }
  } else if (isBattlerOwnedSource(source)) {
    enemy.battlerGroundBounceSpent = true;
  }
  return groundBounceEnemy(enemy, direction, source, lift, drift);
}

function launchEnemy(enemy, direction, lift = 470, drift = 170, source = "unknown") {
  if (enemy.airborne) {
    if (enemy.launchSource === source) {
      const scale = juggleScaleFor(enemy);
      enemy.vz = Math.max(enemy.vz, lift * 0.48 * scale);
      enemy.airVx = enemy.airVx * 0.45 + direction * drift * 0.55 * scale;
    } else {
      enemy.juggleCount = 0;
      enemy.vz = lift;
      enemy.airVx = direction * drift;
    }
    enemy.z = Math.max(enemy.z || 0, 18);
    enemy.anim = 0;
    enemy.hurt = 0;
    enemy.attack = 0;
  } else {
    launchActor(enemy, direction, lift, drift);
    enemy.juggleCount = 0;
  }
  enemy.launchSource = source;
  return true;
}

function launchEnemyUnprorated(enemy, direction, source, lift = 360, drift = 100) {
  if (enemy.airborne) {
    enemy.vz = Math.max(enemy.vz || 0, lift);
    enemy.airVx = (enemy.airVx || 0) * 0.38 + direction * drift * 0.62;
    enemy.z = Math.max(enemy.z || 0, 18);
    enemy.anim = 0;
    enemy.hurt = 0;
    enemy.attack = 0;
  } else {
    launchActor(enemy, direction, lift, drift);
  }
  enemy.juggleCount = 0;
  enemy.launchSource = source;
  return true;
}

function extendEnemyLaunch(enemy, direction, source, lift = 260, drift = 90) {
  if (!enemy.airborne || enemy.launchSource === source) return false;
  const scale = juggleScaleFor(enemy);
  enemy.vz = Math.max(enemy.vz, lift * scale);
  enemy.airVx = enemy.airVx * 0.68 + direction * drift * 0.32 * scale;
  enemy.z = Math.max(enemy.z || 0, 14);
  enemy.launchSource = source;
  enemy.anim = 0;
  enemy.hurt = 0;
  enemy.attack = 0;
  return true;
}

function groundBounceEnemy(enemy, direction, source, lift = STAGE3_KICK_BOUNCE_LIFT, drift = STAGE3_KICK_BOUNCE_DRIFT) {
  enemy.airborne = true;
  enemy.knockedDown = false;
  const pickupHeight = enemy.type === "goat" ? STAGE3_KICK_BOUNCE_FALL_HEIGHT * 1.12 : STAGE3_KICK_BOUNCE_FALL_HEIGHT;
  enemy.z = Math.max(enemy.z || 0, player.z || 0, pickupHeight);
  enemy.vz = -STAGE3_KICK_BOUNCE_FALL_SPEED;
  enemy.airVx = direction * 28;
  enemy.downTime = Math.max(enemy.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.14);
  enemy.hurt = 0;
  enemy.attack = 0;
  enemy.anim = 1;
  enemy.groundBouncePending = true;
  enemy.groundBounceTimer = -1;
  enemy.groundBounceDirection = direction;
  enemy.groundBounceSource = source;
  enemy.groundBounceLift = lift;
  enemy.groundBounceDrift = drift;
  return true;
}

function enemyHurtbox(enemy) {
  const lift = enemy.z || 0;
  if (enemy.knockedDown && !enemy.airborne) {
    return enemy.type === "goat"
      ? { x: enemy.x - 108, y: enemy.y - 98, w: 216, h: 116 }
      : { x: enemy.x - 84, y: enemy.y - 82, w: 168, h: 100 };
  }
  return enemy.type === "goat"
    ? { x: enemy.x - 70, y: enemy.y - lift - 310, w: 140, h: 310 }
    : { x: enemy.x - 42, y: enemy.y - lift - 192, w: 84, h: 226 };
}

function canGroundBounceTarget(enemy) {
  return Boolean(enemy.airborne || enemy.knockedDown || (enemy.z || 0) > 0);
}

function landLaunchedActor(actor, downTime = 0.85) {
  actor.z = 0;
  actor.airborne = false;
  actor.launchSource = "";
  actor.juggleCount = 0;
  actor.knockedDown = true;
  actor.downTime = downTime;
  actor.anim = actor.type === "goat" ? 1 : 4;
  actor.airVx = 0;
  actor.vz = 0;
}

function updateEnemyGroundBounce(enemy, dt) {
  if (!enemy.groundBouncePending && !enemy.groundBounceTimer) return false;
  if (enemy.airborne) return false;
  if (enemy.groundBounceTimer < 0) {
    enemy.groundBounceTimer = STAGE3_KICK_BOUNCE_DELAY;
    enemy.downTime = Math.max(enemy.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.12);
    enemy.anim = enemy.type === "goat" ? 1 : 4;
    return false;
  }
  enemy.groundBounceTimer = Math.max(0, enemy.groundBounceTimer - dt);
  if (enemy.groundBounceTimer > 0) return false;
  const direction = enemy.groundBounceDirection || enemy.facing || player.facing || 1;
  const source = enemy.groundBounceSource || "battler:kick3";
  const lift = enemy.groundBounceLift || STAGE3_KICK_BOUNCE_LIFT;
  const drift = enemy.groundBounceDrift || STAGE3_KICK_BOUNCE_DRIFT;
  enemy.groundBounceTimer = 0;
  enemy.groundBouncePending = false;
  enemy.groundBounceDirection = 0;
  enemy.groundBounceSource = "";
  enemy.groundBounceLift = 0;
  enemy.groundBounceDrift = 0;
  enemy.knockedDown = false;
  launchEnemy(enemy, direction, lift, drift, source);
  return true;
}

function launchFrame(actor) {
  if (actor.vz > 0) return 152;
  return launchFallFrames[Math.min(launchFallFrames.length - 1, Math.floor(actor.anim))];
}

function currentPlayerActionFrame() {
  if (player.action === "kick3" && player.stage3KickAir) {
    if (player.stage3KickTimer < 0.12) return 91;
    if (player.stage3KickTimer < 0.23) return 294;
    if (player.stage3KickTimer < STAGE3_KICK_STARTUP_TIME) return 295;
    if (player.stage3KickTimer < STAGE3_KICK_ACTIVE_END) return 296;
    return 297;
  }
  const list = frames[player.action] || frames.idle;
  if (attackData[player.action] && player.attackLock > 0) {
    return list[Math.min(list.length - 1, Math.floor(player.anim))];
  }
  return list[Math.floor(player.anim) % list.length];
}

function enemyMaxHealthForWave() {
  const fiveWaveSteps = Math.floor(Math.max(0, wave - 1) / 5);
  return 42 + wave * 10 + fiveWaveSteps * ENEMY_HEALTH_FIVE_WAVE_BONUS;
}

function chooseEnemyType(index = 0) {
  if (wave >= 2 && (index + wave) % 4 === 0) return "goat";
  return "battler";
}

function makeEnemy(x, y, index = 0, typeOverride = "") {
  const type = typeOverride || chooseEnemyType(index);
  const maxHp = enemyMaxHealthForWave();
  return {
    type,
    x,
    y,
    hp: type === "goat" ? Math.round(maxHp * 1.25) : maxHp,
    maxHp: type === "goat" ? Math.round(maxHp * 1.25) : maxHp,
    speed: type === "goat" ? 0 : 72 + wave * 6 + Math.random() * 20,
    facing: type === "goat" ? (player.x >= x ? 1 : -1) : -1,
    hurt: 0,
    attack: 0,
    attackKind: "punch",
    attackHasHit: false,
    attackTelegraph: 0,
    attackFacing: 0,
    goatAction: "idle",
    goatHasHit: false,
    goatHurtAnim: 0,
    goatArmorHits: 0,
    goatArmorFlash: 0,
    goatParryFailed: false,
    goatParryFailFade: 0,
    goatNoDetectTimer: 0,
    goatChargeDx: 0,
    goatChargeDy: 0,
    goatChargeDistance: 0,
    airborne: false,
    z: 0,
    vz: 0,
    airVx: 0,
    launchSource: "",
    juggleCount: 0,
    battlerLaunchSpent: false,
    battlerGroundBounceSpent: false,
    battlerExtraLaunchExtensionSpent: false,
    groundBouncePending: false,
    groundBounceTimer: 0,
    groundBounceDirection: 0,
    groundBounceSource: "",
    groundBounceLift: 0,
    groundBounceDrift: 0,
    duoSlamDamage: 0,
    duoAbsorb: 0,
    duoAbsorbSeed: 0,
    duoAbsorbStartX: 0,
    duoAbsorbStartY: 0,
    duoAbsorbStartZ: 0,
    anim: Math.random() * (type === "goat" ? goatFrames.idle.length : frames.walk.length),
    cooldown: 0,
    spawnGrace: ENEMY_SUMMON_GRACE,
    dead: false,
    knockedDown: false,
    downTime: 0,
    fall: 0,
    tint: index % 2 ? "#7a1f2d" : "#34404e"
  };
}

function spawnEnemyBottle(targetX, targetY, index) {
  const startX = cameraX + W * (0.42 + Math.random() * 0.2);
  const startY = H + 72;
  messageBottles.push({
    kind: "enemy",
    targetX,
    targetY,
    startX,
    startY,
    t: 0,
    delay: MESSAGE_BOTTLE_THROW_DELAY * index + Math.random() * 0.18,
    duration: MESSAGE_BOTTLE_FLIGHT_TIME + Math.random() * 0.22,
    spin: (Math.random() < 0.5 ? -1 : 1) * (5.5 + Math.random() * 2.5),
    enemyIndex: index
  });
}

function spawnItemBottle(type, targetX, targetY) {
  const startX = cameraX + W * (0.34 + Math.random() * 0.32);
  const startY = H + 72;
  messageBottles.push({
    kind: "item",
    itemType: type,
    targetX: clamp(targetX + (Math.random() - 0.5) * 56, 80, STAGE_W - 80),
    targetY: clamp(targetY + (Math.random() - 0.5) * 26, PLAY_AREA_TOP + 38, PLAY_AREA_BOTTOM + 4),
    startX,
    startY,
    t: 0,
    delay: 0.16 + Math.random() * 0.24,
    duration: MESSAGE_BOTTLE_FLIGHT_TIME * 0.82 + Math.random() * 0.16,
    spin: (Math.random() < 0.5 ? -1 : 1) * (6.5 + Math.random() * 3),
    enemyIndex: Math.floor(Math.random() * 99)
  });
}

function shuffledIndices(count) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function scheduledBossNumberForWave() {
  if (wave < BOSS_WAVE_INTERVAL || wave % BOSS_WAVE_INTERVAL !== 0) return 0;
  return Math.floor(wave / BOSS_WAVE_INTERVAL);
}

function debugBossesDefeatedBeforeSchedule() {
  return DEBUG_START_BEATRICE_BOSS_WAVE && (wave > 1 || runStats.bossesDefeated > 0) ? 1 : 0;
}

function scheduledBossesDefeated() {
  return Math.max(0, runStats.bossesDefeated - debugBossesDefeatedBeforeSchedule());
}

function currentBossWaveNumber() {
  if (DEBUG_START_BEATRICE_BOSS_WAVE && wave === 1 && runStats.bossesDefeated === 0) return 1;
  return Math.max(1, scheduledBossNumberForWave());
}

function currentWaveMode() {
  if (DEBUG_START_BEATRICE_BOSS_WAVE && wave === 1 && runStats.bossesDefeated === 0) return "boss";
  const scheduledBoss = scheduledBossNumberForWave();
  return scheduledBoss > 0 && scheduledBossesDefeated() < scheduledBoss ? "boss" : "normal";
}

function currentWaveLabel() {
  return waveMode === "boss" ? `Boss Wave ${currentBossWaveNumber()}` : `Wave ${wave}`;
}

function randomChoice(list) {
  if (!list || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function bossBlessingOptionsFromCompanions() {
  const options = [];
  const hadLambda = lambdaCompanion.summoned || lambdaCompanion.active;
  const hadBern = (bernCompanion.summoned || bernCompanion.active) && player.plumTeaActive && !player.plumTeaBurned;
  if (hadLambda) {
    const blessing = randomChoice(LAMBDA_BLESSINGS);
    if (blessing) options.push({ ...blessing, color: "pink" });
  }
  if (hadBern) {
    const blessing = randomChoice(BERN_BLESSINGS);
    if (blessing) options.push({ ...blessing, color: "purple" });
  }
  return options;
}

function dismissCompanionsForBossWave() {
  if (lambdaCompanion.active || lambdaCompanion.summoned) {
    spawnKonpeitoGeyser(lambdaCompanion.x || player.x, lambdaCompanion.y || player.y);
  }
  if (bernCompanion.active || bernCompanion.summoned) {
    spawnGoldenButterflies(bernCompanion.x || player.x, (bernCompanion.y || player.y) - 96, 26);
  }
  lambdaCompanion.active = false;
  lambdaCompanion.summoned = false;
  lambdaCompanion.state = "idle";
  lambdaCompanion.anim = 0;
  lambdaCompanion.queuedKonpeito = false;
  lambdaCompanion.konpeitoTimer = 0;
  bernCompanion.active = false;
  bernCompanion.summoned = false;
  bernCompanion.state = "idle";
  bernCompanion.anim = 0;
  bernCompanion.queuedCrystal = false;
  bernCompanion.crystalTimer = 0;
  bernCompanion.crystalCharge = 0;
  bernCompanion.catForm = false;
}

function startBossBlessingChoice(options) {
  bossBlessingChoice.active = true;
  bossBlessingChoice.choices = options;
  bossBlessingChoice.pendingBoss = true;
  bossBlessingChoice.selected = 0;
  state = "bossBlessing";
  message = "Choose a blessing";
  messageTimer = 1.25;
}

function applyBossBlessing(blessing) {
  if (!blessing) return;
  if (blessing.id === "launchExtension") {
    player.blessings.launchExtension = (player.blessings.launchExtension || 0) + 1;
  } else if (blessing.id === "superCharge") {
    player.blessings.superCharge = true;
  } else if (blessing.id === "lambdaKonpeitoSpecial") {
    player.blessings.lambdaKonpeitoSpecial = true;
  } else if (blessing.id === "paperArmor") {
    player.blessings.paperArmor = true;
  } else if (blessing.id === "miracleRevival") {
    player.blessings.miracleRevival = (player.blessings.miracleRevival || 0) + 1;
  } else if (blessing.id === "miracleShardFollowup") {
    player.blessings.miracleShardFollowup = true;
  } else if (blessing.id === "miracleCrystalShardPlus") {
    player.blessings.miracleCrystalShardPlus = true;
  } else if (blessing.id === "miracleRisk") {
    player.blessings.miracleRisk = true;
  }
  message = blessing.title.replace(/^Blessing of (Certainty|Miracles): /, "");
  messageTimer = 1.35;
}

function chooseBossBlessing(index = bossBlessingChoice.selected || 0) {
  if (!bossBlessingChoice.active) return;
  const choice = bossBlessingChoice.choices[index] || bossBlessingChoice.choices[0];
  applyBossBlessing(choice);
  bossBlessingChoice.active = false;
  bossBlessingChoice.choices = [];
  bossBlessingChoice.pendingBoss = false;
  bossBlessingChoice.selected = 0;
  state = "playing";
  activateBeatriceBoss();
}

function beginBossWave() {
  const options = bossBlessingOptionsFromCompanions();
  dismissCompanionsForBossWave();
  if (options.length > 0) {
    startBossBlessingChoice(options);
  } else {
    activateBeatriceBoss();
  }
}

function beatriceBossMaxHealthForEncounter(bossNumber) {
  const firstBossWave = DEBUG_START_BEATRICE_BOSS_WAVE && wave === 1 && runStats.bossesDefeated === 0
    ? 1
    : BOSS_WAVE_INTERVAL;
  const fiveWaveSteps = Math.floor(Math.max(0, firstBossWave - 1) / 5);
  const baseEnemyHp = 42 + firstBossWave * 10 + fiveWaveSteps * ENEMY_HEALTH_FIVE_WAVE_BONUS;
  const goatHp = Math.round(baseEnemyHp * 1.25);
  return Math.round(goatHp * BEATRICE_BOSS_HP_MULTIPLIER * Math.pow(1 + BEATRICE_BOSS_HEALTH_GROWTH, bossNumber - 1));
}

function activateBeatriceBoss() {
  const bossNumber = currentBossWaveNumber();
  beatriceBoss.active = true;
  beatriceBoss.x = clamp(cameraX + W * 0.72, 90, STAGE_W - 90);
  beatriceBoss.y = clamp(player.y - 44, FLOOR_Y - 124, FLOOR_Y - 8);
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  beatriceBoss.anim = 0;
  beatriceBoss.hoverOffset = 76;
  beatriceBoss.stakeTimer = BEATRICE_STAKE_INTERVAL;
  beatriceBoss.flavor = "idle";
  beatriceBoss.flavorTimer = 0;
  beatriceBoss.stakeCastFired = false;
  beatriceBoss.teleportPrepTimer = 0;
  beatriceBoss.teleportPrepIndex = 0;
  beatriceBoss.teleportPrepSide = 1;
  beatriceBoss.teleportPrepPoints = [];
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.meleeKickHit = false;
  beatriceBoss.meleeKickParried = false;
  beatriceBoss.meleeKickParryFailed = false;
  beatriceBoss.meleeKickParryFailFade = 0;
  beatriceBoss.asmoDropKickPending = false;
  beatriceBoss.asmoDropKickTimer = 0;
  beatriceBoss.asmoDropKickHit = false;
  beatriceBoss.asmoDropKickSide = 1;
  beatriceBoss.maxHp = beatriceBossMaxHealthForEncounter(bossNumber);
  beatriceBoss.hp = beatriceBoss.maxHp;
  beatriceBoss.defeatTimer = 0;
  beatriceBoss.barrierActive = true;
  beatriceBoss.barrierMax = BEATRICE_BARRIER_MAX;
  beatriceBoss.barrierHp = beatriceBoss.barrierMax;
  beatriceBoss.vulnerable = false;
  beatriceBoss.breakVx = 0;
  beatriceBoss.breakFade = 0;
  beatriceBoss.z = 0;
  beatriceBoss.vz = 0;
  beatriceBoss.airVx = 0;
  beatriceBoss.launchSource = "";
  beatriceBoss.juggleCount = 0;
  beatriceBoss.battlerLaunchSpent = false;
  beatriceBoss.battlerGroundBounceSpent = false;
  beatriceBoss.battlerExtraLaunchExtensionSpent = false;
  beatriceBoss.groundBouncePending = false;
  beatriceBoss.groundBounceTimer = 0;
  beatriceBoss.groundBounceDirection = 0;
  beatriceBoss.groundBounceSource = "";
  beatriceBoss.groundBounceLift = 0;
  beatriceBoss.groundBounceDrift = 0;
  beatriceBoss.downTime = 0;
  beatriceBoss.stunIdleTimer = 0;
  beatriceBoss.stunDamageTimer = 0;
  beatriceBoss.recoveryTimer = 0;
  beatriceBoss.lastMechanic = "";
  if (DEBUG_BEATRICE_TELEPORT_PREP_TEST) {
    startBeatriceTeleportPrep();
  } else {
    startRandomBeatriceMechanic();
  }
}

function completeBeatriceMechanic() {
  if (!beatriceBoss.active) return;
  beatriceBoss.mechanic = "stakeReward";
  beatriceBoss.wallsActive = false;
  beatriceBoss.trialGoat = null;
  beatriceBoss.rings = [];
  beatriceBoss.ringAttackStarted = false;
  beatriceBoss.goatRushTelegraphs = [];
  beatriceBoss.goatRushTimer = 0;
  beatriceBoss.goatRushSpawned = false;
  beatriceBoss.towerVolleyStarted = false;
  resetBeatriceTowerVolley();
  beatriceBoss.rewardStakePending = true;
  beatriceBoss.nextMechanicTimer = BEATRICE_NEXT_MECHANIC_DELAY;
  message = "Come, come, Seven Sisters of Purgatory!";
  messageTimer = 1.1;
}

function startRandomBeatriceMechanic() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "idle") return false;
  const pool = BEATRICE_MECHANIC_CHOICES.filter((choice) => choice !== beatriceBoss.lastMechanic);
  const choices = pool.length > 0 ? pool : BEATRICE_MECHANIC_CHOICES;
  const choice = choices[Math.floor(Math.random() * choices.length)];
  beatriceBoss.lastMechanic = choice;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.nextMechanicTimer = 0;
  beatriceBoss.ringAttackStarted = false;
  beatriceBoss.goatRushTelegraphs = [];
  beatriceBoss.goatRushTimer = 0;
  beatriceBoss.goatRushSpawned = false;
  beatriceBoss.towerVolleyStarted = false;
  resetBeatriceTowerVolley();
  if (choice === "goatTrial") {
    startBeatriceGoatTrial();
    return true;
  }
  if (choice === "ringAttack") {
    startBeatriceRingAttack();
    return true;
  }
  if (choice === "teleportAttack") {
    return startBeatriceTeleportPrep();
  }
  if (choice === "goatRush") {
    startBeatriceGoatRush();
    return true;
  }
  if (choice === "towerVolley") {
    startBeatriceTowerVolley();
    return true;
  }
  return false;
}

function startBeatriceGoatTrial() {
  const centerY = clampPlayY(player.y);
  beatriceBoss.mechanic = "goatTrial";
  beatriceBoss.wallsActive = true;
  beatriceBoss.wallTop = clamp(centerY - BEATRICE_GOAT_TRIAL_WALL_PADDING, PLAY_AREA_TOP, PLAY_AREA_BOTTOM - 22);
  beatriceBoss.wallBottom = clamp(centerY + BEATRICE_GOAT_TRIAL_WALL_PADDING, PLAY_AREA_TOP + 22, PLAY_AREA_BOTTOM);
  if (beatriceBoss.wallBottom - beatriceBoss.wallTop < 78) {
    beatriceBoss.wallTop = clamp(beatriceBoss.wallBottom - 78, PLAY_AREA_TOP, PLAY_AREA_BOTTOM);
  }
  const side = player.facing || (beatriceBoss.x >= player.x ? 1 : -1);
  const goatX = clamp(player.x + side * 240, cameraX + 150, cameraX + W - 150);
  const goatY = clamp(centerY, beatriceBoss.wallTop + 12, beatriceBoss.wallBottom - 12);
  const goat = makeEnemy(goatX, goatY, 98, "goat");
  goat.bossMechanic = "beatriceGoatTrial";
  goat.spawnGrace = ENEMY_SUMMON_GRACE;
  goat.facing = player.x >= goat.x ? 1 : -1;
  enemies.push(goat);
  summonPillars.push({ x: goatX, y: goatY, life: 0.72, max: 0.72 });
  beatriceBoss.trialGoat = goat;
  beatriceBoss.rewardStakePending = false;
}

function resolveBeatriceGoatTrial() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "goatTrial") return;
  completeBeatriceMechanic();
}

function startBeatriceRingAttack() {
  if (!beatriceBoss.active) return;
  const centerX = player.x;
  const centerY = player.y;
  beatriceBoss.mechanic = "ringAttack";
  beatriceBoss.ringAttackStarted = true;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.rings = [{
    x: centerX,
    y: centerY,
    radius: BEATRICE_RING_ATTACK_RADIUS,
    appearAt: 0,
    detonateAt: BEATRICE_RING_ATTACK_DELAY,
    timer: 0,
    detonated: false,
    leviathanSpawned: false
  }];
  message = "Run!";
  messageTimer = 0.9;
}

function finishBeatriceRingAttack() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "ringAttack") return;
  completeBeatriceMechanic();
}

function spawnLeviathanSlash(x, y, radius) {
  const facing = player.x >= x ? 1 : -1;
  leviathanAttacks.push({
    x,
    y,
    radius,
    facing,
    anim: 0,
    age: 0,
    life: leviathanFrames.length / LEVIATHAN_SLASH_ANIM_SPEED + 0.12,
    hit: false
  });
  spawnGoldenButterflies(x, y - 58, 22);
  spawnAsmodeusGoldenWisps(x, y - 48, 10);
}

function applyLeviathanSlashHit(attack) {
  const dx = player.x - attack.x;
  const dy = (player.y - attack.y) / 0.42;
  const inRing = Math.hypot(dx, dy) <= attack.radius;
  let launchedPlayer = false;
  let chainDirection = player.facing || 1;
  if (inRing && !isPlayerInvulnerable() && !player.airborne && !player.knockedDown) {
    const direction = Math.sign(player.x - attack.x) || player.facing || 1;
    chainDirection = direction;
    damagePlayer(BEATRICE_RING_ATTACK_DAMAGE);
    player.invuln = 0.45;
    player.action = "down";
    player.attackLock = 0;
    player.attackLungeRemaining = 0;
    launchActor(player, direction, BEATRICE_RING_ATTACK_LIFT, BEATRICE_RING_ATTACK_DRIFT);
    launchedPlayer = true;
    resetPlayerCombo();
    if (player.hp <= 0) defeatPlayer();
  }
  screenShakeTimer = Math.max(screenShakeTimer, 0.18);
  beatriceStakeShockwaves.push({ x: attack.x, y: attack.y, radius: attack.radius, life: 0.42, max: 0.42, color: "red" });
  if (launchedPlayer && player.hp > 0) spawnSatanAerialLaunch(chainDirection);
}

function spawnSatanAerialLaunch(direction) {
  const facing = direction || player.facing || 1;
  const x = clamp(player.x - facing * 70, cameraX + 72, cameraX + W - 72);
  const y = player.y;
  satanAttacks.push({
    x,
    y,
    z: SATAN_AERIAL_HOVER,
    facing,
    anim: 0,
    age: 0,
    life: satanFrames.length / SATAN_AERIAL_ANIM_SPEED + 0.14,
    hit: false
  });
  spawnGoldenButterflies(x, y - SATAN_AERIAL_HOVER - 32, 26);
  spawnAsmodeusGoldenWisps(x, y - SATAN_AERIAL_HOVER - 28, 12);
}

function applySatanAerialLaunchHit(attack) {
  if (state !== "playing" || player.hp <= 0) return;
  const direction = attack.facing || player.facing || 1;
  player.knockedDown = false;
  player.downTime = 0;
  player.airborne = true;
  player.z = Math.max(player.z, SATAN_AERIAL_HOVER * 0.72);
  player.vz = SATAN_AERIAL_LIFT;
  player.airVx = direction * SATAN_AERIAL_DRIFT;
  player.invuln = Math.max(player.invuln, 0.2);
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.currentAttack = "";
  resetPlayerCombo();
  burst(player.x, player.y - player.z - 34, "special");
  screenShakeTimer = Math.max(screenShakeTimer, 0.16);
  spawnBelphegorGroundBounceSlam(direction);
}

function spawnBelphegorGroundBounceSlam(direction) {
  const chainDirection = direction || player.facing || 1;
  const facing = -chainDirection;
  const x = clamp(player.x + chainDirection * BELPHEGOR_SIDE_OFFSET, cameraX + 70, cameraX + W - 70);
  const y = player.y;
  belphegorAttacks.push({
    x,
    y,
    z: BELPHEGOR_SLAM_HOVER,
    facing,
    impactDirection: chainDirection,
    delay: BELPHEGOR_SPAWN_DELAY,
    appeared: false,
    anim: 0,
    age: 0,
    life: belphegorFrames.length / BELPHEGOR_SLAM_ANIM_SPEED + 0.14,
    hit: false
  });
}

function applyBelphegorGroundBounceSlamHit(attack) {
  if (state !== "playing" || player.hp <= 0) return;
  const direction = attack.impactDirection || player.facing || 1;
  player.knockedDown = false;
  player.downTime = 0;
  player.airborne = true;
  player.z = Math.max(player.z, BELPHEGOR_SLAM_HOVER * 0.62);
  player.vz = -BELPHEGOR_SLAM_DOWN_SPEED;
  player.airVx = -direction * BELPHEGOR_SLAM_DRIFT;
  player.beatriceDropKickBouncePending = true;
  player.beatriceDropKickBounceTimer = BEATRICE_ASMO_DROP_KICK_BOUNCE_DELAY;
  player.beatriceDropKickBounceDirection = -direction;
  player.invuln = Math.max(player.invuln, 0.2);
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.currentAttack = "";
  resetPlayerCombo();
  burst(player.x, player.y - player.z - 30, "special");
  screenShakeTimer = Math.max(screenShakeTimer, 0.18);
}

function startBeatriceGoatRush() {
  if (!beatriceBoss.active) return;
  const top = PLAY_AREA_TOP;
  const bottom = PLAY_AREA_BOTTOM;
  const laneHeight = (bottom - top) / BEATRICE_GOAT_RUSH_LANES;
  beatriceBoss.mechanic = "goatRush";
  beatriceBoss.goatRushTimer = 0;
  beatriceBoss.goatRushSpawned = false;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.goatRushTelegraphs = [];
  for (let waveIndex = 0; waveIndex < BEATRICE_GOAT_RUSH_WAVES; waveIndex++) {
    const dangerLanes = shuffledIndices(BEATRICE_GOAT_RUSH_LANES).slice(0, BEATRICE_GOAT_RUSH_DANGER_LANES);
    dangerLanes.forEach((laneIndex, orderIndex) => {
      const y1 = top + laneIndex * laneHeight + 3;
      const y2 = top + (laneIndex + 1) * laneHeight - 3;
      beatriceBoss.goatRushTelegraphs.push({
        lane: laneIndex,
        wave: waveIndex,
        order: orderIndex,
        y1,
        y2,
        y: (y1 + y2) * 0.5,
        direction: Math.random() < 0.5 ? 1 : -1,
        startAt: waveIndex * (BEATRICE_GOAT_RUSH_TELEGRAPH_TIME + BEATRICE_GOAT_RUSH_WAVE_GAP) + orderIndex * BEATRICE_GOAT_RUSH_STAGGER,
        spawned: false,
        safe: false
      });
    });
  }
  message = "Find the gap!";
  messageTimer = 1.05;
}

function spawnBeatriceGoatRush(lane) {
  if (!lane || lane.spawned) return;
  lane.spawned = true;
  const direction = lane.direction || 1;
  const startX = direction === 1 ? cameraX - 170 : cameraX + W + 170;
  const travel = W + 380;
  const goat = makeEnemy(clamp(startX, -220, STAGE_W + 220), lane.y, 700 + lane.wave * 10 + lane.lane, "goat");
  goat.bossMechanic = "beatriceGoatRush";
  goat.spawnGrace = 0;
  goat.facing = direction;
  goat.goatAction = "charge";
  goat.goatHasHit = false;
  goat.goatChargeDx = direction;
  goat.goatChargeDy = 0;
  goat.goatChargeDistance = 0;
  goat.goatChargeLimit = travel;
  goat.goatChargeSpeed = GOAT_CHARGE_SPEED * BEATRICE_GOAT_RUSH_SPEED_MULTIPLIER;
  goat.anim = 0;
  goat.cooldown = 0;
  enemies.push(goat);
  summonPillars.push({ x: clamp(startX + direction * 70, cameraX + 40, cameraX + W - 40), y: lane.y, life: 0.32, max: 0.32 });
}

function updateBeatriceGoatRush(dt) {
  if (beatriceBoss.mechanic !== "goatRush") return;
  beatriceBoss.goatRushTimer += dt;
  for (const lane of beatriceBoss.goatRushTelegraphs) {
    if (!lane.spawned && beatriceBoss.goatRushTimer >= lane.startAt + BEATRICE_GOAT_RUSH_TELEGRAPH_TIME) {
      spawnBeatriceGoatRush(lane);
    }
  }
  beatriceBoss.goatRushSpawned = beatriceBoss.goatRushTelegraphs.every((lane) => lane.spawned);
  if (beatriceBoss.goatRushSpawned) {
    const activeRushGoats = enemies.some((enemy) => enemy.bossMechanic === "beatriceGoatRush" && !enemy.dead);
    if (!activeRushGoats) completeBeatriceMechanic();
  }
}

function resetBeatriceTowerVolley() {
  beatriceTowerVolley.active = false;
  beatriceTowerVolley.phase = "";
  beatriceTowerVolley.timer = 0;
  beatriceTowerVolley.wave = 0;
  beatriceTowerVolley.side = -1;
  beatriceTowerVolley.towers = [];
  beatriceTowerVolley.points = [];
  beatriceTowerVolley.safeZones = [];
  beatriceTowerVolley.missiles = [];
  beatriceTowerVolley.hitWaves = [];
}

function beatriceTowerLaneYs() {
  return [0.08, 0.34, 0.62, 0.9].map((t) => PLAY_AREA_TOP + (PLAY_AREA_BOTTOM - PLAY_AREA_TOP) * t);
}

function startBeatriceTowerVolley() {
  if (!beatriceBoss.active) return;
  beatriceBoss.mechanic = "towerVolley";
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.towerVolleyStarted = true;
  const side = beatriceBoss.x - cameraX < W * 0.5 ? -1 : 1;
  setupBeatriceTowerVolleyWave(0, side, true);
  message = "Shoulder War Towers of the Gods!";
  messageTimer = 1.25;
}

function setupBeatriceTowerVolleyWave(waveIndex, side, fresh = false) {
  if (fresh) {
    beatriceTowerVolley.towers = [];
    beatriceTowerVolley.hitWaves = [];
    beatriceTowerVolley.safeZones = [];
  }
  beatriceTowerVolley.active = true;
  beatriceTowerVolley.phase = "emerge";
  beatriceTowerVolley.timer = 0;
  beatriceTowerVolley.wave = waveIndex;
  beatriceTowerVolley.side = side;
  beatriceTowerVolley.points = [];
  beatriceTowerVolley.missiles = [];
  const towerScreenX = side < 0 ? -BEATRICE_TOWER_VOLLEY_EDGE_OVERHANG : W + BEATRICE_TOWER_VOLLEY_EDGE_OVERHANG;
  const towerSlots = [
    { xOffset: side * BEATRICE_TOWER_VOLLEY_TOWER_SEPARATION * 0.42, y: FLOOR_Y + 78 },
    { xOffset: -side * BEATRICE_TOWER_VOLLEY_TOWER_SEPARATION * 0.42, y: FLOOR_Y + 190 }
  ];
  for (const slot of towerSlots) {
    beatriceTowerVolley.towers.push({
      screenX: towerScreenX + slot.xOffset,
      y: slot.y,
      side,
      wave: waveIndex,
      seed: Math.random() * 1000,
      emerge: 0,
      retreat: 0
    });
  }
  const laneYs = beatriceTowerLaneYs();
  const chosen = shuffledIndices(laneYs.length).slice(0, 2);
  const safeLaneIndex = chosen[Math.floor(Math.random() * chosen.length)] ?? chosen[0];
  const safeZone = {
    wave: waveIndex,
    x: 150 + Math.random() * Math.max(1, STAGE_W - 300),
    y: clamp(laneYs[safeLaneIndex] + (Math.random() - 0.5) * 32, PLAY_AREA_TOP - 10, PLAY_AREA_BOTTOM + 10),
    rx: BEATRICE_TOWER_VOLLEY_SAFE_CLEAR_X,
    ry: BEATRICE_TOWER_VOLLEY_SAFE_CLEAR_Y
  };
  beatriceTowerVolley.safeZones.push(safeZone);
  const startWorldX = side < 0 ? 18 : STAGE_W - 18;
  const endWorldX = side < 0 ? STAGE_W - 18 : 18;
  const startScreenX = startWorldX - cameraX;
  const endScreenX = endWorldX - cameraX;
  const distance = Math.abs(endWorldX - startWorldX);
  const steps = Math.max(14, Math.floor(distance / BEATRICE_TOWER_VOLLEY_SPACING));
  for (const laneIndex of chosen) {
    const y = laneYs[laneIndex];
    const laneOutside = y < FLOOR_Y ? -1 : 1;
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const scatterOutward = Math.random() < BEATRICE_TOWER_VOLLEY_OUTSIDE_BIAS;
      const scatterDirection = scatterOutward ? laneOutside : -laneOutside;
      const scatterAmount = BEATRICE_TOWER_VOLLEY_LANE_SCATTER * (scatterOutward ? 0.28 + Math.random() * 0.72 : Math.random() * 0.65);
      const screenScatter = (Math.random() - 0.5) * BEATRICE_TOWER_VOLLEY_SCREEN_SCATTER * 2;
      const timingScatter = (Math.random() - 0.5) * BEATRICE_TOWER_VOLLEY_TIMING_SCATTER;
      const worldX = clamp(startWorldX + (endWorldX - startWorldX) * t + screenScatter, 18, STAGE_W - 18);
      const pointY = clamp(y + scatterDirection * scatterAmount + (Math.random() - 0.5) * 12, PLAY_AREA_TOP - 10, PLAY_AREA_BOTTOM + 10);
      if (beatriceTowerPointInSafeZone(worldX, pointY, safeZone)) continue;
      beatriceTowerVolley.points.push({
        screenX: startScreenX + (endScreenX - startScreenX) * t + screenScatter,
        x: worldX,
        y: pointY,
        wave: waveIndex,
        delay: Math.max(0.25, BEATRICE_TOWER_VOLLEY_TELEGRAPH_TIME + t * BEATRICE_TOWER_VOLLEY_SWEEP_TIME + timingScatter),
        struck: false
      });
    }
  }
}

function beatriceTowerPointInSafeZone(x, y, zone) {
  if (!zone) return false;
  const dx = (x - zone.x) / Math.max(1, zone.rx);
  const dy = (y - zone.y) / Math.max(1, zone.ry);
  return dx * dx + dy * dy <= 1;
}

function applyBeatriceTowerVolleyHit(point) {
  if (beatriceTowerVolley.hitWaves.includes(point.wave)) return;
  if (state !== "playing" || isPlayerInvulnerable() || player.airborne || player.knockedDown) return;
  const worldX = point.x;
  const dx = player.x - worldX;
  const dy = (player.y - point.y) / 0.45;
  if (Math.hypot(dx, dy) > BEATRICE_TOWER_VOLLEY_RADIUS) return;
  beatriceTowerVolley.hitWaves.push(point.wave);
  const direction = Math.sign(player.x - (beatriceTowerVolley.side < 0 ? cameraX : cameraX + W)) || -beatriceTowerVolley.side || player.facing || 1;
  damagePlayer(BEATRICE_TOWER_VOLLEY_DAMAGE);
  player.invuln = 0.35;
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.attackHasHit = false;
  player.currentAttack = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  launchActor(player, direction, BEATRICE_TOWER_VOLLEY_LIFT, BEATRICE_TOWER_VOLLEY_DRIFT);
  burst(player.x, player.y - 94, "enemy");
  screenShakeTimer = Math.max(screenShakeTimer, 0.26);
  if (player.hp <= 0) defeatPlayer();
}

function updateBeatriceTowerVolley(dt) {
  if (beatriceBoss.mechanic !== "towerVolley" || !beatriceTowerVolley.active) return;
  beatriceTowerVolley.timer += dt;
  const volley = beatriceTowerVolley;
  if (volley.phase === "emerge") {
    const t = clamp(volley.timer / BEATRICE_TOWER_VOLLEY_EMERGE_TIME, 0, 1);
    for (const tower of volley.towers) {
      if (tower.wave === volley.wave) tower.emerge = t;
    }
    if (volley.timer >= BEATRICE_TOWER_VOLLEY_EMERGE_TIME) {
      volley.phase = "fire";
      volley.timer = 0;
      for (const tower of volley.towers) {
        if (tower.wave === volley.wave) tower.emerge = 1;
      }
    }
    return;
  }

  if (volley.phase === "fire") {
    for (const point of volley.points) {
      if (point.struck || volley.timer < point.delay) continue;
      point.struck = true;
      const tower = volley.towers.find((entry) => entry.wave === point.wave) || volley.towers[0];
      const pointX = point.x;
      const fallbackScreenX = volley.side < 0 ? -BEATRICE_TOWER_VOLLEY_EDGE_OVERHANG : W + BEATRICE_TOWER_VOLLEY_EDGE_OVERHANG;
      const towerX = cameraX + (tower?.screenX ?? fallbackScreenX);
      const launchHeight = 390 + Math.random() * 230;
      volley.missiles.push({
        x1: towerX,
        y1: (tower?.y ?? FLOOR_Y) - launchHeight,
        x2: pointX,
        y2: point.y,
        curve: (volley.side < 0 ? -1 : 1) * (120 + Math.random() * 120),
        life: BEATRICE_TOWER_VOLLEY_MISSILE_TIME,
        max: BEATRICE_TOWER_VOLLEY_MISSILE_TIME,
        trail: []
      });
      beatriceStakeShockwaves.push({
        x: pointX,
        y: point.y,
        radius: BEATRICE_TOWER_VOLLEY_RADIUS,
        life: 0.24,
        max: 0.24,
        color: "red"
      });
      applyBeatriceTowerVolleyHit(point);
    }
    if (volley.points.every((point) => point.struck) && volley.timer >= BEATRICE_TOWER_VOLLEY_TELEGRAPH_TIME + BEATRICE_TOWER_VOLLEY_SWEEP_TIME + BEATRICE_TOWER_VOLLEY_WAVE_GAP) {
      if (volley.wave === 0) {
        setupBeatriceTowerVolleyWave(1, -volley.side);
      } else {
        volley.phase = "retreat";
        volley.timer = 0;
      }
    }
  } else if (volley.phase === "retreat") {
    const t = clamp(volley.timer / BEATRICE_TOWER_VOLLEY_RETREAT_TIME, 0, 1);
    for (const tower of volley.towers) tower.retreat = t;
    if (volley.timer >= BEATRICE_TOWER_VOLLEY_RETREAT_TIME) {
      resetBeatriceTowerVolley();
      completeBeatriceMechanic();
    }
  }

  for (let i = volley.missiles.length - 1; i >= 0; i--) {
    const missile = volley.missiles[i];
    const progress = 1 - clamp(missile.life / missile.max, 0, 1);
    const cx = (missile.x1 + missile.x2) * 0.5 + (missile.curve || 0);
    const cy = Math.min(missile.y1, missile.y2) - 150 - Math.abs(missile.curve || 0) * 0.2;
    const x = (1 - progress) * (1 - progress) * missile.x1 + 2 * (1 - progress) * progress * cx + progress * progress * missile.x2;
    const y = (1 - progress) * (1 - progress) * missile.y1 + 2 * (1 - progress) * progress * cy + progress * progress * missile.y2;
    missile.trail.push({ x, y });
    if (missile.trail.length > BEATRICE_TOWER_VOLLEY_TRAIL_POINTS) missile.trail.shift();
    missile.life -= dt;
    if (missile.life <= 0) volley.missiles.splice(i, 1);
  }
}

function startBeatriceStakeCast() {
  if (!beatriceBoss.active || beatriceBoss.flavor === "stakeCast") return;
  beatriceBoss.flavor = "stakeCast";
  beatriceBoss.anim = 0;
  beatriceBoss.stakeCastFired = false;
}

function beatriceIdleHoverPoint() {
  const playerScreenX = player.x - cameraX;
  const desiredScreenX = playerScreenX < W * 0.5 ? W * 0.78 : W * 0.22;
  return {
    x: clamp(cameraX + desiredScreenX, 90, STAGE_W - 90),
    y: clamp(player.y - 54, FLOOR_Y - 132, FLOOR_Y - 16)
  };
}

function canStartBeatriceTutorial() {
  if (state !== "playing" || beatriceTutorial.seen || beatriceTutorial.active) return false;
  if (!beatriceBoss.active || !beatriceBoss.barrierActive || beatriceBoss.vulnerable) return false;
  if (beatriceBoss.flavor !== "idle" && beatriceBoss.flavor !== "puff") return false;
  const dx = Math.abs(player.x - beatriceBoss.x);
  const dy = Math.abs(player.y - beatriceBoss.y);
  return dx <= BEATRICE_TUTORIAL_TRIGGER_RANGE && dy <= BEATRICE_TUTORIAL_TRIGGER_DEPTH;
}

function startBeatriceBarrierTutorial() {
  if (!canStartBeatriceTutorial()) return false;
  beatriceTutorial.active = true;
  beatriceTutorial.seen = true;
  beatriceTutorial.index = 0;
  beatriceTutorial.skipCooldown = BEATRICE_TUTORIAL_SKIP_DELAY;
  beatriceTutorial.scroll = 0;
  clearBeatriceBossMechanics();
  beatriceBoss.mechanic = "tutorial";
  beatriceBoss.rewardStakePending = false;
  const target = beatriceIdleHoverPoint();
  const frame = beatriceFrames.puff[0] || beatriceFrames.idle[0];
  spawnBeatriceAfterimage(target.x, target.y, 0.58, frame);
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 34);
  beatriceBoss.x = target.x;
  beatriceBoss.y = target.y;
  beatriceBoss.hoverOffset = 76;
  beatriceBoss.z = 0;
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  beatriceBoss.flavor = "puff";
  beatriceBoss.anim = 0;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 42);
  resetAttackHolds();
  keys.clear();
  player.duoCharge = 0;
  state = "beatriceTutorial";
  return true;
}

function advanceBeatriceTutorialDialogue() {
  if (!beatriceTutorial.active || beatriceTutorial.skipCooldown > 0) return;
  if (beatriceTutorial.index < BEATRICE_TUTORIAL_DIALOGUE.length - 1) {
    beatriceTutorial.index++;
    beatriceTutorial.skipCooldown = BEATRICE_TUTORIAL_SKIP_DELAY;
    beatriceTutorial.scroll = 0;
    return;
  }
  beatriceTutorial.active = false;
  beatriceTutorial.index = 0;
  beatriceTutorial.skipCooldown = 0;
  beatriceTutorial.scroll = 0;
  beatriceStakeTutorial.armed = true;
  beatriceStakeTutorial.explained = false;
  state = "playing";
  beatriceBoss.mechanic = "idle";
  beatriceBoss.lastMechanic = "";
  beatriceBoss.flavor = "idle";
  beatriceBoss.anim = 0;
  startRandomBeatriceMechanic();
}

function beatriceStakeTutorialLine() {
  if (!beatriceStakeTutorial.active) return null;
  return BEATRICE_STAKE_TUTORIAL_DIALOGUE[beatriceStakeTutorial.stage] || BEATRICE_STAKE_TUTORIAL_DIALOGUE.hint;
}

function findBeatriceStakeTutorialTarget() {
  if (beatriceStakeTutorial.stake && beatriceStakes.includes(beatriceStakeTutorial.stake)) {
    return beatriceStakeTutorial.stake;
  }
  return beatriceStakes.find((stake) => stake.mode === "launch") || null;
}

function startBeatriceStakeTutorial(stake) {
  if (!stake || beatriceStakeTutorial.active || !beatriceStakeTutorial.armed || beatriceStakeTutorial.explained) return false;
  beatriceStakeTutorial.active = true;
  beatriceStakeTutorial.stage = "hint";
  beatriceStakeTutorial.stake = stake;
  beatriceStakeTutorial.skipCooldown = BEATRICE_STAKE_TUTORIAL_SKIP_DELAY;
  beatriceStakeTutorial.scroll = 0;
  resetAttackHolds();
  keys.clear();
  state = "beatriceStakeTutorial";
  return true;
}

function maybeStartBeatriceStakeTutorial() {
  if (state !== "playing" || !beatriceStakeTutorial.armed || beatriceStakeTutorial.explained || beatriceStakeTutorial.active) return false;
  const stake = beatriceStakes.find((candidate) => candidate.mode === "launch");
  return startBeatriceStakeTutorial(stake);
}

function advanceBeatriceStakeTutorialDialogue() {
  if (!beatriceStakeTutorial.active || beatriceStakeTutorial.stage !== "hint" || beatriceStakeTutorial.skipCooldown > 0) return;
  beatriceStakeTutorial.active = false;
  beatriceStakeTutorial.explained = true;
  beatriceStakeTutorial.skipCooldown = 0;
  beatriceStakeTutorial.scroll = 0;
  state = "playing";
}

function maybeStartBeatriceStakeParryPrompt() {
  if (state !== "playing" || !beatriceStakeTutorial.armed || !beatriceStakeTutorial.explained || beatriceStakeTutorial.active) return false;
  const stake = beatriceStakes.find((candidate) => beatriceStakeParryReady(candidate));
  if (!stake) return false;
  beatriceStakeTutorial.active = true;
  beatriceStakeTutorial.stage = "parryNow";
  beatriceStakeTutorial.stake = stake;
  beatriceStakeTutorial.skipCooldown = BEATRICE_STAKE_TUTORIAL_PARRY_LOCKOUT;
  beatriceStakeTutorial.scroll = 0;
  resetAttackHolds();
  keys.clear();
  state = "beatriceStakeTutorial";
  return true;
}

function completeBeatriceStakeTutorialParry(force = false) {
  if (!beatriceStakeTutorial.active || beatriceStakeTutorial.stage !== "parryNow") return;
  if (beatriceStakeTutorial.skipCooldown > 0 && !force) return;
  const stake = findBeatriceStakeTutorialTarget();
  if (!stake || !beatriceStakeParryReady(stake)) return;
  beatriceStakeTutorial.active = false;
  beatriceStakeTutorial.armed = false;
  beatriceStakeTutorial.stage = "hint";
  beatriceStakeTutorial.stake = null;
  beatriceStakeTutorial.skipCooldown = 0;
  beatriceStakeTutorial.scroll = 0;
  state = "playing";
  tryBeatriceStakeParry();
}

function handleBeatriceStakeTutorialKey(key) {
  if (!beatriceStakeTutorial.active) return false;
  if (beatriceStakeTutorial.stage === "parryNow") {
    if (key === "j" || key === "k") completeBeatriceStakeTutorialParry(true);
    return true;
  }
  advanceBeatriceStakeTutorialDialogue();
  return true;
}

function randomVisibleBeatricePoint() {
  const x = clamp(cameraX + 130 + Math.random() * Math.max(120, W - 260), 90, STAGE_W - 90);
  const y = clamp(FLOOR_Y - 142 + Math.random() * 102, FLOOR_Y - 154, FLOOR_Y - 20);
  return { x, y };
}

function beatriceFinalTeleportSidePoint(side) {
  const offset = Math.min(96, BEATRICE_MELEE_KICK_RANGE * 0.62);
  const minX = Math.max(90, cameraX + 96);
  const maxX = Math.min(STAGE_W - 90, cameraX + W - 96);
  let x = player.x + side * offset;
  if (x < minX || x > maxX) {
    const flippedX = player.x - side * offset;
    x = flippedX >= minX && flippedX <= maxX ? flippedX : clamp(x, minX, maxX);
  }
  return {
    x,
    y: player.y
  };
}

function spawnBeatriceAfterimage(targetX, targetY, life = BEATRICE_TELEPORT_PREP_AFTERIMAGE_TIME, frameOverride = null) {
  const frame = frameOverride ?? beatriceFrames.teleportPrep[Math.floor(beatriceBoss.anim) % beatriceFrames.teleportPrep.length];
  beatriceAfterimages.push({
    x: beatriceBoss.x,
    y: beatriceBoss.y,
    fromX: beatriceBoss.x,
    fromY: beatriceBoss.y,
    targetX,
    targetY,
    facing: beatriceBoss.facing,
    frame,
    life,
    max: life
  });
}

function startBeatriceTeleportPrep() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "idle") return false;
  beatriceBoss.mechanic = "teleportAttack";
  beatriceBoss.rewardStakePending = false;
  const side = Math.random() < 0.5 ? -1 : 1;
  const points = [];
  for (let i = 0; i < BEATRICE_TELEPORT_PREP_JUMPS - 1; i++) points.push(randomVisibleBeatricePoint());
  points.push(beatriceFinalTeleportSidePoint(side));
  beatriceBoss.flavor = "teleportPrep";
  beatriceBoss.anim = 0;
  beatriceBoss.teleportPrepTimer = 0;
  beatriceBoss.teleportPrepIndex = 0;
  beatriceBoss.teleportPrepSide = side;
  beatriceBoss.teleportPrepPoints = points;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 24);
  return true;
}

function advanceBeatriceTeleportPrep() {
  const point = beatriceBoss.teleportPrepPoints[beatriceBoss.teleportPrepIndex];
  if (!point) {
    beatriceBoss.flavor = "meleeKick";
    beatriceBoss.anim = 0;
    beatriceBoss.teleportPrepTimer = 0;
    beatriceBoss.teleportPrepPoints = [];
    beatriceBoss.materializeTimer = 0.32;
    beatriceBoss.meleeKickHit = false;
    beatriceBoss.meleeKickParried = false;
    beatriceBoss.meleeKickParryFailed = false;
    beatriceBoss.meleeKickParryFailFade = 0;
    beatriceBoss.asmoDropKickPending = false;
    beatriceBoss.asmoDropKickTimer = 0;
    beatriceBoss.asmoDropKickHit = false;
    spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 42);
    return;
  }
  const converge = beatriceBoss.teleportPrepPoints[beatriceBoss.teleportPrepPoints.length - 1] || point;
  spawnBeatriceAfterimage(converge.x, converge.y);
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 18);
  beatriceBoss.x = point.x;
  beatriceBoss.y = point.y;
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 62, 18);
  beatriceBoss.teleportPrepIndex++;
  beatriceBoss.teleportPrepTimer = 0;
}

function spawnWave() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].dead) enemies.splice(i, 1);
  }
  messageBottles.length = 0;
  waveMode = currentWaveMode();
  if (waveMode === "boss") {
    beginBossWave();
    message = currentWaveLabel();
    messageTimer = 1.25;
    return;
  }
  restoreOwnedCompanionsForNormalWave();
  beatriceBoss.active = false;
  const count = Math.min(3 + wave, 8);
  const spawnOrder = shuffledIndices(count);
  for (let i = 0; i < count; i++) {
    const targetX = 760 + i * 310 + Math.random() * 130;
    const targetY = FLOOR_Y + (Math.random() * 92 - 46);
    spawnEnemyBottle(targetX, targetY, spawnOrder[i]);
  }
  message = `Wave ${wave}`;
  messageTimer = 1.25;
}

function startGame() {
  hideRunDetails();
  resetAttackHolds();
  latestRunRecord = null;
  latestRunRankInfo = null;
  resetRunStats();
  runDetailsButton.visible = false;
  player.x = 240;
  player.y = FLOOR_Y;
  player.hp = 100;
  player.resolve = 0;
  player.action = "idle";
  player.anim = 0;
  player.attackLock = 0;
  player.attackHasHit = false;
  player.superChargeShockwaveDone = false;
  player.currentAttack = "";
  player.attackConsumesResolve = false;
  player.pendingResolveAttack = false;
  player.attackLungeRemaining = 0;
  player.stage3KickAir = false;
  player.stage3KickTimer = 0;
  player.stage3KickVz = 0;
  player.airborne = false;
  player.z = 0;
  player.vz = 0;
  player.airVx = 0;
  player.knockedDown = false;
  player.downTime = 0;
  player.beatriceDropKickBouncePending = false;
  player.beatriceDropKickBounceTimer = 0;
  player.beatriceDropKickBounceDirection = 1;
  player.wallSlamTimer = 0;
  player.wallSlamTargetX = 0;
  player.wallSlamStartX = 0;
  player.wallSlamHit = false;
  player.meleeParryRecoilVx = 0;
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.dashCooldown = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  player.invuln = 0;
  player.duoCharge = 0;
  player.konpeitoGlowTimer = 0;
  player.konpeitoGlowPending = false;
  player.crystalShardActive = false;
  player.crystalShardTimer = 0;
  player.crystalShardStacks = [];
  player.konpeitoActive = false;
  player.konpeitoCooldown = 0;
  player.plumTeaActive = false;
  player.plumTeaBurned = false;
  player.oneWingedEagleActive = false;
  player.oneWingedEagleLevel = 0;
  player.blessings.launchExtension = 0;
  player.blessings.superCharge = false;
  player.blessings.lambdaKonpeitoSpecial = false;
  player.blessings.paperArmor = false;
  player.blessings.miracleRevival = 0;
  player.blessings.miracleShardFollowup = false;
  player.blessings.miracleCrystalShardPlus = false;
  player.blessings.miracleRisk = false;
  if (DEBUG_START_WITH_CANDY_CATACLYSM) {
    player.blessings.lambdaKonpeitoSpecial = true;
    player.resolve = 100;
  }
  if (DEBUG_START_WITH_CRYSTAL_FOLLOWUP) {
    player.blessings.miracleShardFollowup = true;
  }
  if (DEBUG_START_WITH_CRYSTAL_SHARD_PLUS) {
    player.blessings.miracleCrystalShardPlus = true;
  }
  player.poise = 0;
  player.bernHazardTimer = BERN_REVIVE_HAZARD_TEST_MODE ? 0 : bernHazardInterval();
  player.bernHazardAmuseKills = 0;
  player.itemOrder = [];
  player.seenItemTutorials = new Set();
  itemTutorial.active = false;
  itemTutorial.type = "";
  itemTutorial.previousState = "playing";
  itemTutorial.dismissDelay = 0;
  lambdaKonpeitoQuestion.active = false;
  lambdaKonpeitoQuestion.selection = 0;
  lambdaRetaliation.active = false;
  lambdaRetaliation.timer = 0;
  lambdaRetaliation.laughTimer = 0;
  lambdaRetaliation.laughDelay = LAMBDA_RETALIATION_LAUGH_INITIAL_DELAY;
  lambdaRetaliation.laughCount = 0;
  bossBlessingChoice.active = false;
  bossBlessingChoice.choices = [];
  bossBlessingChoice.pendingBoss = false;
  bossBlessingChoice.selected = 0;
  beatriceTutorial.active = false;
  beatriceTutorial.seen = false;
  beatriceTutorial.index = 0;
  beatriceTutorial.skipCooldown = 0;
  beatriceTutorial.scroll = 0;
  beatriceStakeTutorial.active = false;
  beatriceStakeTutorial.armed = false;
  beatriceStakeTutorial.explained = false;
  beatriceStakeTutorial.stage = "hint";
  beatriceStakeTutorial.stake = null;
  beatriceStakeTutorial.skipCooldown = 0;
  beatriceStakeTutorial.scroll = 0;
  beatriceBoss.active = false;
  beatriceBoss.x = 0;
  beatriceBoss.y = FLOOR_Y - 28;
  beatriceBoss.facing = -1;
  beatriceBoss.anim = 0;
  beatriceBoss.hoverOffset = 76;
  beatriceBoss.stakeTimer = BEATRICE_STAKE_INTERVAL;
  beatriceBoss.mechanic = "idle";
  beatriceBoss.lastMechanic = "";
  beatriceBoss.wallsActive = false;
  beatriceBoss.wallTop = FLOOR_Y - 72;
  beatriceBoss.wallBottom = FLOOR_Y + 34;
  beatriceBoss.trialGoat = null;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.nextMechanicTimer = 0;
  beatriceBoss.rings = [];
  beatriceBoss.ringAttackStarted = false;
  beatriceBoss.goatRushTelegraphs = [];
  beatriceBoss.goatRushTimer = 0;
  beatriceBoss.goatRushSpawned = false;
  beatriceBoss.towerVolleyStarted = false;
  beatriceBoss.flavor = "idle";
  beatriceBoss.flavorTimer = 0;
  beatriceBoss.stakeCastFired = false;
  beatriceBoss.teleportPrepTimer = 0;
  beatriceBoss.teleportPrepIndex = 0;
  beatriceBoss.teleportPrepSide = 1;
  beatriceBoss.teleportPrepPoints = [];
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.meleeKickHit = false;
  beatriceBoss.meleeKickParried = false;
  beatriceBoss.meleeKickParryFailed = false;
  beatriceBoss.meleeKickParryFailFade = 0;
  beatriceBoss.asmoDropKickPending = false;
  beatriceBoss.asmoDropKickTimer = 0;
  beatriceBoss.asmoDropKickHit = false;
  beatriceBoss.asmoDropKickSide = 1;
  beatriceBoss.hp = 1;
  beatriceBoss.maxHp = 1;
  beatriceBoss.stunDamageTaken = 0;
  beatriceBoss.defeatTimer = 0;
  beatriceBoss.defeatPhase = "";
  beatriceBoss.defeatMoveTimer = 0;
  beatriceBoss.defeatTrailTimer = 0;
  beatriceBoss.defeatStartX = 0;
  beatriceBoss.defeatStartY = 0;
  beatriceBoss.defeatTargetX = 0;
  beatriceBoss.defeatTargetY = 0;
  beatriceBoss.barrierActive = true;
  beatriceBoss.barrierMax = BEATRICE_BARRIER_MAX;
  beatriceBoss.barrierHp = beatriceBoss.barrierMax;
  beatriceBoss.vulnerable = false;
  beatriceBoss.breakVx = 0;
  beatriceBoss.breakFade = 0;
  beatriceBoss.z = 0;
  beatriceBoss.vz = 0;
  beatriceBoss.airVx = 0;
  beatriceBoss.downTime = 0;
  beatriceBoss.stunIdleTimer = 0;
  beatriceBoss.stunDamageTimer = 0;
  beatriceBoss.recoveryTimer = 0;
  beatriceStakes.length = 0;
  beatriceStakeTrails.length = 0;
  beatriceStakeShockwaves.length = 0;
  beatriceStakeSparkles.length = 0;
  resetBeatriceTowerVolley();
  beatriceDefeatWisps.length = 0;
  beatriceDefeatTrails.length = 0;
  beatriceStakeParryLine.life = 0;
  beatriceStakeParryPendingHit.active = false;
  asmodeusAttacks.length = 0;
  beelzebubAttacks.length = 0;
  leviathanAttacks.length = 0;
  satanAttacks.length = 0;
  belphegorAttacks.length = 0;
  beatriceAfterimages.length = 0;
  duoAttack.active = false;
  duoAttack.timer = 0;
  duoAttack.detonated = false;
  lambdaCompanion.active = false;
  lambdaCompanion.summoned = false;
  lambdaCompanion.anim = 0;
  lambdaCompanion.state = "idle";
  lambdaCompanion.moveSettle = 0;
  lambdaCompanion.konpeitoTimer = LAMBDA_KONPEITO_INTERVAL;
  lambdaCompanion.konpeitoCharge = 100;
  lambdaCompanion.castHasFired = false;
  lambdaCompanion.queuedKonpeito = false;
  bernCompanion.active = false;
  bernCompanion.summoned = false;
  bernCompanion.anim = 0;
  bernCompanion.state = "idle";
  bernCompanion.moveSettle = 0;
  bernCompanion.crystalTimer = BERN_CRYSTAL_INTERVAL;
  bernCompanion.crystalChargeGauge = 100;
  bernCompanion.crystalCharge = 0;
  bernCompanion.crystalHasFired = false;
  bernCompanion.queuedCrystal = false;
  bernCompanion.catForm = false;
  bernCompanion.attackTargetX = 0;
  bernCompanion.attackTargetY = FLOOR_Y;
  bernCompanion.parryClock = 0;
  bernCompanion.parryZ = 0;
  bernCompanion.parryVx = 0;
  bernCompanion.parryVz = 0;
  bernCompanion.parryFade = 0;
  pickups.length = 0;
  crystalShards.length = 0;
  pendingMiracleCrystalFollowups.length = 0;
  upwardCrystalShards.length = 0;
  crystalTrails.length = 0;
  crystalShockwaves.length = 0;
  konpeitoShots.length = 0;
  konpeitoShockwaves.length = 0;
  konpeitoGeysers.length = 0;
  konpeitoDomeBursts.length = 0;
  lambdaSpecialKonpeitos.length = 0;
  lambdaSpecialShrapnel.length = 0;
  messageBottles.length = 0;
  summonPillars.length = 0;
  screenFlashTimer = 0;
  screenShakeTimer = 0;
  enemyFreezeTimer = 0;
  beatriceStakeParryFreezeTimer = 0;
  bernParryOverlayTimer = 0;
  lambdaGameOverDialogue.active = false;
  lambdaGameOverDialogue.index = 0;
  lambdaGameOverDialogue.timer = 0;
  lambdaGameOverDialogue.skipCooldown = 0;
  score = 0;
  wave = 1;
  waveMode = currentWaveMode();
  cameraX = 0;
  state = "playing";
  debugGrantStartingKonpeito();
  debugGrantStartingPlumTea();
  spawnWave();
}

function setAction(name, lock = 0) {
  if (player.action !== name) {
    player.action = name;
    player.anim = 0;
    player.attackHasHit = false;
    player.crestAttackHasHit = false;
    if (!isPlayerComboAttack(name)) {
      player.currentAttack = "";
      player.attackConsumesResolve = false;
      player.pendingResolveAttack = false;
      player.poise = 0;
    }
  }
  if (lock) player.attackLock = lock;
}

function triggerBernRevive() {
  if ((player.blessings.miracleRevival || 0) > 0 && player.plumTeaActive && !player.plumTeaBurned) {
    player.blessings.miracleRevival -= 1;
    runStats.revivedByBernkastel += 1;
    player.hp = 100;
    player.resolve = 100;
    player.attackLock = 0;
    player.attackLungeRemaining = 0;
    player.stage3KickAir = false;
    player.stage3KickTimer = 0;
    player.stage3KickVz = 0;
    player.airborne = false;
    player.z = 0;
    player.vz = 0;
    player.airVx = 0;
    player.knockedDown = false;
    player.downTime = 0;
    player.runState = "none";
    player.runTimer = 0;
    player.runCharge = 0;
    player.brakeDrift = 0;
    player.brakeBurstTimer = 0;
    player.invuln = 1.2;
    resetPlayerCombo();
    setAction("idle");
    message = "A miracle rewrites defeat";
    messageTimer = 1.6;
    return true;
  }
  if (!bernCompanion.summoned || !player.plumTeaActive || player.plumTeaBurned) return false;
  runStats.revivedByBernkastel += 1;
  player.hp = 100;
  player.resolve = 100;
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.stage3KickAir = false;
  player.stage3KickTimer = 0;
  player.stage3KickVz = 0;
  player.airborne = false;
  player.z = 0;
  player.vz = 0;
  player.airVx = 0;
  player.knockedDown = false;
  player.downTime = 0;
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  player.invuln = 1.2;
  resetPlayerCombo();
  setAction("idle");
  player.plumTeaActive = false;
  player.plumTeaBurned = true;
  player.bernHazardTimer = bernHazardInterval();
  player.bernHazardAmuseKills = 0;
  bernCompanion.active = true;
  bernCompanion.summoned = true;
  bernCompanion.state = "sacrifice";
  bernCompanion.anim = 0;
  bernCompanion.moveSettle = 0;
  bernCompanion.crystalChargeGauge = 0;
  bernCompanion.crystalTimer = BERN_CRYSTAL_INTERVAL;
  bernCompanion.crystalCharge = 0;
  bernCompanion.crystalHasFired = false;
  bernCompanion.catForm = false;
  message = "A miracle";
  messageTimer = 1.6;
  return true;
}

function defeatPlayer() {
  if (state === "lost") return;
  if (triggerBernRevive()) return;
  runStats.wavesCompleted = Math.max(runStats.wavesCompleted, wave - 1);
  recordCompletedRun();
  player.hp = 0;
  player.attackLock = 0;
  player.invuln = 0;
  player.konpeitoGlowTimer = 0;
  player.konpeitoGlowPending = false;
  player.attackLungeRemaining = 0;
  player.stage3KickAir = false;
  player.stage3KickTimer = 0;
  player.stage3KickVz = 0;
  player.airborne = false;
  player.z = 0;
  player.vz = 0;
  player.airVx = 0;
  player.knockedDown = false;
  player.downTime = 0;
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.dashCooldown = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  screenShakeTimer = 0;
  setAction("down");
  startLambdaGameOver();
  startLambdaGameOverDialogue();
  state = "lost";
  message = "Try Again";
  messageTimer = 99;
}

function isSuperChargedAttack(kind, data) {
  return player.blessings.superCharge
    && player.attackConsumesResolve
    && data?.stage === 3
    && (kind === "punch3" || kind === "kick3");
}

function superChargeShockwaveDistance(x, y, centerX, centerY) {
  return Math.hypot(x - centerX, (y - centerY) * 1.35);
}

function triggerSuperChargeShockwave(kind, data, skippedEnemies = new Set(), skipBeatrice = false) {
  if (!isSuperChargedAttack(kind, data) || player.superChargeShockwaveDone) return { hit: false, defeated: false };
  player.superChargeShockwaveDone = true;
  const x = player.x + player.facing * 54;
  const y = player.y;
  const source = `battler:${kind}:superCharge`;
  const damage = Math.round(data.damage * SUPER_CHARGE_DAMAGE_MULTIPLIER);
  let hit = false;
  let defeated = false;

  spawnKonpeitoDomeBurst(x, y);
  screenShakeTimer = Math.max(screenShakeTimer, 0.18);

  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0 || skippedEnemies.has(enemy)) continue;
    if (superChargeShockwaveDistance(enemy.x, enemy.y, x, y) > SUPER_CHARGE_SHOCKWAVE_RADIUS) continue;
    const direction = Math.sign(enemy.x - player.x) || player.facing;
    damageEnemy(enemy, damage);
    launchEnemyByBattlerRules(
      enemy,
      direction,
      source,
      data.launchLift || SUPER_CHARGE_SHOCKWAVE_LIFT,
      data.launchDrift || SUPER_CHARGE_SHOCKWAVE_DRIFT
    );
    if (enemy.hp <= 0) {
      defeatEnemy(enemy);
      defeated = true;
    }
    hit = true;
  }

  if (!skipBeatrice && beatriceCanBeDamaged() && superChargeShockwaveDistance(beatriceBoss.x, beatriceBoss.y, x, y) <= SUPER_CHARGE_SHOCKWAVE_RADIUS) {
    const direction = Math.sign(beatriceBoss.x - player.x) || player.facing;
    const dealt = damageBeatrice(damage, direction);
    if (dealt > 0) {
      launchBeatriceByBattlerRules(direction, source, data.launchLift || BEATRICE_LAUNCH_LIFT, data.launchDrift || BEATRICE_LAUNCH_DRIFT);
      if (beatriceBoss.hp <= 0) {
        defeatBeatriceBoss();
        defeated = true;
      }
      hit = true;
    }
  }

  return { hit, defeated };
}

function applyAttackHit(kind, data) {
  let hit = false;
  let defeatedTarget = false;
  const superCharged = isSuperChargedAttack(kind, data);
  const attackDamage = superCharged ? Math.round(data.damage * SUPER_CHARGE_DAMAGE_MULTIPLIER) : data.damage;
  const directEnemyHits = new Set();
  let beatriceDirectHit = false;
  const hitbox = {
    x: player.x + (player.facing === 1 ? 34 : -data.range - 34),
    y: player.y - data.depth,
    w: data.range,
    h: data.depth * 2
  };
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0 || (!enemy.airborne && enemy.hurt > 0)) continue;
    if (enemy.knockedDown && !data.groundBounce) continue;
    const source = `battler:${kind}`;
    const hurtbox = enemyHurtbox(enemy);
    if (rectsTouch(hitbox, hurtbox)) {
      directEnemyHits.add(enemy);
      const groundBounceReady = data.groundBounce && canGroundBounceTarget(enemy);
      damageEnemy(enemy, attackDamage);
      const forceLaunch = player.goatParryCounter && (kind === "punch3" || kind === "kick3");
      const goatArmoredHit = enemy.type === "goat" && !enemy.airborne && enemy.goatArmorHits < 1 && (data.stage || 1) < 2;
      if (goatArmoredHit) {
        enemy.goatArmorHits = 1;
        enemy.goatArmorFlash = 0.28;
      } else {
        enemy.anim = 0;
        if (enemy.type === "goat") {
          enemy.goatHurtAnim = 0;
          enemy.goatArmorHits = 0;
          enemy.goatArmorFlash = 0;
          enemy.goatAction = "idle";
          enemy.goatHasHit = false;
          enemy.goatParryFailed = false;
          enemy.goatParryFailFade = 0;
        }
        if (!enemy.airborne) enemy.x += player.facing * (data.pushback || (data.knockdown ? 72 : kind === "special" ? 72 : 34));
      }
      if (enemy.type !== "goat") enemy.facing = -player.facing;
      player.combo += 1;
      score += 50 + player.combo * 8;
      hit = true;
      if (enemy.hp <= 0) {
        defeatedTarget = true;
        if (groundBounceReady && !forceLaunch) {
          groundBounceEnemyByBattlerRules(enemy, player.facing, source, data.launchLift, data.launchDrift);
        } else if (data.launch || forceLaunch) {
          launchEnemyByBattlerRules(enemy, player.facing, source, data.launchLift || 470, data.launchDrift || 170);
        } else if (enemy.airborne) {
          extendEnemyLaunch(enemy, player.facing, source);
        }
        defeatEnemy(enemy);
      } else if (goatArmoredHit) {
        // Goat shrugs off the first hit without flinching.
      } else if (groundBounceReady && !forceLaunch) {
        groundBounceEnemyByBattlerRules(enemy, player.facing, source, data.launchLift, data.launchDrift);
      } else if (data.launch || forceLaunch) {
        launchEnemyByBattlerRules(enemy, player.facing, source, data.launchLift || 470, data.launchDrift || 170);
      } else if (enemy.airborne) {
        extendEnemyLaunch(enemy, player.facing, source);
      } else if (data.knockdown) {
        enemy.knockedDown = true;
        enemy.downTime = 1.1;
        enemy.hurt = 0;
        enemy.attack = 0;
        enemy.attackTelegraph = 0;
        enemy.anim = 0;
      } else {
        enemy.hurt = enemy.type === "goat" ? GOAT_HIT_STUN_DURATION : 0.34;
        enemy.attack = 0;
        enemy.attackHasHit = false;
        enemy.attackTelegraph = 0;
      }
    }
  }
  if (beatriceCanBeDamaged() && rectsTouch(hitbox, beatriceHurtbox())) {
    const source = `battler:${kind}`;
    beatriceDirectHit = true;
    const dealt = damageBeatrice(attackDamage, player.facing);
    if (dealt > 0) {
      const groundBounceReady = data.groundBounce && canGroundBounceBeatrice();
      if (groundBounceReady) {
        groundBounceBeatriceByBattlerRules(player.facing, source, data.launchLift, data.launchDrift);
      } else if (data.launch) {
        launchBeatriceByBattlerRules(player.facing, source, data.launchLift || BEATRICE_LAUNCH_LIFT, data.launchDrift || BEATRICE_LAUNCH_DRIFT);
      } else if (beatriceBoss.flavor === "launched") {
        extendBeatriceLaunch(player.facing, source);
      } else if (data.knockdown || data.groundBounce) {
        startBeatriceDowned();
      }
      player.combo += 1;
      score += 90 + player.combo * 10;
      hit = true;
      if (beatriceBoss.hp <= 0) {
        defeatedTarget = true;
        defeatBeatriceBoss();
      }
    }
  }
  if (superCharged) {
    const shockwaveResult = triggerSuperChargeShockwave(kind, data, directEnemyHits, beatriceDirectHit);
    hit = hit || shockwaveResult.hit;
    defeatedTarget = defeatedTarget || shockwaveResult.defeated;
  }
  if (hit && data.stage === 3) {
    const followupTarget = [...directEnemyHits].find((enemy) => !enemy.dead && enemy.hp > 0);
    scheduleMiracleCrystalFollowup(followupTarget);
  }
  if (hit && data.gain) {
    const canGainResolve = !player.attackConsumesResolve || defeatedTarget;
    if (canGainResolve) {
      player.resolve = clamp(player.resolve + data.gain * RESOLVE_GAIN_MULTIPLIER, 0, 100);
    }
  }
  if (hit && data.stage) {
    player.comboStep = data.stage;
    player.comboTimer = data.stage >= 3 ? 0 : 0.95;
    player.comboQueuedKind = "";
  }
  return hit;
}

function applyCrestEchoHit(kind, data) {
  if (!player.oneWingedEagleActive || !data || !data.activeFrames) return false;
  const direction = -player.facing;
  const rangeScale = eagleCrestLevelScale();
  const hitWidth = EAGLE_CREST_HIT_WIDTH * rangeScale;
  const centerOffset = EAGLE_CREST_BACK_OFFSET_X - (EAGLE_CREST_HIT_WIDTH - hitWidth) * 0.5;
  const crestCenterX = player.x + direction * centerOffset;
  const crestCenterY = player.y - EAGLE_CREST_BACK_OFFSET_Y;
  const hitbox = {
    x: crestCenterX - hitWidth * 0.5,
    y: crestCenterY - EAGLE_CREST_HIT_HEIGHT * 0.5,
    w: hitWidth,
    h: EAGLE_CREST_HIT_HEIGHT
  };
  let hit = false;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0 || (!enemy.airborne && enemy.hurt > 0)) continue;
    if (enemy.knockedDown && !data.groundBounce) continue;
    const hurtbox = enemyHurtbox(enemy);
    if (!rectsTouch(hitbox, hurtbox)) continue;

    const source = `battlerCrest:${kind}`;
    const forceLaunch = player.goatParryCounter && (kind === "punch3" || kind === "kick3");
    const groundBounceReady = data.groundBounce && canGroundBounceTarget(enemy);
    const goatArmoredHit = enemy.type === "goat" && !enemy.airborne && enemy.goatArmorHits < 1 && (data.stage || 1) < 2;
    damageEnemy(enemy, data.damage * EAGLE_CREST_DAMAGE_MULTIPLIER);
    burst(enemy.x, enemy.y - (enemy.type === "goat" ? 180 : 82), "special");

    if (goatArmoredHit) {
      enemy.goatArmorHits = 1;
      enemy.goatArmorFlash = 0.28;
    } else {
      enemy.anim = 0;
      if (enemy.type === "goat") {
        enemy.goatHurtAnim = 0;
        enemy.goatArmorHits = 0;
        enemy.goatArmorFlash = 0;
        enemy.goatAction = "idle";
        enemy.goatHasHit = false;
        enemy.goatParryFailed = false;
        enemy.goatParryFailFade = 0;
      }
      if (!enemy.airborne) enemy.x += direction * (data.pushback ? data.pushback * 0.82 : (data.knockdown ? 54 : kind === "special" ? 54 : 26));
    }

    if (enemy.type !== "goat") enemy.facing = -direction;
    hit = true;
    if (enemy.hp <= 0) {
      if (groundBounceReady && !forceLaunch) {
        groundBounceEnemyByBattlerRules(enemy, direction, source, data.launchLift, data.launchDrift);
      } else if (data.launch || forceLaunch) {
        launchEnemyByBattlerRules(enemy, direction, source, data.launchLift || 470, data.launchDrift || 170);
      } else if (enemy.airborne) {
        extendEnemyLaunch(enemy, direction, source);
      }
      defeatEnemy(enemy);
    } else if (goatArmoredHit) {
      // Goat shrugs off the first light echo hit without flinching.
    } else if (groundBounceReady && !forceLaunch) {
      groundBounceEnemyByBattlerRules(enemy, direction, source, data.launchLift, data.launchDrift);
    } else if (data.launch || forceLaunch) {
      launchEnemyByBattlerRules(enemy, direction, source, data.launchLift || 470, data.launchDrift || 170);
    } else if (enemy.airborne) {
      extendEnemyLaunch(enemy, direction, source);
    } else if (data.knockdown) {
      enemy.knockedDown = true;
      enemy.downTime = 1.1;
      enemy.hurt = 0;
      enemy.attack = 0;
      enemy.anim = 0;
    } else {
      enemy.hurt = enemy.type === "goat" ? GOAT_HIT_STUN_DURATION : 0.24;
      enemy.attack = 0;
      enemy.attackHasHit = false;
    }
  }
  return hit;
}

function applyEnemyAttackHit(enemy) {
  const data = enemyAttackData[enemy.attackKind];
  if (!data || enemy.spawnGrace > 0 || isPlayerInvulnerable() || player.airborne || player.knockedDown) return false;
  const hurtbox = { x: player.x - 34, y: player.y - 72, w: 68, h: 106 };
  const hitOriginX = enemy.x + enemy.facing * 38;
  let contactX = player.x;
  let hit = false;
  if (enemy.attackKind === "kick") {
    const closestX = clamp(player.x, hurtbox.x, hurtbox.x + hurtbox.w);
    const closestY = clamp(player.y, hurtbox.y, hurtbox.y + hurtbox.h);
    const forward = (closestX - hitOriginX) * enemy.facing;
    const scaledY = (closestY - enemy.y) / ENEMY_KICK_TELEGRAPH_Y_SCALE;
    hit = forward >= 0 && Math.hypot(forward, scaledY) <= ENEMY_KICK_TELEGRAPH_RADIUS;
    contactX = hitOriginX + enemy.facing * clamp(forward, 0, ENEMY_KICK_TELEGRAPH_RADIUS);
  } else {
    const hitbox = {
      x: enemy.facing === 1 ? hitOriginX : hitOriginX - ENEMY_PUNCH_TELEGRAPH_RANGE,
      y: enemy.y - ENEMY_PUNCH_TELEGRAPH_DEPTH,
      w: ENEMY_PUNCH_TELEGRAPH_RANGE,
      h: ENEMY_PUNCH_TELEGRAPH_DEPTH * 2
    };
    hit = rectsTouch(hitbox, hurtbox);
    contactX = (Math.max(hitbox.x, hurtbox.x) + Math.min(hitbox.x + hitbox.w, hurtbox.x + hurtbox.w)) * 0.5;
  }
  if (!hit) return false;
  const contactY = player.y - 148;

  const damage = data.damage + Math.floor(wave / 2);
  damagePlayer(damage);
  if (absorbPlayerPoise(damage, false)) {
    player.invuln = Math.max(player.invuln, 0.12);
    burst(contactX, contactY, "enemy");
    if (player.hp <= 0) defeatPlayer();
    return true;
  }
  player.invuln = 0.5;
  player.x = clamp(player.x + enemy.facing * 28, 80, STAGE_W - 120);
  player.attackLungeRemaining = 0;
  player.stage3KickAir = false;
  player.stage3KickTimer = 0;
  player.stage3KickVz = 0;
  player.z = 0;
  resetPlayerCombo();
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  setAction("hurt", 0.38);
  player.combo = 0;
  burst(contactX, contactY, "enemy");
  if (player.hp <= 0) {
    defeatPlayer();
  }
  return true;
}

function pointInGoatPoundCone(enemy, x, y) {
  const startX = enemy.x + enemy.facing * 46;
  const forward = (x - startX) * enemy.facing;
  if (forward < 0 || forward > GOAT_POUND_RANGE) return false;
  const scaledY = (y - enemy.y) / GOAT_POUND_SEMICIRCLE_Y_SCALE;
  return Math.hypot(forward, scaledY) <= GOAT_POUND_RANGE;
}

function goatDetectsPlayer(enemy) {
  const inFront = (player.x - enemy.x) * enemy.facing > 0;
  const closeX = Math.abs(player.x - enemy.x) <= GOAT_POUND_DETECTION_RANGE;
  const closeY = Math.abs(player.y - enemy.y) <= GOAT_POUND_DEPTH;
  return inFront && closeX && closeY && !player.airborne && !player.knockedDown;
}

function startGoatShoulderCharge(enemy) {
  const facing = player.x >= enemy.x ? 1 : -1;
  const dx = Math.max(1, Math.abs(player.x - enemy.x));
  const maxSlope = Math.tan(GOAT_CHARGE_MAX_LANE_ANGLE);
  const slope = clamp((player.y - enemy.y) / dx, -maxSlope, maxSlope);
  const norm = Math.hypot(1, slope);
  enemy.facing = facing;
  enemy.goatAction = "chargeWindup";
  enemy.goatHasHit = false;
  enemy.goatParryFailed = false;
  enemy.goatParryFailFade = 0;
  enemy.goatChargeDx = facing / norm;
  enemy.goatChargeDy = slope / norm;
  enemy.goatChargeDistance = 0;
  enemy.goatNoDetectTimer = 0;
  enemy.anim = 0;
  enemy.cooldown = 0;
}

function pointInGoatChargePath(enemy, x, y, distance = GOAT_CHARGE_DISTANCE) {
  const startX = enemy.x + enemy.facing * 42;
  const startY = enemy.y;
  const dirX = enemy.goatChargeDx || enemy.facing;
  const dirY = enemy.goatChargeDy || 0;
  const relX = x - startX;
  const relY = y - startY;
  const along = relX * dirX + relY * dirY;
  if (along < -18 || along > distance) return false;
  const side = Math.abs(relX * -dirY + relY * dirX);
  return side <= GOAT_CHARGE_WIDTH * 0.5;
}

function applyGoatChargeHit(enemy) {
  if (enemy.spawnGrace > 0 || player.airborne || player.knockedDown || state !== "playing") return false;
  if (!pointInGoatChargePath(enemy, player.x, player.y, 96)) return false;
  if (isPlayerInvulnerable()) return true;
  damagePlayer(GOAT_CHARGE_DAMAGE + Math.floor(wave / 3));
  player.invuln = 0.35;
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.attackHasHit = false;
  player.currentAttack = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  launchActor(player, Math.sign(enemy.goatChargeDx || enemy.facing) || enemy.facing, GOAT_CHARGE_LIFT, GOAT_CHARGE_DRIFT);
  burst(player.x, player.y - 110, "enemy");
  screenShakeTimer = Math.max(screenShakeTimer, 0.32);
  if (player.hp <= 0) defeatPlayer();
  return true;
}

function applyGoatPoundHit(enemy) {
  if (enemy.spawnGrace > 0 || player.airborne || player.knockedDown || state !== "playing") return false;
  const impactX = enemy.x + enemy.facing * (46 + GOAT_POUND_RANGE * 0.72);
  const impactY = enemy.y;
  crystalShockwaves.push({
    x: impactX,
    y: impactY,
    life: 0.32,
    max: 0.32,
    radius: GOAT_POUND_SHOCKWAVE_RADIUS,
    touched: new Set(),
    shockwaveDamage: 0,
    dome: true
  });
  if (!pointInGoatPoundCone(enemy, player.x, player.y)) return false;
  if (isPlayerInvulnerable()) return false;
  damagePlayer(GOAT_POUND_DAMAGE + Math.floor(wave / 2));
  player.invuln = 0.35;
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.attackHasHit = false;
  player.currentAttack = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  launchActor(player, enemy.facing, GOAT_POUND_LIFT, GOAT_POUND_DRIFT);
  burst(player.x, player.y - 96, "enemy");
  burst(impactX, impactY - 38, "special");
  screenShakeTimer = Math.max(screenShakeTimer, 0.42);
  if (player.hp <= 0) defeatPlayer();
  return true;
}

function attack(kind) {
  if (state !== "playing") return false;
  if ((kind === "punch" || kind === "kick") && tryGoatPoundParry(kind)) return true;
  if (kind === "special") {
    if (player.resolve < 100 || player.airborne || player.knockedDown || player.action === "hurt" || player.action === "special" || player.action === "specialBeam" || player.action === "duoCharge" || duoAttack.active) {
      return false;
    }
    player.comboTimer = 0;
    player.comboQueuedKind = "";
    player.goatParryCounter = false;
    player.currentAttack = "special";
    player.attackConsumesResolve = true;
    player.pendingResolveAttack = false;
    player.crestAttackHasHit = false;
    player.superChargeShockwaveDone = false;
    player.poise = 0;
    player.attackLungeRemaining = 0;
    player.stage3KickAir = false;
    player.stage3KickTimer = 0;
    player.stage3KickVz = 0;
    player.runState = "none";
    player.runTimer = 0;
    player.runCharge = 0;
    player.brakeDrift = 0;
    player.brakeBurstTimer = 0;
    setAction("special", attackData.special.lock);
    return true;
  }
  if ((kind === "punch" || kind === "kick") && player.attackLock > 0 && player.comboTimer > 0 && player.comboStep > 0 && player.comboStep < 3) {
    player.comboQueuedKind = kind;
    return true;
  }
  if (player.attackLock > 0) return false;
  const action = kind === "punch" && isPlayerAtTopRunSpeed() ? "dashPunch" : kind === "punch" || kind === "kick" ? nextComboAction(kind) : kind;
  const data = attackData[action];
  if (!data) return false;
  if (!player.konpeitoGlowPending && player.konpeitoGlowTimer > 0) {
    player.konpeitoGlowTimer = 0;
  }
  player.comboTimer = 0;
  player.comboQueuedKind = "";
  player.goatParryCounter = false;
  player.currentAttack = action;
  player.attackConsumesResolve = !!player.pendingResolveAttack || kind === "special";
  player.pendingResolveAttack = false;
  player.crestAttackHasHit = false;
  player.superChargeShockwaveDone = false;
  player.poise = player.blessings.paperArmor && data.stage ? 25 : 0;
  player.attackLungeRemaining = data.lunge || 0;
  if (action === "kick3") {
    player.stage3KickAir = true;
    player.stage3KickTimer = 0;
    player.stage3KickVz = STAGE3_KICK_START_VZ;
    player.z = Math.max(player.z, 8);
  } else {
    player.stage3KickAir = false;
    player.stage3KickTimer = 0;
    player.stage3KickVz = 0;
  }
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  setAction(action, data.lock);
  if (!data.activeFrames) {
    applyAttackHit(action, data);
    applyCrestEchoHit(action, data);
    player.attackHasHit = true;
    player.crestAttackHasHit = true;
  }
  return true;
}

function canStartChargedAttack() {
  return state === "playing"
    && player.attackLock <= 0
    && !player.airborne
    && !player.knockedDown
    && player.action !== "special"
    && player.action !== "specialBeam"
    && player.action !== "duoCharge"
    && !duoAttack.active;
}

function chargedAttackResolveCost() {
  return CHARGED_ATTACK_RESOLVE_COST;
}

function nearestChargeTarget() {
  const candidates = enemies
    .filter((enemy) => !enemy.dead && enemy.spawnGrace <= 0)
    .map((enemy) => ({ x: enemy.x, y: enemy.y, dist: Math.hypot(enemy.x - player.x, enemy.y - player.y) }));
  if (beatriceCanBeDamaged()) {
    candidates.push({ x: beatriceBoss.x, y: beatriceBoss.y, dist: Math.hypot(beatriceBoss.x - player.x, beatriceBoss.y - player.y) });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0];
}

function teleportForSuperCharge() {
  if (!player.blessings.superCharge) return;
  const target = nearestChargeTarget();
  if (!target) return;
  const side = target.x >= player.x ? 1 : -1;
  burst(player.x, player.y - 90, "special");
  player.facing = side;
  player.x = clamp(target.x - side * 78, cameraX + 38, cameraX + W - 38);
  player.y = clampPlayY(target.y);
  burst(player.x, player.y - 90, "special");
}

function startChargedAttack(kind) {
  if (kind !== "punch" && kind !== "kick") return false;
  const cost = chargedAttackResolveCost();
  if (player.resolve < cost || !canStartChargedAttack()) return false;
  const action = `${kind}3`;
  player.resolve = Math.max(0, player.resolve - cost);
  resolveSpendFlashTimer = 0.34;
  player.pendingResolveAttack = true;
  teleportForSuperCharge();
  const started = attack(action);
  if (!started) {
    player.pendingResolveAttack = false;
    player.attackConsumesResolve = false;
    player.resolve = Math.min(100, player.resolve + cost);
    resolveSpendFlashTimer = 0;
  }
  return started;
}

function updateAttackHolds(dt) {
  if (state !== "playing") return;
  for (const [kind, hold] of Object.entries(attackHolds)) {
    if (!hold.down || hold.triggered) continue;
    hold.timer += dt;
    if (hold.timer >= CHARGED_ATTACK_HOLD_TIME && startChargedAttack(kind)) {
      hold.triggered = true;
    }
  }
}

function attackChargeProgress() {
  if (state !== "playing") return 0;
  let progress = 0;
  for (const hold of Object.values(attackHolds)) {
    if (!hold.down || hold.triggered) continue;
    progress = Math.max(progress, clamp(hold.timer / CHARGED_ATTACK_HOLD_TIME, 0, 1));
  }
  return progress;
}

function burst(x, y, kind) {
  const color = kind === "special" ? "#f6d365" : kind === "enemy" ? "#ff263f" : "#ff6f5e";
  const count = kind === "special" ? 28 : 14;
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 280,
      vy: (Math.random() - 0.8) * 220,
      life: 0.42 + Math.random() * 0.22,
      max: 0.64,
      color
    });
  }
}

function spawnGoldenSparkles(x, y, count = 24) {
  for (let i = 0; i < count; i++) {
    beatriceStakeSparkles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 240,
      vy: -80 - Math.random() * 180,
      life: 0.44 + Math.random() * 0.28,
      max: 0.72,
      size: 3 + Math.random() * 4
    });
  }
}

function spawnGoldenButterflies(x, y, count = 28) {
  for (let i = 0; i < count; i++) {
    beatriceStakeSparkles.push({
      x: x + (Math.random() - 0.5) * 34,
      y: y + (Math.random() - 0.5) * 72,
      vx: (Math.random() - 0.5) * 310,
      vy: -120 - Math.random() * 260,
      life: 0.5 + Math.random() * 0.32,
      max: 0.82,
      size: 5 + Math.random() * 5,
      butterfly: true,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 9
    });
  }
}

function spawnBeatriceDefeatWisps(x, y) {
  for (let i = 0; i < BEATRICE_DEFEAT_WISP_COUNT; i++) {
    const angle = -Math.PI * 0.78 + Math.random() * Math.PI * 1.56;
    const speed = 160 + Math.random() * 360;
    const sidePush = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 260);
    beatriceDefeatWisps.push({
      x: x + (Math.random() - 0.5) * 130,
      y: y + (Math.random() - 0.5) * 150,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed + sidePush,
      vy: Math.sin(angle) * speed - 90 - Math.random() * 140,
      life: 1.15 + Math.random() * 0.75,
      max: 1.9,
      size: 8 + Math.random() * 10,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 7
    });
  }
}

function spawnAsmodeusGoldenWisps(x, y, count = 14) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI * 0.92 + Math.random() * Math.PI * 1.84;
    const speed = 110 + Math.random() * 240;
    beatriceDefeatWisps.push({
      x: x + (Math.random() - 0.5) * 64,
      y: y + (Math.random() - 0.5) * 96,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 160,
      vy: Math.sin(angle) * speed - 80 - Math.random() * 110,
      life: 0.62 + Math.random() * 0.34,
      max: 0.96,
      size: 5 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8
    });
  }
}

function updateBeatriceDefeatWisps(dt) {
  for (let i = beatriceDefeatWisps.length - 1; i >= 0; i--) {
    const wisp = beatriceDefeatWisps[i];
    wisp.life -= dt;
    wisp.px = wisp.x;
    wisp.py = wisp.y;
    wisp.x += wisp.vx * dt;
    wisp.y += wisp.vy * dt;
    wisp.vx *= 1 - 0.45 * dt;
    wisp.vy -= 18 * dt;
    wisp.angle += wisp.spin * dt;
    beatriceDefeatTrails.push({
      x1: wisp.px,
      y1: wisp.py,
      x2: wisp.x,
      y2: wisp.y,
      life: 0.34,
      max: 0.34,
      size: wisp.size * 0.34
    });
    if (wisp.life <= 0) beatriceDefeatWisps.splice(i, 1);
  }
  for (let i = beatriceDefeatTrails.length - 1; i >= 0; i--) {
    const trail = beatriceDefeatTrails[i];
    trail.life -= dt;
    if (trail.life <= 0) beatriceDefeatTrails.splice(i, 1);
  }
}

function spawnAsmodeusUppercut(worldX, worldY, facing) {
  const side = facing || player.facing || 1;
  const x = clamp(worldX + side * 58, 80, STAGE_W - 90);
  const y = worldY;
  asmodeusAttacks.push({
    x,
    y,
    facing: side,
    age: 0,
    anim: 0,
    hit: false,
    life: 0.72,
    maxLife: 0.72,
    exitSpawned: false
  });
  spawnGoldenButterflies(x - side * 16, y - 96, 40);
  spawnAsmodeusGoldenWisps(x, y - 100, 16);
}

function armBeatriceAsmodeusDropKick(side) {
  if (!beatriceBoss.active || beatriceBoss.vulnerable || beatriceBoss.flavor === "defeated") return;
  beatriceBoss.asmoDropKickPending = true;
  beatriceBoss.asmoDropKickTimer = 0.04;
  beatriceBoss.asmoDropKickHit = false;
  beatriceBoss.asmoDropKickSide = side || player.facing || 1;
}

function startBeatriceAsmodeusDropKick() {
  if (!beatriceBoss.active || !beatriceBoss.asmoDropKickPending || state !== "playing") return false;
  if (beatriceBoss.vulnerable || ["barrierBreak", "dizzy", "hurt", "launched", "downed", "stunRecover", "defeated"].includes(beatriceBoss.flavor)) {
    beatriceBoss.asmoDropKickPending = false;
    beatriceBoss.asmoDropKickTimer = 0;
    return false;
  }
  const side = beatriceBoss.asmoDropKickSide || Math.sign(player.airVx) || player.facing || 1;
  beatriceBoss.asmoDropKickPending = false;
  beatriceBoss.asmoDropKickTimer = 0;
  beatriceBoss.asmoDropKickHit = false;
  spawnBeelzebubDropSlash(side);
  return true;
}

function spawnBeelzebubDropSlash(side) {
  const facing = side || Math.sign(player.airVx) || player.facing || 1;
  const x = clamp(player.x - facing * BEATRICE_ASMO_DROP_KICK_SIDE_OFFSET, cameraX + 70, cameraX + W - 70);
  const y = clampPlayY(player.y);
  const z = BEELZEBUB_DROP_SLASH_HOVER;
  beelzebubAttacks.push({
    x,
    y,
    z,
    facing,
    age: 0,
    anim: 0,
    hit: false,
    life: 0.96,
    maxLife: 0.96,
    exitSpawned: false
  });
  spawnGoldenButterflies(x - facing * 12, y - z - 46, 54);
  spawnAsmodeusGoldenWisps(x, y - z - 48, 18);
}

function applyBeelzebubDropSlashHit(attack) {
  if (state !== "playing" || !player.airborne || player.knockedDown) return false;
  const side = attack.facing || Math.sign(player.x - attack.x) || player.facing || 1;
  player.x = clamp(attack.x + side * BEATRICE_ASMO_DROP_KICK_CATCH_OFFSET, cameraX + 24, cameraX + W - 24);
  player.y = clampPlayY(attack.y);
  player.z = Math.max(player.z || 0, attack.z || 104);
  damagePlayer(BEATRICE_ASMO_DROP_KICK_DAMAGE);
  player.invuln = Math.max(player.invuln, 0.28);
  player.attackLungeRemaining = 0;
  player.currentAttack = "";
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.action = "down";
  player.vz = -BEATRICE_ASMO_DROP_KICK_DOWN_SPEED;
  player.airVx = side * BEATRICE_ASMO_DROP_KICK_DRIFT;
  player.z = Math.max(player.z || 0, attack.z || 72);
  player.beatriceDropKickBouncePending = true;
  player.beatriceDropKickBounceTimer = BEATRICE_ASMO_DROP_KICK_BOUNCE_DELAY;
  player.beatriceDropKickBounceDirection = side;
  player.attackLock = 0.45;
  resetPlayerCombo();
  burst(player.x, player.y - Math.max(84, player.z * 0.45), "enemy");
  screenShakeTimer = Math.max(screenShakeTimer, 0.22);
  if (player.hp <= 0) defeatPlayer();
  return true;
}

function applyBeatriceAsmodeusDropKickHit() {
  return applyBeelzebubDropSlashHit({
    x: beatriceBoss.x,
    y: beatriceBoss.y,
    z: beatriceBoss.hoverOffset || BEATRICE_ASMO_DROP_KICK_HOVER,
    facing: beatriceBoss.facing || beatriceBoss.asmoDropKickSide || player.facing || 1
  });
}

function applyAsmodeusUppercutHit(attack) {
  if (state !== "playing" || player.airborne || player.knockedDown) return;
  const side = attack.facing || Math.sign(player.x - attack.x) || player.facing || 1;
  damagePlayer(16);
  player.invuln = 0.45;
  player.attackLungeRemaining = 0;
  player.currentAttack = "";
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.action = "down";
  launchActor(player, side, BEATRICE_ASMO_UPPERCUT_LIFT, BEATRICE_ASMO_UPPERCUT_DRIFT);
  resetPlayerCombo();
  if (player.hp > 0) armBeatriceAsmodeusDropKick(side);
  if (player.hp <= 0) defeatPlayer();
}

function startPlayerWallSlam(direction) {
  const side = direction || player.facing || 1;
  player.airborne = false;
  player.knockedDown = false;
  player.z = 0;
  player.vz = 0;
  player.airVx = 0;
  player.wallSlamTimer = BEATRICE_MELEE_KICK_WALL_SLAM_TIME;
  player.wallSlamStartX = player.x;
  player.wallSlamTargetX = clamp(side > 0 ? cameraX + W - 84 : cameraX + 84, 80, STAGE_W - 120);
  player.wallSlamHit = false;
  player.action = "hurt";
  player.anim = 0;
  player.attackLock = BEATRICE_MELEE_KICK_WALL_SLAM_TIME + 0.55;
}

function applyBeatriceMeleeKickHit() {
  if (state !== "playing" || player.airborne || player.knockedDown || isPlayerInvulnerable()) return false;
  if (!playerInBeatriceMeleeKickTelegraph()) return false;
  const side = beatriceBoss.facing || Math.sign(player.x - beatriceBoss.x) || 1;
  damagePlayer(BEATRICE_MELEE_KICK_DAMAGE);
  player.attackLock = 0;
  player.attackLungeRemaining = 0;
  player.attackHasHit = false;
  player.crestAttackHasHit = false;
  player.currentAttack = "";
  player.runState = "none";
  player.runTimer = 0;
  player.runCharge = 0;
  player.brakeDrift = 0;
  player.brakeBurstTimer = 0;
  resetPlayerCombo();
  startPlayerWallSlam(side);
  burst(player.x, player.y - 118, "enemy");
  screenShakeTimer = Math.max(screenShakeTimer, 0.22);
  if (player.hp <= 0) defeatPlayer();
  return true;
}

function resetBeatriceStunTimers() {
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
}

function launchBeatrice(direction, lift = BEATRICE_LAUNCH_LIFT, drift = BEATRICE_LAUNCH_DRIFT, source = "unknown") {
  if (!beatriceCanBeDamaged()) return false;
  const alreadyAirborne = beatriceBoss.flavor === "launched" && (beatriceBoss.z || 0) > 0;
  beatriceBoss.flavor = "launched";
  beatriceBoss.anim = 0;
  if (alreadyAirborne) {
    if (beatriceBoss.launchSource === source) {
      const scale = juggleScaleFor(beatriceBoss);
      beatriceBoss.vz = Math.max(beatriceBoss.vz, lift * 0.48 * scale);
      beatriceBoss.airVx = beatriceBoss.airVx * 0.45 + direction * drift * 0.55 * scale;
    } else {
      beatriceBoss.juggleCount = 0;
      beatriceBoss.vz = lift;
      beatriceBoss.airVx = direction * drift;
    }
    beatriceBoss.z = Math.max(beatriceBoss.z || 0, 18);
  } else {
    beatriceBoss.z = Math.max(beatriceBoss.z || 0, 8);
    beatriceBoss.vz = lift;
    beatriceBoss.airVx = direction * drift;
    beatriceBoss.juggleCount = 0;
  }
  beatriceBoss.launchSource = source;
  beatriceBoss.downTime = 0;
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  if (beatriceBoss.stunDamageTimer <= 0) beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
  return true;
}

function extendBeatriceLaunch(direction, source, lift = 260, drift = 90) {
  if (!beatriceCanBeDamaged() || beatriceBoss.flavor !== "launched" || beatriceBoss.launchSource === source) return false;
  const scale = juggleScaleFor(beatriceBoss);
  beatriceBoss.vz = Math.max(beatriceBoss.vz, lift * scale);
  beatriceBoss.airVx = beatriceBoss.airVx * 0.68 + direction * drift * 0.32 * scale;
  beatriceBoss.z = Math.max(beatriceBoss.z || 0, 14);
  beatriceBoss.launchSource = source;
  beatriceBoss.anim = 0;
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  if (beatriceBoss.stunDamageTimer <= 0) beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
  return true;
}

function proratedBeatriceJuggle(direction, source, lift = 260, drift = 90) {
  if (!beatriceCanBeDamaged()) return false;
  const scale = juggleScaleFor(beatriceBoss);
  beatriceBoss.flavor = "launched";
  beatriceBoss.anim = 0;
  beatriceBoss.z = Math.max(beatriceBoss.z || 0, 14);
  beatriceBoss.vz = Math.max(beatriceBoss.vz || 0, lift * 0.48 * scale);
  beatriceBoss.airVx = (beatriceBoss.airVx || 0) * 0.6 + direction * drift * 0.4 * scale;
  beatriceBoss.launchSource = source;
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  if (beatriceBoss.stunDamageTimer <= 0) beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
  return true;
}

function launchBeatriceByBattlerRules(direction, source, lift = BEATRICE_LAUNCH_LIFT, drift = BEATRICE_LAUNCH_DRIFT) {
  if (isBattlerOwnedSource(source) && beatriceBoss.battlerLaunchSpent) {
    if (!spendBattlerExtraLaunchExtension(beatriceBoss)) {
      return proratedBeatriceJuggle(direction, source, lift, drift);
    }
  } else if (isBattlerOwnedSource(source)) {
    beatriceBoss.battlerLaunchSpent = true;
  }
  return launchBeatrice(direction, lift, drift, source);
}

function canGroundBounceBeatrice() {
  return beatriceBoss.flavor === "launched" || beatriceBoss.flavor === "downed" || (beatriceBoss.z || 0) > 0;
}

function groundBounceBeatrice(direction, source, lift = STAGE3_KICK_BOUNCE_LIFT, drift = STAGE3_KICK_BOUNCE_DRIFT) {
  if (!beatriceCanBeDamaged()) return false;
  beatriceBoss.flavor = "launched";
  beatriceBoss.anim = 0;
  beatriceBoss.z = Math.max(beatriceBoss.z || 0, player.z || 0, STAGE3_KICK_BOUNCE_FALL_HEIGHT * 1.08);
  beatriceBoss.vz = -STAGE3_KICK_BOUNCE_FALL_SPEED;
  beatriceBoss.airVx = direction * 28;
  beatriceBoss.downTime = Math.max(beatriceBoss.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.14);
  beatriceBoss.groundBouncePending = true;
  beatriceBoss.groundBounceTimer = -1;
  beatriceBoss.groundBounceDirection = direction;
  beatriceBoss.groundBounceSource = source;
  beatriceBoss.groundBounceLift = lift;
  beatriceBoss.groundBounceDrift = drift;
  beatriceBoss.stunIdleTimer = BEATRICE_STUN_IDLE_TIMEOUT;
  if (beatriceBoss.stunDamageTimer <= 0) beatriceBoss.stunDamageTimer = BEATRICE_STUN_DAMAGE_TIMEOUT;
  return true;
}

function groundBounceBeatriceByBattlerRules(direction, source, lift = STAGE3_KICK_BOUNCE_LIFT, drift = STAGE3_KICK_BOUNCE_DRIFT) {
  if (isBattlerOwnedSource(source) && beatriceBoss.battlerGroundBounceSpent) {
    if (!spendBattlerExtraLaunchExtension(beatriceBoss)) {
      return proratedBeatriceJuggle(direction, source, lift, drift);
    }
  } else if (isBattlerOwnedSource(source)) {
    beatriceBoss.battlerGroundBounceSpent = true;
  }
  return groundBounceBeatrice(direction, source, lift, drift);
}

function updateBeatriceGroundBounce(dt) {
  if (!beatriceBoss.groundBouncePending && !beatriceBoss.groundBounceTimer) return false;
  if (beatriceBoss.flavor === "launched") return false;
  if (beatriceBoss.groundBounceTimer < 0) {
    beatriceBoss.groundBounceTimer = STAGE3_KICK_BOUNCE_DELAY;
    beatriceBoss.downTime = Math.max(beatriceBoss.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.12);
    beatriceBoss.anim = Math.min(beatriceFrames.downed.length - 1.01, 0);
    return false;
  }
  beatriceBoss.groundBounceTimer = Math.max(0, beatriceBoss.groundBounceTimer - dt);
  if (beatriceBoss.groundBounceTimer > 0) return false;
  const direction = beatriceBoss.groundBounceDirection || beatriceBoss.facing || player.facing || 1;
  const source = beatriceBoss.groundBounceSource || "battler:kick3";
  const lift = beatriceBoss.groundBounceLift || STAGE3_KICK_BOUNCE_LIFT;
  const drift = beatriceBoss.groundBounceDrift || STAGE3_KICK_BOUNCE_DRIFT;
  beatriceBoss.groundBounceTimer = 0;
  beatriceBoss.groundBouncePending = false;
  beatriceBoss.groundBounceDirection = 0;
  beatriceBoss.groundBounceSource = "";
  beatriceBoss.groundBounceLift = 0;
  beatriceBoss.groundBounceDrift = 0;
  launchBeatrice(direction, lift, drift, source);
  return true;
}

function startBeatriceDowned() {
  beatriceBoss.flavor = "downed";
  beatriceBoss.anim = 0;
  beatriceBoss.z = 0;
  beatriceBoss.vz = 0;
  beatriceBoss.airVx = 0;
  beatriceBoss.launchSource = "";
  beatriceBoss.juggleCount = 0;
  beatriceBoss.downTime = BEATRICE_DOWNED_DURATION;
  screenShakeTimer = Math.max(screenShakeTimer, 0.12);
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 36, 18);
}

function startBeatriceStunRecovery() {
  if (!beatriceBoss.active) return;
  beatriceBoss.flavor = "stunRecover";
  beatriceBoss.anim = 0;
  beatriceBoss.recoveryTimer = BEATRICE_STUN_RECOVERY_TIME;
  beatriceBoss.vulnerable = false;
  beatriceBoss.z = 0;
  beatriceBoss.vz = 0;
  beatriceBoss.airVx = 0;
  beatriceBoss.downTime = 0;
  beatriceBoss.stunIdleTimer = 0;
  beatriceBoss.stunDamageTimer = 0;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 58, 34);
}

function finishBeatriceStunRecovery() {
  beatriceBoss.flavor = "idle";
  beatriceBoss.anim = 0;
  beatriceBoss.recoveryTimer = 0;
  beatriceBoss.hoverOffset = 76;
  beatriceBoss.y = clamp(player.y - 44, FLOOR_Y - 124, FLOOR_Y - 8);
  beatriceBoss.z = 0;
  beatriceBoss.barrierActive = true;
  beatriceBoss.barrierMax = BEATRICE_BARRIER_MAX;
  beatriceBoss.barrierHp = beatriceBoss.barrierMax;
  beatriceBoss.vulnerable = false;
  resetBattlerLaunchComboFlags(beatriceBoss);
  beatriceBoss.breakFade = 0;
  beatriceBoss.breakVx = 0;
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 64, 42);
  startRandomBeatriceMechanic();
}

function damageBeatriceBarrier(amount, direction = 1) {
  if (!beatriceBoss.active || !beatriceBoss.barrierActive) return false;
  const maxBarrier = beatriceBoss.barrierMax || BEATRICE_BARRIER_MAX;
  beatriceBoss.barrierMax = maxBarrier;
  beatriceBoss.barrierHp = clamp((beatriceBoss.barrierHp ?? maxBarrier) - amount, 0, maxBarrier);
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 64, 24);
  spawnAsmodeusGoldenWisps(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 64, 8);
  screenShakeTimer = Math.max(screenShakeTimer, 0.16);
  if (beatriceBoss.barrierHp <= 0) return startBeatriceBarrierBreak(direction);
  return false;
}

function startBeatriceBarrierBreak(direction = 1) {
  if (!beatriceBoss.active) return false;
  beatriceBoss.barrierActive = false;
  beatriceBoss.barrierHp = 0;
  beatriceBoss.vulnerable = false;
  beatriceBoss.flavor = "barrierBreak";
  beatriceBoss.anim = 0;
  beatriceBoss.breakVx = direction * BEATRICE_BARRIER_BREAK_DRIFT;
  beatriceBoss.breakFade = 1;
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.meleeKickHit = false;
  beatriceBoss.meleeKickParried = false;
  beatriceBoss.meleeKickParryFailed = false;
  beatriceBoss.meleeKickParryFailFade = 0;
  beatriceBoss.asmoDropKickPending = false;
  beatriceBoss.asmoDropKickTimer = 0;
  beatriceBoss.asmoDropKickHit = false;
  beatriceBoss.wallsActive = false;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.nextMechanicTimer = BEATRICE_RING_ATTACK_DELAY;
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 64, 54);
  screenShakeTimer = Math.max(screenShakeTimer, 0.35);
  message = "Barrier Broken";
  messageTimer = 1.1;
  return true;
}

function finishBeatriceBarrierBreak() {
  beatriceBoss.flavor = "dizzy";
  beatriceBoss.anim = 0;
  beatriceBoss.breakVx = 0;
  beatriceBoss.breakFade = 0;
  beatriceBoss.vulnerable = true;
  beatriceBoss.stunDamageTaken = 0;
  resetBattlerLaunchComboFlags(beatriceBoss);
  beatriceBoss.y = clamp(player.y + 28, FLOOR_Y - 28, FLOOR_Y + 44);
  beatriceBoss.hoverOffset = 0;
  resetBeatriceStunTimers();
  spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 52, 32);
  message = "Beatrice is stunned";
  messageTimer = 1.1;
}

function clearBeatriceBossMechanics() {
  beatriceBoss.mechanic = "defeated";
  beatriceBoss.wallsActive = false;
  beatriceBoss.wallTop = FLOOR_Y - 72;
  beatriceBoss.wallBottom = FLOOR_Y + 34;
  beatriceBoss.trialGoat = null;
  beatriceBoss.rewardStakePending = false;
  beatriceBoss.nextMechanicTimer = 0;
  beatriceBoss.rings = [];
  beatriceBoss.ringAttackStarted = false;
  beatriceBoss.goatRushTelegraphs = [];
  beatriceBoss.goatRushTimer = 0;
  beatriceBoss.goatRushSpawned = false;
  beatriceBoss.stakeCastFired = false;
  beatriceStakes.length = 0;
  beatriceStakeTrails.length = 0;
  beatriceStakeShockwaves.length = 0;
  beatriceStakeParryLine.life = 0;
  beatriceStakeParryPendingHit.active = false;
  beelzebubAttacks.length = 0;
  leviathanAttacks.length = 0;
  satanAttacks.length = 0;
  belphegorAttacks.length = 0;
  for (const enemy of enemies) {
    if (enemy.bossMechanic === "beatriceGoatTrial" || enemy.bossMechanic === "beatriceGoatRush") {
      enemy.hp = 0;
      defeatEnemy(enemy);
    }
  }
}

function defeatBeatriceBoss() {
  if (!beatriceBoss.active || beatriceBoss.flavor === "defeated") return;
  const startY = beatriceBoss.y;
  clearBeatriceBossMechanics();
  beatriceBoss.hp = 0;
  beatriceBoss.barrierActive = false;
  beatriceBoss.barrierHp = 0;
  beatriceBoss.vulnerable = false;
  beatriceBoss.flavor = "defeated";
  beatriceBoss.defeatPhase = "move";
  beatriceBoss.anim = 0;
  beatriceBoss.defeatMoveTimer = 0;
  beatriceBoss.defeatTrailTimer = 0;
  beatriceBoss.defeatStartX = beatriceBoss.x;
  beatriceBoss.defeatStartY = startY;
  const playerScreenX = player.x - cameraX;
  const targetScreenX = playerScreenX < W * 0.5 ? W * 0.82 : W * 0.18;
  beatriceBoss.defeatTargetX = clamp(cameraX + targetScreenX, 100, STAGE_W - 100);
  beatriceBoss.defeatTargetY = clamp(player.y + 24, FLOOR_Y - 24, FLOOR_Y + 52);
  beatriceBoss.x = beatriceBoss.defeatStartX;
  beatriceBoss.y = beatriceBoss.defeatStartY;
  beatriceBoss.hoverOffset = 0;
  beatriceBoss.facing = player.x >= beatriceBoss.defeatTargetX ? 1 : -1;
  beatriceBoss.z = 0;
  beatriceBoss.vz = 0;
  beatriceBoss.airVx = 0;
  beatriceBoss.defeatTimer = BEATRICE_DEFEAT_DISSIPATE_TIME;
  beatriceBoss.breakFade = 1;
  beatriceBoss.materializeTimer = 0;
  beatriceBoss.asmoDropKickPending = false;
  beatriceBoss.asmoDropKickTimer = 0;
  beatriceBoss.asmoDropKickHit = false;
  beatriceBoss.meleeKickHit = false;
  beatriceBoss.meleeKickParried = false;
  beatriceBoss.meleeKickParryFailed = false;
  beatriceBoss.meleeKickParryFailFade = 0;
  runStats.bossesDefeated += 1;
  const y = beatriceBoss.y - 58;
  spawnBeatriceAfterimage(beatriceBoss.defeatTargetX, beatriceBoss.defeatTargetY, 0.7, beatriceFrames.defeatMove[0]);
  spawnGoldenButterflies(beatriceBoss.x, y, 48);
  screenShakeTimer = Math.max(screenShakeTimer, 0.28);
  screenFlashTimer = Math.max(screenFlashTimer, 0.12);
  message = "Beatrice dissipates";
  messageTimer = 1.6;
}

function finishBeatriceBossDefeat() {
  beatriceBoss.active = false;
  beatriceBoss.flavor = "idle";
  beatriceBoss.anim = 0;
  beatriceBoss.defeatTimer = 0;
  beatriceBoss.defeatPhase = "";
  beatriceBoss.defeatMoveTimer = 0;
  beatriceBoss.defeatTrailTimer = 0;
  beatriceBoss.mechanic = "idle";
  beatriceBoss.breakFade = 0;
  waveMode = currentWaveMode();
  spawnWave();
}

function handleBeatriceReturnedStakeHit(stake) {
  if (!beatriceBoss.active) return false;
  const canBreak = beatriceBoss.flavor === "idle";
  if (!canBreak) return false;
  const direction = Math.sign(beatriceBoss.x - stake.x) || -beatriceBoss.facing || 1;
  startBeatriceBarrierBreak(direction);
  return true;
}

function resolveBeatriceStakeParryPendingHit() {
  if (!beatriceStakeParryPendingHit.active) return;
  const direction = beatriceStakeParryPendingHit.direction || -beatriceBoss.facing || 1;
  beatriceStakeParryPendingHit.active = false;
  if (beatriceBoss.active && beatriceBoss.flavor === "idle") startBeatriceBarrierBreak(direction);
}

function triggerAsmodeusStakeHit(stake) {
  const side = Math.sign(player.x - stake.x) || player.facing || 1;
  spawnAsmodeusUppercut(player.x - side * 18, player.y, side);
}

function groundPlayerForSpecial() {
  player.z = 0;
  player.vz = 0;
  player.airVx = 0;
  player.airVy = 0;
  player.airborne = false;
  player.knockedDown = false;
  player.downTime = 0;
  player.stage3KickAir = false;
  player.stage3KickTimer = 0;
  player.stage3KickVz = 0;
}

function startSpecialBeam() {
  if (player.blessings.lambdaKonpeitoSpecial) {
    startLambdaSpecialKonpeito();
    return;
  }
  runStats.specialsUnleashed += 1;
  groundPlayerForSpecial();
  player.action = "specialBeam";
  player.anim = 0;
  player.attackLock = 0.08;
  player.attackHasHit = false;
  player.currentAttack = "specialBeam";
}

function startLambdaSpecialKonpeito() {
  runStats.specialsUnleashed += 1;
  groundPlayerForSpecial();
  player.action = "specialBeam";
  player.anim = 0;
  player.attackLock = 0.08;
  player.attackHasHit = false;
  player.currentAttack = "lambdaKonpeitoSpecial";
  player.resolve = 0;
  resolveSpendFlashTimer = 0.34;
  const x = clamp(player.x + player.facing * 164, 80, STAGE_W - 120);
  const y = clampPlayY(player.y);
  lambdaSpecialKonpeitos.push({
    x,
    y,
    hoverY: y - 126,
    facing: player.facing,
    life: LAMBDA_SPECIAL_KONPEITO_DURATION,
    max: LAMBDA_SPECIAL_KONPEITO_DURATION,
    pulseTimer: 0.12,
    pulses: 0,
    pulseLaunchedEnemies: new Set(),
    launched: false,
    vx: 0,
    vy: 0,
    hoverVy: 0,
    frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
    spin: (Math.random() < 0.5 ? -1 : 1) * (1.9 + Math.random() * 1.2)
  });
  spawnLambdaSpecialPulseVisual(x, y, 0.32);
  damageLambdaSpecialArea(
    x,
    y,
    LAMBDA_SPECIAL_KONPEITO_PULSE_RADIUS,
    LAMBDA_SPECIAL_KONPEITO_PULSE_DAMAGE,
    "battler:lambdaKonpeitoSpecialCast",
    {
      launchMode: "unprorated",
      launchLift: LAMBDA_SPECIAL_KONPEITO_CAST_LAUNCH_LIFT,
      launchDrift: LAMBDA_SPECIAL_KONPEITO_CAST_LAUNCH_DRIFT
    }
  );
  burst(x, y - 92, "special");
}

function specialBeamBounds() {
  const startX = player.x + player.facing * 213;
  const endX = player.facing === 1 ? cameraX + W + 120 : cameraX - 120;
  const centerY = player.y - 291;
  return {
    x: Math.min(startX, endX),
    y: centerY - 34,
    w: Math.abs(endX - startX),
    h: 68,
    startX,
    endX,
    centerY
  };
}

function applySpecialBeam(dt) {
  const beam = specialBeamBounds();
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const lift = enemy.z || 0;
    const hurtbox = { x: enemy.x - 46, y: enemy.y - lift - 320, w: 92, h: 320 };
    if (!rectsTouch(beam, hurtbox)) continue;
    const contactX = (Math.max(beam.x, hurtbox.x) + Math.min(beam.x + beam.w, hurtbox.x + hurtbox.w)) * 0.5;
    const contactY = (Math.max(beam.y, hurtbox.y) + Math.min(beam.y + beam.h, hurtbox.y + hurtbox.h)) * 0.5;
    spawnBeamContactSparks(contactX, contactY, dt);
    damageEnemy(enemy, SPECIAL_BEAM_DAMAGE * dt);
    enemy.hurt = 0.12;
    enemy.attack = 0;
    enemy.attackHasHit = false;
    enemy.attackTelegraph = 0;
    enemy.facing = -player.facing;
    if (enemy.airborne) {
      extendEnemyLaunch(enemy, player.facing, "battler:specialBeam", 230, 75);
    } else {
      enemy.x = clamp(enemy.x + player.facing * 120 * dt, 80, STAGE_W - 120);
    }
    if (enemy.hp <= 0) {
      defeatEnemy(enemy);
    }
  }
}

function damageLambdaSpecialArea(x, y, radius, damage, source, options = {}) {
  const pulseLaunchedEnemies = options instanceof Set ? options : options.pulseLaunchedEnemies || null;
  const launchMode = options.launchMode || "standard";
  const launchLift = options.launchLift || 300;
  const launchDrift = options.launchDrift || 78;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const dist = Math.hypot(enemy.x - x, (enemy.y - y) * 1.15);
    if (dist > radius) continue;
    damageEnemy(enemy, damage);
    enemy.hurt = Math.max(enemy.hurt || 0, 0.16);
    enemy.attack = 0;
    enemy.attackHasHit = false;
    enemy.attackTelegraph = 0;
    const direction = Math.sign(enemy.x - x) || player.facing || 1;
    if (launchMode === "unprorated") {
      launchEnemyUnprorated(enemy, direction, source, launchLift, launchDrift);
    } else if (pulseLaunchedEnemies && !pulseLaunchedEnemies.has(enemy)) {
      pulseLaunchedEnemies.add(enemy);
      launchEnemyByBattlerRules(enemy, direction, source, 300, 78);
    } else if (enemy.airborne) {
      extendEnemyLaunch(enemy, direction, source, 160, 48);
    } else {
      enemy.x = clamp(enemy.x + direction * 18, 80, STAGE_W - 120);
    }
    if (enemy.hp <= 0) defeatEnemy(enemy);
  }

  if (beatriceCanBeDamaged()) {
    const box = beatriceHurtbox();
    const closestX = clamp(x, box.x, box.x + box.w);
    const closestY = clamp(y - 82, box.y, box.y + box.h);
    if (Math.hypot(closestX - x, closestY - (y - 82)) <= radius) {
      const direction = Math.sign(beatriceBoss.x - x) || player.facing || 1;
      damageBeatrice(damage, direction);
      if (beatriceBoss.hp <= 0) defeatBeatriceBoss();
    }
  }
}

function spawnLambdaSpecialPulseVisual(x, y, life = 0.4, radius = null) {
  konpeitoShockwaves.push({
    x,
    y,
    life,
    max: life,
    touched: new Set(),
    playerTouched: false,
    dome: true,
    radius,
    visualOnly: true
  });
}

function groundBounceLambdaSpecialAirborneEnemies(x, y) {
  for (const enemy of enemies) {
    if (enemy.spawnGrace > 0) continue;
    if (enemy.dead && !enemy.airborne && !(enemy.z > 0)) continue;
    if (!enemy.airborne && !(enemy.z > 0)) continue;
    const dist = Math.hypot(enemy.x - x, (enemy.y - y) * 1.12);
    if (dist > LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_RADIUS) continue;
    const direction = Math.sign(enemy.x - x) || player.facing || 1;
    groundBounceEnemy(
      enemy,
      direction,
      "battler:lambdaKonpeitoSpecialGroundBounce",
      LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_LIFT,
      LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_DRIFT
    );
  }
}

function applyLambdaSpecialSuction(effect, dt) {
  if (effect.launched) return;
  for (const enemy of enemies) {
    if (enemy.spawnGrace > 0) continue;
    if (enemy.dead && !enemy.airborne && !(enemy.z > 0)) continue;
    if (!enemy.airborne && !(enemy.z > 0)) continue;
    const dx = effect.x - enemy.x;
    const dy = effect.y - enemy.y;
    const dist = Math.hypot(dx, dy * 1.18);
    if (dist <= 1 || dist > LAMBDA_SPECIAL_KONPEITO_SUCTION_RADIUS) continue;
    const pull = LAMBDA_SPECIAL_KONPEITO_SUCTION_STRENGTH * (1 - dist / LAMBDA_SPECIAL_KONPEITO_SUCTION_RADIUS);
    const step = Math.min(dist, pull * dt);
    enemy.x = clamp(enemy.x + (dx / dist) * step, 80, STAGE_W - 120);
    enemy.y = clampPlayY(enemy.y + (dy / dist) * step * 0.52);
    enemy.airVx = (enemy.airVx || 0) * 0.94 + (dx / dist) * pull * 0.1;
  }
}

function explodeLambdaSpecialKonpeito(effect) {
  spawnLambdaSpecialPulseVisual(effect.x, effect.y, 0.58, LAMBDA_SPECIAL_KONPEITO_GROUND_BOUNCE_RADIUS);
  damageLambdaSpecialArea(
    effect.x,
    effect.y,
    LAMBDA_SPECIAL_KONPEITO_PULSE_RADIUS,
    LAMBDA_SPECIAL_KONPEITO_PULSE_DAMAGE,
    "battler:lambdaKonpeitoSpecialCollision"
  );
  groundBounceLambdaSpecialAirborneEnemies(effect.x, effect.y);
  spawnKonpeitoDomeBurst(effect.x, effect.y);
  screenShakeTimer = Math.max(screenShakeTimer, 0.18);
  burst(effect.x, effect.y - 92, "special");
  const baseAngle = effect.facing === 1 ? 0 : Math.PI;
  for (let i = 0; i < LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_COUNT; i++) {
    const spread = (Math.random() - 0.5) * Math.PI * 1.55;
    const angle = baseAngle + spread;
    const distance = 260 + Math.random() * 620;
    const laneShift = (Math.random() - 0.5) * 260;
    const targetX = clamp(effect.x + Math.cos(angle) * distance, 70, STAGE_W - 110);
    const targetY = clamp(effect.y + laneShift + Math.sin(angle) * 74, PLAY_AREA_TOP - 4, PLAY_AREA_BOTTOM + 4);
    lambdaSpecialShrapnel.push({
      startX: effect.x,
      startY: effect.hoverY,
      targetX,
      targetY: targetY - 52,
      controlX: (effect.x + targetX) * 0.5 + (Math.random() - 0.5) * 120,
      controlY: Math.min(effect.hoverY, targetY - 52) - 110 - Math.random() * 120,
      t: 0,
      duration: 0.48 + Math.random() * 0.22,
      frame: Math.floor(Math.random() * KONPEITO_FRAME_COUNT),
      spin: (Math.random() < 0.5 ? -1 : 1) * (3.8 + Math.random() * 2.6),
      hitEnemies: new Set(),
      hitBeatrice: false
    });
  }
}

function lambdaSpecialShrapnelPosition(shard) {
  const t = clamp(shard.t, 0, 1);
  const inv = 1 - t;
  return {
    x: inv * inv * shard.startX + 2 * inv * t * shard.controlX + t * t * shard.targetX,
    y: inv * inv * shard.startY + 2 * inv * t * shard.controlY + t * t * shard.targetY,
    t
  };
}

function launchLambdaSpecialKonpeito(effect, data) {
  if (effect.launched) return false;
  const direction = player.facing || 1;
  effect.launched = true;
  effect.pulses = LAMBDA_SPECIAL_KONPEITO_PULSE_COUNT;
  effect.pulseTimer = LAMBDA_SPECIAL_KONPEITO_PULSE_INTERVAL;
  effect.life = LAMBDA_SPECIAL_KONPEITO_LAUNCH_LIFE;
  effect.max = LAMBDA_SPECIAL_KONPEITO_LAUNCH_LIFE;
  effect.facing = direction;
  effect.vx = direction * (LAMBDA_SPECIAL_KONPEITO_LAUNCH_SPEED + (data.stage || 1) * 42);
  effect.vy = player.vy ? Math.sign(player.vy) * LAMBDA_SPECIAL_KONPEITO_LAUNCH_LANE_SPEED : 0;
  effect.hoverVy = LAMBDA_SPECIAL_KONPEITO_LAUNCH_UP_SPEED;
  effect.spin *= 2.2;
  burst(effect.x, effect.hoverY, "special");
  return true;
}

function applyLambdaSpecialKonpeitoHit(data) {
  if (!data?.activeFrames || !lambdaSpecialKonpeitos.length) return false;
  const hitbox = {
    x: player.x + (player.facing === 1 ? 28 : -data.range - 28),
    y: player.y - player.z - data.depth * 1.35,
    w: data.range,
    h: data.depth * 2.5
  };
  let hit = false;
  for (const effect of lambdaSpecialKonpeitos) {
    if (effect.launched) continue;
    const candyBox = {
      x: effect.x - LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS,
      y: effect.hoverY - LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS,
      w: LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS * 2,
      h: LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS * 2
    };
    if (!rectsTouch(hitbox, candyBox)) continue;
    if (launchLambdaSpecialKonpeito(effect, data)) hit = true;
  }
  return hit;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  const x = ax + dx * t;
  const y = ay + dy * t;
  return Math.hypot(px - x, py - y);
}

function lambdaSpecialKonpeitoCollisionTarget(effect, previousX, previousY) {
  let best = null;
  const minX = Math.min(previousX, effect.x) - LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS;
  const maxX = Math.max(previousX, effect.x) + LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS;
  const minY = Math.min(previousY, effect.hoverY) - LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS;
  const maxY = Math.max(previousY, effect.hoverY) + LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS;
  const pathBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  for (const enemy of enemies) {
    if (enemy.dead || enemy.spawnGrace > 0) continue;
    const box = enemyHurtbox(enemy);
    if (!rectsTouch(pathBox, box)) continue;
    const centerX = box.x + box.w * 0.5;
    const centerY = box.y + box.h * 0.5;
    const dist = distanceToSegment(centerX, centerY, previousX, previousY, effect.x, effect.hoverY);
    if (dist > LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS + 18) continue;
    if (!best || dist < best.dist) best = { type: "enemy", enemy, dist };
  }
  if (beatriceCanBeDamaged()) {
    const box = beatriceHurtbox();
    if (rectsTouch(pathBox, box)) {
      const centerX = box.x + box.w * 0.5;
      const centerY = box.y + box.h * 0.5;
      const dist = distanceToSegment(centerX, centerY, previousX, previousY, effect.x, effect.hoverY);
      if (dist <= LAMBDA_SPECIAL_KONPEITO_HIT_RADIUS + 22 && (!best || dist < best.dist)) {
        best = { type: "beatrice", dist };
      }
    }
  }
  return best;
}

function updateLambdaSpecialKonpeitos(dt) {
  for (let i = lambdaSpecialKonpeitos.length - 1; i >= 0; i--) {
    const effect = lambdaSpecialKonpeitos[i];
    const previousX = effect.x;
    const previousY = effect.hoverY;
    effect.life -= dt;
    effect.frame += dt * 10;
    if (effect.launched) {
      effect.x = clamp(effect.x + effect.vx * dt, 50, STAGE_W - 70);
      effect.y = clamp(effect.y + effect.vy * dt, PLAY_AREA_TOP - 18, PLAY_AREA_BOTTOM + 18);
      effect.hoverY += effect.hoverVy * dt;
      effect.hoverVy += LAMBDA_SPECIAL_KONPEITO_LAUNCH_GRAVITY * dt;
      const target = lambdaSpecialKonpeitoCollisionTarget(effect, previousX, previousY);
      if (target) {
        explodeLambdaSpecialKonpeito(effect);
        lambdaSpecialKonpeitos.splice(i, 1);
        continue;
      }
    }
    applyLambdaSpecialSuction(effect, dt);
    effect.pulseTimer -= dt;
    if (!effect.launched && effect.pulses < LAMBDA_SPECIAL_KONPEITO_PULSE_COUNT && effect.pulseTimer <= 0) {
      effect.pulses += 1;
      effect.pulseTimer += LAMBDA_SPECIAL_KONPEITO_PULSE_INTERVAL;
      spawnLambdaSpecialPulseVisual(effect.x, effect.y);
      damageLambdaSpecialArea(
        effect.x,
        effect.y,
        LAMBDA_SPECIAL_KONPEITO_PULSE_RADIUS,
        LAMBDA_SPECIAL_KONPEITO_PULSE_DAMAGE,
        "battler:lambdaKonpeitoSpecial",
        {
          launchMode: "unprorated",
          launchLift: LAMBDA_SPECIAL_KONPEITO_PULSE_LAUNCH_LIFT,
          launchDrift: LAMBDA_SPECIAL_KONPEITO_PULSE_LAUNCH_DRIFT
        }
      );
    }
    if (effect.life <= 0) {
      explodeLambdaSpecialKonpeito(effect);
      lambdaSpecialKonpeitos.splice(i, 1);
    }
  }
}

function updateLambdaSpecialShrapnel(dt) {
  for (let i = lambdaSpecialShrapnel.length - 1; i >= 0; i--) {
    const shard = lambdaSpecialShrapnel[i];
    shard.t += dt / shard.duration;
    shard.frame += dt * 12;
    const pos = lambdaSpecialShrapnelPosition(shard);
    for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
      if (shard.hitEnemies.has(enemyIndex)) continue;
      const enemy = enemies[enemyIndex];
      if (enemy.dead || enemy.spawnGrace > 0) continue;
      const hurtY = enemy.y - (enemy.z || 0) - 72;
      if (Math.hypot(enemy.x - pos.x, (hurtY - pos.y) * 0.82) > LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_RADIUS) continue;
      shard.hitEnemies.add(enemyIndex);
      damageEnemy(enemy, LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_DAMAGE);
      enemy.hurt = Math.max(enemy.hurt || 0, 0.12);
      enemy.attack = 0;
      if (enemy.hp <= 0) defeatEnemy(enemy);
    }
    if (!shard.hitBeatrice && beatriceCanBeDamaged()) {
      const box = beatriceHurtbox();
      if (pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) {
        shard.hitBeatrice = true;
        damageBeatrice(LAMBDA_SPECIAL_KONPEITO_SHRAPNEL_DAMAGE, Math.sign(beatriceBoss.x - player.x) || player.facing || 1);
        if (beatriceBoss.hp <= 0) defeatBeatriceBoss();
      }
    }
    if (shard.t >= 1) {
      burst(shard.targetX, shard.targetY, "special");
      lambdaSpecialShrapnel.splice(i, 1);
    }
  }
}

function spawnBeamContactSparks(x, y, dt) {
  if (Math.random() > 42 * dt) return;
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.58) * 190,
      life: 0.16 + Math.random() * 0.16,
      max: 0.32,
      color: Math.random() < 0.55 ? "#dffcff" : "#48eaff",
      size: 3 + Math.random() * 4,
      gravity: 90
    });
  }
}

function updatePlayer(dt) {
  player.attackLock = Math.max(0, player.attackLock - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  if (!player.konpeitoGlowPending) {
    player.konpeitoGlowTimer = Math.max(0, player.konpeitoGlowTimer - dt);
  }
  if (player.wallSlamTimer > 0) {
    const previous = player.wallSlamTimer;
    player.wallSlamTimer = Math.max(0, player.wallSlamTimer - dt);
    const t = 1 - player.wallSlamTimer / BEATRICE_MELEE_KICK_WALL_SLAM_TIME;
    const ease = 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    player.x = player.wallSlamStartX + (player.wallSlamTargetX - player.wallSlamStartX) * ease;
    player.y = clampPlayY(player.y);
    player.vx = (player.wallSlamTargetX - player.wallSlamStartX) / BEATRICE_MELEE_KICK_WALL_SLAM_TIME;
    player.vy = 0;
    player.anim = Math.min(frames.hurt.length - 0.01, player.anim + dt * 16);
    if (!player.wallSlamHit && previous > BEATRICE_MELEE_KICK_WALL_SLAM_TIME * 0.18 && player.wallSlamTimer <= BEATRICE_MELEE_KICK_WALL_SLAM_TIME * 0.18) {
      player.wallSlamHit = true;
      screenShakeTimer = Math.max(screenShakeTimer, 0.42);
      burst(player.x, player.y - 94, "enemy");
    }
    if (player.wallSlamTimer <= 0) {
      player.wallSlamHit = false;
      player.wallSlamTargetX = 0;
      player.wallSlamStartX = 0;
      landLaunchedActor(player, 0.65);
      player.action = "down";
      player.attackLock = player.downTime;
      player.anim = 0;
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.airborne) {
    player.vx = player.airVx;
    player.vy = 0;
    player.x = clamp(player.x + player.airVx * dt, 80, STAGE_W - 120);
    player.z += player.vz * dt;
    player.vz -= 980 * dt;
    player.anim = player.vz > 0 ? 0 : player.anim + dt * 8;
    if (player.z <= 0) {
      landLaunchedActor(player, player.konpeitoGlowPending ? 0.35 : 0.55);
      player.action = "down";
      player.attackLock = player.downTime;
      if (player.beatriceDropKickBouncePending) {
        player.beatriceDropKickBounceTimer = BEATRICE_ASMO_DROP_KICK_BOUNCE_DELAY;
        player.downTime = Math.max(player.downTime, BEATRICE_ASMO_DROP_KICK_BOUNCE_DELAY + 0.12);
        player.attackLock = player.downTime;
        player.anim = 0;
        screenShakeTimer = Math.max(screenShakeTimer, 0.34);
        burst(player.x, player.y - 38, "enemy");
      }
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.knockedDown) {
    player.vx = 0;
    player.vy = 0;
    if (player.beatriceDropKickBouncePending) {
      player.beatriceDropKickBounceTimer = Math.max(0, player.beatriceDropKickBounceTimer - dt);
      if (player.beatriceDropKickBounceTimer <= 0) {
        const bounceDirection = player.beatriceDropKickBounceDirection || player.facing || 1;
        player.beatriceDropKickBouncePending = false;
        player.beatriceDropKickBounceTimer = 0;
        launchActor(player, bounceDirection, BEATRICE_ASMO_DROP_KICK_BOUNCE_LIFT, BEATRICE_ASMO_DROP_KICK_BOUNCE_DRIFT);
        player.action = "down";
        player.attackLock = 0.32;
        cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
        return;
      }
    }
    player.downTime -= dt;
    player.anim = Math.min(frames.down.length - 0.01, player.anim + dt * 8);
    if (player.downTime <= 0) {
      player.knockedDown = false;
      player.anim = 0;
      player.attackLock = 0;
      setAction("idle");
      if (player.konpeitoGlowPending) {
        player.konpeitoGlowPending = false;
        player.konpeitoGlowTimer = 1;
      }
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.action === "special" && player.attackLock <= 0) {
    startSpecialBeam();
  }
  if (player.action === "specialBeam") {
    player.attackLock = 0.08;
    player.anim += dt * 12;
    if (player.currentAttack === "lambdaKonpeitoSpecial") {
      if (player.anim >= frames.specialBeam.length) {
        player.attackLock = 0;
        player.currentAttack = "";
        setAction("idle");
      }
      cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
      return;
    }
    player.resolve = Math.max(0, player.resolve - SPECIAL_BEAM_DRAIN * dt);
    applySpecialBeam(dt);
    if (player.resolve <= 0) {
      player.attackLock = 0;
      player.currentAttack = "";
      setAction("idle");
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.action === "stakeParryPose") {
    player.anim += dt * 14;
    player.attackLock = Math.max(0, player.attackLock - dt);
    if (player.attackLock <= 0) {
      player.currentAttack = "";
      setAction("idle");
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.action === "beatriceMeleeParry") {
    player.anim += dt * 12;
    player.attackLock = Math.max(0, player.attackLock - dt);
    const recoil = player.meleeParryRecoilVx || 0;
    player.x = clamp(player.x + recoil * dt, 80, STAGE_W - 120);
    player.vx = recoil;
    player.meleeParryRecoilVx = recoil * Math.max(0, 1 - BEATRICE_MELEE_PARRY_RECOIL_DRAG * dt);
    if (player.attackLock <= 0 || player.anim >= frames.beatriceMeleeParry.length) {
      player.meleeParryRecoilVx = 0;
      player.currentAttack = "";
      setAction("idle");
    }
    cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
    return;
  }
  if (player.stage3KickAir && player.action === "kick3") {
    player.stage3KickTimer += dt;
    const inStartup = player.stage3KickTimer < STAGE3_KICK_STARTUP_TIME;
    let lane = 0;
    if (inStartup) {
      if (keys.has("arrowup") || keys.has("w")) lane -= 1;
      if (keys.has("arrowdown") || keys.has("s")) lane += 1;
    }
    const forwardSpeed = inStartup ? STAGE3_KICK_START_SPEED : STAGE3_KICK_FALL_SPEED;
    player.x = clamp(player.x + player.facing * forwardSpeed * dt, 80, STAGE_W - 120);
    player.y = constrainLaneToBeatriceWalls(clampPlayY(player.y + lane * STAGE3_KICK_LANE_SPEED * dt));
    player.z += player.stage3KickVz * dt;
    player.stage3KickVz -= STAGE3_KICK_GRAVITY * dt;
    player.vx = player.facing * forwardSpeed;
    player.vy = lane * STAGE3_KICK_LANE_SPEED;
    if (player.z <= 0 && player.stage3KickTimer > STAGE3_KICK_ACTIVE_END) {
      player.z = 0;
      player.stage3KickAir = false;
      player.stage3KickTimer = 0;
      player.stage3KickVz = 0;
      player.attackLock = 0;
    }
  }
  if (player.attackLock > 0 && player.attackLungeRemaining > 0) {
    const lungeStep = Math.min(player.attackLungeRemaining, 250 * dt);
    player.x = clamp(player.x + player.facing * lungeStep, 80, STAGE_W - 120);
    player.attackLungeRemaining -= lungeStep;
  }
  if (player.comboTimer > 0) {
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer <= 0) resetPlayerCombo();
  }
  if (player.attackLock <= 0 && isPlayerComboAttack(player.action)) {
    const data = attackData[player.action];
    if (!player.attackHasHit || data?.stage >= 3) resetPlayerCombo();
  }
  if (player.attackLock <= 0) {
    player.goatParryCounter = false;
    player.attackConsumesResolve = false;
    player.pendingResolveAttack = false;
  }
  if (player.attackLock <= 0 && player.comboQueuedKind && player.comboTimer > 0) {
    const queuedKind = player.comboQueuedKind;
    attack(queuedKind);
  }
  let mx = 0;
  let my = 0;
  if (keys.has("arrowleft") || keys.has("a")) mx -= 1;
  if (keys.has("arrowright") || keys.has("d")) mx += 1;
  if (keys.has("arrowup") || keys.has("w")) my -= 1;
  if (keys.has("arrowdown") || keys.has("s")) my += 1;

  if (player.attackLock <= 0) {
    const moving = mx || my;
    const wantsRunInput = Boolean(moving && keys.has("shift"));
    const wantsRun = wantsRunInput && (player.runState === "starting" || player.runState === "running" || player.dashCooldown <= 0);
    let moveSpeed = 240;
    let laneSpeed = 150;
    let action = moving ? "walk" : "idle";

    if (wantsRun) {
      if (player.runState === "none" || player.runState === "braking") {
        player.runState = "starting";
        player.runTimer = 0;
        player.runCharge = 0;
        player.dashCooldown = DASH_COOLDOWN;
        player.invuln = Math.max(player.invuln, DASH_START_INVULN);
        player.brakeDrift = 0;
        player.brakeBurstTimer = DASH_TAP_DODGE_BRAKE_DURATION;
        setAction("runStart");
      }
      if (player.runState === "starting") {
        player.runTimer += dt;
        action = "runStart";
        moveSpeed = 240;
        laneSpeed = 150;
        if (player.runTimer >= DASH_START_DURATION) {
          player.runState = "running";
          player.runTimer = 0;
          player.brakeBurstTimer = 0;
          setAction("run");
        }
      }
      if (player.runState === "running") {
        action = "run";
        player.runCharge = clamp(player.runCharge + dt / DASH_RUN_ACCEL_TIME, 0, 1);
        const easedCharge = player.runCharge * player.runCharge * (3 - 2 * player.runCharge);
        player.runTimer += dt;
        player.brakeBurstTimer = 0;
        moveSpeed = 300 + 400 * easedCharge;
        laneSpeed = 150 + 75 * easedCharge;
      }
    } else if (player.runState === "starting" || player.runState === "running") {
      const burstRelease = player.runState === "starting" || player.brakeBurstTimer > 0;
      player.runState = "braking";
      player.runTimer = 0.36;
      player.brakeDrift = burstRelease ? DASH_TAP_DODGE_DRIFT : 46 + 42 * player.runCharge;
      player.runCharge = 0;
      setAction("runBrake");
    }

    if (player.runState === "braking") {
      action = "runBrake";
      player.runTimer -= dt;
      const driftSpeed = player.brakeBurstTimer > 0 ? DASH_TAP_DODGE_DRIFT_SPEED : 230;
      const driftStep = Math.min(player.brakeDrift, driftSpeed * dt);
      player.x += player.facing * driftStep;
      player.brakeDrift -= driftStep;
      player.brakeBurstTimer = Math.max(0, player.brakeBurstTimer - dt);
      moveSpeed = moving ? 170 : 0;
      laneSpeed = moving ? 90 : 0;
      player.vx = player.facing * (driftStep / Math.max(dt, 0.001));
      player.vy = 0;
      if (player.runTimer <= 0) {
        player.runState = "none";
        player.runCharge = 0;
        player.brakeDrift = 0;
        player.brakeBurstTimer = 0;
        action = moving ? "walk" : "idle";
      }
    }

    const len = Math.hypot(mx, my) || 1;
    const moveX = (mx / len) * moveSpeed;
    const moveY = (my / len) * laneSpeed;
    player.x += moveX * dt;
    player.y += moveY * dt;
    if (player.runState !== "braking") {
      player.vx = moveX;
      player.vy = moveY;
    } else {
      player.vx += moveX;
      player.vy = moveY;
    }
    player.x = clamp(player.x, 80, STAGE_W - 120);
    player.y = constrainLaneToBeatriceWalls(clampPlayY(player.y));
    if (mx) player.facing = Math.sign(mx);
    setAction(action);
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  const animRate = player.action === "run" ? 16 : player.action === "runStart" ? 12 : player.action === "walk" ? 12 : 10;
  player.anim += dt * animRate;
  const data = attackData[player.action];
  const frame = currentPlayerActionFrame();
  if (data?.activeFrames?.includes(frame) && !player.attackHasHit) {
    player.attackHasHit = applyAttackHit(player.action, data);
  }
  if (data?.activeFrames?.includes(frame)) {
    applyKonpeitoJuggleHit(data);
    applyLambdaSpecialKonpeitoHit(data);
  }
  if (data?.activeFrames?.includes(frame) && !player.crestAttackHasHit) {
    player.crestAttackHasHit = applyCrestEchoHit(player.action, data);
  }
  cameraX = clamp(player.x - W * 0.38, 0, STAGE_W - W);
}

function updateEnemies(dt) {
  if (enemyFreezeTimer > 0) return;
  let living = messageBottles.length;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.dead) {
      updateEnemyGroundBounce(enemy, dt);
      enemy.fall -= dt;
      if (enemy.airborne) {
        enemy.x = clamp(enemy.x + enemy.airVx * dt, 80, STAGE_W - 120);
        enemy.z += enemy.vz * dt;
        enemy.vz -= 980 * dt;
        enemy.anim = enemy.type === "goat" ? enemy.anim + dt * 8 : enemy.vz > 0 ? 0 : enemy.anim + dt * 8;
        if (enemy.z <= 0) {
          landLaunchedActor(enemy);
          if (enemy.groundBouncePending) {
            enemy.groundBounceTimer = STAGE3_KICK_BOUNCE_DELAY;
            enemy.downTime = Math.max(enemy.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.12);
            enemy.anim = enemy.type === "goat" ? 1 : 4;
          }
        }
      } else if (enemy.type === "goat") {
        enemy.anim = Math.min(goatFrames.defeat.length - 0.01, enemy.anim + dt * 10);
      } else {
        enemy.anim = Math.min(frames.down.length - 0.01, enemy.anim + dt * 8);
      }
      if (enemy.fall <= 0) enemies.splice(i, 1);
      continue;
    }
    living += 1;
    if (updateEnemyGroundBounce(enemy, dt)) {
      continue;
    }
    if (enemy.airborne) {
      enemy.x = clamp(enemy.x + enemy.airVx * dt, 80, STAGE_W - 120);
      enemy.z += enemy.vz * dt;
      enemy.vz -= 980 * dt;
      enemy.anim = enemy.type === "goat" ? enemy.anim + dt * 8 : enemy.vz > 0 ? 0 : enemy.anim + dt * 8;
      if (enemy.z <= 0) {
        landLaunchedActor(enemy);
        if (enemy.groundBouncePending) {
          enemy.groundBounceTimer = STAGE3_KICK_BOUNCE_DELAY;
          enemy.downTime = Math.max(enemy.downTime || 0, STAGE3_KICK_BOUNCE_DELAY + 0.12);
          enemy.anim = enemy.type === "goat" ? 1 : 4;
        }
        if (enemy.duoSlamDamage) {
          damageEnemy(enemy, enemy.duoSlamDamage);
          enemy.duoSlamDamage = 0;
          crystalShockwaves.push({
            x: enemy.x,
            y: enemy.y,
            life: 0.34,
            max: 0.34,
            radius: 92,
            touched: new Set(),
            shockwaveDamage: 0,
            dome: true
          });
          if (enemy.hp <= 0) defeatEnemy(enemy);
        }
      }
      continue;
    }
    if (enemy.knockedDown) {
      enemy.downTime -= dt;
      enemy.anim = Math.min(frames.down.length - 0.01, enemy.anim + dt * 8);
      if (enemy.downTime <= 0) {
        enemy.knockedDown = false;
        resetBattlerLaunchComboFlags(enemy);
        enemy.hurt = 0;
        enemy.anim = 0;
        enemy.cooldown = 0.45;
      }
      continue;
    }
    if (enemy.spawnGrace > 0) {
      enemy.spawnGrace = Math.max(0, enemy.spawnGrace - dt);
      enemy.attack = 0;
      enemy.attackHasHit = false;
      enemy.cooldown = 0.45;
      enemy.anim += dt * 9;
      if (enemy.type !== "goat") enemy.facing = player.x >= enemy.x ? 1 : -1;
      continue;
    }
    if (enemy.type === "goat") {
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.goatArmorFlash = Math.max(0, (enemy.goatArmorFlash || 0) - dt);
      enemy.goatParryFailFade = Math.max(0, (enemy.goatParryFailFade || 0) - dt);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.attack = 0;
      enemy.attackHasHit = false;
      if (enemy.hurt > 0) enemy.goatHurtAnim += dt * 11;
      if (enemy.hurt > 0 && enemy.goatAction === "idle") {
        enemy.anim += dt * 3.6;
        continue;
      }
      if (enemy.goatAction === "pound") {
        enemy.anim += dt * 8.5;
        const frame = goatFrames.pound[Math.min(goatFrames.pound.length - 1, Math.floor(enemy.anim))];
        if (!enemy.goatHasHit && frame >= 684) {
          enemy.goatHasHit = true;
          applyGoatPoundHit(enemy);
        }
        if (enemy.anim >= goatFrames.pound.length) {
          enemy.goatAction = "recover";
          enemy.goatHasHit = false;
          enemy.anim = 0;
        }
      } else if (enemy.goatAction === "recover") {
        enemy.anim += dt * 7.5;
        if (enemy.anim >= goatFrames.recover.length) {
          enemy.goatAction = "idle";
          enemy.goatParryFailed = false;
          enemy.goatParryFailFade = 0;
          enemy.anim = 0;
          enemy.cooldown = 1.25;
        }
      } else if (enemy.goatAction === "chargeWindup") {
        enemy.anim += dt * 8.5;
        if (enemy.anim >= goatFrames.chargeWindup.length) {
          enemy.goatAction = "charge";
          enemy.goatHasHit = false;
          enemy.goatChargeDistance = 0;
          enemy.anim = 0;
        }
      } else if (enemy.goatAction === "charge") {
        enemy.anim += dt * 12;
        const step = (enemy.goatChargeSpeed || GOAT_CHARGE_SPEED) * dt;
        const minX = enemy.bossMechanic === "beatriceGoatRush" ? -260 : 80;
        const maxX = enemy.bossMechanic === "beatriceGoatRush" ? STAGE_W + 260 : STAGE_W - 80;
        enemy.x = clamp(enemy.x + (enemy.goatChargeDx || enemy.facing) * step, minX, maxX);
        enemy.y = clamp(enemy.y + (enemy.goatChargeDy || 0) * step, PLAY_AREA_TOP + 36, PLAY_AREA_BOTTOM - 14);
        enemy.goatChargeDistance += step;
        if (!enemy.goatHasHit && applyGoatChargeHit(enemy)) enemy.goatHasHit = true;
        if (enemy.goatChargeDistance >= (enemy.goatChargeLimit || GOAT_CHARGE_DISTANCE)) {
          if (enemy.bossMechanic === "beatriceGoatRush") {
            enemy.dead = true;
            enemy.fall = 0.16;
            enemy.goatAction = "defeat";
            enemy.anim = 0;
            continue;
          }
          enemy.goatAction = "chargeRecover";
          enemy.goatHasHit = false;
          enemy.anim = 0;
        }
      } else if (enemy.goatAction === "chargeRecover") {
        enemy.anim += dt * 7.5;
        if (enemy.anim >= goatFrames.chargeRecover.length) {
          enemy.goatAction = "idle";
          enemy.anim = 0;
          enemy.cooldown = 1.1;
        }
      } else {
        const detectsPlayer = goatDetectsPlayer(enemy);
        enemy.goatNoDetectTimer = detectsPlayer ? 0 : (enemy.goatNoDetectTimer || 0) + dt;
        if (enemy.cooldown <= 0 && enemy.goatNoDetectTimer >= GOAT_CHARGE_NO_DETECT_TIME) {
          startGoatShoulderCharge(enemy);
        } else if (enemy.cooldown <= 0 && detectsPlayer) {
          enemy.goatAction = "pound";
          enemy.goatHasHit = false;
          enemy.goatParryFailed = false;
          enemy.goatParryFailFade = 0;
          enemy.anim = 0;
        } else {
          enemy.anim += dt * (enemy.hurt > 0 ? 5.5 : 3.6);
        }
      }
      continue;
    }
    enemy.hurt = Math.max(0, enemy.hurt - dt);
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    if (enemy.hurt > 0) {
      enemy.attack = 0;
      enemy.attackHasHit = false;
      enemy.attackTelegraph = 0;
      enemy.attackFacing = 0;
    }
    enemy.attackTelegraph = Math.max(0, (enemy.attackTelegraph || 0) - dt);
    enemy.attack = Math.max(0, enemy.attack - (enemy.attackTelegraph > 0 ? 0 : dt));
    if (enemy.attack > 0) {
      if (enemy.attackFacing) enemy.facing = enemy.attackFacing;
      if (enemy.attackTelegraph > 0) {
        enemy.anim = 0;
      } else {
        enemy.anim += dt * 10;
        const attackFrames = frames[enemy.attackKind];
        const frame = attackFrames?.[Math.floor(enemy.anim) % attackFrames.length];
        const activeFrames = enemyAttackData[enemy.attackKind]?.activeFrames || [];
        if (activeFrames.includes(frame) && !enemy.attackHasHit) {
          enemy.attackHasHit = applyEnemyAttackHit(enemy);
        }
      }
    } else if (enemy.hurt > 0) {
      enemy.anim += dt * 14;
    }
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    if (enemy.attack > 0 && enemy.attackFacing) {
      enemy.facing = enemy.attackFacing;
    } else {
      enemy.attackFacing = 0;
      enemy.facing = dx >= 0 ? 1 : -1;
    }
    const dist = Math.hypot(dx, dy);

    if (enemy.attack > 0) {
      continue;
    }

    if (enemy.hurt <= 0 && dist > 72) {
      enemy.x += (dx / dist) * enemy.speed * dt;
      enemy.y += (dy / dist) * enemy.speed * 0.55 * dt;
      enemy.anim += dt * 12;
    } else if (enemy.hurt <= 0 && enemy.cooldown <= 0 && !isPlayerInvulnerable()) {
      enemy.attackKind = Math.random() < 0.5 ? "punch" : "kick";
      enemy.attack = enemyAttackData[enemy.attackKind].lock;
      enemy.attackHasHit = false;
      enemy.attackTelegraph = ENEMY_ATTACK_TELEGRAPH_TIME;
      enemy.attackFacing = enemy.facing;
      enemy.anim = 0;
      enemy.cooldown = 0.92 + Math.random() * 0.5;
    }
  }
  if (living === 0 && state === "playing" && waveMode === "normal") {
    wave += 1;
    runStats.wavesCompleted = Math.max(runStats.wavesCompleted, wave - 1);
    player.hp = clamp(player.hp + 16, 0, 100);
    player.resolve = clamp(player.resolve + 34 * RESOLVE_GAIN_MULTIPLIER, 0, 100);
    spawnWave();
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.gravity ?? 420) * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    pickup.bob += dt * 4.8;
    pickup.life -= dt;
    if (pickup.life <= 0) {
      pickups.splice(i, 1);
      continue;
    }
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    if (Math.hypot(dx, dy) < 54) {
      activatePickup(pickup);
      pickups.splice(i, 1);
    }
  }
}

function updateMessageBottles(dt) {
  for (let i = messageBottles.length - 1; i >= 0; i--) {
    const bottle = messageBottles[i];
    bottle.delay -= dt;
    if (bottle.delay > 0) continue;
    bottle.t += dt / bottle.duration;
    if (bottle.t >= 1) {
      if (bottle.kind === "item") {
        summonPillars.push({
          x: bottle.targetX,
          y: bottle.targetY,
          life: 0.5,
          max: 0.5,
          itemType: bottle.itemType,
          itemSpawned: false
        });
      } else {
        enemies.push(makeEnemy(bottle.targetX, bottle.targetY, bottle.enemyIndex));
        summonPillars.push({
          x: bottle.targetX,
          y: bottle.targetY,
          life: 0.72,
          max: 0.72
        });
      }
      screenShakeTimer = Math.max(screenShakeTimer, 0.08);
      messageBottles.splice(i, 1);
    }
  }
}

function updateSummonPillars(dt) {
  for (let i = summonPillars.length - 1; i >= 0; i--) {
    const pillar = summonPillars[i];
    pillar.life -= dt;
    if (pillar.itemType && !pillar.itemSpawned && pillar.life <= pillar.max * 0.2) {
      pillar.itemSpawned = true;
      spawnPickup(pillar.itemType, pillar.x, pillar.y);
    }
    if (pillar.life <= 0) summonPillars.splice(i, 1);
  }
}

function updateCrystalShards(dt) {
  if (player.crystalShardActive && state === "playing") {
    if (!Array.isArray(player.crystalShardStacks)) player.crystalShardStacks = [];
    for (const stack of player.crystalShardStacks) {
      stack.cooldown -= dt;
      if (stack.cooldown <= 0) {
        triggerCrystalShardStack(stack);
      }
    }
    player.crystalShardTimer = crystalShardHudCooldown();
  }

  for (let i = pendingMiracleCrystalFollowups.length - 1; i >= 0; i--) {
    const followup = pendingMiracleCrystalFollowups[i];
    followup.delay -= dt;
    if (followup.delay > 0) continue;
    spawnMiracleCrystalFollowup(followup.target);
    pendingMiracleCrystalFollowups.splice(i, 1);
  }

  for (let i = upwardCrystalShards.length - 1; i >= 0; i--) {
    const shard = upwardCrystalShards[i];
    if (shard.delay > 0) {
      shard.delay -= dt;
      continue;
    }
    shard.life -= dt;
    const t = 1 - shard.life / shard.max;
    shard.z = 24 + t * (shard.y + CRYSTAL_SHARD_PLUS_EXIT_MARGIN);
    const radius = CRYSTAL_SHARD_PLUS_RADIUS * (0.48 + t * 0.42);
    for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
      if (shard.touched.has(enemyIndex)) continue;
      const enemy = enemies[enemyIndex];
      if (enemy.dead || enemy.spawnGrace > 0) continue;
      const hurtY = enemy.y - (enemy.z || 0) - 68;
      const dist = Math.hypot(enemy.x - shard.x, (hurtY - (shard.y - shard.z)) * 0.75);
      if (dist > radius) continue;
      shard.touched.add(enemyIndex);
      damageEnemy(enemy, CRYSTAL_SHARD_PLUS_DAMAGE);
      enemy.hurt = Math.max(enemy.hurt || 0, 0.18);
      enemy.attack = 0;
      const direction = Math.sign(enemy.x - shard.x) || 1;
      if (enemy.airborne) {
        extendEnemyLaunch(enemy, direction, "bern:crystalShardPlus", CRYSTAL_SHARD_PLUS_LIFT, CRYSTAL_SHARD_PLUS_DRIFT);
      } else {
        launchEnemy(enemy, direction, CRYSTAL_SHARD_PLUS_LIFT, CRYSTAL_SHARD_PLUS_DRIFT, "bern:crystalShardPlus");
      }
      if (enemy.hp <= 0) defeatEnemy(enemy);
    }
    if (beatriceCanBeDamaged() && !shard.hitBeatrice) {
      const box = beatriceHurtbox();
      const tipY = shard.y - shard.z;
      if (shard.x >= box.x && shard.x <= box.x + box.w && tipY >= box.y && tipY <= box.y + box.h) {
        shard.hitBeatrice = true;
        damageBeatrice(CRYSTAL_SHARD_PLUS_DAMAGE, Math.sign(beatriceBoss.x - shard.x) || 1);
        if (beatriceBoss.hp <= 0) defeatBeatriceBoss();
      }
    }
    if (shard.life <= 0) upwardCrystalShards.splice(i, 1);
  }

  for (let i = crystalShards.length - 1; i >= 0; i--) {
    const shard = crystalShards[i];
    if (shard.delay > 0) {
      shard.delay -= dt;
      continue;
    }
    shard.z -= shard.speed * dt;
    if (shard.z > 0) continue;
    shard.z = 0;
    crystalTrails.push({
      x1: shard.x,
      y1: shard.y - shard.startZ - 24,
      x2: shard.targetX,
      y2: shard.targetY - 24,
      life: 0.34,
      max: 0.34
    });
    crystalShockwaves.push({
      x: shard.targetX,
      y: shard.targetY,
      life: 0.42,
      max: 0.42,
      damage: shard.shockwaveDamage || 0,
      dome: shard.source === "bern",
      touched: new Set()
    });
    scheduleCrystalShardPlus(shard.targetX, shard.targetY, shard.source || "crystalShard");
    burst(shard.targetX, shard.targetY - 48, "special");
    if (shard.source === "bernHazard") {
      const playerDist = Math.hypot(player.x - shard.targetX, player.y - shard.targetY);
      if (state === "playing" && !isPlayerInvulnerable() && playerDist <= CRYSTAL_SHARD_RADIUS * 0.82) {
        damagePlayer(BERN_REVIVE_HAZARD_SHARD_DAMAGE);
        player.invuln = 0.35;
        player.attackLungeRemaining = 0;
        resetPlayerCombo();
        setAction("hurt", 0.26);
        burst(player.x, player.y - 70, "special");
        if (player.hp <= 0) defeatPlayer();
      }
    } else {
      for (const enemy of enemies) {
        if (enemy.dead || enemy.spawnGrace > 0) continue;
        const lift = enemy.z || 0;
        const dist = Math.hypot(enemy.x - shard.targetX, enemy.y - shard.targetY);
        if (dist > CRYSTAL_SHARD_RADIUS) continue;
        damageEnemy(enemy, CRYSTAL_SHARD_DAMAGE);
        enemy.hurt = 0.2;
        enemy.attack = 0;
        const source = shard.source === "bern" ? "bern:crystal" : "crystalShard";
        const direction = Math.sign(enemy.x - shard.targetX || 1);
        if (enemy.airborne) {
          extendEnemyLaunch(enemy, direction, source, 250, 80);
        } else {
          enemy.x = clamp(enemy.x + direction * 38, 80, STAGE_W - 120);
        }
        if (enemy.hp <= 0) defeatEnemy(enemy);
      }
    }
    crystalShards.splice(i, 1);
  }
}

function updateCrystalShockwaves(dt) {
  for (let i = crystalShockwaves.length - 1; i >= 0; i--) {
    const wave = crystalShockwaves[i];
    if (wave.damage) {
      const t = 1 - wave.life / wave.max;
      const maxRadius = wave.radius || CRYSTAL_SHARD_RADIUS;
      const radius = maxRadius * (0.22 + t * 0.92);
      for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
        if (wave.touched.has(enemyIndex)) continue;
        const enemy = enemies[enemyIndex];
        if (enemy.dead || enemy.spawnGrace > 0) continue;
        const lift = enemy.z || 0;
        const dist = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
        if (dist > radius) continue;
        wave.touched.add(enemyIndex);
        damageEnemy(enemy, wave.damage);
        enemy.hurt = Math.max(enemy.hurt || 0, 0.16);
        enemy.attack = 0;
        if (enemy.airborne) {
          const direction = Math.sign(enemy.x - wave.x || 1);
          extendEnemyLaunch(enemy, direction, wave.dome ? "bern:crystalShockwave" : "crystalShockwave", 220, 70);
        }
        if (enemy.hp <= 0) defeatEnemy(enemy);
      }
    }
    wave.life -= dt;
    if (wave.life <= 0) crystalShockwaves.splice(i, 1);
  }
}

function updateCrystalTrails(dt) {
  for (let i = crystalTrails.length - 1; i >= 0; i--) {
    const trail = crystalTrails[i];
    trail.life -= dt;
    if (trail.life <= 0) crystalTrails.splice(i, 1);
  }
}

function updateKonpeito(dt) {
  if (player.konpeitoCooldown > 0) {
    player.konpeitoCooldown = Math.max(0, player.konpeitoCooldown - dt);
  }
  for (let i = konpeitoShots.length - 1; i >= 0; i--) {
    const shot = konpeitoShots[i];
    shot.t += dt / shot.duration;
    if (shot.t < 1) continue;
    impactKonpeito(shot);
    konpeitoShots.splice(i, 1);
  }
  for (let i = konpeitoShockwaves.length - 1; i >= 0; i--) {
    const wave = konpeitoShockwaves[i];
    if (wave.visualOnly) {
      wave.life -= dt;
      if (wave.life <= 0) konpeitoShockwaves.splice(i, 1);
      continue;
    }
    const t = 1 - wave.life / wave.max;
    const maxRadius = wave.radius || KONPEITO_SHOCKWAVE_MAX_RADIUS;
    const radius = KONPEITO_RADIUS + (maxRadius - KONPEITO_RADIUS) * t;
    for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
      if (wave.touched.has(enemyIndex)) continue;
      const enemy = enemies[enemyIndex];
      if (enemy.dead || enemy.spawnGrace > 0) continue;
      const dist = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
      if (dist > radius) continue;
      wave.touched.add(enemyIndex);
      launchEnemyFromKonpeito(enemy, wave.x, wave.launchSource || "lambda:konpeito");
    }
    wave.life -= dt;
    if (wave.life <= 0) konpeitoShockwaves.splice(i, 1);
  }
}

function updateBeatrice(dt) {
  if (!beatriceBoss.active) return;
  if (beatriceBoss.flavor === "defeated") {
    if (beatriceBoss.defeatPhase === "move") {
      beatriceBoss.anim += dt * 7.5;
      beatriceBoss.defeatMoveTimer = Math.min(BEATRICE_DEFEAT_MOVE_TIME, beatriceBoss.defeatMoveTimer + dt);
      const rawT = clamp(beatriceBoss.defeatMoveTimer / BEATRICE_DEFEAT_MOVE_TIME, 0, 1);
      const t = rawT * rawT * (3 - 2 * rawT);
      beatriceBoss.x = beatriceBoss.defeatStartX + (beatriceBoss.defeatTargetX - beatriceBoss.defeatStartX) * t;
      beatriceBoss.y = beatriceBoss.defeatStartY + (beatriceBoss.defeatTargetY - beatriceBoss.defeatStartY) * t;
      beatriceBoss.defeatTrailTimer -= dt;
      if (beatriceBoss.defeatTrailTimer <= 0) {
        beatriceBoss.defeatTrailTimer = 0.08;
        const frame = beatriceFrames.defeatMove[Math.floor(beatriceBoss.anim) % beatriceFrames.defeatMove.length];
        spawnBeatriceAfterimage(beatriceBoss.defeatTargetX, beatriceBoss.defeatTargetY, 0.48, frame);
        spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 64, 8);
      }
      if (rawT >= 1) {
        beatriceBoss.x = beatriceBoss.defeatTargetX;
        beatriceBoss.y = beatriceBoss.defeatTargetY;
        beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
        beatriceBoss.defeatPhase = "final";
        beatriceBoss.anim = 0;
        spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 58, 38);
      }
    } else if (beatriceBoss.defeatPhase === "final") {
      beatriceBoss.anim += dt * BEATRICE_DEFEAT_FINAL_SPEED;
      if (beatriceBoss.anim >= beatriceFrames.defeatFinal.length - beatriceFrames.defeatLoop.length) {
        beatriceBoss.defeatPhase = "fade";
        beatriceBoss.anim = 0;
        beatriceBoss.defeatTimer = BEATRICE_DEFEAT_DISSIPATE_TIME;
        spawnBeatriceDefeatWisps(beatriceBoss.x, beatriceBoss.y - 66);
        spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - 66, 56);
      }
    } else {
      beatriceBoss.anim += dt * 7;
      beatriceBoss.defeatTimer = Math.max(0, beatriceBoss.defeatTimer - dt);
      beatriceBoss.defeatTrailTimer -= dt;
      if (beatriceBoss.defeatTrailTimer <= 0) {
        beatriceBoss.defeatTrailTimer = 0.12;
        spawnGoldenButterflies(beatriceBoss.x + (Math.random() - 0.5) * 88, beatriceBoss.y - 70 + (Math.random() - 0.5) * 95, 10);
      }
      if (beatriceBoss.defeatTimer <= 0) finishBeatriceBossDefeat();
    }
    return;
  }
  if (beatriceBoss.asmoDropKickPending) {
    if (!player.airborne || player.knockedDown || state !== "playing") {
      beatriceBoss.asmoDropKickPending = false;
      beatriceBoss.asmoDropKickTimer = 0;
    } else {
      beatriceBoss.asmoDropKickTimer = Math.max(0, (beatriceBoss.asmoDropKickTimer || 0) - dt);
      if (beatriceBoss.asmoDropKickTimer <= 0) {
        startBeatriceAsmodeusDropKick();
      }
    }
  }
  if (beatriceBoss.flavor !== "teleportPrep"
    && beatriceBoss.flavor !== "teleportReady"
    && beatriceBoss.flavor !== "meleeKick"
    && beatriceBoss.flavor !== "meleeParryHurt"
    && beatriceBoss.flavor !== "meleeParryReturn"
    && beatriceBoss.flavor !== "asmoDropKick"
    && beatriceBoss.flavor !== "barrierBreak"
    && beatriceBoss.flavor !== "dizzy"
    && beatriceBoss.flavor !== "hurt"
    && beatriceBoss.flavor !== "launched"
    && beatriceBoss.flavor !== "downed"
    && beatriceBoss.flavor !== "stunRecover") {
    const target = beatriceIdleHoverPoint();
    const desiredX = target.x;
    const desiredY = target.y;
    const followSpeed = 360;
    const dx = desiredX - beatriceBoss.x;
    const dy = desiredY - beatriceBoss.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, followSpeed * dt);
      beatriceBoss.x += (dx / dist) * step;
      beatriceBoss.y += (dy / dist) * step;
    }
  }
  beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
  if (beatriceBoss.flavor === "stakeCast") {
    beatriceBoss.anim += dt * 9;
    if (!beatriceBoss.stakeCastFired && Math.floor(beatriceBoss.anim) >= 4) {
      beatriceBoss.stakeCastFired = true;
      spawnBeatriceStake();
    }
    if (beatriceBoss.anim >= beatriceFrames.stakeCast.length) {
      beatriceBoss.flavor = "idle";
      beatriceBoss.anim = 0;
      beatriceBoss.stakeCastFired = false;
    }
  } else if (beatriceBoss.flavor === "teleportPrep") {
    beatriceBoss.anim += dt * 18;
    beatriceBoss.teleportPrepTimer += dt;
    if (beatriceBoss.teleportPrepTimer >= BEATRICE_TELEPORT_PREP_JUMP_TIME) {
      advanceBeatriceTeleportPrep();
    }
  } else if (beatriceBoss.flavor === "teleportReady") {
    beatriceBoss.anim += dt * 8;
  } else if (beatriceBoss.flavor === "meleeKick") {
    if (beatriceBoss.materializeTimer > 0) {
      beatriceBoss.materializeTimer = Math.max(0, beatriceBoss.materializeTimer - dt);
    } else {
      beatriceBoss.meleeKickParryFailFade = Math.max(0, (beatriceBoss.meleeKickParryFailFade || 0) - dt);
      beatriceBoss.anim += dt * 10;
      if (!beatriceBoss.meleeKickHit && beatriceMeleeKickFrame() >= 273) {
        beatriceBoss.meleeKickHit = true;
        applyBeatriceMeleeKickHit();
      }
      if (beatriceBoss.anim >= beatriceFrames.meleeKick.length) {
        beatriceBoss.flavor = "idle";
        beatriceBoss.anim = 0;
        beatriceBoss.materializeTimer = 0;
        beatriceBoss.meleeKickHit = false;
        beatriceBoss.meleeKickParried = false;
        beatriceBoss.meleeKickParryFailed = false;
        beatriceBoss.meleeKickParryFailFade = 0;
        beatriceBoss.asmoDropKickHit = false;
        if (beatriceBoss.mechanic === "teleportAttack") completeBeatriceMechanic();
      }
    }
  } else if (beatriceBoss.flavor === "meleeParryHurt") {
    beatriceBoss.anim += dt * 12;
    beatriceBoss.x = clamp(beatriceBoss.x + beatriceBoss.meleeParryRecoilVx * dt, 90, STAGE_W - 90);
    beatriceBoss.meleeParryRecoilVx *= Math.max(0, 1 - BEATRICE_MELEE_PARRY_RECOIL_DRAG * dt);
    if (beatriceBoss.anim >= Math.min(beatriceFrames.hurt.length, 5)) {
      const target = beatriceIdleHoverPoint();
      const frame = beatriceFrames.hurt[Math.min(beatriceFrames.hurt.length - 1, Math.floor(beatriceBoss.anim))] || beatriceFrames.hurt[0];
      spawnBeatriceAfterimage(target.x, target.y, 0.52, frame);
      spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 46);
      spawnAsmodeusGoldenWisps(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 18);
      beatriceBoss.x = target.x;
      beatriceBoss.y = target.y;
      beatriceBoss.hoverOffset = 76;
      beatriceBoss.z = 0;
      beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
      beatriceBoss.flavor = "meleeParryReturn";
      beatriceBoss.anim = 0;
      beatriceBoss.materializeTimer = 0.38;
      beatriceBoss.meleeParryRecoilVx = 0;
      spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 48);
      spawnAsmodeusGoldenWisps(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 58, 18);
    }
  } else if (beatriceBoss.flavor === "meleeParryReturn") {
    beatriceBoss.anim += dt * 6;
    beatriceBoss.materializeTimer = Math.max(0, beatriceBoss.materializeTimer - dt);
    if (beatriceBoss.materializeTimer <= 0) {
      beatriceBoss.flavor = "idle";
      beatriceBoss.anim = 0;
      beatriceBoss.materializeTimer = 0;
      beatriceBoss.meleeKickHit = false;
      beatriceBoss.meleeKickParried = false;
      beatriceBoss.meleeKickParryFailed = false;
      beatriceBoss.meleeKickParryFailFade = 0;
      if (beatriceBoss.mechanic === "teleportAttack") completeBeatriceMechanic();
    }
  } else if (beatriceBoss.flavor === "asmoDropKick") {
    if (beatriceBoss.materializeTimer > 0) {
      beatriceBoss.materializeTimer = Math.max(0, beatriceBoss.materializeTimer - dt);
    } else {
      beatriceBoss.anim += dt * 13;
      const frame = beatriceFrames.asmoDropKick[Math.min(beatriceFrames.asmoDropKick.length - 1, Math.floor(beatriceBoss.anim))];
      if (!beatriceBoss.asmoDropKickHit && frame >= BEATRICE_ASMO_DROP_KICK_ACTIVE_FRAME) {
        beatriceBoss.asmoDropKickHit = true;
        applyBeatriceAsmodeusDropKickHit();
      }
      if (beatriceBoss.anim >= beatriceFrames.asmoDropKick.length) {
        spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 54, 36);
        const playerScreenX = player.x - cameraX;
        const desiredScreenX = playerScreenX < W * 0.5 ? W * 0.78 : W * 0.22;
        beatriceBoss.x = clamp(cameraX + desiredScreenX, 90, STAGE_W - 90);
        beatriceBoss.y = clamp(player.y - 54, FLOOR_Y - 132, FLOOR_Y - 16);
        beatriceBoss.hoverOffset = 76;
        beatriceBoss.z = 0;
        beatriceBoss.flavor = "idle";
        beatriceBoss.anim = 0;
        beatriceBoss.materializeTimer = 0;
        beatriceBoss.asmoDropKickHit = false;
        beatriceBoss.facing = player.x >= beatriceBoss.x ? 1 : -1;
        spawnGoldenButterflies(beatriceBoss.x, beatriceBoss.y - beatriceBoss.hoverOffset - 54, 36);
      }
    }
  } else if (beatriceBoss.flavor === "barrierBreak") {
    beatriceBoss.anim += dt * 8.5;
    beatriceBoss.x = clamp(beatriceBoss.x + beatriceBoss.breakVx * dt, 90, STAGE_W - 90);
    const fadeEnd = beatriceFrames.barrierBreak.length * BEATRICE_BARRIER_BREAK_FADE_END;
    const fadeT = clamp((beatriceBoss.anim - BEATRICE_BARRIER_BREAK_FADE_START) / Math.max(0.1, fadeEnd - BEATRICE_BARRIER_BREAK_FADE_START), 0, 1);
    beatriceBoss.breakFade = 1 - fadeT;
    if (beatriceBoss.anim >= beatriceFrames.barrierBreak.length) {
      finishBeatriceBarrierBreak();
    }
  } else if (beatriceBoss.flavor === "dizzy") {
    beatriceBoss.anim += dt * 5.8;
  } else if (beatriceBoss.flavor === "hurt") {
    beatriceBoss.anim += dt * 11;
    if (beatriceBoss.anim >= beatriceFrames.hurt.length) {
      beatriceBoss.flavor = "dizzy";
      beatriceBoss.anim = 0;
    }
  } else if (beatriceBoss.flavor === "launched") {
    beatriceBoss.x = clamp(beatriceBoss.x + beatriceBoss.airVx * dt, 90, STAGE_W - 90);
    beatriceBoss.z += beatriceBoss.vz * dt;
    beatriceBoss.vz -= BEATRICE_LAUNCH_GRAVITY * dt;
    beatriceBoss.anim += dt * 8.5;
    if (beatriceBoss.z <= 0) startBeatriceDowned();
  } else if (beatriceBoss.flavor === "downed") {
    beatriceBoss.anim = Math.min(beatriceFrames.downed.length - 0.01, beatriceBoss.anim + dt * 8);
    beatriceBoss.downTime -= dt;
    updateBeatriceGroundBounce(dt);
    if (!beatriceBoss.groundBouncePending && !beatriceBoss.groundBounceTimer && beatriceBoss.downTime <= 0 && beatriceBoss.anim >= beatriceFrames.downed.length - 0.05) {
      startBeatriceStunRecovery();
    }
  } else if (beatriceBoss.flavor === "stunRecover") {
    beatriceBoss.anim += dt * 7;
    beatriceBoss.recoveryTimer = Math.max(0, beatriceBoss.recoveryTimer - dt);
    if (beatriceBoss.recoveryTimer <= 0) finishBeatriceStunRecovery();
  } else if (beatriceBoss.flavor === "puff") {
    beatriceBoss.anim += dt * 7.5;
    if (beatriceBoss.anim >= beatriceFrames.puff.length) {
      beatriceBoss.flavor = "idle";
      beatriceBoss.anim = 0;
    }
  } else {
    beatriceBoss.anim += dt * 6;
  }
  if (beatriceBoss.vulnerable && ["dizzy", "hurt", "launched", "downed"].includes(beatriceBoss.flavor)) {
    beatriceBoss.stunIdleTimer = Math.max(0, beatriceBoss.stunIdleTimer - dt);
    if (beatriceBoss.stunDamageTimer > 0) {
      beatriceBoss.stunDamageTimer = Math.max(0, beatriceBoss.stunDamageTimer - dt);
    }
    if (beatriceBoss.stunIdleTimer <= 0 || beatriceBoss.stunDamageTimer === 0 && beatriceBoss.hp < beatriceBoss.maxHp) {
      startBeatriceStunRecovery();
    }
  }
  if (state !== "playing") return;
  updateBeatriceRingAttack(dt);
  updateBeatriceGoatRush(dt);
  updateBeatriceTowerVolley(dt);
  if (beatriceBoss.rewardStakePending && beatriceBoss.flavor === "idle") {
    beatriceBoss.rewardStakePending = false;
    startBeatriceStakeCast();
  }
  if (beatriceBoss.mechanic === "stakeReward" && !beatriceBoss.rewardStakePending && beatriceBoss.flavor === "idle" && beatriceStakes.length === 0) {
    beatriceBoss.nextMechanicTimer = Math.max(0, beatriceBoss.nextMechanicTimer - dt);
    if (beatriceBoss.nextMechanicTimer <= 0) startRandomBeatriceMechanic();
  }
}

function updateBeatriceRingAttack(dt) {
  if (beatriceBoss.mechanic !== "ringAttack") return;
  let allDone = beatriceBoss.rings.length > 0;
  for (const ring of beatriceBoss.rings) {
    ring.timer += dt;
    if (!ring.detonated && ring.timer >= ring.detonateAt) {
      ring.detonated = true;
      ring.leviathanSpawned = true;
      spawnLeviathanSlash(ring.x, ring.y, ring.radius);
    }
    if (!ring.detonated || leviathanAttacks.length > 0) allDone = false;
  }
  if (allDone) finishBeatriceRingAttack();
}

function spawnBeatriceStake() {
  if (!beatriceBoss.active) return;
  const side = beatriceBoss.facing || -1;
  const angle = (side < 0 ? Math.PI : 0) + (Math.random() - 0.5) * 1.25;
  beatriceStakes.push({
    x: beatriceBoss.x + side * 82,
    y: beatriceBoss.y - beatriceBoss.hoverOffset - 52,
    vx: Math.cos(angle) * BEATRICE_STAKE_FAST_RICOCHET_SPEED,
    vy: Math.sin(angle) * BEATRICE_STAKE_FAST_RICOCHET_SPEED,
    bounces: 0,
    mode: "ricochet",
    targetX: player.x,
    targetY: player.y,
    angle: 0,
    parryWindow: 0,
    parried: false,
    playerGroundedAtThrow: !player.airborne && !player.knockedDown
  });
}

function perturbStakeVelocity(stake, amount = 0.42) {
  const speed = Math.hypot(stake.vx, stake.vy) || BEATRICE_STAKE_RICOCHET_SPEED;
  const angle = Math.atan2(stake.vy, stake.vx) + (Math.random() - 0.5) * amount;
  stake.vx = Math.cos(angle) * speed;
  stake.vy = Math.sin(angle) * speed;
}

function setStakeSpeed(stake, speed) {
  const current = Math.hypot(stake.vx, stake.vy) || 1;
  stake.vx = (stake.vx / current) * speed;
  stake.vy = (stake.vy / current) * speed;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  return Math.hypot(px - cx, py - cy);
}

function beatriceStakeRicochetSpeed(stake) {
  if (stake.bounces <= 4) return BEATRICE_STAKE_FAST_RICOCHET_SPEED;
  if (stake.bounces === BEATRICE_STAKE_BOUNCES - 1) return BEATRICE_STAKE_PENULTIMATE_RICOCHET_SPEED;
  return BEATRICE_STAKE_RICOCHET_SPEED;
}

function forceStakeTowardCeiling(stake) {
  const speed = Math.hypot(stake.vx, stake.vy) || BEATRICE_STAKE_RICOCHET_SPEED;
  const side = Math.sign(player.x - stake.x) || player.facing || 1;
  stake.vx = side * speed * 0.42;
  stake.vy = -speed * 0.9;
}

function setBeatriceStakeLaunchTarget(stake) {
  const torsoY = player.y - 108;
  const impactY = torsoY;
  const passSide = Math.sign(player.x - stake.x) || player.facing || 1;
  let targetX = player.x + passSide * 170;

  if (stake.y < torsoY - 8) {
    const groundY = player.y - 46;
    const t = (groundY - stake.y) / (torsoY - stake.y);
    if (Number.isFinite(t) && t > 1) {
      targetX = stake.x + (player.x - stake.x) * t;
    }
  }

  const visibleMin = cameraX + 58;
  const visibleMax = cameraX + W - 58;
  stake.targetX = clamp(targetX, visibleMin, visibleMax);
  stake.targetY = player.y;
  stake.impactY = impactY;
}

function beatriceStakeImpactY(stake) {
  return stake.impactY ?? stake.targetY - 46;
}

function beatriceStakeDistanceToImpact(stake) {
  return Math.hypot(stake.x - stake.targetX, stake.y - beatriceStakeImpactY(stake));
}

function playerInBeatriceStakeReticle(stake) {
  return Math.hypot(player.x - stake.targetX, player.y - stake.targetY) <= BEATRICE_STAKE_PARRY_RADIUS;
}

function beatriceStakeGroundShockwaveHitsPlayer(stake) {
  if (!stake.playerGroundedAtThrow || player.airborne || player.knockedDown || isPlayerInvulnerable()) return false;
  const dx = player.x - stake.targetX;
  const dy = (player.y - stake.targetY) / 0.34;
  return Math.hypot(dx, dy) <= BEATRICE_STAKE_RETICLE_RADIUS;
}

function beatriceStakeParryReady(stake) {
  return stake.mode === "launch"
    && playerInBeatriceStakeReticle(stake)
    && beatriceStakeDistanceToImpact(stake) <= BEATRICE_STAKE_PARRY_DISTANCE;
}

function updateBeatriceStakes(dt) {
  updateBeatriceDefeatWisps(dt);
  for (let i = beatriceStakes.length - 1; i >= 0; i--) {
    const stake = beatriceStakes[i];
    const prevX = stake.x;
    const prevY = stake.y;
    if (stake.mode === "ricochet") {
      stake.x += stake.vx * dt;
      stake.y += stake.vy * dt;
      const left = cameraX + 34;
      const right = cameraX + W - 34;
      const floor = FLOOR_Y - 8;
      const top = 74;
      let bounced = false;
      if (stake.x <= left || stake.x >= right) {
        stake.x = clamp(stake.x, left, right);
        stake.vx *= -1;
        perturbStakeVelocity(stake);
        bounced = true;
      }
      if (stake.y >= floor || stake.y <= top) {
        stake.y = clamp(stake.y, top, floor);
        stake.vy *= -1;
        perturbStakeVelocity(stake);
        bounced = true;
      }
      if (bounced) {
        stake.bounces += 1;
        setStakeSpeed(stake, beatriceStakeRicochetSpeed(stake));
        if (stake.bounces === BEATRICE_STAKE_BOUNCES - 1) {
          forceStakeTowardCeiling(stake);
        }
      }
      if (stake.bounces >= BEATRICE_STAKE_BOUNCES) {
        stake.mode = "launch";
        setBeatriceStakeLaunchTarget(stake);
        const aimX = stake.targetX - stake.x;
        const aimY = beatriceStakeImpactY(stake) - stake.y;
        const len = Math.hypot(aimX, aimY) || 1;
        stake.vx = (aimX / len) * BEATRICE_STAKE_LAUNCH_SPEED;
        stake.vy = (aimY / len) * BEATRICE_STAKE_LAUNCH_SPEED;
        stake.parryWindow = 0;
      }
    } else if (stake.mode === "launch") {
      stake.x += stake.vx * dt;
      stake.y += stake.vy * dt;
      stake.parryWindow = beatriceStakeParryReady(stake) ? BEATRICE_STAKE_PARRY_WINDOW : 0;
      if (beatriceStakeDistanceToImpact(stake) <= 34) {
        const threatenedPlayer = playerInBeatriceStakeReticle(stake) || beatriceStakeGroundShockwaveHitsPlayer(stake);
        beatriceStakeShockwaves.push({ x: stake.targetX, y: stake.targetY, life: BEATRICE_STAKE_SHOCKWAVE_TIME, max: BEATRICE_STAKE_SHOCKWAVE_TIME });
        spawnGoldenSparkles(stake.targetX, stake.targetY - 42, 22);
        if (threatenedPlayer) triggerAsmodeusStakeHit(stake);
        screenShakeTimer = Math.max(screenShakeTimer, 0.16);
        beatriceStakes.splice(i, 1);
        continue;
      }
    } else if (stake.mode === "return") {
      stake.x += stake.vx * dt;
      stake.y += stake.vy * dt;
      const targetX = beatriceBoss.x;
      const targetY = beatriceBoss.y - beatriceBoss.hoverOffset - 70;
      if (pointToSegmentDistance(targetX, targetY, prevX, prevY, stake.x, stake.y) <= 38) {
        spawnGoldenSparkles(targetX, targetY, 30);
        if (stake.parried && beatriceStakeParryFreezeTimer > 0) {
          beatriceStakeParryPendingHit.active = true;
          beatriceStakeParryPendingHit.direction = Math.sign(beatriceBoss.x - stake.x) || -beatriceBoss.facing || 1;
        } else {
          handleBeatriceReturnedStakeHit(stake);
        }
        beatriceStakes.splice(i, 1);
        continue;
      }
    }
    stake.angle = Math.atan2(stake.vy, stake.vx);
    beatriceStakeTrails.push({
      x1: prevX,
      y1: prevY,
      x2: stake.x,
      y2: stake.y,
      life: stake.mode === "return" ? BEATRICE_STAKE_TRAIL_TIME * 1.85 : BEATRICE_STAKE_TRAIL_TIME,
      max: stake.mode === "return" ? BEATRICE_STAKE_TRAIL_TIME * 1.85 : BEATRICE_STAKE_TRAIL_TIME,
      color: stake.mode === "return" ? "blue" : "red"
    });
  }

  for (let i = beatriceStakeTrails.length - 1; i >= 0; i--) {
    const trail = beatriceStakeTrails[i];
    trail.life -= dt;
    if (trail.life <= 0) beatriceStakeTrails.splice(i, 1);
  }
  for (let i = beatriceStakeShockwaves.length - 1; i >= 0; i--) {
    const wave = beatriceStakeShockwaves[i];
    wave.life -= dt;
    if (wave.life <= 0) beatriceStakeShockwaves.splice(i, 1);
  }
  for (let i = beatriceStakeSparkles.length - 1; i >= 0; i--) {
    const sparkle = beatriceStakeSparkles[i];
    sparkle.life -= dt;
    sparkle.x += sparkle.vx * dt;
    sparkle.y += sparkle.vy * dt;
    sparkle.angle = (sparkle.angle || 0) + (sparkle.spin || 0) * dt;
    sparkle.vy += 420 * dt;
    if (sparkle.life <= 0) beatriceStakeSparkles.splice(i, 1);
  }
  for (let i = beatriceAfterimages.length - 1; i >= 0; i--) {
    const image = beatriceAfterimages[i];
    image.life -= dt;
    const t = 1 - clamp(image.life / image.max, 0, 1);
    image.x = image.fromX + (image.targetX - image.fromX) * t;
    image.y = image.fromY + (image.targetY - image.fromY) * t;
    if (image.life <= 0) beatriceAfterimages.splice(i, 1);
  }
  for (let i = asmodeusAttacks.length - 1; i >= 0; i--) {
    const attack = asmodeusAttacks[i];
    attack.age = (attack.age || 0) + dt;
    attack.anim += dt * 9.5;
    attack.life -= dt;
    if (!attack.hit && attack.anim >= 1.6) {
      attack.hit = true;
      applyAsmodeusUppercutHit(attack);
      screenShakeTimer = Math.max(screenShakeTimer, 0.12);
    }
    if (!attack.exitSpawned && (attack.life <= 0.18 || attack.anim >= 3.35)) {
      attack.exitSpawned = true;
      spawnGoldenButterflies(attack.x, attack.y - 122, 28);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - 104, 12);
    }
    if (attack.life <= 0 || attack.anim >= 4) asmodeusAttacks.splice(i, 1);
  }
  for (let i = beelzebubAttacks.length - 1; i >= 0; i--) {
    const attack = beelzebubAttacks[i];
    attack.age = (attack.age || 0) + dt;
    attack.anim += dt * BEELZEBUB_DROP_SLASH_ANIM_SPEED;
    attack.life -= dt;
    const frame = beelzebubFrames[Math.min(beelzebubFrames.length - 1, Math.floor(attack.anim))];
    if (!attack.hit && frame >= BEELZEBUB_DROP_SLASH_ACTIVE_FRAME) {
      attack.hit = true;
      applyBeelzebubDropSlashHit(attack);
    }
    if (!attack.exitSpawned && (attack.life <= 0.18 || attack.anim >= beelzebubFrames.length - 1.2)) {
      attack.exitSpawned = true;
      spawnGoldenButterflies(attack.x, attack.y - (attack.z || BEATRICE_ASMO_DROP_KICK_HOVER) - 44, 34);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - (attack.z || BEATRICE_ASMO_DROP_KICK_HOVER) - 44, 14);
    }
    if (attack.life <= 0 || attack.anim >= beelzebubFrames.length) beelzebubAttacks.splice(i, 1);
  }
  for (let i = leviathanAttacks.length - 1; i >= 0; i--) {
    const attack = leviathanAttacks[i];
    attack.age += dt;
    attack.anim += dt * LEVIATHAN_SLASH_ANIM_SPEED;
    attack.life -= dt;
    const frame = leviathanFrames[Math.min(leviathanFrames.length - 1, Math.floor(attack.anim))];
    if (!attack.hit && frame >= LEVIATHAN_SLASH_ACTIVE_FRAME) {
      attack.hit = true;
      applyLeviathanSlashHit(attack);
    }
    if (!attack.exitSpawned && (attack.life <= 0.18 || attack.anim >= leviathanFrames.length - 1.1)) {
      attack.exitSpawned = true;
      spawnGoldenButterflies(attack.x, attack.y - 70, 24);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - 54, 10);
    }
    if (attack.life <= 0 || attack.anim >= leviathanFrames.length) leviathanAttacks.splice(i, 1);
  }
  for (let i = satanAttacks.length - 1; i >= 0; i--) {
    const attack = satanAttacks[i];
    attack.age += dt;
    attack.anim += dt * SATAN_AERIAL_ANIM_SPEED;
    attack.life -= dt;
    const frame = satanFrames[Math.min(satanFrames.length - 1, Math.floor(attack.anim))];
    if (!attack.hit && frame >= SATAN_AERIAL_ACTIVE_FRAME) {
      attack.hit = true;
      applySatanAerialLaunchHit(attack);
    }
    if (!attack.exitSpawned && (attack.life <= 0.18 || attack.anim >= satanFrames.length - 1.1)) {
      attack.exitSpawned = true;
      spawnGoldenButterflies(attack.x, attack.y - (attack.z || SATAN_AERIAL_HOVER) - 28, 24);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - (attack.z || SATAN_AERIAL_HOVER) - 24, 10);
    }
    if (attack.life <= 0 || attack.anim >= satanFrames.length) satanAttacks.splice(i, 1);
  }
  for (let i = belphegorAttacks.length - 1; i >= 0; i--) {
    const attack = belphegorAttacks[i];
    if (attack.delay > 0) {
      attack.delay = Math.max(0, attack.delay - dt);
      if (attack.delay > 0) continue;
    }
    if (!attack.appeared) {
      attack.appeared = true;
      spawnGoldenButterflies(attack.x, attack.y - (attack.z || BELPHEGOR_SLAM_HOVER) - 28, 28);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - (attack.z || BELPHEGOR_SLAM_HOVER) - 24, 12);
    }
    attack.age += dt;
    attack.anim += dt * BELPHEGOR_SLAM_ANIM_SPEED;
    attack.life -= dt;
    const frame = belphegorFrames[Math.min(belphegorFrames.length - 1, Math.floor(attack.anim))];
    if (!attack.hit && frame >= BELPHEGOR_SLAM_ACTIVE_FRAME) {
      attack.hit = true;
      applyBelphegorGroundBounceSlamHit(attack);
    }
    if (!attack.exitSpawned && (attack.life <= 0.18 || attack.anim >= belphegorFrames.length - 1.1)) {
      attack.exitSpawned = true;
      spawnGoldenButterflies(attack.x, attack.y - (attack.z || BELPHEGOR_SLAM_HOVER) - 24, 24);
      spawnAsmodeusGoldenWisps(attack.x, attack.y - (attack.z || BELPHEGOR_SLAM_HOVER) - 20, 10);
    }
    if (attack.life <= 0 || attack.anim >= belphegorFrames.length) belphegorAttacks.splice(i, 1);
  }
}

function updateBeatriceStakeParryLine(dt) {
  beatriceStakeParryLine.life = Math.max(0, beatriceStakeParryLine.life - dt);
}

function beatriceStakeParryIndicatorActive() {
  return beatriceStakes.some((stake) => stake.mode === "launch" && playerInBeatriceStakeReticle(stake));
}

function tryBeatriceStakeParry() {
  if (state !== "playing") return false;
  for (let i = beatriceStakes.length - 1; i >= 0; i--) {
    const stake = beatriceStakes[i];
    if (stake.mode !== "launch") continue;
    if (!beatriceStakeParryReady(stake)) {
      if (playerInBeatriceStakeReticle(stake)) {
        triggerAsmodeusStakeHit(stake);
        beatriceStakeShockwaves.push({ x: stake.targetX, y: stake.targetY, life: BEATRICE_STAKE_SHOCKWAVE_TIME, max: BEATRICE_STAKE_SHOCKWAVE_TIME });
        spawnGoldenSparkles(stake.x, stake.y, 18);
        beatriceStakes.splice(i, 1);
        return true;
      }
      continue;
    }
    const targetX = beatriceBoss.x;
    const targetY = beatriceBoss.y - beatriceBoss.hoverOffset - 70;
    player.action = "stakeParryPose";
    player.anim = 0;
    player.attackLock = Math.max(player.attackLock, BEATRICE_STAKE_RETURN_FREEZE + 0.08);
    player.attackHasHit = false;
    player.crestAttackHasHit = false;
    player.currentAttack = "";
    player.facing = Math.sign(targetX - player.x) || player.facing || 1;
    const lineStartX = player.x + player.facing * 48;
    const lineStartY = player.y - 106;
    const lineDx = targetX - lineStartX;
    const lineDy = targetY - lineStartY;
    const lineLen = Math.hypot(lineDx, lineDy) || 1;
    stake.mode = "return";
    stake.x = lineStartX;
    stake.y = lineStartY;
    stake.vx = (lineDx / lineLen) * BEATRICE_STAKE_RETURN_SPEED;
    stake.vy = (lineDy / lineLen) * BEATRICE_STAKE_RETURN_SPEED;
    stake.parried = true;
    stake.parryWindow = 0;
    beatriceStakeParryLine.life = BEATRICE_STAKE_RETURN_LINE_TIME;
    beatriceStakeParryLine.max = BEATRICE_STAKE_RETURN_LINE_TIME;
    beatriceStakeParryLine.x1 = lineStartX;
    beatriceStakeParryLine.y1 = lineStartY;
    beatriceStakeParryLine.x2 = targetX + (lineDx / lineLen) * 210;
    beatriceStakeParryLine.y2 = targetY + (lineDy / lineLen) * 210;
    runStats.parriesPerformed += 1;
    enemyFreezeTimer = Math.max(enemyFreezeTimer, BEATRICE_STAKE_RETURN_FREEZE);
    beatriceStakeParryFreezeTimer = Math.max(beatriceStakeParryFreezeTimer, BEATRICE_STAKE_RETURN_FREEZE);
    screenShakeTimer = Math.max(screenShakeTimer, 0.56);
    burst(player.x, player.y - 96, "special");
    return true;
  }
  return false;
}

function updateLambda(dt) {
  if (!lambdaCompanion.active) return;
  if (lambdaCompanion.state === "summon") {
    lambdaCompanion.anim += dt * 8;
    if (lambdaCompanion.anim >= lambdaFrames.summon.length) {
      lambdaCompanion.state = "idle";
      lambdaCompanion.anim = 0;
    }
  } else if (lambdaCompanion.state === "gameOver") {
    lambdaCompanion.anim += dt * 7;
  } else if (lambdaCompanion.state === "laugh") {
    if (player.airborne || player.knockedDown) {
      lambdaCompanion.anim += dt * 8;
    } else {
      lambdaCompanion.state = "idle";
      lambdaCompanion.anim = 0;
      lambdaCompanion.konpeitoCharge = 0;
      lambdaCompanion.konpeitoTimer = LAMBDA_KONPEITO_INTERVAL;
    }
  } else if (lambdaCompanion.state === "konpeitoKnockdown") {
    lambdaCompanion.anim = Math.min(lambdaFrames.konpeitoKnockdown.length - 0.01, lambdaCompanion.anim + dt * 9);
  } else if (lambdaCompanion.state === "konpeitoCast") {
    const nearest = nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y);
    if (nearest) lambdaCompanion.facing = nearest.x >= lambdaCompanion.x ? 1 : -1;
    lambdaCompanion.anim += dt * 18;
    const castFrame = lambdaFrames.konpeitoCast[Math.min(lambdaFrames.konpeitoCast.length - 1, Math.floor(lambdaCompanion.anim))];
    if (state === "playing" && !lambdaCompanion.castHasFired && castFrame >= 442) {
      lambdaCompanion.castHasFired = true;
      fireLambdaKonpeito();
    }
    if (lambdaCompanion.anim >= lambdaFrames.konpeitoCast.length) {
      if ((lambdaCompanion.konpeitoCharge || 0) >= 100 && nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y)) {
        lambdaCompanion.konpeitoCharge = Math.max(0, (lambdaCompanion.konpeitoCharge || 0) - 100);
        lambdaCompanion.konpeitoTimer = companionChargeCooldown(lambdaCompanion.konpeitoCharge, LAMBDA_KONPEITO_INTERVAL);
        lambdaCompanion.anim = 0;
        lambdaCompanion.castHasFired = false;
        return;
      }
      lambdaCompanion.queuedKonpeito = false;
      lambdaCompanion.state = "idle";
      lambdaCompanion.anim = 0;
      lambdaCompanion.castHasFired = false;
    }
  } else {
    updateLambdaKonpeitoCharge(dt);
    if ((lambdaCompanion.konpeitoCharge || 0) >= 100 && startLambdaKonpeitoCast()) return;
    const followX = clamp(player.x - player.facing * 104, 90, STAGE_W - 130);
    const followY = clampPlayY(player.y + 22);
    const nearest = nearestEnemyTo(lambdaCompanion.x, lambdaCompanion.y);
    const enemyFacing = nearest ? (nearest.x >= lambdaCompanion.x ? 1 : -1) : player.facing;
    const dx = followX - lambdaCompanion.x;
    const dy = followY - lambdaCompanion.y;
    const dist = Math.hypot(dx, dy);
    const wasMoving = lambdaCompanion.state === "move" || lambdaCompanion.state === "moveBack";
    const previousMoveState = lambdaCompanion.state;
    const shouldMove = dist > (wasMoving ? 8 : 18);
    lambdaCompanion.facing = enemyFacing;
    if (shouldMove) {
      const step = Math.min(dist, 250 * dt);
      lambdaCompanion.x += (dx / dist) * step;
      lambdaCompanion.y += (dy / dist) * step;
      const moveDir = dx >= 0 ? 1 : -1;
      lambdaCompanion.state = moveDir === lambdaCompanion.facing ? "move" : "moveBack";
      if (lambdaCompanion.state !== previousMoveState) lambdaCompanion.anim = 0;
      lambdaCompanion.moveSettle = 0;
      lambdaCompanion.anim += dt * LAMBDA_MOVE_ANIM_RATE;
    } else if (wasMoving && lambdaCompanion.moveSettle < 0.14) {
      lambdaCompanion.moveSettle += dt;
      lambdaCompanion.anim += dt * LAMBDA_MOVE_ANIM_RATE;
    } else {
      lambdaCompanion.state = "idle";
      lambdaCompanion.moveSettle = 0;
      lambdaCompanion.anim += dt * 4;
    }
  }
}

function updateBernkastel(dt) {
  if (!bernCompanion.active) return;
  bernCompanion.parryFailFade = Math.max(0, (bernCompanion.parryFailFade || 0) - dt);
  if (bernCompanion.state === "sacrifice") {
    bernCompanion.anim += dt * 7;
    if (bernCompanion.anim >= bernFrames.sacrifice.length) {
      bernCompanion.active = false;
      bernCompanion.summoned = false;
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
      bernCompanion.moveSettle = 0;
      bernCompanion.queuedCrystal = false;
      bernCompanion.catForm = false;
    }
  } else if (bernCompanion.state === "hazardTeleportIn") {
    bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.attackTargetX = player.x;
    bernCompanion.attackTargetY = player.y;
    bernCompanion.parryClock += dt;
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    bernCompanion.crystalCharge -= dt;
    if (bernCompanion.anim >= bernFrames.hazardTeleportIn.length) {
      bernCompanion.state = "hazardCharge";
      bernCompanion.anim = 0;
      bernCompanion.crystalHasFired = false;
    }
  } else if (bernCompanion.state === "hazardCharge") {
    bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.attackTargetX = player.x;
    bernCompanion.attackTargetY = player.y;
    bernCompanion.parryClock += dt;
    bernCompanion.anim += dt * 9;
    const frame = bernFrames.hazardCharge[Math.min(bernFrames.hazardCharge.length - 1, Math.floor(bernCompanion.anim))];
    if (!bernCompanion.crystalHasFired && frame >= 497) {
      bernCompanion.crystalHasFired = true;
      fireBernHazardCrystals();
      bernCompanion.x = clamp(bernCompanion.x - bernCompanion.facing * 34, 90, STAGE_W - 130);
      bernCompanion.y = clampPlayY(bernCompanion.y - 18);
    }
    if (bernCompanion.anim >= bernFrames.hazardCharge.length) {
      if (!bernCompanion.crystalHasFired) fireBernHazardCrystals();
      bernCompanion.state = "hazardTeleportOut";
      bernCompanion.anim = 0;
      bernCompanion.crystalHasFired = false;
    }
  } else if (bernCompanion.state === "hazardParried") {
    bernCompanion.anim += dt * 11;
    bernCompanion.x = clamp(bernCompanion.x + bernCompanion.parryVx * dt, 60, STAGE_W - 60);
    bernCompanion.parryZ += bernCompanion.parryVz * dt;
    bernCompanion.parryFade -= dt;
    if (bernCompanion.parryFade <= 0) {
      bernCompanion.active = false;
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
      bernCompanion.parryZ = 0;
      bernCompanion.parryVx = 0;
      bernCompanion.parryVz = 0;
      bernCompanion.parryFailed = false;
      bernCompanion.parryFailFade = 0;
      player.bernHazardTimer = BERN_HAZARD_PARRY_SUCCESS_RESPAWN;
    }
  } else if (bernCompanion.state === "hazardTeleportOut") {
    bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    if (bernCompanion.anim >= bernFrames.hazardTeleportOut.length) {
      bernCompanion.active = false;
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
      bernCompanion.parryFailed = false;
      bernCompanion.parryFailFade = 0;
      player.bernHazardTimer = BERN_HAZARD_PARRY_FAIL_RESPAWN;
    }
  } else if (bernCompanion.state === "summon") {
    bernCompanion.anim += dt * 7;
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
    if (bernCompanion.anim >= bernFrames.summon.length) {
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
    }
  } else if (bernCompanion.state === "catFadeOut") {
    bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt / BERN_CAT_FADE_TIME;
    if (bernCompanion.anim >= 1) {
      bernCompanion.catForm = false;
      bernCompanion.state = "teleportOut";
      bernCompanion.anim = 0;
    }
  } else if (bernCompanion.state === "teleportOut") {
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    if (bernCompanion.anim >= bernFrames.teleportOut.length) {
      const target = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
      if (!target) {
        bernCompanion.state = "idle";
        bernCompanion.anim = 0;
        bernCompanion.crystalChargeGauge = Math.max(100, bernCompanion.crystalChargeGauge || 100);
        bernCompanion.crystalTimer = 0;
        return;
      }
      placeBernAboveTarget(target);
      bernCompanion.state = "teleportIn";
      bernCompanion.anim = 0;
      bernCompanion.crystalCharge = BERN_CRYSTAL_CHARGE_TIME;
    }
  } else if (bernCompanion.state === "teleportIn") {
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) {
      bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
      bernCompanion.attackTargetX = strongest.x;
      bernCompanion.attackTargetY = strongest.y;
    }
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    bernCompanion.crystalCharge -= dt;
    if (bernCompanion.anim >= bernFrames.teleportIn.length) {
      bernCompanion.state = "crystalCharge";
      bernCompanion.anim = 0;
      bernCompanion.crystalHasFired = false;
    }
  } else if (bernCompanion.state === "crystalCharge") {
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) {
      bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
      bernCompanion.attackTargetX = strongest.x;
      bernCompanion.attackTargetY = strongest.y;
    }
    bernCompanion.anim += dt * 9;
    bernCompanion.crystalCharge -= dt;
    const frame = bernFrames.crystalCharge[Math.min(bernFrames.crystalCharge.length - 1, Math.floor(bernCompanion.anim))];
    if (!bernCompanion.crystalHasFired && frame >= 497) {
      bernCompanion.crystalHasFired = true;
      fireBernColumnCrystals();
      bernCompanion.x = clamp(bernCompanion.x - bernCompanion.facing * 34, 90, STAGE_W - 130);
      bernCompanion.y = clampPlayY(bernCompanion.y - 18);
    }
    if (bernCompanion.anim >= bernFrames.crystalCharge.length) {
      if (!bernCompanion.crystalHasFired) fireBernColumnCrystals();
      if ((bernCompanion.crystalChargeGauge || 0) >= 100 && beginQueuedBernCrystalBarrage()) return;
      bernCompanion.state = "teleportBackOut";
      bernCompanion.anim = 0;
      bernCompanion.crystalHasFired = false;
    }
  } else if (bernCompanion.state === "teleportBackOut") {
    if ((bernCompanion.crystalChargeGauge || 0) >= 100 && beginQueuedBernCrystalBarrage()) return;
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    if (bernCompanion.anim >= bernFrames.teleportBackOut.length) {
      placeBernAtFollowPosition();
      maybeBernCatForm();
      bernCompanion.state = bernCompanion.catForm ? "catFadeIn" : "teleportBackIn";
      bernCompanion.anim = 0;
    }
  } else if (bernCompanion.state === "teleportBackIn") {
    const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
    if (strongest) bernCompanion.facing = strongest.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt * BERN_TELEPORT_FRAME_SPEED;
    if (bernCompanion.anim >= bernFrames.teleportBackIn.length) {
      if ((bernCompanion.crystalChargeGauge || 0) >= 100) {
        startBernCrystalAttack(true);
        return;
      }
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
    }
  } else if (bernCompanion.state === "catFadeIn") {
    bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    bernCompanion.anim += dt / BERN_CAT_FADE_TIME;
    if (bernCompanion.anim >= 1) {
      if ((bernCompanion.crystalChargeGauge || 0) >= 100) {
        startBernCrystalAttack(true);
        return;
      }
      bernCompanion.state = "idle";
      bernCompanion.anim = 0;
    }
  } else {
    updateBernCrystalGauge(dt);
    if ((bernCompanion.crystalChargeGauge || 0) >= 100 && startBernCrystalAttack()) return;
    const followX = clamp(player.x - player.facing * 132, 90, STAGE_W - 130);
    const followY = clampBackgroundCompanionY(player.y - 56);
    const dx = followX - bernCompanion.x;
    const dy = followY - bernCompanion.y;
    const dist = Math.hypot(dx, dy);
    const wasMoving = bernCompanion.state === "move" || bernCompanion.state === "moveBack";
    const moving = dist > (wasMoving ? 8 : 18);
    if (bernCompanion.catForm) {
      bernCompanion.facing = player.x >= bernCompanion.x ? 1 : -1;
    } else {
      const strongest = strongestEnemyTo(bernCompanion.x, bernCompanion.y);
      bernCompanion.facing = strongest ? (strongest.x >= bernCompanion.x ? 1 : -1) : player.facing;
    }
    if (moving) {
      const moveDir = dx >= 0 ? 1 : -1;
      bernCompanion.state = bernCompanion.catForm ? "move" : moveDir === bernCompanion.facing ? "move" : "moveBack";
      bernCompanion.moveSettle = 0;
      const step = Math.min(dist, 210 * dt);
      bernCompanion.x += (dx / dist) * step;
      bernCompanion.y += (dy / dist) * step;
      bernCompanion.anim += dt * 10;
    } else if (wasMoving && bernCompanion.moveSettle < 0.14) {
      bernCompanion.moveSettle += dt;
      bernCompanion.anim += dt * 10;
    } else {
      if (bernCompanion.state !== "idle") bernCompanion.anim = 0;
      bernCompanion.state = "idle";
      bernCompanion.moveSettle = 0;
      bernCompanion.anim += dt * 7;
    }
  }
}

function updateKonpeitoGeysers(dt) {
  for (let i = konpeitoGeysers.length - 1; i >= 0; i--) {
    const geyser = konpeitoGeysers[i];
    geyser.life -= dt;
    if (geyser.life <= 0) konpeitoGeysers.splice(i, 1);
  }
}

function updateKonpeitoDomeBursts(dt) {
  for (let i = konpeitoDomeBursts.length - 1; i >= 0; i--) {
    const burst = konpeitoDomeBursts[i];
    burst.life -= dt;
    if (burst.life <= 0) konpeitoDomeBursts.splice(i, 1);
  }
}

function updateBernReviveHazard(dt) {
  if (!bernHazardCanSpawn() || state !== "playing") return;
  if (bernCompanion.active) return;
  player.bernHazardTimer = Math.max(0, player.bernHazardTimer - dt);
  if (player.bernHazardTimer <= 0 && !startBernHazardAttack()) {
    player.bernHazardTimer = 1;
  }
}

function update(dt) {
  updateParryTipAlert();
  if (state === "lost") {
    resetAttackHolds();
    player.duoCharge = 0;
    updateResolveDuoOutline();
    player.anim = Math.min(frames.down.length - 0.01, player.anim + dt * 8);
    updateParticles(dt);
    updateCrystalShards(dt);
    updateCrystalTrails(dt);
    updateCrystalShockwaves(dt);
    updateKonpeito(dt);
    updateLambdaSpecialKonpeitos(dt);
    updateLambdaSpecialShrapnel(dt);
    updateBeatrice(dt);
    updateBeatriceStakes(dt);
    updateBeatriceStakeParryLine(dt);
    updateLambda(dt);
    updateBernkastel(dt);
    updateKonpeitoGeysers(dt);
    updateKonpeitoDomeBursts(dt);
    updateSummonPillars(dt);
    updateLambdaGameOverDialogue(dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    scoreLabel.textContent = `Score ${score}`;
    return;
  }
  if (state === "lambdaChoice") {
    resetAttackHolds();
    updateLambda(dt);
    updateParticles(dt);
    updateCrystalTrails(dt);
    updateCrystalShockwaves(dt);
    updateKonpeitoGeysers(dt);
    updateKonpeitoDomeBursts(dt);
    updateSummonPillars(dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    updateResolveDuoOutline();
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    return;
  }
  if (state === "lambdaRetaliation") {
    resetAttackHolds();
    lambdaRetaliation.timer = Math.max(0, lambdaRetaliation.timer - dt);
    lambdaRetaliation.laughTimer -= dt;
    while (lambdaRetaliation.laughTimer <= 0 && lambdaRetaliation.laughCount < 260) {
      lambdaRetaliation.laughCount += Math.max(1, Math.floor(lambdaRetaliation.laughCount / 14));
      lambdaRetaliation.laughDelay = Math.max(LAMBDA_RETALIATION_LAUGH_MIN_DELAY, lambdaRetaliation.laughDelay * 0.78);
      lambdaRetaliation.laughTimer += lambdaRetaliation.laughDelay;
    }
    updateLambda(dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    updateResolveDuoOutline();
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    if (lambdaRetaliation.timer <= 0) startGame();
    return;
  }
  if (state === "bossBlessing") {
    resetAttackHolds();
    updateParticles(dt);
    updateKonpeitoGeysers(dt);
    updateSummonPillars(dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  if (state === "beatriceTutorial" || state === "beatriceStakeTutorial") {
    resetAttackHolds();
    beatriceTutorial.skipCooldown = Math.max(0, beatriceTutorial.skipCooldown - dt);
    beatriceStakeTutorial.skipCooldown = Math.max(0, beatriceStakeTutorial.skipCooldown - dt);
    updateBeatrice(dt);
    updateParticles(dt);
    updateBeatriceStakeParryLine(dt);
    updateCrystalTrails(dt);
    updateCrystalShockwaves(dt);
    updateKonpeitoGeysers(dt);
    updateKonpeitoDomeBursts(dt);
    updateSummonPillars(dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  if (state === "paused") {
    resetAttackHolds();
    updateResolveHud(dt);
    updateResolveDuoOutline();
    return;
  }
  if (state === "itemTutorial") {
    resetAttackHolds();
    itemTutorial.dismissDelay = Math.max(0, itemTutorial.dismissDelay - dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    updateResolveDuoOutline();
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    return;
  }
  if (state !== "playing") {
    player.duoCharge = 0;
    updateResolveHud(dt);
    updateResolveDuoOutline();
    resetAttackHolds();
    return;
  }
  updateAttackHolds(dt);
  updateDuoCharge(dt);
  if (player.action === "duoCharge") {
    resetAttackHolds();
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    bernParryOverlayTimer = Math.max(0, bernParryOverlayTimer - dt);
    updateParticles(dt);
    messageTimer = Math.max(0, messageTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  if (beatriceStakeParryFreezeTimer > 0) {
    ctx.save();
    ctx.filter = "grayscale(1) saturate(0.08) brightness(0.58)";
    drawBackground();
    drawPickups();
    drawMessageBottles();
    drawSummonPillars();
    drawKonpeitoGeysers(false);
    drawKonpeitoDomeBursts(false);
    drawBeatriceStakeReticles();
    drawBeatriceBossWalls();
    drawBeatriceRingTelegraphs();
    drawBeatriceMeleeKickTelegraph();
    drawBeatriceGoatRushTelegraphs();
    drawBeatriceTowerVolleyTelegraphs();
    drawBeatriceTowerVolleys();
    drawActors({ skipPlayer: true, skipBeatrice: true });
    drawKonpeitoGeysers(true);
    drawDuoAttackEffects();
    drawSpecialBeam();
    drawCrystalTrails();
    drawCrystalShockwaves();
    drawCrystalShards();
    drawKonpeitoShockwaves();
    drawKonpeitoDomeBursts(true);
    drawLambdaSpecialKonpeitos();
    drawLambdaSpecialShrapnel();
    drawBeatriceStakeShockwaves();
    drawKonpeitoShots();
    drawBeatriceTowerVolleyMissiles();
    drawBeatriceStakeSparkles();
    drawBeatriceDefeatWisps();
    drawParticles();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "rgba(2, 17, 23, 0.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawBeatriceStakeParryLine();
    drawPlayer();
    drawBeatrice();
    drawBeatriceStakeTrails();
    drawBeatriceStakes();
    drawBeatriceDefeatWisps();
  } else if (duoAttack.active) {
    resetAttackHolds();
    updateDuoAttack(dt);
    updateCrystalTrails(dt);
    updateCrystalShockwaves(dt);
    updateKonpeitoGeysers(dt);
    updateKonpeitoDomeBursts(dt);
    updateSummonPillars(dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    updateParticles(dt);
    messageTimer = Math.max(0, messageTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  if (beatriceStakeParryFreezeTimer > 0) {
    resetAttackHolds();
    beatriceStakeParryFreezeTimer = Math.max(0, beatriceStakeParryFreezeTimer - dt);
    if (player.action === "stakeParryPose") {
      player.anim += dt * 14;
      player.attackLock = Math.max(0, player.attackLock - dt);
    }
    enemyFreezeTimer = Math.max(0, enemyFreezeTimer - dt);
    updateBeatriceStakes(dt);
    updateBeatriceStakeParryLine(dt);
    updateCrystalTrails(dt);
    updateCrystalShockwaves(dt);
    updateKonpeitoGeysers(dt);
    updateKonpeitoDomeBursts(dt);
    updateSummonPillars(dt);
    screenFlashTimer = Math.max(0, screenFlashTimer - dt);
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    bernParryOverlayTimer = Math.max(0, bernParryOverlayTimer - dt);
    updateParticles(dt);
    messageTimer = Math.max(0, messageTimer - dt);
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    updateParryTipAlert();
    if (beatriceStakeParryFreezeTimer <= 0) resolveBeatriceStakeParryPendingHit();
    return;
  }
  updatePlayer(dt);
  enemyFreezeTimer = Math.max(0, enemyFreezeTimer - dt);
  updateMessageBottles(dt);
  updateEnemies(dt);
  updatePickups(dt);
  updateCrystalShards(dt);
  updateCrystalTrails(dt);
  updateCrystalShockwaves(dt);
  updateKonpeito(dt);
  updateLambdaSpecialKonpeitos(dt);
  updateLambdaSpecialShrapnel(dt);
  updateBeatrice(dt);
  if (startBeatriceBarrierTutorial()) {
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  updateBeatriceStakes(dt);
  updateBeatriceStakeParryLine(dt);
  if (maybeStartBeatriceStakeTutorial() || maybeStartBeatriceStakeParryPrompt()) {
    healthBar.style.width = `${player.hp}%`;
    updateResolveHud(dt);
    waveLabel.textContent = currentWaveLabel();
    scoreLabel.textContent = `Score ${score}`;
    updateResolveDuoOutline();
    return;
  }
  updateLambda(dt);
  updateBernReviveHazard(dt);
  updateBernkastel(dt);
  updateKonpeitoGeysers(dt);
  updateKonpeitoDomeBursts(dt);
  updateSummonPillars(dt);
  screenFlashTimer = Math.max(0, screenFlashTimer - dt);
  screenShakeTimer = Math.max(0, screenShakeTimer - dt);
  bernParryOverlayTimer = Math.max(0, bernParryOverlayTimer - dt);
  updateParticles(dt);
  messageTimer = Math.max(0, messageTimer - dt);
  healthBar.style.width = `${player.hp}%`;
  updateResolveHud(dt);
  waveLabel.textContent = currentWaveLabel();
  scoreLabel.textContent = `Score ${score}`;
  updateResolveDuoOutline();
  updateParryTipAlert();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#141a28");
  sky.addColorStop(0.52, "#252430");
  sky.addColorStop(1, "#111014");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-cameraX * 0.22, 0);
  for (let i = -2; i < 12; i++) {
    const x = i * 390;
    ctx.fillStyle = i % 2 ? "#262431" : "#1e2533";
    ctx.fillRect(x, 150, 260, 330);
    ctx.fillStyle = "rgba(247, 211, 116, 0.18)";
    for (let w = 0; w < 4; w++) {
      ctx.fillRect(x + 32 + w * 48, 188, 22, 168);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.55, 0);
  ctx.fillStyle = "#3b3034";
  for (let i = -1; i < 14; i++) {
    ctx.fillRect(i * 260, 424, 190, 48);
    ctx.fillRect(i * 260 + 70, 332, 36, 92);
  }
  ctx.restore();

  const floor = ctx.createLinearGradient(0, FLOOR_Y - 42, 0, H);
  floor.addColorStop(0, "#4b3940");
  floor.addColorStop(1, "#1b171a");
  ctx.fillStyle = floor;
  ctx.fillRect(0, FLOOR_Y - 30, W, H - FLOOR_Y + 30);

  ctx.strokeStyle = "rgba(255, 238, 190, 0.13)";
  ctx.lineWidth = 2;
  for (let i = -1; i < 18; i++) {
    const x = i * 128 - (cameraX % 128);
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_Y - 26);
    ctx.lineTo(x - 160, H);
    ctx.stroke();
  }
}

function drawSprite(actor, frameId, scale, enemy = false, action = "") {
  const img = images[frameId];
  if (!img) return;
  const bounds = frameBounds[frameId] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const offsetAction = baseAction(action);
  const offset = actionFrameOffsets[action]?.[frameId] || actionFrameOffsets[offsetAction]?.[frameId] || frameOffsets[frameId] || [0, 0];
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const drawX = (-img.width * 0.44 + bounds[0] + offset[0]) * scale;
  const drawY = -drawH + (18 + offset[1]) * scale;
  const x = Math.round(actor.x - cameraX);
  const y = Math.round(actor.y - (actor.z || 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-actor.facing, 1);
  if (enemy) {
    const spawning = actor.spawnGrace > 0;
    const telegraphing = (actor.attackTelegraph || 0) > 0;
    const tellPulse = Math.sin(performance.now() / 48) > 0;
    const alpha = spawning
      ? (Math.sin(performance.now() / 62) > 0 ? 0.28 : 0.76)
      : actor.hurt > 0 ? 0.78 : telegraphing && tellPulse ? 0.7 : 0.92;
    ctx.globalAlpha *= alpha;
    ctx.filter = actor.hurt > 0
      ? "sepia(1) saturate(4) hue-rotate(320deg) brightness(1.35)"
      : spawning
        ? "brightness(1.45) saturate(0.55) hue-rotate(135deg)"
        : telegraphing
          ? `grayscale(1) brightness(${tellPulse ? 1.05 : 0.78}) contrast(1.12) sepia(0.35) saturate(1.8) hue-rotate(310deg)`
          : "grayscale(1) brightness(0.74) contrast(1.06)";
  } else if (actor.invuln > 0) {
    ctx.globalAlpha = Math.sin(performance.now() / 45) > 0 ? 0.58 : 1;
  }
  ctx.drawImage(
    img,
    bounds[0],
    bounds[1],
    sourceW,
    sourceH,
    drawX,
    drawY,
    drawW,
    drawH
  );
  ctx.restore();
}

function drawActorShadow(actor, width = 88) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(actor.x - cameraX, actor.y + 18, width, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAbsorbingEnemy(enemy, frameId, action) {
  const img = images[frameId];
  if (!img) return;
  const t = clamp(enemy.duoAbsorb || 0, 0, 1);
  const bounds = frameBounds[frameId] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const offsetAction = baseAction(action);
  const offset = actionFrameOffsets[action]?.[frameId] || actionFrameOffsets[offsetAction]?.[frameId] || frameOffsets[frameId] || [0, 0];
  const wobble = Math.sin(t * Math.PI * 8 + (enemy.duoAbsorbSeed || 0)) * (1 - t) * 18;
  const startX = enemy.duoAbsorbStartX || enemy.x;
  const startY = enemy.duoAbsorbStartY || enemy.y;
  const startZ = enemy.duoAbsorbStartZ || 0;
  const screenX = startX + (duoAttack.singularityX - startX) * (t * 0.78) + wobble;
  const screenY = startY - startZ + (duoAttack.singularityY - (startY - startZ)) * (t * 0.9);
  const angle = Math.atan2(duoAttack.singularityY - screenY, duoAttack.singularityX - screenX);
  const scale = 1.24 * (1 - t * 0.62);
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;

  ctx.save();
  ctx.translate(screenX - cameraX, screenY);
  ctx.rotate(angle + Math.PI / 2);
  ctx.scale(0.62 - t * 0.46, 1 + t * 2.9);
  ctx.globalAlpha = 0.9 * (1 - t * 0.82);
  ctx.filter = `grayscale(${0.65 + t * 0.35}) brightness(${0.72 - t * 0.3})`;
  ctx.drawImage(
    img,
    bounds[0],
    bounds[1],
    sourceW,
    sourceH,
    (-img.width * 0.44 + bounds[0] + offset[0]) * scale,
    -drawH + (18 + offset[1]) * scale,
    drawW,
    drawH
  );
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(88, 236, 255, ${0.22 * (1 - t)})`;
  ctx.lineWidth = 2 + 8 * t;
  ctx.beginPath();
  ctx.moveTo(screenX - cameraX, screenY - 38 * scale);
  ctx.quadraticCurveTo((screenX + duoAttack.singularityX) * 0.5 - cameraX, screenY - 80 - 80 * t, duoAttack.singularityX - cameraX, duoAttack.singularityY);
  ctx.stroke();
  ctx.restore();
}

function drawBernHazardParryRings(x, y) {
  if (!BERN_HAZARD_PARRY_ENABLED || !bernCompanion.active) return;
  if (bernCompanion.state !== "hazardTeleportIn" && bernCompanion.state !== "hazardCharge") return;
  const failed = Boolean(bernCompanion.parryFailed);
  const failFade = failed ? clamp((bernCompanion.parryFailFade || 0) / BERN_HAZARD_PARRY_FAIL_FADE, 0, 1) : 1;
  if (failed && failFade <= 0) return;
  const timingRadius = bernHazardParryRingRadius();
  const ready = !failed && bernHazardParryReady();
  const pulse = pulseValue(14);
  ctx.save();
  ctx.globalAlpha = failFade;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 3;
  ctx.strokeStyle = failed ? "rgba(175, 175, 175, 0.62)" : ready ? `rgba(255, 255, 255, ${0.9 + pulse * 0.1})` : "rgba(82, 239, 255, 0.72)";
  ctx.beginPath();
  ctx.arc(x, y - 72, BERN_HAZARD_PARRY_RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = ready ? 5 : 4;
  ctx.strokeStyle = failed ? "rgba(92, 92, 92, 0.72)" : ready ? `rgba(255, 238, 104, ${0.9 + pulse * 0.1})` : "rgba(139, 102, 255, 0.76)";
  ctx.beginPath();
  ctx.arc(x, y - 72, timingRadius, 0, Math.PI * 2);
  ctx.stroke();
  if (failed) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(210, 210, 210, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 32, y - 104);
    ctx.lineTo(x + 32, y - 40);
    ctx.moveTo(x + 32, y - 104);
    ctx.lineTo(x - 32, y - 40);
    ctx.stroke();
  } else if (ready) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(x, y - 72, BERN_HAZARD_PARRY_RING_RADIUS + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeatriceMeleeKickParryRings(x, y) {
  const failed = Boolean(beatriceBoss.meleeKickParryFailed);
  const failFade = failed ? clamp((beatriceBoss.meleeKickParryFailFade || 0) / BEATRICE_MELEE_KICK_PARRY_FAIL_FADE, 0, 1) : 1;
  if (!failed && !beatriceMeleeKickParryIndicatorActive()) return;
  if (failed && failFade <= 0) return;
  const timingRadius = beatriceMeleeKickParryRingRadius();
  const ready = !failed && beatriceMeleeKickParryReady();
  const alpha = beatriceBoss.materializeTimer > 0 ? 0.35 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * failFade;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 3;
  ctx.strokeStyle = failed ? "rgba(176, 176, 176, 0.64)" : ready ? "rgba(255, 235, 92, 0.95)" : "rgba(255, 255, 255, 0.76)";
  ctx.beginPath();
  ctx.arc(x, y - 74, BEATRICE_MELEE_KICK_PARRY_RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = failed ? "rgba(92, 92, 92, 0.72)" : ready ? "rgba(255, 219, 65, 0.95)" : "rgba(255, 40, 58, 0.82)";
  ctx.lineWidth = ready ? 5 : 4;
  ctx.beginPath();
  ctx.arc(x, y - 74, timingRadius, 0, Math.PI * 2);
  ctx.stroke();
  if (failed) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(218, 218, 218, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 36, y - 110);
    ctx.lineTo(x + 36, y - 38);
    ctx.moveTo(x + 36, y - 110);
    ctx.lineTo(x - 36, y - 38);
    ctx.stroke();
  } else if (ready) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255, 244, 154, 0.72)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y - 74, BEATRICE_MELEE_KICK_PARRY_RING_RADIUS + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeatriceMeleeKickTelegraph() {
  if (!beatriceBoss.active || beatriceBoss.flavor !== "meleeKick" || beatriceBoss.meleeKickParried) return;
  const frame = beatriceMeleeKickFrame();
  const failFade = beatriceBoss.meleeKickParryFailed
    ? clamp((beatriceBoss.meleeKickParryFailFade || 0) / BEATRICE_MELEE_KICK_PARRY_FAIL_FADE, 0, 1)
    : 1;
  if (beatriceBoss.meleeKickParryFailed && failFade <= 0) return;
  if (!beatriceBoss.meleeKickParryFailed && frame > 273) return;
  const zone = beatriceMeleeKickTelegraph();
  const x = zone.x - cameraX;
  const y = zone.y;
  const activeT = beatriceBoss.meleeKickParryFailed
    ? 1
    : clamp(beatriceBoss.anim / Math.max(1, beatriceFrames.meleeKick.indexOf(273)), 0, 1);
  const facing = beatriceBoss.facing || 1;
  const playerInside = playerInBeatriceMeleeKickTelegraph();
  const pulse = pulseValue(12);
  ctx.save();
  ctx.globalAlpha = failFade;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = beatriceBoss.meleeKickParryFailed ? "rgba(84, 84, 84, 0.24)" : "rgba(78, 0, 14, 0.28)";
  ctx.strokeStyle = beatriceBoss.meleeKickParryFailed
    ? "rgba(174, 174, 174, 0.54)"
    : playerInside
      ? `rgba(255, 222, 83, ${0.58 + pulse * 0.24})`
      : `rgba(255, 48, 68, ${0.5 + pulse * 0.18})`;
  ctx.lineWidth = playerInside ? 4 : 2.5;
  ctx.fillRect(x, y, zone.w, zone.h);
  ctx.strokeRect(x, y, zone.w, zone.h);
  ctx.fillStyle = beatriceBoss.meleeKickParryFailed
    ? "rgba(150, 150, 150, 0.16)"
    : `rgba(255, 70, 74, ${0.1 + activeT * 0.38})`;
  if (facing < 0) {
    ctx.fillRect(x + zone.w * (1 - activeT), y, zone.w * activeT, zone.h);
  } else {
    ctx.fillRect(x, y, zone.w * activeT, zone.h);
  }
  if (playerInside && !beatriceBoss.meleeKickParryFailed) {
    ctx.strokeStyle = "rgba(255, 244, 155, 0.42)";
    ctx.lineWidth = 8;
    ctx.strokeRect(x - 3, y - 3, zone.w + 6, zone.h + 6);
  }
  ctx.restore();
}

function drawGoatPoundParryRings(enemy, fade = 1) {
  if (enemy.goatAction !== "pound" || enemy.goatHasHit || enemy.dead || enemy.spawnGrace > 0) return;
  const failed = Boolean(enemy.goatParryFailed);
  const failFade = failed ? clamp((enemy.goatParryFailFade || 0) / GOAT_POUND_PARRY_FAIL_FADE, 0, 1) : 1;
  if (failed && failFade <= 0) return;
  const x = enemy.x - cameraX + enemy.facing * 28;
  const y = enemy.y - 178;
  const timingRadius = goatPoundParryRingRadius(enemy);
  const ready = !failed && goatPoundParryTimingReady(enemy);
  const pulse = pulseValue(15);
  ctx.save();
  ctx.globalAlpha = fade * failFade;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = ready ? 5 : 3;
  ctx.strokeStyle = failed ? "rgba(175, 175, 175, 0.62)" : ready ? `rgba(255, 232, 74, ${0.88 + pulse * 0.12})` : "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.arc(x, y, GOAT_POUND_PARRY_RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = ready ? 6 : 4;
  ctx.strokeStyle = failed ? "rgba(92, 92, 92, 0.72)" : ready ? `rgba(255, 214, 45, ${0.9 + pulse * 0.1})` : "rgba(255, 44, 44, 0.78)";
  ctx.beginPath();
  ctx.arc(x, y, timingRadius, 0, Math.PI * 2);
  ctx.stroke();
  if (failed) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(210, 210, 210, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 32, y - 32);
    ctx.lineTo(x + 32, y + 32);
    ctx.moveTo(x + 32, y - 32);
    ctx.lineTo(x - 32, y + 32);
    ctx.stroke();
  } else if (ready) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x, y, GOAT_POUND_PARRY_RING_RADIUS + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function pulseValue(speed = 7) {
  return 0.5 + Math.sin(performance.now() / 1000 * speed) * 0.5;
}

function drawSpecialWindupGlow() {
  if (player.action !== "special") return;
  const pulse = pulseValue(9);
  const list = frames.special;
  const frame = list[Math.floor(player.anim) % list.length];
  const echo = {
    ...player,
    invuln: 0,
    x: player.x - player.facing * (5 + pulse * 7),
    y: player.y
  };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.28 + pulse * 0.18;
  ctx.filter = "brightness(0) saturate(100%) invert(77%) sepia(85%) saturate(1145%) hue-rotate(135deg) brightness(110%) contrast(106%)";
  drawSprite(echo, frame, PLAYER_SCALE * (1.025 + pulse * 0.018), false, "special");
  ctx.globalAlpha = 0.16 + pulse * 0.1;
  drawSprite({ ...echo, x: echo.x - player.facing * 8 }, frame, PLAYER_SCALE * (1.05 + pulse * 0.025), false, "special");
  ctx.restore();
}

function drawGoatChargeTelegraph(enemy, fade = 1) {
  if (enemy.goatAction !== "chargeWindup" || enemy.dead || enemy.spawnGrace > 0) return;
  const chargeT = clamp(enemy.anim / Math.max(1, goatFrames.chargeWindup.length), 0, 1);
  const startX = enemy.x - cameraX + enemy.facing * 42;
  const startY = enemy.y;
  const dirX = enemy.goatChargeDx || enemy.facing;
  const dirY = enemy.goatChargeDy || 0;
  const endX = startX + dirX * GOAT_CHARGE_DISTANCE;
  const endY = startY + dirY * GOAT_CHARGE_DISTANCE;
  const fillX = startX + dirX * GOAT_CHARGE_DISTANCE * chargeT;
  const fillY = startY + dirY * GOAT_CHARGE_DISTANCE * chargeT;
  const nx = -dirY * GOAT_CHARGE_WIDTH * 0.5;
  const ny = dirX * GOAT_CHARGE_WIDTH * 0.5;
  const pulse = 0.5 + Math.sin(performance.now() / 78) * 0.5;

  const drawPath = (toX, toY) => {
    ctx.beginPath();
    ctx.moveTo(startX + nx, startY + ny);
    ctx.lineTo(toX + nx, toY + ny);
    ctx.lineTo(toX - nx, toY - ny);
    ctx.lineTo(startX - nx, startY - ny);
    ctx.closePath();
  };

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(72, 5, 9, 0.5)";
  ctx.strokeStyle = `rgba(255, 70, 58, ${0.5 + pulse * 0.22})`;
  ctx.lineWidth = 2;
  drawPath(endX, endY);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 86, 76, ${0.18 + chargeT * 0.44})`;
  drawPath(fillX, fillY);
  ctx.fill();
  ctx.restore();
}

function drawBattlerEnemyAttackTelegraph(enemy, fade = 1) {
  if (!enemy || enemy.type === "goat" || enemy.dead || enemy.spawnGrace > 0 || enemy.attack <= 0 || (enemy.attackTelegraph || 0) <= 0) return;
  const t = 1 - clamp(enemy.attackTelegraph / ENEMY_ATTACK_TELEGRAPH_TIME, 0, 1);
  const pulse = 0.5 + Math.sin(performance.now() / 62) * 0.5;
  const alpha = fade * (0.28 + t * 0.24 + pulse * 0.1);
  const baseX = enemy.x - cameraX + enemy.facing * 38;
  const baseY = enemy.y;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(82, 6, 12, 0.42)";
  ctx.strokeStyle = `rgba(255, 78, 70, ${0.56 + pulse * 0.22})`;
  ctx.lineWidth = 2;
  ctx.translate(baseX, baseY);
  ctx.scale(enemy.facing, 1);

  if (enemy.attackKind === "kick") {
    const r = ENEMY_KICK_TELEGRAPH_RADIUS;
    ctx.beginPath();
    ctx.moveTo(0, -r * ENEMY_KICK_TELEGRAPH_Y_SCALE);
    ctx.ellipse(0, 0, r, r * ENEMY_KICK_TELEGRAPH_Y_SCALE, 0, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 88, 72, ${0.12 + t * 0.28})`;
    ctx.beginPath();
    ctx.moveTo(0, -r * ENEMY_KICK_TELEGRAPH_Y_SCALE * t);
    ctx.ellipse(0, 0, r * t, r * ENEMY_KICK_TELEGRAPH_Y_SCALE * t, 0, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    const range = ENEMY_PUNCH_TELEGRAPH_RANGE;
    const depth = ENEMY_PUNCH_TELEGRAPH_DEPTH;
    ctx.fillRect(0, -depth, range, depth * 2);
    ctx.strokeRect(0, -depth, range, depth * 2);
    ctx.fillStyle = `rgba(255, 88, 72, ${0.1 + t * 0.26})`;
    ctx.fillRect(0, -depth, range * t, depth * 2);
  }
  ctx.restore();
}

function drawEnemy(enemy) {
  if (enemy.type === "goat") {
    drawGoatEnemy(enemy);
    return;
  }
  const walkFrame = frames.walk[Math.floor(enemy.anim) % frames.walk.length];
  const attackFrame = frames[enemy.attackKind]?.[Math.floor(enemy.anim) % frames[enemy.attackKind].length] || walkFrame;
  const hurtFrame = frames.hurt[Math.floor(enemy.anim) % frames.hurt.length];
  const downFrame = frames.down[Math.min(frames.down.length - 1, Math.floor(enemy.anim))];
  const isDown = enemy.dead || enemy.knockedDown;
  const frame = enemy.airborne ? launchFrame(enemy) : isDown ? downFrame : enemy.attack > 0 ? attackFrame : enemy.hurt > 0 ? hurtFrame : walkFrame;
  const action = enemy.airborne || isDown ? "down" : enemy.attack > 0 ? enemy.attackKind : enemy.hurt > 0 ? "hurt" : "walk";
  if (enemy.duoAbsorb > 0 && duoAttack.active) {
    drawAbsorbingEnemy(enemy, frame, action);
    return;
  }
  const fade = enemy.dead ? clamp(enemy.fall / ENEMY_DEFEAT_FADE_DURATION, 0, 1) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  drawBattlerEnemyAttackTelegraph(enemy, fade);
  drawActorShadow(enemy, 66);
  drawSprite(enemy, frame, 1.24, true, action);
  ctx.restore();
  if (!enemy.dead && !enemy.knockedDown) {
    const lift = enemy.z || 0;
    ctx.fillStyle = "#1f1518";
    ctx.fillRect(enemy.x - cameraX - 36, enemy.y - lift - 152, 72, 7);
    ctx.fillStyle = "#d84a42";
    ctx.fillRect(enemy.x - cameraX - 36, enemy.y - lift - 152, 72 * clamp(enemy.hp / enemy.maxHp, 0, 1), 7);
  }
}

function drawGoatEnemy(enemy) {
  const airborneUp = enemy.airborne && enemy.vz > 0;
  const airborneDown = enemy.airborne && enemy.vz <= 0;
  const groundedDown = enemy.knockedDown && !enemy.airborne;
  const showingHurt = (enemy.hurt > 0 || airborneUp) && enemy.goatAction !== "pound" && enemy.goatAction !== "recover";
  const list = enemy.dead || airborneDown || groundedDown
    ? goatFrames.defeat
    : showingHurt
      ? goatFrames.hurt
      : enemy.goatAction === "pound"
        ? goatFrames.pound
        : enemy.goatAction === "recover"
          ? goatFrames.recover
          : enemy.goatAction === "chargeWindup"
            ? goatFrames.chargeWindup
            : enemy.goatAction === "charge"
              ? goatFrames.charge
              : enemy.goatAction === "chargeRecover"
                ? goatFrames.chargeRecover
                : goatFrames.idle;
  const frame = airborneDown
    ? goatFrames.defeat[0]
    : groundedDown && !enemy.dead
      ? goatFrames.defeat[1]
    : enemy.dead || groundedDown
      ? list[Math.min(list.length - 1, Math.floor(enemy.anim))]
      : showingHurt
        ? list[Math.min(list.length - 1, Math.floor(airborneUp ? enemy.anim : enemy.goatHurtAnim))]
        : enemy.goatAction === "pound" || enemy.goatAction === "recover" || enemy.goatAction === "chargeWindup" || enemy.goatAction === "chargeRecover"
          ? list[Math.min(list.length - 1, Math.floor(enemy.anim))]
          : enemy.goatAction === "charge"
            ? list[Math.floor(enemy.anim) % list.length]
          : list[Math.floor(enemy.anim) % list.length];
  const img = goatImages[frame];
  if (!img) return;
  const bounds = goatFrameBounds[frame] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const fade = enemy.dead ? clamp(enemy.fall / ENEMY_DEFEAT_FADE_DURATION, 0, 1) : 1;
  const lift = enemy.z || 0;
  const flipDownFrame = airborneDown || groundedDown || enemy.dead;
  const x = Math.round(enemy.x - cameraX);
  const y = Math.round(enemy.y - lift);
  const scale = 1.22;
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const groundedDownOffset = groundedDown && !enemy.dead ? 78 : 0;
  const idleAnchorOffset = list === goatFrames.idle && goatIdleFrameAnchors[frame]
    ? goatIdleFrameAnchors[frame]
    : { x: 0, y: 0 };
  drawGoatPoundTelegraph(enemy, fade);
  drawGoatChargeTelegraph(enemy, fade);
  drawGoatPoundParryRings(enemy, fade);
  ctx.save();
  ctx.globalAlpha = fade;
  drawActorShadow(enemy, 82);
  ctx.translate(x, y);
  ctx.scale((flipDownFrame ? 1 : -1) * enemy.facing, 1);
  const spawning = enemy.spawnGrace > 0;
  const armorFlash = (enemy.goatArmorFlash || 0) > 0;
  if (spawning) {
    ctx.globalAlpha *= Math.sin(performance.now() / 62) > 0 ? 0.3 : 0.76;
    ctx.filter = "brightness(1.35) saturate(0.65) hue-rotate(135deg)";
  } else if (enemy.hurt > 0 || armorFlash) {
    ctx.globalAlpha *= armorFlash && Math.sin(performance.now() / 45) > 0 ? 0.72 : 0.9;
    ctx.filter = "sepia(1) saturate(4) hue-rotate(320deg) brightness(1.35)";
  } else if (enemy.dead) {
    const deathT = 1 - clamp(enemy.fall / GOAT_DEFEAT_FADE_DURATION, 0, 1);
    ctx.globalAlpha *= 1 - deathT * 0.72;
    ctx.filter = `grayscale(1) brightness(${0.85 - deathT * 0.85}) contrast(${1 + deathT * 0.8})`;
  }
  ctx.drawImage(
    img,
    bounds[0],
    bounds[1],
    sourceW,
    sourceH,
    -drawW * 0.5 + idleAnchorOffset.x,
    -drawH + 16 + groundedDownOffset + idleAnchorOffset.y,
    drawW,
    drawH
  );
  ctx.restore();
  if (!enemy.dead && !enemy.knockedDown) {
    ctx.fillStyle = "#1f1518";
    ctx.fillRect(enemy.x - cameraX - 48, enemy.y - lift - 320, 96, 8);
    ctx.fillStyle = "#d84a42";
    ctx.fillRect(enemy.x - cameraX - 48, enemy.y - lift - 320, 96 * clamp(enemy.hp / enemy.maxHp, 0, 1), 8);
  }
}

function drawGoatPoundTelegraph(enemy, fade = 1) {
  if (enemy.goatAction !== "pound" || enemy.goatHasHit || enemy.dead || enemy.spawnGrace > 0) return;
  const impactFrameIndex = goatFrames.pound.findIndex((frame) => frame >= 684);
  const chargeT = clamp(enemy.anim / Math.max(1, impactFrameIndex), 0, 1);
  const startX = enemy.x - cameraX + enemy.facing * 46;
  const y = enemy.y;
  const radiusY = GOAT_POUND_RANGE * GOAT_POUND_SEMICIRCLE_Y_SCALE;
  const fillRadius = GOAT_POUND_RANGE * chargeT;
  const fillRadiusY = fillRadius * GOAT_POUND_SEMICIRCLE_Y_SCALE;
  const pulse = 0.5 + Math.sin(performance.now() / 80) * 0.5;

  const drawSemicirclePath = (radius, yRadius) => {
    ctx.beginPath();
    if (enemy.facing === 1) {
      ctx.moveTo(startX, y - yRadius);
      ctx.ellipse(startX, y, radius, yRadius, 0, -Math.PI / 2, Math.PI / 2, false);
    } else {
      ctx.moveTo(startX, y + yRadius);
      ctx.ellipse(startX, y, radius, yRadius, 0, Math.PI / 2, Math.PI * 1.5, false);
    }
    ctx.closePath();
  };

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(70, 0, 0, 0.5)";
  ctx.strokeStyle = `rgba(255, 76, 76, ${0.48 + pulse * 0.22})`;
  ctx.lineWidth = 2;
  drawSemicirclePath(GOAT_POUND_RANGE, radiusY);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 77, 68, ${0.22 + chargeT * 0.42})`;
  drawSemicirclePath(fillRadius, fillRadiusY);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = `rgba(255, 205, 190, ${0.1 + chargeT * 0.22})`;
  const fillX = enemy.facing === 1 ? startX : startX - fillRadius;
  ctx.fillRect(fillX, y - fillRadiusY * 0.18, fillRadius, Math.max(4, fillRadiusY * 0.36));
  ctx.restore();
  ctx.restore();
}

function drawBeatriceBossWalls() {
  if (!beatriceBoss.active || !beatriceBoss.wallsActive) return;
  const pulse = pulseValue(10);
  const drawWall = (y) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(118, 0, 18, ${0.34 + pulse * 0.12})`;
    ctx.strokeStyle = `rgba(255, 45, 72, ${0.72 + pulse * 0.2})`;
    ctx.lineWidth = 3 + pulse * 2;
    ctx.fillRect(0, y - 8, W, 16);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 210, 210, ${0.22 + pulse * 0.16})`;
    ctx.lineWidth = 1.5;
    for (let x = -40; x < W + 70; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x + pulse * 14, y - 8);
      ctx.lineTo(x + 38 + pulse * 14, y + 8);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawWall(beatriceBoss.wallTop);
  drawWall(beatriceBoss.wallBottom);
}

function drawBeatriceGoatTrialObjective() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "goatTrial") return;
  const text = "Defeat or Parry Goat-kun";
  const pulse = pulseValue(9);
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 25px Segoe UI, Arial";
  const w = clamp(ctx.measureText(text).width + 54, 260, W - 140);
  const x = W / 2 - w / 2;
  const y = 138;
  ctx.fillStyle = "rgba(9, 0, 7, 0.54)";
  ctx.fillRect(x, y, w, 46);
  ctx.strokeStyle = `rgba(255, 58, 94, ${0.62 + pulse * 0.28})`;
  ctx.lineWidth = 2.5 + pulse * 1.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, 42);
  ctx.fillStyle = "#ffe9ed";
  ctx.shadowColor = "rgba(255, 46, 91, 0.75)";
  ctx.shadowBlur = 12 + pulse * 10;
  ctx.fillText(text, W / 2, y + 31);
  ctx.restore();
}

function drawBeatriceRingTelegraphs() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "ringAttack") return;
  const pulse = pulseValue(12);
  for (const ring of beatriceBoss.rings) {
    if (ring.timer < ring.appearAt || ring.detonated) continue;
    const visibleT = clamp((ring.timer - ring.appearAt) / Math.max(0.001, ring.detonateAt - ring.appearAt), 0, 1);
    const x = ring.x - cameraX;
    const y = ring.y;
    const radiusY = ring.radius * 0.42;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(84, 0, 12, 0.22)";
    ctx.strokeStyle = `rgba(255, 42, 62, ${0.6 + pulse * 0.18})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, ring.radius, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 69, 72, ${0.12 + visibleT * 0.42})`;
    ctx.beginPath();
    ctx.ellipse(x, y, ring.radius * visibleT, radiusY * visibleT, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 218, 218, ${0.18 + visibleT * 0.42})`;
    ctx.lineWidth = 1.5 + visibleT * 2;
    ctx.beginPath();
    ctx.ellipse(x, y, ring.radius * (0.72 + visibleT * 0.28), radiusY * (0.72 + visibleT * 0.28), 0, 0, Math.PI * 2);
    ctx.stroke();
    if (ring.radius <= 28) {
      ctx.fillStyle = `rgba(255, 235, 235, ${0.18 + visibleT * 0.48})`;
      ctx.beginPath();
      ctx.ellipse(x, y, ring.radius * visibleT, radiusY * visibleT, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBeatriceGoatRushTelegraphs() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "goatRush") return;
  const pulse = pulseValue(13);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const lane of beatriceBoss.goatRushTelegraphs) {
    if (lane.spawned) continue;
    const chargeT = clamp((beatriceBoss.goatRushTimer - lane.startAt) / BEATRICE_GOAT_RUSH_TELEGRAPH_TIME, 0, 1);
    if (chargeT <= 0) continue;
    const y = lane.y - GOAT_CHARGE_WIDTH * 0.5;
    const h = GOAT_CHARGE_WIDTH;
    const fullX = -20;
    const fullW = W + 40;
    const fillW = fullW * chargeT;
    const fillX = lane.direction === 1 ? fullX : fullX + fullW - fillW;
    ctx.fillStyle = "rgba(74, 5, 12, 0.48)";
    ctx.strokeStyle = `rgba(255, 58, 54, ${0.52 + pulse * 0.24})`;
    ctx.lineWidth = 2;
    ctx.fillRect(fullX, y, fullW, h);
    ctx.strokeRect(fullX, y, fullW, h);
    ctx.fillStyle = `rgba(255, 84, 76, ${0.16 + chargeT * 0.46})`;
    ctx.fillRect(fillX, y, fillW, h);
    ctx.strokeStyle = `rgba(255, 228, 214, ${0.22 + chargeT * 0.48})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fillX, y + h * 0.5);
    ctx.lineTo(fillX + fillW, y + h * 0.5);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 225, 205, ${0.22 + chargeT * 0.38})`;
    const arrowX = lane.direction === 1 ? fullX + 18 : fullX + fullW - 18;
    const arrowDir = lane.direction;
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowDir * 18, y + h * 0.5);
    ctx.lineTo(arrowX - arrowDir * 10, y + h * 0.22);
    ctx.lineTo(arrowX - arrowDir * 10, y + h * 0.78);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBeatriceTowerVolleyTelegraphs() {
  if (!beatriceBoss.active || beatriceBoss.mechanic !== "towerVolley" || !beatriceTowerVolley.active) return;
  const volley = beatriceTowerVolley;
  const pulse = pulseValue(14);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const point of volley.points) {
    if (point.struck) continue;
    const pointT = clamp((volley.timer - point.delay + BEATRICE_TOWER_VOLLEY_TELEGRAPH_TIME) / BEATRICE_TOWER_VOLLEY_TELEGRAPH_TIME, 0, 1);
    if (pointT <= 0) continue;
    const x = point.x - cameraX;
    const y = point.y;
    const radius = BEATRICE_TOWER_VOLLEY_RADIUS;
    ctx.fillStyle = "rgba(70, 0, 14, 0.24)";
    ctx.strokeStyle = `rgba(255, 40, 58, ${0.42 + pulse * 0.16})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 70, 70, ${0.1 + pointT * 0.28})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * pointT, radius * 0.45 * pointT, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBeatriceTowerVolleyMissiles() {
  if (!beatriceTowerVolley.active) return;
  const volley = beatriceTowerVolley;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const missile of volley.missiles) {
    const t = clamp(missile.life / missile.max, 0, 1);
    const opacity = clamp(t * 3.2, 0, 1);
    const trail = missile.trail || [];
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const ageT = i / Math.max(1, trail.length - 1);
      ctx.strokeStyle = `rgba(255, 20, 42, ${(0.14 + ageT * 0.68) * opacity})`;
      ctx.lineWidth = (2.2 + ageT * 7.4) * opacity;
      ctx.beginPath();
      ctx.moveTo(a.x - cameraX, a.y);
      ctx.lineTo(b.x - cameraX, b.y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 226, 205, ${(0.08 + ageT * 0.44) * opacity})`;
      ctx.lineWidth = (0.9 + ageT * 2.1) * opacity;
      ctx.beginPath();
      ctx.moveTo(a.x - cameraX, a.y);
      ctx.lineTo(b.x - cameraX, b.y);
      ctx.stroke();
    }
    const head = trail[trail.length - 1];
    if (head) {
      ctx.fillStyle = `rgba(255, 232, 205, ${0.24 + opacity * 0.72})`;
      ctx.beginPath();
      ctx.ellipse(head.x - cameraX, head.y, 5.8 * opacity, 5.8 * opacity, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBeatriceTowerVolleys() {
  if (!beatriceTowerVolley.active) return;
  const img = effectImages.beatriceTowers;
  const volley = beatriceTowerVolley;
  if (!img) return;
  const sw = img.width / 2;
  const sh = img.height;
  const sx = sw;
  const drawH = sh * BEATRICE_TOWER_VOLLEY_TOWER_SCALE;
  const drawW = sw * BEATRICE_TOWER_VOLLEY_TOWER_SCALE;
  const firing = volley.phase === "fire";
  const pulse = pulseValue(18);
  for (const tower of volley.towers) {
    const rise = clamp((tower.emerge || 0) * (1 - (tower.retreat || 0)), 0, 1);
    if (rise <= 0) continue;
    const shakePower = (volley.phase === "emerge" || volley.phase === "retreat") ? 5 : 1.8;
    const shake = Math.sin(performance.now() / 30 + tower.seed) * shakePower;
    const x = tower.screenX - drawW / 2 + shake;
    const baseY = tower.y + Math.cos(performance.now() / 38 + tower.seed) * (shakePower * 0.35);
    const y = baseY - drawH * rise;
    ctx.save();
    if (firing && tower.wave === volley.wave) {
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowBlur = 24 + pulse * 18;
      ctx.shadowColor = "rgba(255, 18, 42, 0.92)";
      ctx.globalAlpha = 0.45 + pulse * 0.25;
      ctx.fillStyle = "rgba(255, 0, 34, 0.34)";
      ctx.beginPath();
      ctx.ellipse(tower.screenX, baseY - drawH * 0.48 * rise, drawW * 0.62, drawH * 0.42 * rise, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, sx, 0, sw, sh, x, y, drawW, drawH);
    ctx.restore();
  }
}

function drawPlayer() {
  drawActorShadow(player, 78);
  const frame = player.airborne ? launchFrame(player) : currentPlayerActionFrame();
  const charge = attackChargeProgress();
  if (charge > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 55);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (0.1 + charge * 0.34) * (0.78 + pulse * 0.22);
    ctx.filter = "brightness(0) invert(1)";
    drawSprite(player, frame, PLAYER_SCALE * (1.02 + charge * 0.08), false, player.airborne ? "down" : player.action);
    if (charge > 0.72) {
      ctx.globalAlpha = (charge - 0.72) * 0.95;
      drawSprite(player, frame, PLAYER_SCALE * (1.09 + charge * 0.06), false, player.airborne ? "down" : player.action);
    }
    ctx.restore();
  }
  if (player.konpeitoGlowPending || player.konpeitoGlowTimer > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 85);
    const alpha = player.konpeitoGlowPending ? 0.32 + pulse * 0.18 : (0.18 + pulse * 0.2) * clamp(player.konpeitoGlowTimer / 1, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.filter = "brightness(0) saturate(100%) invert(62%) sepia(85%) saturate(1740%) hue-rotate(285deg) brightness(116%) contrast(108%)";
    drawSprite(player, frame, PLAYER_SCALE * (1.035 + pulse * 0.02), false, player.airborne ? "down" : player.action);
    ctx.globalAlpha = alpha * 0.5;
    drawSprite({ ...player, x: player.x - player.facing * 5 }, frame, PLAYER_SCALE * (1.06 + pulse * 0.02), false, player.airborne ? "down" : player.action);
    ctx.restore();
  }
  drawSprite(player, frame, PLAYER_SCALE, false, player.airborne ? "down" : player.action);
}

function drawLambda() {
  if (!lambdaCompanion.active) return;
  drawActorShadow(lambdaCompanion, 60);
  const list = lambdaFrames[lambdaCompanion.state] || lambdaFrames.idle;
  let frame;
  if (lambdaCompanion.state === "gameOver") {
    const intro = lambdaFrames.gameOver;
    const loop = lambdaFrames.gameOverLoop;
    const index = Math.floor(lambdaCompanion.anim);
    frame = index < intro.length ? intro[index] : loop[(index - intro.length) % loop.length];
  } else if (lambdaCompanion.state === "laugh") {
    const intro = lambdaFrames.laugh;
    const loop = lambdaFrames.laughLoop;
    const index = Math.floor(lambdaCompanion.anim);
    frame = index < intro.length ? intro[index] : loop[(index - intro.length) % loop.length];
  } else if (lambdaCompanion.state === "konpeitoKnockdown") {
    frame = lambdaFrames.konpeitoKnockdown[Math.min(lambdaFrames.konpeitoKnockdown.length - 1, Math.floor(lambdaCompanion.anim))];
  } else if (lambdaCompanion.state === "duoAttack") {
    const intro = lambdaFrames.duoAttack;
    const loop = lambdaFrames.duoAttackLoop;
    const index = Math.floor(lambdaCompanion.anim);
    frame = index < intro.length ? intro[index] : loop[(index - intro.length) % loop.length];
  } else if (lambdaCompanion.state === "move") {
    if (lambdaCompanion.anim < 1) {
      frame = lambdaFrames.moveWindup[0];
    } else if (lambdaCompanion.anim < 1 + lambdaFrames.moveIntro.length) {
      const introIndex = Math.floor(lambdaCompanion.anim - 1);
      frame = lambdaFrames.moveIntro[introIndex];
    } else {
      const moveIndex = Math.floor(lambdaCompanion.anim - 1 - lambdaFrames.moveIntro.length) % lambdaFrames.move.length;
      frame = lambdaFrames.move[moveIndex];
    }
  } else {
    frame = list[Math.min(list.length - 1, Math.floor(lambdaCompanion.anim) % list.length)];
  }
  const img = lambdaImages[frame];
  if (!img) return;
  const bounds = lambdaFrameBounds[frame] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const scale = 1.18;
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const drawX = lambdaCompanion.state === "duoAttack"
    ? -(lambdaDuoBodyAnchors[frame] ?? sourceW * 0.5) * scale
    : lambdaCompanion.state === "konpeitoKnockdown" && lambdaKnockdownAnchors[frame]
    ? -(lambdaKnockdownAnchors[frame].x - bounds[0]) * scale
    : lambdaCompanion.state === "gameOver" || lambdaCompanion.state === "laugh"
    ? -(lambdaFootAnchors[frame] ?? sourceW * 0.5) * scale
    : lambdaCompanion.state === "konpeitoCast" && lambdaKonpeitoAnchors[frame]
    ? -(lambdaKonpeitoAnchors[frame].x - bounds[0]) * scale
    : -drawW * 0.5;
  const drawY = lambdaCompanion.state === "duoAttack" && lambdaDuoVerticalAnchors[frame] !== undefined
    ? -lambdaDuoVerticalAnchors[frame] * scale
    : lambdaCompanion.state === "konpeitoKnockdown" && lambdaKnockdownAnchors[frame]
    ? -(lambdaKnockdownAnchors[frame].y - bounds[1]) * scale + 18 * scale
    : lambdaCompanion.state === "konpeitoCast" && lambdaKonpeitoAnchors[frame]
    ? -(lambdaKonpeitoAnchors[frame].y - bounds[1]) * scale + 18 * scale
    : -drawH + 18 * scale;
  const x = Math.round(lambdaCompanion.x - cameraX);
  const y = Math.round(lambdaCompanion.y);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-lambdaCompanion.facing, 1);
  ctx.drawImage(
    img,
    bounds[0],
    bounds[1],
    sourceW,
    sourceH,
    drawX,
    drawY,
    drawW,
    drawH
  );
  ctx.restore();
}

function drawBernCatForm(x, footY, alpha = 1, blackFade = 0) {
  const sheet = effectImages.bernCat;
  if (!sheet || !BERN_CAT_WALK_FRAMES.length) return;
  const frameIndex = bernCompanion.state === "idle" || bernCompanion.state === "catFadeIn" || bernCompanion.state === "catFadeOut"
    ? 0
    : Math.floor(bernCompanion.anim) % BERN_CAT_WALK_FRAMES.length;
  const sheetIndex = BERN_CAT_WALK_FRAMES[frameIndex];
  const cellX = (sheetIndex % BERN_CAT_SHEET_COLS) * BERN_CAT_SHEET_CELL;
  const cellY = Math.floor(sheetIndex / BERN_CAT_SHEET_COLS) * BERN_CAT_SHEET_CELL;
  const bounds = bernCatFrameBounds[frameIndex] || [cellX, cellY, BERN_CAT_SHEET_CELL, BERN_CAT_SHEET_CELL];
  const sourceX = bounds[0];
  const sourceY = bounds[1];
  const sourceW = bounds[2];
  const sourceH = bounds[3];
  const scale = 0.92;
  const anchor = bernCatFrameAnchors[frameIndex] || { x: sourceW * 0.5, y: sourceH };
  const drawX = -anchor.x * scale;
  const drawY = -anchor.y * scale + 10;

  ctx.save();
  ctx.translate(x, footY);
  ctx.scale(-bernCompanion.facing, 1);
  ctx.globalAlpha = alpha;
  if (blackFade > 0) ctx.filter = `brightness(${1 - blackFade}) saturate(${1 - blackFade * 0.9})`;
  ctx.drawImage(sheet, sourceX, sourceY, sourceW, sourceH, drawX, drawY, sourceW * scale, sourceH * scale);
  ctx.restore();
}

function drawBernkastel() {
  if (!bernCompanion.active) return;
  if (bernCompanion.state !== "hazardParried") drawActorShadow(bernCompanion, 31);
  if (bernCompanion.catForm && (bernCompanion.state === "idle" || bernCompanion.state === "move" || bernCompanion.state === "moveBack" || bernCompanion.state === "catFadeIn" || bernCompanion.state === "catFadeOut")) {
    const x = Math.round(bernCompanion.x - cameraX);
    const hover = 42 + Math.sin(performance.now() / 420) * 4;
    const crystalY = Math.round(bernCompanion.y - hover);
    const fadeT = clamp(bernCompanion.anim, 0, 1);
    const alpha = bernCompanion.state === "catFadeIn"
      ? fadeT
      : bernCompanion.state === "catFadeOut"
        ? 1 - fadeT
        : 1;
    const blackFade = bernCompanion.state === "catFadeOut" ? fadeT : bernCompanion.state === "catFadeIn" ? 1 - fadeT : 0;
    if (bernCompanion.state !== "catFadeOut" && bernCompanion.state !== "catFadeIn") drawBernCooldownCrystals(x, crystalY, false);
    drawBernCatForm(x, Math.round(bernCompanion.y + 12), alpha, blackFade);
    if (bernCompanion.state !== "catFadeOut" && bernCompanion.state !== "catFadeIn") drawBernCooldownCrystals(x, crystalY, true);
    return;
  }
  const list = bernFrames[bernCompanion.state] || bernFrames.idle;
  let frame;
  if (bernCompanion.state === "duoAttack") {
    const intro = bernFrames.duoAttack;
    const loop = bernFrames.duoAttackLoop;
    const index = Math.floor(bernCompanion.anim);
    frame = index < intro.length ? intro[index] : loop[(index - intro.length) % loop.length];
  } else {
    frame = list[Math.min(list.length - 1, Math.floor(bernCompanion.anim) % list.length)];
  }
  const img = bernImages[frame];
  if (!img) return;
  const bounds = bernFrameBounds[frame] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const scale = 1.28;
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const x = Math.round(bernCompanion.x - cameraX);
  const attackHover = bernCompanion.state === "teleportIn" || bernCompanion.state === "crystalCharge" || bernCompanion.state === "teleportBackOut" || bernCompanion.state.startsWith("hazard");
  const hover = (attackHover ? 174 : 42) + Math.sin(performance.now() / 420) * 4;
  const y = Math.round(bernCompanion.y - hover - (bernCompanion.state === "hazardParried" ? bernCompanion.parryZ : 0));
  let colorT = 1;
  let vanishAlpha = 1;
  if (bernCompanion.state === "summon") {
    colorT = clamp(bernCompanion.anim / Math.max(1, bernFrames.summon.length - 1), 0, 1);
  } else if (bernCompanion.state === "sacrifice") {
    const t = clamp(bernCompanion.anim / Math.max(1, bernFrames.sacrifice.length - 1), 0, 1);
    colorT = 1 - t;
    vanishAlpha = 1 - clamp((t - 0.72) / 0.28, 0, 1);
  } else if (bernCompanion.state === "teleportOut" || bernCompanion.state === "teleportBackOut" || bernCompanion.state === "hazardTeleportOut") {
    const fadeFrames = bernFrames[bernCompanion.state] || bernFrames.teleportOut;
    colorT = 1 - clamp(bernCompanion.anim / Math.max(1, fadeFrames.length - 1), 0, 1);
  } else if (bernCompanion.state === "teleportIn" || bernCompanion.state === "teleportBackIn" || bernCompanion.state === "hazardTeleportIn") {
    const fadeFrames = bernFrames[bernCompanion.state] || bernFrames.teleportIn;
    colorT = clamp(bernCompanion.anim / Math.max(1, fadeFrames.length - 1), 0, 1);
  } else if (bernCompanion.state === "hazardParried") {
    const t = clamp(bernCompanion.parryFade / BERN_HAZARD_PARRY_LAUNCH_DURATION, 0, 1);
    colorT = t;
    vanishAlpha = clamp(bernCompanion.parryFade / 0.42, 0, 1);
  }

  drawBernCooldownCrystals(x, y, false);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-bernCompanion.facing, 1);
  if (colorT < 1) {
    ctx.globalAlpha = vanishAlpha * 0.88 * (1 - colorT);
    ctx.filter = "brightness(0)";
    ctx.drawImage(img, bounds[0], bounds[1], sourceW, sourceH, -drawW * 0.5, -drawH + 16 * scale, drawW, drawH);
    ctx.globalAlpha = vanishAlpha * (0.18 + colorT * 0.82);
    ctx.filter = `saturate(${0.2 + colorT * 0.8}) brightness(${0.5 + colorT * 0.5})`;
  } else {
    ctx.globalAlpha = vanishAlpha;
  }
  ctx.drawImage(img, bounds[0], bounds[1], sourceW, sourceH, -drawW * 0.5, -drawH + 16 * scale, drawW, drawH);
  ctx.restore();
  drawBernHazardParryRings(x, y);
  drawBernCooldownCrystals(x, y, true);
  if (bernCompanion.state === "teleportIn" || bernCompanion.state === "crystalCharge" || bernCompanion.state === "hazardTeleportIn" || bernCompanion.state === "hazardCharge") {
    if (bernCompanion.state === "teleportIn" || bernCompanion.state === "crystalCharge") {
      drawBernBarrageArcCrystals();
    } else {
      const readyT = 1 - clamp(bernCompanion.crystalCharge / BERN_CRYSTAL_CHARGE_TIME, 0, 1);
      const pulse = pulseValue(10);
      for (let i = 0; i < 5; i++) {
        const angle = performance.now() / 260 + i * Math.PI * 0.4;
        const radiusX = 42 + readyT * 26;
        const radiusY = 16 + readyT * 10;
        drawCrystalShape(
          x + Math.cos(angle) * radiusX,
          y - BERN_CRYSTAL_ORBIT_OFFSET + Math.sin(angle) * radiusY,
          12 + pulse * 4,
          0.58 + readyT * 0.34,
          angle + Math.PI * 0.5
        );
      }
    }
  }
}

function beatriceFrameListForFlavor(flavor) {
  if (flavor === "stakeCast") return beatriceFrames.stakeCast;
  if (flavor === "puff") return beatriceFrames.puff;
  if (flavor === "teleportPrep" || flavor === "teleportReady") return beatriceFrames.teleportPrep;
  if (flavor === "meleeKick") return beatriceFrames.meleeKick;
  if (flavor === "meleeParryHurt") return beatriceFrames.hurt;
  if (flavor === "meleeParryReturn") return beatriceFrames.idle;
  if (flavor === "asmoDropKick") return beatriceFrames.asmoDropKick;
  if (flavor === "barrierBreak") return beatriceFrames.barrierBreak;
  if (flavor === "dizzy") return beatriceFrames.dizzy;
  if (flavor === "hurt") return beatriceFrames.hurt;
  if (flavor === "launched") return beatriceBoss.vz > 0 ? beatriceFrames.launchedUp : beatriceFrames.launchedFall;
  if (flavor === "downed" || flavor === "stunRecover") return beatriceFrames.downed;
  if (flavor === "defeated") {
    if (beatriceBoss.defeatPhase === "move") return beatriceFrames.defeatMove;
    if (beatriceBoss.defeatPhase === "fade") return beatriceFrames.defeatLoop;
    return beatriceFrames.defeatFinal;
  }
  return beatriceFrames.idle;
}

function drawBeatriceFrame(frame, x, y, facing, alpha = 1, gold = false) {
  const img = beatriceImages[frame];
  if (!img) return false;
  const bounds = beatriceFrameBounds[frame] || [0, 0, img.width, img.height];
  const sourceW = bounds[2] - bounds[0];
  const sourceH = bounds[3] - bounds[1];
  const scale = BEATRICE_SPRITE_SCALE;
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (gold) {
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "sepia(1) saturate(3.4) hue-rotate(345deg) brightness(1.55)";
    ctx.shadowColor = "rgba(255, 210, 82, 0.9)";
    ctx.shadowBlur = 18;
  }
  ctx.translate(x, y);
  ctx.scale(-facing, 1);
  const anchorX = beatriceBoss.flavor === "defeated" && beatriceBoss.defeatPhase === "fade"
    ? beatriceDefeatLoopAnchors[frame]
    : null;
  const drawX = anchorX !== null && anchorX !== undefined
    ? -(anchorX - bounds[0]) * scale
    : -drawW * 0.5;
  ctx.drawImage(
    img,
    bounds[0],
    bounds[1],
    sourceW,
    sourceH,
    drawX,
    -drawH + 18 * scale,
    drawW,
    drawH
  );
  ctx.restore();
  return true;
}

function drawBeatriceAfterimages() {
  for (const image of beatriceAfterimages) {
    const alpha = 0.58 * clamp(image.life / image.max, 0, 1);
    const hover = beatriceBoss.hoverOffset + Math.sin(performance.now() / 430) * 4;
    drawBeatriceFrame(
      image.frame,
      Math.round(image.x - cameraX),
      Math.round(image.y - hover),
      image.facing,
      alpha,
      true
    );
  }
}

function drawBeatriceBarrierAura(x, y) {
  if (!beatriceBoss.barrierActive || beatriceBoss.vulnerable || beatriceBoss.flavor === "barrierBreak" || beatriceBoss.flavor === "defeated") return;
  const barrierT = clamp((beatriceBoss.barrierHp ?? beatriceBoss.barrierMax ?? BEATRICE_BARRIER_MAX) / Math.max(1, beatriceBoss.barrierMax || BEATRICE_BARRIER_MAX), 0, 1);
  const pulse = pulseValue(6);
  const cx = x;
  const cy = y - 125 * BEATRICE_SPRITE_SCALE;
  const radius = (104 + pulse * 7) * BEATRICE_SPRITE_SCALE;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.28 + barrierT * 0.36;
  const aura = ctx.createRadialGradient(cx, cy, radius * 0.48, cx, cy, radius);
  aura.addColorStop(0, "rgba(255, 238, 144, 0.02)");
  aura.addColorStop(0.64, "rgba(255, 206, 58, 0.18)");
  aura.addColorStop(0.82, "rgba(255, 226, 91, 0.56)");
  aura.addColorStop(1, "rgba(255, 160, 27, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.56 + pulse * 0.28;
  ctx.strokeStyle = "rgba(255, 226, 104, 0.9)";
  ctx.lineWidth = 2.5 + pulse * 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * (0.96 + pulse * 0.03), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.32 + barrierT * 0.22;
  ctx.strokeStyle = "rgba(255, 246, 188, 0.74)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.82, -Math.PI * 0.18, Math.PI * 1.28);
  ctx.stroke();
  ctx.restore();
}

function drawBeatrice() {
  if (!beatriceBoss.active) return;
  drawBeatriceAfterimages();
  const list = beatriceFrameListForFlavor(beatriceBoss.flavor);
  const frame = list[Math.min(list.length - 1, Math.floor(beatriceBoss.anim) % list.length)];
  const x = Math.round(beatriceBoss.x - cameraX);
  const grounded = ["dizzy", "hurt", "launched", "downed", "stunRecover", "defeated"].includes(beatriceBoss.flavor);
  const hover = beatriceBoss.hoverOffset + (grounded ? 0 : Math.sin(performance.now() / 430) * 4);
  const y = Math.round(beatriceBoss.y - hover - (beatriceBoss.z || 0));

  drawActorShadow(beatriceBoss, 38);
  drawBeatriceBarrierAura(x, y);
  const recoveryAlpha = beatriceBoss.flavor === "stunRecover"
    ? clamp(beatriceBoss.recoveryTimer / BEATRICE_STUN_RECOVERY_TIME, 0, 1)
    : 1;
  const defeatedAlpha = beatriceBoss.flavor === "defeated" && beatriceBoss.defeatPhase === "fade"
    ? clamp(beatriceBoss.defeatTimer / BEATRICE_DEFEAT_DISSIPATE_TIME, 0, 1)
    : 1;
  const baseAlpha = beatriceBoss.flavor === "barrierBreak"
    ? clamp(beatriceBoss.breakFade, 0, 1)
    : recoveryAlpha * defeatedAlpha;
  drawBeatriceFrame(frame, x, y, beatriceBoss.facing, baseAlpha);
  if ((beatriceBoss.flavor === "meleeKick" || beatriceBoss.flavor === "meleeParryReturn" || beatriceBoss.flavor === "asmoDropKick") && beatriceBoss.materializeTimer > 0) {
    const maxAppear = beatriceBoss.flavor === "asmoDropKick" ? BEATRICE_ASMO_DROP_KICK_APPEAR_TIME : beatriceBoss.flavor === "meleeParryReturn" ? 0.38 : 0.32;
    const alpha = clamp(beatriceBoss.materializeTimer / maxAppear, 0, 1);
    drawBeatriceFrame(frame, x, y, beatriceBoss.facing, alpha, true);
  } else if (beatriceBoss.flavor === "barrierBreak") {
    const fadeT = 1 - clamp(beatriceBoss.breakFade, 0, 1);
    const goldAlpha = Math.sin(fadeT * Math.PI) * 0.78;
    if (goldAlpha > 0) drawBeatriceFrame(frame, x, y, beatriceBoss.facing, goldAlpha, true);
  } else if (beatriceBoss.flavor === "dizzy" || beatriceBoss.flavor === "hurt") {
    const pulse = 0.28 + pulseValue(5) * 0.24;
    drawBeatriceFrame(frame, x, y, beatriceBoss.facing, pulse, true);
  } else if (beatriceBoss.flavor === "stunRecover") {
    const goldAlpha = (1 - recoveryAlpha) * 0.7;
    if (goldAlpha > 0) drawBeatriceFrame(frame, x, y, beatriceBoss.facing, goldAlpha, true);
  } else if (beatriceBoss.flavor === "defeated") {
    const moveAlpha = beatriceBoss.defeatPhase === "move" ? 0.45 + pulseValue(12) * 0.28 : 0;
    const fadePulse = beatriceBoss.defeatPhase === "fade" ? Math.sin((1 - defeatedAlpha) * Math.PI) * 0.82 : 0;
    const goldAlpha = Math.max(moveAlpha, fadePulse);
    if (goldAlpha > 0) drawBeatriceFrame(frame, x, y, beatriceBoss.facing, goldAlpha, true);
  }
  drawBeatriceMeleeKickParryRings(x, y);
}

function drawBernBarrageArcCrystals() {
  if (bernCompanion.crystalHasFired) return;
  const layout = bernBarrageShardLayout();
  const readyT = 1 - clamp(bernCompanion.crystalCharge / BERN_CRYSTAL_CHARGE_TIME, 0, 1);
  const pulse = pulseValue(10);
  for (let i = 0; i < layout.length; i++) {
    const shard = layout[i];
    const startX = shard.startX - cameraX;
    const startY = shard.startY;
    const targetX = shard.targetX - cameraX;
    const targetY = shard.targetY - 24;
    const angle = Math.atan2(targetY - startY, targetX - startX) - Math.PI / 2;
    drawCrystalShape(
      startX,
      startY,
      12 + readyT * 4 + pulse * 3,
      0.62 + readyT * 0.28,
      angle
    );
  }
}

function drawBernCooldownCrystals(x, y, frontLayer = true) {
  if (!player.plumTeaActive || player.plumTeaBurned || !bernCompanion.summoned) return;
  if (bernCompanion.state !== "idle" && bernCompanion.state !== "move" && bernCompanion.state !== "moveBack") return;
  const progress = clamp((bernCompanion.crystalChargeGauge || 0) / 100, 0, 1);
  const count = Math.min(5, Math.floor(progress * 5.02));
  if (count <= 0) return;
  const pulse = pulseValue(9);
  for (let i = 0; i < count; i++) {
    const slot = i / 5;
    const angle = performance.now() / 360 + slot * Math.PI * 2;
    const isFront = Math.sin(angle) > 0;
    if (isFront !== frontLayer) continue;
    const radiusX = 48 + progress * 34;
    const radiusY = 16 + progress * 13;
    const alpha = 0.34 + progress * 0.38 + pulse * 0.12;
    drawCrystalShape(
      x + Math.cos(angle) * radiusX,
      y - BERN_CRYSTAL_ORBIT_OFFSET + Math.sin(angle) * radiusY,
      9 + progress * 4 + pulse * 2,
      alpha,
      angle + Math.PI * 0.5
    );
  }
}

function drawActors(options = {}) {
  const skipCompanions = !!options.skipCompanions;
  const skipPlayer = !!options.skipPlayer;
  const skipBeatrice = !!options.skipBeatrice;
  const actors = [
    { type: "player", y: player.y },
    ...asmodeusAttacks.map((attack) => ({ type: "asmo", y: attack.y + 0.5, attack })),
    ...beelzebubAttacks.map((attack) => ({ type: "beelzebub", y: attack.y + 0.6, attack })),
    ...leviathanAttacks.map((attack) => ({ type: "leviathan", y: attack.y + 0.55, attack })),
    ...satanAttacks.map((attack) => ({ type: "satan", y: attack.y + 0.58, attack })),
    ...belphegorAttacks.map((attack) => ({ type: "belphegor", y: attack.y + 0.59, attack })),
    ...(beatriceBoss.active ? [{ type: "beatrice", y: beatriceBoss.y }] : []),
    ...(lambdaCompanion.active ? [{ type: "lambda", y: lambdaCompanion.y }] : []),
    ...(bernCompanion.active ? [{ type: "bern", y: bernCompanion.y }] : []),
    ...enemies
      .filter((enemy) => !enemy.dead || enemy.fall > 0)
      .map((enemy) => ({ type: "enemy", y: enemy.y, enemy }))
  ].sort((a, b) => a.y - b.y);

  for (const actor of actors) {
    if (actor.type === "player") {
      if (skipPlayer) continue;
      drawSpecialWindupGlow();
      drawEagleCrestEcho();
      drawPlayer();
    } else if (actor.type === "lambda") {
      if (skipCompanions) continue;
      drawLambda();
    } else if (actor.type === "bern") {
      if (skipCompanions) continue;
      drawBernkastel();
    } else if (actor.type === "beatrice") {
      if (skipBeatrice) continue;
      drawBeatrice();
    } else if (actor.type === "asmo") {
      drawAsmodeusUppercut(actor.attack);
    } else if (actor.type === "beelzebub") {
      drawBeelzebubDropSlash(actor.attack);
    } else if (actor.type === "leviathan") {
      drawLeviathanSlash(actor.attack);
    } else if (actor.type === "satan") {
      drawSatanAerialLaunch(actor.attack);
    } else if (actor.type === "belphegor") {
      drawBelphegorGroundBounceSlam(actor.attack);
    } else {
      drawEnemy(actor.enemy);
    }
  }
}

function drawAsmodeusUppercut(attack) {
  const names = ["asmo1", "asmo2", "asmo3", "asmo4"];
  const index = Math.min(names.length - 1, Math.floor(attack.anim));
  const img = effectImages[names[index]];
  if (!img) return;
  const scale = 1.15;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const lift = Math.max(0, attack.anim - 1) * 18;
  const appearAlpha = 1 - clamp((attack.age || 0) / 0.18, 0, 1);
  const exitAlpha = 1 - clamp((attack.life || 0) / 0.2, 0, 1);
  const goldAlpha = Math.max(appearAlpha, exitAlpha);
  const alpha = Math.min(
    clamp((attack.age || 0) / 0.12, 0, 1),
    clamp(attack.life / 0.16, 0, 1)
  );
  ctx.save();
  ctx.translate(attack.x - cameraX, attack.y - lift);
  ctx.scale(-(attack.facing || 1), 1);
  if (goldAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.44 * goldAlpha;
    ctx.shadowColor = "rgba(255, 203, 55, 0.95)";
    ctx.shadowBlur = 28;
    ctx.filter = "sepia(1) saturate(5) hue-rotate(340deg) brightness(1.65)";
    ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `rgba(255, 210, 72, ${0.55 * goldAlpha})`;
  ctx.shadowBlur = 18 * goldAlpha;
  ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
  ctx.restore();
}

function drawBeelzebubDropSlash(attack) {
  const frame = beelzebubFrames[Math.min(beelzebubFrames.length - 1, Math.floor(attack.anim))];
  const img = effectImages[`beelzebub${frame}`];
  if (!img) return;
  const scale = 1.18;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const appearAlpha = 1 - clamp((attack.age || 0) / BEATRICE_ASMO_DROP_KICK_APPEAR_TIME, 0, 1);
  const exitAlpha = 1 - clamp((attack.life || 0) / 0.18, 0, 1);
  const goldAlpha = Math.max(appearAlpha, exitAlpha);
  const alpha = Math.min(
    clamp((attack.age || 0) / 0.12, 0, 1),
    clamp((attack.life || 0) / 0.16, 0, 1)
  );
  const lift = attack.z || BEATRICE_ASMO_DROP_KICK_HOVER;
  ctx.save();
  ctx.translate(attack.x - cameraX, attack.y - lift);
  ctx.scale(-(attack.facing || 1), 1);
  if (goldAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.48 * goldAlpha;
    ctx.shadowColor = "rgba(255, 203, 55, 0.95)";
    ctx.shadowBlur = 30;
    ctx.filter = "sepia(1) saturate(5) hue-rotate(340deg) brightness(1.7)";
    ctx.drawImage(img, -drawW * 0.5, -drawH * 0.52, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `rgba(255, 210, 72, ${0.42 * goldAlpha})`;
  ctx.shadowBlur = 18 * goldAlpha;
  ctx.drawImage(img, -drawW * 0.5, -drawH * 0.52, drawW, drawH);
  ctx.restore();
}

function drawLeviathanSlash(attack) {
  const frame = leviathanFrames[Math.min(leviathanFrames.length - 1, Math.floor(attack.anim))];
  const img = effectImages[`leviathan${frame}`];
  if (!img) return;
  const scale = 1.22;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const appearAlpha = 1 - clamp((attack.age || 0) / 0.16, 0, 1);
  const exitAlpha = 1 - clamp((attack.life || 0) / 0.18, 0, 1);
  const goldAlpha = Math.max(appearAlpha, exitAlpha);
  const alpha = Math.min(
    clamp((attack.age || 0) / 0.1, 0, 1),
    clamp((attack.life || 0) / 0.14, 0, 1)
  );
  ctx.save();
  ctx.translate(attack.x - cameraX, attack.y);
  ctx.scale(attack.facing || 1, 1);
  if (goldAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.38 * goldAlpha;
    ctx.shadowColor = "rgba(255, 203, 55, 0.9)";
    ctx.shadowBlur = 26;
    ctx.filter = "sepia(1) saturate(5) hue-rotate(340deg) brightness(1.55)";
    ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `rgba(255, 210, 72, ${0.35 * goldAlpha})`;
  ctx.shadowBlur = 16 * goldAlpha;
  ctx.drawImage(img, -drawW * 0.5, -drawH, drawW, drawH);
  ctx.restore();
}

function drawSatanAerialLaunch(attack) {
  const frame = satanFrames[Math.min(satanFrames.length - 1, Math.floor(attack.anim))];
  const img = effectImages[`satan${frame}`];
  if (!img) return;
  const scale = 1.18;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const appearAlpha = 1 - clamp((attack.age || 0) / 0.16, 0, 1);
  const exitAlpha = 1 - clamp((attack.life || 0) / 0.18, 0, 1);
  const goldAlpha = Math.max(appearAlpha, exitAlpha);
  const alpha = Math.min(
    clamp((attack.age || 0) / 0.1, 0, 1),
    clamp((attack.life || 0) / 0.14, 0, 1)
  );
  const lift = attack.z || SATAN_AERIAL_HOVER;
  ctx.save();
  ctx.translate(attack.x - cameraX, attack.y - lift);
  ctx.scale(-(attack.facing || 1), 1);
  if (goldAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.4 * goldAlpha;
    ctx.shadowColor = "rgba(255, 203, 55, 0.92)";
    ctx.shadowBlur = 28;
    ctx.filter = "sepia(1) saturate(5) hue-rotate(340deg) brightness(1.6)";
    ctx.drawImage(img, -drawW * 0.5, -drawH * 0.62, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `rgba(255, 210, 72, ${0.38 * goldAlpha})`;
  ctx.shadowBlur = 16 * goldAlpha;
  ctx.drawImage(img, -drawW * 0.5, -drawH * 0.62, drawW, drawH);
  ctx.restore();
}

function drawBelphegorGroundBounceSlam(attack) {
  if (attack.delay > 0 || !attack.appeared) return;
  const frame = belphegorFrames[Math.min(belphegorFrames.length - 1, Math.floor(attack.anim))];
  const img = effectImages[`belphegor${frame}`];
  if (!img) return;
  const scale = 1.18;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const appearAlpha = 1 - clamp((attack.age || 0) / 0.16, 0, 1);
  const exitAlpha = 1 - clamp((attack.life || 0) / 0.18, 0, 1);
  const goldAlpha = Math.max(appearAlpha, exitAlpha);
  const alpha = Math.min(
    clamp((attack.age || 0) / 0.1, 0, 1),
    clamp((attack.life || 0) / 0.14, 0, 1)
  );
  const lift = attack.z || BELPHEGOR_SLAM_HOVER;
  ctx.save();
  ctx.translate(attack.x - cameraX, attack.y - lift);
  ctx.scale(-(attack.facing || 1), 1);
  if (goldAlpha > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.4 * goldAlpha;
    ctx.shadowColor = "rgba(255, 203, 55, 0.92)";
    ctx.shadowBlur = 28;
    ctx.filter = "sepia(1) saturate(5) hue-rotate(340deg) brightness(1.6)";
    ctx.drawImage(img, -drawW * 0.5, -drawH * 0.62, drawW, drawH);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `rgba(255, 210, 72, ${0.38 * goldAlpha})`;
  ctx.shadowBlur = 16 * goldAlpha;
  ctx.drawImage(img, -drawW * 0.5, -drawH * 0.62, drawW, drawH);
  ctx.restore();
}

function drawEagleCrestEcho() {
  if (!player.oneWingedEagleActive || player.airborne || player.knockedDown) return;
  const data = attackData[player.action];
  if (!data?.activeFrames || player.attackLock <= 0) return;
  const frame = currentPlayerActionFrame();
  const active = data.activeFrames.includes(frame);
  const windupT = clamp(player.attackLock / Math.max(data.lock || 0.1, 0.1), 0, 1);
  const alpha = active ? 0.95 : 0.34 + Math.sin(performance.now() / 80) * 0.08;
  const side = -player.facing;
  const rangeScale = eagleCrestLevelScale();
  const baseWidth = EAGLE_CREST_ECHO_WIDTH * rangeScale;
  const centerOffset = EAGLE_CREST_BACK_OFFSET_X - (EAGLE_CREST_ECHO_WIDTH - baseWidth) * 0.5;
  const x = player.x - cameraX + side * centerOffset;
  const y = player.y - EAGLE_CREST_BACK_OFFSET_Y - player.z;
  const readyScale = 0.9 + (1 - windupT) * 0.08;
  const height = EAGLE_CREST_ECHO_HEIGHT * (active ? 1 : readyScale);
  const width = baseWidth * (active ? 1 : readyScale);
  drawOneWingedEagleCrest(x, y, height, alpha, player.facing > 0, active, width);
}

function drawSpecialBeam() {
  if (player.action !== "specialBeam") return;
  if (player.currentAttack === "lambdaKonpeitoSpecial") return;
  const beam = specialBeamBounds();
  const pulse = pulseValue(12);
  const x = beam.x - cameraX;
  const y = beam.centerY;
  const w = beam.w;
  const originX = beam.startX - cameraX;
  const gradient = ctx.createLinearGradient(originX, y, beam.endX - cameraX, y);
  gradient.addColorStop(0, "rgba(230, 255, 255, 0.98)");
  gradient.addColorStop(0.18, "rgba(87, 239, 255, 0.92)");
  gradient.addColorStop(1, "rgba(33, 188, 255, 0.35)");
  const aura = ctx.createLinearGradient(originX, y, beam.endX - cameraX, y);
  aura.addColorStop(0, `rgba(166, 252, 255, ${0.28 + pulse * 0.18})`);
  aura.addColorStop(0.3, `rgba(42, 226, 255, ${0.18 + pulse * 0.16})`);
  aura.addColorStop(1, "rgba(33, 188, 255, 0.08)");

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = aura;
  ctx.fillRect(x, y - (58 + pulse * 10), w, 116 + pulse * 20);
  ctx.fillStyle = `rgba(66, 226, 255, ${0.18 + pulse * 0.12})`;
  ctx.fillRect(x, y - (38 + pulse * 3), w, 76 + pulse * 6);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y - (13 + pulse * 2), w, 26 + pulse * 4);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(x, y - (4 + pulse), w, 8 + pulse * 2);

  ctx.save();
  ctx.beginPath();
  const capOuterW = 64 + pulse * 16;
  const capOuterH = 66 + pulse * 18;
  ctx.rect(player.facing === 1 ? originX - capOuterW : originX, y - capOuterH - 6, capOuterW, capOuterH * 2 + 12);
  ctx.clip();
  ctx.fillStyle = `rgba(42, 226, 255, ${0.16 + pulse * 0.14})`;
  ctx.beginPath();
  ctx.ellipse(originX, y, capOuterW, capOuterH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(64, 226, 255, ${0.3 + pulse * 0.22})`;
  ctx.beginPath();
  ctx.ellipse(originX, y, 40 + pulse * 11, 50 + pulse * 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(126, 248, 255, ${0.78 + pulse * 0.18})`;
  ctx.beginPath();
  ctx.ellipse(originX, y, 25 + pulse * 6, 35 + pulse * 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.ellipse(originX, y, 10 + pulse * 3, 18 + pulse * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = `rgba(112, 244, 255, ${0.64 + pulse * 0.28})`;
  ctx.lineWidth = 3 + pulse * 2;
  ctx.beginPath();
  ctx.moveTo(originX, y - 21);
  ctx.lineTo(beam.endX - cameraX, y - 18);
  ctx.moveTo(originX, y + 21);
  ctx.lineTo(beam.endX - cameraX, y + 18);
  ctx.stroke();
  ctx.restore();
}

function drawDuoBernCrystals(alpha = 1) {
  const singularityStarts = 2.1;
  const lambdaExitStart = DUO_SPIRAL_DURATION + DUO_HOLD_DURATION;
  const attackTimer = duoAttack.timer - DUO_STAGE_DURATION;
  if (!duoAttack.active || attackTimer < singularityStarts || attackTimer >= lambdaExitStart) return;
  for (const shot of duoAttack.crystalShots) {
    const t = 1 - clamp(shot.life / shot.max, 0, 1);
    const ease = t * t * (3 - 2 * t);
    const x = shot.x1 + (shot.x2 - shot.x1) * ease;
    const y = shot.y1 + (shot.y2 - shot.y1) * ease;
    const angle = Math.atan2(shot.y2 - shot.y1, shot.x2 - shot.x1) - Math.PI / 2;
    drawCrystalTrail(shot.x1 - cameraX, shot.y1, x - cameraX, y, alpha * (1 - t * 0.25));
    drawCrystalShape(x - cameraX, y, 18, alpha, angle + shot.spin * 0.15);
  }
  for (let i = 0; i < 5; i++) {
    const pos = duoBernOrbitShardPosition(i, Math.sin(performance.now() / 180 + i) * 0.1);
    const pulse = 0.72 + 0.28 * Math.sin(performance.now() / 120 + i * 1.7);
    drawCrystalShape(pos.x - cameraX, pos.y, 14 + pulse * 4, alpha * (0.65 + pulse * 0.28), pos.angle);
  }
}

function drawDuoAttackEffects() {
  if (!duoAttack.active) return;
  const singularityStarts = 2.1;
  const attackTimer = duoAttack.timer - DUO_STAGE_DURATION;
  const t = clamp((attackTimer - singularityStarts) / Math.max(0.1, DUO_SPIRAL_DURATION - singularityStarts), 0, 1);
  if (attackTimer < singularityStarts) return;
  const fade = attackTimer > DUO_SPIRAL_DURATION + DUO_HOLD_DURATION
    ? clamp(1 - (attackTimer - DUO_SPIRAL_DURATION - DUO_HOLD_DURATION) / 0.5, 0, 1)
    : 1;
  if (fade <= 0) return;
  const pulse = pulseValue(18);
  const x = duoAttack.singularityX - cameraX;
  const y = duoAttack.singularityY;
  const core = 16 + t * 74 + pulse * 8;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.globalCompositeOperation = "lighter";
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const ex = enemy.x - cameraX;
    const ey = enemy.y - (enemy.z || 0) - 82;
    const grad = ctx.createLinearGradient(ex, ey, x, y);
    grad.addColorStop(0, "rgba(79, 236, 255, 0.04)");
    grad.addColorStop(1, `rgba(153, 91, 255, ${0.22 + t * 0.22})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + t * 5;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.quadraticCurveTo((ex + x) * 0.5, ey - 52 - pulse * 35, x, y);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(77, 238, 255, ${0.58 + pulse * 0.24})`;
  ctx.lineWidth = 5 + pulse * 4;
  ctx.beginPath();
  ctx.ellipse(x, y, core * 1.9, core * 0.7, duoAttack.angle, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(191, 111, 255, ${0.45 + pulse * 0.25})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y, core * 1.35, core * 0.48, -duoAttack.angle * 1.4, 0, Math.PI * 2);
  ctx.stroke();
  drawDuoBernCrystals(fade);
  ctx.globalCompositeOperation = "source-over";
  const black = ctx.createRadialGradient(x, y, 4, x, y, core);
  black.addColorStop(0, "#000000");
  black.addColorStop(0.58, "rgba(1, 2, 8, 0.98)");
  black.addColorStop(1, "rgba(1, 2, 8, 0)");
  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.arc(x, y, core, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLambdaDuoSplash() {
  const lambdaImg = effectImages.lambdaDuoSplash;
  const bernImg = effectImages.bernDuoSplash;
  if ((!lambdaImg && !bernImg) || duoAttack.lambdaSplashTimer <= 0) return;
  const t = 1 - duoAttack.lambdaSplashTimer / LAMBDA_DUO_SPLASH_DURATION;
  const fadeIn = clamp(t / 0.12, 0, 1);
  const fadeOut = clamp(duoAttack.lambdaSplashTimer / 0.22, 0, 1);
  const alpha = Math.min(fadeIn, fadeOut);
  const pop = Math.sin(Math.min(t, 1) * Math.PI) * 0.035;

  if (bernImg) {
    const scale = 0.48 + pop;
    const drawW = bernImg.width * scale;
    const drawH = bernImg.height * scale;
    const x = -36;
    const y = H - drawH + 22;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(102, 201, 255, 0.78)";
    ctx.shadowBlur = 28;
    ctx.drawImage(bernImg, x, y, drawW, drawH);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.32;
    ctx.drawImage(bernImg, x + 8, y, drawW, drawH);
    ctx.restore();
  }

  if (lambdaImg) {
    const scale = 0.78 + pop;
    const drawW = lambdaImg.width * scale;
    const drawH = lambdaImg.height * scale;
    const x = W - drawW + 18;
    const y = H - drawH + 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(249, 75, 191, 0.75)";
    ctx.shadowBlur = 26;
    ctx.drawImage(lambdaImg, x, y, drawW, drawH);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.35;
    ctx.drawImage(lambdaImg, x - 8, y, drawW, drawH);
    ctx.restore();
  }
}

function drawCrystalShape(x, y, size, alpha = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(39, 224, 255, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.25, size * 1.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(105, 244, 255, 0.9)";
  ctx.strokeStyle = "rgba(235, 255, 255, 0.92)";
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -size * 1.25);
  ctx.lineTo(size * 0.62, -size * 0.16);
  ctx.lineTo(size * 0.26, size * 1.18);
  ctx.lineTo(-size * 0.7, size * 0.22);
  ctx.lineTo(-size * 0.28, -size * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.88);
  ctx.lineTo(size * 0.2, -size * 0.12);
  ctx.lineTo(-size * 0.1, size * 0.62);
  ctx.lineTo(-size * 0.3, size * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBeatriceStakeReticles() {
  for (const stake of beatriceStakes) {
    if (stake.mode !== "launch") continue;
    const x = stake.targetX - cameraX;
    const y = stake.targetY + 10;
    const pulse = pulseValue(11);
    const ready = stake.parryWindow > 0;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = ready ? `rgba(255, 238, 118, ${0.62 + pulse * 0.28})` : `rgba(255, 54, 72, ${0.56 + pulse * 0.22})`;
    ctx.fillStyle = "rgba(255, 30, 48, 0.1)";
    ctx.lineWidth = ready ? 4 : 3;
    ctx.beginPath();
    ctx.ellipse(x, y, BEATRICE_STAKE_RETICLE_RADIUS, BEATRICE_STAKE_RETICLE_RADIUS * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, BEATRICE_STAKE_RETICLE_RADIUS * (0.56 + pulse * 0.08), BEATRICE_STAKE_RETICLE_RADIUS * (0.2 + pulse * 0.03), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBeatriceStakeTrails() {
  for (const trail of beatriceStakeTrails) {
    const t = clamp(trail.life / trail.max, 0, 1);
    const color = trail.color === "blue" ? "88, 224, 255" : "255, 38, 62";
    const gradient = ctx.createLinearGradient(trail.x1 - cameraX, trail.y1, trail.x2 - cameraX, trail.y2);
    gradient.addColorStop(0, `rgba(${color}, 0)`);
    gradient.addColorStop(0.45, `rgba(${color}, ${0.18 * t})`);
    gradient.addColorStop(1, `rgba(${color}, ${0.78 * t})`);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = gradient;
    ctx.lineWidth = trail.color === "blue" ? 14 : 4;
    ctx.shadowColor = trail.color === "blue" ? "rgba(92, 239, 255, 0.95)" : "rgba(255, 42, 60, 0.72)";
    ctx.shadowBlur = trail.color === "blue" ? 24 : 8;
    ctx.beginPath();
    ctx.moveTo(trail.x1 - cameraX, trail.y1);
    ctx.lineTo(trail.x2 - cameraX, trail.y2);
    ctx.stroke();
    if (trail.color === "blue") {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(238, 255, 255, ${0.78 * t})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trail.x1 - cameraX, trail.y1);
      ctx.lineTo(trail.x2 - cameraX, trail.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBeatriceStakeParryLine() {
  if (beatriceStakeParryLine.life <= 0) return;
  const t = clamp(beatriceStakeParryLine.life / beatriceStakeParryLine.max, 0, 1);
  const pulse = pulseValue(18);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  const x1 = beatriceStakeParryLine.x1 - cameraX;
  const y1 = beatriceStakeParryLine.y1;
  const x2 = beatriceStakeParryLine.x2 - cameraX;
  const y2 = beatriceStakeParryLine.y2;
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, `rgba(120, 246, 255, ${0.12 * t})`);
  gradient.addColorStop(0.32, `rgba(146, 255, 255, ${0.9 * t})`);
  gradient.addColorStop(1, `rgba(120, 246, 255, ${0.2 * t})`);
  ctx.shadowColor = "rgba(82, 238, 255, 1)";
  ctx.shadowBlur = 28 + pulse * 10;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(248, 255, 255, ${0.88 * t})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawBeatriceStakeParryRings(stake) {
  if (stake.mode !== "launch") return;
  const x = stake.x - cameraX;
  const y = stake.y;
  const distToImpact = beatriceStakeDistanceToImpact(stake);
  const timingRadius = clamp(
    BEATRICE_STAKE_PARRY_RING_RADIUS + (distToImpact / 440) * (BEATRICE_STAKE_PARRY_START_RADIUS - BEATRICE_STAKE_PARRY_RING_RADIUS),
    BEATRICE_STAKE_PARRY_RING_RADIUS,
    BEATRICE_STAKE_PARRY_START_RADIUS
  );
  const ready = beatriceStakeParryReady(stake);
  const pulse = pulseValue(15);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = ready ? 5 : 3;
  ctx.strokeStyle = ready ? `rgba(255, 232, 74, ${0.88 + pulse * 0.12})` : "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.arc(x, y, BEATRICE_STAKE_PARRY_RING_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = ready ? 6 : 4;
  ctx.strokeStyle = ready ? `rgba(255, 214, 45, ${0.9 + pulse * 0.1})` : "rgba(255, 44, 44, 0.78)";
  ctx.beginPath();
  ctx.arc(x, y, timingRadius, 0, Math.PI * 2);
  ctx.stroke();
  if (ready) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x, y, BEATRICE_STAKE_PARRY_RING_RADIUS + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeatriceStakes() {
  const img = effectImages.beatriceStake;
  if (!img) return;
  const sourceW = img.width / 2;
  const sourceH = img.height;
  const drawW = 129;
  const drawH = drawW * (sourceH / sourceW);
  for (const stake of beatriceStakes) {
    ctx.save();
    ctx.translate(stake.x - cameraX, stake.y);
    ctx.rotate((stake.angle || 0) + Math.PI);
    if (stake.mode === "return") {
      const pulse = pulseValue(22);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "rgba(92, 244, 255, 1)";
      ctx.shadowBlur = 28 + pulse * 12;
      ctx.fillStyle = `rgba(96, 236, 255, ${0.28 + pulse * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, drawW * 0.62, drawH * 1.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, 0, 0, sourceW, sourceH, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    if (stake.mode === "return") {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.72 + pulseValue(24) * 0.22;
      ctx.drawImage(img, 0, 0, sourceW, sourceH, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    }
    ctx.restore();
    drawBeatriceStakeParryRings(stake);
  }
}

function drawBeatriceStakeShockwaves() {
  for (const wave of beatriceStakeShockwaves) {
    const t = 1 - clamp(wave.life / wave.max, 0, 1);
    const baseRadius = wave.radius || BEATRICE_STAKE_RETICLE_RADIUS;
    const radius = baseRadius * (0.55 + t * 1.05);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255, 39, 55, ${(1 - t) * 0.78})`;
    ctx.fillStyle = `rgba(255, 24, 42, ${(1 - t) * 0.14})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(wave.x - cameraX, wave.y + 10, radius, radius * 0.34, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(wave.x - cameraX + radius, wave.y + 10);
    ctx.ellipse(wave.x - cameraX, wave.y + 10, radius, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBeatriceStakeSparkles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const sparkle of beatriceStakeSparkles) {
    const alpha = clamp(sparkle.life / sparkle.max, 0, 1);
    const x = sparkle.x - cameraX;
    const y = sparkle.y;
    ctx.fillStyle = `rgba(255, 218, 92, ${alpha})`;
    if (sparkle.butterfly) {
      const wing = sparkle.size;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sparkle.angle || 0);
      ctx.beginPath();
      ctx.ellipse(-wing * 0.42, 0, wing * 0.52, wing * 0.26, -0.45, 0, Math.PI * 2);
      ctx.ellipse(wing * 0.42, 0, wing * 0.52, wing * 0.26, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(x - sparkle.size * 0.5, y - sparkle.size * 0.5, sparkle.size, sparkle.size);
    }
  }
  ctx.restore();
}

function drawBeatriceDefeatWisps() {
  if (!beatriceDefeatWisps.length && !beatriceDefeatTrails.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const trail of beatriceDefeatTrails) {
    const alpha = clamp(trail.life / trail.max, 0, 1);
    const grad = ctx.createLinearGradient(trail.x1 - cameraX, trail.y1, trail.x2 - cameraX, trail.y2);
    grad.addColorStop(0, `rgba(255, 244, 174, 0)`);
    grad.addColorStop(0.35, `rgba(255, 201, 57, ${0.22 * alpha})`);
    grad.addColorStop(1, `rgba(255, 236, 135, ${0.72 * alpha})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(1, trail.size || 3);
    ctx.beginPath();
    ctx.moveTo(trail.x1 - cameraX, trail.y1);
    ctx.lineTo(trail.x2 - cameraX, trail.y2);
    ctx.stroke();
  }
  for (const wisp of beatriceDefeatWisps) {
    const alpha = clamp(wisp.life / wisp.max, 0, 1);
    const x = wisp.x - cameraX;
    const y = wisp.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wisp.angle);
    ctx.shadowColor = "rgba(255, 207, 58, 0.9)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(255, 213, 62, ${0.72 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(-wisp.size * 0.34, 0, wisp.size * 0.48, wisp.size * 0.22, -0.55, 0, Math.PI * 2);
    ctx.ellipse(wisp.size * 0.34, 0, wisp.size * 0.48, wisp.size * 0.22, 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 250, 188, ${0.62 * alpha})`;
    ctx.fillRect(-wisp.size * 0.08, -wisp.size * 0.4, wisp.size * 0.16, wisp.size * 0.8);
    ctx.restore();
  }
  ctx.restore();
}

function drawKonpeitoCandy(x, y, size, frame = 0, rotation = 0, alpha = 1) {
  const img = effectImages.konpeito;
  const frameId = KONPEITO_FRAME_INDICES[((Math.floor(frame) % KONPEITO_FRAME_COUNT) + KONPEITO_FRAME_COUNT) % KONPEITO_FRAME_COUNT];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  if (img) {
    const sx = (frameId % KONPEITO_SHEET_COLS) * KONPEITO_SHEET_CELL;
    const sy = Math.floor(frameId / KONPEITO_SHEET_COLS) * KONPEITO_SHEET_CELL;
    ctx.drawImage(
      img,
      sx,
      sy,
      KONPEITO_SHEET_CELL,
      KONPEITO_SHEET_CELL,
      -size,
      -size,
      size * 2,
      size * 2
    );
  } else {
    ctx.fillStyle = "rgba(255, 245, 120, 0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlumTeaIcon(x, y, size = 28, alpha = 1) {
  const img = effectImages.plumTea;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(186, 118, 255, 0.72)";
  ctx.shadowBlur = 16;
  if (img) {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.12, size * 0.82, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -size * 1.28, -size * 1.12, size * 2.56, size * 2.56);
  } else {
    ctx.fillStyle = "#ead9ff";
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.74, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOneWingedEagleCrest(x, y, height = EAGLE_CREST_PICKUP_SIZE, alpha = 1, mirror = false, active = false, width = null) {
  const img = effectImages.oneWingedEagle;
  const glowImg = effectImages.oneWingedEagleGlow;
  ctx.save();
  ctx.translate(x, y);
  if (mirror) ctx.scale(-1, 1);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = active ? "rgba(255, 246, 156, 0.98)" : "rgba(255, 188, 28, 0.86)";
  ctx.shadowBlur = active ? 30 : 16;
  if (img) {
    const w = width || height * (img.width / img.height);
    ctx.drawImage(img, -w * 0.5, -height * 0.5, w, height);
    if (active && glowImg) {
      ctx.globalCompositeOperation = "lighter";
      const pulse = 1 + pulseValue(24) * 0.17;
      const edgeX = -w * 0.5;
      const glowW = w * pulse;
      const glowH = height * (1 + (pulse - 1) * 0.35);
      ctx.globalAlpha = alpha * (0.48 + pulseValue(18) * 0.28);
      ctx.shadowBlur = 34 + pulseValue(18) * 16;
      ctx.drawImage(glowImg, edgeX, -glowH * 0.5, glowW, glowH);
    } else if (active) {
      ctx.globalCompositeOperation = "lighter";
      const pulse = 1 + pulseValue(24) * 0.17;
      const edgeX = -w * 0.5;
      ctx.globalAlpha = alpha * 0.48;
      ctx.drawImage(img, edgeX, -height * 0.52, w * pulse, height * 1.04);
    }
  } else {
    ctx.strokeStyle = active ? "#fff3a2" : "#f4aa16";
    ctx.lineWidth = Math.max(2, height * 0.06);
    const w = width || height * 0.72;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -height * 0.44);
    ctx.lineTo(-w * 0.42, height * 0.44);
    ctx.moveTo(-w * 0.42, -height * 0.12);
    ctx.quadraticCurveTo(w * 0.16, -height * 0.24, w * 0.42, -height * 0.05);
    ctx.quadraticCurveTo(w * 0.1, height * 0.02, w * 0.34, height * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickups() {
  const pulse = pulseValue(8);
  for (const pickup of pickups) {
    const bob = Math.sin(pickup.bob) * 7;
    if (pickup.type === "konpeito") {
      drawKonpeitoCandy(pickup.x - cameraX, pickup.y - 42 + bob, 26 + pulse * 4, Math.floor(pickup.bob * 3) % KONPEITO_FRAME_COUNT, pickup.bob * 0.28, 0.9);
    } else if (pickup.type === "plumTea") {
      drawPlumTeaIcon(pickup.x - cameraX, pickup.y - 42 + bob, 28 + pulse * 4, 0.92);
    } else if (pickup.type === "oneWingedEagle") {
      drawOneWingedEagleCrest(pickup.x - cameraX, pickup.y - 42 + bob, EAGLE_CREST_PICKUP_SIZE + pulse * 7, 0.9 + pulse * 0.1, false, pulse > 0.62);
    } else {
      drawCrystalShape(pickup.x - cameraX, pickup.y - 36 + bob, 19 + pulse * 3, 0.8 + pulse * 0.2, pickup.bob * 0.18);
    }
  }
}

function drawKonpeitoReticle() {
  if (!player.konpeitoActive || !mouse.inside || state !== "playing") return;
  const x = mouse.worldX - cameraX;
  const y = mouse.laneY + 10;
  const ready = player.konpeitoCooldown <= 0;
  const alpha = ready ? 0.88 : 0.35;
  const cooldownT = ready ? 1 : 1 - player.konpeitoCooldown / KONPEITO_COOLDOWN;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255, 246, 122, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, KONPEITO_RADIUS, KONPEITO_RADIUS * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(76, 236, 255, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 22, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y + 12);
  ctx.stroke();
  if (!ready) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, KONPEITO_RADIUS * cooldownT, KONPEITO_RADIUS * 0.38 * cooldownT, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function bottleScreenPosition(bottle) {
  const t = clamp(bottle.t, 0, 1);
  const eased = t * t * (3 - 2 * t);
  const x = bottle.startX + (bottle.targetX - bottle.startX) * eased;
  const groundY = bottle.startY + (bottle.targetY - bottle.startY) * eased;
  const y = groundY - Math.sin(t * Math.PI) * 245;
  return { x: x - cameraX, y, t };
}

function drawMessageBottleShape(x, y, scale, rotation, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(210, 248, 255, 0.12)";
  ctx.beginPath();
  ctx.roundRect(-12, -22, 24, 42, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(224, 255, 255, 0.18)";
  ctx.beginPath();
  ctx.roundRect(-6, -36, 12, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(132, 96, 46, 0.7)";
  ctx.fillRect(-5, -41, 10, 8);

  ctx.shadowColor = "rgba(84, 238, 255, 0.95)";
  ctx.shadowBlur = 14;
  drawCrystalShape(0, 2, 10, 0.95, Math.PI * 0.16);
  ctx.restore();
}

function drawMessageBottles() {
  for (const bottle of messageBottles) {
    if (bottle.delay > 0) continue;
    const pos = bottleScreenPosition(bottle);
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 80 + bottle.enemyIndex);
    const scale = 0.86 + Math.sin(pos.t * Math.PI) * 0.18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = bottle.kind === "item"
      ? `rgba(180, 252, 255, ${0.52 + pulse * 0.34})`
      : `rgba(255, 255, 255, ${0.42 + pulse * 0.34})`;
    ctx.lineWidth = 2 + pulse * 2;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 34 + pulse * 7, 42 + pulse * 9, bottle.spin * bottle.t * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(91, 240, 255, ${0.18 + pulse * 0.18})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 39 + pulse * 8, 47 + pulse * 10, -bottle.spin * bottle.t * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawMessageBottleShape(pos.x, pos.y, scale, bottle.spin * bottle.t, 0.98);
  }
}

function drawSummonPillars() {
  for (const pillar of summonPillars) {
    const t = 1 - pillar.life / pillar.max;
    const alpha = Math.sin(Math.PI * t);
    const x = pillar.x - cameraX;
    const y = pillar.y + 8;
    const height = 34 + t * 172;
    const radius = 24 + t * 38;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(x, y, x, y - height);
    beam.addColorStop(0, `rgba(91, 240, 255, ${0.44 * alpha})`);
    beam.addColorStop(0.55, `rgba(223, 255, 255, ${0.28 * alpha})`);
    beam.addColorStop(1, "rgba(91, 240, 255, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.ellipse(x, y - height * 0.5, radius * 0.54, height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(225, 255, 255, ${0.7 * alpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCrystalTrail(x1, y1, x2, y2, alpha = 1) {
  const trail = ctx.createLinearGradient(x1, y1, x2, y2);
  trail.addColorStop(0, "rgba(92, 237, 255, 0)");
  trail.addColorStop(0.55, `rgba(92, 237, 255, ${0.16 * alpha})`);
  trail.addColorStop(1, `rgba(92, 237, 255, ${0.48 * alpha})`);
  const trailCore = ctx.createLinearGradient(x1, y1, x2, y2);
  trailCore.addColorStop(0, "rgba(226, 255, 255, 0)");
  trailCore.addColorStop(0.68, `rgba(226, 255, 255, ${0.18 * alpha})`);
  trailCore.addColorStop(1, `rgba(226, 255, 255, ${0.68 * alpha})`);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = trail;
  ctx.lineWidth = 7 * alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = trailCore;
  ctx.lineWidth = 2.5 * alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawCrystalTrails() {
  for (const trail of crystalTrails) {
    const alpha = clamp(trail.life / trail.max, 0, 1);
    if (trail.color || trail.width) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = trail.color || `rgba(95, 239, 255, ${0.7 * alpha})`;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = trail.width || 4;
      ctx.beginPath();
      ctx.moveTo(trail.x1 - cameraX, trail.y1);
      ctx.lineTo(trail.x2 - cameraX, trail.y2);
      ctx.stroke();
      ctx.restore();
    } else {
      drawCrystalTrail(trail.x1 - cameraX, trail.y1, trail.x2 - cameraX, trail.y2, alpha);
    }
  }
}

function drawCrystalShards() {
  for (const shard of crystalShards) {
    if (shard.delay > 0) continue;
    const fallProgress = 1 - clamp(shard.z / shard.startZ, 0, 1);
    const worldX = shard.x + (shard.targetX - shard.x) * fallProgress;
    const worldY = shard.y + (shard.targetY - shard.y) * fallProgress;
    const originScreenX = shard.x - cameraX;
    const originScreenY = shard.y - shard.startZ - 24;
    const x = worldX - cameraX;
    const y = worldY - shard.z - 24;
    const angle = Math.atan2(y - originScreenY, x - originScreenX) - Math.PI / 2;
    drawCrystalTrail(originScreenX, originScreenY, x, y);
    drawCrystalShape(x, y, 24, 0.95, angle);
  }
  for (const shard of upwardCrystalShards) {
    if (shard.delay > 0) continue;
    const t = 1 - shard.life / shard.max;
    const x = shard.x - cameraX;
    const y = shard.y - shard.z;
    const alpha = 1 - t * 0.35;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(x, y + 18, 4, x, y + 18, 78);
    glow.addColorStop(0, `rgba(230, 255, 255, ${0.38 * alpha})`);
    glow.addColorStop(0.48, `rgba(92, 238, 255, ${0.2 * alpha})`);
    glow.addColorStop(1, "rgba(92, 238, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 18, 80 * (1 - t * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawCrystalTrail(x, shard.y - 10, x, y + 16, alpha);
    drawCrystalShape(x, y, 25, alpha, 0);
  }
}

function drawCrystalShockwaves() {
  for (const wave of crystalShockwaves) {
    const t = 1 - wave.life / wave.max;
    const alpha = 1 - t;
    const maxRadius = wave.radius || CRYSTAL_SHARD_RADIUS;
    const radius = maxRadius * (0.22 + t * 0.92);
    const x = wave.x - cameraX;
    const y = wave.y + 10;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (wave.dome) {
      const domeHeight = radius * (0.58 + 0.18 * (1 - alpha));
      const fill = ctx.createRadialGradient(x, y - domeHeight * 0.34, 8, x, y - domeHeight * 0.22, radius);
      fill.addColorStop(0, `rgba(230, 255, 255, ${0.3 * alpha})`);
      fill.addColorStop(0.42, `rgba(78, 232, 255, ${0.16 * alpha})`);
      fill.addColorStop(1, "rgba(78, 232, 255, 0)");
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.quadraticCurveTo(x, y - domeHeight * 1.45, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(93, 236, 255, ${0.86 * alpha})`;
      ctx.lineWidth = 4.5 * alpha + 1;
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.quadraticCurveTo(x, y - domeHeight * 1.45, x + radius, y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(229, 255, 255, ${0.42 * alpha})`;
      ctx.lineWidth = 2 * alpha + 0.8;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    ctx.strokeStyle = `rgba(77, 219, 255, ${0.82 * alpha})`;
    ctx.lineWidth = 5 * alpha + 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(222, 255, 255, ${0.42 * alpha})`;
    ctx.lineWidth = 2 * alpha + 1;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.72, radius * 0.27, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKonpeitoShots() {
  for (const shot of konpeitoShots) {
    const pos = konpeitoShotPosition(shot);
    const t = pos.t;
    const targetScreenX = pos.targetScreenX;
    const targetScreenY = pos.targetScreenY;
    const startScreenX = pos.startScreenX;
    const startScreenY = pos.startScreenY;
    const controlX = shot.source === "lambda" ? (startScreenX + targetScreenX) / 2 : W / 2;
    const controlY = shot.source === "lambda" ? Math.min(startScreenY, targetScreenY) - (shot.juggled ? LAMBDA_KONPEITO_JUGGLE_ARC : 190) : H * 0.42;
    const x = pos.x;
    const y = pos.y;
    const size = shot.source === "lambda"
      ? 34 + Math.sin(t * Math.PI) * 18
      : 104 - 54 * t + Math.sin(t * Math.PI) * 16;
    const angle = shot.spin * t * Math.PI * 2;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(76, 236, 255, 0.58)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(targetScreenX, shot.targetY + 10, KONPEITO_RADIUS, KONPEITO_RADIUS * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 246, 122, 0.48)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(targetScreenX, shot.targetY + 10, KONPEITO_RADIUS * 0.72, KONPEITO_RADIUS * 0.27, 0, 0, Math.PI * 2);
    ctx.stroke();

    const trail = ctx.createLinearGradient(startScreenX, startScreenY, x, y);
    trail.addColorStop(0, "rgba(255, 247, 101, 0)");
    trail.addColorStop(0.45, "rgba(75, 234, 255, 0.16)");
    trail.addColorStop(1, "rgba(255, 246, 122, 0.48)");
    ctx.strokeStyle = trail;
    ctx.lineWidth = shot.source === "lambda" ? 8 - 3 * t : 14 - 6 * t;
    ctx.beginPath();
    ctx.moveTo(startScreenX, startScreenY);
    ctx.quadraticCurveTo(controlX, controlY, x, y);
    ctx.stroke();
    ctx.restore();

    drawKonpeitoCandy(x, y, size, shot.frame, angle, 0.96);
  }
}

function drawLambdaSpecialKonpeitos() {
  for (const effect of lambdaSpecialKonpeitos) {
    const t = 1 - effect.life / effect.max;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 90);
    const x = effect.x - cameraX;
    const y = effect.hoverY + Math.sin(t * Math.PI * 6) * 6;
    const nextPulse = clamp(1 - effect.pulseTimer / LAMBDA_SPECIAL_KONPEITO_PULSE_INTERVAL, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (effect.launched) {
      const trailX = x - Math.sign(effect.vx || effect.facing || 1) * 116;
      const trailY = y - Math.sign(effect.hoverVy || 1) * 22;
      const trail = ctx.createLinearGradient(trailX, trailY, x, y);
      trail.addColorStop(0, "rgba(255, 80, 220, 0)");
      trail.addColorStop(0.55, "rgba(255, 92, 228, 0.2)");
      trail.addColorStop(1, "rgba(255, 246, 122, 0.72)");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 14 + pulse * 4;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(x, y, 8, x, y, 96 + pulse * 18);
    glow.addColorStop(0, `rgba(255, 238, 255, ${0.42 + pulse * 0.18})`);
    glow.addColorStop(0.42, `rgba(255, 86, 220, ${0.24 + pulse * 0.08})`);
    glow.addColorStop(1, "rgba(255, 86, 220, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 98 + pulse * 16, 0, Math.PI * 2);
    ctx.fill();
    if (!effect.launched) {
      ctx.strokeStyle = `rgba(255, 246, 136, ${0.42 + pulse * 0.18})`;
      ctx.lineWidth = 2 + pulse * 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 64 + nextPulse * 28, 24 + nextPulse * 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawKonpeitoCandy(x, y, 58 + pulse * 6, effect.frame, t * effect.spin * Math.PI * 2, 0.98);
  }
}

function drawLambdaSpecialShrapnel() {
  for (const shard of lambdaSpecialShrapnel) {
    const pos = lambdaSpecialShrapnelPosition(shard);
    const x = pos.x - cameraX;
    const y = pos.y;
    const sx = shard.startX - cameraX;
    const sy = shard.startY;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const trail = ctx.createLinearGradient(sx, sy, x, y);
    trail.addColorStop(0, "rgba(255, 120, 230, 0)");
    trail.addColorStop(0.56, "rgba(255, 90, 224, 0.18)");
    trail.addColorStop(1, "rgba(255, 246, 122, 0.58)");
    ctx.strokeStyle = trail;
    ctx.lineWidth = 8 * (1 - pos.t * 0.45);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(shard.controlX - cameraX, shard.controlY, x, y);
    ctx.stroke();
    ctx.restore();
    drawKonpeitoCandy(x, y, 22 + Math.sin(pos.t * Math.PI) * 6, shard.frame, shard.spin * pos.t, 0.9);
  }
}

function drawKonpeitoShockwaves() {
  for (const wave of konpeitoShockwaves) {
    const t = 1 - wave.life / wave.max;
    const alpha = 1 - t;
    const maxRadius = wave.radius || KONPEITO_SHOCKWAVE_MAX_RADIUS;
    const radius = KONPEITO_RADIUS + (maxRadius - KONPEITO_RADIUS) * t;
    const x = wave.x - cameraX;
    const y = wave.y + 10;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (wave.dome) {
      const dome = ctx.createRadialGradient(x, y - radius * 0.22, radius * 0.08, x, y, radius * 1.05);
      dome.addColorStop(0, `rgba(255, 210, 245, ${0.36 * alpha})`);
      dome.addColorStop(0.45, `rgba(255, 92, 218, ${0.26 * alpha})`);
      dome.addColorStop(1, "rgba(255, 92, 218, 0)");
      ctx.fillStyle = dome;
      ctx.beginPath();
      ctx.ellipse(x, y - radius * 0.18, radius, radius * 0.72, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(x + radius, y);
      ctx.ellipse(x, y, radius, radius * 0.38, 0, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = wave.dome ? `rgba(255, 128, 232, ${0.72 * alpha})` : `rgba(255, 246, 122, ${0.72 * alpha})`;
    ctx.lineWidth = 7 * alpha + 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = wave.dome ? `rgba(255, 218, 250, ${0.54 * alpha})` : `rgba(64, 235, 255, ${0.5 * alpha})`;
    ctx.lineWidth = 3 * alpha + 1;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.72, radius * 0.27, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKonpeitoDomeBursts(frontLayer = false) {
  for (const burst of konpeitoDomeBursts) {
    const elapsed = burst.max - burst.life;
    const baseX = burst.x - cameraX;
    const baseY = burst.y + 10;
    for (const candy of burst.candies) {
      if (Boolean(candy.frontLayer) !== frontLayer) continue;
      const localDuration = burst.max - candy.delay;
      const t = clamp((elapsed - candy.delay) / localDuration, 0, 1);
      if (t <= 0 || t >= 1) continue;
      const liftT = Math.sin(Math.PI * t);
      const fade = Math.sin(Math.PI * t) * (1 - t * 0.22);
      const ringRadius = KONPEITO_RADIUS + candy.outward * t;
      const candyX = baseX + Math.cos(candy.angle) * ringRadius;
      const candyY = baseY
        + Math.sin(candy.angle) * ringRadius * 0.38
        - liftT * candy.lift
        - t * 26;
      drawKonpeitoCandy(
        candyX,
        candyY,
        candy.size * (0.84 + 0.42 * liftT),
        candy.frame + t * 5,
        candy.angle + elapsed * candy.spin,
        0.92 * fade
      );
    }
  }
}

function drawKonpeitoGeysers(frontLayer = false) {
  for (const geyser of konpeitoGeysers) {
    const t = 1 - geyser.life / geyser.max;
    const alpha = Math.sin(Math.PI * t);
    const baseRadius = 34 + t * 122;
    const x = geyser.x - cameraX;
    const y = geyser.y + 10;

    if (!frontLayer) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255, 247, 124, ${0.55 * alpha})`;
      ctx.lineWidth = 4 + 5 * alpha;
      ctx.beginPath();
      ctx.ellipse(x, y, baseRadius, baseRadius * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(79, 236, 255, ${0.45 * alpha})`;
      ctx.lineWidth = 2 + 3 * alpha;
      ctx.beginPath();
      ctx.ellipse(x, y, baseRadius * 0.72, baseRadius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const candy of geyser.candies) {
      if (Boolean(candy.frontLayer) !== frontLayer) continue;
      const ringRadius = baseRadius * (0.58 + 0.22 * Math.sin(candy.angle * 3));
      const candyX = x + Math.cos(candy.angle) * ringRadius;
      const candyY = y + Math.sin(candy.angle) * ringRadius * 0.34 - Math.sin(Math.PI * t) * candy.lift;
      drawKonpeitoCandy(
        candyX,
        candyY,
        candy.size * (0.72 + 0.48 * alpha),
        candy.frame,
        candy.angle + performance.now() / 1000 * candy.spin,
        alpha
      );
    }
  }
}

function drawScreenFlash() {
  if (screenFlashTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.82 * clamp(screenFlashTimer / LAMBDA_SUMMON_FLASH_DURATION, 0, 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBernParryOverlay() {
  if (bernParryOverlayTimer <= 0) return;
  const img = effectImages.bernParryOverlay;
  if (!img) return;
  const alpha = clamp(bernParryOverlayTimer / 0.78, 0, 1);
  const scale = Math.max(W / img.width, H / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.save();
  ctx.globalAlpha = 0.78 * Math.min(1, alpha * 1.8);
  ctx.drawImage(img, (W - drawW) * 0.5, (H - drawH) * 0.5, drawW, drawH);
  ctx.restore();
}

function drawItemBox(x, y, active, label, drawIcon, cooldown = 0, cooldownMax = 1, count = 0, showCooldown = false) {
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.42;
  ctx.fillStyle = "rgba(7, 12, 19, 0.72)";
  ctx.strokeStyle = active ? "rgba(105, 244, 255, 0.82)" : "rgba(180, 190, 198, 0.32)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 54, 54);
  ctx.strokeRect(x + 0.5, y + 0.5, 53, 53);
  ctx.save();
  if (!active) {
    ctx.globalAlpha *= 0.56;
    ctx.filter = "grayscale(1) brightness(0.72)";
  }
  drawIcon(x + 27, y + 27);
  ctx.restore();
  if (active && showCooldown) {
    const ready = 1 - clamp(cooldown / Math.max(0.001, cooldownMax), 0, 1);
    const barX = x + 7;
    const barY = y + 45;
    const barW = 40;
    const barH = 5;
    ctx.fillStyle = "rgba(2, 10, 8, 0.78)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "rgba(104, 255, 132, 0.54)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    if (ready > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      grad.addColorStop(0, "rgba(78, 255, 108, 0.95)");
      grad.addColorStop(1, "rgba(190, 255, 198, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(barX + 1, barY + 1, Math.max(1, (barW - 2) * ready), barH - 2);
    }
  }
  if (active && count > 1) {
    ctx.fillStyle = "rgba(5, 14, 22, 0.82)";
    ctx.strokeStyle = "rgba(166, 250, 255, 0.88)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 45, y + 45, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eaffff";
    ctx.font = "800 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), x + 45, y + 45);
    ctx.textBaseline = "alphabetic";
  }
  ctx.fillStyle = active ? "#eaffff" : "#87949c";
  ctx.font = "700 10px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + 27, y + 67);
  ctx.restore();
}

function drawCrystalShardStackIcon(x, y) {
  drawCrystalShape(x, y - 4, 14, 0.95, performance.now() / 900);
  const stacks = Array.isArray(player.crystalShardStacks) ? player.crystalShardStacks : [];
  const barW = 5;
  const barH = 16;
  const gap = 3;
  const startX = x - ((CRYSTAL_SHARD_MAX_STACKS * barW + (CRYSTAL_SHARD_MAX_STACKS - 1) * gap) * 0.5);
  const baseY = y + 21;
  ctx.save();
  for (let i = 0; i < CRYSTAL_SHARD_MAX_STACKS; i++) {
    const bx = startX + i * (barW + gap);
    const stack = stacks[i];
    const fill = stack ? 1 - clamp(stack.cooldown / CRYSTAL_SHARD_INTERVAL, 0, 1) : 0;
    ctx.fillStyle = "rgba(3, 12, 10, 0.72)";
    ctx.fillRect(bx, baseY - barH, barW, barH);
    ctx.strokeStyle = stack ? "rgba(137, 255, 147, 0.7)" : "rgba(90, 125, 108, 0.36)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, baseY - barH + 0.5, barW - 1, barH - 1);
    if (fill > 0) {
      const filledH = Math.max(1, barH * fill);
      const grad = ctx.createLinearGradient(bx, baseY, bx, baseY - barH);
      grad.addColorStop(0, "rgba(82, 255, 113, 0.98)");
      grad.addColorStop(1, "rgba(191, 255, 198, 0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(bx + 1, baseY - filledH, barW - 2, filledH);
    }
  }
  ctx.restore();
}

function drawMiracleRevivalBadge(x, y) {
  const charges = player.blessings.miracleRevival || 0;
  if (!player.plumTeaActive || player.plumTeaBurned || charges <= 0) return;
  const pulse = pulseValue(4);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(156, 88, 255, ${0.76 + pulse * 0.16})`;
  ctx.strokeStyle = `rgba(236, 212, 255, ${0.82 + pulse * 0.16})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 27, y + 60, 8 + pulse * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  if (charges > 1) {
    ctx.fillStyle = "#f7eaff";
    ctx.font = "800 10px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(charges), x + 27, y + 60);
  }
  ctx.restore();
}

function itemHudDrawers() {
  return {
    crystalShard: {
      label: ITEM_TUTORIALS.crystalShard.label,
      active: player.crystalShardStacks.length > 0,
      cooldown: 0,
      cooldownMax: CRYSTAL_SHARD_INTERVAL,
      count: 0,
      icon: drawCrystalShardStackIcon
    },
    konpeito: {
      label: ITEM_TUTORIALS.konpeito.label,
      active: player.konpeitoActive,
      cooldown: lambdaCompanion.summoned ? companionChargeCooldown(lambdaCompanion.konpeitoCharge || 0, LAMBDA_KONPEITO_INTERVAL) : 0,
      cooldownMax: LAMBDA_KONPEITO_INTERVAL,
      showCooldown: true,
      icon: (x, y) => drawKonpeitoCandy(x, y, 20, Math.floor(performance.now() / 120) % KONPEITO_FRAME_COUNT, performance.now() / 800, 0.95)
    },
    plumTea: {
      label: ITEM_TUTORIALS.plumTea.label,
      active: player.plumTeaActive,
      cooldown: bernCompanion.summoned ? companionChargeCooldown(bernCompanion.crystalChargeGauge || 0, BERN_CRYSTAL_INTERVAL) : 0,
      cooldownMax: BERN_CRYSTAL_INTERVAL,
      showCooldown: true,
      icon: (x, y) => drawPlumTeaIcon(x, y, 19, 0.95)
    },
    oneWingedEagle: {
      label: ITEM_TUTORIALS.oneWingedEagle.label,
      active: player.oneWingedEagleActive,
      cooldown: 0,
      cooldownMax: 1,
      count: player.oneWingedEagleLevel || 0,
      icon: (x, y) => drawOneWingedEagleCrest(x, y, 28, 0.95, false, true)
    }
  };
}

function drawItemTutorialIcon(type, x, y, scale = 1) {
  const drawers = itemHudDrawers();
  const item = drawers[type];
  if (!item) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  item.icon(0, 0);
  ctx.restore();
}

function wrappedTextLines(text, maxWidth, font) {
  ctx.save();
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

function drawItemTooltip(type, anchorX, anchorY) {
  const tutorial = ITEM_TUTORIALS[type];
  if (!tutorial) return;
  const w = 292;
  const titleFont = "800 17px Segoe UI, Arial";
  const bodyFont = "600 14px Segoe UI, Arial";
  const bodyLines = wrappedTextLines(tutorial.tip, w - 30, bodyFont);
  const h = 62 + bodyLines.length * 19;
  const x = clamp(anchorX, 14, W - w - 14);
  const y = Math.min(anchorY, H - h - 18);
  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 18, 0.91)";
  ctx.strokeStyle = "rgba(128, 243, 255, 0.82)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#eaffff";
  ctx.font = titleFont;
  ctx.textAlign = "left";
  ctx.fillText(tutorial.title, x + 15, y + 28);
  ctx.fillStyle = "#c8f9ff";
  ctx.font = bodyFont;
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, x + 15, y + 54 + index * 19);
  });
  ctx.restore();
}

function drawBeatriceBossHud() {
  if (!beatriceBoss.active || waveMode !== "boss") return;
  const barW = 430;
  const barH = 18;
  const x = W / 2 - barW / 2;
  const y = 34;
  const hpT = clamp(beatriceBoss.hp / Math.max(1, beatriceBoss.maxHp), 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(6, 7, 12, 0.72)";
  ctx.strokeStyle = "rgba(255, 238, 181, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 18, barW + 24, 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "700 14px Segoe UI, Arial";
  ctx.fillStyle = "#ffe7a6";
  ctx.fillText("Beatrice", W / 2, y - 5);
  ctx.fillStyle = "rgba(18, 9, 12, 0.88)";
  ctx.fillRect(x, y + 4, barW, barH);
  const hpGrad = ctx.createLinearGradient(x, y, x + barW, y);
  hpGrad.addColorStop(0, "#8f1025");
  hpGrad.addColorStop(0.55, "#d83d48");
  hpGrad.addColorStop(1, "#ffb36b");
  ctx.fillStyle = hpGrad;
  ctx.fillRect(x, y + 4, barW * hpT, barH);
  ctx.strokeStyle = "rgba(255, 238, 218, 0.58)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 4, barW, barH);
  if (beatriceBoss.barrierActive) {
    const pulse = pulseValue(7);
    const barrierT = clamp((beatriceBoss.barrierHp ?? beatriceBoss.barrierMax ?? BEATRICE_BARRIER_MAX) / Math.max(1, beatriceBoss.barrierMax || BEATRICE_BARRIER_MAX), 0, 1);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255, 211, 77, ${0.82 + pulse * 0.18})`;
    ctx.lineWidth = 4 + pulse * 2;
    ctx.strokeRect(x - 5, y - 1, barW + 10, barH + 10);
    ctx.fillStyle = `rgba(255, 226, 93, ${0.7 + pulse * 0.18})`;
    ctx.fillRect(x - 5, y - 8, (barW + 10) * barrierT, 4);
    ctx.strokeStyle = "rgba(255, 246, 188, 0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 5, y - 8, barW + 10, 4);
    ctx.strokeStyle = `rgba(255, 247, 181, ${0.36 + pulse * 0.24})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 10, y - 6, barW + 20, barH + 20);
  } else {
    ctx.strokeStyle = "rgba(255, 214, 96, 0.28)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, y - 1, barW + 10, barH + 10);
  }
  ctx.restore();
}

function drawItemHud() {
  const itemDrawers = itemHudDrawers();
  let hoverType = "";
  let hoverX = 0;
  let hoverY = 0;

  player.itemOrder.forEach((type, index) => {
    const item = itemDrawers[type];
    if (!item) return;
    const x = 20 + index * 66;
    const y = 18;
    drawItemBox(x, y, item.active, item.label, item.icon, item.cooldown, item.cooldownMax, item.count || 0, item.showCooldown);
    if (type === "plumTea") drawMiracleRevivalBadge(x, y);
    if (mouse.inside && mouse.x >= x && mouse.x <= x + 54 && mouse.y >= y && mouse.y <= y + 76) {
      hoverType = type;
      hoverX = x;
      hoverY = y + 84;
    }
  });
  if (hoverType) drawItemTooltip(hoverType, hoverX, hoverY);
}

function drawBernHazardWarning() {
  if (!bernHazardCanSpawn() || !bernCompanion.active) return;
  if (!bernCompanion.state.startsWith("hazard")) return;
  if (bernCompanion.state === "hazardParried") return;
  const x = clamp(bernCompanion.x - cameraX, 46, W - 46);
  const y = 76;
  const pulse = pulseValue(12);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(88, 239, 255, ${0.72 + pulse * 0.22})`;
  ctx.strokeStyle = "rgba(233, 255, 255, 0.94)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x - 18, y - 8);
  ctx.lineTo(x + 18, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.font = "800 16px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(232, 255, 255, ${0.82 + pulse * 0.18})`;
  ctx.fillText("WARNING", x, y - 20);
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    const size = p.size || 5;
    ctx.fillRect(p.x - cameraX - size * 0.5, p.y - size * 0.5, size, size);
  }
  ctx.globalAlpha = 1;
}

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawLambdaGameOverDialogue() {
  if (!lambdaGameOverDialogue.active) return;
  const line = LAMBDA_GAME_OVER_DIALOGUE[lambdaGameOverDialogue.index];
  const portrait = lambdaPortraits[line.portrait];
  const boxX = 56;
  const boxY = H - 226;
  const boxW = W - 112;
  const boxH = 178;
  const portraitH = 430;
  const portraitW = portrait ? portrait.width * (portraitH / portrait.height) : 0;
  const portraitX = 82;
  const portraitY = boxY - portraitH;

  ctx.save();
  if (portrait) {
    ctx.drawImage(portrait, portraitX, portraitY, portraitW, portraitH);
  }

  ctx.fillStyle = "rgba(8, 9, 18, 0.86)";
  ctx.strokeStyle = "rgba(255, 211, 235, 0.82)";
  ctx.lineWidth = 3;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = "rgba(64, 13, 42, 0.94)";
  ctx.strokeStyle = "rgba(255, 211, 235, 0.9)";
  ctx.lineWidth = 2;
  ctx.fillRect(boxX + 24, boxY - 28, 190, 38);
  ctx.strokeRect(boxX + 24.5, boxY - 27.5, 189, 37);
  ctx.fillStyle = "#ffe7f5";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.fillText("Lambdadelta", boxX + 42, boxY - 4);

  ctx.fillStyle = "#fff8df";
  ctx.font = "700 30px Segoe UI, Arial";
  const textX = portrait ? boxX + 310 : boxX + 42;
  const textMax = boxX + boxW - textX - 38;
  const lines = wrapText(line.text, textMax);
  lines.forEach((textLine, index) => {
    ctx.fillText(textLine, textX, boxY + 66 + index * 42);
  });

  ctx.fillStyle = "rgba(255, 231, 245, 0.72)";
  ctx.font = "600 14px Segoe UI, Arial";
  ctx.textAlign = "right";
  const prompt = line.locked ? "Press Enter to continue" : "Press any key except Enter";
  ctx.fillText(prompt, boxX + boxW - 30, boxY + boxH - 22);
  ctx.restore();
}

function drawBeatriceStakeTutorialArrow() {
  if (!beatriceStakeTutorial.armed) return;
  if (!beatriceStakeTutorial.active && !beatriceStakeTutorial.explained) return;
  const stake = findBeatriceStakeTutorialTarget();
  if (!stake || stake.mode !== "launch") return;
  const x = stake.targetX - cameraX;
  const y = stake.targetY + 10;
  if (x < -120 || x > W + 120) return;
  const pulse = pulseValue(10);
  const arrowTop = Math.max(92, y - 190);
  const arrowTip = Math.max(122, y - 86);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(102, 244, 255, ${0.62 + pulse * 0.28})`;
  ctx.fillStyle = `rgba(102, 244, 255, ${0.74 + pulse * 0.22})`;
  ctx.shadowColor = "rgba(89, 238, 255, 0.96)";
  ctx.shadowBlur = 18 + pulse * 12;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, arrowTop);
  ctx.lineTo(x, arrowTip);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, arrowTip + 22);
  ctx.lineTo(x - 22, arrowTip - 14);
  ctx.lineTo(x + 22, arrowTip - 14);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(4, 18, 24, 0.82)";
  ctx.strokeStyle = "rgba(118, 246, 255, 0.92)";
  ctx.lineWidth = 2;
  const label = beatriceStakeTutorial.active && beatriceStakeTutorial.stage === "parryNow" ? "PARRY NOW" : "Stake lands here";
  ctx.font = "900 18px Segoe UI, Arial";
  ctx.textAlign = "center";
  const labelW = ctx.measureText(label).width + 28;
  ctx.fillRect(x - labelW / 2, arrowTop - 36, labelW, 28);
  ctx.strokeRect(x - labelW / 2 + 0.5, arrowTop - 35.5, labelW - 1, 27);
  ctx.fillStyle = beatriceStakeTutorial.active && beatriceStakeTutorial.stage === "parryNow" ? "#fff37a" : "#bffbff";
  ctx.fillText(label, x, arrowTop - 16);
  ctx.restore();
}

function drawBeatriceTutorialDialogue() {
  if (!beatriceTutorial.active && !beatriceStakeTutorial.active) return;
  const tutorial = beatriceTutorial.active ? beatriceTutorial : beatriceStakeTutorial;
  const line = beatriceTutorial.active ? BEATRICE_TUTORIAL_DIALOGUE[beatriceTutorial.index] : beatriceStakeTutorialLine();
  if (!line) return;
  const portrait = dialoguePortraits[line.portrait];
  const isBattler = line.speaker === "Battler";
  const boxX = 48;
  const boxY = H - 218;
  const boxW = W - 96;
  const boxH = 170;
  const portraitH = isBattler ? 430 : 450;
  const portraitW = portrait ? portrait.width * (portraitH / portrait.height) : 0;
  const portraitX = isBattler ? 38 : W - portraitW - 34;
  const portraitY = boxY - portraitH + 8;
  const nameW = isBattler ? 154 : 166;
  const nameColor = isBattler ? "rgba(20, 52, 82, 0.94)" : "rgba(91, 46, 13, 0.94)";
  const strokeColor = isBattler ? "rgba(176, 229, 255, 0.86)" : "rgba(255, 218, 140, 0.9)";
  const textX = boxX + 38;
  const textMax = boxW - 76;
  const textTop = boxY + 45;
  const textBottom = boxY + boxH - 34;
  const lineHeight = 30;

  ctx.save();
  ctx.fillStyle = "rgba(2, 3, 7, 0.32)";
  ctx.fillRect(0, 0, W, H);
  if (portrait) ctx.drawImage(portrait, portraitX, portraitY, portraitW, portraitH);

  ctx.fillStyle = "rgba(8, 9, 16, 0.9)";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = nameColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.fillRect(boxX + 24, boxY - 28, nameW, 38);
  ctx.strokeRect(boxX + 24.5, boxY - 27.5, nameW - 1, 37);
  ctx.fillStyle = isBattler ? "#e8f7ff" : "#fff0c8";
  ctx.font = "800 18px Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.fillText(line.speaker, boxX + 42, boxY - 4);

  ctx.fillStyle = line.thought ? "#dfe9ff" : "#fff8df";
  ctx.font = line.thought ? "italic 700 24px Segoe UI, Arial" : "700 24px Segoe UI, Arial";
  const hintLines = line.parryHint ? [
    { text: "I need to be in range of Beatrice's stakes when she fires them across the room", font: "italic 700 21px Segoe UI, Arial", color: "#dfe9ff" },
    { text: "so that I can", font: "italic 700 21px Segoe UI, Arial", color: "#dfe9ff" },
    { text: "PARRY", font: "italic 900 32px Segoe UI, Arial", color: "#62f5ff" },
    { text: "them back at her. I need to stand where they'll land to do so.", font: "italic 700 21px Segoe UI, Arial", color: "#dfe9ff" }
  ] : line.stakeHint ? [
    { text: "This is it! I can send the stake back at her. I need to find", font: "italic 700 20px Segoe UI, Arial", color: "#dfe9ff" },
    { text: "where it will land", font: "italic 900 24px Segoe UI, Arial", color: "#ffffff", underline: true },
    { text: "stand in it, and wait for the right time to", font: "italic 700 20px Segoe UI, Arial", color: "#dfe9ff" },
    { text: "PARRY", font: "italic 900 34px Segoe UI, Arial", color: "#62f5ff" },
    { text: "the stake at her.", font: "italic 700 20px Segoe UI, Arial", color: "#dfe9ff" }
  ] : null;
  const lines = hintLines || wrapText(line.text, Math.max(250, textMax)).map((text) => ({
    text,
    font: line.parryNow ? "900 42px Segoe UI, Arial" : line.thought ? "italic 700 24px Segoe UI, Arial" : "700 24px Segoe UI, Arial",
    color: line.parryNow ? "#62f5ff" : line.thought ? "#dfe9ff" : "#fff8df"
  }));
  const totalTextHeight = lines.length * lineHeight;
  const viewHeight = textBottom - textTop;
  const scrollMax = Math.max(0, totalTextHeight - viewHeight);
  tutorial.scroll = clamp(tutorial.scroll, 0, scrollMax);
  ctx.save();
  ctx.beginPath();
  ctx.rect(textX - 2, textTop - 22, textMax + 8, viewHeight + 26);
  ctx.clip();
  lines.forEach((textLine, index) => {
    ctx.font = textLine.font;
    ctx.fillStyle = textLine.color;
    const y = textTop + index * lineHeight - tutorial.scroll;
    ctx.fillText(textLine.text, textX, y);
    if (textLine.underline) {
      const underlineW = ctx.measureText(textLine.text).width;
      ctx.strokeStyle = textLine.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textX, y + 5);
      ctx.lineTo(textX + underlineW, y + 5);
      ctx.stroke();
    }
  });
  ctx.restore();
  if (scrollMax > 0) {
    const barX = boxX + boxW - 18;
    const barY = textTop - 20;
    const barH = viewHeight + 20;
    const thumbH = Math.max(18, barH * (viewHeight / totalTextHeight));
    const thumbY = barY + (barH - thumbH) * (tutorial.scroll / scrollMax);
    ctx.fillStyle = "rgba(255, 244, 210, 0.16)";
    ctx.fillRect(barX, barY, 5, barH);
    ctx.fillStyle = "rgba(255, 244, 210, 0.58)";
    ctx.fillRect(barX, thumbY, 5, thumbH);
  }

  ctx.fillStyle = "rgba(255, 244, 210, 0.72)";
  ctx.font = "600 14px Segoe UI, Arial";
  ctx.textAlign = "right";
  let prompt = "";
  if (tutorial.skipCooldown <= 0) {
    prompt = beatriceStakeTutorial.active && beatriceStakeTutorial.stage === "parryNow" ? "Punch or Kick" : "Press any key or click";
  }
  ctx.fillText(prompt, boxX + boxW - 28, boxY + boxH - 18);
  ctx.restore();
}

function lambdaChoiceButtonRects() {
  const boxW = 620;
  const boxH = 174;
  const boxX = (W - boxW) / 2;
  const boxY = H - 236;
  return {
    yes: { x: boxX + 198, y: boxY + 102, w: 96, h: 42 },
    no: { x: boxX + 326, y: boxY + 102, w: 96, h: 42 }
  };
}

function drawLambdaKonpeitoQuestion() {
  if (!lambdaKonpeitoQuestion.active) return;
  const boxW = 620;
  const boxH = 174;
  const boxX = (W - boxW) / 2;
  const boxY = H - 236;
  const buttons = lambdaChoiceButtonRects();
  ctx.save();
  ctx.fillStyle = "rgba(5, 5, 10, 0.52)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(12, 8, 18, 0.92)";
  ctx.strokeStyle = "rgba(255, 188, 230, 0.9)";
  ctx.lineWidth = 3;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = "rgba(67, 13, 49, 0.95)";
  ctx.strokeStyle = "rgba(255, 210, 238, 0.92)";
  ctx.lineWidth = 2;
  ctx.fillRect(boxX + 26, boxY - 28, 190, 38);
  ctx.strokeRect(boxX + 26.5, boxY - 27.5, 189, 37);
  ctx.fillStyle = "#ffe7f5";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.fillText("Lambdadelta", boxX + 44, boxY - 4);

  ctx.fillStyle = "#fff2fb";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("Did you mean to do that?", W / 2, boxY + 62);

  const labels = [
    ["yes", "Yes"],
    ["no", "No"]
  ];
  labels.forEach(([key, label], index) => {
    const rect = buttons[key];
    const selected = lambdaKonpeitoQuestion.selection === index;
    ctx.fillStyle = selected ? "rgba(255, 64, 78, 0.34)" : "rgba(255, 255, 255, 0.08)";
    ctx.strokeStyle = selected ? "rgba(255, 236, 244, 0.96)" : "rgba(255, 188, 230, 0.56)";
    ctx.lineWidth = selected ? 3 : 2;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    ctx.fillStyle = selected ? "#fff8fb" : "#ffd9ec";
    ctx.font = "800 20px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  });
  ctx.restore();
}

function drawLambdaRetaliationOverlay() {
  if (!lambdaRetaliation.active) return;
  const t = 1 - clamp(lambdaRetaliation.timer / LAMBDA_RETALIATION_RED_DURATION, 0, 1);
  const portrait = lambdaPortraits.DarkLambda2;
  ctx.save();
  ctx.fillStyle = `rgba(125, 0, 0, ${0.22 + t * 0.78})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = clamp(t * 0.65, 0, 0.65);
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(0, 0, W, H);
  const laughCount = lambdaRetaliation.laughCount || 0;
  if (laughCount > 0) {
    const fontSize = 34 + t * 14;
    const stepX = fontSize * 1.75;
    const stepY = fontSize * 1.04;
    const cols = Math.max(1, Math.floor((W - 36) / stepX));
    const rows = Math.ceil(laughCount / cols);
    const lowerTop = H * 0.52;
    const maxLowerRows = Math.max(1, Math.floor((H - lowerTop - 16) / stepY));
    const top = Math.max(12, lowerTop - Math.max(0, rows - maxLowerRows) * stepY);
    ctx.globalAlpha = clamp(0.45 + t * 0.55, 0, 1);
    ctx.font = `900 ${fontSize}px Segoe UI Black, Impact, Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const darken = clamp(t * 1.15, 0, 1);
    const fillR = Math.round(255 - darken * 155);
    const fillG = Math.round(27 - darken * 23);
    const fillB = Math.round(32 - darken * 28);
    ctx.shadowColor = `rgba(${Math.max(95, fillR)}, 0, 0, 0.92)`;
    ctx.shadowBlur = 14 + t * 16;
    for (let i = 0; i < laughCount; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = Math.sin(i * 7.13) * 3;
      const jitterY = Math.cos(i * 5.71) * 2;
      const x = 18 + col * stepX + jitterX;
      const y = top + row * stepY + jitterY;
      if (y > H + stepY) continue;
      ctx.strokeStyle = "rgba(18, 0, 0, 0.86)";
      ctx.lineWidth = 4;
      ctx.strokeText("HA", x, y);
      ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
      ctx.fillText("HA", x, y);
    }
  }
  if (portrait) {
    const portraitH = H * (0.9 + t * 0.22);
    const portraitW = portrait.width * (portraitH / portrait.height);
    ctx.globalAlpha = clamp(0.18 + t * 0.82, 0, 1);
    ctx.shadowBlur = 0;
    ctx.drawImage(portrait, W / 2 - portraitW / 2, H / 2 - portraitH / 2 + 18, portraitW, portraitH);
  }
  ctx.restore();
}

function drawOverlay() {
  runDetailsButton.visible = false;
  if (state === "playing" || state === "paused" || state === "lost" || state === "itemTutorial" || state === "bossBlessing" || state === "beatriceTutorial" || state === "beatriceStakeTutorial") {
    drawBeatriceBossHud();
    drawItemHud();
  }
  drawBernHazardWarning();
  if (itemTutorial.active) {
    drawItemTutorialOverlay();
    return;
  }
  if (state === "bossBlessing") {
    drawBossBlessingOverlay();
    return;
  }
  if (state === "paused") {
    ctx.fillStyle = "rgba(6, 7, 10, 0.48)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff2c7";
    ctx.textAlign = "center";
    ctx.font = "700 48px Segoe UI, Arial";
    ctx.fillText("Paused", W / 2, H / 2 - 18);
    ctx.font = "20px Segoe UI, Arial";
    ctx.fillStyle = "#d7cfba";
    ctx.fillText("Press P or Esc to resume", W / 2, H / 2 + 30);
  }
  if (state === "loading" || state === "ready" || state === "lost") {
    ctx.fillStyle = "rgba(6, 7, 10, 0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff2c7";
    ctx.textAlign = "center";
    ctx.font = "700 48px Segoe UI, Arial";
    const lostWithLambda = state === "lost" && lambdaGameOverDialogue.active;
    ctx.fillText(state === "lost" ? "Battler Falls" : "Golden Witch Brawl", W / 2, lostWithLambda ? 82 : H / 2 - 28);
    ctx.font = "22px Segoe UI, Arial";
    ctx.fillStyle = "#d7cfba";
    if (state === "lost" && latestRunRankInfo) {
      ctx.fillStyle = latestRunRankInfo.letter === "S" ? "#ffe78a" : "#d7cfba";
      ctx.fillText(`Rank ${latestRunRankInfo.letter} - ${latestRunRankInfo.label}`, W / 2, lostWithLambda ? 116 : H / 2 + 18);
    }
    if (!lostWithLambda) ctx.fillText("Press Enter to fight", W / 2, state === "lost" && latestRunRankInfo ? H / 2 + 54 : H / 2 + 24);
    if (state === "lost") drawRunDetailsButton(lostWithLambda);
  }
  drawLambdaGameOverDialogue();
  drawLambdaKonpeitoQuestion();
  drawLambdaRetaliationOverlay();
  drawBeatriceStakeTutorialArrow();
  drawBeatriceTutorialDialogue();
  drawBeatriceGoatTrialObjective();
  if (messageTimer > 0 && state === "playing") {
    ctx.font = "700 24px Segoe UI, Arial";
    ctx.textAlign = "center";
    const messagePaddingX = 28;
    const messageBoxW = clamp(ctx.measureText(message).width + messagePaddingX * 2, 120, W - 120);
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(W / 2 - messageBoxW / 2, 86, messageBoxW, 44);
    ctx.fillStyle = "#fff2c7";
    ctx.fillText(message, W / 2, 116);
  }
}

function bossBlessingCardRects() {
  const count = bossBlessingChoice.choices.length;
  const cardW = count > 1 ? 430 : 560;
  const cardH = 188;
  const gap = 30;
  const totalW = count * cardW + Math.max(0, count - 1) * gap;
  const startX = (W - totalW) / 2;
  const y = H / 2 - 48;
  return bossBlessingChoice.choices.map((choice, index) => ({
    choice,
    x: startX + index * (cardW + gap),
    y,
    w: cardW,
    h: cardH
  }));
}

function drawBossBlessingOverlay() {
  const rects = bossBlessingCardRects();
  ctx.save();
  ctx.fillStyle = "rgba(5, 6, 12, 0.72)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff2c7";
  ctx.font = "900 42px Segoe UI, Arial";
  ctx.fillText("A Witch Offers Certainty", W / 2, 132);
  ctx.font = "600 19px Segoe UI, Arial";
  ctx.fillStyle = "#d8d0ba";
  ctx.fillText("Choose one blessing before the boss battle begins.", W / 2, 166);
  for (const [index, rect] of rects.entries()) {
    const isSelected = index === bossBlessingChoice.selected;
    const pink = rect.choice.color === "pink";
    const fill = pink ? "rgba(96, 16, 64, 0.92)" : "rgba(42, 24, 96, 0.92)";
    const stroke = pink ? "rgba(255, 139, 218, 0.92)" : "rgba(188, 147, 255, 0.92)";
    ctx.fillStyle = fill;
    ctx.strokeStyle = isSelected ? "#fff2c7" : stroke;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    ctx.textAlign = "left";
    ctx.fillStyle = pink ? "#ffd6f1" : "#e1d2ff";
    ctx.font = "800 15px Segoe UI, Arial";
    ctx.fillText(rect.choice.source, rect.x + 22, rect.y + 34);
    ctx.fillStyle = "#fff7d6";
    ctx.font = "900 22px Segoe UI, Arial";
    const titleLines = wrappedTextLines(rect.choice.title, rect.w - 44, "900 22px Segoe UI, Arial");
    titleLines.slice(0, 2).forEach((line, lineIndex) => ctx.fillText(line, rect.x + 22, rect.y + 68 + lineIndex * 26));
    ctx.fillStyle = "#f2edf7";
    ctx.font = "600 16px Segoe UI, Arial";
    const bodyLines = wrappedTextLines(rect.choice.text, rect.w - 44, "600 16px Segoe UI, Arial");
    bodyLines.slice(0, 4).forEach((line, lineIndex) => ctx.fillText(line, rect.x + 22, rect.y + 122 + lineIndex * 21));
    ctx.textAlign = "right";
    ctx.fillStyle = isSelected ? "#fff2c7" : "rgba(255, 242, 199, 0.68)";
    ctx.font = "800 14px Segoe UI, Arial";
    ctx.fillText(`Press ${index + 1}`, rect.x + rect.w - 18, rect.y + rect.h - 16);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#d8d0ba";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.fillText("Click a blessing, press its number, or press Enter to confirm.", W / 2, H - 104);
  ctx.restore();
}

function drawItemTutorialOverlay() {
  const tutorial = ITEM_TUTORIALS[itemTutorial.type];
  if (!tutorial) return;
  const panelW = 560;
  const panelH = 238;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2 + 12;
  const bodyFont = "600 18px Segoe UI, Arial";
  const lines = wrappedTextLines(tutorial.tip, panelW - 190, bodyFont);
  ctx.save();
  ctx.fillStyle = "rgba(4, 7, 12, 0.68)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(7, 13, 22, 0.94)";
  ctx.strokeStyle = "rgba(114, 240, 255, 0.92)";
  ctx.lineWidth = 3;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

  ctx.fillStyle = "rgba(105, 244, 255, 0.1)";
  ctx.strokeStyle = "rgba(105, 244, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.fillRect(panelX + 28, panelY + 44, 120, 120);
  ctx.strokeRect(panelX + 28.5, panelY + 44.5, 119, 119);
  drawItemTutorialIcon(itemTutorial.type, panelX + 88, panelY + 104, 2.2);

  ctx.fillStyle = "#fff7d6";
  ctx.font = "800 20px Segoe UI, Arial";
  ctx.textAlign = "left";
  ctx.fillText("New Item", panelX + 178, panelY + 52);
  ctx.fillStyle = "#eaffff";
  ctx.font = "900 32px Segoe UI, Arial";
  ctx.fillText(tutorial.title, panelX + 178, panelY + 92);

  ctx.fillStyle = "#c8f9ff";
  ctx.font = bodyFont;
  lines.forEach((line, index) => {
    ctx.fillText(line, panelX + 178, panelY + 128 + index * 24);
  });

  ctx.fillStyle = "rgba(255, 247, 214, 0.82)";
  ctx.font = "700 15px Segoe UI, Arial";
  ctx.textAlign = "right";
  const prompt = itemTutorial.dismissDelay > 0 ? "One moment..." : "Press any key or click to continue";
  ctx.fillText(prompt, panelX + panelW - 26, panelY + panelH - 24);
  ctx.restore();
}

function drawRunDetailsButton(lostWithLambda) {
  const w = 176;
  const h = 42;
  const x = W - w - 30;
  const y = lostWithLambda ? 28 : H / 2 + 54;
  runDetailsButton.x = x;
  runDetailsButton.y = y;
  runDetailsButton.w = w;
  runDetailsButton.h = h;
  runDetailsButton.visible = true;
  ctx.save();
  ctx.fillStyle = "rgba(10, 13, 22, 0.78)";
  ctx.strokeStyle = "rgba(255, 244, 198, 0.78)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#fff4c6";
  ctx.font = "800 17px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Run Details", x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function canvasPointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (W / rect.width),
    y: (event.clientY - rect.top) * (H / rect.height)
  };
}

function pointInRunDetailsButton(point) {
  return runDetailsButton.visible
    && point.x >= runDetailsButton.x
    && point.x <= runDetailsButton.x + runDetailsButton.w
    && point.y >= runDetailsButton.y
    && point.y <= runDetailsButton.y + runDetailsButton.h;
}

function draw() {
  const shake = screenShakeTimer > 0 ? screenShakeTimer / 0.7 : 0;
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * 18 * shake, (Math.random() - 0.5) * 12 * shake);
  }
  if (duoAttack.active) {
    ctx.save();
    ctx.filter = "grayscale(1) saturate(0.18) brightness(0.82)";
    drawBackground();
    drawPickups();
    drawMessageBottles();
    drawSummonPillars();
    drawKonpeitoGeysers(false);
    drawKonpeitoDomeBursts(false);
    drawBeatriceStakeReticles();
    drawBeatriceBossWalls();
    drawBeatriceRingTelegraphs();
    drawBeatriceMeleeKickTelegraph();
    drawBeatriceGoatRushTelegraphs();
    drawBeatriceTowerVolleyTelegraphs();
    drawBeatriceTowerVolleys();
    drawActors({ skipCompanions: true });
    drawKonpeitoGeysers(true);
    drawSpecialBeam();
    drawCrystalShockwaves();
    drawCrystalShards();
    drawKonpeitoShockwaves();
    drawKonpeitoDomeBursts(true);
    drawLambdaSpecialKonpeitos();
    drawLambdaSpecialShrapnel();
    drawBeatriceStakeShockwaves();
    drawBeatriceStakeParryLine();
    drawBeatriceStakeTrails();
    drawBeatriceTowerVolleyMissiles();
    drawKonpeitoShots();
    drawBeatriceStakes();
    drawBeatriceStakeSparkles();
    drawBeatriceDefeatWisps();
    drawParticles();
    ctx.restore();
    drawCrystalTrails();
    drawLambda();
    drawBernkastel();
    drawDuoAttackEffects();
    drawLambdaDuoSplash();
  } else {
    drawBackground();
    drawPickups();
    drawMessageBottles();
    drawSummonPillars();
    drawKonpeitoGeysers(false);
    drawKonpeitoDomeBursts(false);
    drawBeatriceStakeReticles();
    drawBeatriceBossWalls();
    drawBeatriceRingTelegraphs();
    drawBeatriceMeleeKickTelegraph();
    drawBeatriceGoatRushTelegraphs();
    drawBeatriceTowerVolleyTelegraphs();
    drawBeatriceTowerVolleys();
    drawActors();
    drawKonpeitoGeysers(true);
    drawDuoAttackEffects();
    drawSpecialBeam();
    drawCrystalTrails();
    drawCrystalShockwaves();
    drawCrystalShards();
    drawKonpeitoShockwaves();
    drawKonpeitoDomeBursts(true);
    drawLambdaSpecialKonpeitos();
    drawLambdaSpecialShrapnel();
    drawBeatriceStakeShockwaves();
    drawBeatriceStakeParryLine();
    drawBeatriceStakeTrails();
    drawBeatriceTowerVolleyMissiles();
    drawKonpeitoShots();
    drawBeatriceStakes();
    drawBeatriceStakeSparkles();
    drawBeatriceDefeatWisps();
    drawParticles();
  }
  drawOverlay();
  drawScreenFlash();
  ctx.restore();
  drawBernParryOverlay();
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    keys.clear();
    resetAttackHolds();
  } else if (state === "paused") {
    state = "playing";
    keys.clear();
    resetAttackHolds();
  }
}

function beginAttackHold(kind) {
  const hold = attackHolds[kind];
  if (!hold || hold.down) return;
  if (tryBeatriceStakeParry()) return;
  if (tryBeatriceMeleeKickParry()) return;
  if (tryBernHazardParry()) return;
  if (tryGoatPoundParry(kind)) return;
  if (player.resolve < chargedAttackResolveCost()) {
    attack(kind);
    return;
  }
  hold.down = true;
  hold.timer = 0;
  hold.triggered = false;
}

function releaseAttackHold(kind) {
  const hold = attackHolds[kind];
  if (!hold || !hold.down) return;
  const shouldTap = !hold.triggered && state === "playing";
  hold.down = false;
  hold.timer = 0;
  hold.triggered = false;
  if (shouldTap) attack(kind);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (state === "bossBlessing") {
    event.preventDefault();
    if (key === "arrowleft" || key === "a") {
      bossBlessingChoice.selected = Math.max(0, bossBlessingChoice.selected - 1);
    } else if (key === "arrowright" || key === "d") {
      bossBlessingChoice.selected = Math.min(bossBlessingChoice.choices.length - 1, bossBlessingChoice.selected + 1);
    } else if (key === "enter" || key === " ") {
      chooseBossBlessing();
    } else if (/^[1-9]$/.test(key)) {
      const index = Number(key) - 1;
      if (bossBlessingChoice.choices[index]) chooseBossBlessing(index);
    }
    return;
  }
  if (lambdaKonpeitoQuestion.active) {
    event.preventDefault();
    handleLambdaKonpeitoChoiceKey(key);
    return;
  }
  if (beatriceTutorial.active) {
    event.preventDefault();
    advanceBeatriceTutorialDialogue();
    return;
  }
  if (beatriceStakeTutorial.active) {
    event.preventDefault();
    handleBeatriceStakeTutorialKey(key);
    return;
  }
  if (key === "escape" && runDetailsPanel && !runDetailsPanel.hidden) {
    event.preventDefault();
    hideRunDetails();
    return;
  }
  if (itemTutorial.active) {
    event.preventDefault();
    dismissItemTutorial();
    return;
  }
  if (state === "lost" && lambdaGameOverDialogue.active && key !== "enter") {
    event.preventDefault();
    advanceLambdaGameOverDialogue(true);
    return;
  }
  if (key === "p" || key === "escape") {
    event.preventDefault();
    togglePause();
    return;
  }
  keys.add(key);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === "enter" && (state === "ready" || state === "lost")) startGame();
  if (state !== "playing") return;
  if (key === "j") {
    event.preventDefault();
    if (event.repeat) return;
    beginAttackHold("punch");
  }
  if (key === "k") {
    event.preventDefault();
    if (event.repeat) return;
    beginAttackHold("kick");
  }
  if (key === "l") attack("special");
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if (key === "j") {
    event.preventDefault();
    releaseAttackHold("punch");
  }
  if (key === "k") {
    event.preventDefault();
    releaseAttackHold("kick");
  }
});

canvas.addEventListener("mousemove", updateMouseAim);
canvas.addEventListener("mouseenter", (event) => {
  updateMouseAim(event);
  mouse.inside = true;
});
canvas.addEventListener("mouseleave", () => {
  mouse.inside = false;
});
canvas.addEventListener("wheel", (event) => {
  if (!beatriceTutorial.active && !beatriceStakeTutorial.active) return;
  event.preventDefault();
  const tutorial = beatriceTutorial.active ? beatriceTutorial : beatriceStakeTutorial;
  tutorial.scroll = Math.max(0, tutorial.scroll + event.deltaY * 0.45);
}, { passive: false });
canvas.addEventListener("click", (event) => {
  if (state === "bossBlessing") {
    const point = canvasPointFromEvent(event);
    const rects = bossBlessingCardRects();
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      if (point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h) {
        chooseBossBlessing(i);
        return;
      }
    }
    return;
  }
  if (lambdaKonpeitoQuestion.active) {
    const point = canvasPointFromEvent(event);
    const buttons = lambdaChoiceButtonRects();
    if (point.x >= buttons.yes.x && point.x <= buttons.yes.x + buttons.yes.w && point.y >= buttons.yes.y && point.y <= buttons.yes.y + buttons.yes.h) {
      chooseLambdaKonpeitoAnswer(true);
      return;
    }
    if (point.x >= buttons.no.x && point.x <= buttons.no.x + buttons.no.w && point.y >= buttons.no.y && point.y <= buttons.no.y + buttons.no.h) {
      chooseLambdaKonpeitoAnswer(false);
      return;
    }
    lambdaKonpeitoQuestion.selection = point.x < W / 2 ? 0 : 1;
    return;
  }
  if (beatriceTutorial.active) {
    advanceBeatriceTutorialDialogue();
    return;
  }
  if (beatriceStakeTutorial.active) {
    if (beatriceStakeTutorial.stage !== "parryNow") advanceBeatriceStakeTutorialDialogue();
    return;
  }
  if (itemTutorial.active) {
    dismissItemTutorial();
    return;
  }
  if (state === "lost" && pointInRunDetailsButton(canvasPointFromEvent(event))) {
    showRunDetails();
    return;
  }
  if (state === "lost" && lambdaGameOverDialogue.active) {
    advanceLambdaGameOverDialogue(true);
    return;
  }
  updateMouseAim(event);
  fireKonpeito();
});

if (runDetailsClose) {
  runDetailsClose.addEventListener("click", hideRunDetails);
}
if (runDetailsPanel) {
  runDetailsPanel.addEventListener("click", (event) => {
    if (event.target && event.target.hasAttribute("data-run-details-close")) {
      hideRunDetails();
    }
  });
}

loadImages().then(() => {
  state = "ready";
  healthBar.style.width = "100%";
  updateResolveHud();
  requestAnimationFrame(loop);
});
