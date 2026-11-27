import { normalizeRoomCode } from "./voxel-lan-net.js";
import { PLAYER_OUTFITS } from "./voxel-player-model.js";
import { getSafeStorage } from "./voxel-ui-layout.js";

const PROFILE_STORAGE_KEY = "voxel.lan.profile.v1";
const NAMETAG_MAX_DIST = 64;

function loadStoredProfile(storage) {
    const fallback = { name: "Explorer", outfit: PLAYER_OUTFITS[0].id };
    if (!storage) return fallback;
    try {
        const raw = storage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return fallback;
        return {
            name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim().slice(0, 18) : fallback.name,
            outfit: typeof parsed.outfit === "string" ? parsed.outfit : fallback.outfit
        };
    } catch {
        return fallback;
    }
}

function saveStoredProfile(storage, profile) {
    if (!storage) return;
    try {
        storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
        return;
    }
}

function formatPathLabel(path, rttMs) {
    const ms = typeof rttMs === "number" ? ` ${rttMs}ms` : "";
    if (path === "lan-direct") return `Direct LAN${ms}`;
    if (path === "p2p-stun") return `Direct P2P${ms}`;
    if (path === "relay") return `LAN Relay${ms}`;
    return "Connecting...";
}

export function createLanUi({ root, state, session, storage = getSafeStorage() }) {
    const cleanups = [];
    const listen = (el, type, fn) => {
        if (!el) return;
        el.addEventListener(type, fn);
        cleanups.push(() => el.removeEventListener(type, fn));
    };

    const modalEl = root.querySelector("[data-voxel-lan-modal]");
    const closeBtn = root.querySelector("[data-voxel-lan-close]");
    const nameInput = root.querySelector("[data-lan-name]");
    const swatchesEl = root.querySelector("[data-lan-swatches]");
    const netBadgeEl = root.querySelector("[data-lan-net-badge]");
    const refreshNetBtn = root.querySelector("[data-lan-refresh]");
    const errorEl = root.querySelector("[data-lan-error]");
    const strictCheck = root.querySelector("[data-lan-strict]");
    const hostBtn = root.querySelector("[data-lan-host-btn]");
    const leaveBtn = root.querySelector("[data-lan-leave-btn]");
    const roomInfoEl = root.querySelector("[data-lan-room-info]");
    const roomCodeEl = root.querySelector("[data-lan-room-code]");
    const copyCodeBtn = root.querySelector("[data-lan-copy-code]");
    const rosterSection = root.querySelector("[data-lan-roster-section]");
    const rosterEl = root.querySelector("[data-lan-roster]");
    const worldsListEl = root.querySelector("[data-lan-worlds]");
    const codeInput = root.querySelector("[data-lan-code-input]");
    const joinCodeBtn = root.querySelector("[data-lan-join-code]");
    const offCreateBtn = root.querySelector("[data-lan-off-create]");
    const offJoinBtn = root.querySelector("[data-lan-off-join]");
    const offCompleteBtn = root.querySelector("[data-lan-off-complete]");
    const offOutArea = root.querySelector("[data-lan-off-out]");
    const offInArea = root.querySelector("[data-lan-off-in]");
    const telLanEl = root.querySelector("[data-tel-lan]");
    const nametagsEl = root.querySelector("[data-voxel-nametags]");
    const chatBoxEl = root.querySelector("[data-voxel-lan-chat]");
    const chatLogEl = root.querySelector("[data-lan-chat-log]");
    const chatFormEl = root.querySelector("[data-lan-chat-form]");
    const chatInputEl = root.querySelector("[data-lan-chat-input]");

    const stored = loadStoredProfile(storage);
    session.setProfile(stored.name, stored.outfit);
    if (nameInput) nameInput.value = stored.name;

    let pendingOfflinePeerId = null;
    const tagPool = new Map();

    if (swatchesEl) {
        swatchesEl.innerHTML = "";
        for (const o of PLAYER_OUTFITS) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "voxel-lan-swatch";
            btn.style.background = o.swatch;
            btn.dataset.outfitId = o.id;
            btn.setAttribute("aria-label", `${o.label} outfit`);
            btn.setAttribute("aria-pressed", String(o.id === stored.outfit));
            listen(btn, "click", () => {
                session.setProfile(undefined, o.id);
                saveStoredProfile(storage, session.getSnapshot().profile);
            });
            swatchesEl.appendChild(btn);
        }
    }

    const setModalOpen = (open) => {
        state.lanOpen = Boolean(open);
        if (modalEl) modalEl.hidden = !state.lanOpen;
        if (state.lanOpen) {
            if (document.pointerLockElement && document.exitPointerLock) {
                document.exitPointerLock();
            }
            session.startScan();
        }
    };

    const setChatOpen = (open) => {
        if (open && !session.isConnected()) return;
        state.chatOpen = Boolean(open);
        if (chatFormEl) chatFormEl.hidden = !state.chatOpen;
        if (state.chatOpen) {
            if (document.pointerLockElement && document.exitPointerLock) {
                document.exitPointerLock();
            }
            if (chatInputEl) chatInputEl.focus();
        } else if (chatInputEl) {
            chatInputEl.blur();
        }
    };

    listen(closeBtn, "click", () => setModalOpen(false));
    listen(modalEl, "click", (e) => {
        if (e.target === modalEl) setModalOpen(false);
    });

    listen(nameInput, "input", () => {
        session.setProfile(nameInput.value, undefined);
        saveStoredProfile(storage, session.getSnapshot().profile);
    });

    listen(refreshNetBtn, "click", () => {
        session.refreshNetwork();
    });

    listen(strictCheck, "change", () => {
        session.setStrictSameNet(strictCheck.checked);
    });

    listen(hostBtn, "click", () => {
        const snap = session.getSnapshot();
        if (snap.role === "host") {
            session.leaveSession("Stopped hosting LAN world.");
            return;
        }
        session.hostWorld({
            playerName: nameInput ? nameInput.value : snap.profile.name,
            outfit: snap.profile.outfit,
            strictSameNet: strictCheck ? strictCheck.checked : true
        });
    });

    listen(leaveBtn, "click", () => {
        session.leaveSession();
    });

    listen(copyCodeBtn, "click", () => {
        const snap = session.getSnapshot();
        if (!snap.room || !snap.room.roomCode) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(snap.room.roomCode).catch(() => {});
        }
        copyCodeBtn.textContent = "Copied!";
        globalThis.setTimeout(() => {
            copyCodeBtn.textContent = "Copy";
        }, 1200);
    });

    listen(codeInput, "input", () => {
        codeInput.value = normalizeRoomCode(codeInput.value);
    });

    listen(joinCodeBtn, "click", () => {
        const code = codeInput ? normalizeRoomCode(codeInput.value) : "";
        const snap = session.getSnapshot();
        session.joinByCode(code, {
            playerName: nameInput ? nameInput.value : snap.profile.name,
            outfit: snap.profile.outfit
        });
    });

    listen(offCreateBtn, "click", async () => {
        if (!offOutArea) return;
        offOutArea.value = "Generating local LAN offer...";
        try {
            const snap = session.getSnapshot();
            const res = await session.createOfflineHostOffer({
                playerName: nameInput ? nameInput.value : snap.profile.name,
                outfit: snap.profile.outfit
            });
            pendingOfflinePeerId = res.peerId;
            offOutArea.value = res.code;
        } catch (err) {
            offOutArea.value = `Failed: ${err && err.message ? err.message : "WebRTC error"}`;
        }
    });

    listen(offJoinBtn, "click", async () => {
        if (!offInArea || !offOutArea) return;
        offOutArea.value = "Creating answer...";
        try {
            const snap = session.getSnapshot();
            const res = await session.joinOfflineOffer(offInArea.value, {
                playerName: nameInput ? nameInput.value : snap.profile.name,
                outfit: snap.profile.outfit
            });
            offOutArea.value = res.answerCode;
        } catch (err) {
            offOutArea.value = `Invalid offer: ${err && err.message ? err.message : "check code"}`;
        }
    });

    listen(offCompleteBtn, "click", async () => {
        if (!offInArea || !pendingOfflinePeerId) return;
        try {
            await session.completeOfflineOffer(pendingOfflinePeerId, offInArea.value);
            pendingOfflinePeerId = null;
        } catch (err) {
            if (offOutArea) offOutArea.value = `Invalid answer: ${err && err.message ? err.message : "check code"}`;
        }
    });

    listen(chatFormEl, "submit", (e) => {
        e.preventDefault();
        if (!chatInputEl) return;
        const text = chatInputEl.value;
        if (text.trim()) session.sendChat(text);
        chatInputEl.value = "";
        setChatOpen(false);
    });

    const renderSnapshot = (snap) => {
        if (swatchesEl) {
            swatchesEl.querySelectorAll(".voxel-lan-swatch").forEach((btn) => {
                btn.setAttribute("aria-pressed", String(btn.dataset.outfitId === snap.profile.outfit));
            });
        }
        if (netBadgeEl) {
            netBadgeEl.classList.remove("is-ok", "is-warn");
            if (snap.netInfo.mode === "detecting") {
                netBadgeEl.textContent = "Detecting WiFi / Hotspot...";
            } else if (snap.netInfo.mode === "lan" && snap.signaling.connected) {
                netBadgeEl.classList.add("is-ok");
                netBadgeEl.textContent = `Same-Network Ready (${snap.netInfo.netId.slice(0, 6)})`;
            } else if (snap.netInfo.mode === "lan") {
                netBadgeEl.classList.add("is-warn");
                netBadgeEl.textContent = `Connecting Relay (${snap.netInfo.netId.slice(0, 6)})`;
            } else {
                netBadgeEl.classList.add("is-warn");
                netBadgeEl.textContent = "Offline / Local Tabs Only";
            }
        }
        if (errorEl) {
            errorEl.hidden = !snap.error;
            errorEl.textContent = snap.error || "";
        }
        if (hostBtn) {
            hostBtn.textContent = snap.role === "host" ? "Stop Hosting" : "Host on LAN";
            hostBtn.setAttribute("aria-pressed", String(snap.role === "host"));
            hostBtn.disabled = snap.role === "guest" || snap.role === "joining";
        }
        if (leaveBtn) {
            leaveBtn.hidden = snap.role !== "guest" && snap.role !== "joining";
        }
        if (roomInfoEl && roomCodeEl) {
            const showRoom = snap.role === "host" && snap.room && snap.room.roomCode;
            roomInfoEl.hidden = !showRoom;
            if (showRoom) roomCodeEl.textContent = snap.room.roomCode;
        }
        if (rosterSection && rosterEl) {
            const connected = snap.role === "host" || snap.role === "guest";
            rosterSection.hidden = !connected;
            if (connected) {
                rosterEl.innerHTML = "";
                const selfRow = document.createElement("div");
                selfRow.className = "voxel-lan-item";
                const selfMeta = document.createElement("div");
                selfMeta.className = "voxel-lan-item-meta";
                const selfTitle = document.createElement("span");
                selfTitle.className = "voxel-lan-item-title";
                selfTitle.textContent = `${snap.profile.name} (You)`;
                const selfSub = document.createElement("span");
                selfSub.className = "voxel-lan-item-sub";
                selfSub.textContent = snap.role === "host" ? "Host" : "Guest";
                selfMeta.append(selfTitle, selfSub);
                selfRow.appendChild(selfMeta);
                rosterEl.appendChild(selfRow);

                for (const p of snap.peers) {
                    const row = document.createElement("div");
                    row.className = "voxel-lan-item";
                    const meta = document.createElement("div");
                    meta.className = "voxel-lan-item-meta";
                    const title = document.createElement("span");
                    title.className = "voxel-lan-item-title";
                    title.textContent = p.name;
                    const sub = document.createElement("span");
                    sub.className = "voxel-lan-item-sub";
                    sub.textContent = formatPathLabel(p.path, p.rttMs);
                    meta.append(title, sub);
                    row.appendChild(meta);
                    if (snap.role === "host") {
                        const kick = document.createElement("button");
                        kick.type = "button";
                        kick.className = "voxel-btn voxel-btn-danger";
                        kick.textContent = "Kick";
                        kick.addEventListener("click", () => session.kickPeer(p.id));
                        row.appendChild(kick);
                    }
                    rosterEl.appendChild(row);
                }
            }
        }
        if (worldsListEl) {
            worldsListEl.innerHTML = "";
            if (snap.discoveredRooms.length === 0) {
                const empty = document.createElement("div");
                empty.className = "voxel-lan-empty";
                empty.textContent = "No LAN worlds found on your WiFi or hotspot yet. Ask a friend to click Host on LAN.";
                worldsListEl.appendChild(empty);
            } else {
                for (const r of snap.discoveredRooms) {
                    const row = document.createElement("div");
                    row.className = "voxel-lan-item";
                    const meta = document.createElement("div");
                    meta.className = "voxel-lan-item-meta";
                    const title = document.createElement("span");
                    title.className = "voxel-lan-item-title";
                    title.textContent = `${r.hostName}'s World`;
                    const sub = document.createElement("span");
                    sub.className = "voxel-lan-item-sub";
                    const scope = r.viaLocal ? "Same Device" : "Same Network";
                    sub.textContent = `${r.playerCount}/${r.maxPlayers} players · ${scope}`;
                    meta.append(title, sub);
                    const join = document.createElement("button");
                    join.type = "button";
                    join.className = "voxel-btn";
                    join.dataset.lanJoinRoom = r.roomId;
                    join.textContent = snap.role === "joining" ? "Joining..." : "Join";
                    join.disabled = snap.role !== "idle";
                    join.addEventListener("click", () => {
                        session.joinRoom(r, {
                            playerName: nameInput ? nameInput.value : snap.profile.name,
                            outfit: snap.profile.outfit
                        });
                    });
                    row.append(meta, join);
                    worldsListEl.appendChild(row);
                }
            }
        }
        if (telLanEl) {
            const active = snap.role === "host" || snap.role === "guest";
            telLanEl.hidden = !active;
            if (active) {
                const firstPeer = snap.peers[0];
                const extra = firstPeer ? ` · ${formatPathLabel(firstPeer.path, firstPeer.rttMs)}` : snap.room ? ` · Code ${snap.room.roomCode}` : "";
                telLanEl.textContent = `LAN ${snap.playerCount}/${snap.room ? snap.room.maxPlayers : 8}${extra}`;
            }
        }
        if (chatBoxEl && chatLogEl) {
            const active = snap.role === "host" || snap.role === "guest";
            chatBoxEl.hidden = !active && snap.chat.length === 0;
            if (!active) state.chatOpen = false;
            if (chatFormEl && !active) chatFormEl.hidden = true;
            chatLogEl.innerHTML = "";
            for (const m of snap.chat.slice(-8)) {
                const line = document.createElement("div");
                line.className = m.system ? "voxel-lan-chat-line is-system" : "voxel-lan-chat-line";
                if (!m.system && m.name) {
                    const who = document.createElement("span");
                    who.className = "voxel-lan-chat-name";
                    who.textContent = `${m.name}:`;
                    line.appendChild(who);
                }
                line.appendChild(document.createTextNode(m.text));
                chatLogEl.appendChild(line);
            }
            chatLogEl.scrollTop = chatLogEl.scrollHeight;
        }
    };

    const unsubSession = session.onChange(renderSnapshot);

    const updateNametags = (cam, cssWidth, cssHeight, remotePlayers, eye) => {
        if (!nametagsEl || !cam || !cam.viewProj) return;
        const m = cam.viewProj;
        const activeIds = new Set();
        for (const rp of remotePlayers) {
            const dist = Math.hypot(rp.pos[0] - eye[0], rp.pos[1] - eye[1], rp.pos[2] - eye[2]);
            if (dist > NAMETAG_MAX_DIST || dist < 0.35) continue;
            const wx = rp.pos[0];
            const wy = rp.pos[1] + 2.15;
            const wz = rp.pos[2];
            const cx = m[0] * wx + m[4] * wy + m[8] * wz + m[12];
            const cy = m[1] * wx + m[5] * wy + m[9] * wz + m[13];
            const cw = m[3] * wx + m[7] * wy + m[11] * wz + m[15];
            if (cw <= 0.1) continue;
            const nx = cx / cw;
            const ny = cy / cw;
            if (nx < -1.1 || nx > 1.1 || ny < -1.1 || ny > 1.1) continue;
            const sx = (nx * 0.5 + 0.5) * cssWidth;
            const sy = (0.5 - ny * 0.5) * cssHeight;
            activeIds.add(rp.id);
            let el = tagPool.get(rp.id);
            if (!el) {
                el = document.createElement("span");
                el.className = "voxel-nametag";
                const nameSpan = document.createElement("span");
                const distSpan = document.createElement("span");
                distSpan.className = "voxel-nametag-dist";
                el.append(nameSpan, distSpan);
                nametagsEl.appendChild(el);
                tagPool.set(rp.id, el);
            }
            el.hidden = false;
            el.firstChild.textContent = rp.name;
            el.lastChild.textContent = `${Math.round(dist)}m`;
            el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        }
        for (const [id, el] of tagPool.entries()) {
            if (!activeIds.has(id)) {
                el.remove();
                tagPool.delete(id);
            }
        }
    };

    const closeOverlays = () => {
        let closed = false;
        if (state.lanOpen) {
            setModalOpen(false);
            closed = true;
        }
        if (state.chatOpen) {
            setChatOpen(false);
            closed = true;
        }
        return closed;
    };

    const destroy = () => {
        unsubSession();
        for (const fn of cleanups) fn();
        cleanups.length = 0;
        for (const el of tagPool.values()) el.remove();
        tagPool.clear();
    };

    return {
        setModalOpen,
        toggleModal: () => setModalOpen(!state.lanOpen),
        setChatOpen,
        updateNametags,
        closeOverlays,
        destroy
    };
}
