// Images
const asteroidImg = new Image();
asteroidImg.crossOrigin = "Anonymous";
asteroidImg.src = "https://cdn.creazilla.com/cliparts/4310/asteroid-clipart-xl.png";

const meteorImg = new Image();
meteorImg.crossOrigin = "Anonymous";
meteorImg.src = "https://pngimg.com/uploads/meteor/meteor_PNG9.png";

// Note: spawnBullet, spawnEnemy etc are now in Game object (game.js) 
// to ensure scope safety. 
// We keep spawnBoss here or ensure it matches where you put it.

function spawnBoss() {
    AudioSys.speak("Warning. Boss Approaching.");
    AudioSys.playBossEntry();
    
    const isFinal = Game.currentLevelIndex === 9;
    AudioSys.playBossLaugh(isFinal);

    let type = 'normal';
    let hp = 100 + (Game.currentLevelIndex * 10);
    let w = 140; let h = 100; 
    let imgSrc = BOSS_URLS.generic;
    
    if (Game.currentLevelIndex === 4) { 
        type = 'big'; hp = 300; w = 220; h = 150; 
        imgSrc = BOSS_URLS.level5;
    }
    if (Game.currentLevelIndex === 9) { 
        type = 'final'; hp = 1000; w = 300; h = 200; 
        imgSrc = BOSS_URLS.level10;
    }

    Game.boss = {
        x: canvas.width/2, y: -150, targetY: canvas.height * 0.35, 
        w: w, h: h, hp: hp, maxHp: hp, 
        vx: 0, vy: 1, // Added VX for AI movement
        type: type,
        phase: 'enter', shootTimer: 0, minionTimer: 0, imgSrc: imgSrc
    };

    const bossImgEl = document.getElementById('boss-entity');
    bossImgEl.src = imgSrc;
    bossImgEl.style.width = w + 'px';
    bossImgEl.style.height = h + 'px';
    bossImgEl.style.display = 'block';
}

function spawnBossMinion() {
    AudioSys.speak("Minions!");
    for(let i = -1; i <= 1; i += 2) {
        Game.enemies.push({
            x: Game.boss.x + (i * 60), y: Game.boss.y + 50,
            w: 50, h: 35, letter: '', isTrap: false, hp: 10,
            vy: 3, vx: 0, rot: 0, rotSpeed: 0, scale: 1, isMinion: true,
            imgSrc: Game.boss.imgSrc
        });
    }
}