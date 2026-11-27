import * as THREE from "three";
import {
    SURFACES,
    VEHICLE_PRESETS,
    computeGearAndRpm,
    computeTireGrip,
    stepVehicleSteering
} from "./gta-vehicle-specs.js";

const DEG = Math.PI / 180;
const LONG_CURVE = [[0, 0], [0.06, 1.42], [0.22, 1.18]];
const LAT_CURVE = [[0, 0], [3, 1.62], [20, 1.28]];
const GEAR_RATIOS = [3.85, 2.65, 1.88, 1.38, 1.02];

function yawQuat(yaw) {
    return { x: 0, y: Math.sin(yaw * 0.5), z: 0, w: Math.cos(yaw * 0.5) };
}

export class JoltCar {
    constructor(world, options = {}) {
        const preset = VEHICLE_PRESETS[options.preset || "elegy"] || VEHICLE_PRESETS.elegy;
        const o = {
            ...preset,
            spawn: options.spawn || { x: 0, z: 0 },
            yaw: options.yaw || 0,
            heightAt: options.heightAt || null,
            angularDamping: 0.26,
            maxPitchRoll: 62 * DEG,
            suspMinFrac: 0.42,
            suspMaxFrac: 1.24,
            castRadiusFrac: 0.52,
            maxSteer: 42 * DEG,
            highSpeedSteer: 0.46,
            maxBrakeTorque: 9400,
            maxHandBrakeTorque: 28000,
            minRPM: 900,
            maxRPM: 7400,
            reverseRatio: -3.6,
            clutchStrength: 14,
            topSpeedDrag: 1.9,
            reverseRearmSpeed: 0.9,
            holdBrakeOn: 0.45,
            holdBrakeOff: 0.9,
            parkPinSpeed: 0.35,
            sleepSpeed: 0.05,
            handbrakeDecel: 8.2,
            airGravity: 1.85,
            wetLong: 0.14,
            wetLat: 0.16,
            waterFloatOffset: 0.45,
            waterBuoyancy: 14,
            waterDamping: 4,
            waterDrag: 3.2,
            waterDragK: 0.9,
            waterMaxLift: 22,
            fallThrough: 2.4,
            spawnClearance: 0.14
        };
        this.o = o;
        this.preset = preset;
        this.world = world;
        this.Jolt = world.Jolt;
        this.bi = world.bodyInterface;
        this.wheelDefs = [
            { x: -o.halfTrack, z: o.halfWheelbase, steer: true, handbrake: false },
            { x: o.halfTrack, z: o.halfWheelbase, steer: true, handbrake: false },
            { x: -o.halfTrack, z: -o.halfWheelbase, steer: false, handbrake: true },
            { x: o.halfTrack, z: -o.halfWheelbase, steer: false, handbrake: true }
        ];

        const n = this.wheelDefs.length;
        this.fwdSpeed = 0;
        this.lateralSpeed = 0;
        this.airborne = false;
        this.inWater = false;
        this.braking = false;
        this.reversing = false;
        this.drifting = false;
        this.nitroActive = false;
        this.telemetry = { gear: "D1", gearNum: 1, rpm: 860, mph: 0 };
        this.wheelContacts = this.wheelDefs.map(() => ({ x: 0, y: 0, z: 0, grounded: false, surface: "asphalt" }));
        this._steer = 0;
        this._steerAngle = 0;
        this._revArm = true;
        this._holdBrake = false;
        this._wasAirborne = false;
        this._surfaceKey = new Array(n).fill(null);
        this._spin = new Array(n).fill(0);
        this._susp = new Array(n).fill(o.suspRest);
        this._prev = {
            pos: new THREE.Vector3(),
            quat: new THREE.Quaternion(),
            spin: new Array(n).fill(0),
            susp: new Array(n).fill(o.suspRest),
            steer: 0
        };
        this._pos = new THREE.Vector3();
        this._quat = new THREE.Quaternion();
        this._fwd = new THREE.Vector3(0, 0, 1);
        this._right = new THREE.Vector3(1, 0, 0);
        this._tmp = new THREE.Vector3();
        this._rq = new THREE.Quaternion();
        this._rp = new THREE.Vector3();
        this._bq = new THREE.Quaternion();
        this.renderFwd = new THREE.Vector3(0, 0, 1);
        this._imp = new this.Jolt.Vec3(0, 0, 0);

        const [hx, , hz] = o.halfExtents;
        const y0 = (o.heightAt ? o.heightAt(o.spawn.x, o.spawn.z) : 0) + this.#rideY();
        this.body = world.createDynamicShape(this.#chassisShape(hx, hz), {
            position: { x: o.spawn.x, y: y0, z: o.spawn.z },
            rotation: yawQuat(o.yaw),
            mass: o.mass,
            friction: 0.78,
            restitution: 0.12,
            angularDamping: o.angularDamping,
            allowSleeping: false,
            activate: true
        });
        this.bodyId = this.body.GetID();
        this.#createConstraint();
        this.#snapHistory();
    }

    #rideY() {
        return this.o.suspRest + this.o.wheelRadius + this.o.spawnClearance;
    }

    #chassisShape(hx, hz) {
        const { Jolt, o } = this;
        const liftPos = new Jolt.Vec3(0, o.bodyLift * 0.5, 0);
        const boxHalf = new Jolt.Vec3(hx, o.halfExtents[1] - o.bodyLift * 0.5, hz);
        const boxSet = new Jolt.BoxShapeSettings(boxHalf);
        const trans = new Jolt.RotatedTranslatedShapeSettings(liftPos, Jolt.Quat.prototype.sIdentity(), boxSet);
        const comVec = new Jolt.Vec3(0, -o.comDrop, 0);
        const comSet = new Jolt.OffsetCenterOfMassShapeSettings(comVec, trans);
        const shape = comSet.Create().Get();
        Jolt.destroy(comVec);
        Jolt.destroy(boxHalf);
        Jolt.destroy(liftPos);
        return shape;
    }

    #createConstraint() {
        const { Jolt, o } = this;
        const settings = new Jolt.VehicleConstraintSettings();
        settings.mMaxPitchRollAngle = o.maxPitchRoll;
        settings.mWheels.clear();
        for (const w of this.wheelDefs) {
            const s = new Jolt.WheelSettingsWV();
            s.mPosition = new Jolt.Vec3(w.x, o.mountY, w.z);
            s.mSuspensionDirection = new Jolt.Vec3(0, -1, 0);
            s.mSteeringAxis = new Jolt.Vec3(0, 1, 0);
            s.mWheelUp = new Jolt.Vec3(0, 1, 0);
            s.mWheelForward = new Jolt.Vec3(0, 0, 1);
            s.mRadius = o.wheelRadius;
            s.mWidth = o.wheelWidth;
            s.mSuspensionMinLength = o.suspRest * o.suspMinFrac;
            s.mSuspensionMaxLength = o.suspRest * o.suspMaxFrac;
            s.mSuspensionSpring.mFrequency = o.suspFrequency;
            s.mSuspensionSpring.mDamping = o.suspDamping;
            s.mMaxSteerAngle = w.steer ? o.maxSteer : 0;
            s.mMaxBrakeTorque = o.maxBrakeTorque;
            s.mMaxHandBrakeTorque = w.handbrake ? o.maxHandBrakeTorque : 0;
            settings.mWheels.push_back(s);
        }
        const c = new Jolt.WheeledVehicleControllerSettings();
        c.mEngine.mMaxTorque = o.engineTorque;
        c.mEngine.mMinRPM = o.minRPM;
        c.mEngine.mMaxRPM = o.maxRPM;
        c.mTransmission.mMode = Jolt.ETransmissionMode_Auto;
        c.mTransmission.mGearRatios.clear();
        for (const ratio of GEAR_RATIOS) c.mTransmission.mGearRatios.push_back(ratio);
        c.mTransmission.mReverseGearRatios.clear();
        c.mTransmission.mReverseGearRatios.push_back(o.reverseRatio);
        c.mTransmission.mSwitchTime = 0.08;
        c.mTransmission.mClutchStrength = o.clutchStrength;
        c.mDifferentials.clear();
        for (const [l, r, share] of o.differentials) {
            const d = new Jolt.VehicleDifferentialSettings();
            d.mLeftWheel = l;
            d.mRightWheel = r;
            d.mEngineTorqueRatio = share;
            c.mDifferentials.push_back(d);
        }
        settings.mController = c;
        settings.mAntiRollBars.clear();
        for (let i = 0; i + 1 < this.wheelDefs.length; i += 2) {
            const bar = new Jolt.VehicleAntiRollBar();
            bar.mLeftWheel = i;
            bar.mRightWheel = i + 1;
            bar.mStiffness = o.antiRoll;
            settings.mAntiRollBars.push_back(bar);
        }
        this.constraint = new Jolt.VehicleConstraint(this.body, settings);
        this.constraint.SetVehicleCollisionTester(
            new Jolt.VehicleCollisionTesterCastSphere(this.world.layers.MOVING, o.wheelRadius * o.castRadiusFrac)
        );
        this.world.physicsSystem.AddConstraint(this.constraint);
        this.stepListener = new Jolt.VehicleConstraintStepListener(this.constraint);
        this.world.physicsSystem.AddStepListener(this.stepListener);
        this.controller = Jolt.castObject(this.constraint.GetController(), Jolt.WheeledVehicleController);
    }

    #setWheelFriction(jw, longGrip, latGrip) {
        const ws = this.Jolt.castObject(jw.GetSettings(), this.Jolt.WheelSettingsWV);
        ws.mLongitudinalFriction.Clear();
        for (const [x, y] of LONG_CURVE) ws.mLongitudinalFriction.AddPoint(x, y * longGrip);
        ws.mLateralFriction.Clear();
        for (const [x, y] of LAT_CURVE) ws.mLateralFriction.AddPoint(x, y * latGrip);
    }

    #readPose(pos, quat) {
        const p = this.body.GetPosition();
        const q = this.body.GetRotation();
        pos.set(p.GetX(), p.GetY(), p.GetZ());
        quat.set(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
    }

    #snapHistory() {
        this.#readPose(this._prev.pos, this._prev.quat);
        this._pos.copy(this._prev.pos);
        this._quat.copy(this._prev.quat);
        for (let i = 0; i < this._spin.length; i += 1) {
            this._prev.spin[i] = this._spin[i];
            this._prev.susp[i] = this._susp[i];
        }
        this._prev.steer = this._steerAngle;
    }

    #impulse(x, y, z) {
        this._imp.Set(x, y, z);
        this.bi.AddImpulse(this.bodyId, this._imp);
    }

    #angularImpulse(x, y, z) {
        this._imp.Set(x, y, z);
        this.bi.AddAngularImpulse(this.bodyId, this._imp);
    }

    update(dt, input = {}, env = {}) {
        const { o, bi } = this;
        const heightAt = env.heightAt ?? o.heightAt;
        const handbrake = Boolean(input.handbrake);

        this.#readPose(this._pos, this._quat);
        this._prev.pos.copy(this._pos);
        this._prev.quat.copy(this._quat);
        for (let i = 0; i < this._spin.length; i += 1) {
            this._prev.spin[i] = this._spin[i];
            this._prev.susp[i] = this._susp[i];
        }
        this._prev.steer = this._steerAngle;

        const cx = this._pos.x;
        const cy = this._pos.y;
        const cz = this._pos.z;
        this._fwd.set(0, 0, 1).applyQuaternion(this._quat);
        this._right.set(1, 0, 0).applyQuaternion(this._quat);

        if (heightAt && cy < heightAt(cx, cz) - o.fallThrough) {
            this.place({ x: cx, y: heightAt(cx, cz) + o.restHeight + 0.4, z: cz }, this._quat);
            return;
        }

        const lin = this.body.GetLinearVelocity();
        const lvx = lin.GetX();
        const lvy = lin.GetY();
        const lvz = lin.GetZ();
        const hSpeed = Math.hypot(lvx, lvz);
        const fwdSpeed = lvx * this._fwd.x + lvy * this._fwd.y + lvz * this._fwd.z;
        const latSpeed = lvx * this._right.x + lvz * this._right.z;
        const m = o.mass;

        const steerStep = stepVehicleSteering(this._steer, input.steer ?? 0, hSpeed, o.topSpeed, dt, {
            highSpeedSteer: o.highSpeedSteer
        });
        this._steer = steerStep.rawSteer;
        const effectiveSteer = steerStep.effectiveSteer;
        this._steerAngle = effectiveSteer * o.maxSteer;

        const waterY = env.waterLevelAt ? env.waterLevelAt(cx, cz) : null;
        this.inWater = waterY != null;
        if (this.inWater) {
            const sub = waterY + o.waterFloatOffset - cy;
            if (sub > 0) {
                const lift = Math.min(o.waterMaxLift, Math.max(0, sub * o.waterBuoyancy - lvy * o.waterDamping));
                this.#impulse(0, lift * m * dt, 0);
            }
            if (hSpeed > 0.01) {
                const k = (-Math.min(hSpeed / dt, o.waterDrag + hSpeed * o.waterDragK) * m * dt) / hSpeed;
                this.#impulse(lvx * k, 0, lvz * k);
            }
        }

        let anyContact = false;
        const wet = env.wetness ?? 0;
        for (let i = 0; i < this.wheelDefs.length; i += 1) {
            const w = this.wheelDefs[i];
            const mount = this._tmp.set(w.x, o.mountY, w.z).applyQuaternion(this._quat);
            const mx = cx + mount.x;
            const mz = cz + mount.z;
            const jw = this.constraint.GetWheel(i);
            this._susp[i] = Math.max(0.05, jw.GetSuspensionLength());
            const surfName = env.surfaceAt ? env.surfaceAt(mx, mz) : "asphalt";
            const wc = this.wheelContacts[i];
            wc.grounded = jw.HasContact();
            wc.surface = surfName;
            if (wc.grounded) {
                anyContact = true;
                wc.x = mx;
                wc.z = mz;
                wc.y = heightAt ? heightAt(mx, mz) : cy + mount.y - this._susp[i] - o.wheelRadius;
            }
            const slide = handbrake && w.handbrake;
            const grip = computeTireGrip(surfName, wet, slide, o.wetLong, o.wetLat, o.handbrakeLat);
            const key = `${surfName}|${grip.wetShare}|${slide ? "s" : "g"}`;
            if (this._surfaceKey[i] !== key) {
                this._surfaceKey[i] = key;
                this.#setWheelFriction(jw, grip.longGrip, grip.latGrip);
            }
        }

        const throttleIn = input.throttle ?? 0;
        const brakeIn = input.brake ?? 0;
        let throttle = 0;
        let brake = 0;
        if (throttleIn > 0 && brakeIn === 0) {
            throttle = throttleIn;
            this._revArm = false;
        } else if (brakeIn > 0) {
            if (fwdSpeed > o.reverseRearmSpeed) {
                brake = brakeIn;
                this._revArm = false;
            } else if (fwdSpeed <= 0.55 || this._revArm) {
                this._revArm = true;
                throttle = -brakeIn;
            } else {
                brake = brakeIn;
            }
        } else {
            this._revArm = true;
            if (!handbrake) {
                if (Math.abs(fwdSpeed) < o.holdBrakeOn) this._holdBrake = true;
                else if (Math.abs(fwdSpeed) > o.holdBrakeOff) this._holdBrake = false;
                if (this._holdBrake) brake = 1;
            } else {
                this._holdBrake = false;
            }
        }

        this.controller.SetDriverInput(throttle, effectiveSteer, brake, handbrake ? 1 : 0);

        const airborne = !anyContact;
        if (airborne !== this._wasAirborne) {
            this._wasAirborne = airborne;
            bi.SetGravityFactor(this.bodyId, airborne ? o.airGravity : 1);
        }
        const grounded = anyContact && !this.inWater;
        if (grounded && hSpeed > 1.4) {
            const ang = this.body.GetAngularVelocity();
            const yawRate = ang.GetY();
            const dirSign = fwdSpeed >= -0.3 ? 1 : -1;
            const speedBlend = Math.min(1, hSpeed / 11);
            const targetYawRate = -effectiveSteer * dirSign * (handbrake ? 2.55 : 1.75) * speedBlend;
            const yawErr = targetYawRate - yawRate;
            this.#angularImpulse(0, yawErr * m * 0.42 * dt, 0);

            if (!handbrake && Math.abs(latSpeed) > 0.6) {
                const latDamp = -latSpeed * m * 2.1 * dt;
                this.#impulse(this._right.x * latDamp, 0, this._right.z * latDamp);
            }
        }
        const nitroOn = Boolean(input.nitro) && throttle > 0.2 && grounded && fwdSpeed < o.topSpeed * 1.18;
        this.nitroActive = nitroOn;
        if (nitroOn) {
            const boostAccel = 13.5 * m * dt;
            this.#impulse(this._fwd.x * boostAccel, 0, this._fwd.z * boostAccel);
        }

        if (handbrake && grounded && hSpeed > 0.6) {
            const k = (-Math.min(hSpeed / dt, o.handbrakeDecel) * m * dt) / hSpeed;
            this.#impulse(lvx * k, 0, lvz * k);
        }

        const speedCap = nitroOn ? o.topSpeed * 1.18 : o.topSpeed;
        if (o.topSpeedDrag > 0 && grounded && Math.abs(fwdSpeed) > speedCap) {
            const excess = Math.abs(fwdSpeed) - speedCap;
            const k = (-Math.min(excess, excess * o.topSpeedDrag * dt) * m) / Math.max(0.01, hSpeed);
            this.#impulse(lvx * k, 0, lvz * k);
        }

        const idle = throttleIn === 0 && brakeIn === 0;
        if (grounded && idle && hSpeed < o.parkPinSpeed && Math.abs(fwdSpeed) < o.parkPinSpeed) {
            this._imp.Set(0, Math.min(0, lvy), 0);
            bi.SetLinearVelocity(this.bodyId, this._imp);
            if (hSpeed < o.sleepSpeed && Math.abs(lvy) < o.sleepSpeed) bi.DeactivateBody(this.bodyId);
        }
        if (throttle !== 0 || brakeIn > 0 || (input.steer ?? 0) !== 0 || handbrake || nitroOn || Math.abs(fwdSpeed) > o.sleepSpeed || airborne) {
            bi.ActivateBody(this.bodyId);
        }

        this.airborne = airborne;
        this.fwdSpeed = fwdSpeed;
        this.lateralSpeed = latSpeed;
        this.braking = (brake > 0 || handbrake) && fwdSpeed > 1.0;
        this.reversing = throttle < 0 || fwdSpeed < -0.5;
        this.drifting = grounded && hSpeed > 6 && (Math.abs(latSpeed) > 2.8 || (handbrake && Math.abs(this._steer) > 0.2));
        this.telemetry = computeGearAndRpm(fwdSpeed, Math.max(0, throttle), this.reversing);

        const roll = fwdSpeed / o.wheelRadius;
        for (let i = 0; i < this.wheelDefs.length; i += 1) {
            const jw = this.constraint.GetWheel(i);
            const wv = handbrake && this.wheelDefs[i].handbrake ? 0 : jw.HasContact() ? roll : jw.GetAngularVelocity();
            this._spin[i] += wv * dt;
        }
    }

    get speed() {
        const v = this.body.GetLinearVelocity();
        return Math.hypot(v.GetX(), v.GetZ());
    }

    get pose() {
        this.#readPose(this._pos, this._quat);
        const f = this._fwd.set(0, 0, 1).applyQuaternion(this._quat);
        return {
            position: this._pos.clone(),
            quaternion: this._quat.clone(),
            yaw: Math.atan2(f.x, f.z)
        };
    }

    applyPoseTo(object3D, wheels = [], alpha = 1) {
        const p = this.body.GetPosition();
        const q = this.body.GetRotation();
        this._rp.set(p.GetX(), p.GetY(), p.GetZ()).lerpVectors(this._prev.pos, this._rp, alpha);
        this._bq.set(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
        this._rq.slerpQuaternions(this._prev.quat, this._bq, alpha);
        this.renderFwd.set(0, 0, 1).applyQuaternion(this._rq);
        if (object3D) {
            object3D.position.copy(this._rp);
            object3D.quaternion.copy(this._rq);
        }
        const lerp = (a, b) => a + (b - a) * alpha;
        const steer = lerp(this._prev.steer, this._steerAngle);
        for (let i = 0; i < wheels.length && i < this.wheelDefs.length; i += 1) {
            const w = this.wheelDefs[i];
            const mesh = wheels[i];
            if (!mesh) continue;
            this._tmp.set(w.x, this.o.mountY - lerp(this._prev.susp[i], this._susp[i]), w.z).applyQuaternion(this._rq);
            mesh.position.copy(this._rp).add(this._tmp);
            mesh.quaternion.copy(this._rq);
            if (w.steer) mesh.rotateY(-steer);
            mesh.rotateX(lerp(this._prev.spin[i], this._spin[i]));
        }
    }

    place(position, quaternion) {
        const { Jolt, bi, o } = this;
        const y = position.y ?? ((o.heightAt ? o.heightAt(position.x, position.z) : 0) + this.#rideY());
        const p = new Jolt.RVec3(position.x, y, position.z);
        const q = new Jolt.Quat(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        bi.SetPositionAndRotation(this.bodyId, p, q, Jolt.EActivation_Activate);
        this._imp.Set(0, 0, 0);
        bi.SetLinearVelocity(this.bodyId, this._imp);
        bi.SetAngularVelocity(this.bodyId, this._imp);
        Jolt.destroy(p);
        Jolt.destroy(q);
        this._steer = 0;
        this._steerAngle = 0;
        this.#snapHistory();
    }

    reset(position, yaw = 0) {
        this.place({ x: position.x, y: position.y ?? null, z: position.z }, yawQuat(yaw));
    }

    dispose() {
        if (!this.body) return;
        const ps = this.world.physicsSystem;
        ps.RemoveStepListener(this.stepListener);
        ps.RemoveConstraint(this.constraint);
        this.world.removeBody(this.body);
        this.Jolt.destroy(this._imp);
        this.body = null;
        this.constraint = null;
        this.controller = null;
    }
}

export { SURFACES };
