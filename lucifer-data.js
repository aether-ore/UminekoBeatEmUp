// Source ranges and visual timing are documented in docs/lucifer-animation-manifest.md.
// Durations are seconds; distances are world pixels. A move owns one hit across
// all active frames, including multi-swing source animations.
const luciferRange = (first, last) => Array.from({ length: last - first + 1 }, (_, index) => first + index);

const LUCIFER_CLIPS = {
  idle: luciferRange(0, 9), block: [109, 110, 110, 109],
  approach: luciferRange(53, 60), retreat: luciferRange(61, 68),
  jumpStart: luciferRange(69, 73), jumpLaunch: luciferRange(74, 76),
  airRecovery: [288, 289], landing: luciferRange(90, 93),
  dash: luciferRange(94, 99), turnRetreat: luciferRange(100, 108),
  acrobat: luciferRange(484, 493), crouch: luciferRange(27, 36),
  crouchExit: luciferRange(37, 41), parryRecoil: luciferRange(113, 118),
  stakeLoop: luciferRange(532, 534),
  palm: luciferRange(183, 187), claw: luciferRange(188, 194),
  kick: luciferRange(195, 200), bladeSweep: luciferRange(201, 209),
  thrust: luciferRange(210, 218), slash: luciferRange(219, 228),
  ribbonJab: luciferRange(229, 232), ribbonSweep: luciferRange(233, 239),
  ribbonRise: luciferRange(240, 249), lowDive: luciferRange(250, 257),
  commandGround: luciferRange(179, 182), commandAir: luciferRange(258, 260),
  airSpin: luciferRange(261, 267), burst: luciferRange(268, 273),
  airKick: luciferRange(274, 276), airClaw: luciferRange(277, 282),
  airFlip: luciferRange(283, 287), lunge: luciferRange(318, 324),
  uppercut: luciferRange(325, 333), drill: luciferRange(334, 340),
  heavyDrill: luciferRange(341, 346), stakeFlip: luciferRange(347, 356),
  transform: luciferRange(357, 366), dualSweep: luciferRange(465, 473),
  risingLunge: luciferRange(474, 483), clawFinish: luciferRange(494, 502)
};

const LUCIFER_ATTACK_TIERS = {
  quick: { damage: 12, windup: 0.35, activeDuration: 0.18, recovery: 0.55, reach: 115, depth: 36 },
  standard: { damage: 16, windup: 0.45, activeDuration: 0.26, recovery: 0.65, reach: 160, depth: 44 },
  heavy: { damage: 22, windup: 0.60, activeDuration: 0.34, recovery: 0.85, reach: 210, depth: 48 },
  finisher: { damage: 26, windup: 0.85, activeDuration: 0.42, recovery: 1.10, reach: 240, depth: 48 }
};

function luciferMove(label, clip, phase, tier, startup, active, recover, overrides = {}) {
  return {
    label, clip, phase, kind: "melee", tier,
    ...LUCIFER_ATTACK_TIERS[tier],
    travel: 0, radius: 0, aerial: false, parry: false,
    startup, active, recover, ...overrides
  };
}

