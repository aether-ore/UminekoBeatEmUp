// Lucifer owns this state machine and its summons. No Beatrice attack runtime is shared.
let luciferAttackSerial = 0;

function luciferClearPendingSave() {
  if (kanonCompanion.savePending?.type === "lucifer") {
    kanonCompanion.savePending = null;
    kanonCompanion.saveResolved = false;
  }
}

function cancelLuciferCombat() {
  luciferClearPendingSave();
  const c = luciferBoss.combat;
  if (c) {
    c.attackId = ++luciferAttackSerial; c.sister = null; c.moveId = null;
    c.stage = "neutral"; c.saving = false; c.hitDone = true; c.guardedHits = [];
    c.frame = 0;
  }
  luciferBoss.attackQueue = []; luciferBoss.z = 0; luciferBoss.stakeLaunched = false;
  luciferBoss.vulnerable = false; luciferBoss.recovery = false;
}

function resetLuciferCombat() {
  luciferClearPendingSave();
  luciferBoss.combat = {
    phase: 1, stage: "neutral", moveId: null, elapsed: 0, duration: 0,
    frame: 0, attackId: ++luciferAttackSerial, time: 0,
    originX: luciferBoss.x, originY: luciferBoss.y,
    targetX: luciferBoss.x, targetY: luciferBoss.y,
    lockedX: luciferBoss.x, lockedY: luciferBoss.y,
    previousX: luciferBoss.x, previousY: luciferBoss.y,
    sister: null, sisterCooldown: 0, lastSister: "", burstCooldown: 6,
    transformCooldown: 0, repositionCooldown: 0, guardedHits: [], lastPattern: "", patternHistory: [],
    repositionCount: 0, hitDone: false, saving: false, parryAttempted: false,
    randomState: 1270254, debug: { paused: false, hitboxes: false, seed: 1270254, freezeAI: false, sister: "" }
  };
  luciferBoss.combat.randomState = luciferBoss.combat.debug.seed;
}

function luciferRandom() {
  const c = luciferBoss.combat;
  let x = c.randomState | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  c.randomState = x >>> 0;
  return c.randomState / 4294967296;
}

function luciferArena() {
  return { left: Math.max(90, cameraX + 90), right: Math.min(STAGE_W - 90, cameraX + W - 90),
    top: PLAY_AREA_TOP, bottom: PLAY_AREA_BOTTOM };
}

function luciferConfine() {
  const a = luciferArena();
  luciferBoss.x = clamp(luciferBoss.x, a.left, a.right);
  luciferBoss.y = clamp(luciferBoss.y, a.top, a.bottom);
}

function luciferFrameFrom(list, progress) {
  if (!list || !list.length) return 0;
  return list[Math.min(list.length - 1, Math.floor(clamp(progress, 0, 0.999999) * list.length))];
}

function luciferSetFrame(list, progress, flavor) {
  const c = luciferBoss.combat;
  c.frame = luciferFrameFrom(list, progress);
  luciferBoss.anim = Math.max(0, (luciferFrames[flavor] || []).indexOf(c.frame));
  luciferBoss.flavor = flavor;
}

function luciferPlayerProtected() {
  return player.hp <= 0 || player.airborne || player.knockedDown || player.getUpTimer > 0
    || player.action === "getUp" || player.downTime > 0;
}

