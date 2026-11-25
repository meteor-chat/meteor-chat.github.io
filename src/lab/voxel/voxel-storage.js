const DB_NAME = "meteor-voxel-v1";
const DB_VERSION = 1;
const STORE_EDITS = "edits";
const STORE_META = "meta";

function getIdb() {
    if (typeof window === "undefined") return null;
    try {
        return window.indexedDB || null;
    } catch {
        return null;
    }
}

function openDatabase() {
    const idb = getIdb();
    if (!idb) return Promise.resolve(null);
    return new Promise((resolve) => {
        try {
            const req = idb.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_EDITS)) {
                    db.createObjectStore(STORE_EDITS, { keyPath: "key" });
                }
                if (!db.objectStoreNames.contains(STORE_META)) {
                    db.createObjectStore(STORE_META, { keyPath: "key" });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

export function createWorldStorage(seed = 2026) {
    const edits = new Map();
    const dirtyCols = new Set();
    let dbPromise = null;
    let dbInstance = null;
    let flushTimer = null;
    let playerTimer = null;
    let pendingPlayer = null;
    let closed = false;

    const colKey = (cx, cz) => `${cx},${cz}`;
    const dbColKey = (k) => `${seed}:${k}`;
    const playerKey = `player:${seed}`;

    const ensureDb = () => {
        if (closed) return Promise.resolve(null);
        if (!dbPromise) {
            dbPromise = openDatabase().then((db) => {
                if (closed && db) {
                    db.close();
                    return null;
                }
                dbInstance = db;
                return db;
            });
        }
        return dbPromise;
    };

    const flushEdits = async () => {
        flushTimer = null;
        if (closed || dirtyCols.size === 0) return;
        const keys = Array.from(dirtyCols);
        dirtyCols.clear();
        const db = await ensureDb();
        if (!db || closed) return;
        try {
            const tx = db.transaction(STORE_EDITS, "readwrite");
            const store = tx.objectStore(STORE_EDITS);
            for (const k of keys) {
                const colMap = edits.get(k);
                if (!colMap || colMap.size === 0) {
                    store.delete(dbColKey(k));
                } else {
                    const entries = [];
                    for (const [idx, id] of colMap.entries()) entries.push(idx, id);
                    store.put({ key: dbColKey(k), seed, col: k, entries });
                }
            }
        } catch {
            return;
        }
    };

    const flushPlayer = async () => {
        playerTimer = null;
        if (closed || !pendingPlayer) return;
        const snapshot = pendingPlayer;
        pendingPlayer = null;
        const db = await ensureDb();
        if (!db || closed) return;
        try {
            const tx = db.transaction(STORE_META, "readwrite");
            tx.objectStore(STORE_META).put({ key: playerKey, seed, state: snapshot });
        } catch {
            return;
        }
    };

    const recordEdit = (cx, cz, idx, blockId) => {
        const k = colKey(cx, cz);
        let colMap = edits.get(k);
        if (!colMap) {
            colMap = new Map();
            edits.set(k, colMap);
        }
        colMap.set(idx, blockId);
        dirtyCols.add(k);
        if (!flushTimer && !closed) {
            flushTimer = setTimeout(flushEdits, 400);
        }
    };

    const applyColumnEdits = (cx, cz, blocks) => {
        const colMap = edits.get(colKey(cx, cz));
        if (!colMap || colMap.size === 0) return false;
        for (const [idx, id] of colMap.entries()) {
            if (idx >= 0 && idx < blocks.length) blocks[idx] = id;
        }
        return true;
    };

    const loadAll = async () => {
        const db = await ensureDb();
        if (!db || closed) return [];
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_EDITS, "readonly");
                const req = tx.objectStore(STORE_EDITS).getAll();
                req.onsuccess = () => {
                    const rows = req.result || [];
                    const loadedCols = [];
                    for (const row of rows) {
                        if (row.seed !== seed || !row.col || !Array.isArray(row.entries)) continue;
                        let colMap = edits.get(row.col);
                        if (!colMap) {
                            colMap = new Map();
                            edits.set(row.col, colMap);
                        }
                        for (let i = 0; i < row.entries.length; i += 2) {
                            const idx = row.entries[i];
                            const id = row.entries[i + 1];
                            if (!colMap.has(idx)) colMap.set(idx, id);
                        }
                        loadedCols.push(row.col);
                    }
                    resolve(loadedCols);
                };
                req.onerror = () => resolve([]);
            } catch {
                resolve([]);
            }
        });
    };

    const savePlayer = (state) => {
        if (closed) return;
        pendingPlayer = state;
        if (!playerTimer) {
            playerTimer = setTimeout(flushPlayer, 800);
        }
    };

    const loadPlayer = async () => {
        const db = await ensureDb();
        if (!db || closed) return null;
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_META, "readonly");
                const req = tx.objectStore(STORE_META).get(playerKey);
                req.onsuccess = () => resolve(req.result?.state || null);
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    };

    const clearAll = async () => {
        edits.clear();
        dirtyCols.clear();
        pendingPlayer = null;
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        if (playerTimer) {
            clearTimeout(playerTimer);
            playerTimer = null;
        }
        const db = await ensureDb();
        if (!db || closed) return;
        await new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_EDITS, STORE_META], "readwrite");
                const editStore = tx.objectStore(STORE_EDITS);
                const req = editStore.getAllKeys();
                req.onsuccess = () => {
                    const prefix = `${seed}:`;
                    for (const k of req.result || []) {
                        if (typeof k === "string" && k.startsWith(prefix)) editStore.delete(k);
                    }
                    tx.objectStore(STORE_META).delete(playerKey);
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        });
    };

    const destroy = () => {
        closed = true;
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        if (playerTimer) {
            clearTimeout(playerTimer);
            playerTimer = null;
        }
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    };

    return {
        recordEdit,
        applyColumnEdits,
        loadAll,
        savePlayer,
        loadPlayer,
        clearAll,
        editCount: () => {
            let total = 0;
            for (const m of edits.values()) total += m.size;
            return total;
        },
        destroy
    };
}
