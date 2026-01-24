// js/gamestart.js

// --- GAME LIFECYCLE LOGIC ---

Game.reset = function(restartLevel = false) {
    // 1. Clear Timers
    if(this.winTimeout) clearTimeout(this.winTimeout);
    if(this.levelTimeout) clearTimeout(this.levelTimeout);
    if(this.slowMoTimeout) clearTimeout(this.slowMoTimeout);
    
    // 2. Reset Special Mechanics
    this.specialCooldown = 0; 
    this.sonicBoomActive = 0; 

    // 3. Stop External Modules
    if (typeof Ending !== 'undefined') Ending.stop();
    if (typeof Partner !== 'undefined') Partner.reset();

    // 4. Score & Level State
    if (!restartLevel) {
        // FULL RESTART (New Game)
        this.lives = 5; 
        this.score = 0; 
        this.levelStartScore = 0;
        this.currentLevelIndex = 0; 
        this.gameStartTime = Date.now(); 
        this.pausedTime = 0;
        this.currentTarget = LEVELS[0];
        this.foundLetters = this.currentTarget.split('').map(c => c === ' ');
    } else {
        // RETRY LEVEL (Keep Score/Level)
        this.score = this.levelStartScore;
        this.lives = 5; 
        this.currentTarget = LEVELS[this.currentLevelIndex];
        this.foundLetters = this.currentTarget.split('').map(c => c === ' ');
    }

    // 5. Reset Core Game State
    this.frameCount = 0; 
    this.gameRunning = true; 
    this.isPaused = false; 
    
    // Player Physics Reset
    this.player.lastShot = 0; 
    this.player.invulnerable = 0;
    this.player.x = canvas.width/2; 
    this.player.y = canvas.height - 150;
    
    // Input Reset
    input.active = false;
    
    // Game Flow Reset
    this.levelTransitioning = false; 
    this.boss = null;
    this.timeScale = 1.0; 
    this.combo = 1;
    
    // Clear Arrays
    this.bullets = []; 
    this.enemies = []; 
    this.powerups = [];
    particles.length = 0; 
    floatingTexts.length = 0; 
    this.powerupState = { beam: 0, shield: 0, spread: 0, magnet: 0, freeze: 0 };
    
    // 6. UI Reset
    document.getElementById('start-screen').style.display = 'none';
    
    const endScreen = document.getElementById('end-screen');
    endScreen.style.display = 'none';
    endScreen.style.pointerEvents = "auto"; // Reset so game UI works normally
    endScreen.style.background = "rgba(5, 5, 10, 0.95)"; // Reset background opacity
    
    document.getElementById('game-hud').style.display = 'flex';
    this.bossImgEl.style.display = 'none';
    this.playerImgEl.style.display = 'block';
    
    if(typeof updateLevelHUD === 'function') updateLevelHUD();
};

Game.nextLevel = function() {
    this.winTimeout = null;
    this.levelStartScore = this.score; 
    this.currentLevelIndex++;
    this.levelTransitioning = true;
    
    // Reset Powerups for fair start
    this.powerupState = { beam: 0, shield: 0, spread: 0, magnet: 0, freeze: 0 };
    
    this.boss = null; 
    this.bossImgEl.style.display = 'none'; 
    this.timeScale = 1.0;
    
    // Check for Game Completion
    if (this.currentLevelIndex >= LEVELS.length) { 
        this.gameOver(true); 
        return; 
    }

    // Setup Next Word
    this.currentTarget = LEVELS[this.currentLevelIndex];
    this.foundLetters = this.currentTarget.split('').map(c => c === ' ');
    this.enemies = []; this.bullets = []; this.powerups = [];
    
    // Show Level Screen
    const levelScreen = document.getElementById('level-screen');
    levelScreen.style.display = 'flex';
    document.getElementById('level-title').innerText = `LEVEL ${this.currentLevelIndex + 1}`;
    document.getElementById('level-subtitle').innerText = LEVELS[this.currentLevelIndex];
    
    // Level Bonus
    this.score += 500; 
    this.levelStartScore = this.score;
    document.getElementById('score-display').innerText = `PTS: ${this.score}`;
    
    AudioSys.playCollect();
    AudioSys.speak(`Level ${this.currentLevelIndex+1}. ${LEVELS[this.currentLevelIndex]}`);

    // Start Level after delay
    this.levelTimeout = setTimeout(() => {
        if(!this.gameRunning) return; 
        levelScreen.style.display = 'none';
        this.levelTransitioning = false;
        if(typeof updateLevelHUD === 'function') updateLevelHUD();
        this.enemies = []; this.bullets = [];
        
        // Spawn Boss immediately if it's a boss level
        if ([1, 3, 4, 5, 7, 9].includes(this.currentLevelIndex)) this.spawnBoss();
    }, 2000);
};

