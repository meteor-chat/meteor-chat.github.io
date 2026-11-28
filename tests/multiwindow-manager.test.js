import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createWindowManager,
    getWindowShape,
    calibrateChromeFromEvent,
    pruneStaleWindows,
    areWindowListsDifferent
} from "../src/lab/multiwindow/window-manager.js";

describe("Multiple Window Manager - Dual Sync & Screen Tracking", () => {
    let originalBroadcastChannel = null;
    let mockChannelInstances = [];
    let mockStorage = {};

    beforeEach(() => {
        mockStorage = {};
        mockChannelInstances = [];

        const mockLocalStorage = {
            getItem: (key) => (Object.prototype.hasOwnProperty.call(mockStorage, key) ? mockStorage[key] : null),
            setItem: (key, val) => {
                mockStorage[key] = String(val);
            },
            removeItem: (key) => {
                delete mockStorage[key];
            },
            clear: () => {
                mockStorage = {};
            }
        };

        vi.stubGlobal("localStorage", mockLocalStorage);

        class MockBroadcastChannel {
            constructor(name) {
                this.name = name;
                this.onmessage = null;
                mockChannelInstances.push(this);
            }
            postMessage(msg) {
                for (const ch of [...mockChannelInstances]) {
                    if (ch !== this && ch.name === this.name && typeof ch.onmessage === "function") {
                        ch.onmessage({ data: msg });
                    }
                }
            }
            close() {
                const idx = mockChannelInstances.indexOf(this);
                if (idx !== -1) mockChannelInstances.splice(idx, 1);
            }
        }

        originalBroadcastChannel = globalThis.BroadcastChannel;
        vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

        vi.stubGlobal("window", {
            screenX: 120,
            screenY: 180,
            innerWidth: 800,
            innerHeight: 600,
            open: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            setInterval: vi.fn(() => 123),
            clearInterval: vi.fn(),
            localStorage: mockLocalStorage,
            BroadcastChannel: MockBroadcastChannel
        });
    });

    afterEach(() => {
        if (originalBroadcastChannel) {
            vi.stubGlobal("BroadcastChannel", originalBroadcastChannel);
        }
        vi.unstubAllGlobals();
    });

    it("reads window shape from screen coordinates", () => {
        const shape = getWindowShape();
        expect(shape.x).toBe(120);
        expect(shape.y).toBe(180);
        expect(shape.w).toBe(800);
        expect(shape.h).toBe(600);
    });

    it("registers window and assigns unique sequential id", () => {
        const mgr = createWindowManager();
        mgr.init({ label: "Primary" });

        const thisId = mgr.getThisWindowId();
        expect(typeof thisId).toBe("number");
        expect(thisId).toBeGreaterThan(0);

        const list = mgr.getWindows();
        expect(list.length).toBe(1);
        expect(list[0].id).toBe(thisId);
        expect(list[0].metaData.label).toBe("Primary");

        mgr.destroy();
    });

    it("synchronizes multiple window instances through dual storage and channel", () => {
        const mgr1 = createWindowManager();
        mgr1.init();

        const mgr2 = createWindowManager();
        mgr2.init();

        const list1 = mgr1.getWindows();
        const list2 = mgr2.getWindows();

        expect(list1.length).toBe(2);
        expect(list2.length).toBe(2);
        expect(mgr1.getThisWindowId()).not.toBe(mgr2.getThisWindowId());

        mgr1.destroy();
        mgr2.destroy();
    });

    it("notifies callback when shape updates during movement", () => {
        const onShapeChange = vi.fn();
        const mgr = createWindowManager({ onShapeChange });
        mgr.init();

        window.screenX = 240;
        window.screenY = 320;

        const result = mgr.update(false);
        expect(result.shape.x).toBe(240);
        expect(result.shape.y).toBe(320);
        expect(onShapeChange).toHaveBeenCalledWith(expect.objectContaining({ x: 240, y: 320 }));

        mgr.destroy();
    });

    it("prunes stale windows that have exceeded maxAgeMs threshold", () => {
        const now = 2000000;
        const list = [
            { id: 1, shape: { x: 0, y: 0, w: 100, h: 100 }, timestamp: now - 500 },
            { id: 2, shape: { x: 0, y: 0, w: 100, h: 100 }, timestamp: now - 3500 },
            { id: 3, shape: { x: 0, y: 0, w: 100, h: 100 }, timestamp: now - 100 }
        ];

        const active = pruneStaleWindows(list, 2800, now);
        expect(active.length).toBe(2);
        expect(active.map((w) => w.id)).toEqual([1, 3]);
    });

    it("detects differences between two window list snapshots", () => {
        const a = [{ id: 1, shape: { x: 10, y: 20, w: 300, h: 200 } }];
        const b = [{ id: 1, shape: { x: 10, y: 20, w: 300, h: 200 } }];
        const c = [{ id: 1, shape: { x: 50, y: 20, w: 300, h: 200 } }];

        expect(areWindowListsDifferent(a, b)).toBe(false);
        expect(areWindowListsDifferent(a, c)).toBe(true);
        expect(areWindowListsDifferent(a, [])).toBe(true);
    });

    it("unregisters window gracefully on destroy", () => {
        const mgr1 = createWindowManager();
        mgr1.init();

        const mgr2 = createWindowManager();
        mgr2.init();

        expect(mgr1.getWindows().length).toBe(2);
        mgr2.destroy();

        expect(mgr1.getWindows().length).toBe(1);
        mgr1.destroy();
    });

    it("subtracts Windows DWM bottom border and levels popup vs normal window centers", () => {
        window.screenX = -7;
        window.screenY = 0;
        window.outerWidth = 974;
        window.innerWidth = 958;
        window.outerHeight = 1040;
        window.innerHeight = 966;
        const popupShape = getWindowShape();

        window.screenX = 953;
        window.screenY = 0;
        window.outerWidth = 974;
        window.innerWidth = 958;
        window.outerHeight = 1040;
        window.innerHeight = 945;
        const normalShape = getWindowShape();

        expect(popupShape.x).toBe(1);
        expect(popupShape.y).toBe(66);
        expect(normalShape.x).toBe(961);
        expect(normalShape.y).toBe(87);
        expect(popupShape.cy).toBe(normalShape.cy);
    });

    it("calibrates exact viewport screen origin from pointer events", () => {
        window.screenX = 100;
        window.screenY = 50;
        window.outerWidth = 816;
        window.innerWidth = 800;
        window.outerHeight = 710;
        window.innerHeight = 600;
        const cal = calibrateChromeFromEvent({ screenX: 308, screenY: 242, clientX: 200, clientY: 100 });
        expect(cal).not.toBeNull();
        expect(cal.dx).toBe(8);
        expect(cal.dy).toBe(92);

        const shape = getWindowShape(cal);
        expect(shape.x).toBe(108);
        expect(shape.y).toBe(142);
    });
});
