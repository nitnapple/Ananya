// --- PLAYER LOGIC ---

Game.updatePlayer = function() {
    if (!this.playerImgEl) return;

    // 1. Movement
    this.player.x += (input.x - this.player.x) * 0.2; 
    this.player.y += (input.y - this.player.y) * 0.2;
    this.player.x = Math.max(25, Math.min(canvas.width-25, this.player.x));
    this.player.y = Math.max(25, Math.min(canvas.height-25, this.player.y));

    // 2. Visuals
    this.playerImgEl.style.left = this.player.x + 'px';
    this.playerImgEl.style.top = this.player.y + 'px';
    this.playerImgEl.style.transform = `translate(-50%, -50%) rotate(${ (input.x - this.player.x) * 0.5 }deg)`; 

    // 3. Trail
    if(this.frameCount % 3 === 0) createParticles(this.player.x, this.player.y + 20, '#00ffff', 1, 'trail');

    // 4. SHIELD VISUALS
    if (this.powerupState.shield > 0) {
        this.powerupState.shield--; 
        
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.globalCompositeOperation = 'lighter';
        
        const pct = this.powerupState.shield / 300; 
        
        // Outer glow
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(this.frameCount * 0.2) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.stroke();

        // Timer ring (shrinking)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 45, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * pct), false);
        ctx.stroke();
        
        ctx.restore();
    }

    // 5. Invulnerability Blink (Only if no shield)
    if(this.player.invulnerable > 0 && this.powerupState.shield <= 0) {
        this.player.invulnerable--;
        if(this.player.invulnerable % 10 < 5) { 
            ctx.save(); ctx.translate(this.player.x, this.player.y); 
            if(this.lives <= 2 && Math.random() > 0.5) createParticles(this.player.x, this.player.y, '#555', 1, 'smoke');
            ctx.globalAlpha = 0.5; ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.arc(0,0, 30, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }
};

Game.handlePlayerShooting = function() {
    // ... (timer decrements remain the same) ...
    if(this.powerupState.beam > 0) this.powerupState.beam--;
    if(this.powerupState.spread > 0) this.powerupState.spread--;
    if(this.powerupState.magnet > 0) this.powerupState.magnet--;
    if(this.powerupState.freeze > 0) this.powerupState.freeze--;

    if(this.powerupState.beam > 0) {
        // ... (beam logic remains same) ...
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        let beamW = 40 + Math.sin(this.frameCount * 0.5) * 10;
        let grad = ctx.createLinearGradient(this.player.x - beamW/2, this.player.y, this.player.x + beamW/2, this.player.y);
        grad.addColorStop(0, 'rgba(0, 255, 255, 0)'); grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)'); grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = grad; ctx.fillRect(this.player.x - beamW/2, 0, beamW, this.player.y); ctx.restore();

        if(this.frameCount % 4 === 0) {
             for (let j = this.enemies.length - 1; j >= 0; j--) {
                let e = this.enemies[j];
                if(Math.abs(e.x - this.player.x) < (beamW/2 + e.w/2)) Game.hitEnemy(e, j, 3);
             }
             if(this.boss && Math.abs(this.boss.x - this.player.x) < (beamW/2 + this.boss.w/2)) {
                 this.boss.hp -= 2; createParticles(this.boss.x, this.boss.y + this.boss.h/2, '#fff', 5, 'spark');
                 if(this.boss.hp <= 0) Game.killBoss();
             }
        }
    } 
    // STANDARD SHOOTING
    else {
        // *** CRITICAL CHECK *** // Ensure input.active is actually being set by mouse/touch events
        if(input.active && this.frameCount - this.player.lastShot > this.player.fireRate) {
            this.spawnBullet(-15); this.spawnBullet(15);
            createParticles(this.player.x - 15, this.player.y - 20, '#00ffff', 1, 'spark'); 
            createParticles(this.player.x + 15, this.player.y - 20, '#00ffff', 1, 'spark');
            if(this.powerupState.spread > 0) { this.spawnBullet(0, -0.2); this.spawnBullet(0, 0.2); this.spawnBullet(0); }
            this.player.lastShot = this.frameCount;
        }
    }
};