const LUCIFER_MOVES = {
  palm: luciferMove("Upward Palm", "palm", 1, "quick", [183], [184, 185, 186], [187]),
  claw: luciferMove("Red Claw", "claw", 1, "standard", [188, 189], [190, 191, 192], [193, 194]),
  kick: luciferMove("Close Kick", "kick", 1, "quick", [195, 196], [197, 198], [199, 200]),
  bladeSweep: luciferMove("Broad Blade Sweep", "bladeSweep", 1, "heavy", [201, 202], luciferRange(203, 206), [207, 208, 209]),
  thrust: luciferMove("Extended Blade Thrust", "thrust", 1, "standard", [210, 211, 212], [213, 214], luciferRange(215, 218), { reach: 260, depth: 28 }),
  ribbonJab: luciferMove("Short Ribbon Strike", "ribbonJab", 1, "quick", [229, 230], [231, 232], LUCIFER_CLIPS.crouchExit),
  ribbonSweep: luciferMove("Crouching Ribbon Sweep", "ribbonSweep", 1, "standard", [233, 234], [235, 236, 237], [238, 239]),
  ribbonRise: luciferMove("Upward Ribbon Strike", "ribbonRise", 1, "heavy", [240, 241, 242], [243, 244, 245], luciferRange(246, 249)),
  lunge: luciferMove("Advancing Blade Slash", "lunge", 1, "heavy", [318, 319], [320, 321], [322, 323, 324], { travel: 180 }),
  uppercut: luciferMove("Rising Blade Uppercut", "uppercut", 1, "heavy", [325, 326], [327, 328, 329], luciferRange(330, 333)),
  lowDive: luciferMove("Rising Cut and Low Dive", "lowDive", 2, "heavy", [250, 251], luciferRange(252, 257), LUCIFER_CLIPS.airRecovery, { travel: 250, aerial: true, activeDuration: 0.50 }),
  airSpin: luciferMove("Aerial Ribbon Spin", "airSpin", 2, "standard", [261, 262, 263], [264, 265, 266], [267, 288, 289], { travel: 160, aerial: true }),
  airKick: luciferMove("Aerial Blade Kick", "airKick", 2, "standard", [274], [275, 276], LUCIFER_CLIPS.airRecovery, { travel: 180, aerial: true }),
  airClaw: luciferMove("Aerial Claw Sweep", "airClaw", 2, "standard", [277, 278], luciferRange(279, 282), LUCIFER_CLIPS.airRecovery, { travel: 180, aerial: true }),
  airFlip: luciferMove("Aerial Blade Flip", "airFlip", 2, "heavy", [283, 284], [285, 286, 287], LUCIFER_CLIPS.airRecovery, { travel: 220, aerial: true }),
  drill: luciferMove("Diagonal Drill Dive", "drill", 2, "heavy", luciferRange(334, 338), [339, 340], LUCIFER_CLIPS.airRecovery, { kind: "drill", travel: 460, radius: 28, aerial: true, parry: true, activeDuration: 0.48 }),
  heavyDrill: luciferMove("Heavy Drill Dive", "heavyDrill", 3, "finisher", luciferRange(341, 344), [345, 346], LUCIFER_CLIPS.airRecovery, { kind: "drill", travel: 560, radius: 36, aerial: true, parry: true, activeDuration: 0.56 }),
  transform: luciferMove("Pride's Stake", "transform", 3, "finisher", luciferRange(357, 366), LUCIFER_CLIPS.stakeLoop, LUCIFER_CLIPS.airRecovery, { kind: "drill", travel: 700, radius: 34, parry: true, activeDuration: 0.65, cooldown: 14 }),
  dualSweep: luciferMove("Dual-Blade Sweep", "dualSweep", 3, "finisher", [465], luciferRange(466, 470), [471, 472, 473], { parry: true }),
  risingLunge: luciferMove("Advancing Rising Blade", "risingLunge", 3, "heavy", [474, 475], [476, 477], luciferRange(478, 483), { travel: 180, parry: true }),
  clawFinish: luciferMove("Claw Finisher", "clawFinish", 3, "finisher", [494, 495, 496], luciferRange(497, 501), [502], { parry: true }),
  slash: luciferMove("Original Blade Slash", "slash", 1, "standard", [219, 220], luciferRange(221, 224), luciferRange(225, 228), { damage: 17, windup: 0.35, activeDuration: 0.4, reach: 168, depth: 41 }),
  stakeFlip: luciferMove("Ricochet Stake", "stakeFlip", 2, "heavy", luciferRange(347, 355), [356], LUCIFER_CLIPS.airRecovery, { kind: "ricochet", damage: 22, windup: 0.95, activeDuration: 1.45, radius: 34, travel: 0, aerial: true, vulnerableStartup: true }),
  commandGround: luciferMove("Ground Sister Command", "commandGround", 2, "standard", [179], [180], [181, 182], { kind: "command", damage: 0, windup: 0.8, activeDuration: 0.1, recovery: 0.8, reach: 0, depth: 0 }),
  commandAir: luciferMove("Aerial Sister Command", "commandAir", 2, "standard", [258, 259], [260], LUCIFER_CLIPS.airRecovery, { kind: "command", damage: 0, windup: 0.8, activeDuration: 0.1, recovery: 0.8, reach: 0, depth: 0, aerial: true }),
  burst: luciferMove("Defensive Burst", "burst", 1, "quick", [268, 269, 270], [271, 272], [273], { kind: "burst", damage: 0, windup: 0.65, activeDuration: 0.12, recovery: 0.8, reach: 160, radius: 160, depth: 60, cooldown: 12 })
};

// The runtime also derives one standalone pattern per eligible direct move and
// command. Combination vs. standalone groups are selected with 2:1 weighting.
const LUCIFER_PATTERNS = [
  { id: "palm-kick", phase: 1, moves: ["palm", "kick"] },
  { id: "ribbon-one-two", phase: 1, moves: ["ribbonJab", "ribbonSweep"] },
  { id: "claw-thrust", phase: 1, moves: ["claw", "thrust"] },
  { id: "advancing-slash", phase: 1, moves: ["lunge", "slash"] },
  { id: "sweep-uppercut", phase: 1, moves: ["bladeSweep", "uppercut"] },
  { id: "air-spin-kick", phase: 2, moves: ["airSpin", "airKick"] },
  { id: "air-claw-flip", phase: 2, moves: ["airClaw", "airFlip"] },
  { id: "ascending-drill", phase: 2, moves: ["lunge", "uppercut", "drill"] },
  { id: "slash-ricochet", phase: 2, moves: ["slash", "slash", "stakeFlip"] },
  { id: "pride-blades", phase: 3, moves: ["dualSweep", "risingLunge", "clawFinish"] },
  { id: "double-dive", phase: 3, moves: ["lowDive", "heavyDrill"] },
  { id: "ribbon-finisher", phase: 3, moves: ["ribbonJab", "ribbonSweep", "dualSweep", "clawFinish"] }
];
