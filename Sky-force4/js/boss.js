// --- BOSS LOGIC ---

Game.spawnBoss = function() {
    AudioSys.speak("Warning. Boss Approaching.");
    AudioSys.playBossEntry();
    const isFinal = this.currentLevelIndex === 9;
    AudioSys.playBossLaugh(isFinal);

    let type = 'normal';
    let hp = 300 + (this.currentLevelIndex * 50); // Increased HP to make fight last longer
    let w = 140; let h = 100; 
    let imgSrc = BOSS_URLS.generic;
    
    if (this.currentLevelIndex === 4) { type = 'big'; hp = 600; w = 220; h = 150; imgSrc = BOSS_URLS.level5; }
    if (this.currentLevelIndex === 9) { type = 'final'; hp = 2000; w = 300; h = 200; imgSrc = BOSS_URLS.level10; }

    this.boss = {
        x: canvas.width/2, y: -150, targetY: canvas.height * 0.25, 
        w: w, h: h, hp: hp, maxHp: hp, vx: 0, vy: 1, 
        type: type, phase: 'enter', imgSrc: imgSrc,
        
        // Attack State
        attackTimer: 0,
        currentAttack: 'idle', // idle, rapid, laser, swarm
        laserState: { active: false, charging: 0, firing: 0, width: 0 }
    };

    this.bossImgEl.src = imgSrc;
    this.bossImgEl.style.width = w + 'px';
    this.bossImgEl.style.height = h + 'px';
    this.bossImgEl.style.display = 'block';
};

Game.spawnBossMinion = function(count = 2) {
    AudioSys.speak("Minions!");
    const startX = this.boss.x - ((count-1) * 60) / 2;
    for(let i = 0; i < count; i++) {
        this.enemies.push({
            x: startX + (i * 60), 
            y: this.boss.y + 50,
            w: 50, h: 35, letter: '', isTrap: false, hp: 15,
            vy: 4 + Math.random(), vx: (Math.random()-0.5)*2, 
            rot: 0, rotSpeed: 0, scale: 1, isMinion: true,
            imgSrc: this.boss.imgSrc
        });
    }
};

