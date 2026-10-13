import {
    NODE_WALL,
    isStartNode,
    isTargetNode,
    setWall,
    setStartNode,
    setTargetNode
} from "./search-grid-state.js";

function getCellCoords(canvas, state, clientX, clientY, width = 800, height = 450) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.floor(x / (width / state.cols));
    const row = Math.floor(y / (height / state.rows));

    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
        return null;
    }
    return { r: row, c: col };
}

export function attachArenaEvents(canvas, state, onUpdate, width = 800, height = 450) {
    let mode = null;
    let paintValue = false;
    let lastCell = null;

    function handlePointerDown(e) {
        const cell = getCellCoords(canvas, state, e.clientX, e.clientY, width, height);
        if (!cell) return;

        canvas.setPointerCapture(e.pointerId);
        lastCell = cell;

        if (isStartNode(state, cell.r, cell.c)) {
            mode = "start";
        } else if (isTargetNode(state, cell.r, cell.c)) {
            mode = "target";
        } else {
            mode = "wall";
            paintValue = state.grid[cell.r][cell.c] !== NODE_WALL;
            setWall(state, cell.r, cell.c, paintValue);
            onUpdate();
        }
    }

    function handlePointerMove(e) {
        if (!mode) return;

        const cell = getCellCoords(canvas, state, e.clientX, e.clientY, width, height);
        if (!cell) return;

        if (lastCell && lastCell.r === cell.r && lastCell.c === cell.c) {
            return;
        }
        lastCell = cell;

        if (mode === "start") {
            if (setStartNode(state, cell.r, cell.c)) {
                onUpdate();
            }
        } else if (mode === "target") {
            if (setTargetNode(state, cell.r, cell.c)) {
                onUpdate();
            }
        } else if (mode === "wall") {
            setWall(state, cell.r, cell.c, paintValue);
            onUpdate();
        }
    }

    function handlePointerUp(e) {
        if (mode) {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {}
            mode = null;
            lastCell = null;
        }
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerUp);
    };
}
