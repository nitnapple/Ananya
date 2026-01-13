Game.spawnBoss = function() {
    AudioSys.speak("Warning. Boss Approaching."); AudioSys.playBossEntry();
    const isFinal = this.currentLevelIndex === 9; AudioSys.playBossLaugh(isFinal);
    let type = 'normal', hp = 100+(this.currentLevelIndex*10), w = 140, h = 100, imgSrc = BOSS_URLS.generic;
    if (this.currentLevelIndex === 4) { type = 'big'; hp = 300; w = 220; h = 150; imgSrc = BOSS_URLS.level5; }
    if (this.currentLevelIndex === 9) { type = 'final'; hp = 1000; w = 300; h = 200; imgSrc = BOSS_URLS.level10; }
    this.boss = { x: canvas.width/2, y: -150, targetY: canvas.height*0.35, w: w, h: h, hp: hp, maxHp: hp, vx: 0, vy: 1, type: type, phase: 'enter', shootTimer: 0, minionTimer: 0, imgSrc: imgSrc };
    this.bossImgEl.src = imgSrc; this.bossImgEl.style.width = w+'px'; this.bossImgEl.style.height = h+'px'; this.bossImgEl.style.display = 'block';
};
Game.spawnBossMinion = function() {
    AudioSys.speak("Minions!");
    for(let i=-1; i<=1; i+=2) {
        this.enemies.push({ x: this.boss.x+(i*60), y: this.boss.y+50, w: 50, h: 35, letter: '', isTrap: false, hp: 10, vy: 3, vx: 0, rot: 0, rotSpeed: 0, scale: 1, isMinion: true, imgSrc: this.boss.imgSrc });
    }
};
Game.updateBoss = function(moveMult) {
    if(!this.boss) return;
    let boss = this.boss;
    if(boss.phase === 'enter') {
        boss.y += 2 * this.timeScale; if(boss.y >= boss.targetY) boss.phase = 'fight';
    } else {
        let dodgeVel = 0;
        for(let b of this.bullets) { if(b.y > boss.y && b.y < boss.y+250 && Math.abs(b.x-boss.x) < boss.w+20) { dodgeVel = (boss.x < b.x)?-4:4; break; } }
        boss.vx += dodgeVel * 0.5;
        if(boss.x < 100) boss.vx += 0.2; else if(boss.x > canvas.width-100) boss.vx -= 0.2;
        else { boss.vx += (Math.random()-0.5)*0.5; boss.vx += Math.sin(this.frameCount*0.05)*0.1; }
        boss.vx *= 0.95; if(boss.vx>6) boss.vx=6; if(boss.vx<-6) boss.vx=-6;
        boss.x += boss.vx * moveMult;
        if(boss.x < boss.w/2) { boss.x = boss.w/2; boss.vx *= -0.5; }
        if(boss.x > canvas.width - boss.w/2) { boss.x = canvas.width - boss.w/2; boss.vx *= -0.5; }
        boss.shootTimer++;
        let fireRate = (boss.hp < boss.maxHp*0.4) ? 30 : 60;
        if(boss.shootTimer > fireRate) {
            boss.shootTimer = 0;
            for(let k=0; k<3; k++) {
                setTimeout(() => {
                    if(!Game.boss) return;
                    const angle = Math.atan2(Game.player.y - Game.boss.y, Game.player.x - Game.boss.x);
                    const spread = (Math.random() - 0.5) * 0.3;
                    Game.enemies.push({ x: Game.boss.x, y: Game.boss.y+50, w: 20, h: 20, letter: '', isTrap: true, hp: 1, isBossBullet: true, vy: Math.sin(angle+spread)*7, vx: Math.cos(angle+spread)*7, rot: 0, rotSpeed: 0.1, scale: 1, isMinion: false });
                    AudioSys.playShoot();
                }, k * 100);
            }
            if(Math.random()<0.3) Game.spawnBossMinion();
        }
        if (this.frameCount % 120 === 0) { 
            const dropX = Math.random() * (canvas.width - 50) + 25;
            if(Math.random() < 0.4) this.spawnHeart(dropX, -50); else this.spawnPowerup(dropX, -50);
        }
    }
    this.bossImgEl.style.left = boss.x + 'px'; this.bossImgEl.style.top = boss.y + 'px';
};
Game.drawBossHealth = function() {
    if(!this.boss) return;
    ctx.save(); ctx.translate(this.boss.x, this.boss.y);
    const barW = this.boss.w; const barH = 10; const yOffset = -this.boss.h/2 - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-barW/2, yOffset, barW, barH);
    ctx.fillStyle = '#ff0000'; ctx.fillRect(-barW/2, yOffset, barW * (Math.max(0, this.boss.hp) / this.boss.maxHp), barH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-barW/2, yOffset, barW, barH); ctx.restore();
};
Game.checkBossCollisions = function() {
    if(!this.boss) return;
    if(this.player.invulnerable === 0 && Math.abs(this.player.x - this.boss.x) < (this.boss.w/2 + this.player.w/2) && Math.abs(this.player.y - this.boss.y) < (this.boss.h/2 + this.player.h/2)) {
         if(this.powerupState.shield) { this.powerupState.shield = false; this.player.invulnerable = 60; } else { this.takeDamage(); }
    }
};
Game.killBoss = function() {
    createParticles(this.boss.x, this.boss.y, '#ffaa00', 30, 'smoke'); createParticles(this.boss.x, this.boss.y, '#fff', 20, 'spark');
    this.screenShake = 30; this.score += 5000; this.boss = null; this.bossImgEl.style.display = 'none'; 
    floatingTexts.push({x: canvas.width/2, y: canvas.height/2, text: "BOSS DEFEATED!", color: 'gold', life: 3.0, vy: -0.5});
    AudioSys.playBossScream(this.currentLevelIndex === 9);
    this.timeScale = 0.2; this.slowMoTimeout = setTimeout(() => {
        this.timeScale = 1.0;
        if(this.foundLetters.every(x=>x)) { this.winTimeout = setTimeout(() => this.nextLevel(), 1000); } else { AudioSys.speak("Finish the word!"); }
    }, 2000);
};