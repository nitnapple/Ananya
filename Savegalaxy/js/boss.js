// --- ENHANCED BOSS & FORMATION LOGIC ---

Game.spawnBoss = function() {
    AudioSys.speak("Warning. Boss Approaching.");
    AudioSys.playBossEntry();
    const isFinal = this.currentLevelIndex === 9; // Level 10
    const isMid = this.currentLevelIndex === 4;   // Level 5
    AudioSys.playBossLaugh(isFinal);

    // Inside boss.js -> Game.spawnBoss
this.spawnPartner();

    let type = 'normal';
    let hp = 300 + (this.currentLevelIndex * 50);
    let w = 140; let h = 100;
    let imgSrc = BOSS_URLS.generic;
    
    // Level 5 & 10 Difficulty Scaling
    if (isMid) { 
        type = 'big'; 
        hp = 800; // Increased HP for Level 5
        w = 220; h = 150; 
        imgSrc = BOSS_URLS.level5;
    }
    if (isFinal) { 
        type = 'final'; 
        hp = 2500; // Increased HP for Level 10
        w = 300; h = 200; 
        imgSrc = BOSS_URLS.level10;
    }

    this.boss = {
        x: canvas.width/2, y: -150, targetY: canvas.height * 0.25,
        w: w, h: h, hp: hp, maxHp: hp, vx: 0, vy: 1,
        type: type, phase: 'enter', imgSrc: imgSrc,
        dropThresholds: [0.75, 0.50, 0.25],
        lootTimer: 0,
        attackTimer: 0,
        currentAttack: 'idle'
    };

    this.bossImgEl.src = imgSrc;
    this.bossImgEl.style.width = w + 'px';
    this.bossImgEl.style.height = h + 'px';
    this.bossImgEl.style.display = 'block';
};

Game.spawnBossMinion = function(formation = 'V') {
    const isHard = this.currentLevelIndex === 4 || this.currentLevelIndex === 9;
    const count = isHard ? 8 : 5; // More minions for hard levels
    const spacing = 60;
    
    for(let i = 0; i < count; i++) {
        let offX = 0;
        let offY = 0;
        let pType = 'normal';
        const mid = (count - 1) / 2;
        const relIdx = i - mid;

        // Formation Logic
        if (formation === 'V') {
            offX = relIdx * spacing;
            offY = Math.abs(relIdx) * 40;
        } else if (formation === 'DELTA') {
            offX = relIdx * spacing;
            offY = i % 2 === 0 ? 0 : 50;
        } else if (formation === 'CROSS') {
            if (i < count/2) { offX = (i - count/4) * spacing; offY = 0; }
            else { offX = 0; offY = (i - 3*count/4) * spacing; }
        } else if (formation === 'SIN' || formation === 'COS') {
            offX = relIdx * spacing;
            pType = formation.toLowerCase();
        }

        this.enemies.push({
            x: this.boss.x + offX, 
            y: this.boss.y + 50 + offY,
            w: isHard ? 60 : 45, h: isHard ? 45 : 35, 
            hp: isHard ? 30 : 12, // Increased minion tankiness
            vy: isHard ? 4 : 2.5, 
            vx: 0, 
            pathType: pType,
            originX: this.boss.x + offX,
            isMinion: true, 
            imgSrc: this.boss.imgSrc,
            rot: 0, rotSpeed: 0.05
        });
    }
};

Game.updateBoss = function(moveMult) {
    if(!this.boss) return;
    let boss = this.boss;
    const isLevel5 = this.currentLevelIndex === 4;
    const isLevel10 = this.currentLevelIndex === 9;

    // Aggressive Movement for Level 10
    if(boss.phase === 'enter') {
        boss.y += 2 * this.timeScale;
        if(boss.y >= boss.targetY) boss.phase = 'fight';
    } else {
        let speed = (isLevel10) ? 4 : 2;
        boss.x += Math.sin(this.frameCount * 0.03) * speed * moveMult;
        boss.x = Math.max(boss.w/2, Math.min(canvas.width - boss.w/2, boss.x));
    }

    if(boss.phase === 'fight') {
        boss.attackTimer++;
        // Faster attack cycles for Level 5 and 10
        const threshold = (isLevel5 || isLevel10) ? 45 : 75;

        if(boss.currentAttack === 'idle' && boss.attackTimer > threshold) {
            boss.attackTimer = 0;
            const r = Math.random();
            if(r < 0.4) boss.currentAttack = 'formation';
            else if(r < 0.7) boss.currentAttack = 'rapid';
            else boss.currentAttack = 'laser';
        }

        if(boss.currentAttack === 'formation') {
            const forms = ['V', 'DELTA', 'CROSS', 'SIN', 'COS'];
            this.spawnBossMinion(forms[Math.floor(Math.random()*forms.length)]);
            boss.currentAttack = 'idle';
        }

        if(boss.currentAttack === 'rapid') {
            if(boss.attackTimer % (isLevel10 ? 6 : 10) === 0) {
                const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                this.spawnBossBullet(boss.x, boss.y + 50, angle, isLevel10 ? 12 : 8);
                if(isLevel5) this.spawnBossBullet(boss.x, boss.y + 50, angle + 0.2, 8); // Double shot for Lv 5
            }
            if(boss.attackTimer > 100) boss.currentAttack = 'idle';
        }

        if(boss.currentAttack === 'laser') {
            const charge = isLevel10 ? 30 : 60; // Faster charge on final boss
            if(boss.attackTimer < charge) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${boss.attackTimer/charge})`;
                ctx.lineWidth = 2; ctx.beginPath();
                ctx.moveTo(boss.x, boss.y + 50); ctx.lineTo(boss.x, canvas.height); ctx.stroke();
            } else if (boss.attackTimer < charge + 120) {
                const lW = (isLevel10 ? 90 : 50) + Math.sin(this.frameCount * 0.5) * 10;
                ctx.fillStyle = isLevel10 ? '#ff00ff' : '#ff0033';
                ctx.fillRect(boss.x - lW/2, boss.y + 50, lW, canvas.height);
                if(Math.abs(this.player.x - boss.x) < (lW/2 + this.player.w/3) && this.player.invulnerable === 0) {
                    this.takeDamage();
                }
            } else { boss.currentAttack = 'idle'; boss.attackTimer = 0; }
        }
    }
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW/2, yOffset, barW, barH);
    const pct = Math.max(0, this.boss.hp) / this.boss.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#00ff00' : (pct > 0.2 ? '#ffff00' : '#ff0000');
    ctx.fillRect(-barW/2, yOffset, barW * pct, barH);
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
    
    // Inside boss.js -> Game.killBoss
this.partner.active = false;
this.partnerBullets = []; // Clear any remaining hearts

    this.timeScale = 0.2;
    this.slowMoTimeout = setTimeout(() => {
        this.timeScale = 1.0;
        if(this.foundLetters.every(x=>x)) { this.winTimeout = setTimeout(() => this.nextLevel(), 1000); }
        else { AudioSys.speak("Finish the word!"); }
    }, 2000);
};
