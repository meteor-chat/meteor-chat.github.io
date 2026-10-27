import { Boid, limitVector, setVectorMag, distance } from "./boids-agent.js?v=1";

export class BoidsEngine {
    constructor() {
        this.boids = [];
        this.separationWeight = 1.5;
        this.alignmentWeight = 1.0;
        this.cohesionWeight = 1.0;
        this.separationEnabled = true;
        this.alignmentEnabled = true;
        this.cohesionEnabled = true;

        this.separationRadius = 26;
        this.neighborRadius = 52;

        this.mouseMode = "none";
        this.mousePos = { x: 0, y: 0, active: false };
    }

    init(count, width, height) {
        this.boids = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            this.boids.push(new Boid(x, y));
        }
    }

    setBoidCount(targetCount, width, height) {
        while (this.boids.length < targetCount) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            this.boids.push(new Boid(x, y));
        }
        if (this.boids.length > targetCount) {
            this.boids.length = targetCount;
        }
    }

    getSeparation(boid) {
        let steerX = 0;
        let steerY = 0;
        let count = 0;

        for (let i = 0; i < this.boids.length; i++) {
            const other = this.boids[i];
            if (other === boid) continue;

            const d = distance(boid.x, boid.y, other.x, other.y);
            if (d > 0 && d < this.separationRadius) {
                let diffX = boid.x - other.x;
                let diffY = boid.y - other.y;
                diffX = diffX / (d * d);
                diffY = diffY / (d * d);
                steerX += diffX;
                steerY += diffY;
                count++;
            }
        }

        if (count > 0) {
            steerX /= count;
            steerY /= count;
            const [desiredX, desiredY] = setVectorMag(steerX, steerY, boid.maxSpeed);
            let forceX = desiredX - boid.vx;
            let forceY = desiredY - boid.vy;
            return limitVector(forceX, forceY, boid.maxForce * 1.5);
        }
        return [0, 0];
    }

    getAlignment(boid) {
        let sumVx = 0;
        let sumVy = 0;
        let count = 0;

        for (let i = 0; i < this.boids.length; i++) {
            const other = this.boids[i];
            if (other === boid) continue;

            const d = distance(boid.x, boid.y, other.x, other.y);
            if (d > 0 && d < this.neighborRadius) {
                sumVx += other.vx;
                sumVy += other.vy;
                count++;
            }
        }

        if (count > 0) {
            sumVx /= count;
            sumVy /= count;
            const [desiredX, desiredY] = setVectorMag(sumVx, sumVy, boid.maxSpeed);
            let forceX = desiredX - boid.vx;
            let forceY = desiredY - boid.vy;
            return limitVector(forceX, forceY, boid.maxForce);
        }
        return [0, 0];
    }

    getCohesion(boid) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;

        for (let i = 0; i < this.boids.length; i++) {
            const other = this.boids[i];
            if (other === boid) continue;

            const d = distance(boid.x, boid.y, other.x, other.y);
            if (d > 0 && d < this.neighborRadius) {
                sumX += other.x;
                sumY += other.y;
                count++;
            }
        }

        if (count > 0) {
            sumX /= count;
            sumY /= count;
            const targetX = sumX - boid.x;
            const targetY = sumY - boid.y;
            const [desiredX, desiredY] = setVectorMag(targetX, targetY, boid.maxSpeed);
            let forceX = desiredX - boid.vx;
            let forceY = desiredY - boid.vy;
            return limitVector(forceX, forceY, boid.maxForce);
        }
        return [0, 0];
    }

    getMouseForce(boid) {
        if (!this.mousePos.active || this.mouseMode === "none") return [0, 0];

        const d = distance(boid.x, boid.y, this.mousePos.x, this.mousePos.y);
        if (this.mouseMode === "predator" && d < 130 && d > 0) {
            const diffX = (boid.x - this.mousePos.x) / d;
            const diffY = (boid.y - this.mousePos.y) / d;
            const [desiredX, desiredY] = setVectorMag(diffX, diffY, boid.maxSpeed * 1.5);
            return limitVector(desiredX - boid.vx, desiredY - boid.vy, boid.maxForce * 2.5);
        } else if (this.mouseMode === "attractor" && d < 300 && d > 10) {
            const diffX = (this.mousePos.x - boid.x) / d;
            const diffY = (this.mousePos.y - boid.y) / d;
            const [desiredX, desiredY] = setVectorMag(diffX, diffY, boid.maxSpeed);
            return limitVector(desiredX - boid.vx, desiredY - boid.vy, boid.maxForce * 1.5);
        }
        return [0, 0];
    }

    step(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < this.boids.length; i++) {
            const boid = this.boids[i];

            if (this.separationEnabled) {
                const [sx, sy] = this.getSeparation(boid);
                boid.applyForce(sx * this.separationWeight, sy * this.separationWeight);
            }

            if (this.alignmentEnabled) {
                const [ax, ay] = this.getAlignment(boid);
                boid.applyForce(ax * this.alignmentWeight, ay * this.alignmentWeight);
            }

            if (this.cohesionEnabled) {
                const [cx, cy] = this.getCohesion(boid);
                boid.applyForce(cx * this.cohesionWeight, cy * this.cohesionWeight);
            }

            const [mx, my] = this.getMouseForce(boid);
            boid.applyForce(mx, my);

            boid.update(width, height);
            boid.draw(ctx);
        }

        if (this.mousePos.active && this.mouseMode !== "none") {
            ctx.beginPath();
            ctx.arc(this.mousePos.x, this.mousePos.y, this.mouseMode === "predator" ? 12 : 8, 0, Math.PI * 2);
            ctx.fillStyle = this.mouseMode === "predator" ? "rgba(239, 68, 68, 0.7)" : "rgba(34, 197, 94, 0.7)";
            ctx.fill();
        }
    }
}
