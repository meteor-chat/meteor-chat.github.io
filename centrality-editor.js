function distToSegment(px, py, vx, vy, wx, wy) {
    const l2 = (wx - vx) * (wx - vx) + (wy - vy) * (wy - vy);
    if (l2 === 0) return Math.hypot(px - vx, py - vy);
    let t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = vx + t * (wx - vx);
    const projY = vy + t * (wy - vy);
    return Math.hypot(px - projX, py - projY);
}

export function createNode(graph, logicalX, logicalY) {
    const nextId = graph.nodes.length > 0 ? Math.max(...graph.nodes) + 1 : 1;
    const clampedX = Math.max(40, Math.min(560, Math.round(logicalX)));
    const clampedY = Math.max(40, Math.min(360, Math.round(logicalY)));
    graph.nodes.push(nextId);
    graph.positions[nextId] = { x: clampedX, y: clampedY };
    graph.labels[nextId] = `Node ${nextId}`;
    return nextId;
}

export function deleteNode(graph, nodeId) {
    const target = parseInt(nodeId, 10);
    graph.nodes = graph.nodes.filter(u => u !== target);
    delete graph.positions[target];
    delete graph.labels[target];
    graph.edges = graph.edges.filter(([u, v]) => u !== target && v !== target);
}

export function addEdge(graph, u, v) {
    const n1 = parseInt(u, 10);
    const n2 = parseInt(v, 10);
    if (n1 === n2 || isNaN(n1) || isNaN(n2)) return false;
    if (!graph.positions[n1] || !graph.positions[n2]) return false;

    const exists = graph.edges.some(([a, b]) => (a === n1 && b === n2) || (a === n2 && b === n1));
    if (!exists) {
        graph.edges.push([Math.min(n1, n2), Math.max(n1, n2)]);
        return true;
    }
    return false;
}

export function removeEdge(graph, u, v) {
    const n1 = parseInt(u, 10);
    const n2 = parseInt(v, 10);
    const initLen = graph.edges.length;
    graph.edges = graph.edges.filter(([a, b]) => !((a === n1 && b === n2) || (a === n2 && b === n1)));
    return graph.edges.length < initLen;
}

export function toggleEdge(graph, u, v) {
    const n1 = parseInt(u, 10);
    const n2 = parseInt(v, 10);
    if (n1 === n2) return null;
    const idx = graph.edges.findIndex(([a, b]) => (a === n1 && b === n2) || (a === n2 && b === n1));
    if (idx >= 0) {
        graph.edges.splice(idx, 1);
        return { action: "removed", u: n1, v: n2 };
    }
    graph.edges.push([Math.min(n1, n2), Math.max(n1, n2)]);
    return { action: "added", u: n1, v: n2 };
}

export function findEdgeNearPoint(graph, logicalPt, maxDist = 14) {
    let closestEdge = null;
    let minDist = maxDist;

    for (const [u, v] of graph.edges) {
        const p1 = graph.positions[u];
        const p2 = graph.positions[v];
        if (!p1 || !p2) continue;

        const d = distToSegment(logicalPt.x, logicalPt.y, p1.x, p1.y, p2.x, p2.y);
        if (d <= minDist) {
            minDist = d;
            closestEdge = [u, v];
        }
    }

    return closestEdge;
}

export function clearGraph(graph) {
    graph.nodes = [];
    graph.edges = [];
    graph.positions = {};
    graph.labels = {};
}
