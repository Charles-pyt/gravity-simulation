import './style.css'
import { Body } from './Body';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error("Pas de contexte");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- CONSTANTES SCIENTIFIQUES ---
const AU_METERS = 1.496e11;
const MK_METERS = 1e9;
const G = 6.67430e-11;
const MASS_SUN = 1.989e30;
const MASS_EARTH = 5.972e24;
const MASS_JUPITER = 1.898e27;

// --- VARIABLES GLOBALES ---
let bodies: Body[] = [];
let isPaused = false;
let speedMultiplier = 1;
const BASE_TIMESTEP = 3600 * 24;

// --- VARIABLES CAMÉRA ---
let currentScale = 250 / AU_METERS;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isDragging = false;
let hasDragged = false; 
let startDragX = 0;
let startDragY = 0;

// --- TEXTURES ---
const TEXTURES = {
    sun: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/600px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    mercury: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Mercury_in_color_-_Prockter07_centered.jpg/600px-Mercury_in_color_-_Prockter07_centered.jpg',
    venus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/600px-Venus-real_color.jpg',
    earth: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/600px-The_Earth_seen_from_Apollo_17.jpg',
    mars: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/600px-OSIRIS_Mars_true_color.jpg',
    jupiter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/600px-Jupiter.jpg',
    saturn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/600px-Saturn_during_Equinox.jpg',
    uranus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/600px-Uranus2.jpg',
    neptune: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg/600px-Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg',
    rocky: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/600px-OSIRIS_Mars_true_color.jpg',
    icy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/600px-Uranus2.jpg',
    gas: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/600px-Jupiter.jpg'
};

function initSolarSystem() {
    bodies = [];
    viewOffsetX = 0; viewOffsetY = 0; currentScale = 250 / AU_METERS;

    // Creation du système solaire complet
    bodies.push(new Body("Sun", 0, 0, 0, 0, MASS_SUN, 40, 'yellow', true, TEXTURES.sun));
    bodies.push(new Body("Mercury", -0.39 * AU_METERS, 0, 0, 47400, 3.3e23, 5, 'grey', false, TEXTURES.mercury));
    bodies.push(new Body("Venus", -0.72 * AU_METERS, 0, 0, 35000, 4.87e24, 8, 'orange', false, TEXTURES.venus));
    bodies.push(new Body("Earth", -1.00 * AU_METERS, 0, 0, 29800, MASS_EARTH, 9, 'blue', false, TEXTURES.earth));
    bodies.push(new Body("Mars", -1.52 * AU_METERS, 0, 0, 24100, 6.39e23, 7, 'red', false, TEXTURES.mars));
    bodies.push(new Body("Jupiter", -5.20 * AU_METERS, 0, 0, 13070, MASS_JUPITER, 20, 'beige', false, TEXTURES.jupiter));
    bodies.push(new Body("Saturn", -9.58 * AU_METERS, 0, 0, 9680, 5.68e26, 18, 'gold', false, TEXTURES.saturn));
    bodies.push(new Body("Uranus", -19.22 * AU_METERS, 0, 0, 6800, 8.68e25, 14, 'lightblue', false, TEXTURES.uranus));
    bodies.push(new Body("Neptune", -30.05 * AU_METERS, 0, 0, 5430, 1.02e26, 13, 'blue', false, TEXTURES.neptune));
}

// --- RÉCUPÉRATION DES ÉLÉMENTS DU DOM ---
const inputs = {
    // Éléments du Créateur
    massVal: document.getElementById('massInput') as HTMLInputElement,
    massUnit: document.getElementById('massUnit') as HTMLSelectElement,
    distVal: document.getElementById('distInput') as HTMLInputElement,
    distUnit: document.getElementById('distUnit') as HTMLSelectElement,
    texture: document.getElementById('textureSelect') as HTMLSelectElement,
    color: document.getElementById('colorInput') as HTMLInputElement,
    addBtn: document.getElementById('addBtn'),
    resetBtn: document.getElementById('resetBtn'),
    massDisplay: document.getElementById('realMassDisplay'),
    distDisplay: document.getElementById('realDistDisplay'),
    speedSlider: document.getElementById('speedSlider') as HTMLInputElement,
    speedDisplay: document.getElementById('speedDisplay') as HTMLSpanElement,

    // Éléments du Bouton Pause "Pro"
    pauseBtn: document.getElementById('pauseBtn') as HTMLButtonElement,
    pauseIcon: document.getElementById('pauseIcon') as HTMLSpanElement,
    pauseText: document.getElementById('pauseText') as HTMLSpanElement,

    // Éléments de la Carte d'Identité (Info Panel)
    infoPanel: document.getElementById('info-panel') as HTMLDivElement,
    closeInfoBtn: document.getElementById('closeInfoBtn') as HTMLButtonElement,
    infoImage: document.getElementById('infoImage') as HTMLImageElement,
    infoName: document.getElementById('infoName') as HTMLElement,
    infoType: document.getElementById('infoType') as HTMLElement,
    infoMass: document.getElementById('infoMass') as HTMLElement,
    infoDist: document.getElementById('infoDist') as HTMLElement,
    infoSpeed: document.getElementById('infoSpeed') as HTMLElement,
};

