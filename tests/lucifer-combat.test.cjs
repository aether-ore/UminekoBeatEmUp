"use strict";

// Run with `node --test tests/lucifer-combat.test.cjs`.
// The actual browser scripts run in a DOM-free VM. Only the browser bootstrap is
// removed; gameplay, damage, blessing, scoring and parry helpers remain real.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const zlib = require("node:zlib");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected} (+/- ${tolerance})`);

function makeBrowserStubs() {
  const noop = () => {};
  const context = new Proxy({ measureText: (text) => ({ width: String(text).length * 8 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: new Uint8ClampedArray(4) }) }, { get: (target, key) => target[key] ?? noop });
  const makeElement = () => {
    const element = {
      width: 1280, height: 720, style: { setProperty: noop }, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      getContext: () => context, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, hasAttribute: () => false,
      appendChild: noop, append: noop, remove: noop, focus: noop, contains: () => false, closest: () => null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }), querySelectorAll: () => [], querySelector: () => null,
    };
    element.parentElement = element;
    return element;
  };
  const elements = new Map();
  const document = { getElementById: (id) => { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id); }, querySelector: () => null, querySelectorAll: () => [], createElement: makeElement, addEventListener: noop, body: makeElement(), documentElement: makeElement() };
  const storage = new Map();
  const sandbox = { console, document, navigator: { maxTouchPoints: 0, userAgent: "Node validation" }, performance: { now: () => 0 }, location: { search: "", hash: "" }, URLSearchParams, Uint8ClampedArray, setTimeout: noop, clearTimeout: noop, requestAnimationFrame: noop, cancelAnimationFrame: noop, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) }, Image: class {}, addEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
  sandbox.window = sandbox;
  return sandbox;
}

function createGame() {
  const context = vm.createContext(makeBrowserStubs());
  const run = (code) => vm.runInContext(code, context, { timeout: 2000 });
  if (fs.existsSync(path.join(ROOT, "lucifer-data.js"))) vm.runInContext(read("lucifer-data.js"), context, { filename: "lucifer-data.js" });
  const source = read("game.js");
  const bootstrapIndex = source.lastIndexOf("\ninitializeTouchControls();");
  assert.ok(bootstrapIndex > 0, "locate and omit only the browser bootstrap");
  vm.runInContext(source.slice(0, bootstrapIndex), context, { filename: "game.js" });
  if (fs.existsSync(path.join(ROOT, "lucifer-combat.js"))) vm.runInContext(read("lucifer-combat.js"), context, { filename: "lucifer-combat.js" });
  run(`state = "playing"; cameraX = 0; resetLuciferBossState();
    Object.assign(luciferBoss, { active: true, hp: 1000, maxHp: 1000, x: 400, y: 550, facing: 1, attackCooldown: 0 });
    Object.assign(player, { x: 500, y: 550, z: 0, hp: 100, facing: -1, action: "idle", anim: 0, airborne: false, invuln: 0, downTime: 0, getUpTimer: 0, hurt: 0, resolve: 0, shannonBarrierHp: 0, shannonBarrierGuardTimer: 0, shannonBarrierBlockedLastHit: false });
    player.blessings = {};
    if (luciferBoss.combat) luciferBoss.combat.debug.freezeAI = true;`);
  return { context, run, boss: run("luciferBoss"), player: run("player"), tick: (dt) => run(`updateLucifer(${dt})`), move: (key) => run(`luciferDebugForceMove(${JSON.stringify(key)})`) };
}

function advance(game, seconds, fps = 120) {
  let remaining = seconds;
  while (remaining > 1e-9) { const dt = Math.min(remaining, 1 / fps); game.tick(dt); remaining -= dt; }
}

function until(game, predicate, maximum = 5, fps = 120) {
  for (let frame = 0; frame < maximum*fps; frame++) {
    if (predicate()) return frame/fps;
    game.tick(1/fps);
  }
  assert.fail(`condition not reached in ${maximum}s: ${JSON.stringify(game.boss.combat)}`);
}

function moveForClip(clip) {
  return Object.entries(catalog().moves).find(([,move]) => move.clip === clip)[0];
}

test("guarded discrete hits retain chip minimum and recovery accepts full damage", () => {
  const game = createGame();
  assert.equal(game.run("luciferTakesFullDamage()"), false);
  near(game.run("damageLucifer(.3, 0, { source: 'test:tap' })"), 1);
  near(game.run("damageLucifer(100, 0, { source: 'test:strong' })"), 12);
  game.run("luciferBoss.vulnerable = true; luciferBoss.recovery = true;");
  near(game.run("damageLucifer(100, 0, { source: 'test:recovery' })"), 100);
  game.player.blessings.lambdaDamageUp = 2;
  near(game.run("damageLucifer(100, 0, { source: 'test:blessing' })"), 110);
  near(game.run("runStats.damageDealt"), 223);
});