// Segment/ellipse intersection covers the entire travelled path, not just frame endpoints.
function luciferSweptContact(ax, ay, bx, by, px, py, radiusX, radiusY) {
  const dx = (bx - ax) / radiusX, dy = (by - ay) / radiusY;
  const qx = (px - ax) / radiusX, qy = (py - ay) / radiusY;
  const t = clamp((qx * dx + qy * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return (qx - dx * t) ** 2 + (qy - dy * t) ** 2 <= 1;
}

function luciferMeleeContact(move, ax = luciferBoss.x, bx = luciferBoss.x, y = luciferBoss.y) {
  const side = luciferBoss.facing;
  const left = Math.min(ax, bx) + (side > 0 ? -12 : -move.reach);
  const right = Math.max(ax, bx) + (side > 0 ? move.reach : 12);
  return player.x >= left && player.x <= right && Math.abs(player.y - y) <= move.depth;
}

function luciferApplyHit(move, token, source, direction = luciferBoss.facing) {
  if (token.hitDone || state !== "playing" || luciferPlayerProtected()) return false;
  token.hitDone = true;
  if (token === luciferBoss.combat) luciferBoss.attackHitDone = true;
  if (isPlayerInvulnerable()) {
    tryTriggerWitchTime(`lucifer:${source}`);
    return true;
  }
  if (move.parry && token.parryAttempted && startKanonParrySave({ type: "lucifer", attackId: token.attackId })) {
    token.saving = true;
    token.saveWait = 0;
    return true;
  }
  if (!move.damage) {
    if (!playerHasShannonBarrier()) player.x = clamp(player.x + direction * 160, cameraX + 50, Math.min(STAGE_W - 50, cameraX + W - 50));
    burst(player.x, player.y - 82, "special");
    return true;
  }
  prepareShannonBarrierForLaunchingHit();
  const dealt = damagePlayer(nightfallEnemyDamage(move.damage));
  if (shannonBarrierBlockedHit()) {
    burst(player.x, player.y - 96, "special");
    return true;
  }
  if (dealt > 0) {
    player.invuln = Math.max(player.invuln, 0.32);
    player.attackLock = 0; player.attackLungeRemaining = 0; player.attackHasHit = false;
    player.currentAttack = ""; player.runState = "none"; player.runTimer = 0;
    player.runCharge = 0; player.brakeDrift = 0; player.brakeBurstTimer = 0;
    resetPlayerCombo();
    launchActor(player, direction || 1, move.damage >= 22 ? 360 : 240, move.damage >= 22 ? 180 : 110);
    burst(player.x, player.y - 104, "enemy");
    screenShakeTimer = Math.max(screenShakeTimer, 0.18);
    if (player.hp <= 0) defeatPlayer();
  }
  return true;
}

function luciferNoteGuardedHit(options = {}) {
  const c = luciferBoss.combat;
  if (!c || options.continuous || options.source === "battler:specialBeam") return;
  if (Math.abs(player.x - luciferBoss.x) > 160 || Math.abs(player.y - luciferBoss.y) > 48) return;
  const id = options.hitId ?? ++luciferAttackSerial;
  c.guardedHits = c.guardedHits.filter(h => c.time - h.time <= 2);
  if (!c.guardedHits.some(h => h.id === id)) c.guardedHits.push({ id, time: c.time });
}

function luciferRequiredPhase() {
  const hp = luciferBoss.hp / Math.max(1, luciferBoss.maxHp);
  return hp <= 0.30 ? 3 : hp <= 0.65 ? 2 : 1;
}

function luciferMoveAvailable(key) {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[key];
  return !!(m && m.phase <= c.phase && (key !== "transform" || c.transformCooldown <= 0)
    && (m.kind !== "command" || c.sisterCooldown <= 0 && !c.sister));
}

function luciferMoveFits(key) {
  const m = LUCIFER_MOVES[key];
  if (!m) return false;
  const dx = Math.abs(player.x - luciferBoss.x), dy = Math.abs(player.y - luciferBoss.y);
  if (m.kind === "command" || m.kind === "ricochet") return dx >= 130;
  if (m.kind === "burst") return dx <= 160 && dy <= 60;
  if (m.kind === "drill") return dx >= 160 && dx <= m.travel && dy <= 68;
  return dx <= m.reach + (m.travel || 0) * 0.75 && dy <= m.depth;
}

function startLuciferMove(key, options = {}) {
  if (!luciferBoss.active || luciferBoss.hp <= 0 || !LUCIFER_MOVES[key]) return false;
  if (!luciferBoss.combat) resetLuciferCombat();
  if (!options.force && (!luciferMoveAvailable(key) || luciferBoss.combat.stage !== "neutral" || luciferBoss.combat.sister)) return false;
  const c = luciferBoss.combat, m = LUCIFER_MOVES[key];
  luciferConfine();
  Object.assign(c, { stage: "startup", moveId: key, elapsed: 0, attackId: ++luciferAttackSerial,
    hitDone: false, saving: false, parryAttempted: false,
    originX: luciferBoss.x, originY: luciferBoss.y, previousX: luciferBoss.x, previousY: luciferBoss.y,
    targetX: player.x, targetY: clamp(player.y, luciferArena().top, luciferArena().bottom) });
  c.prelude = m.aerial ? 0.35 : key.startsWith("ribbon") ? 0.15 : 0;
  c.duration = m.windup + c.prelude;
  luciferBoss.facing = player.x >= luciferBoss.x ? 1 : -1;
  luciferBoss.attackHitDone = false;
  luciferBoss.vulnerable = m.kind === "ricochet";
  luciferBoss.recovery = false;
  luciferBoss.z = 0;
  if (key === "transform") c.transformCooldown = 14;
  if (key === "burst") { c.burstCooldown = 12; c.guardedHits = []; }
  luciferSetFrame(c.prelude ? (m.aerial ? LUCIFER_CLIPS.jumpStart : LUCIFER_CLIPS.crouch) : m.startup, 0, m.clip);
  return true;
}

function luciferProjectedMove(m) {
  const c = luciferBoss.combat, a = luciferArena();
  const originX = c.stage === "active" ? c.originX : luciferBoss.x;
  const originY = c.stage === "active" ? c.originY : luciferBoss.y;
  const travel = m.travel || 0;
  const endX = clamp(originX + luciferBoss.facing * Math.min(travel, Math.abs(c.targetX - originX) + (m.kind === "drill" ? 90 : 0)), a.left, a.right);
  return { endX, endY: m.kind === "drill" || m.aerial ? c.targetY : originY };
}

function luciferBeginActive() {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId], a = luciferArena();
  c.stage = "active"; c.elapsed = 0; c.duration = m.activeDuration;
  luciferBoss.vulnerable = false;
  luciferBoss.facing = player.x >= luciferBoss.x ? 1 : -1;
  c.lockedX = c.targetX = clamp(player.x, a.left, a.right);
  c.lockedY = c.targetY = clamp(player.y, a.top, a.bottom);
  c.originX = luciferBoss.x; c.originY = luciferBoss.y;
  c.previousX = luciferBoss.x; c.previousY = luciferBoss.y;
  Object.assign(c, luciferProjectedMove(m));
  if (m.kind === "command") {
    luciferSpawnSister(c.moveId === "commandAir");
    c.duration = c.sister.duration;
  } else if (m.kind === "ricochet") {
    c.screenY = luciferBoss.y - luciferBoss.z - 112;
    const dx = c.lockedX - luciferBoss.x, dy = c.lockedY - 112 - c.screenY;
    const length = Math.hypot(dx, dy) || 1;
    c.vx = dx / length * 2150; c.vy = dy / length * 2150;
    c.bounces = 0; c.duration = 1.45;
    luciferBoss.stakeLaunched = true;
  }
  luciferSetFrame(m.active, 0, m.clip);
}

function luciferBeginRecovery(duration, parried = false) {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId];
  c.stage = parried ? "parry" : "recovery";
  c.elapsed = 0; c.duration = duration ?? m.recovery;
  c.recoveryZ = luciferBoss.z;
  c.sister = null; c.saving = false;
  luciferBoss.stakeLaunched = false;
  luciferBoss.vulnerable = true; luciferBoss.recovery = true;
  luciferConfine();
  if (m && (m.kind === "drill" || m.kind === "ricochet")) {
    c.recoveryZ = Math.min(110, Math.max(0, c.recoveryZ));
    luciferBoss.z = c.recoveryZ;
    spawnAsmodeusGoldenWisps(luciferBoss.x, luciferBoss.y - luciferBoss.z - 100, 10);
  }
  luciferSetFrame(parried ? LUCIFER_CLIPS.parryRecoil : m.recover, 0, parried ? "parryRecoil" : m.clip);
}