// --- FONCTIONS UTILITAIRES ---
function formatScienceNumber(num: number): string { return num.toExponential(2).replace('+', ''); }
function calculateOrbitalVelocity(distanceMeters: number, centralMass: number) { return Math.sqrt((G * centralMass) / distanceMeters); }

// --- LOGIQUE DE "HIT TESTING" (CLIC SUR PLANÈTE) ---
function handleCanvasClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Centre actuel de la vue (caméra)
    const centerX = (canvas.width / 2) + viewOffsetX;
    const centerY = (canvas.height / 2) + viewOffsetY;

    let clickedBody: Body | null = null;

    // On cherche si on a cliqué sur une planète
    for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        const screenX = (b.x * currentScale) + centerX;
        const screenY = (b.y * currentScale) + centerY;

        const dx = clickX - screenX;
        const dy = clickY - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Marge de tolérance de 5px pour faciliter le clic
        if (dist < (b.visualSize + 5)) {
            clickedBody = b;
            break; 
        }
    }

    if (clickedBody) {
        showBodyInfo(clickedBody);
    } else {
        // Clic dans le vide = fermer le panneau
        inputs.infoPanel.style.display = 'none';
    }
}

// --- AFFICHER LA CARTE D'IDENTITÉ ---
function showBodyInfo(body: Body) {
    inputs.infoName.innerText = body.name;
    
    const typeText = body.isStatic ? "Star (Sun)" : "Planet";
    inputs.infoType.innerText = typeText;

    // GESTION DE L'IMAGE
    // Si la planète a une image chargée, on l'utilise.
    if (body.image && body.image.src) {
        inputs.infoImage.src = body.image.src;
        inputs.infoImage.style.display = 'block'; // On s'assure qu'elle est visible
    } else {
        // Si c'est une planète de couleur unie sans texture, on cache l'image
        // Ou on pourrait mettre une image par défaut. Pour l'instant, on cache.
         inputs.infoImage.style.display = 'none';
         // Alternative : inputs.infoImage.src = 'url_image_par_defaut.png';
    }

    inputs.infoMass.innerText = formatScienceNumber(body.mass);

    // Calculs live
    const sun = bodies[0];
    const dx = body.x - sun.x;
    const dy = body.y - sun.y;
    const currentDistMeters = Math.sqrt(dx*dx + dy*dy);
    const currentDistAU = currentDistMeters / AU_METERS;
    
    inputs.infoDist.innerText = currentDistAU.toFixed(3);

    const speedMps = Math.sqrt(body.vx*body.vx + body.vy*body.vy);
    const speedKms = speedMps / 1000;
    inputs.infoSpeed.innerText = speedKms.toFixed(1);

    inputs.infoPanel.style.display = 'block';
}

// --- GESTION DES ÉVÉNEMENTS (LISTENERS) ---

// 1. Zoom (Molette)
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomFactor = Math.exp(event.deltaY * -0.001);
    const newScale = currentScale * zoomFactor;
    if (newScale > (5 / AU_METERS) && newScale < (20000 / AU_METERS)) currentScale = newScale;
});

// 2. Déplacement (Drag & Drop) et Clic
canvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    hasDragged = false;
    startDragX = event.clientX;
    startDragY = event.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const dx = event.clientX - startDragX;
        const dy = event.clientY - startDragY;
        
        // Si on bouge de plus de 3 pixels, ce n'est plus un clic, c'est un drag
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;

        viewOffsetX += dx;
        viewOffsetY += dy;
        startDragX = event.clientX;
        startDragY = event.clientY;
    }
});

window.addEventListener('mouseup', (event) => {
    if (!hasDragged) {
        // C'est un clic propre !
        handleCanvasClick(event);
    }
    isDragging = false;
    hasDragged = false;
    canvas.style.cursor = 'default';
});

// 3. Bouton Pause "Pro"
inputs.pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        inputs.pauseBtn.classList.add('paused');
        inputs.pauseIcon.innerText = "▶️";
        inputs.pauseText.innerText = "Resume Simulation";
    } else {
        inputs.pauseBtn.classList.remove('paused');
        inputs.pauseIcon.innerText = "⏸️";
        inputs.pauseText.innerText = "Pause Simulation";
    }
});

// 4. Fermer Info Panel
inputs.closeInfoBtn.addEventListener('click', () => {
    inputs.infoPanel.style.display = 'none';
});