test("continuous guarded damage is fractional and independent of simulation FPS", () => {
  for (const fps of [30,60,120]) {
    const game = createGame();
    game.run(`for (let frame=0; frame<${fps}; frame++) damageLucifer(120/${fps}, 0, { source: "battler:specialBeam", continuous: true });`);
    near(1000-game.boss.hp, 14.4);
    near(game.run("runStats.damageDealt"), 14.4);
  }
});

const NEW_ATTACK_RANGES = [
  [183,187,1], [188,194,1], [195,200,1], [201,209,1], [210,218,1],
  [229,232,1], [233,239,1], [240,249,1], [318,324,1], [325,333,1],
  [250,257,2], [261,267,2], [274,276,2], [277,282,2], [283,287,2], [334,340,2],
  [341,346,3], [357,366,3], [465,473,3], [474,483,3], [494,502,3],
];
const RETAINED_IDS = [[0,9], [109,110], [219,228], [347,356]].flatMap(([start,end]) => Array.from({ length: end-start+1 }, (_, i) => start+i));
const range = (start, end) => Array.from({ length: end-start+1 }, (_, i) => start+i);

function catalog() {
  const context = vm.createContext({});
  vm.runInContext(read("lucifer-data.js"), context);
  return JSON.parse(vm.runInContext("JSON.stringify({ clips: LUCIFER_CLIPS, moves: LUCIFER_MOVES, patterns: LUCIFER_PATTERNS })", context));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function decodePng(filename) {
  const png = fs.readFileSync(filename);
  assert.equal(png.subarray(0,8).toString("hex"), "89504e470d0a1a0a", filename);
  let header;
  let offset = 8;
  const chunks = [];
  let ended = false;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset+4, offset+8);
    assert.equal(crc32(png.subarray(offset+4, offset+8+length)), png.readUInt32BE(offset+8+length), `${filename}: ${type} CRC`);
    const payload = png.subarray(offset+8, offset+8+length);
    if (type === "IHDR") header = payload;
    if (type === "IDAT") chunks.push(payload);
    if (type === "IEND") ended = true;
    offset += 12+length;
  }
  assert.ok(header && ended, `${filename}: complete PNG`);
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4), bitDepth = header[8], colorType = header[9];
  assert.ok(width > 0 && height > 0, `${filename}: positive dimensions`);
  assert.equal(header[12], 0, `${filename}: expected non-interlaced source`);
  const channels = { 0:1, 2:3, 3:1, 4:2, 6:4 }[colorType];
  assert.ok(channels, `${filename}: supported PNG color type`);
  const rowSize = Math.ceil(width * channels * bitDepth / 8);
  const bpp = Math.max(1, Math.ceil(channels * bitDepth / 8));
  const inflated = zlib.inflateSync(Buffer.concat(chunks));
  assert.equal(inflated.length, (rowSize+1)*height, `${filename}: decompressed scanlines`);
  const pixels = Buffer.alloc(rowSize*height);
  for (let y=0; y<height; y++) {
    const filter = inflated[y*(rowSize+1)];
    assert.ok(filter <= 4, `${filename}: valid row filter`);
    for (let x=0; x<rowSize; x++) {
      const at = y*rowSize+x, left = x>=bpp ? pixels[at-bpp] : 0, up = y>0 ? pixels[at-rowSize] : 0, upperLeft = y>0 && x>=bpp ? pixels[at-rowSize-bpp] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      if (filter === 2) predictor = up;
      if (filter === 3) predictor = Math.floor((left+up)/2);
      if (filter === 4) {
        const p = left+up-upperLeft, a=Math.abs(p-left), b=Math.abs(p-up), c=Math.abs(p-upperLeft);
        predictor = a<=b && a<=c ? left : b<=c ? up : upperLeft;
      }
      pixels[at] = (inflated[y*(rowSize+1)+1+x]+predictor)&255;
    }
  }
  return { width, height, hash: crypto.createHash("sha256").update(png).digest("hex") };
}

test("catalog preserves all 21 approved animation boundaries and phase eligibility", () => {
  const { clips, moves } = catalog();
  for (const [start,end,phase] of NEW_ATTACK_RANGES) {
    const clip = Object.keys(clips).find((key) => clips[key].includes(start) && clips[key].includes(end));
    assert.ok(clip, `${start}-${end} has one continuous clip`);
    assert.deepEqual(clips[clip], range(start,end), `${start}-${end} is not split or padded with another attack`);
    const matching = Object.entries(moves).filter(([,move]) => move.clip === clip);
    assert.equal(matching.length, 1, `${start}-${end} maps to exactly one move`);
    assert.equal(matching[0][1].phase, phase, `${matching[0][0]} phase`);
  }
  assert.equal(Object.keys(moves).length, 26, "21 new + two retained + two sister calls + burst");
  assert.equal(moves.slash.damage, 17);
  assert.equal(moves.stakeFlip.damage, 22);
});

