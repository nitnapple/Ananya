// --- ENHANCED BOSS, FORMATIONS & CHALLENGES ---

Game.spawnBoss = function() {
    AudioSys.speak("Warning. Boss Approaching.");
    AudioSys.playBossEntry();
    const isLevel5 = this.currentLevelIndex === 4;
    const isLevel10 = this.currentLevelIndex === 9;
    AudioSys.playBossLaugh(isLevel10);

    let type = 'normal';
    let hp = 300 + (this.currentLevelIndex * 50);
    let w = 140; let h = 100;
    let imgSrc = BOSS_URLS.generic;
    
    // Scaling for Challenges
    if (isLevel5) { 
        type = 'big'; hp = 1000; w = 220; h = 150; 
        imgSrc = BOSS_URLS.level5;
    }
    if (isLevel10) { 
        type = 'final'; hp = 3000; w = 300; h = 200; 
        imgSrc = BOSS_URLS.level10;
    }

    this.boss = {
        x: canvas.width/2, y: -150, targetY: canvas.height * 0.25,
        w: w, h: h, hp: hp, maxHp: hp, vx: 0, vy: 1,
        type: type, phase: 'enter', imgSrc: imgSrc,
        dropThresholds: [0.75, 0.50, 0.25], lootTimer: 0,
        attackTimer: 0, currentAttack: 'idle'
    };

    this.bossImgEl.src = imgSrc;
    this.bossImgEl.style.width = w + 'px'; this.bossImgEl.style.height = h + 'px';
    this.bossImgEl.style.display = 'block';
};

Game.spawnBossMinion = function(formation = 'V') {
    const isHard = this.currentLevelIndex === 4 || this.currentLevelIndex === 9;
    const count = isHard ? 8 : 5; // Level 5/10 get more mini-bosses
    const spacing = 60;
    
    for(let i = 0; i < count; i++) {
        let offX = 0; let offY = 0; let pType = 'normal';
        const mid = (count - 1) / 2; const relIdx = i - mid;

        // Formation Logic
        if (formation === 'V') { offX = relIdx * spacing; offY = Math.abs(relIdx) * 40; }
        else if (formation === 'DELTA') { offX = relIdx * spacing; offY = i % 2 === 0 ? 0 : 50; }
        else if (formation === 'CROSS') {
            if (i < count/2) { offX = (i - count/4) * spacing; offY = 0; }
            else { offX = 0; offY = (i - 3*count/4) * spacing; }
        }
        else if (formation === 'SIN' || formation === 'COS') { offX = relIdx * spacing; pType = formation.toLowerCase(); }

        this.enemies.push({
            x: this.boss.x + offX, y: this.boss.y + 50 + offY,
            w: isHard ? 65 : 45, h: isHard ? 50 : 35, 
            hp: isHard ? 40 : 15, vy: isHard ? 4.5 : 2.5, 
            vx: 0, pathType: pType, originX: this.boss.x + offX,
            isMinion: true, imgSrc: this.boss.imgSrc, rot: 0, rotSpeed: 0.05
        });
    }
};

