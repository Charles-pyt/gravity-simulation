// src/Body.ts

export class Body {
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    visualSize: number;
    color: string;
    isStatic: boolean;
    image?: HTMLImageElement;
    name: string; // <--- NOUVEAU : Le nom de la planète

    constructor(name: string, x: number, y: number, vx: number, vy: number, mass: number, visualSize: number, color: string, isStatic: boolean = false, imageURL?: string) {
        this.name = name; // On stocke le nom
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.visualSize = visualSize;
        this.color = color;
        this.isStatic = isStatic;

        if (imageURL) {
            this.image = new Image();
            this.image.src = imageURL;
        }
    }

    draw(ctx: CanvasRenderingContext2D, scale: number, centerX: number, centerY: number) {
        const pixelX = (this.x * scale) + centerX;
        const pixelY = (this.y * scale) + centerY;

        // 1. Dessin de la planète (Image ou Cercle)
        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            const size = this.visualSize * 2;
            ctx.drawImage(this.image, pixelX - this.visualSize, pixelY - this.visualSize, size, size);
        } else {
            ctx.beginPath();
            ctx.arc(pixelX, pixelY, this.visualSize, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            if(this.isStatic) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            ctx.closePath();
        }

        // 2. NOUVEAU : Dessin du Nom
        // On ne l'affiche que si la planète n'est pas le Soleil (pour ne pas surcharger le centre)
        if (!this.isStatic) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            // On place le texte 15px sous la planète
            ctx.fillText(this.name, pixelX, pixelY + this.visualSize + 15);
        }
    }

    update(timeStep: number) {
        if (this.isStatic) return;
        this.x += this.vx * timeStep;
        this.y += this.vy * timeStep;
    }

    attract(other: Body, timeStep: number) {
        if (this.isStatic) return;
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        let distSq = dx * dx + dy * dy;
        let dist = Math.sqrt(distSq);

        const minDist = (this.visualSize + other.visualSize) * (1 / 250 * 1.496e11) * 0.1; 
        if (dist < minDist) dist = minDist;
        distSq = dist * dist;

        const G = 6.67430e-11;
        let force = (G * this.mass * other.mass) / distSq;

        let angle = Math.atan2(dy, dx);
        this.vx += (Math.cos(angle) * force / this.mass) * timeStep;
        this.vy += (Math.sin(angle) * force / this.mass) * timeStep;
    }
}