Game.gameOver = function(win) {
    if(this.winTimeout) clearTimeout(this.winTimeout);
    if(this.levelTimeout) clearTimeout(this.levelTimeout);
    if(this.slowMoTimeout) clearTimeout(this.slowMoTimeout);
    
    this.gameRunning = false;
    this.bossImgEl.style.display = 'none'; 
    this.playerImgEl.style.display = 'none'; 
    AudioSys.stopBGM();
    
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('level-screen').style.display = 'none';
    
    const endScreen = document.getElementById('end-screen');
    const restartBtn = document.getElementById('restart-btn');
    const title = document.getElementById('end-title');
    const sub = document.getElementById('end-subtitle');
    const fScore = document.getElementById('final-score');

    endScreen.style.display = 'flex';

    // Safety check: Stop effects before deciding state
    if (typeof Ending !== 'undefined') Ending.stop(); 

    if(win) {
        // --- WIN STATE (Fireworks) ---
        title.innerText = "GALAXY SECURED"; 
        title.style.color = "#00ffcc";
        title.style.textShadow = "0 0 20px #00ffcc";
        sub.innerText = "MISSION ACCOMPLISHED";
        restartBtn.innerText = "PLAY AGAIN";
        
        // 1. Transparent Background to see Fireworks
        endScreen.style.background = "rgba(0, 0, 0, 0.2)";
        
        // 2. Click-Through Logic (Lets you click fireworks in empty space)
        endScreen.style.pointerEvents = "none"; 
        
        // 3. Ensure Button is Clickable & On Top
        restartBtn.style.pointerEvents = "auto";
        restartBtn.style.position = "relative";
        restartBtn.style.zIndex = "100";
        restartBtn.style.cursor = "pointer";

        restartBtn.onclick = () => window.triggerStartGame(false);
        AudioSys.playCollect();
        
        // 4. Start Fireworks
        if (typeof Ending !== 'undefined') Ending.start();
        
    } else {
        // --- LOSE STATE ---
        title.innerText = "CRITICAL FAILURE"; 
        title.style.color = "#ff3366";
        sub.innerText = "SHIP DESTROYED";
        restartBtn.innerText = "RETRY LEVEL";
        
        // Dark Background
        endScreen.style.background = "rgba(5, 5, 10, 0.95)"; 
        endScreen.style.pointerEvents = "auto"; 
        restartBtn.style.pointerEvents = "auto";
        
        restartBtn.onclick = () => window.triggerStartGame(true); 
    }
    fScore.innerText = `FINAL SCORE: ${this.score}`;
};

window.triggerStartGame = function(restartLevel = false) {
    // 1. Stop the Interactive Menu
    if(typeof Menu !== 'undefined') Menu.stop();

    if(typeof animFrameId !== 'undefined' && animFrameId) cancelAnimationFrame(animFrameId);
    
    AudioSys.stopBGM(); 
    AudioSys.init(); 
    AudioSys.startBGM();
    
    if (!restartLevel) AudioSys.speak("Level 1. Ananya.");
    else AudioSys.speak("Retrying Level.");
    
    Game.reset(restartLevel);
    
    document.getElementById('score-display').innerText = `PTS: ${Game.score}`;
    document.getElementById('time-display').innerText = "00:00";
    
    initBackground(); 
    updateLivesUI(); 
    updateComboUI();
    if(typeof updateLevelHUD === 'function') updateLevelHUD();
    
    // Respawn Boss if needed on retry
    if(restartLevel && [1, 3, 4, 5, 7, 9].includes(Game.currentLevelIndex)) {
        setTimeout(() => Game.spawnBoss(), 1000); 
    }
    
    if(typeof loop === 'function') animFrameId = requestAnimationFrame(loop);
};

// --- INITIALIZATION ---
// Automatically start the Interactive Menu when script loads
if(typeof Menu !== 'undefined') {
    window.onload = function() {
        Menu.start();
    };
}