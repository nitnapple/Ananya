// --- PLAYER LOGIC ---

Game.updatePlayer = function() {
    if (!this.playerImgEl) return;

    // 1. Movement (Lerp towards input)
    this.player.x += (input.x - this.player.x) * 0.2; 
    this.player.y += (input.y - this.player.y) * 0.2;

    // 2. Boundaries
    this.player.x = Math.max(25, Math.min(canvas.width-25, this.player.x));
    this.player.y = Math.max(25, Math.min(canvas.height-25, this.player.y));

    // 3. Visuals (DOM)
    this.playerImgEl.style.left = this.player.x + 'px';
    this.playerImgEl.style.top = this.player.y + 'px';
    // Tilt effect
    this.playerImgEl.style.transform = `translate(-50%, -50%) rotate(${ (input.x - this.player.x) * 0.5 }deg)`; 

    // 4. Trail Particles
    if(this.frameCount % 3 === 0) createParticles(this.player.x, this.player.y + 20, '#00ffff', 1, 'trail');

    // 5. Invulnerability Blink
    if(this.player.invulnerable > 0) {
        this.player.invulnerable--;
        // Draw Shield
        if(this.player.invulnerable % 10 < 5) { 
            ctx.save(); ctx.translate(this.player.x, this.player.y); ctx.globalCompositeOperation = 'lighter'; 
            if(this.powerupState.shield) { 
                ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0, 40, 0, Math.PI*2); ctx.stroke(); 
            }
            // Low health smoke
            if(this.lives <= 2 && Math.random() > 0.5) createParticles(this.player.x, this.player.y, '#555', 1, 'smoke');
            ctx.restore();
        }
    }
};

Game.handlePlayerShooting = function() {
    // Decrement Powerup Timers
    if(this.powerupState.beam > 0) this.powerupState.beam--;
    if(this.powerupState.spread > 0) this.powerupState.spread--;
    if(this.powerupState.magnet > 0) this.powerupState.magnet--;
    if(this.powerupState.freeze > 0) this.powerupState.freeze--;

    // BEAM POWERUP
    if(this.powerupState.beam > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        let beamW = 40 + Math.sin(this.frameCount * 0.5) * 10;
        
        // Draw Beam
        let grad = ctx.createLinearGradient(this.player.x - beamW/2, this.player.y, this.player.x + beamW/2, this.player.y);
        grad.addColorStop(0, 'rgba(0, 255, 255, 0)'); 
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)'); 
        grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = grad; 
        ctx.fillRect(this.player.x - beamW/2, 0, beamW, this.player.y); 
        ctx.restore();

        // Beam Collision (Every 4 frames)
        if(this.frameCount % 4 === 0) {
             for (let j = this.enemies.length - 1; j >= 0; j--) {
                let e = this.enemies[j];
                if(Math.abs(e.x - this.player.x) < (beamW/2 + e.w/2)) hitEnemy(e, j, 3);
             }
             if(this.boss && Math.abs(this.boss.x - this.player.x) < (beamW/2 + this.boss.w/2)) {
                 this.boss.hp -= 2; 
                 createParticles(this.boss.x, this.boss.y + this.boss.h/2, '#fff', 5, 'spark');
                 if(this.boss.hp <= 0) this.killBoss();
             }
        }
    } 
    // STANDARD SHOOTING
    else {
        if(input.active && this.frameCount - this.player.lastShot > this.player.fireRate) {
            // Dual fire
            this.spawnBullet(-15); 
            this.spawnBullet(15);
            
            // Muzzle flash
            createParticles(this.player.x - 15, this.player.y - 20, '#00ffff', 1, 'spark'); 
            createParticles(this.player.x + 15, this.player.y - 20, '#00ffff', 1, 'spark');
            
            // Spread Powerup
            if(this.powerupState.spread > 0) { 
                this.spawnBullet(0, -0.2); 
                this.spawnBullet(0, 0.2); 
                this.spawnBullet(0); 
            }
            this.player.lastShot = this.frameCount;
        }
    }
};