function luciferFinishAction() {
  const c = luciferBoss.combat;
  c.stage = "neutral"; c.elapsed = 0; c.moveId = null; c.hitDone = false; c.saving = false;
  luciferBoss.flavor = "idle"; luciferBoss.anim = 0; c.frame = 0;
  luciferBoss.z = 0; luciferBoss.vulnerable = false; luciferBoss.recovery = false;
  luciferBoss.attackCooldown = luciferBoss.attackQueue.length ? 0.14 : 0.3;
}

function luciferSpawnSister(aerial) {
  const c = luciferBoss.combat;
  const choices = (aerial ? ["beelzebub", "satan", "belphegor"] : ["asmodeus", "leviathan"]).filter(k => k !== c.lastSister);
  const forced = c.debug.sister;
  const kind = ["asmodeus", "leviathan", "beelzebub", "satan", "belphegor"].includes(forced) ? forced : choices[Math.floor(luciferRandom() * choices.length)];
  const spec = { asmodeus: [16, 4, 1.6, 9.5], leviathan: [18, 10, 6, 13],
    beelzebub: [18, 10, 6, 20], satan: [12, 10, 6, 15], belphegor: [16, 10, 6, 15] }[kind];
  c.lastSister = kind;
  c.sister = { kind, x: c.lockedX, y: c.lockedY, z: 0, facing: luciferBoss.facing,
    frame: 0, elapsed: 0, impactAt: 0.8, duration: 0.8 + (spec[1] - spec[2]) / spec[3],
    damage: spec[0], count: spec[1], impactFrame: spec[2], rate: spec[3], hitDone: false,
    attackId: c.attackId, aerial };
}

