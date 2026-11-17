import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

const css = readFileSync("styles/voxel-settings.css", "utf8");

function blockOf(selector) {
    const start = css.indexOf(selector + " {");
    if (start < 0) return null;
    return css.slice(start, css.indexOf("}", start));
}

describe("voxel settings stylesheet", () => {
    it("keeps the closed settings panel out of the layout even though it uses display flex", () => {
        expect(blockOf(".voxel-settings")).toContain("display: flex");
        const closed = blockOf(".voxel-settings[hidden]");
        expect(closed).not.toBeNull();
        expect(closed).toContain("display: none");
        expect(css.indexOf(".voxel-settings[hidden]")).toBeGreaterThan(css.indexOf(".voxel-settings {"));
    });

    it("hides interface layers with an important display none class", () => {
        const off = blockOf(".voxel-ui-off");
        expect(off).toContain("display: none !important");
    });

    it("lets the panel scroll on short screens", () => {
        const panel = blockOf(".voxel-settings");
        expect(panel).toContain("overflow-y: auto");
        expect(panel).toContain("max-height");
    });
});