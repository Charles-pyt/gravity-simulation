export class Body {
    x: number; // En Mètres
    y: number; // En Mètres
    vx: number; // En M/s
    vy: number; // En M/s
    mass: number; // En Kg
    radius: number; // Taille visuelle en pixels (juste pour le dessin)
    color: string;
    isStatic: boolean;

    constructor(x: number, y: number, vx: number, vy: number, mass: number, radius: number, color: string, isStatic: boolean = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = radius;
        this.color = color;
        this.isStatic = isStatic;
    }

    // On passe l'échelle (scale) pour savoir combien de mètres valent 1 pixel
    draw(ctx: CanvasRenderingContext2D, scale: number, centerX: number, centerY: number) {
        // CONVERSION : Mètres -> Pixels pour l'écran
        const pixelX = (this.x * scale) + centerX;
        const pixelY = (this.y * scale) + centerY;

        ctx.beginPath();
        ctx.arc(pixelX, pixelY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(timeStep: number) {
        if (this.isStatic) return;

        // Position = Vitesse * Temps écoulé
        this.x += this.vx * timeStep;
        this.y += this.vy * timeStep;
    }

    attract(other: Body, timeStep: number) {
        if (this.isStatic) return;

        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Vraie Constante Gravitationnelle
        const G = 6.67430e-11; 

        // Force = G * m1 * m2 / d²
        let force = (G * this.mass * other.mass) / (dist * dist);

        let angle = Math.atan2(dy, dx);
        let forceX = Math.cos(angle) * force;
        let forceY = Math.sin(angle) * force;

        // Accélération = Force / Masse
        // Vitesse += Accélération * Temps
        this.vx += (forceX / this.mass) * timeStep;
        this.vy += (forceY / this.mass) * timeStep;
    }
}