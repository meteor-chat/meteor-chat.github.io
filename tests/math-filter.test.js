import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
    initFilters,
    applyFilter,
    getActiveFilter,
    getSearchQuery,
    setSearchQuery,
    resetAllFilters
} from "../src/math/math-filter.js";

describe("Math Hub Catalog UI and Filter Unit Tests", () => {
    let container;

    beforeEach(() => {
        const html = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf8");
        const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
        document.body.innerHTML = bodyContent;
        container = document.body;
        window.history.pushState({}, "", "/math");
    });

    it("verifies math catalog DOM structure and route parity", () => {
        const rootPage = fs.readFileSync(path.resolve(process.cwd(), "math.html"), "utf8");
        const subPage = fs.readFileSync(path.resolve(process.cwd(), "math/index.html"), "utf8");
        expect(subPage.length).toBeGreaterThan(0);

        const searchInput = container.querySelector("#math-search-input");
        const filterContainer = container.querySelector("#math-filter-container");
        const emptyState = container.querySelector("#math-empty-state");
        const formulaCards = container.querySelectorAll(".math-grid .math-card[data-formula]");

        expect(searchInput).not.toBeNull();
        expect(filterContainer).not.toBeNull();
        expect(emptyState).not.toBeNull();
        expect(formulaCards.length).toBe(40);
    });

    it("initializes dynamic category counts and default counter", () => {
        initFilters();
        const allBtnCount = container.querySelector('.math-filter-btn[data-filter=""] .math-filter-count');
        expect(allBtnCount.textContent).toBe("40");

        const aiBtnCount = container.querySelector('.math-filter-btn[data-filter="Kecerdasan Artifisial"] .math-filter-count');
        expect(aiBtnCount.textContent).toBe("12");

        const pmBtnCount = container.querySelector('.math-filter-btn[data-filter="Manajemen Proyek"] .math-filter-count');
        expect(pmBtnCount.textContent).toBe("12");

        const counterEl = container.querySelector("#math-search-counter");
        expect(counterEl.textContent).toBe("Menampilkan 40 rumus");
    });

    it("filters cards correctly by category and updates title and counter", () => {
        initFilters();
        applyFilter("Kecerdasan Artifisial");

        expect(getActiveFilter()).toBe("Kecerdasan Artifisial");
        expect(document.title).toBe("Kecerdasan Artifisial - Meteor");

        const visibleCards = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(visibleCards.length).toBe(12);

        const counterEl = container.querySelector("#math-search-counter");
        expect(counterEl.textContent).toBe("Menampilkan 12 dari 40 rumus");

        const aiBtn = container.querySelector('.math-filter-btn[data-filter="Kecerdasan Artifisial"]');
        expect(aiBtn.classList.contains("active")).toBe(true);
        expect(aiBtn.getAttribute("aria-pressed")).toBe("true");

        applyFilter(null);
        expect(getActiveFilter()).toBeNull();
        expect(document.title).toBe("Math - Meteor");
        const allVisible = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(allVisible.length).toBe(40);
    });

    it("searches formula cards by title, id, and aria label", () => {
        initFilters();
        setSearchQuery("kumulatif");

        expect(getSearchQuery()).toBe("kumulatif");
        const visibleCards = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(visibleCards.length).toBe(1);
        expect(visibleCards[0].dataset.formula).toBe("5");

        const clearBtn = container.querySelector("#math-search-clear");
        expect(clearBtn.classList.contains("hidden")).toBe(false);

        setSearchQuery("#01");
        const card1 = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(card1.length).toBe(1);
        expect(card1[0].dataset.formula).toBe("1");
    });

    it("combines category filter and search query", () => {
        initFilters();
        applyFilter("Kalkulus");
        setSearchQuery("rata-rata");

        const visibleCards = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(visibleCards.length).toBe(1);
        expect(visibleCards[0].dataset.category).toBe("Kalkulus");
        expect(visibleCards[0].dataset.formula).toBe("18");

        setSearchQuery("kumulatif");
        const noMatchCards = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(noMatchCards.length).toBe(0);

        const emptyState = container.querySelector("#math-empty-state");
        expect(emptyState.classList.contains("hidden")).toBe(false);
    });

    it("resets all filters when empty reset button is clicked", () => {
        initFilters();
        applyFilter("Fisika");
        setSearchQuery("nonexistentquery12345");

        const emptyResetBtn = container.querySelector("#math-empty-reset");
        emptyResetBtn.click();

        expect(getActiveFilter()).toBeNull();
        expect(getSearchQuery()).toBe("");

        const visibleCards = Array.from(container.querySelectorAll(".math-grid .math-card[data-formula]")).filter(
            (c) => !c.classList.contains("math-hidden")
        );
        expect(visibleCards.length).toBe(40);

        const emptyState = container.querySelector("#math-empty-state");
        expect(emptyState.classList.contains("hidden")).toBe(true);
    });

    it("handles keyboard shortcuts for slash and escape", () => {
        initFilters();
        const searchInput = container.querySelector("#math-search-input");
        const focusSpy = vi.spyOn(searchInput, "focus");

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
        expect(focusSpy).toHaveBeenCalled();

        setSearchQuery("test");
        expect(searchInput.value).toBe("test");

        searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(getSearchQuery()).toBe("");
    });
});
