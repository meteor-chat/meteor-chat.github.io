import { describe, it, expect, afterEach, vi } from "vitest";
import { createVoxelWorld } from "../src/lab/voxel/voxel-world.js";
import { isAwaitingNeighbor } from "../src/lab/voxel/voxel-world-stream.js";
import { generateColumn } from "../src/lab/voxel/voxel-world-gen.js";
import { propagateColumnLight } from "../src/lab/voxel/voxel-light.js";

class StubWorker {
    static last = null;

    constructor() {
        this.sent = [];
        StubWorker.last = this;
    }

    postMessage(msg) {
        this.sent.push(msg);
    }

    terminate() {}
}

function generatedMessage(cx, cz) {
    const col = generateColumn(cx, cz, 2026);
    propagateColumnLight(col.blocks, col.light);
    return { data: { type: "generated", cx, cz, blocks: col.blocks, light: col.light } };
}

describe("Voxel neighbor-aware meshing", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        StubWorker.last = null;
    });

    it("reports a missing in-view neighbor but ignores neighbors beyond the view radius", () => {
        const columns = new Map([["0,0", {}], ["1,0", {}]]);
        const center = { cx: 0, cz: 0 };
        expect(isAwaitingNeighbor(columns, 0, 0, center, 1)).toBe(true);
        columns.set("-1,0", {});
        columns.set("0,1", {});
        columns.set("0,-1", {});
        expect(isAwaitingNeighbor(columns, 0, 0, center, 1)).toBe(false);
        expect(isAwaitingNeighbor(new Map(), 1, 0, center, 1)).toBe(true);
        expect(isAwaitingNeighbor(new Map(), 5, 5, center, 1)).toBe(false);
    });

    it("holds a column back from the worker until its in-view neighbors have loaded", () => {
        vi.stubGlobal("Worker", StubWorker);
        const world = createVoxelWorld({ seed: 2026, viewRadius: 1 });
        const worker = StubWorker.last;
        world.updateAround(8, 8);
        const generates = worker.sent.filter((m) => m.type === "generate");
        expect(generates.length).toBe(4);

        worker.onmessage(generatedMessage(0, 0));
        world.updateAround(8, 8);
        expect(worker.sent.filter((m) => m.type === "mesh")).toHaveLength(0);

        for (const cz of [-1, 0, 1]) {
            for (const cx of [-1, 0, 1]) {
                if (cx !== 0 || cz !== 0) worker.onmessage(generatedMessage(cx, cz));
            }
        }
        for (let i = 0; i < 4; i += 1) world.updateAround(8, 8);
        const meshJobs = worker.sent.filter((m) => m.type === "mesh");
        expect(meshJobs.length).toBeGreaterThanOrEqual(9);
        expect(new Set(meshJobs.map((m) => `${m.cx},${m.cz}`)).size).toBe(9);
        for (const job of meshJobs) {
            expect(typeof job.seq).toBe("number");
            expect(typeof job.colId).toBe("number");
        }
        world.destroy();
    }, 60000);
});
