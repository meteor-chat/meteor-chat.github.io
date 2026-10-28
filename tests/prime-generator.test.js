import { describe, it, expect } from "vitest";
import { getPrimes } from "../src/math/geometry/prime-generator.js";

describe("prime-generator", () => {
    it("generates first 10 primes correctly", () => {
        expect(getPrimes(10)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    });

    it("generates single prime for n=1", () => {
        expect(getPrimes(1)).toEqual([2]);
    });

    it("generates 100th prime accurately", () => {
        const primes = getPrimes(100);
        expect(primes.length).toBe(100);
        expect(primes[99]).toBe(541);
    });

    it("generates 1000th prime accurately", () => {
        const primes = getPrimes(1000);
        expect(primes.length).toBe(1000);
        expect(primes[999]).toBe(7919);
    });

    it("handles non-positive and invalid inputs gracefully", () => {
        expect(getPrimes(0)).toEqual([]);
        expect(getPrimes(-10)).toEqual([]);
        expect(getPrimes(NaN)).toEqual([]);
        expect(getPrimes("invalid")).toEqual([]);
    });

    it("uses cache on repeated calls", () => {
        const p1 = getPrimes(5);
        const p2 = getPrimes(3);
        expect(p1).toEqual([2, 3, 5, 7, 11]);
        expect(p2).toEqual([2, 3, 5]);
    });
});
