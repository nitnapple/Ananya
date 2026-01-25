// GLOBAL CANVAS & CONTEXT
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); 

// GLOBAL INPUT STATE
const input = { x: 0, y: 0, active: false, offsetX: 0, offsetY: 0, rawX: 0, rawY: 0 };

// GLOBAL IMAGES
const asteroidImg = new Image();
asteroidImg.crossOrigin = "Anonymous";
asteroidImg.src = "https://nitnapple.github.io/Ananya/Savegalaxy/asteroid.png";

const meteorImg = new Image();
meteorImg.crossOrigin = "Anonymous";
meteorImg.src = "https://nitnapple.github.io/Ananya/Savegalaxy/meteor.png";

// *** NEW HEART IMAGE ***
const heartImg = new Image();
heartImg.crossOrigin = "Anonymous";
heartImg.src = "https://nitnapple.github.io/Ananya/Savegalaxy/Heart.png";

// GAME DATA
const LEVELS = ["ANANYA", "SHANDILYA", "PHOTOGRAPHY", "ONE PIECE", "JANPATH", "PHILOSOPHY", "HER MAJESTY", "SWIMMING", "TOKYO", "JUJUTSU KAISEN"];
const BOSS_URLS = {
    generic: "https://nitnapple.github.io/Ananya/Savegalaxy2/bossgeanim.gif",
    level5: "https://nitnapple.github.io/Ananya/Savegalaxy2/Boss5anim.gif",
    level10: "https://nitnapple.github.io/Ananya/Savegalaxy2/boss10ani.gif"
};

// HELPER ARRAYS
let particles = [];
let floatingTexts = [];

// HELPER FUNCTIONS
function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

function createParticles(x, y, color, amount, type = 'spark') {
    let actualAmount = Math.min(amount, 8); 
    if(type === 'smoke') actualAmount = Math.min(amount, 4);
    for(let i=0; i<actualAmount; i++) {
        let p = { x: x, y: y, life: 1.0, color: color, type: type };
        if (type === 'spark') { p.vx = (Math.random()-0.5)*10; p.vy = (Math.random()-0.5)*10; p.size = Math.random()*3+1; p.decay = 0.05; }
        else if (type === 'smoke') { p.vx = (Math.random()-0.5)*2; p.vy = (Math.random()-0.5)*2; p.size = Math.random()*8+4; p.decay = 0.03; }
        else if (type === 'trail') { p.vx = (Math.random()-0.5)*2; p.vy = 5+Math.random()*5; p.size = Math.random()*3+1; p.decay = 0.1; }
        else if (type === 'warp') { p.x = Math.random()*canvas.width; p.y = Math.random()*canvas.height; p.vx = 0; p.vy = 20+Math.random()*20; p.size = 2; p.decay = 0.05; p.color = '#fff'; }
        particles.push(p);
    }
}

function updateLevelHUD() {
    const wordContainer = document.getElementById('word-display');
    wordContainer.innerHTML = '';
    if(Game.currentTarget.length > 8) wordContainer.classList.add('compact');
    else wordContainer.classList.remove('compact');

    for(let i = 0; i < Game.currentTarget.length; i++) {
        const char = Game.currentTarget[i];
        const slot = document.createElement('div');
        if(char === ' ') {
            slot.className = 'letter-slot space';
        } else {
            slot.className = 'letter-slot';
            slot.id = `word-slot-${i}`;
            if(Game.foundLetters[i]) {
                slot.innerText = char;
                slot.classList.add('filled');
            }
        }
        wordContainer.appendChild(slot);
    }
    document.getElementById('level-display').innerText = `LVL ${Game.currentLevelIndex + 1}`;
}