test("attack data supplies actionable warning, active frames and full punish recovery", () => {
  const { clips, moves } = catalog();
  const tiers = { quick: [12,.35,.55], standard: [16,.45,.65], heavy: [22,.6,.85], finisher: [26,.85,1.1] };
  for (const [key,move] of Object.entries(moves)) {
    assert.ok(Array.isArray(move.startup) && move.startup.length, `${key} startup frames`);
    assert.ok(Array.isArray(move.active) && move.active.length, `${key} active frames`);
    assert.ok(Array.isArray(move.recover) && move.recover.length, `${key} recovery frames`);
    assert.ok(move.activeDuration > 0, `${key} active duration`);
    if (key === "slash" || key === "stakeFlip" || !move.damage) continue;
    const [damage,warning,recovery] = tiers[move.tier];
    assert.equal(move.damage, damage, `${key} damage`);
    assert.ok(move.windup >= warning, `${key} warning minimum`);
    assert.ok(move.recovery >= recovery, `${key} recovery minimum`);
  }
  const playedStake = [...moves.stakeFlip.startup, ...moves.stakeFlip.active, ...moves.stakeFlip.recover];
  assert.ok(playedStake.includes(354) && playedStake.includes(355), "retained stake frames 354 and 355 must be playable");
  assert.ok(Object.values(clips).some((ids) => ids.join() === "532,533,534"), "transformed stake loop exists");
});

test("all runtime sprite PNGs decode with verified CRCs and scanlines", () => {
  const { clips } = catalog();
  const ids = [...new Set([...Object.values(clips).flat(), ...RETAINED_IDS])];
  for (const id of ids) decodePng(path.join(ROOT,"assets","lucifer",`${String(id).padStart(8,"0")}.png`));
});

test("all 32 retained files match their pre-import SHA-256 baseline", () => {
  const manifest = read("docs/lucifer-animation-manifest.md");
  const entries = [...manifest.matchAll(/\| (\d{8}\.png) \| ([a-f0-9]{64}) \|/g)];
  assert.equal(entries.length, 32, "manifest contains every protected file exactly once");
  assert.deepEqual(entries.map((entry) => Number(entry[1].slice(0,8))).sort((a,b)=>a-b), RETAINED_IDS);
  for (const [,filename,expected] of entries) {
    const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT,"assets","lucifer",filename))).digest("hex");
    assert.equal(actual,expected, `${filename} must remain byte-identical`);
  }
});

test("asset directory contains precisely the selected frames and retained originals", () => {
  const { clips } = catalog();
  const selected = [...new Set([...Object.values(clips).flat(), ...RETAINED_IDS])].sort((a,b)=>a-b);
  const actual = fs.readdirSync(path.join(ROOT,"assets","lucifer")).filter((name) => /^\d{8}\.png$/i.test(name)).map((name) => Number(name.slice(0,8))).sort((a,b)=>a-b);
  assert.deepEqual(actual, selected, "omitted source clips and effect sheets are not imported");
});

test("each direct action warns, hits only while active, and cannot hit twice", async (t) => {
  for (const [key, move] of Object.entries(catalog().moves).filter(([,move]) => move.damage > 0)) {
    await t.test(key, () => {
      const game = createGame();
      game.move(key);
      game.player.x = game.boss.x + game.boss.facing * 75;
      game.player.y = game.boss.y;
      const startHp = game.player.hp;
      let elapsed = 0, firstHitAt = null;
      for (let frame = 0; frame < 5*120; frame++) {
        const beforeStage = game.boss.combat.stage;
        const beforeHp = game.player.hp;
        game.tick(1/120);
        elapsed += 1/120;
        if (game.player.hp < beforeHp) {
          assert.ok(beforeStage === "active" || game.boss.combat.stage === "active", `${key} damage outside active stage`);
          assert.ok(elapsed+1e-7 >= move.windup, `${key} hit before minimum warning`);
          assert.equal(firstHitAt, null, `${key} repeated damage in one action`);
          firstHitAt = elapsed;
        }
        if (firstHitAt !== null) {
          Object.assign(game.player, { invuln: 0, airborne: false, knockedDown: false, action: "idle", getUpTimer: 0, downTime: 0, z: 0, x: game.boss.x + game.boss.facing*35, y: game.boss.y });
        }
        if (game.boss.combat.stage === "recovery") break;
      }
      assert.notEqual(firstHitAt, null, `${key} must be able to hit a grounded target in its committed lane`);
      near(startHp-game.player.hp, move.damage);
      assert.equal(game.run("luciferTakesFullDamage()"), true, `${key} recovery is punishable`);
      const recoveryStart = game.boss.combat.elapsed;
      advance(game, Math.max(0,move.recovery-recoveryStart-.025));
      assert.equal(game.boss.combat.stage, "recovery", `${key} cannot cancel its recovery`);
      near(startHp-game.player.hp, move.damage);
    });
  }
});

