// js/ghost.js

// --- GHOST SHIP (ANANYA PARTNER) LOGIC ---

// 1. Audio Setup (Global Access)
Game.divineAudio = new Audio("https://nitnapple.github.io/Ananya/Savegalaxy/Divine.mp3");
Game.divineAudio.volume = 0.6; 

// 2. State Management
Game.partner = {
    x: 0,
    y: 0,
    initialized: false, 
    mode: 'active',     
    timer: 0,           
    shootTimer: 0,      
    hasDroppedHeart: false, 
    activeDuration: 300,    // 5 Seconds
    cooldownDuration: 240   // 4 Seconds
};

Game.partnerBullets = [];

// 3. Helper: Create/Get the GIF Element
function getPartnerElement() {
    let el = document.getElementById('partner-entity');
    if (!el) {
        el = document.createElement('img');
        el.id = 'partner-entity';
        el.className = 'game-entity'; 
        el.src = "https://nitnapple.github.io/Ananya/Savegalaxy/Patner.gif";
        el.style.width = "60px"; 
        el.style.height = "auto";
        el.style.zIndex = "4"; 
        el.style.display = "none";
        el.style.filter = "drop-shadow(0 0 15px #ff69b4)";
        document.body.appendChild(el);
    }
    return el;
}

Game.spawnPartner = function() {
    this.partner.initialized = true;
    this.partner.mode = 'active';
    this.partner.timer = 0;
    this.partner.shootTimer = 0;
    this.partner.hasDroppedHeart = false;
    
    this.partner.x = this.player.x;
    this.partner.y = this.player.y;
    
    Game.partnerBullets = []; 
    
    const el = getPartnerElement();
    el.style.display = 'block';
    
    floatingTexts.push({
        x: canvas.width / 2,
        y: canvas.height - 150,
        text: "Ananya Ship Arrive",
        color: "#ff69b4",
        life: 2.0,
        vy: -1
    });

    if (this.divineAudio) {
        this.divineAudio.currentTime = 0;
        this.divineAudio.play().catch(e => console.log(e));
    }
};

Game.updateGhostShip = function() {
    const el = getPartnerElement();

    if (!this.partner.initialized) {
        el.style.display = 'none';
        return;
    }

    this.partner.timer++;
    
    // Cycle Logic
    if (this.partner.mode === 'active') {
        if (this.partner.timer > this.partner.activeDuration) {
            this.partner.mode = 'cooldown';
            this.partner.timer = 0;
            this.partner.hasDroppedHeart = false; 
            el.style.display = 'none';
            createParticles(this.partner.x, this.partner.y, '#ff69b4', 15, 'smoke');
        }
    } else {
        if (this.partner.timer > this.partner.cooldownDuration) {
            this.partner.mode = 'active';
            this.partner.timer = 0;
            el.style.display = 'block';
            createParticles(this.player.x + 60, this.player.y, '#ff69b4', 20, 'spark');
            
            // Replay Music
            if (this.divineAudio) {
                this.divineAudio.currentTime = 0;
                this.divineAudio.play().catch(e => {});
            }
            
            floatingTexts.push({
                x: this.player.x + 60, y: this.player.y - 50,
                text: "Ananya Ship Arrive", color: "#ff69b4", life: 1.0, vy: -1
            });
        }
    }

    if (this.partner.mode !== 'active') return;

    // Movement
    const targetX = this.player.x + 60; 
    const targetY = this.player.y;      
    this.partner.x += (targetX - this.partner.x) * 0.2;
    this.partner.y += (targetY - this.partner.y) * 0.2;

    el.style.left = this.partner.x + 'px';
    el.style.top = this.partner.y + 'px';

    // Shooting
    this.partner.shootTimer++;
    
    // Heart
    if (!this.partner.hasDroppedHeart && this.partner.timer > 60) {
        this.partner.hasDroppedHeart = true;
        this.partnerBullets.push({
            x: this.partner.x, y: this.partner.y, w: 24, h: 24, type: 'heart'
        });
        if(AudioSys && AudioSys.playCollect) AudioSys.playCollect(false);
    }

    // Pink Bullets
    if (this.partner.shootTimer > 15) { 
        this.partner.shootTimer = 0;
        if(AudioSys && AudioSys.playShoot) AudioSys.playShoot();
        [-0.2, 0, 0.2].forEach(angle => {
            this.partnerBullets.push({
                x: this.partner.x, y: this.partner.y - 20,
                vx: Math.sin(angle) * 6, vy: -10, 
                w: 6, h: 20, // 6px width visible
                color: '#ff69b4', type: 'bullet'
            });
        });
    }

    // Bullet Logic
    for (let i = this.partnerBullets.length - 1; i >= 0; i--) {
        let b = this.partnerBullets[i];
        
        if (b.type === 'heart') {
            const dx = this.player.x - b.x; const dy = this.player.y - b.y;
            b.x += dx * 0.08; b.y += dy * 0.08; 
            ctx.font = "24px Arial"; ctx.fillText("❤️", b.x - 12, b.y + 8);

            const dist = Math.hypot(this.player.x - b.x, this.player.y - b.y);
            if (dist < 50) { 
                if (this.lives < 9) { 
                    this.lives++;
                    if (typeof updateLivesUI === 'function') updateLivesUI();
                    if(AudioSys && AudioSys.playCollect) AudioSys.playCollect(true);
                    floatingTexts.push({x: this.player.x, y: this.player.y - 40, text: "+1 LIFE", color: "#ff3366", life: 1.0, vy: -1});
                }
                this.partnerBullets.splice(i, 1);
                continue;
            }
        } else {
            b.x += b.vx; b.y += b.vy;
            
            // Draw Pink Glowing Bullet
            ctx.fillStyle = b.color; 
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff69b4';
            ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h); 
            ctx.shadowBlur = 0;

            let hit = false;
            // CHECK IF BOSS EXISTS BEFORE ACCESSING .x
            if (this.boss) {
                if (Math.abs(b.x - this.boss.x) < this.boss.w/2 && Math.abs(b.y - this.boss.y) < this.boss.h/2) {
                    this.boss.hp -= 4; 
                    createParticles(b.x, b.y, '#ff69b4', 3, 'spark');
                    hit = true; if(this.boss.hp <= 0) Game.killBoss();
                }
            }
            if (!hit) {
                for(let j = this.enemies.length - 1; j >= 0; j--) {
                    let e = this.enemies[j];
                    if(Math.abs(b.x - e.x) < e.w/2 + b.w/2 && Math.abs(b.y - e.y) < e.h/2 + b.h/2) {
                        Game.hitEnemy(e, j, 4); hit = true; break;
                    }
                }
            }
            if (hit || b.y < -50) this.partnerBullets.splice(i, 1);
        }
    }
};