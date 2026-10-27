export function limitVector(x, y, max) {
    const magSq = x * x + y * y;
    if (magSq > max * max && magSq > 0) {
        const mag = Math.sqrt(magSq);
        return [ (x / mag) * max, (y / mag) * max ];
    }
    return [ x, y ];
}

export function setVectorMag(x, y, mag) {
    const current = Math.sqrt(x * x + y * y);
    if (current === 0) return [ 0, 0 ];
    return [ (x / current) * mag, (y / current) * mag ];
}

export function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export class Boid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.ax = 0;
        this.ay = 0;
        this.maxSpeed = 3.2;
        this.maxForce = 0.09;
        this.size = 5;
    }

    applyForce(fx, fy) {
        this.ax += fx;
        this.ay += fy;
    }

    update(width, height) {
        this.vx += this.ax;
        this.vy += this.ay;

        const [vx, vy] = limitVector(this.vx, this.vy, this.maxSpeed);
        this.vx = vx;
        this.vy = vy;

        this.x += this.vx;
        this.y += this.vy;

        this.ax = 0;
        this.ay = 0;

        if (this.x < -10) this.x = width + 10;
        else if (this.x > width + 10) this.x = -10;

        if (this.y < -10) this.y = height + 10;
        else if (this.y > height + 10) this.y = -10;
    }

    draw(ctx) {
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(-this.size * 1.5, -this.size);
        ctx.lineTo(-this.size * 0.8, 0);
        ctx.lineTo(-this.size * 1.5, this.size);
        ctx.closePath();

        ctx.fillStyle = "#38bdf8";
        ctx.fill();

        ctx.restore();
    }
}