test("airborne, downed and recovering players are protected from ordinary hits", async (t) => {
  const states = [ { airborne: true, z: 60 }, { knockedDown: true, downTime: .8 }, { action: "getUp", getUpTimer: .5 }, { getUpTimer: .5 } ];
  for (const flags of states) {
    await t.test(JSON.stringify(flags), () => {
      const game = createGame();
      game.move("palm");
      Object.assign(game.player, flags);
      advance(game, 1);
      assert.equal(game.player.hp,100);
    });
  }
});

test("a missed committed thrust does not turn or track the player during its active segment", () => {
  const game = createGame();
  game.player.x = 1000;
  game.move("thrust");
  until(game, () => game.boss.combat.stage === "active");
  const facing = game.boss.facing;
  game.player.x = game.boss.x - facing*75;
  game.player.y = game.boss.y + 80;
  advance(game,.25);
  assert.equal(game.boss.facing, facing);
  assert.equal(game.player.hp,100);
});

test("phase thresholds wait for the whole action and its recovery, then expose a transition", () => {
  for (const [hp,expected] of [[650,2],[300,3],[180,3]]) {
    const game = createGame();
    game.move("palm");
    game.boss.hp = hp;
    game.boss.attackQueue.push("kick");
    until(game, () => game.boss.combat.stage === "recovery");
    assert.equal(game.boss.combat.phase,1);
    advance(game,.53);
    assert.equal(game.boss.combat.phase,1, "no phase switch before minimum recovery finishes");
    until(game, () => game.boss.combat.phase === expected);
    assert.equal(game.boss.combat.stage,"transition");
    assert.equal(game.boss.attackQueue.length,0);
    assert.equal(game.boss.hp,hp, "phase changes neither heal nor gate damage");
    assert.equal(game.run("luciferTakesFullDamage()"),true);
    advance(game,.75);
    assert.equal(game.boss.combat.stage,"transition");
    assert.equal(game.run("luciferTakesFullDamage()"),true);
    advance(game,.06);
    assert.equal(game.boss.combat.stage,"neutral");
  }
});

test("invalid follow-up spacing clears the queue without snapping Lucifer into range", () => {
  const game = createGame();
  game.boss.attackCooldown=0;
  game.boss.attackQueue.push("palm","kick");
  game.player.x=1000;
  game.player.y=600;
  const x=game.boss.x, y=game.boss.y;
  assert.equal(game.run("startNextLuciferQueuedAttack()"),false);
  assert.equal(game.boss.attackQueue.length,0);
  assert.equal(game.boss.x,x);
  assert.equal(game.boss.y,y);
});

test("defeat and reset remove pending attacks, summons and parry state immediately", () => {
  const game = createGame();
  game.boss.combat.debug.sister="satan";
  game.move("commandAir");
  until(game,()=>game.boss.combat.sister !== null);
  game.boss.attackQueue.push("clawFinish");
  game.boss.combat.parryAttempted=true;
  game.run("damageLucifer(100000, 0, { source: 'test:lethal' })");
  assert.equal(game.boss.hp,0);
  assert.equal(game.boss.flavor,"defeated");
  assert.equal(game.boss.combat.sister,null);
  assert.equal(game.boss.attackQueue.length,0);
  assert.equal(game.run("luciferParryIndicatorActive()"),false);
  const hp=game.player.hp;
  advance(game,.3);
  assert.equal(game.player.hp,hp);
  game.run("resetLuciferBossState()");
  assert.equal(game.boss.active,false);
  assert.equal(game.boss.combat.sister,null);
  assert.equal(game.boss.combat.stage,"neutral");
  assert.equal(game.boss.combat.parryAttempted,false);
  assert.equal(game.boss.z,0);
});

