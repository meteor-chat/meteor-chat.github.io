import * as THREE from "three";
import { WORLD_HALF } from "./gta-road-graph.js";

export const LAYER_NON_MOVING = 0;
export const LAYER_MOVING = 1;

export const WORLD_DEFAULTS = {
    fixedDt: 1 / 60,
    maxSteps: 4,
    collisionSteps: 1,
    staticFriction: 0.78,
    groundFriction: 1.0,
    boxCacheMax: 512,
    maxRayLength: 600
};

export function createJoltWorld(Jolt, options = {}) {
    const o = { ...WORLD_DEFAULTS, ...options };
    const settings = new Jolt.JoltSettings();
    const objectFilter = new Jolt.ObjectLayerPairFilterTable(2);
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);
    const bpStatic = new Jolt.BroadPhaseLayer(0);
    const bpMoving = new Jolt.BroadPhaseLayer(1);
    const bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(2, 2);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, bpStatic);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, bpMoving);
    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectVsBroadPhaseLayerFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(
        settings.mBroadPhaseLayerInterface,
        2,
        settings.mObjectLayerPairFilter,
        2
    );

    const jolt = new Jolt.JoltInterface(settings);
    const physicsSystem = jolt.GetPhysicsSystem();
    const bodyInterface = physicsSystem.GetBodyInterface();

    const sPos = new Jolt.RVec3(0, 0, 0);
    const sRot = new Jolt.Quat(0, 0, 0, 1);
    const sHalf = new Jolt.Vec3(0, 0, 0);
    const setRot = (q) => (q ? sRot.Set(q.x, q.y, q.z, q.w) : sRot.Set(0, 0, 0, 1));

    const trackedBodies = new Set();
    const addBody = (bcs, activate) => {
        const body = bodyInterface.CreateBody(bcs);
        bodyInterface.AddBody(body.GetID(), activate ? Jolt.EActivation_Activate : Jolt.EActivation_DontActivate);
        Jolt.destroy(bcs);
        trackedBodies.add(body);
        return body;
    };

    let accumulator = 0;
    const step = (frameDt, beforeEachStep = null) => {
        accumulator += Math.min(Math.max(frameDt, 0), o.fixedDt * o.maxSteps);
        let n = 0;
        while (accumulator >= o.fixedDt && n < o.maxSteps) {
            if (beforeEachStep) beforeEachStep(o.fixedDt);
            jolt.Step(o.fixedDt, o.collisionSteps);
            accumulator -= o.fixedDt;
            n += 1;
        }
        if (n === o.maxSteps) accumulator = 0;
        return accumulator / o.fixedDt;
    };

    const boxShapes = new Map();
    const boxShape = (hx, hy, hz) => {
        const key = `${hx.toFixed(2)},${hy.toFixed(2)},${hz.toFixed(2)}`;
        let shape = boxShapes.get(key);
        if (shape) return shape;
        sHalf.Set(hx, hy, hz);
        const bs = new Jolt.BoxShapeSettings(sHalf);
        shape = bs.Create().Get();
        Jolt.destroy(bs);
        shape.AddRef();
        boxShapes.set(key, shape);
        if (boxShapes.size > o.boxCacheMax) {
            const oldest = boxShapes.keys().next().value;
            boxShapes.get(oldest).Release();
            boxShapes.delete(oldest);
        }
        return shape;
    };

    const createDynamicShape = (shape, cfg) => {
        sPos.Set(cfg.position.x, cfg.position.y, cfg.position.z);
        setRot(cfg.rotation);
        const bcs = new Jolt.BodyCreationSettings(shape, sPos, sRot, Jolt.EMotionType_Dynamic, LAYER_MOVING);
        bcs.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
        bcs.mMassPropertiesOverride.mMass = cfg.mass;
        bcs.mFriction = cfg.friction ?? 0.8;
        bcs.mRestitution = cfg.restitution ?? 0.1;
        if (cfg.angularDamping != null) bcs.mAngularDamping = cfg.angularDamping;
        bcs.mAllowSleeping = cfg.allowSleeping !== false;
        return addBody(bcs, Boolean(cfg.activate));
    };

    const createDynamicBox = ({ x, y, z, hx, hy, hz, mass, rotation = null, friction = 0.75, activate = false }) => {
        sHalf.Set(hx, hy, hz);
        const bs = new Jolt.BoxShapeSettings(sHalf);
        const body = createDynamicShape(bs.Create().Get(), {
            position: { x, y, z },
            rotation,
            mass,
            friction,
            restitution: 0.14,
            activate
        });
        Jolt.destroy(bs);
        return body;
    };

    const createStaticBox = ({ x, y, z, hx, hy, hz, rotation = null, friction = o.staticFriction }) => {
        sPos.Set(x, y, z);
        setRot(rotation);
        const bcs = new Jolt.BodyCreationSettings(boxShape(hx, hy, hz), sPos, sRot, Jolt.EMotionType_Static, LAYER_NON_MOVING);
        bcs.mFriction = friction;
        return addBody(bcs, false);
    };

    const createStaticCompound = (boxes, ox = 0, oz = 0, friction = o.staticFriction) => {
        if (!boxes.length) return null;
        const cs = new Jolt.StaticCompoundShapeSettings();
        const p = new Jolt.Vec3(0, 0, 0);
        const q = new Jolt.Quat(0, 0, 0, 1);
        for (const b of boxes) {
            p.Set(b.x - ox, b.y, b.z - oz);
            if (b.rotation) q.Set(b.rotation.x, b.rotation.y, b.rotation.z, b.rotation.w);
            else q.Set(0, 0, 0, 1);
            cs.AddShapeShape(p, q, boxShape(b.hx, b.hy, b.hz), 0);
        }
        const res = cs.Create();
        const shape = res.HasError() ? null : res.Get();
        Jolt.destroy(cs);
        Jolt.destroy(p);
        Jolt.destroy(q);
        if (!shape) return null;
        sPos.Set(ox, 0, oz);
        sRot.Set(0, 0, 0, 1);
        const bcs = new Jolt.BodyCreationSettings(shape, sPos, sRot, Jolt.EMotionType_Static, LAYER_NON_MOVING);
        bcs.mFriction = friction;
        return addBody(bcs, false);
    };

    const createHeightfieldChunk = ({ x, z, size, cells, heights, friction = o.groundFriction }) => {
        const n = cells + 1;
        const cell = size / cells;
        const hf = new Jolt.HeightFieldShapeSettings();
        hf.mOffset.Set(x, 0, z);
        hf.mScale.Set(cell, 1, cell);
        hf.mSampleCount = n;
        hf.mHeightSamples.resize(n * n);
        new Float32Array(Jolt.HEAPF32.buffer, Jolt.getPointer(hf.mHeightSamples.data()), n * n).set(heights);
        sPos.Set(0, 0, 0);
        sRot.Set(0, 0, 0, 1);
        const bcs = new Jolt.BodyCreationSettings(hf.Create().Get(), sPos, sRot, Jolt.EMotionType_Static, LAYER_NON_MOVING);
        bcs.mFriction = friction;
        const body = addBody(bcs, false);
        Jolt.destroy(hf);
        return body;
    };

    const removeBody = (body) => {
        if (!body || !trackedBodies.has(body)) return;
        trackedBodies.delete(body);
        const id = body.GetID();
        bodyInterface.RemoveBody(id);
        bodyInterface.DestroyBody(id);
    };

    const ray = {
        bp: new Jolt.DefaultBroadPhaseLayerFilter(jolt.GetObjectVsBroadPhaseLayerFilter(), LAYER_MOVING),
        obj: new Jolt.DefaultObjectLayerFilter(jolt.GetObjectLayerPairFilter(), LAYER_MOVING),
        anyBody: new Jolt.BodyFilter(),
        ignore: new Map(),
        shape: new Jolt.ShapeFilter(),
        settings: new Jolt.RayCastSettings(),
        origin: new Jolt.RVec3(0, 0, 0),
        dir: new Jolt.Vec3(0, 0, 1),
        collector: new Jolt.CastRayClosestHitCollisionCollector()
    };
    ray.ray = new Jolt.RRayCast(ray.origin, ray.dir);

    const castRay = (from, dir, maxDist, { ignoreBody = null } = {}) => {
        if (!Number.isFinite(from.x + from.y + from.z + dir.x + dir.y + dir.z + maxDist)) return null;
        const len = Math.hypot(dir.x, dir.y, dir.z);
        if (len < 1e-9 || maxDist <= 0 || maxDist > o.maxRayLength) return null;
        const k = maxDist / len;
        ray.origin.Set(from.x, from.y, from.z);
        ray.dir.Set(dir.x * k, dir.y * k, dir.z * k);
        ray.ray.mOrigin = ray.origin;
        ray.ray.mDirection = ray.dir;
        let bodyFilter = ray.anyBody;
        if (ignoreBody) {
            const key = ignoreBody.GetID().GetIndexAndSequenceNumber();
            bodyFilter = ray.ignore.get(key);
            if (!bodyFilter) {
                bodyFilter = new Jolt.IgnoreSingleBodyFilter(ignoreBody.GetID());
                ray.ignore.set(key, bodyFilter);
            }
        }
        ray.collector.Reset();
        physicsSystem.GetNarrowPhaseQuery().CastRay(ray.ray, ray.settings, ray.collector, ray.bp, ray.obj, bodyFilter, ray.shape);
        if (!ray.collector.HadHit()) return null;
        const f = ray.collector.mHit.mFraction;
        const d = f * maxDist;
        return {
            fraction: f,
            distance: d,
            point: {
                x: from.x + (dir.x / len) * d,
                y: from.y + (dir.y / len) * d,
                z: from.z + (dir.z / len) * d
            },
            bodyId: ray.collector.mHit.mBodyID
        };
    };

    const populateCityColliders = (cityData, heightAtFn) => {
        const cells = 96;
        const n = cells + 1;
        const size = WORLD_HALF * 2;
        const heights = new Float32Array(n * n);
        const stepM = size / cells;
        for (let j = 0; j < n; j += 1) {
            const wz = -WORLD_HALF + j * stepM;
            for (let i = 0; i < n; i += 1) {
                const wx = -WORLD_HALF + i * stepM;
                heights[j * n + i] = heightAtFn(wx, wz);
            }
        }
        createHeightfieldChunk({ x: -WORLD_HALF, z: -WORLD_HALF, size, cells, heights });

        const compound = createStaticCompound(cityData.staticBoxes, 0, 0);
        if (!compound) {
            for (const b of cityData.staticBoxes) createStaticBox(b);
        }

        const sh = cityData.safehouse;
        createStaticBox({ x: sh.x, y: sh.y - 0.55, z: sh.z, hx: 17, hy: 0.6, hz: 11 });
        createStaticBox({ x: 0, y: 0.2, z: 322, hx: 7, hy: 0.7, hz: 36 });

        const qTmp = new THREE.Quaternion();
        const eTmp = new THREE.Euler();
        for (const r of cityData.ramps) {
            eTmp.set(-Math.atan2(r.h, r.l), r.yaw, 0, "YXZ");
            qTmp.setFromEuler(eTmp);
            createStaticBox({
                x: r.x,
                y: r.y + r.h * 0.5,
                z: r.z,
                hx: r.w * 0.5,
                hy: 0.24,
                hz: r.l * 0.5,
                rotation: { x: qTmp.x, y: qTmp.y, z: qTmp.z, w: qTmp.w },
                friction: 1.0
            });
        }

        const propBodies = [];
        for (const p of cityData.dynamicProps) {
            const body = createDynamicBox({
                x: p.x,
                y: p.y,
                z: p.z,
                hx: 0.28,
                hy: 0.52,
                hz: 0.28,
                mass: p.kind === "cone" ? 12 : 45,
                activate: false
            });
            propBodies.push({ body, kind: p.kind });
        }
        return propBodies;
    };

    const dispose = () => {
        for (const body of Array.from(trackedBodies)) removeBody(body);
        for (const shape of boxShapes.values()) shape.Release();
        boxShapes.clear();
        for (const bf of ray.ignore.values()) Jolt.destroy(bf);
        ray.ignore.clear();
        Jolt.destroy(ray.ray);
        Jolt.destroy(ray.collector);
        Jolt.destroy(ray.dir);
        Jolt.destroy(ray.origin);
        Jolt.destroy(ray.settings);
        Jolt.destroy(ray.shape);
        Jolt.destroy(ray.anyBody);
        Jolt.destroy(ray.obj);
        Jolt.destroy(ray.bp);
        Jolt.destroy(sPos);
        Jolt.destroy(sRot);
        Jolt.destroy(sHalf);
        Jolt.destroy(jolt);
    };

    return {
        Jolt,
        jolt,
        physicsSystem,
        bodyInterface,
        layers: { NON_MOVING: LAYER_NON_MOVING, MOVING: LAYER_MOVING },
        get fixedDt() {
            return o.fixedDt;
        },
        step,
        boxShape,
        createDynamicShape,
        createDynamicBox,
        createStaticBox,
        createStaticCompound,
        createHeightfieldChunk,
        populateCityColliders,
        removeBody,
        castRay,
        dispose
    };
}
