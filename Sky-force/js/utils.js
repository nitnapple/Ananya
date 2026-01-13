// GLOBAL CANVAS & CONTEXT
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); 

// GLOBAL IMAGES
const asteroidImg = new Image();
asteroidImg.crossOrigin = "Anonymous";
asteroidImg.src = "https://cdn.creazilla.com/cliparts/4310/asteroid-clipart-xl.png";

const meteorImg = new Image();
meteorImg.crossOrigin = "Anonymous";
meteorImg.src = "https://pngimg.com/uploads/meteor/meteor_PNG9.png";

// GAME DATA
const LEVELS = ["ANANYA", "SHANDILYA", "PHOTOGRAPHY", "CONSTITUTION CLUB", "JANPATH", "PHILOSOPHY", "HER MAJESTY", "SWIMMING", "TOKYO", "JUJUTSU KAISEN"];
const BOSS_URLS = {
    generic: "https://images.squarespace-cdn.com/content/v1/5bcfdf91e8ba4404c104e52e/1541873023292-F42MK2JVX2T2XGE6H77U/UFO-dancing.gif",
    level5: "https://images.squarespace-cdn.com/content/v1/5bcfdf91e8ba4404c104e52e/1541873023819-209B50XVZI4AHLMRVJ89/UFO-kissy.gif",
    level10: "https://images.squarespace-cdn.com/content/v1/5bcfdf91e8ba4404c104e52e/1541873024427-EP9L5HL8TDC44G9BBD7N/UFO-shocked.gif"
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