function luciferUpdateSister(dt) {
  const c = luciferBoss.combat, s = c.sister;
  if (!s) return;
  const before = s.elapsed;
  s.elapsed += dt;
  const raw = s.elapsed < s.impactAt ? s.elapsed / s.impactAt * s.impactFrame : s.impactFrame + (s.elapsed - s.impactAt) * s.rate;
  s.frame = Math.min(s.count - 1, raw);
  s.z = s.aerial ? Math.max(0, 130 * (1 - s.elapsed / s.impactAt)) : 0;
  if (before < s.impactAt && s.elapsed >= s.impactAt && luciferSweptContact(s.x, s.y, s.x, s.y, player.x, player.y, 92, 44)) {
    luciferApplyHit({ damage: s.damage, parry: false }, s, `sister:${s.kind}`, Math.sign(player.x - s.x) || s.facing);
  }
  if (s.elapsed >= s.duration) {
    c.sisterCooldown = c.phase >= 3 ? 6 : 8;
    luciferBeginRecovery(0.8);
  }
}

function luciferParryIndicatorActive() {
  const c = luciferBoss.combat, m = c && LUCIFER_MOVES[c.moveId];
  return !!(luciferBoss.active && luciferBoss.hp > 0 && m?.parry && !c.hitDone && !c.saving
    && (c.stage === "startup" || c.stage === "active" && m.kind === "drill"));
}

function luciferParryTimeUntilImpact() {
  if (!luciferParryIndicatorActive()) return Infinity;
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId];
  if (m.kind !== "drill") return c.stage === "startup" ? c.duration - c.elapsed : Infinity;
  const projected = c.stage === "startup" ? luciferProjectedMove(m) : c;
  const originX = c.stage === "startup" ? luciferBoss.x : c.originX;
  const originY = c.stage === "startup" ? luciferBoss.y : c.originY;
  const vx = (projected.endX - originX) / m.activeDuration / (m.radius + 18);
  const vy = (projected.endY - originY) / m.activeDuration / m.radius;
  const qx = (luciferBoss.x - player.x) / (m.radius + 18);
  const qy = (luciferBoss.y - player.y) / m.radius;
  const aa = vx * vx + vy * vy, bb = 2 * (qx * vx + qy * vy), cc = qx * qx + qy * qy - 1;
  if (cc <= 0) return c.stage === "startup" ? c.duration - c.elapsed : 0;
  const disc = bb * bb - 4 * aa * cc;
  if (aa < 1e-9 || disc < 0) return Infinity;
  const t = (-bb - Math.sqrt(disc)) / (2 * aa);
  const available = c.stage === "startup" ? m.activeDuration : c.duration - c.elapsed;
  if (t < 0 || t > available) return Infinity;
  return t + (c.stage === "startup" ? c.duration - c.elapsed : 0);
}