// 5. Interface Créateur (Mises à jour textes)
function updateUIDisplays() {
    let massMultiplier = inputs.massUnit.value === 'earth' ? MASS_EARTH : MASS_JUPITER;
    let realMass = parseFloat(inputs.massVal.value) * massMultiplier;
    inputs.massDisplay!.innerText = `${formatScienceNumber(realMass)} kg`;

    let distMultiplier = inputs.distUnit.value === 'au' ? AU_METERS : MK_METERS;
    let realDist = parseFloat(inputs.distVal.value) * distMultiplier;
    let displayTxt = inputs.distUnit.value === 'au' ? `${formatScienceNumber(realDist)} m` : `${(parseFloat(inputs.distVal.value)).toFixed(1)} M km`;
    inputs.distDisplay!.innerText = displayTxt;
    inputs.color.style.display = inputs.texture.value === 'custom_color' ? 'block' : 'none';
}

inputs.massVal.addEventListener('input', updateUIDisplays);
inputs.massUnit.addEventListener('change', updateUIDisplays);
inputs.distVal.addEventListener('input', updateUIDisplays);
inputs.distUnit.addEventListener('change', updateUIDisplays);
inputs.texture.addEventListener('change', updateUIDisplays);

// 6. Slider Vitesse
function updateSpeedDisplay() {
    const sliderVal = parseInt(inputs.speedSlider.value);
    speedMultiplier = (sliderVal * sliderVal) / 2500; 
    if (sliderVal === 0) {
        speedMultiplier = 0;
        inputs.speedDisplay.innerText = "Stopped";
    } else {
        const daysPerSec = Math.round(speedMultiplier * 60);
        inputs.speedDisplay.innerText = `~${daysPerSec} days/sec`;
    }
}
inputs.speedSlider.addEventListener('input', updateSpeedDisplay);
updateUIDisplays();
updateSpeedDisplay();

// 7. Boutons Ajout & Reset
inputs.addBtn?.addEventListener('click', () => {
    const massMultiplier = inputs.massUnit.value === 'earth' ? MASS_EARTH : MASS_JUPITER;
    const realMass = parseFloat(inputs.massVal.value) * massMultiplier;
    const distMultiplier = inputs.distUnit.value === 'au' ? AU_METERS : MK_METERS;
    const realDistance = parseFloat(inputs.distVal.value) * distMultiplier;
    const sunMass = bodies[0].mass;
    const requiredVelocity = calculateOrbitalVelocity(realDistance, sunMass);
    let visualSize = Math.max(5, Math.log10(realMass) - 18); 
    
    let textureURL: string | undefined = undefined;
    const textureChoice = inputs.texture.value;
    if (textureChoice !== 'custom_color') { 
        // @ts-ignore
        textureURL = TEXTURES[textureChoice]; 
    }

    bodies.push(new Body(
        "Custom Planet", 
        realDistance, 0, 0, requiredVelocity, realMass, visualSize, inputs.color.value, false, textureURL
    ));
});

inputs.resetBtn?.addEventListener('click', initSolarSystem);


// --- BOUCLE D'ANIMATION PRINCIPALE ---

function animate() {
    ctx!.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx!.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = (canvas.width / 2) + viewOffsetX;
    const centerY = (canvas.height / 2) + viewOffsetY;

    // --- ICI : DEBUG TEXT (Zoom + État) en HAUT À GAUCHE ---
    const pixelsPerAu = Math.round(currentScale * AU_METERS);
    ctx!.fillStyle = 'white';
    ctx!.font = 'bold 14px Courier New';
    ctx!.textAlign = 'left';
    
    // Ligne 1 : Zoom
    ctx!.fillText(`Zoom: 1 AU = ${pixelsPerAu}px`, 10, 25);
    
    // Ligne 2 : État (RUNNING / PAUSED)
    if (isPaused) {
        ctx!.fillStyle = '#ff4444'; // Rouge si pause
        ctx!.fillText("PAUSED", 10, 45);
    } else {
        ctx!.fillStyle = '#00ff00'; // Vert si running
        ctx!.fillText("RUNNING", 10, 45);
    }

    // --- PHYSIQUE ---
    if (!isPaused && speedMultiplier > 0) {
        const physicsSteps = 4;
        const effectiveTimeStep = (BASE_TIMESTEP * speedMultiplier) / physicsSteps;

        for(let i = 0; i < physicsSteps; i++) {
            for (let body of bodies) {
                for (let otherBody of bodies) {
                    if (body !== otherBody) body.attract(otherBody, effectiveTimeStep);
                }
            }
            for (let body of bodies) body.update(effectiveTimeStep);
        }
    }

    // --- DESSIN ---
    for (let body of bodies) {
        body.draw(ctx!, currentScale, centerX, centerY);
    }

    requestAnimationFrame(animate);
}

// Lancement
initSolarSystem();
animate();