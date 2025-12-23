import './style.css'
import { Body } from './Body';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error("Pas de contexte");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONSTANTES DE L'UNIVERS ---
const AU = 1.496e11; // 1 Unité Astronomique en mètres
const G = 6.67430e-11; // Constante gravitationnelle réelle

// --- PARAMÈTRES D'AFFICHAGE ---
// ECHELLE : 1 UA (distance Terre-Soleil) vaudra 250 pixels à l'écran
const SCALE = 250 / AU; 
// TEMPS : Combien de temps s'écoule à chaque image ? 
// Essayons 1 jour (60*60*24 secondes) par frame pour que ça bouge bien
const TIMESTEP = 3600 * 24; 

let bodies: Body[] = [];

function initSolarSystem() {
    bodies = [];

    // 1. LE SOLEIL
    // Masse réelle : 1.989 x 10^30 kg
    const sun = new Body(0, 0, 0, 0, 1.98892e30, 30, '#FDB813', true); // true = statique
    bodies.push(sun);

    // 2. LA TERRE
    // Distance : 1 AU (négatif pour la mettre à gauche)
    // Vitesse Y : 29.78 km/s (29780 m/s)
    // Masse : 5.97 x 10^24 kg
    const earth = new Body(-1 * AU, 0, 0, 29780, 5.9742e24, 10, '#22A6B3');
    bodies.push(earth);

    // 3. MARS
    // Distance : 1.524 AU
    // Vitesse : 24.07 km/s
    // Masse : 6.39 x 10^23 kg
    const mars = new Body(-1.524 * AU, 0, 0, 24077, 6.39e23, 8, '#FF6B6B');
    bodies.push(mars);

    // 4. MERCURE
    // Distance : 0.387 AU
    // Vitesse : 47.4 km/s
    // Masse : 3.30 x 10^23 kg
    const mercury = new Body(-0.387 * AU, 0, 0, 47362, 3.30e23, 6, '#A5A5A5');
    bodies.push(mercury);
    
    // 5. VENUS
    // Distance : 0.723 AU
    // Vitesse : 35.02 km/s
    const venus = new Body(-0.723 * AU, 0, 0, 35020, 4.8685e24, 9, '#E3BB76');
    bodies.push(venus);
}

// --- INTERFACE ---
// On met à jour l'interface pour qu'elle utilise des AU (Unité Astronomique)
const addBtn = document.getElementById('addBtn');
const distInput = document.getElementById('distInput') as HTMLInputElement;
const sizeInput = document.getElementById('sizeInput') as HTMLInputElement;
const colorInput = document.getElementById('colorInput') as HTMLInputElement;

// Mise à jour des labels de l'input HTML pour correspondre à notre nouvelle logique
distInput.min = "0.2";
distInput.max = "2.5";
distInput.step = "0.1";
distInput.value = "1.2";

addBtn?.addEventListener('click', () => {
    // Distance en AU convertie en Mètres
    const distanceAU = parseFloat(distInput.value);
    const distanceMeters = distanceAU * AU;
    
    const size = parseInt(sizeInput.value); // Juste pour le dessin
    const color = colorInput.value;

    // Calcul de la vitesse orbitale réelle : v = sqrt(GM / r)
    // On utilise la masse du SOLEIL (le premier corps de la liste)
    const sunMass = bodies[0].mass;
    const velocity = Math.sqrt((G * sunMass) / distanceMeters);

    // On crée la planète
    // Masse arbitraire (Terre) car l'input ne gère pas la masse pour l'instant
    const earthMass = 5.97e24; 
    
    bodies.push(new Body(distanceMeters, 0, 0, -velocity, earthMass, size, color));
});

document.getElementById('resetBtn')?.addEventListener('click', initSolarSystem);


// --- BOUCLE ---

function animate() {
    ctx!.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
    ctx!.fillRect(0, 0, canvas.width, canvas.height);

    // Calculs physiques
    // On peut faire plusieurs "sous-pas" par image pour plus de précision si nécessaire
    for (let body of bodies) {
        for (let otherBody of bodies) {
            if (body !== otherBody) {
                body.attract(otherBody, TIMESTEP);
            }
        }
    }

    // Mise à jour et Dessin
    // On passe canvas.width / 2 pour centrer le soleil (0,0) au milieu de l'écran
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let body of bodies) {
        body.update(TIMESTEP);
        body.draw(ctx!, SCALE, centerX, centerY);
    }

    requestAnimationFrame(animate);
}

initSolarSystem();
animate();