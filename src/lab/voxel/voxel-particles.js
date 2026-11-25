import { BLOCK } from "./voxel-blocks.js";

const MAX_PARTICLES = 256;
export const PARTICLE_STRIDE = 8;

const BLOCK_COLORS = {
    [BLOCK.GRASS]: [0.42, 0.68, 0.28],
    [BLOCK.DIRT]: [0.52, 0.36, 0.24],
    [BLOCK.STONE]: [0.54, 0.56, 0.58],
    [BLOCK.SAND]: [0.85, 0.78, 0.55],
    [BLOCK.WOOD]: [0.46, 0.33, 0.2],
    [BLOCK.LEAVES]: [0.3, 0.58, 0.22],
    [BLOCK.SNOW]: [0.92, 0.95, 0.98],
    [BLOCK.COAL_ORE]: [0.32, 0.34, 0.36],
    [BLOCK.GOLD_ORE]: [0.88, 0.72, 0.25],
    [BLOCK.GLASS]: [0.78, 0.9, 0.96],
    [BLOCK.TORCH]: [1.0, 0.74, 0.28],
    [BLOCK.COBBLESTONE]: [0.48, 0.5, 0.52],
    [BLOCK.WOOD_PLANKS]: [0.68, 0.52, 0.32],
    [BLOCK.ROOF_TERRACOTTA]: [0.7, 0.32, 0.22],
    [BLOCK.WHITE_PLASTER]: [0.9, 0.88, 0.84],
    [BLOCK.STONE_BRICK]: [0.54, 0.55, 0.57],
    [BLOCK.WHEAT]: [0.84, 0.72, 0.3],
    [BLOCK.HAY_BALE]: [0.82, 0.7, 0.28],
    [BLOCK.TALL_GRASS]: [0.34, 0.62, 0.24],
    [BLOCK.FLOWER_RED]: [0.86, 0.22, 0.2],
    [BLOCK.FLOWER_YELLOW]: [0.95, 0.82, 0.2],
    [BLOCK.CACTUS]: [0.24, 0.56, 0.22],
    [BLOCK.WATER]: [0.35, 0.7, 0.92]
};

