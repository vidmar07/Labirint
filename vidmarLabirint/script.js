// --- NASTAVITVE IN ELEMENTI ---
const playerElement = document.getElementById('player');
const policeElement = document.getElementById('police');
const winOverlay = document.getElementById('win-overlay');
const loseOverlay = document.getElementById('lose-overlay');

// Velikost slik (mora se ujemati z width/height v HTML)
const carSize = 14; 
const halfSize = carSize / 2;

// Začetne pozicije (sredinska točka avtomobila)
let posX = 234;  
let posY = 10;   
let policeX = 234;
let policeY = 10;

// Kot vrtenja (v stopinjah)
let playerAngle = 0;
let policeAngle = 0;

// Konstante
const radius = 5; // Polmer za detekcijo trkov z zidovi
const speed = 2.5; 
let isGameOver = false;

// --- ZGODOVINA POTI ZA POLICISTA ---
let positionHistory = [];
const POLICE_LAG = 100; // Zaostanek policista v slikah (frames)

// --- PARSIRANJE ZIDOV ---
const wallLines = document.querySelectorAll('#walls line');
const walls = [];
wallLines.forEach(line => {
    walls.push({
        x1: parseFloat(line.getAttribute('x1')),
        y1: parseFloat(line.getAttribute('y1')),
        x2: parseFloat(line.getAttribute('x2')),
        y2: parseFloat(line.getAttribute('y2'))
    });
});

// --- KONTROLE ---
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false
};

document.addEventListener('keydown', (e) => {
    if(keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    if(keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// --- POMOŽNA FUNKCIJA ZA KOT ---
function getAngle(x1, y1, x2, y2) {
    // Vrne kot v stopinjah (0 stopinj je desno)
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

// --- FUNKCIJA ZA PREVERJANJE TRKOV (ZID) ---
function checkCollision(nextX, nextY) {
    const minX = nextX - radius;
    const maxX = nextX + radius;
    const minY = nextY - radius;
    const maxY = nextY + radius;

    for (let wall of walls) {
        if (wall.x1 === wall.x2) { // Navpični zid
            if (maxX > wall.x1 && minX < wall.x1) {
                if (maxY > Math.min(wall.y1, wall.y2) && minY < Math.max(wall.y1, wall.y2)) return true;
            }
        } 
        else if (wall.y1 === wall.y2) { // Vodoravni zid
            if (maxY > wall.y1 && minY < wall.y1) {
                if (maxX > Math.min(wall.x1, wall.x2) && minX < Math.max(wall.x1, wall.x2)) return true;
            }
        }
    }
    return false;
}

// --- GLAVNA ZANKA IGRE ---
function gameLoop() {
    if (isGameOver) return;

    // Shranimo staro pozicijo za izračun kota
    let oldX = posX;
    let oldY = posY;

    // 1. PREMIK IGRALCA
    let nextX = posX;
    let nextY = posY;

    if (keys.ArrowLeft || keys.a) nextX -= speed;
    if (keys.ArrowRight || keys.d) nextX += speed;
    if (!checkCollision(nextX, posY)) posX = nextX;

    if (keys.ArrowUp || keys.w) nextY -= speed;
    if (keys.ArrowDown || keys.s) nextY += speed;
    if (!checkCollision(posX, nextY)) posY = nextY;

    // Meje SVG-ja
    if (posX < radius) posX = radius;
    if (posX > 484 - radius) posX = 484 - radius;
    if (posY < radius) posY = radius;

    // Izračun kota igralca
    if (oldX !== posX || oldY !== posY) {
        playerAngle = getAngle(oldX, oldY, posX, posY);
    }

    // Posodobitev elementa igralca
    playerElement.setAttribute('x', posX - halfSize);
    playerElement.setAttribute('y', posY - halfSize);
    playerElement.style.transformOrigin = `${posX}px ${posY}px`;
    
    // KER JE SLIKA ORIGINALNO OBRNJENA DOL:
    // Od kota odštejemo 90 stopinj, da se "poravna" s smerjo desno
    playerElement.style.transform = `rotate(${playerAngle - 90}deg)`;

    // 2. LOGIKA POLICISTA
    let oldPoliceX = policeX;
    let oldPoliceY = policeY;

    positionHistory.push({x: posX, y: posY});

    if (positionHistory.length > POLICE_LAG) {
        const move = positionHistory.shift();
        policeX = move.x;
        policeY = move.y;
    }

    // Izračun kota policista
    if (oldPoliceX !== policeX || oldPoliceY !== policeY) {
        policeAngle = getAngle(oldPoliceX, oldPoliceY, policeX, policeY);
    }

    // Posodobitev elementa policista
    policeElement.setAttribute('x', policeX - halfSize);
    policeElement.setAttribute('y', policeY - halfSize);
    policeElement.style.transformOrigin = `${policeX}px ${policeY}px`;
    
    // Tudi policaju odštejemo 90 stopinj
    policeElement.style.transform = `rotate(${policeAngle - 90}deg)`;

    // 3. PREVERJANJE KONCA IGRE

    // ZMAGA
    if (posY > 475) {
        isGameOver = true;
        winOverlay.style.display = 'flex';
        return;
    }

    // PORAZ
    const dx = posX - policeX;
    const dy = posY - policeY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (positionHistory.length >= POLICE_LAG && distance < (radius * 2)) {
        isGameOver = true;
        loseOverlay.style.display = 'flex';
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Zaženi igro
requestAnimationFrame(gameLoop);