import { projectPoint3D, toObserverCentered } from "./kepler-solver.js";

function hexToRgba(hex, alpha) {
    const clean = (hex || "#ffffff").replace("#", "");
    const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawOrbitPaths(ctx, orbitEntries, anchorPos, camBasis, w, h, activeId, hoverId) {
    ctx.save();
    for (const entry of orbitEntries) {
        const isActive = entry.id === activeId || entry.id === hoverId;
        ctx.beginPath();
        let started = false;
        let prev = null;
        for (const pt of entry.points) {
            const rel = toObserverCentered(pt, anchorPos);
            const proj = projectPoint3D(rel, camBasis, w, h);
            if (!proj || proj.ndcX < -2.2 || proj.ndcX > 2.2 || proj.ndcY < -2.2 || proj.ndcY > 2.2) {
                started = false;
                prev = null;
                continue;
            }
            if (!started || !prev || Math.hypot(proj.x - prev.x, proj.y - prev.y) > w * 0.45) {
                ctx.moveTo(proj.x, proj.y);
                started = true;
            } else {
                ctx.lineTo(proj.x, proj.y);
            }
            prev = proj;
        }
        ctx.strokeStyle = isActive ? "rgba(125, 211, 252, 0.65)" : "rgba(175, 205, 240, 0.22)";
        ctx.lineWidth = isActive ? 1.45 : 0.95;
        ctx.stroke();
    }
    ctx.restore();
}

function drawMeteorStreaks(ctx, streaks, anchorPos, camBasis, w, h) {
    ctx.save();
    ctx.lineCap = "round";
    for (const s of streaks) {
        const lifeFrac = Math.max(0, Math.min(1, s.life));
        const alpha = Math.sin(lifeFrac * Math.PI) * 0.85;
        if (alpha <= 0.02) continue;
        const travel = s.life * 18;
        const hWorld = { x: s.x + s.dx * travel, y: s.y + s.dy * travel, z: s.z + s.dz * travel };
        const tWorld = { x: hWorld.x - s.dx * s.length * 0.65, y: hWorld.y - s.dy * s.length * 0.65, z: hWorld.z - s.dz * s.length * 0.65 };
        const hp = projectPoint3D(toObserverCentered(hWorld, anchorPos), camBasis, w, h);
        const tp = projectPoint3D(toObserverCentered(tWorld, anchorPos), camBasis, w, h);
        if (!hp || !tp) continue;
        const grad = ctx.createLinearGradient(tp.x, tp.y, hp.x, hp.y);
        grad.addColorStop(0, "rgba(186, 230, 253, 0)");
        grad.addColorStop(1, `rgba(241, 249, 255, ${alpha.toFixed(3)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tp.x, tp.y);
        ctx.lineTo(hp.x, hp.y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFallbackScene2D(ctx, scene, w, h) {
    const { camBasis, starPoints, asteroidPoints, cometPoints, bodies, sunPosRel } = scene;
    ctx.fillStyle = "#0e1519";
    ctx.fillRect(0, 0, w, h);

    for (const s of starPoints) {
        const p = projectPoint3D(s, camBasis, w, h);
        if (!p || p.x < -4 || p.x > w + 4 || p.y < -4 || p.y > h + 4) continue;
        ctx.fillStyle = `rgba(${Math.round(s.r * 255)}, ${Math.round(s.g * 255)}, ${Math.round(s.b * 255)}, ${s.a.toFixed(2)})`;
        const rad = Math.max(0.7, (s.size * p.scaleY) * 0.16);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.min(2.4, rad), 0, Math.PI * 2);
        ctx.fill();
    }

    for (const a of asteroidPoints) {
        const p = projectPoint3D(a, camBasis, w, h);
        if (!p || p.x < -4 || p.x > w + 4 || p.y < -4 || p.y > h + 4) continue;
        ctx.fillStyle = `rgba(${Math.round(a.r * 255)}, ${Math.round(a.g * 255)}, ${Math.round(a.b * 255)}, ${a.a.toFixed(2)})`;
        const rad = Math.max(0.9, Math.min(4.2, a.size * 0.45 * (p.scaleY * 0.025)));
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const c of cometPoints) {
        const p = projectPoint3D(c, camBasis, w, h);
        if (!p || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) continue;
        const rad = Math.max(1.8, Math.min(26, (c.size * p.scaleY) * 0.05));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, `rgba(225, 245, 255, ${(c.a * 0.95).toFixed(2)})`);
        g.addColorStop(0.4, `rgba(96, 175, 255, ${(c.a * 0.55).toFixed(2)})`);
        g.addColorStop(1, "rgba(56, 130, 246, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    const sunProj = projectPoint3D(sunPosRel, camBasis, w, h);
    const items = [];
    for (const b of bodies) {
        const proj = projectPoint3D(b.posRel, camBasis, w, h);
        if (!proj) continue;
        items.push({ b, proj, rPx: Math.max(3, Math.min(180, b.radius * proj.scaleY)) });
    }
    items.sort((x, y) => y.proj.depth - x.proj.depth);

    for (const { b, proj, rPx } of items) {
        if (b.id === "sun") {
            const halo = ctx.createRadialGradient(proj.x, proj.y, rPx * 0.7, proj.x, proj.y, rPx * 2.1);
            halo.addColorStop(0, "rgba(255, 244, 150, 0.95)");
            halo.addColorStop(0.45, "rgba(255, 118, 32, 0.72)");
            halo.addColorStop(1, "rgba(255, 68, 12, 0)");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, rPx * 2.1, 0, Math.PI * 2);
            ctx.fill();
            const core = ctx.createRadialGradient(proj.x - rPx * 0.2, proj.y - rPx * 0.2, rPx * 0.1, proj.x, proj.y, rPx);
            core.addColorStop(0, "#fffbe0");
            core.addColorStop(0.7, "#ffdd4a");
            core.addColorStop(1, "#ff7c1e");
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, rPx, 0, Math.PI * 2);
            ctx.fill();
            continue;
        }
        if (b.hasRing) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(-0.36);
            ctx.strokeStyle = "rgba(218, 200, 170, 0.72)";
            ctx.lineWidth = Math.max(2, rPx * 0.35);
            ctx.beginPath();
            ctx.ellipse(0, 0, rPx * 2.1, rPx * 0.56, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        const lx = sunProj ? Math.cos(Math.atan2(sunProj.y - proj.y, sunProj.x - proj.x)) * rPx * 0.45 : -rPx * 0.4;
        const ly = sunProj ? Math.sin(Math.atan2(sunProj.y - proj.y, sunProj.x - proj.x)) * rPx * 0.45 : -rPx * 0.4;
        const grad = ctx.createRadialGradient(proj.x + lx, proj.y + ly, rPx * 0.1, proj.x, proj.y, rPx);
        grad.addColorStop(0, b.accentColor || "#ffffff");
        grad.addColorStop(0.65, b.color || "#93c5fd");
        grad.addColorStop(1, "#0b111a");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, rPx, 0, Math.PI * 2);
        ctx.fill();
        if (b.hasRing) {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(-0.36);
            ctx.strokeStyle = "rgba(232, 214, 185, 0.88)";
            ctx.lineWidth = Math.max(2, rPx * 0.35);
            ctx.beginPath();
            ctx.ellipse(0, 0, rPx * 2.1, rPx * 0.56, 0, 0, Math.PI);
            ctx.stroke();
            ctx.restore();
        }
    }
}

function drawFocusReticle(ctx, proj, rPx, timeSec) {
    const rad = Math.max(16, rPx + 8 + Math.sin(timeSec * 4) * 2);
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.88)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i += 1) {
        const a0 = (i * Math.PI) * 0.5 + 0.18;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, rad, a0, a0 + 0.52);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderSolarOverlay2D(ctx, scene, state) {
    const { width: w, height: h, dpr, hasWebGL, timeSec } = state;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!hasWebGL) {
        drawFallbackScene2D(ctx, scene, w, h);
    } else {
        ctx.clearRect(0, 0, w, h);
    }

    if (state.showOrbits !== false) {
        drawOrbitPaths(ctx, scene.orbitEntries, scene.anchorPos, scene.camBasis, w, h, state.activeBodyId, state.hoverBodyId);
    }
    drawMeteorStreaks(ctx, scene.meteorStreaks, scene.anchorPos, scene.camBasis, w, h);

    const projectedBodies = [];
    for (const body of scene.bodies) {
        const proj = projectPoint3D(body.posRel, scene.camBasis, w, h);
        if (!proj) continue;
        const rPx = Math.max(4, Math.min(180, body.radius * proj.scaleY));
        projectedBodies.push({ body, screenX: proj.x, screenY: proj.y, screenR: rPx, depth: proj.depth });
    }

    if (state.showLabels) {
        const placedBoxes = [];
        const sortedForLabels = [...projectedBodies].sort((a, b) => {
            if (a.body.id === state.activeBodyId) return -1;
            if (b.body.id === state.activeBodyId) return 1;
            if (a.body.id === "sun") return -1;
            if (b.body.id === "sun") return 1;
            return a.depth - b.depth;
        });

        ctx.save();
        ctx.font = "500 13px 'Google Sans', 'Inter', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        for (const item of sortedForLabels) {
            if (item.screenX < 20 || item.screenX > w - 20 || item.screenY < 20 || item.screenY > h - 24) continue;
            if (item.body.id === "moon" && state.distance > 22 && state.activeBodyId !== "earth" && state.activeBodyId !== "moon") {
                continue;
            }
            const label = item.body.name;
            const lw = ctx.measureText(label).width + 10;
            let lx = Math.max(lw * 0.5 + 8, Math.min(w - lw * 0.5 - 8, item.screenX));
            let ly = item.screenY + item.screenR + (item.body.id === "sun" ? 16 : 9);
            for (const box of placedBoxes) {
                if (Math.abs(lx - box.x) < (lw + box.w) * 0.52 && Math.abs(ly - box.y) < 18) {
                    ly = box.y + 18;
                }
            }
            if (ly > h - 18) ly = item.screenY - item.screenR - 20;
            placedBoxes.push({ x: lx, y: ly, w: lw });

            const isSel = item.body.id === state.activeBodyId || item.body.id === state.hoverBodyId;
            ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
            ctx.shadowBlur = 6;
            ctx.fillStyle = isSel ? "#7dd3fc" : "#f8fafc";
            ctx.fillText(label, lx, ly);
            if (isSel && state.activeBodyId === item.body.id && state.focusReticleVisible) {
                drawFocusReticle(ctx, { x: item.screenX, y: item.screenY }, item.screenR, timeSec);
            }
        }
        ctx.restore();
    }

    if (state.hoverBodyId) {
        const hov = projectedBodies.find((p) => p.body.id === state.hoverBodyId);
        if (hov) {
            ctx.save();
            ctx.strokeStyle = hexToRgba(hov.body.accentColor || "#38bdf8", 0.72);
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(hov.screenX, hov.screenY, hov.screenR + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    return projectedBodies;
}

export function hitTestSolarBody(px, py, projectedBodies) {
    let best = null;
    let bestDepth = Infinity;
    for (const item of projectedBodies || []) {
        const hitRadius = Math.max(18, item.screenR + 10);
        const dist = Math.hypot(px - item.screenX, py - item.screenY);
        if (dist <= hitRadius && item.depth < bestDepth) {
            bestDepth = item.depth;
            best = item;
        }
    }
    return best;
}