function luciferParryTimingReady() {
  if (!luciferParryIndicatorActive() || luciferPlayerProtected()) return false;
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId];
  if (m.kind !== "drill" && !luciferMeleeContact({ ...m, reach: parryDistanceWithReflex(m.reach) })) return false;
  const remaining = luciferParryTimeUntilImpact();
  return parryRingReadyWithReflex(32 + remaining * 100, 32, 16);
}

function resolveLuciferParry(attackId, kind = "punch") {
  const c = luciferBoss.combat;
  if (!luciferBoss.active || luciferBoss.hp <= 0 || !c || c.attackId !== attackId || c.stage === "parry" || !LUCIFER_MOVES[c.moveId]?.parry) return false;
  if (c.stage !== "startup" && c.stage !== "active" && !c.saving) return false;
  c.hitDone = true; c.sister = null;
  luciferBoss.attackQueue = [];
  groundPlayerForParry();
  beginTechniqueEvent(); runStats.parriesPerformed += 1;
  grantParryResolve(); awardTechniqueBonus("parry");
  startGoatParryCounter(kind, Math.sign(luciferBoss.x - player.x) || player.facing);
  luciferBeginRecovery(1.2, true);
  enemyFreezeTimer = Math.max(enemyFreezeTimer, 0.2);
  burst(luciferBoss.x, luciferBoss.y - 110, "special");
  message = "Parry — Lucifer exposed"; messageTimer = 0.85;
  return true;
}

function tryLuciferParry(kind) {
  if (state !== "playing" || (kind !== "punch" && kind !== "kick") || !luciferParryIndicatorActive()) return false;
  if (!luciferParryTimingReady()) { luciferBoss.combat.parryAttempted = true; return false; }
  return resolveLuciferParry(luciferBoss.combat.attackId, kind);
}

function queueLuciferAttack(kind = "slash") {
  if (luciferBoss.active && luciferBoss.hp > 0 && LUCIFER_MOVES[kind]) luciferBoss.attackQueue.push(kind);
}
function queueLuciferSlashChain(count = 3) { for (let i = 0; i < count; i++) queueLuciferAttack("slash"); }
function queueLuciferDefaultChain() { queueLuciferAttack("slash"); queueLuciferAttack("slash"); queueLuciferAttack("stakeFlip"); }
function startLuciferSlash() { return startLuciferMove("slash"); }
function startLuciferStakeFlip() { return startLuciferMove("stakeFlip"); }
function luciferCanStartQueuedAttack() { return luciferBoss.active && luciferBoss.hp > 0 && luciferBoss.combat?.stage === "neutral" && luciferBoss.attackCooldown <= 0; }
function startNextLuciferQueuedAttack() {
  if (!luciferCanStartQueuedAttack() || !luciferBoss.attackQueue.length) return false;
  const next = luciferBoss.attackQueue.shift();
  if (!luciferMoveAvailable(next) || !luciferMoveFits(next)) { luciferBoss.attackQueue = []; return false; }
  return startLuciferMove(next);
}

function luciferChoosePattern() {
  const c = luciferBoss.combat;
  const eligible = p => p.phase <= c.phase && p.id !== c.lastPattern && p.moves.every(luciferMoveAvailable) && luciferMoveFits(p.moves[0]);
  const combos = LUCIFER_PATTERNS.filter(eligible);
  const singles = Object.entries(LUCIFER_MOVES).filter(([k, m]) => k !== "burst" && luciferMoveAvailable(k) && luciferMoveFits(k))
    .map(([key, m]) => ({ id: `single:${key}`, phase: m.phase, moves: [key] })).filter(eligible);
  const pool = combos.length && (luciferRandom() < 2 / 3 || !singles.length) ? combos : singles;
  if (!pool.length) return false;
  const pattern = pool[Math.floor(luciferRandom() * pool.length)];
  c.lastPattern = pattern.id;
  c.patternHistory.push(pattern.id); if (c.patternHistory.length > 40) c.patternHistory.shift();
  luciferBoss.attackQueue = [...pattern.moves];
  return startNextLuciferQueuedAttack();
}

