import { describe, it, expect, beforeEach } from "vitest";

describe("Search Page & Controller", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="search-filter-container" class="search-filter-container">
                <button class="search-filter-btn active" data-search="bfs">BFS</button>
                <button class="search-filter-btn" data-search="dfs">DFS</button>
                <button class="search-filter-btn" data-search="dijkstra">Dijkstra</button>
            </div>
        `;
    });

    it("should toggle active state properly when selecting algorithms", async () => {
        const { setActiveSearchAlgorithm, getActiveSearchAlgorithm } = await import("./search-controller.js");
        expect(getActiveSearchAlgorithm()).toBe("bfs");

        setActiveSearchAlgorithm("dfs");
        expect(getActiveSearchAlgorithm()).toBe("dfs");
        const dfsBtn = document.querySelector('[data-search="dfs"]');
        const bfsBtn = document.querySelector('[data-search="bfs"]');
        expect(dfsBtn.classList.contains("active")).toBe(true);
        expect(bfsBtn.classList.contains("active")).toBe(false);

        setActiveSearchAlgorithm("dijkstra");
        expect(getActiveSearchAlgorithm()).toBe("dijkstra");
        const dijkstraBtn = document.querySelector('[data-search="dijkstra"]');
        expect(dijkstraBtn.classList.contains("active")).toBe(true);
        expect(dfsBtn.classList.contains("active")).toBe(false);
    });
});
