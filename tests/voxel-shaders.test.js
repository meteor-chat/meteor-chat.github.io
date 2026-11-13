import { describe, it, expect } from "vitest";
import { PROGRAM_SPECS } from "../src/lab/voxel/voxel-gpu-resources.js";
import { computeSkyAtmosphere, linearizeAtmosphere } from "../src/lab/voxel/voxel-gl-utils.js";

const UNIFORM_DECL = /^\s*uniform\s+(?:highp\s+|mediump\s+|lowp\s+)?\w+\s+(\w+)(?:\[\d+\])?\s*;/gm;

function declaredUniforms(...sources) {
    const names = new Set();
    for (const source of sources) {
        for (const match of source.matchAll(UNIFORM_DECL)) names.add(match[1]);
    }
    return names;
}

function stripBalanced(source) {
    let braces = 0;
    let parens = 0;
    for (const ch of source) {
        if (ch === "{") braces += 1;
        if (ch === "}") braces -= 1;
        if (ch === "(") parens += 1;
        if (ch === ")") parens -= 1;
    }
    return { braces, parens };
}

describe("Voxel shader sources", () => {
    it("starts every shader with a GLSL ES 3.00 version directive and balanced delimiters", () => {
        for (const [name, spec] of Object.entries(PROGRAM_SPECS)) {
            for (const [stage, source] of [["vs", spec.vs], ["fs", spec.fs]]) {
                expect(source.startsWith("#version 300 es\n"), `${name}.${stage} version`).toBe(true);
                expect(stripBalanced(source), `${name}.${stage} balance`).toEqual({ braces: 0, parens: 0 });
                expect(source, `${name}.${stage} must define main`).toContain("void main()");
            }
        }
    });

    it("declares every uniform the JavaScript cache looks up", () => {
        for (const [name, spec] of Object.entries(PROGRAM_SPECS)) {
            const declared = declaredUniforms(spec.vs, spec.fs);
            for (const uniform of spec.uniforms) {
                expect(declared.has(uniform), `${name} is missing uniform ${uniform}`).toBe(true);
            }
        }
    });

    it("looks up every uniform that a shader declares so none stays unset by accident", () => {
        for (const [name, spec] of Object.entries(PROGRAM_SPECS)) {
            const declared = declaredUniforms(spec.vs, spec.fs);
            for (const uniform of declared) {
                expect(spec.uniforms, `${name} never looks up ${uniform}`).toContain(uniform);
            }
        }
    });

    it("contains no GLSL comments that would violate the repository rules", () => {
        for (const spec of Object.values(PROGRAM_SPECS)) {
            for (const source of [spec.vs, spec.fs]) {
                expect(source).not.toMatch(/(^|\s)\/\//);
                expect(source).not.toContain("/" + "*");
            }
        }
    });
});

describe("Voxel linear color pipeline", () => {
    it("converts sky, horizon, and sun tint to linear light and leaves directions alone", () => {
        const srgb = computeSkyAtmosphere(0.3);
        const linear = linearizeAtmosphere(srgb);
        expect(linear.sunDir).toBe(srgb.sunDir);
        expect(linear.dayIntensity).toBe(srgb.dayIntensity);
        for (let i = 0; i < 3; i += 1) {
            expect(linear.skyColor[i]).toBeCloseTo(Math.pow(srgb.skyColor[i], 2.2), 10);
            expect(linear.skyColor[i]).toBeLessThanOrEqual(srgb.skyColor[i]);
            expect(linear.horizonColor[i]).toBeLessThanOrEqual(srgb.horizonColor[i]);
            expect(linear.sunTint[i]).toBeLessThanOrEqual(srgb.sunTint[i]);
        }
    });

    it("keeps the sun above the horizon at midday and below it at night", () => {
        expect(computeSkyAtmosphere(0.3).sunDir[1]).toBeGreaterThan(0.5);
        expect(computeSkyAtmosphere(0.88).sunDir[1]).toBeLessThan(0);
    });
});
