import { mulberry32 } from "../voxel/voxel-noise.js";
import {
    SAFEHOUSE_ORIGIN,
    SIDEWALK_HALF_WIDTH,
    X_ROADS,
    Z_ROADS,
    buildRoadGraph,
    heightAt
} from "./gta-road-graph.js";

function blockDistrict(cx, cz) {
    if (cz < -180) return "vinewood";
    if (cz < -90) return Math.abs(cx) <= 140 ? "downtown" : "eclipse";
    if (cz < 45) return Math.abs(cx) <= 110 ? "downtown" : "strawberry";
    if (cz < 180) return "strawberry";
    return "beach";
}

export function buildCityData(seed = 2026) {
    const rng = mulberry32(seed ^ 0x51a7f3);
    const graph = buildRoadGraph();
    const buildings = [];
    const palms = [];
    const lamps = [];
    const trafficLights = [];
    const billboards = [];
    const dynamicProps = [];
    const ramps = [];
    const staticBoxes = [];

    const addBoxCollider = (x, y, z, hx, hy, hz, yaw = 0) => {
        staticBoxes.push({ x, y, z, hx, hy, hz, yaw });
    };

    const mazeX = -45;
    const mazeZ = -135;
    const mazeBaseY = heightAt(mazeX, mazeZ);
    const mazeTower = {
        x: mazeX,
        y: mazeBaseY,
        z: mazeZ,
        radius: 17,
        height: 138
    };
    addBoxCollider(mazeX, mazeBaseY + 69, mazeZ, 16, 69, 16);

    const craneX = 45;
    const craneZ = -45;
    const craneY = heightAt(craneX, craneZ);
    const constructionSite = {
        x: craneX,
        y: craneY,
        z: craneZ,
        w: 44,
        d: 40,
        floors: 5,
        craneHeight: 68
    };
    addBoxCollider(craneX - 10, craneY + 14, craneZ, 11, 14, 16);

    for (let bz = 0; bz < Z_ROADS.length - 1; bz += 1) {
        const z0 = Z_ROADS[bz] + SIDEWALK_HALF_WIDTH + 2;
        const z1 = Z_ROADS[bz + 1] - SIDEWALK_HALF_WIDTH - 2;
        const cz = (z0 + z1) * 0.5;
        for (let bx = 0; bx < X_ROADS.length - 1; bx += 1) {
            const x0 = X_ROADS[bx] + SIDEWALK_HALF_WIDTH + 2;
            const x1 = X_ROADS[bx + 1] - SIDEWALK_HALF_WIDTH - 2;
            const cx = (x0 + x1) * 0.5;

            if (Math.hypot(cx - mazeX, cz - mazeZ) < 28) continue;
            if (Math.hypot(cx - craneX, cz - craneZ) < 28) continue;

            const dist = blockDistrict(cx, cz);
            const subX = 2;
            const subZ = 2;
            const cellW = (x1 - x0) / subX;
            const cellD = (z1 - z0) / subZ;

            for (let sz = 0; sz < subZ; sz += 1) {
                for (let sx = 0; sx < subX; sx += 1) {
                    const pad = 2.4 + rng() * 2.6;
                    const w = Math.max(12, cellW - pad * 2);
                    const d = Math.max(12, cellD - pad * 2);
                    const px = x0 + (sx + 0.5) * cellW;
                    const pz = z0 + (sz + 0.5) * cellD;
                    const groundY = Math.min(
                        heightAt(px - w * 0.45, pz - d * 0.45),
                        heightAt(px + w * 0.45, pz + d * 0.45),
                        heightAt(px, pz)
                    );

                    let style = "commercial";
                    let h = 14 + rng() * 16;
                    let tint = 0xffffff;
                    if (dist === "downtown") {
                        const tall = rng() < 0.72;
                        style = tall ? "glassTower" : "officeLight";
                        h = tall ? 46 + rng() * 68 : 26 + rng() * 28;
                        tint = tall
                            ? [0xcfe8ff, 0xbad7f0, 0xd8ecff, 0xa8c8e2][Math.floor(rng() * 4)]
                            : [0xe6e0d4, 0xd5d8de, 0xc9d0da][Math.floor(rng() * 3)];
                    } else if (dist === "eclipse" || dist === "vinewood") {
                        style = rng() < 0.58 ? "officeLight" : "glassTower";
                        h = 18 + rng() * 34;
                        tint = [0xf2ece0, 0xe4dfd4, 0xd7e7f5][Math.floor(rng() * 3)];
                    } else if (dist === "strawberry") {
                        const r = rng();
                        if (r < 0.22) {
                            style = "diner";
                            h = 7.5 + rng() * 3.5;
                            tint = 0xffffff;
                        } else if (r < 0.65) {
                            style = "commercial";
                            h = 9 + rng() * 11;
                            tint = [0xf4e4c9, 0xe8d5b7, 0xdce2e8, 0xf2d0c2][Math.floor(rng() * 4)];
                        } else {
                            style = "apartment";
                            h = 16 + rng() * 16;
                            tint = [0xe4c7a8, 0xd6b89c, 0xcfc4b8][Math.floor(rng() * 3)];
                        }
                    } else {
                        style = rng() < 0.5 ? "apartment" : "commercial";
                        h = 10 + rng() * 16;
                        tint = [0xfaf0df, 0xf7d8c4, 0xd8f0f2, 0xf2e6c8][Math.floor(rng() * 4)];
                    }

                    buildings.push({ x: px, y: groundY, z: pz, w, d, h, style, tint });
                    addBoxCollider(px, groundY + h * 0.5, pz, w * 0.5, h * 0.5, d * 0.5);

                    if (h >= 24 && rng() < 0.16 && billboards.length < 22) {
                        const faceSouth = rng() < 0.5;
                        billboards.push({
                            x: px,
                            y: groundY + Math.min(h * 0.62, 26),
                            z: pz + (faceSouth ? d * 0.5 + 0.35 : -d * 0.5 - 0.35),
                            w: Math.min(w * 0.78, 16),
                            h: 9.5,
                            yaw: faceSouth ? 0 : Math.PI,
                            variant: billboards.length % 2
                        });
                    }
                }
            }
        }
    }

    for (let zi = 0; zi < Z_ROADS.length; zi += 1) {
        const rz = Z_ROADS[zi];
        for (let x = -255; x <= 255; x += 26) {
            if (X_ROADS.some((rx) => Math.abs(x - rx) < 16)) continue;
            for (const side of [-1, 1]) {
                const pz = rz + side * 11.2;
                const py = heightAt(x, pz);
                if (Math.abs(x) < 14 && pz < -274) continue;
                if (((Math.abs(x) + zi * 13) % 52) < 26) {
                    palms.push({
                        x,
                        y: py,
                        z: pz,
                        height: 11 + rng() * 7.5,
                        lean: (rng() - 0.5) * 0.14,
                        yaw: rng() * Math.PI * 2
                    });
                } else {
                    lamps.push({ x, y: py, z: pz, yaw: side < 0 ? 0 : Math.PI });
                }
            }
        }
    }

    for (let xi = 0; xi < X_ROADS.length; xi += 1) {
        const rx = X_ROADS[xi];
        for (let z = -252; z <= 252; z += 34) {
            if (Z_ROADS.some((rz) => Math.abs(z - rz) < 16)) continue;
            const px = rx + 11.2;
            const py = heightAt(px, z);
            if (rng() < 0.55) {
                palms.push({
                    x: px,
                    y: py,
                    z,
                    height: 10.5 + rng() * 6.5,
                    lean: (rng() - 0.5) * 0.12,
                    yaw: rng() * Math.PI * 2
                });
            } else {
                lamps.push({ x: px, y: py, z, yaw: -Math.PI * 0.5 });
            }
        }
    }

    for (let x = -250; x <= 250; x += 22) {
        if (Math.abs(x) < 12) continue;
        const bz = 294 + (rng() - 0.5) * 14;
        palms.push({
            x,
            y: heightAt(x, bz),
            z: bz,
            height: 11 + rng() * 6,
            lean: 0.16 + rng() * 0.1,
            yaw: rng() * Math.PI * 2
        });
    }

    for (let iz = 1; iz < Z_ROADS.length - 1; iz += 1) {
        for (let ix = 1; ix < X_ROADS.length - 1; ix += 1) {
            const x = X_ROADS[ix] + 10.4;
            const z = Z_ROADS[iz] + 10.4;
            trafficLights.push({ ix, iz, x, y: heightAt(x, z), z });
        }
    }

    const rampSpecs = [
        { x: 0, z: 45, yaw: 0, w: 6.2, h: 2.8, l: 12 },
        { x: 90, z: 135, yaw: Math.PI, w: 6.2, h: 3.1, l: 13 },
        { x: -90, z: 45, yaw: 0, w: 6.2, h: 2.6, l: 11 },
        { x: 45, z: -90, yaw: Math.PI * 0.5, w: 5.8, h: 2.5, l: 11 }
    ];
    for (const r of rampSpecs) {
        const y = heightAt(r.x, r.z);
        ramps.push({ ...r, y });
    }

    for (let i = 0; i < 48; i += 1) {
        const rz = Z_ROADS[1 + (i % 5)];
        const rx = -210 + ((i * 53) % 420);
        if (X_ROADS.some((x) => Math.abs(rx - x) < 15)) continue;
        const side = i % 2 === 0 ? 1 : -1;
        const pz = rz + side * 9.5;
        const py = heightAt(rx, pz);
        dynamicProps.push({
            x: rx,
            y: py + 0.55,
            z: pz,
            kind: i % 3 === 0 ? "hydrant" : i % 3 === 1 ? "bollard" : "cone"
        });
    }

    const safehouse = {
        x: SAFEHOUSE_ORIGIN.x,
        y: heightAt(SAFEHOUSE_ORIGIN.x, SAFEHOUSE_ORIGIN.z),
        z: SAFEHOUSE_ORIGIN.z,
        spawnPlayer: { x: 0, y: heightAt(0, -304) + 0.15, z: -304 },
        parkedCars: [
            { preset: "elegy", x: 1.6, z: -290, yaw: 0 },
            { preset: "gauntlet", x: -4.8, z: -288, yaw: -0.08 },
            { preset: "cavalcade", x: 18, z: -264, yaw: Math.PI * 0.5 },
            { preset: "cruiser", x: -34, z: -90, yaw: Math.PI * 0.5 }
        ]
    };

    addBoxCollider(safehouse.x - 16, safehouse.y + 3.2, safehouse.z - 4, 2.2, 3.2, 8);
    addBoxCollider(safehouse.x + 16, safehouse.y + 3.2, safehouse.z - 4, 2.2, 3.2, 8);
    addBoxCollider(safehouse.x, safehouse.y + 3.2, safehouse.z - 12, 18, 3.2, 1.4);

    return {
        graph,
        buildings,
        mazeTower,
        constructionSite,
        safehouse,
        palms,
        lamps,
        trafficLights,
        billboards,
        ramps,
        dynamicProps,
        staticBoxes
    };
}