function luciferUpdateNeutral(dt) {
  const c = luciferBoss.combat;
  const required = luciferRequiredPhase();
  if (required > c.phase) {
    c.phase = required; c.stage = "transition"; c.elapsed = 0; c.duration = 0.8;
    c.sister = null; luciferBoss.attackQueue = [];
    luciferBoss.vulnerable = true; luciferBoss.recovery = true;
    return;
  }
  luciferBoss.attackCooldown = Math.max(0, luciferBoss.attackCooldown - dt);
  luciferBoss.facing = player.x >= luciferBoss.x ? 1 : -1;
  if (luciferBoss.blockTimer > 0) {
    luciferBoss.blockTimer = Math.max(0, luciferBoss.blockTimer - dt);
    luciferSetFrame(luciferFrames.block, 1 - luciferBoss.blockTimer / 0.34, "block");
  } else luciferSetFrame(luciferFrames.idle, (c.time * 0.8) % 1, "idle");
  if (luciferBoss.attackCooldown > 0 || luciferPlayerProtected()) return;
  if (c.debug.freezeAI) return;
  if (c.burstCooldown <= 0 && c.guardedHits.length >= 3 && luciferMoveFits("burst")) { luciferBoss.attackQueue = []; startLuciferMove("burst"); return; }
  if (!luciferBoss.attackQueue.length && c.repositionCooldown <= 0 && Math.abs(player.x - luciferBoss.x) < 145 && luciferRandom() < 0.22) {
    c.stage = "approach"; c.elapsed = 0; c.duration = 0.65; c.repositionCount++;
    c.evade = true; c.repositionCooldown = 4;
    c.repositionClip = ["retreat", "turnRetreat", "acrobat"][c.repositionCount % 3];
    return;
  }
  if (startNextLuciferQueuedAttack() || luciferChoosePattern()) return;
  c.stage = "approach"; c.elapsed = 0; c.duration = 1.2;
  c.evade = false;
  c.repositionCount++;
  c.repositionClip = c.repositionCount % 5 === 0 ? "acrobat" : c.repositionCount % 3 === 0 ? "dash" : "approach";
}

function luciferUpdateApproach(dt) {
  const c = luciferBoss.combat;
  c.elapsed += dt;
  if (luciferRequiredPhase() > c.phase) { c.stage = "neutral"; return; }
  const dx = player.x - luciferBoss.x, dy = player.y - luciferBoss.y;
  luciferBoss.facing = dx >= 0 ? 1 : -1;
  const retreat = c.evade || Math.abs(dx) < 85;
  const stepX = Math.sign(dx) * (retreat ? -1 : 1) * Math.min(220 * dt, Math.abs(Math.abs(dx) - 115));
  luciferBoss.x += stepX;
  luciferBoss.y += Math.sign(dy) * Math.min(Math.abs(dy), 140 * dt);
  luciferConfine();
  const clip = c.evade ? c.repositionClip : retreat ? (c.repositionCount % 2 ? "retreat" : "turnRetreat") : c.repositionClip;
  luciferSetFrame(LUCIFER_CLIPS[clip], (c.elapsed / 0.65) % 1, clip);
  luciferBoss.z = clip === "acrobat" ? Math.sin(Math.min(1, c.elapsed / 0.65) * Math.PI) * 55 : 0;
  if (c.elapsed >= c.duration || !c.evade && Math.abs(dx) <= 180 && Math.abs(dy) <= 36 && c.elapsed >= 0.3) {
    c.stage = "neutral"; luciferBoss.z = 0; luciferBoss.attackCooldown = 0.12;
  }
}

function luciferUpdateStartup(dt) {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId], a = luciferArena();
  c.elapsed = Math.min(c.duration, c.elapsed + dt);
  c.targetX = clamp(player.x, a.left, a.right); c.targetY = clamp(player.y, a.top, a.bottom);
  luciferBoss.facing = player.x >= luciferBoss.x ? 1 : -1;
  if (m.kind === "ricochet") {
    const t = c.elapsed / c.duration;
    luciferBoss.x = clamp(c.originX - luciferBoss.facing * Math.sin(t * Math.PI / 2) * 130, a.left, a.right);
    luciferBoss.z = Math.sin(t * Math.PI) * 82 + t * 118;
  } else if (m.aerial) luciferBoss.z = Math.min(1, c.elapsed / Math.max(0.35, c.prelude)) * 100;
  if (c.elapsed < c.prelude) {
    const list = m.aerial ? [...LUCIFER_CLIPS.jumpStart, ...LUCIFER_CLIPS.jumpLaunch] : LUCIFER_CLIPS.crouch;
    luciferSetFrame(list, c.elapsed / c.prelude, m.aerial ? "jumpStart" : "crouch");
  } else luciferSetFrame(m.startup, (c.elapsed - c.prelude) / m.windup, m.clip);
  if (c.elapsed >= c.duration - 1e-8) luciferBeginActive();
}

