const CONSTANT_NAME = /^[A-Z][A-Z0-9_]*$/;

const CREATORS = {
    createVertexArray: "vao",
    createBuffer: "buffer",
    createTexture: "texture",
    createFramebuffer: "framebuffer",
    createRenderbuffer: "renderbuffer",
    createProgram: "program",
    createShader: "shader",
    createQuery: "query"
};

const DELETERS = {
    deleteVertexArray: "vao",
    deleteBuffer: "buffer",
    deleteTexture: "texture",
    deleteFramebuffer: "framebuffer",
    deleteRenderbuffer: "renderbuffer",
    deleteProgram: "program",
    deleteShader: "shader",
    deleteQuery: "query"
};

function hashConstant(name) {
    let h = 7;
    for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 65521;
    return h + 1;
}

export function createMockGl({ extensions = {} } = {}) {
    const calls = new Map();
    const live = new Map();
    const queryResults = { available: true, disjoint: false, nanos: 4000000 };
    let contextLost = false;
    let nextId = 1;

    const record = (name) => calls.set(name, (calls.get(name) || 0) + 1);
    const liveSet = (kind) => {
        if (!live.has(kind)) live.set(kind, new Set());
        return live.get(kind);
    };

    const target = {
        isContextLost: () => contextLost,
        getExtension: (name) => {
            if (name in extensions) return extensions[name];
            return name === "EXT_color_buffer_float" ? {} : null;
        },
        getShaderParameter: () => true,
        getProgramParameter: () => true,
        getUniformLocation: (_program, name) => ({ name }),
        getQueryParameter: (_query, pname) => {
            if (pname === hashConstant("QUERY_RESULT_AVAILABLE")) return queryResults.available;
            return queryResults.nanos;
        },
        getParameter: (pname) => (pname === hashConstant("GPU_DISJOINT_EXT") ? queryResults.disjoint : 0)
    };

    for (const [method, kind] of Object.entries(CREATORS)) {
        target[method] = () => {
            const handle = { id: nextId, kind };
            nextId += 1;
            liveSet(kind).add(handle);
            return handle;
        };
    }
    for (const [method, kind] of Object.entries(DELETERS)) {
        target[method] = (handle) => {
            liveSet(kind).delete(handle);
        };
    }

    const gl = new Proxy(target, {
        get(obj, prop) {
            if (typeof prop === "symbol") return undefined;
            if (prop in obj) {
                const value = obj[prop];
                if (typeof value !== "function") return value;
                return (...args) => {
                    record(prop);
                    return value(...args);
                };
            }
            if (CONSTANT_NAME.test(prop)) return hashConstant(prop);
            return () => {
                record(prop);
            };
        }
    });

    return {
        gl,
        constant: hashConstant,
        calls: (name) => calls.get(name) || 0,
        liveCount: (kind) => liveSet(kind).size,
        queryResults,
        setLost: (value) => {
            contextLost = value;
        }
    };
}

export function createTimerExtension() {
    return { TIME_ELAPSED_EXT: 0x88bf, GPU_DISJOINT_EXT: hashConstant("GPU_DISJOINT_EXT") };
}