test("burst requires three distinct recent guarded hits and cannot interrupt recovery", () => {
  const game = createGame();
  game.boss.combat.burstCooldown=0;
  game.boss.combat.debug.freezeAI=false;
  game.run(`luciferNoteGuardedHit({hitId:'one'}); luciferNoteGuardedHit({hitId:'one'}); luciferNoteGuardedHit({hitId:'two'});`);
  assert.equal(game.boss.combat.guardedHits.length,2);
  game.run("luciferNoteGuardedHit({hitId:'three'})");
  game.tick(1/120);
  assert.equal(game.boss.combat.moveId,"burst");
  const hp=game.player.hp, startX=game.player.x;
  advance(game,.64);
  assert.equal(game.player.x,startX);
  until(game,()=>game.boss.combat.stage === "recovery");
  assert.equal(game.player.hp,hp);
  assert.ok(Math.abs(game.player.x-startX)<=160);
  assert.ok(game.boss.combat.burstCooldown>11);
  game.boss.combat.burstCooldown=0;
  game.player.x=game.boss.x+80;
  game.run("luciferNoteGuardedHit({hitId:'four'}); luciferNoteGuardedHit({hitId:'five'}); luciferNoteGuardedHit({hitId:'six'});");
  advance(game,.75);
  assert.equal(game.boss.combat.stage,"recovery");
  game.boss.combat.debug.freezeAI=true;
  advance(game,2.1);
  assert.equal(game.boss.combat.guardedHits.length,0, "expired hits do not prime a later burst");
});

test("all five sister commands warn, strike once, and leave Beatrice state untouched", async (t) => {
  for (const [kind,damage] of Object.entries({asmodeus:16,leviathan:18,beelzebub:18,satan:12,belphegor:16})) {
    await t.test(kind,()=>{
      const game=createGame();
      const aerial=!['asmodeus','leviathan'].includes(kind);
      game.boss.combat.debug.sister=kind;
      const before=game.run("JSON.stringify(beatriceBoss)");
      game.move(aerial?'commandAir':'commandGround');
      until(game,()=>game.boss.combat.sister !== null);
      const sister=game.boss.combat.sister, targetX=sister.x,targetY=sister.y;
      assert.equal(sister.kind,kind);
      assert.ok(sister.impactAt>=.8);
      game.player.x=targetX+400;
      advance(game,.4);
      assert.equal(sister.x,targetX, "target marker remains fixed");
      assert.equal(sister.y,targetY);
      game.player.x=targetX;
      game.player.y=targetY;
      advance(game,.38);
      assert.equal(game.player.hp,100, "no damage before the warning expires");
      until(game,()=>game.boss.combat.stage==='recovery');
      near(100-game.player.hp,damage);
      assert.equal(game.boss.combat.sister,null);
      assert.ok(game.boss.combat.sisterCooldown>7.9 && game.boss.combat.sisterCooldown<=8);
      assert.equal(game.boss.attackQueue.length,0, "no automatic sister follow-up");
      assert.equal(game.run("JSON.stringify(beatriceBoss)"),before);
      assert.equal(game.player.beatriceDropKickBouncePending,false, "no forced catch/bounce choreography");
      assert.equal(game.run("luciferTakesFullDamage()"),true);
      advance(game,.75);
      assert.equal(game.boss.combat.stage,'recovery');
    });
  }
});

test("phase-three sister cooldown begins at completion and lasts six seconds", () => {
  const game=createGame();
  game.run("luciferDebugSetPhase(3)");
  game.move("commandGround");
  until(game,()=>game.boss.combat.stage==='active');
  assert.equal(game.boss.combat.sisterCooldown,0);
  assert.equal(game.run("luciferMoveAvailable('commandAir')"),false, "one summon at a time");
  until(game,()=>game.boss.combat.stage==='recovery');
  near(game.boss.combat.sisterCooldown,6);
  advance(game,5.8);
  assert.equal(game.run("luciferMoveAvailable('commandAir')"),false);
  advance(game,.21);
  assert.equal(game.run("luciferMoveAvailable('commandAir')"),true);
});

test("all six added parries accept Punch and Kick once and cancel follow-ups", async (t) => {
  for (const key of ["drill","heavyDrill","transform","dualSweep","risingLunge","clawFinish"]) {
    for (const kind of ['punch','kick']) await t.test(`${key}/${kind}`,()=>{
      const game=createGame();
      game.move(key);
      game.boss.attackQueue.push('palm','kick');
      assert.equal(game.run(`tryLuciferParry('${kind}')`),false,"early input remains available to ordinary attacks");
      assert.equal(game.player.action,'idle');
      until(game,()=>game.run("luciferParryTimingReady()"));
      assert.equal(game.run(`tryLuciferParry('${kind}')`),true);
      assert.equal(game.boss.combat.stage,'parry');
      assert.equal(game.boss.attackQueue.length,0);
      assert.equal(game.run("runStats.parriesPerformed"),1);
      near(game.player.resolve,15);
      assert.equal(game.run(`resolveLuciferParry(${game.boss.combat.attackId}, '${kind}')`),false);
      assert.equal(game.run("runStats.parriesPerformed"),1);
      assert.equal(game.run("luciferTakesFullDamage()"),true);
      advance(game,1.18);
      assert.equal(game.boss.combat.stage,'parry');
      advance(game,.03);
      assert.equal(game.boss.combat.stage,'neutral');
      assert.equal(game.player.hp,100);
    });
  }
});