function luciferUpdateRicochet(dt) {
  const c = luciferBoss.combat, a = luciferArena(), oldX = luciferBoss.x, oldY = c.screenY;
  let x = oldX + c.vx * dt, y = oldY + c.vy * dt;
  if (x < a.left || x > a.right) { x = clamp(x, a.left, a.right); c.vx *= -1; c.bounces++; }
  if (y < 50 || y > a.bottom - 90) { y = clamp(y, 50, a.bottom - 90); c.vy *= -1; c.bounces++; }
  luciferBoss.x = x; c.screenY = y; luciferBoss.z = luciferBoss.y - y - 112;
  luciferBoss.facing = c.vx >= 0 ? 1 : -1;
  if (luciferSweptContact(oldX, oldY, x, y, player.x, player.y - 112, 52, 40)) luciferApplyHit(LUCIFER_MOVES.stakeFlip, c, "stakeFlip", Math.sign(c.vx));
  if (c.hitDone && !c.saving || c.bounces >= 5) luciferBeginRecovery();
}

function luciferUpdateActive(dt) {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId];
  if (c.saving) {
    c.saveWait += dt;
    if (c.saveWait > 2) { c.saving = false; luciferBeginRecovery(); }
    return;
  }
  c.elapsed = Math.min(c.duration, c.elapsed + dt);
  luciferSetFrame(m.active, m.kind === "drill" && c.moveId === "transform" ? (c.elapsed * 12 / m.active.length) % 1 : c.elapsed / c.duration, m.clip);
  if (m.kind === "command") { luciferUpdateSister(dt); return; }
  if (m.kind === "ricochet") luciferUpdateRicochet(dt);
  else {
    const t = clamp(c.elapsed / c.duration, 0, 1), prevX = luciferBoss.x, prevY = luciferBoss.y;
    luciferBoss.x = c.originX + (c.endX - c.originX) * t;
    luciferBoss.y = c.originY + (c.endY - c.originY) * t;
    if (m.aerial) luciferBoss.z = m.kind === "drill" || c.moveId === "airKick" ? 100 * (1 - t) : 100;
    const touches = m.kind === "drill"
      ? luciferSweptContact(prevX, prevY, luciferBoss.x, luciferBoss.y, player.x, player.y, m.radius + 18, m.radius)
      : m.kind === "burst" ? luciferSweptContact(luciferBoss.x, luciferBoss.y, luciferBoss.x, luciferBoss.y, player.x, player.y, m.reach, m.depth)
      : luciferMeleeContact(m, prevX, luciferBoss.x);
    if (touches) luciferApplyHit(m, c, c.moveId, Math.sign(player.x - luciferBoss.x) || luciferBoss.facing);
    c.previousX = prevX; c.previousY = prevY;
  }
  if (c.stage === "active" && c.elapsed >= c.duration - 1e-8 && !c.saving) luciferBeginRecovery();
}

