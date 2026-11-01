export function bindCanvasEvents(canvas, renderer, state, onUpdate) {
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            sx: (e.clientX - rect.left) * scaleX,
            sy: (e.clientY - rect.top) * scaleY
        };
    }

    canvas.addEventListener("pointerdown", (e) => {
        const { sx, sy } = getCanvasCoords(e);
        const idx = renderer.findPointAt(sx, sy, state.points);
        if (idx !== -1) {
            state.draggedIdx = idx;
            canvas.setPointerCapture(e.pointerId);
        } else {
            const mathPt = renderer.toMath(sx, sy);
            state.points.push(mathPt);
            state.draggedIdx = state.points.length - 1;
            canvas.setPointerCapture(e.pointerId);
            onUpdate();
        }
    });

    canvas.addEventListener("pointermove", (e) => {
        const { sx, sy } = getCanvasCoords(e);
        if (state.draggedIdx !== -1) {
            const mathPt = renderer.toMath(sx, sy);
            state.points[state.draggedIdx] = mathPt;
            onUpdate();
        } else {
            const idx = renderer.findPointAt(sx, sy, state.points);
            if (idx !== state.hoveredIdx) {
                state.hoveredIdx = idx;
                renderer.render(state);
            }
        }
    });

    function stopDrag(e) {
        if (state.draggedIdx !== -1) {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {}
            state.draggedIdx = -1;
            onUpdate();
        }
    }

    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const { sx, sy } = getCanvasCoords(e);
        const idx = renderer.findPointAt(sx, sy, state.points);
        if (idx !== -1) {
            state.points.splice(idx, 1);
            onUpdate();
        }
    });
}