Game.updateBoss = function(moveMult) {
    if(!this.boss) return;
    let boss = this.boss; const isHard = this.currentLevelIndex === 4 || this.currentLevelIndex === 9;

    if(boss.phase === 'enter') {
        boss.y += 2 * this.timeScale; if(boss.y >= boss.targetY) boss.phase = 'fight';
    } else {
        let speed = (this.currentLevelIndex === 9) ? 4.5 : 2; // Level 10 moves faster
        boss.x += Math.sin(this.frameCount * 0.03) * speed * moveMult;
        boss.x = Math.max(boss.w/2, Math.min(canvas.width - boss.w/2, boss.x));
    }

    if(boss.phase === 'fight') {
        // Fix: Periodic Loot Drops during Boss fight
        boss.lootTimer++;
        if (boss.lootTimer % 420 === 0) { // Every 7 seconds
            this.spawnPowerup(Math.random() * (canvas.width - 100) + 50, -50);
            if(Math.random() > 0.6) this.spawnHeart(Math.random() * (canvas.width - 100) + 50, -50);
        }

        // Fix: HP Threshold Drops
        if (boss.dropThresholds.length > 0 && (boss.hp / boss.maxHp) < boss.dropThresholds[0]) {
            boss.dropThresholds.shift(); this.spawnPowerup(boss.x, boss.y + 50); this.spawnHeart(boss.x + 30, boss.y + 50);
        }

        boss.attackTimer++;
        const threshold = isHard ? 40 : 70; // Hard levels attack faster

        if(boss.currentAttack === 'idle' && boss.attackTimer > threshold) {
            boss.attackTimer = 0; const r = Math.random();
            if(r < 0.45) boss.currentAttack = 'formation';
            else if(r < 0.75) boss.currentAttack = 'rapid';
            else boss.currentAttack = 'laser';
        }

        if(boss.currentAttack === 'formation') {
            const forms = ['V', 'DELTA', 'CROSS', 'SIN', 'COS'];
            this.spawnBossMinion(forms[Math.floor(Math.random()*forms.length)]); boss.currentAttack = 'idle';
        }

        if(boss.currentAttack === 'rapid') {
            let interval = (this.currentLevelIndex === 9) ? 5 : 10;
            if(boss.attackTimer % interval === 0) {
                const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                this.spawnBossBullet(boss.x - 25, boss.y + 50, angle, isHard ? 12 : 8);
                this.spawnBossBullet(boss.x + 25, boss.y + 50, angle, isHard ? 12 : 8);
            }
            if(boss.attackTimer > 100) boss.currentAttack = 'idle';
        }

        if(boss.currentAttack === 'laser') {
            const charge = (this.currentLevelIndex === 9) ? 30 : 60;
            if(boss.attackTimer < charge) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${boss.attackTimer/charge})`;
                ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(boss.x, boss.y + 50); ctx.lineTo(boss.x, canvas.height); ctx.stroke();
            } else if (boss.attackTimer < charge + 120) {
                const lW = (this.currentLevelIndex === 9 ? 100 : 50) + Math.sin(this.frameCount * 0.5) * 10;
                ctx.fillStyle = this.currentLevelIndex === 9 ? '#ff00ff' : '#ff0033'; // Final boss has purple laser
                ctx.fillRect(boss.x - lW/2, boss.y + 50, lW, canvas.height);
                if(Math.abs(this.player.x - boss.x) < (lW/2 + this.player.w/3) && this.player.invulnerable === 0) this.takeDamage();
            } else { boss.currentAttack = 'idle'; boss.attackTimer = 0; }
        }
    }
    this.bossImgEl.style.left = boss.x + 'px'; this.bossImgEl.style.top = boss.y + 'px';
};

Game.spawnBossBullet = function(x, y, angle, speed) {
    this.enemies.push({
        x: x, y: y, w: 22, h: 22, letter: '', isTrap: true, hp: 1, 
        isBossBullet: true, vy: Math.sin(angle) * speed, vx: Math.cos(angle) * speed,
        rot: 0, rotSpeed: 0.1, scale: 1, isMinion: false
    });
};

Game.drawBossHealth = function() {
    if(!this.boss) return;
    ctx.save(); ctx.translate(this.boss.x, this.boss.y);
    const barW = this.boss.w; const barH = 10; const yOffset = -this.boss.h/2 - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-barW/2, yOffset, barW, barH);
    const pct = Math.max(0, this.boss.hp) / this.boss.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#00ff00' : (pct > 0.2 ? '#ffff00' : '#ff0000');
    ctx.fillRect(-barW/2, yOffset, barW * pct, barH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-barW/2, yOffset, barW, barH);
    ctx.restore();
};

Game.checkBossCollisions = function() {
    if(!this.boss) return;
    if(this.player.invulnerable === 0 && Math.abs(this.player.x - this.boss.x) < (this.boss.w/2 + this.player.w/2) && Math.abs(this.player.y - this.boss.y) < (this.boss.h/2 + this.player.h/2)) {
         if(this.powerupState.shield > 0) {
             this.powerupState.shield = 0; this.player.invulnerable = 60;
             createParticles(this.player.x, this.player.y, 'cyan', 10, 'spark');
         } else { this.takeDamage(); }
    }
};

Game.killBoss = function() {
    createParticles(this.boss.x, this.boss.y, '#ffaa00', 30, 'smoke');
    createParticles(this.boss.x, this.boss.y, '#fff', 20, 'spark');
    this.screenShake = 30; this.score += 5000; this.boss = null; this.bossImgEl.style.display = 'none';
    floatingTexts.push({x: canvas.width/2, y: canvas.height/2, text: "BOSS DEFEATED!", color: 'gold', life: 3.0, vy: -0.5});
    AudioSys.playBossScream(this.currentLevelIndex === 9);
    this.timeScale = 0.2;
    this.slowMoTimeout = setTimeout(() => {
        this.timeScale = 1.0; if(this.foundLetters.every(x=>x)) { this.winTimeout = setTimeout(() => this.nextLevel(), 1000); }
        else { AudioSys.speak("Finish the word!"); }
    }, 2000);
};