function luciferUpdateRecovery(dt) {
  const c = luciferBoss.combat, m = LUCIFER_MOVES[c.moveId];
  c.elapsed = Math.min(c.duration, c.elapsed + dt);
  const t = c.elapsed / c.duration;
  luciferBoss.z = (c.recoveryZ || 0) * Math.max(0, 1 - t / 0.55);
  if (c.stage === "parry") luciferSetFrame(LUCIFER_CLIPS.parryRecoil, Math.min(1, t * 3), "parryRecoil");
  else if (m.aerial || m.kind === "ricochet" || m.kind === "drill" || c.moveId === "lowDive") {
    if (t < 0.45) luciferSetFrame(m.recover, t / 0.45, m.clip);
    else luciferSetFrame(LUCIFER_CLIPS.landing, (t - 0.45) / 0.55, "landing");
  } else if (c.moveId.startsWith("ribbon")) {
    if (c.moveId === "ribbonJab") luciferSetFrame(LUCIFER_CLIPS.crouchExit, t, "crouchExit");
    else if (t > 0.65) luciferSetFrame(LUCIFER_CLIPS.crouchExit, (t - 0.65) / 0.35, "crouchExit");
    else luciferSetFrame(m.recover, t / 0.65, m.clip);
  }
  else luciferSetFrame(m.recover, t, m.clip);
  if (c.elapsed >= c.duration - 1e-8) luciferFinishAction();
}

function updateLucifer(dt, debugStep = false) {
  if (!luciferBoss.active) { if (luciferBoss.combat) luciferBoss.combat.sister = null; return; }
  if (!luciferBoss.combat) resetLuciferCombat();
  const c = luciferBoss.combat;
  if (c.debug.paused && !debugStep) return;
  if (!Number.isFinite(dt) || dt <= 0) return;
  if (luciferBoss.flavor === "defeated") {
    c.sister = null;
    luciferBoss.defeatTimer = Math.max(0, luciferBoss.defeatTimer - dt);
    c.frame = luciferFrames.idle[Math.floor((c.time += dt) * 8) % 10];
    if (luciferBoss.defeatTimer <= 0) finishLuciferBossDefeat();
    return;
  }
  if (state !== "playing" && !debugStep) return;
  // Fixed bounded steps make crossings, swept collision and sprite event windows stable at 30/60/120 Hz.
  let remaining = Math.min(dt, 0.25);
  while (remaining > 1e-8 && luciferBoss.active && luciferBoss.hp > 0) {
    const step = Math.min(remaining, 1 / 120); remaining -= step;
    c.time += step;
    luciferBoss.hurtFlash = Math.max(0, luciferBoss.hurtFlash - step);
    c.burstCooldown = Math.max(0, c.burstCooldown - step);
    c.transformCooldown = Math.max(0, c.transformCooldown - step);
    c.repositionCooldown = Math.max(0, c.repositionCooldown - step);
    c.sisterCooldown = Math.max(0, c.sisterCooldown - step);
    c.guardedHits = c.guardedHits.filter(h => c.time - h.time <= 2);
    if (c.stage === "neutral") luciferUpdateNeutral(step);
    else if (c.stage === "approach") luciferUpdateApproach(step);
    else if (c.stage === "startup") luciferUpdateStartup(step);
    else if (c.stage === "active") luciferUpdateActive(step);
    else if (c.stage === "recovery" || c.stage === "parry") luciferUpdateRecovery(step);
    else if (c.stage === "transition") {
      c.elapsed += step;
      luciferSetFrame(luciferFrames.idle, c.elapsed / c.duration, "idle");
      if (c.elapsed >= c.duration) luciferFinishAction();
    }
  }
}

function luciferDebugForceMove(key) {
  if (!LUCIFER_MOVES[key] || !luciferBoss.active) return false;
  const c = luciferBoss.combat;
  c.phase = Math.max(c.phase, LUCIFER_MOVES[key].phase);
  c.sister = null; luciferBoss.attackQueue = [];
  return startLuciferMove(key, { force: true });
}
function luciferDebugSetPhase(phase) {
  const c = luciferBoss.combat;
  if (!c) return;
  c.phase = clamp(Math.floor(phase), 1, 3);
  luciferBoss.hp = luciferBoss.maxHp * [1, 1, 0.65, 0.3][c.phase];
  c.sister = null; luciferBoss.attackQueue = []; luciferFinishAction();
}
function luciferDebugSetSeed(seed) {
  const c = luciferBoss.combat;
  if (c) { c.debug.seed = (Number(seed) >>> 0) || 1; c.randomState = c.debug.seed; c.lastPattern = ""; c.patternHistory = []; }
}
function luciferDebugTogglePause() { const c = luciferBoss.combat; if (c) c.debug.paused = !c.debug.paused; }
function luciferDebugStep(dt = 1 / 60) { updateLucifer(dt, true); }
