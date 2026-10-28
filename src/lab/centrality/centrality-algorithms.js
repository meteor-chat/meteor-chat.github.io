export function buildAdjacency(nodes, edges) {
    const adj = {};
    nodes.forEach(u => { adj[u] = []; });
    edges.forEach(([u, v]) => {
        if (adj[u] && adj[v]) {
            if (!adj[u].includes(v)) adj[u].push(v);
            if (!adj[v].includes(u)) adj[v].push(u);
        }
    });
    return adj;
}

export function calculateDegrees(nodes, edges) {
    const deg = {};
    nodes.forEach(u => { deg[u] = 0; });
    edges.forEach(([u, v]) => {
        if (deg[u] !== undefined) deg[u]++;
        if (deg[v] !== undefined) deg[v]++;
    });
    return deg;
}

export function calculateBetweenness(nodes, edges, normalized = true) {
    const cb = {};
    const adj = buildAdjacency(nodes, edges);
    nodes.forEach(u => { cb[u] = 0; });

    for (const s of nodes) {
        const S = [];
        const P = {};
        const sigma = {};
        const d = {};
        nodes.forEach(w => {
            P[w] = [];
            sigma[w] = 0;
            d[w] = -1;
        });
        sigma[s] = 1;
        d[s] = 0;
        const Q = [s];

        while (Q.length > 0) {
            const v = Q.shift();
            S.push(v);
            for (const w of adj[v]) {
                if (d[w] < 0) {
                    Q.push(w);
                    d[w] = d[v] + 1;
                }
                if (d[w] === d[v] + 1) {
                    sigma[w] += sigma[v];
                    P[w].push(v);
                }
            }
        }

        const delta = {};
        nodes.forEach(w => { delta[w] = 0; });
        while (S.length > 0) {
            const w = S.pop();
            for (const v of P[w]) {
                delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
            }
            if (w !== s) {
                cb[w] += delta[w];
            }
        }
    }

    nodes.forEach(v => { cb[v] /= 2; });

    if (normalized && nodes.length > 2) {
        const scale = 2 / ((nodes.length - 1) * (nodes.length - 2));
        nodes.forEach(v => { cb[v] *= scale; });
    }

    return cb;
}

export function findShortestPaths(adj, startNode, endNode) {
    if (!adj[startNode] || !adj[endNode]) return [];
    if (startNode === endNode) return [[startNode]];

    const dist = {};
    const preds = {};
    Object.keys(adj).forEach(u => {
        dist[u] = Infinity;
        preds[u] = [];
    });
    dist[startNode] = 0;
    const queue = [startNode];

    while (queue.length > 0) {
        const u = queue.shift();
        if (dist[u] > dist[endNode]) break;
        for (const v of adj[u]) {
            if (dist[v] === Infinity) {
                dist[v] = dist[u] + 1;
                preds[v].push(u);
                queue.push(v);
            } else if (dist[v] === dist[u] + 1) {
                preds[v].push(u);
            }
        }
    }

    if (dist[endNode] === Infinity) return [];

    const paths = [];
    function backtrack(curr, currentPath) {
        if (curr === startNode) {
            paths.push([...currentPath].reverse());
            return;
        }
        for (const p of preds[curr]) {
            currentPath.push(p);
            backtrack(p, currentPath);
            currentPath.pop();
        }
    }

    backtrack(endNode, [endNode]);
    return paths;
}
