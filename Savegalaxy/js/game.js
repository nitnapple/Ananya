// --- UPDATED GAME LOGIC WITH MASSIVE IMPACT SUPERPOWER ---

const Game = {
    bullets: [], enemies: [], powerups: [], boss: null,
    player: { x: 0, y: 0, w: 50, h: 50, lastShot: 0, fireRate: 8, invulnerable: 0 },
    gameRunning: false, isPaused: false, frameCount: 0, lives: 5,
    superAttackCooldown: 0,

    // *** MASSIVE IMPACT SUPERPOWER ***
    executeSuperAttack: function() {
        if (this.superAttackCooldown > 0 || !this.gameRunning) return;

        this.superAttackCooldown = 400; // ~6.5 second cooldown
        this.screenShake = 45; // Massive shake effect
        AudioSys.speak("Massive Impact!");
        AudioSys.playExplosion();

        // Visual Pulse at player location
        createParticles(this.player.x, this.player.y, '#fff', 40, 'smoke');
        createParticles(this.player.x, this.player.y, '#00ffff', 35, 'spark');

        // Massive Damage to All Enemies on screen
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            this.hitEnemy(e, i, 50); // Deals high damage to clear mobs
        }

        // Double Damage to Boss
        if (this.boss) {
            const massiveDamage = 600; // Significant boss health reduction
            this.boss.hp -= massiveDamage; 
            createParticles(this.boss.x, this.boss.y, '#ff0033', 25, 'spark');
            floatingTexts.push({x: this.boss.x, y: this.boss.y, text: "-DOUBLE IMPACT", color: 'red', life: 1.5, vy: -1});
            if (this.boss.hp <= 0) this.killBoss();
        }
        floatingTexts.push({x: this.player.x, y: this.player.y - 60, text: "SUPERPOWER!", color: 'gold', life: 2.0, vy: -1.5});
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
        let scale = Math.random() < 0.1 ? 3 : (Math.random() < 0.25 ? 2 : 1);
        const size = (30 + Math.random() * 20) * scale;
        const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        this.enemies.push({
            x: Math.random() * (canvas.width - size*2) + size, y: -50 - size, w: size, h: size, letter: char, 
            hp: (Math.floor(Math.random() * 3) + 3) * scale * 1.5,
            vy: (Math.random() * 2 + 1.5 + (this.currentLevelIndex * 0.2)) / scale,
            rot: Math.random() * Math.PI, rotSpeed: (Math.random()-0.5) * 0.05, scale: scale
        });
    },

    hitEnemy: function(e, index, damage) {
        e.hp -= damage;
        if (e.hp <= 0) {
            AudioSys.playExplosion(); createParticles(e.x, e.y, '#ffaa00', 8, 'smoke');
            this.enemies.splice(index, 1); this.score += 10 * this.combo;
        }
    },

    activatePowerup: function(type) {
        AudioSys.playPowerupCollect();
        if(type === 'shield') this.powerupState.shield = 300;
        if(type === 'beam') this.powerupState.beam = 300;
    },

    takeDamage: function() {
        this.lives--; updateLivesUI(); this.combo = 1;
        this.player.invulnerable = 100; this.screenShake = 20;
        if(this.lives <= 0) this.gameOver(false);
    }
};