Game.updateBoss = function(moveMult) {
    if(!this.boss) return;
    let boss = this.boss;

    // --- 1. MOVEMENT & ENTRY ---
    if(boss.phase === 'enter') {
        boss.y += 2 * this.timeScale;
        if(boss.y >= boss.targetY) boss.phase = 'fight';
    } else {
        // Hover Movement
        boss.x += Math.sin(this.frameCount * 0.03) * 2 * moveMult;
        boss.x = Math.max(boss.w/2, Math.min(canvas.width - boss.w/2, boss.x));
    }

    // --- 2. DAMAGE SMOKE EFFECTS ---
    // 20% Damaged (80% HP left) -> White Smoke
    const hpPct = boss.hp / boss.maxHp;
    
    if (hpPct < 0.8 && this.frameCount % 15 === 0) {
        createParticles(boss.x + (Math.random()-0.5)*boss.w, boss.y, 'rgba(255,255,255,0.5)', 1, 'smoke');
    }
    // 50% Damaged -> Grey Smoke (More frequent)
    if (hpPct < 0.5 && this.frameCount % 8 === 0) {
        createParticles(boss.x + (Math.random()-0.5)*boss.w, boss.y + 20, 'rgba(100,100,100,0.6)', 2, 'smoke');
    }
    // 80% Damaged (20% HP left) -> Black Smoke (Heavy)
    if (hpPct < 0.2 && this.frameCount % 4 === 0) {
        createParticles(boss.x, boss.y, '#222', 3, 'smoke');
        createParticles(boss.x + (Math.random()-0.5)*boss.w, boss.y, '#000', 2, 'smoke');
    }

    // --- 3. ATTACK LOGIC ---
    if(boss.phase === 'fight') {
        boss.attackTimer++;

        // Attack Selector
        if(boss.currentAttack === 'idle' && boss.attackTimer > 60) {
            boss.attackTimer = 0;
            const rand = Math.random();
            if(rand < 0.4) boss.currentAttack = 'rapid';
            else if(rand < 0.7) boss.currentAttack = 'laser';
            else if(rand < 0.9) boss.currentAttack = 'swarm';
            else boss.currentAttack = 'spread';
        }

        // Execute Attacks
        if(boss.currentAttack === 'rapid') {
            // Rapid Fire: Fast bullets for 2 seconds
            if(boss.attackTimer % 10 === 0) {
                const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                this.spawnBossBullet(boss.x, boss.y + 50, angle, 9);
            }
            if(boss.attackTimer > 120) boss.currentAttack = 'idle';
        }
        else if(boss.currentAttack === 'spread') {
            // Burst Spread
            if(boss.attackTimer === 10 || boss.attackTimer === 30) {
                for(let k=-2; k<=2; k++) {
                    this.spawnBossBullet(boss.x, boss.y + 50, (Math.PI/2) + (k * 0.2), 7);
                }
                AudioSys.playShoot();
            }
            if(boss.attackTimer > 60) boss.currentAttack = 'idle';
        }
        else if(boss.currentAttack === 'swarm') {
            // Sudden Minions
            if(boss.attackTimer === 20) {
                this.spawnBossMinion(4); // Spawn 4 at once
            }
            if(boss.attackTimer > 60) boss.currentAttack = 'idle';
        }
        else if(boss.currentAttack === 'laser') {
            // LASER BEAM
            // 0-60: Charge (Show warning line)
            // 60-180: FIRE (Damage)
            
            if(boss.attackTimer < 60) {
                // Charging Visual
                ctx.save();
                ctx.strokeStyle = `rgba(255, 0, 0, ${boss.attackTimer/60})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(boss.x, boss.y + 50);
                ctx.lineTo(boss.x, canvas.height);
                ctx.stroke();
                ctx.restore();
            } else if (boss.attackTimer < 160) {
                // Firing
                const laserW = 40 + Math.sin(this.frameCount * 0.8) * 10;
                ctx.save();
                ctx.fillStyle = '#ff0033';
                ctx.shadowBlur = 20; ctx.shadowColor = 'red';
                ctx.fillRect(boss.x - laserW/2, boss.y + 50, laserW, canvas.height);
                
                // Core
                ctx.fillStyle = '#fff';
                ctx.fillRect(boss.x - laserW/4, boss.y + 50, laserW/2, canvas.height);
                ctx.restore();
                
                // Collision
                if(Math.abs(this.player.x - boss.x) < (laserW/2 + this.player.w/3)) {
                   if(this.powerupState.shield > 0) {
                       this.powerupState.shield = 0; 
                       this.player.invulnerable = 60;
                   } else if(this.player.invulnerable === 0) {
                       this.takeDamage();
                   }
                }
                if(this.frameCount % 5 === 0) createParticles(boss.x, boss.y + 60, 'red', 3, 'spark');
            } else {
                boss.currentAttack = 'idle';
                boss.attackTimer = 0;
            }
        }
    }
    
    // Update DOM Image
    this.bossImgEl.style.left = boss.x + 'px';
    this.bossImgEl.style.top = boss.y + 'px';
};

Game.spawnBossBullet = function(x, y, angle, speed) {
    this.enemies.push({
        x: x, y: y, w: 20, h: 20, letter: '', isTrap: true, hp: 1, 
        isBossBullet: true, 
        vy: Math.sin(angle) * speed, 
        vx: Math.cos(angle) * speed,
        rot: 0, rotSpeed: 0.1, scale: 1, isMinion: false
    });
};

Game.drawBossHealth = function() {
    if(!this.boss) return;
    ctx.save(); ctx.translate(this.boss.x, this.boss.y);
    const barW = this.boss.w; const barH = 10; const yOffset = -this.boss.h/2 - 20;
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; 
    ctx.fillRect(-barW/2, yOffset, barW, barH);
    
    // Health Color (Green -> Yellow -> Red)
    const pct = Math.max(0, this.boss.hp) / this.boss.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#00ff00' : (pct > 0.2 ? '#ffff00' : '#ff0000');
    
    ctx.fillRect(-barW/2, yOffset, barW * pct, barH);
    
    // Border
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; 
    ctx.strokeRect(-barW/2, yOffset, barW, barH);
    ctx.restore();
};

Game.checkBossCollisions = function() {
    if(!this.boss) return;
    if(this.player.invulnerable === 0 && Math.abs(this.player.x - this.boss.x) < (this.boss.w/2 + this.player.w/2) && Math.abs(this.player.y - this.boss.y) < (this.boss.h/2 + this.player.h/2)) {
         if(this.powerupState.shield > 0) { 
             this.powerupState.shield = 0; 
             this.player.invulnerable = 60; 
             createParticles(this.player.x, this.player.y, 'cyan', 10, 'spark');
         } else { 
             this.takeDamage(); 
         }
    }
};

Game.killBoss = function() {
    createParticles(this.boss.x, this.boss.y, '#ffaa00', 30, 'smoke');
    createParticles(this.boss.x, this.boss.y, '#fff', 20, 'spark');
    this.screenShake = 30; this.score += 5000; this.boss = null;
    this.bossImgEl.style.display = 'none'; 
    floatingTexts.push({x: canvas.width/2, y: canvas.height/2, text: "BOSS DEFEATED!", color: 'gold', life: 3.0, vy: -0.5});
    AudioSys.playBossScream(this.currentLevelIndex === 9);
    
    this.timeScale = 0.2;
    this.slowMoTimeout = setTimeout(() => {
        this.timeScale = 1.0;
        if(this.foundLetters.every(x=>x)) { this.winTimeout = setTimeout(() => this.nextLevel(), 1000); } 
        else { AudioSys.speak("Finish the word!"); }
    }, 2000);
};