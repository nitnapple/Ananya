const Game = {
    // Entities
    bullets: [], enemies: [], powerups: [], boss: null,
    
    // Player State
    player: { x: 0, y: 0, w: 50, h: 50, lastShot: 0, fireRate: 8, invulnerable: 0 },
    
    // Config
    gameRunning: false, isPaused: false, frameCount: 0,
    lives: 5, currentLevelIndex: 0, score: 0, combo: 1,
    
    // Tracking
    gameStartTime: 0, pausedTime: 0, levelStartScore: 0,
    foundLetters: [], currentTarget: "",
    levelTransitioning: false, screenShake: 0, timeScale: 1.0,

    // Timers
    winTimeout: null, levelTimeout: null, slowMoTimeout: null,

    // Powerup Flags
    powerupState: { beam: 0, shield: 0, spread: 0, magnet: 0, freeze: 0 },

    // DOM References
    bossImgEl: document.getElementById('boss-entity'),
    playerImgEl: document.getElementById('player-entity'),

    // --- STANDARD SPAWNING ---
    spawnBullet: function(offset = 0, angle = 0) {
        AudioSys.playShoot();
        this.bullets.push({
            x: this.player.x + offset, y: this.player.y, 
            w: 4, h: 20, 
            vx: Math.sin(angle) * 18, vy: -Math.cos(angle) * 18, 
            color: '#00ffff'
        });
    },

    spawnPowerup: function(x, y) {
        const types = ['beam', 'shield', 'spread', 'magnet', 'freeze'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({ x: x, y: y, vy: 2, w: 30, h: 30, type: type });
    },

    spawnHeart: function(x, y) {
        this.powerups.push({ x: x, y: y, vy: 2, w: 30, h: 30, type: 'heart' });
    },

    spawnEnemy: function() {
        if (this.levelTransitioning || this.boss) return;
        
        let scale = 1;
        if(Math.random() < 0.1) scale = 3; else if(Math.random() < 0.25) scale = 2; 
        
        const size = (30 + Math.random() * 20) * scale;
        let char = ''; let isTrap = false;
        
        const neededIndices = this.foundLetters.map((found, idx) => found ? -1 : idx).filter(i => i !== -1);
        const rand = Math.random();
        const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        if (rand < 0.35 && neededIndices.length > 0) {
            char = this.currentTarget[neededIndices[Math.floor(Math.random() * neededIndices.length)]];
        } else if (rand < 0.45) {
            isTrap = true; char = alpha[Math.floor(Math.random() * alpha.length)];
        } else {
            char = alpha[Math.floor(Math.random() * alpha.length)];
        }

        const hp = (Math.floor(Math.random() * 3) + 3) * scale * 1.5;
        const isMeteor = Math.random() < 0.3;
        
        this.enemies.push({
            x: Math.random() * (canvas.width - size*2) + size,
            y: -50 - size, w: size, h: size, letter: char, isTrap: isTrap,
            hp: hp, imgType: isMeteor ? 'meteor' : 'asteroid',
            vy: (Math.random() * 2 + 1.5 + (this.currentLevelIndex * 0.2)) / scale * (isMeteor ? 1.5 : 1),
            rot: Math.random() * Math.PI, rotSpeed: ((Math.random()-0.5) * 0.05) / scale,
            scale: scale
        });
        
        if(Math.random() < 0.05) this.spawnHeart(Math.random() * canvas.width, -50);
    },

    // *** HIT LOGIC ***
    hitEnemy: function(e, index, damage) {
        e.hp -= damage; e.y -= 2; createParticles(e.x, e.y, '#fff', 2, 'spark');
        if (e.hp <= 0) {
            if(e.isTrap) {
                this.score = Math.max(0, this.score - 200); this.combo = 1; updateComboUI();
                this.screenShake = 10; vibrate(50);
                createParticles(e.x, e.y, 'red', 10, 'smoke');
                floatingTexts.push({x: e.x, y: e.y, text: "TRAP!", color: 'red', life: 1.0, vy: -1});
                this.enemies.splice(index, 1); document.getElementById('score-display').innerText = `PTS: ${this.score}`;
                return;
            }
            AudioSys.playExplosion();
            createParticles(e.x, e.y, '#ffaa00', 8, 'smoke'); createParticles(e.x, e.y, '#ffcc00', 8, 'spark');
            
            // --- UPDATED MINION LOGIC ---
            if(e.isMinion) { 
                // 20% Chance for Powerup, 5% Chance for Heart from Minions
                if (Math.random() < 0.20) { 
                    this.spawnPowerup(e.x, e.y);
                } else if (Math.random() < 0.05) { 
                    this.spawnHeart(e.x, e.y);
                }
                
                this.enemies.splice(index, 1); 
                return; 
            }
            
            let collected = false;
            for(let k=0; k<this.currentTarget.length; k++) {
                if(this.currentTarget[k] === e.letter && !this.foundLetters[k]) {
                    this.foundLetters[k] = true; collected = true;
                    const slot = document.getElementById(`word-slot-${k}`);
                    if(slot) { slot.innerText = e.letter; slot.classList.add('filled'); }
                    this.score += 100 * this.combo;
                    floatingTexts.push({x: e.x, y: e.y, text: e.letter, isLetter:true, life: 1.0, vy: -2});
                    AudioSys.playCollect(true);
                    this.combo++; updateComboUI(); break;
                }
            }
            if(!collected) this.score += 10 * this.combo;
            document.getElementById('score-display').innerText = `PTS: ${this.score}`;
            
            if(Math.random() < 0.08) this.spawnPowerup(e.x, e.y);
            this.enemies.splice(index, 1);
            
            if(this.foundLetters.every(x=>x) && !this.winTimeout && !this.levelTransitioning && !this.boss) {
                this.winTimeout = setTimeout(() => this.nextLevel(), 1000);
            }
        }
    },

    activatePowerup: function(type) {
        AudioSys.playPowerupCollect(); AudioSys.speak(type);
        floatingTexts.push({x: this.player.x, y: this.player.y - 40, text: type.toUpperCase() + "!", life: 1.5, vy: -1, color: '#fff'});
        
        // Shield = 300 frames (5 seconds)
        if(type === 'shield') this.powerupState.shield = 300; 
        
        if(type === 'beam') this.powerupState.beam = 300; 
        if(type === 'spread') this.powerupState.spread = 600; 
        if(type === 'magnet') this.powerupState.magnet = 600;
        if(type === 'freeze') this.powerupState.freeze = 300;
    },

    takeDamage: function() {
        this.lives--; this.combo = 1; updateComboUI(); updateLivesUI();
        this.player.invulnerable = 100; this.screenShake = 20; 
        createParticles(this.player.x, this.player.y, '#ff3366', 20, 'smoke');
        AudioSys.playExplosion(); vibrate(200);
        if(this.lives <= 0) this.gameOver(false);
    }
};