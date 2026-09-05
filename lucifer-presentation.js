"use strict";

// Cropped source images have no shared origin. Airborne poses use the hips
// plus a fixed projected-foot offset. Transformed drills instead anchor their
// impact tip to the same projected chest point as their swept collision.
const LUCIFER_AIR_ANCHORS = {
  74: [0.48, 0.53], 75: [0.51, 0.55], 76: [0.51, 0.53],
  253: [0.57, 0.51], 254: [0.61, 0.39], 255: [0.60, 0.43],
  256: [0.65, 0.55], 257: [0.69, 0.48],
  258: [0.55, 0.52], 259: [0.52, 0.51], 260: [0.55, 0.53],
  261: [0.57, 0.58], 262: [0.51, 0.55], 263: [0.49, 0.55],
  264: [0.51, 0.56], 265: [0.49, 0.48], 266: [0.52, 0.46], 267: [0.54, 0.58],
  274: [0.50, 0.62], 275: [0.51, 0.51], 276: [0.55, 0.41],
  277: [0.53, 0.60], 278: [0.51, 0.53], 279: [0.54, 0.51],
  280: [0.54, 0.55], 281: [0.62, 0.59], 282: [0.55, 0.50],
  283: [0.48, 0.61], 284: [0.55, 0.53], 285: [0.53, 0.53],
  286: [0.56, 0.42], 287: [0.52, 0.37],
  288: [0.54, 0.51], 289: [0.51, 0.51],
  334: [0.50, 0.56], 335: [0.51, 0.51], 336: [0.52, 0.49],
  337: [0.54, 0.48], 338: [0.55, 0.46], 339: [0.56, 0.46], 340: [0.55, 0.45],
  341: [0.51, 0.52], 342: [0.52, 0.48], 343: [0.53, 0.47],
  344: [0.53, 0.45], 345: [0.53, 0.43], 346: [0.53, 0.43],
  347: [0.49, 0.44], 348: [0.51, 0.46], 349: [0.49, 0.48],
  350: [0.52, 0.48], 351: [0.51, 0.49], 352: [0.51, 0.47], 353: [0.54, 0.47],
  484: [0.55, 0.53], 485: [0.53, 0.52], 486: [0.51, 0.52],
  487: [0.50, 0.51], 488: [0.49, 0.51], 489: [0.51, 0.51], 490: [0.52, 0.51]
};

function luciferAnchorForFrame(frame, img) {
  if ((frame >= 354 && frame <= 356) || (frame >= 532 && frame <= 534)) {
    return { x: img.width * 0.5, y: img.height * 0.5 };
  }
  if ((frame >= 337 && frame <= 340) || (frame >= 344 && frame <= 346)) {
    const tip = luciferFrameAnchors[frame] || { x: img.width * 0.25, y: img.height };
    return { x: tip.x, y: tip.y + 112 / LUCIFER_SPRITE_SCALE };
  }
  const hip = LUCIFER_AIR_ANCHORS[frame];
  if (hip) return { x: img.width * hip[0], y: img.height * hip[1] + 100 };
  return luciferFrameAnchors[frame] || { x: img.width * 0.5, y: img.height };
}

function drawLuciferWarningArea(x, y, width, depth, progress, label = "") {
  ctx.save();
  ctx.fillStyle = `rgba(174, 44, 104, ${0.08 + progress * 0.12})`;
  ctx.strokeStyle = "rgba(255, 162, 211, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x - cameraX, y, Math.max(12, width), Math.max(12, depth), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 235, 194, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x - cameraX, y, Math.max(12, width) * (1.35 - progress * 0.35),
    Math.max(12, depth) * (1.35 - progress * 0.35), 0, -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  if (label) {
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(12, 6, 20, 0.95)";
    ctx.lineWidth = 4;
    ctx.strokeText(label, x - cameraX, y + depth + 18);
    ctx.fillStyle = "#ffe5f2";
    ctx.fillText(label, x - cameraX, y + depth + 18);
  }
  ctx.restore();
}

function luciferWarningHull(points) {
  const sorted = points.map((point) => [...point]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const half = (list) => {
    const hull = [];
    for (const point of list) {
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) hull.pop();
      hull.push(point);
    }
    hull.pop();
    return hull;
  };
  return [...half(sorted), ...half(sorted.reverse())];
}