test("distant drill parry readiness follows local impact, not global startup end", () => {
  const game=createGame();
  game.player.x=800;
  game.move('drill');
  until(game,()=>game.boss.combat.stage==='active');
  assert.equal(game.run("luciferParryTimingReady()"),false);
  until(game,()=>game.run("luciferParryTimingReady()"));
  assert.equal(game.boss.combat.stage,'active');
  const seconds=game.run("luciferParryTimeUntilImpact()");
  assert.ok(seconds>=0 && seconds<=.16+1e-7);
  assert.equal(game.player.hp,100);
});

test("Reflex expands the shared timing window for Lucifer", () => {
  const game=createGame();
  game.move('dualSweep');
  advance(game,.65);
  assert.equal(game.run("luciferParryTimingReady()"),false);
  game.player.blessings.miracleReflex=1;
  assert.equal(game.run("luciferParryTimingReady()"),true);
});

test("Kanon saves an early Lucifer attempt through a distinct, single-use context", () => {
  const game=createGame();
  game.run(`player.hp=10; player.goldenBroochLeftActive=true;
    Object.assign(kanonCompanion,{active:true,summoned:true,state:'idle',attackCharge:100,savePending:null,saveResolved:false});`);
  const beatriceBefore=game.run("JSON.stringify(beatriceBoss)");
  game.move('dualSweep');
  assert.equal(game.run("tryLuciferParry('punch')"),false);
  until(game,()=>game.boss.combat.saving);
  assert.equal(game.run("kanonCompanion.savePending.type"),'lucifer');
  assert.equal(game.run("kanonCompanion.savePending.attackId"),game.boss.combat.attackId);
  assert.equal(game.player.hp,10);
  game.run("resolveKanonSavedParry(); resolveKanonSavedParry();");
  assert.equal(game.boss.combat.stage,'parry');
  assert.equal(game.run("runStats.parriesPerformed"),1);
  assert.equal(game.run("JSON.stringify(beatriceBoss)"),beatriceBefore);
});

test("Shannon absorbs a Lucifer hit and prevents its launching reaction", () => {
  const game=createGame();
  game.player.shannonBarrierHp=50;
  game.player.shannonBarrierMax=50;
  game.move('palm');
  until(game,()=>game.boss.combat.hitDone);
  assert.equal(game.player.hp,100);
  assert.equal(game.player.shannonBarrierHp,38);
  assert.equal(game.player.airborne,false);
});

test("a dodged Lucifer hit grants Witch Time and Nightfall scales actual damage", () => {
  const dodging=createGame();
  Object.assign(dodging.player,{runState:'dodging',invuln:1,dashInvulnTimer:1});
  dodging.move('palm');
  until(dodging,()=>dodging.boss.combat.hitDone);
  assert.equal(dodging.player.hp,100);
  assert.equal(dodging.run("witchTimeActive()"),true);
  near(dodging.run("enemyDt(1/60)"),1/120);
  const nightfall=createGame();
  nightfall.run("waveEffects.active.push({id:'nightfall'})");
  nightfall.move('palm');
  until(nightfall,()=>nightfall.boss.combat.hitDone);
  near(100-nightfall.player.hp,15);
});

test("fast attacks preserve swept hits, bounded travel and frame events at 30/60/120 FPS in both directions", async (t) => {
  for (const key of ['lunge','lowDive','drill','heavyDrill','transform','stakeFlip']) {
    for (const facing of [-1,1]) await t.test(`${key}/${facing}`,()=>{
      const samples=[];
      for (const fps of [30,60,120]) {
        const game=createGame();
        game.boss.x=facing>0?300:900;
        game.player.x=game.boss.x+facing*400;
        if (key==='lunge' || key==='lowDive') game.player.x=game.boss.x+facing*160;
        game.move(key);
        game.run(`const frameEvents=new Set(); const captureFrame=luciferSetFrame;
          luciferSetFrame=function(...args){captureFrame(...args);frameEvents.add(luciferBoss.combat.frame);};`);
        const startX=game.boss.x;
        advance(game,2.5,fps);
        const move=catalog().moves[key];
        near(100-game.player.hp,move.damage);
        if (key!=='stakeFlip') assert.ok(Math.abs(game.boss.x-startX)<=move.travel+1e-7);
        samples.push({hp:game.player.hp,x:game.boss.x,y:game.boss.y,stage:game.boss.combat.stage,frames:game.run("JSON.stringify([...frameEvents].sort((a,b)=>a-b))")});
      }
      for (const sample of samples.slice(1)) {
        near(sample.hp,samples[0].hp);
        near(sample.x,samples[0].x,1e-6);
        near(sample.y,samples[0].y,1e-6);
        assert.equal(sample.stage,samples[0].stage);
        assert.equal(sample.frames,samples[0].frames);
      }
    });
  }
});

