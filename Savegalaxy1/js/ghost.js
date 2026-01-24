// --- GHOST SHIP (ANANYA PARTNER) LOGIC ---

// Initialize Partner State
Game.partner = {
    x: 0,
    y: 0,
    active: false,
    history: [], // Stores player coordinates for delayed mirroring
    lastShot: 0,
    fireRate: 90 // Fires a healing heart every 1.5 seconds
};

Game.partnerBullets = [];

/**
 * Activates the partner ship (called when a boss appears)
 */
Game.spawnPartner = function() {
    this.partner.active = true;
    this.partner.history = []; // Clear old path
    floatingTexts.push({
        x: canvas.width / 2,
        y: canvas.height - 100,
        text: "ANANYA JOINED!",
        color: "#ff80ab",
        life: 2.0,
        vy: -1
    });
};

/**
 * Logic to update movement and render the ghost ship and healing bullets
 */
Game.updateGhostShip = function() {
    if (!this.partner.active) return;

    // 1. MIRRORING LOGIC (Delayed Follow)
    // Record current player position
    this.partner.history.push({ x: this.player.x, y: this.player.y });

    // Stay 15 frames behind the player
    if (this.partner.history.length > 15) {
        const delayedPos = this.partner.history.shift();
        this.partner.x = delayedPos.x - 60; // Offset to the left
        this.partner.y = delayedPos.y + 20; // Slightly lower
    }

    // 2. RENDERING GHOST SHIP
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(this.frameCount * 0.1) * 0.2; // Pulsing effect
    ctx.filter = 'drop-shadow(0 0 10px #ff80ab)';
    if (this.playerImgEl.complete) {
        ctx.drawImage(this.playerImgEl, this.partner.x - 25, this.partner.y - 25, 50, 50);
    }
    ctx.restore();

    // 3. SHOOTING HEALING BULLETS
    if (this.frameCount % this.partner.fireRate === 0) {
        this.partnerBullets.push({
            x: this.partner.x,
            y: this.partner.y,
            vy: -5,
            w: 15, h: 15
        });
    }

    // 4. UPDATE & DRAW HEALING BULLETS
    for (let i = this.partnerBullets.length - 1; i >= 0; i--) {
        let hb = this.partnerBullets[i];
        hb.y += hb.vy;

        // Draw Heart
        ctx.font = "20px Arial";
        ctx.fillText("❤️", hb.x - 10, hb.y);

        // Collision with Player (Healing)
        const dist = Math.hypot(this.player.x - hb.x, this.player.y - hb.y);
        if (dist < 40) {
            if (this.lives < 9) {
                this.lives++;
                if (typeof updateLivesUI === 'function') updateLivesUI();
                AudioSys.playCollect(true);
                floatingTexts.push({
                    x: this.player.x,
                    y: this.player.y - 40,
                    text: "+1 LIFE",
                    color: "#ff3366",
                    life: 1.0,
                    vy: -1
                });
            }
            this.partnerBullets.splice(i, 1);
            continue;
        }

        // Remove if off-screen
        if (hb.y < -20) this.partnerBullets.splice(i, 1);
    }
};