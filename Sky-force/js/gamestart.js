// --- GAME LIFECYCLE LOGIC ---

Game.reset = function(restartLevel = false) {
    if(this.winTimeout) clearTimeout(this.winTimeout);
    if(this.levelTimeout) clearTimeout(this.levelTimeout);
    if(this.slowMoTimeout) clearTimeout(this.slowMoTimeout);

    if (!restartLevel) {
        // NEW GAME
        this.lives = 5; this.score = 0; this.levelStartScore = 0;
        this.currentLevelIndex = 0; this.gameStartTime = Date.now(); 
        this.pausedTime = 0;
    } else {
        // RETRY LEVEL
        this.lives = 5; this.score = this.levelStartScore;
    }

    this.frameCount = 0; this.levelTransitioning = false; this.boss = null;
    this.timeScale = 1.0; this.gameRunning = true; this.isPaused = false; 
    this.combo = 1;
    this.powerupState = { beam: 0, shield: false, spread: 0, magnet: 0, freeze: 0 };
    
    this.bullets = []; this.enemies = []; this.powerups = [];
    particles.length = 0; floatingTexts.length = 0; 
    
    // *** FIX: Initialize Level Word ***
    this.currentTarget = LEVELS[this.currentLevelIndex];
    // Map spaces to 'true' (already found), letters to 'false'
    this.foundLetters = this.currentTarget.split('').map(c => c === ' ');

    this.player.x = canvas.width/2; this.player.y = canvas.height - 150;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'flex';
    this.bossImgEl.style.display = 'none';
    this.playerImgEl.style.display = 'block';
};

Game.nextLevel = function() {
    this.winTimeout = null;
    this.levelStartScore = this.score; // Checkpoint
    this.currentLevelIndex++;
    this.levelTransitioning = true;
    this.powerupState = { beam: 0, shield: false, spread: 0, magnet: 0, freeze: 0 };
    this.boss = null; this.bossImgEl.style.display = 'none'; this.timeScale = 1.0;
    
    if (this.currentLevelIndex >= LEVELS.length) { this.gameOver(true); return; }

    // *** FIX: Update Target Word for Next Level ***
    this.currentTarget = LEVELS[this.currentLevelIndex];
    this.foundLetters = this.currentTarget.split('').map(c => c === ' ');

    this.enemies = []; this.bullets = []; this.powerups = [];
    
    const levelScreen = document.getElementById('level-screen');
    levelScreen.style.display = 'flex';
    document.getElementById('level-title').innerText = `LEVEL ${this.currentLevelIndex + 1}`;
    document.getElementById('level-subtitle').innerText = LEVELS[this.currentLevelIndex];
    
    this.score += 500; this.levelStartScore = this.score;
    document.getElementById('score-display').innerText = `PTS: ${this.score}`;
    
    AudioSys.playCollect();
    AudioSys.speak(`Level ${this.currentLevelIndex+1}. ${LEVELS[this.currentLevelIndex]}`);

    this.levelTimeout = setTimeout(() => {
        if(!this.gameRunning) return; 
        levelScreen.style.display = 'none';
        this.levelTransitioning = false;
        
        // Render the new word slots
        updateLevelHUD();
        
        this.enemies = []; this.bullets = [];
        if ([1, 3, 4, 5, 7, 9].includes(this.currentLevelIndex)) this.spawnBoss();
    }, 2000);
};

Game.gameOver = function(win) {
    if(this.winTimeout) clearTimeout(this.winTimeout);
    if(this.levelTimeout) clearTimeout(this.levelTimeout);
    if(this.slowMoTimeout) clearTimeout(this.slowMoTimeout);
    
    this.gameRunning = false;
    this.bossImgEl.style.display = 'none'; this.playerImgEl.style.display = 'none'; 
    AudioSys.stopBGM();
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('level-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'flex';
    
    const title = document.getElementById('end-title');
    const sub = document.getElementById('end-subtitle');
    const fScore = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');

    if(win) {
        title.innerText = "MISSION ACCOMPLISHED"; title.style.color = "#00ffcc";
        sub.innerText = "GALAXY SECURED";
        restartBtn.innerText = "PLAY AGAIN";
        restartBtn.onclick = () => window.triggerStartGame(false);
        AudioSys.playCollect();
    } else {
        title.innerText = "CRITICAL FAILURE"; title.style.color = "#ff3366";
        sub.innerText = "SHIP DESTROYED";
        restartBtn.innerText = "RETRY LEVEL";
        restartBtn.onclick = () => window.triggerStartGame(true);
    }
    fScore.innerText = `FINAL SCORE: ${this.score}`;
};

// Global Trigger
window.triggerStartGame = function(restartLevel = false) {
    if(animFrameId) cancelAnimationFrame(animFrameId);
    AudioSys.stopBGM(); AudioSys.init(); AudioSys.startBGM();
    if (!restartLevel) AudioSys.speak("Level 1. Ananya.");
    else AudioSys.speak("Retrying Level.");
    
    Game.reset(restartLevel);
    document.getElementById('score-display').innerText = `PTS: ${Game.score}`;
    document.getElementById('time-display').innerText = "00:00";
    
    input.active = false; 
    initBackground(); 
    updateLivesUI(); 
    updateComboUI();
    
    // Render the initial word
    updateLevelHUD();
    
    if(restartLevel && [1, 3, 4, 5, 7, 9].includes(Game.currentLevelIndex)) {
        setTimeout(() => Game.spawnBoss(), 1000); 
    }
    animFrameId = requestAnimationFrame(loop);
};