test("real seeded selection reaches every standalone, avoids repeats and favors combinations 2:1", () => {
  function select(seed) {
    const game=createGame();
    return JSON.parse(game.run(`
      luciferDebugSetPhase(3); luciferDebugSetSeed(${seed});
      var selectionTrace=[];
      for(let index=0; index<1800; index++) {
        luciferFinishAction(); luciferBoss.attackCooldown=0; luciferBoss.attackQueue=[];
        luciferBoss.combat.transformCooldown=0; luciferBoss.combat.sisterCooldown=0;
        luciferBoss.x=400; luciferBoss.y=550; player.y=550;
        player.x=400+[90,250,400][index%3];
        if(luciferChoosePattern()) selectionTrace.push(luciferBoss.combat.lastPattern);
      }
      JSON.stringify(selectionTrace);
    `));
  }
  const first=select(85117), second=select(85117), different=select(29);
  assert.deepEqual(first,second,"the same seed reproduces the exact selection sequence");
  assert.notDeepEqual(first,different);
  const expected=Object.keys(catalog().moves).filter(key=>key!=='burst');
  const seen=new Set(first.filter(key=>key.startsWith('single:')).map(key=>key.slice(7)));
  assert.deepEqual([...seen].sort(),expected.sort());
  for(let index=1;index<first.length;index++) assert.notEqual(first[index],first[index-1]);
  // At 400 px only standalones fit; weighting applies when both groups exist.
  const bothGroups=first.filter((_,index)=>index%3<2);
  const fraction=bothGroups.filter(key=>!key.startsWith('single:')).length/bothGroups.length;
  assert.ok(fraction>.62 && fraction<.71,`combination fraction ${fraction}`);
});

test("debug pause, frame stepping, phase forcing and reset remain reproducible", () => {
  const game=createGame();
  game.move('palm');
  game.run("luciferDebugTogglePause()");
  advance(game,.5);
  assert.equal(game.boss.combat.elapsed,0);
  game.run("luciferDebugStep(1/60)");
  near(game.boss.combat.elapsed,1/60);
  game.run("luciferDebugSetPhase(3)");
  assert.equal(game.boss.combat.phase,3);
  assert.equal(game.boss.hp,300);
  assert.equal(game.boss.combat.stage,'neutral');
  const randoms=game.run("luciferDebugSetSeed(182); JSON.stringify([luciferRandom(),luciferRandom(),luciferRandom()])");
  assert.equal(game.run("luciferDebugSetSeed(182); JSON.stringify([luciferRandom(),luciferRandom(),luciferRandom()])"),randoms);
  const oldId=game.boss.combat.attackId;
  game.run("resetLuciferBossState()");
  assert.ok(game.boss.combat.attackId>oldId,"reset invalidates stale parry contexts");
});

test("approach obeys axis speed caps, visible arena limits and a finite timeout", () => {
  const game=createGame();
  game.run(`Object.assign(luciferBoss.combat,{stage:'approach',elapsed:0,duration:1.2,repositionClip:'approach',repositionCount:1});`);
  game.player.x=3000;
  game.player.y=650;
  const beforeX=game.boss.x,beforeY=game.boss.y;
  game.tick(1/30);
  assert.ok(game.boss.x-beforeX<=220/30+1e-7);
  assert.ok(game.boss.y-beforeY<=140/30+1e-7);
  advance(game,1.2);
  assert.notEqual(game.boss.combat.stage,'approach');
  const arena=game.run("luciferArena()");
  assert.ok(game.boss.x>=arena.left && game.boss.x<=arena.right);
  assert.ok(game.boss.y>=arena.top && game.boss.y<=arena.bottom);
});

test("transformation cooldown prevents re-selection for fourteen seconds", () => {
  const game=createGame();
  game.move('transform');
  assert.equal(game.run("luciferMoveAvailable('transform')"),false);
  advance(game,13.9);
  assert.equal(game.run("luciferMoveAvailable('transform')"),false);
  advance(game,.11);
  assert.equal(game.run("luciferMoveAvailable('transform')"),true);
});