function luciferWarningCapsule(ax, ay, bx, by, radiusX, radiusY) {
  ctx.save();
  ctx.translate(ax - cameraX, ay);
  ctx.scale(radiusX, radiusY);
  const dx = (bx - ax) / radiusX, dy = (by - ay) / radiusY;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.arc(0, 0, 1, angle + Math.PI / 2, angle + Math.PI * 1.5);
  ctx.arc(dx, dy, 1, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.closePath();
  ctx.restore();
}

function drawLuciferTelegraphs() {
  const c = luciferBoss.combat;
  if (!c || !luciferBoss.active || luciferBoss.hp <= 0) return;
  const move = LUCIFER_MOVES[c.moveId];
  const warning = c.stage === "startup";
  const committed = c.stage === "active";
  const debug = Boolean(c.debug?.hitboxes);
  if (!move || (!warning && !committed && !debug)) return;
  if (move.kind === "command") return;
  const progress = warning ? clamp(c.elapsed / Math.max(0.001, c.duration), 0, 1) : 1;
  const originX = warning ? luciferBoss.x : c.originX;
  const originY = warning ? luciferBoss.y : c.originY;
  const projected = warning ? luciferProjectedMove(move) : { endX: c.endX, endY: c.endY };
  const endX = Number.isFinite(projected.endX) ? projected.endX : originX;
  const endY = Number.isFinite(projected.endY) ? projected.endY : originY;
  const isPass = move.kind === "drill" || move.kind === "ricochet";
  const radius = isPass ? move.radius || 34 : move.depth || 44;
  ctx.save();
  ctx.fillStyle = `rgba(174, 44, 104, ${committed ? 0.06 : 0.07 + progress * 0.13})`;
  ctx.strokeStyle = committed ? "rgba(255, 202, 128, 0.92)" : "rgba(255, 163, 202, 0.86)";
  ctx.lineWidth = committed ? 2.5 : 2;
  if (move.kind === "burst") {
    drawLuciferWarningArea(luciferBoss.x, luciferBoss.y, move.reach, move.depth, progress, "BURST");
  } else if (move.kind === "ricochet") {
    const x = luciferBoss.x, y = luciferBoss.y - (luciferBoss.z || 0) - 112;
    const dx = committed ? c.vx : c.targetX - x;
    const dy = committed ? c.vy : c.targetY - 112 - y;
    const length = Math.max(1, Math.hypot(dx, dy));
    // A short direction trace updates after each bounce; it does not promise
    // an impossible fixed lane for the entire ricochet sequence.
    ctx.beginPath();
    ctx.moveTo(x - cameraX, y);
    ctx.lineTo(x - cameraX + dx / length * 160, y + dy / length * 160);
    ctx.stroke();
  } else if (move.kind === "drill") {
    luciferWarningCapsule(originX, originY, endX, endY, radius + 18, radius);
    ctx.fill();
    ctx.stroke();
    if (warning) drawLuciferWarningArea(endX, endY, radius + 18, radius, progress);
  } else {
    const reach = move.reach || 120;
    const near = luciferBoss.facing < 0 ? -reach : -12;
    const far = luciferBoss.facing < 0 ? 12 : reach;
    const points = [];
    for (const [x, y] of [[originX, originY], [endX, endY]]) {
      points.push([x + near, y - radius], [x + far, y - radius], [x + far, y + radius], [x + near, y + radius]);
    }
    const hull = luciferWarningHull(points);
    ctx.beginPath();
    hull.forEach(([x, y], index) => index ? ctx.lineTo(x - cameraX, y) : ctx.moveTo(x - cameraX, y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (warning && (move.travel || move.aerial)) drawLuciferWarningArea(endX, endY, 18, 14, progress);
  }
  if (debug) {
    ctx.strokeStyle = c.stage === "active" ? "#ffdd55" : "#5be8ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(luciferBoss.x - cameraX - 8, luciferBoss.y);
    ctx.lineTo(luciferBoss.x - cameraX + 8, luciferBoss.y);
    ctx.moveTo(luciferBoss.x - cameraX, luciferBoss.y - 8);
    ctx.lineTo(luciferBoss.x - cameraX, luciferBoss.y + 8);
    ctx.stroke();
    if (isPass) {
      ctx.beginPath();
      const ricochet = move.kind === "ricochet";
      ctx.ellipse(luciferBoss.x - cameraX, ricochet ? luciferBoss.y - (luciferBoss.z || 0) - 112 : luciferBoss.y,
        ricochet ? 52 : radius + 18, ricochet ? 40 : radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (move.kind === "burst") {
      ctx.beginPath();
      ctx.ellipse(luciferBoss.x - cameraX, luciferBoss.y, move.reach, move.depth, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const ax = Number.isFinite(c.previousX) ? c.previousX : luciferBoss.x;
      const left = Math.min(ax, luciferBoss.x) + (luciferBoss.facing > 0 ? -12 : -move.reach);
      const right = Math.max(ax, luciferBoss.x) + (luciferBoss.facing > 0 ? move.reach : 12);
      ctx.strokeRect(left - cameraX, luciferBoss.y - radius, right - left, radius * 2);
    }
  }
  ctx.restore();
}

function drawLuciferParryRings() {
  if (!luciferParryIndicatorActive()) return;
  const c = luciferBoss.combat;
  const ready = luciferParryTimingReady();
  const untilImpact = luciferParryTimeUntilImpact();
  if (!Number.isFinite(untilImpact)) return;
  const x = luciferBoss.x - cameraX;
  const y = luciferBoss.y - (luciferBoss.z || 0) - 112;
  const radius = 36;
  const timingRadius = ready ? radius : radius + clamp(untilImpact / Math.max(0.2, c.duration), 0, 1) * 64;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawReflexParryGraceRing(x, y, radius, 0, 1);
  ctx.lineWidth = ready ? 5 : 3;
  ctx.strokeStyle = ready ? "rgba(255, 234, 85, 0.98)" : "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ready ? "rgba(255, 232, 98, 0.9)" : "rgba(255, 52, 74, 0.88)";
  ctx.lineWidth = ready ? 6 : 4;
  ctx.beginPath();
  ctx.arc(x, y, timingRadius, 0, Math.PI * 2);
  ctx.stroke();
  if (ready) {
    ctx.font = "700 12px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff0aa";
    ctx.fillText("PARRY", x, y - 48);
  }
  ctx.restore();
}

function drawLuciferSister() {
  const sister = luciferBoss.combat?.sister;
  if (!sister) return;
  const elapsed = sister.elapsed || 0;
  const warning = Math.max(0.8, sister.impactAt || 0.8);
  if (elapsed < warning) {
    const label = String(sister.kind).replace(/^./, (letter) => letter.toUpperCase());
    drawLuciferWarningArea(sister.x, sister.y, sister.radius || 90,
      sister.depth || 45, clamp(elapsed / warning, 0, 1), label);
  }
  const appearanceTime = Math.max(0, warning - 0.28);
  if (elapsed < appearanceTime) return;
  // Render-only adapters. Calling the sisters' Beatrice update routines would
  // trigger her combo chains and violate Lucifer's one-summon ownership.
  const attack = {
    x: sister.x, y: sister.y, z: sister.z || 0.001,
    facing: sister.facing || luciferBoss.facing, anim: sister.frame || 0,
    age: elapsed - appearanceTime, life: Math.max(0, sister.duration - elapsed),
    delay: 0, appeared: true
  };
  // Those three legacy draw routines locate the hips at `y`. Adapt their
  // render origin so Lucifer's sister runtime can keep `y` at the ground.
  const airborneFrames = { beelzebub: beelzebubFrames, satan: satanFrames, belphegor: belphegorFrames };
  const frameList = airborneFrames[sister.kind];
  if (frameList) {
    const frame = frameList[Math.min(frameList.length - 1, Math.floor(attack.anim))];
    const img = effectImages[`${sister.kind}${frame}`];
    if (img) attack.y -= img.height * 1.18 * (sister.kind === "beelzebub" ? 0.48 : 0.38);
  }
  const renderers = {
    asmodeus: drawAsmodeusUppercut, beelzebub: drawBeelzebubDropSlash,
    leviathan: drawLeviathanSlash, satan: drawSatanAerialLaunch,
    belphegor: drawBelphegorGroundBounceSlam
  };
  const renderer = renderers[String(sister.kind).toLowerCase()];
  if (renderer) renderer(attack);
}

let luciferDebugPanel = null;
let luciferDebugVisible = false;
let luciferDebugStatusText = "";

function luciferDebugControlsAllowed() {
  return Boolean(debugMenu.active || debugFlag("startLuciferBossWave"));
}

function updateLuciferDebugPanel() {
  if (!luciferDebugPanel) return;
  const c = luciferBoss.combat;
  luciferDebugPanel.hidden = !luciferDebugVisible || !luciferDebugControlsAllowed() || !luciferBoss.active;
  if (luciferDebugPanel.hidden || !c) return;
  const status = `Phase ${c.phase} · ${c.moveId || "neutral"} · ${c.stage}\nFrame ${c.frame} · ${c.elapsed.toFixed(3)} / ${c.duration.toFixed(3)} s`;
  if (status !== luciferDebugStatusText) {
    luciferDebugStatusText = status;
    luciferDebugPanel.querySelector("[data-status]").textContent = status;
  }
  luciferDebugPanel.querySelector("[data-pause]").textContent = c.debug?.paused ? "Resume" : "Pause";
}

function initializeLuciferDebugPanel() {
  const panel = document.createElement("section");
  panel.id = "lucifer-debug-controls";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Lucifer animation debug controls");
  panel.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:1000;width:300px;padding:12px;color:#f6eaff;background:rgba(20,12,30,.96);border:1px solid #ba8fda;border-radius:8px;font:12px/1.4 Segoe UI,Arial;box-shadow:0 4px 24px #0009;";
  panel.innerHTML = '<strong>Lucifer controls · F8</strong><pre data-status style="white-space:pre-wrap;margin:8px 0"></pre>'
    + '<label>Phase <select data-phase aria-label="Force Lucifer phase"><option>1</option><option>2</option><option>3</option></select></label> '
    + '<button type="button" data-apply-phase>Set phase</button><br>'
    + '<label>Move <select data-move aria-label="Lucifer move" style="width:245px;margin:8px 0"></select></label>'
    + '<button type="button" data-force>Play move</button> <button type="button" data-pause>Pause</button> '
    + '<button type="button" data-step>Step 1/60 s</button><br>'
    + '<label><input type="checkbox" data-hitboxes> Show hitboxes</label><br>'
    + '<label>Seed <input type="number" data-seed value="1" min="1" max="4294967295" style="width:115px;margin-top:8px"></label> '
    + '<button type="button" data-apply-seed>Set seed</button>';
  for (const [key, move] of Object.entries(LUCIFER_MOVES)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `P${move.phase} · ${move.label}`;
    panel.querySelector("[data-move]").appendChild(option);
  }
  const bind = (selector, event, handler) => panel.querySelector(selector).addEventListener(event, handler);
  bind("[data-force]", "click", () => luciferDebugForceMove(panel.querySelector("[data-move]").value));
  bind("[data-apply-phase]", "click", () => luciferDebugSetPhase(Number(panel.querySelector("[data-phase]").value)));
  bind("[data-pause]", "click", () => luciferDebugTogglePause());
  bind("[data-step]", "click", () => luciferDebugStep(1 / 60));
  bind("[data-hitboxes]", "change", (event) => {
    if (luciferBoss.combat?.debug) luciferBoss.combat.debug.hitboxes = event.target.checked;
  });
  bind("[data-apply-seed]", "click", () => luciferDebugSetSeed(Number(panel.querySelector("[data-seed]").value)));
  // Do not let typing a seed or operating a select also move/attack in game.
  for (const eventName of ["keydown", "keyup", "pointerdown", "pointerup", "click"]) {
    panel.addEventListener(eventName, (event) => event.stopPropagation());
  }
  document.body.appendChild(panel);
  luciferDebugPanel = panel;
  window.addEventListener("keydown", (event) => {
    if (event.key !== "F8" || event.repeat || !luciferDebugControlsAllowed()) return;
    if (event.target?.matches?.("input, textarea, select, [contenteditable=true]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    luciferDebugVisible = !luciferDebugVisible;
    updateLuciferDebugPanel();
  }, true);
  window.setInterval(updateLuciferDebugPanel, 250);
}

document.addEventListener("DOMContentLoaded", initializeLuciferDebugPanel, { once: true });
