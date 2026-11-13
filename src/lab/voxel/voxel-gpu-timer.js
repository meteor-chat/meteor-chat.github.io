const MAX_IN_FLIGHT = 3;
const SMOOTHING = 0.2;
const NS_PER_MS = 1e6;

export function createGpuTimer(gl) {
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    if (!ext) return null;
    const inFlight = [];
    let active = null;
    let smoothedMs = null;

    const begin = () => {
        if (active || inFlight.length >= MAX_IN_FLIGHT) return;
        active = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
    };

    const end = () => {
        if (!active) return;
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        inFlight.push(active);
        active = null;
    };

    const poll = () => {
        while (inFlight.length > 0) {
            const query = inFlight[0];
            if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) break;
            if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) {
                const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / NS_PER_MS;
                smoothedMs = smoothedMs === null ? ms : smoothedMs + (ms - smoothedMs) * SMOOTHING;
            }
            gl.deleteQuery(query);
            inFlight.shift();
        }
    };

    const dispose = () => {
        if (active) gl.endQuery(ext.TIME_ELAPSED_EXT);
        if (active) gl.deleteQuery(active);
        for (const query of inFlight) gl.deleteQuery(query);
        active = null;
        inFlight.length = 0;
    };

    return { begin, end, poll, dispose, getMs: () => smoothedMs };
}