export function createVoxelParticles() {
    const px = new Float32Array(MAX_PARTICLES);
    const py = new Float32Array(MAX_PARTICLES);
    const pz = new Float32Array(MAX_PARTICLES);
    const vx = new Float32Array(MAX_PARTICLES);
    const vy = new Float32Array(MAX_PARTICLES);
    const vz = new Float32Array(MAX_PARTICLES);
    const cr = new Float32Array(MAX_PARTICLES);
    const cg = new Float32Array(MAX_PARTICLES);
    const cb = new Float32Array(MAX_PARTICLES);
    const size = new Float32Array(MAX_PARTICLES);
    const life = new Float32Array(MAX_PARTICLES);
    const maxLife = new Float32Array(MAX_PARTICLES);
    const grav = new Float32Array(MAX_PARTICLES);
    const glow = new Float32Array(MAX_PARTICLES);
    const vertexData = new Float32Array(MAX_PARTICLES * 6 * PARTICLE_STRIDE);
    let count = 0;

    const push = (x, y, z, dx, dy, dz, r, g, b, sz, ttl, gAcc, em) => {
        const idx = count < MAX_PARTICLES ? count++ : Math.floor(Math.random() * MAX_PARTICLES);
        px[idx] = x;
        py[idx] = y;
        pz[idx] = z;
        vx[idx] = dx;
        vy[idx] = dy;
        vz[idx] = dz;
        cr[idx] = r;
        cg[idx] = g;
        cb[idx] = b;
        size[idx] = sz;
        life[idx] = ttl;
        maxLife[idx] = ttl;
        grav[idx] = gAcc;
        glow[idx] = em;
    };

    const spawnBlockBreak = (bx, by, bz, blockId, amount = 14) => {
        const base = BLOCK_COLORS[blockId] || [0.6, 0.6, 0.6];
        const em = blockId === BLOCK.TORCH || blockId === BLOCK.LAVA ? 0.95 : 0;
        for (let i = 0; i < amount; i += 1) {
            const shade = 0.78 + Math.random() * 0.36;
            const ox = bx + 0.15 + Math.random() * 0.7;
            const oy = by + 0.15 + Math.random() * 0.7;
            const oz = bz + 0.15 + Math.random() * 0.7;
            const dx = (Math.random() - 0.5) * 3.4;
            const dy = 1.4 + Math.random() * 3.2;
            const dz = (Math.random() - 0.5) * 3.4;
            push(
                ox,
                oy,
                oz,
                dx,
                dy,
                dz,
                Math.min(1, base[0] * shade),
                Math.min(1, base[1] * shade),
                Math.min(1, base[2] * shade),
                0.055 + Math.random() * 0.055,
                0.36 + Math.random() * 0.34,
                -16,
                em
            );
        }
    };

    const spawnSplash = (wx, wy, wz, amount = 10) => {
        for (let i = 0; i < amount; i += 1) {
            const a = Math.random() * Math.PI * 2;
            const sp = 0.7 + Math.random() * 1.9;
            push(
                wx + (Math.random() - 0.5) * 0.5,
                wy + 0.05,
                wz + (Math.random() - 0.5) * 0.5,
                Math.cos(a) * sp,
                1.8 + Math.random() * 2.5,
                Math.sin(a) * sp,
                0.72,
                0.88,
                0.98,
                0.045 + Math.random() * 0.04,
                0.35 + Math.random() * 0.3,
                -14,
                0.15
            );
        }
    };

    const spawnTorchEmber = (bx, by, bz) => {
        const isSmoke = Math.random() < 0.45;
        push(
            bx + 0.5 + (Math.random() - 0.5) * 0.08,
            by + 0.72,
            bz + 0.5 + (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.18,
            isSmoke ? 0.55 + Math.random() * 0.35 : 0.35 + Math.random() * 0.25,
            (Math.random() - 0.5) * 0.18,
            isSmoke ? 0.32 : 1.0,
            isSmoke ? 0.32 : 0.72,
            isSmoke ? 0.34 : 0.22,
            isSmoke ? 0.05 : 0.042,
            isSmoke ? 0.65 : 0.45,
            0.1,
            isSmoke ? 0 : 1
        );
    };

    const step = (dt) => {
        const d = Math.min(0.05, Math.max(0.001, dt));
        let i = 0;
        while (i < count) {
            life[i] -= d;
            if (life[i] <= 0) {
                const last = count - 1;
                if (i < last) {
                    px[i] = px[last];
                    py[i] = py[last];
                    pz[i] = pz[last];
                    vx[i] = vx[last];
                    vy[i] = vy[last];
                    vz[i] = vz[last];
                    cr[i] = cr[last];
                    cg[i] = cg[last];
                    cb[i] = cb[last];
                    size[i] = size[last];
                    life[i] = life[last];
                    maxLife[i] = maxLife[last];
                    grav[i] = grav[last];
                    glow[i] = glow[last];
                }
                count -= 1;
                continue;
            }
            vy[i] += grav[i] * d;
            px[i] += vx[i] * d;
            py[i] += vy[i] * d;
            pz[i] += vz[i] * d;
            i += 1;
        }
    };

    const buildBillboardBuffer = (right, up) => {
        const rx = right[0];
        const ry = right[1];
        const rz = right[2];
        const ux = up[0];
        const uy = up[1];
        const uz = up[2];
        let o = 0;

        for (let i = 0; i < count; i += 1) {
            const alpha = Math.max(0, Math.min(1, life[i] / maxLife[i]));
            const s = size[i] * (0.45 + 0.55 * alpha);
            const x = px[i];
            const y = py[i];
            const z = pz[i];
            const r = cr[i];
            const g = cg[i];
            const b = cb[i];
            const em = glow[i];

            const dxR = rx * s;
            const dyR = ry * s;
            const dzR = rz * s;
            const dxU = ux * s;
            const dyU = uy * s;
            const dzU = uz * s;

            const v0x = x - dxR - dxU;
            const v0y = y - dyR - dyU;
            const v0z = z - dzR - dzU;
            const v1x = x + dxR - dxU;
            const v1y = y + dyR - dyU;
            const v1z = z + dzR - dzU;
            const v2x = x + dxR + dxU;
            const v2y = y + dyR + dyU;
            const v2z = z + dzR + dzU;
            const v3x = x - dxR + dxU;
            const v3y = y - dyR + dyU;
            const v3z = z - dzR + dzU;

            const write = (vx0, vy0, vz0) => {
                vertexData[o++] = vx0;
                vertexData[o++] = vy0;
                vertexData[o++] = vz0;
                vertexData[o++] = r;
                vertexData[o++] = g;
                vertexData[o++] = b;
                vertexData[o++] = alpha;
                vertexData[o++] = em;
            };
            write(v0x, v0y, v0z);
            write(v1x, v1y, v1z);
            write(v2x, v2y, v2z);
            write(v0x, v0y, v0z);
            write(v2x, v2y, v2z);
            write(v3x, v3y, v3z);
        }

        return { data: vertexData, vertCount: count * 6 };
    };

    const clear = () => {
        count = 0;
    };

    return {
        spawnBlockBreak,
        spawnSplash,
        spawnTorchEmber,
        step,
        buildBillboardBuffer,
        clear,
        count: () => count
    };
}