test("every source frame of each approved direct animation is actually emitted during playback", () => {
  const {moves,clips}=catalog();
  for(const [key,move] of Object.entries(moves).filter(([,move])=>move.damage>0)) {
    const game=createGame();
    game.player.x=1000;
    game.player.y=650;
    game.run(`const emittedFrames=new Set(); const realSetFrame=luciferSetFrame;
      luciferSetFrame=function(...args){realSetFrame(...args);emittedFrames.add(luciferBoss.combat.frame);};`);
    game.move(key);
    until(game,()=>game.boss.combat.stage==='neutral',6);
    const emitted=JSON.parse(game.run("JSON.stringify([...emittedFrames])"));
    const missing=clips[move.clip].filter(id=>!emitted.includes(id));
    assert.deepEqual(missing,[], `${key} frames must display at least once, not only be imported`);
  }
});

test("a drill lane miss cannot be parried through a wider circular approximation", () => {
  const game=createGame();
  game.player.x=650;
  game.move('drill');
  until(game,()=>game.boss.combat.stage==='active');
  game.player.y=590; // 40 px outside the 28 px half-depth at the fixed target lane.
  while(game.boss.combat.stage==='active') {
    assert.equal(game.run("luciferParryTimingReady()"),false,"parry geometry must agree with damaging ellipse");
    game.tick(1/120);
  }
  assert.equal(game.player.hp,100);
});

test("ordinary start calls cannot cancel recovery, parry or active sister ownership", () => {
  const game=createGame();
  game.move('palm');
  until(game,()=>game.boss.combat.stage==='recovery');
  game.boss.combat.burstCooldown=0;
  for(const key of ['burst','palm','slash']) assert.equal(game.run(`startLuciferMove('${key}')`),false);
  assert.equal(game.boss.combat.stage,'recovery');
  Object.assign(game.player,{airborne:false,knockedDown:false,z:0,downTime:0,getUpTimer:0,invuln:0,action:'idle'});
  game.move('dualSweep');
  until(game,()=>game.run("luciferParryTimingReady()"));
  game.run("tryLuciferParry('punch')");
  assert.equal(game.run("startLuciferMove('burst')"),false);
  assert.equal(game.boss.combat.stage,'parry');
  game.move('commandGround');
  until(game,()=>game.boss.combat.sister!==null);
  assert.equal(game.run("startLuciferMove('slash')"),false);
  assert.ok(game.boss.combat.sister);
});

test("defeat and reset clear pending Lucifer saves while preserving other Kanon contexts", () => {
  for(const operation of ['defeat','reset']) {
    for(const type of ['lucifer','goat']) {
      const game=createGame();
      game.move('dualSweep');
      game.run(`kanonCompanion.savePending={type:'${type}',attackId:luciferBoss.combat.attackId}; kanonCompanion.saveResolved=true;`);
      const pending=game.run("kanonCompanion.savePending");
      if(operation==='defeat') game.run("damageLucifer(100000, 0, {source:'test:lethal'})");
      else game.run("resetLuciferBossState()");
      if(type==='lucifer') {
        assert.equal(game.run("kanonCompanion.savePending"),null,`${operation} removes the Lucifer-owned save`);
        assert.equal(game.run("kanonCompanion.saveResolved"),false);
      } else {
        assert.equal(game.run("kanonCompanion.savePending"),pending,`${operation} preserves another encounter's save`);
        assert.equal(game.run("kanonCompanion.saveResolved"),true);
      }
    }
  }
});

test("normal selection can reach and attack players at both playable lane edges", () => {
  for(const boundary of ['PLAY_AREA_TOP','PLAY_AREA_BOTTOM']) {
    const game=createGame();
    const playerY=game.run(boundary);
    game.player.y=playerY;
    game.boss.combat.debug.freezeAI=false;
    const arena=game.run("luciferArena()");
    assert.ok(playerY>=arena.top && playerY<=arena.bottom,`${boundary} is a reachable target lane`);
    until(game,()=>game.boss.combat.stage==='startup',4);
    until(game,()=>game.player.hp<100,4);
    assert.ok(game.boss.y>=arena.top && game.boss.y<=arena.bottom);
  }
});

test("gameplay scripts initialize with actual shared helpers", () => {
  const game = createGame();
  assert.equal(game.boss.active, true);
  assert.equal(game.run("typeof damageLucifer"), "function");
  assert.equal(game.run("typeof startLuciferMove"), "function");
  assert.ok(game.boss.combat, "reset installs the combat runtime");
});

module.exports = { createGame, advance, near };
