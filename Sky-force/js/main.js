// --- CLEAN MAIN LOOP ---

// Note: input is now defined in utils.js
let animFrameId = null;
let backgroundObjects = [];
let stars = [];

// --- Init & Helper Functions ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!Game.gameRunning) {
        Game.player.x = canvas.width/2; Game.player.y = canvas.height - 150;
        input.x = canvas.width/2; input.y = canvas.height - 150;
    }
}
window.addEventListener('resize', resize);
resize();

function initBackground() {
    stars = [];
    for(let i=0; i<80; i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+0.5, speed: Math.random()*4+1 });
    backgroundObjects = [];
    for(let i=0; i<4; i++) {
        backgroundObjects.push({
            x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 40 + Math.random()*100,
            speed: 0.2 + Math.random()*0.5, hue: Math.random()*360,
            type: Math.random() > 0.5 ? 'asteroid' : 'meteor',
            rotation: Math.random() * Math.PI * 2
        });
    }
}

function updateLivesUI() {
    const cont = document.getElementById('lives-display');
    cont.innerHTML = '';
    for(let i=0; i<5; i++) {
        const pip = document.createElement('div');
        pip.className = i < Game.lives ? 'life-pip' : 'life-pip lost';
        cont.appendChild(pip);
    }
}

function updateComboUI() {
    const disp = document.getElementById('combo-display');
    if(Game.combo > 1) {
        disp.style.display = 'block'; disp.innerText = `x${Game.combo}`; disp.classList.add('combo-active');
        AudioSys.startBGM(1 + (Game.combo*0.1));
    } else {
        disp.style.display = 'none'; disp.classList.remove('combo-active');
        AudioSys.startBGM(1);
    }
}

function updateTime() {
    if (Game.levelTransitioning || !Game.gameRunning) return;
    const effectiveTime = Date.now() - Game.gameStartTime - Game.pausedTime;
    const elapsed = Math.max(0, Math.floor(effectiveTime / 1000));
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('time-display').innerText = `${m}:${s}`;
}

// --- Hit Detection (Global for Player & Beam) ---
window.hitEnemy = function(e, index, damage) {
    e.hp -= damage; e.y -= 2; createParticles(e.x, e.y, '#fff', 2, 'spark');
    if (e.hp <= 0) {
        if(e.isTrap) {
            Game.score = Math.max(0, Game.score - 200); Game.combo = 1; updateComboUI();
            Game.screenShake = 10; vibrate(50);
            createParticles(e.x, e.y, 'red', 10, 'smoke');
            floatingTexts.push({x: e.x, y: e.y, text: "TRAP!", color: 'red', life: 1.0, vy: -1});
            Game.enemies.splice(index, 1); document.getElementById('score-display').innerText = `PTS: ${Game.score}`;
            return;
        }
        AudioSys.playExplosion();
        createParticles(e.x, e.y, '#ffaa00', 8, 'smoke'); createParticles(e.x, e.y, '#ffcc00', 8, 'spark');
        if(e.isMinion) { Game.enemies.splice(index, 1); return; }
        
        let collected = false;
        for(let k=0; k<Game.currentTarget.length; k++) {
            if(Game.currentTarget[k] === e.letter && !Game.foundLetters[k]) {
                Game.foundLetters[k] = true; collected = true;
                const slot = document.getElementById(`word-slot-${k}`);
                if(slot) { slot.innerText = e.letter; slot.classList.add('filled'); }
                Game.score += 100 * Game.combo;
                floatingTexts.push({x: e.x, y: e.y, text: e.letter, isLetter:true, life: 1.0, vy: -2});
                AudioSys.playCollect(true);
                Game.combo++; updateComboUI(); break;
            }
        }
        if(!collected) Game.score += 10 * Game.combo;
        document.getElementById('score-display').innerText = `PTS: ${Game.score}`;
        
        if(Math.random() < 0.08) Game.spawnPowerup(e.x, e.y);
        Game.enemies.splice(index, 1);
        
        if(Game.foundLetters.every(x=>x) && !Game.winTimeout && !Game.levelTransitioning && !Game.boss) {
            Game.winTimeout = setTimeout(() => Game.nextLevel(), 1000);
        }
    }
};

// --- Input Listeners ---
function handleInputStart(x, y) {
    if(Game.isPaused) return;
    input.active = true;
    input.rawX = x; input.rawY = y;
    input.offsetX = Game.player.x - x;
    input.offsetY = Game.player.y - y;
    input.x = Game.player.x; input.y = Game.player.y;
    AudioSys.resume();
}
function handleInputMove(x, y) {
    if(!input.active || Game.isPaused) return;
    input.rawX = x; input.rawY = y;
    input.x = x + input.offsetX;
    input.y = y + input.offsetY;
}
canvas.addEventListener('mousedown', e => handleInputStart(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => handleInputMove(e.clientX, e.clientY));
canvas.addEventListener('mouseup', () => input.active = false);
canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); if(e.touches.length === 0) input.active = false; });

document.getElementById('start-btn').addEventListener('click', () => window.triggerStartGame(false));
document.getElementById('pause-btn').addEventListener('click', () => {
    if(!Game.gameRunning) return;
    Game.isPaused = !Game.isPaused;
    if(Game.isPaused) {
        Game.pauseStart = Date.now();
        document.getElementById('pause-screen').style.display = 'flex';
    } else {
        Game.pausedTime += (Date.now() - Game.pauseStart);
        document.getElementById('pause-screen').style.display = 'none';
        animFrameId = requestAnimationFrame(loop);
    }
    input.active = false;
});
document.getElementById('resume-btn').onclick = () => document.getElementById('pause-btn').click();
document.getElementById('vol-btn').addEventListener('click', () => {
    const isMuted = AudioSys.toggleMute();
    document.getElementById('vol-btn').innerText = isMuted ? '🔇' : '🔊';
});

// --- MAIN LOOP ---
function loop() {
    if(!Game.gameRunning || Game.isPaused) return;

    ctx.save(); 
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (Game.screenShake > 0) {
        const dx = (Math.random() - 0.5) * Game.screenShake;
        const dy = (Math.random() - 0.5) * Game.screenShake;
        ctx.translate(dx, dy);
        Game.screenShake *= 0.9;
        if(Game.screenShake < 0.5) Game.screenShake = 0;
    }
    Game.frameCount++;
    if(Game.frameCount % 30 === 0) updateTime();

    // 1. Draw Background
    ctx.filter = 'blur(4px)'; 
    backgroundObjects.forEach(p => {
        p.y += p.speed * (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
        if(p.y > canvas.height + 100) { p.y = -100; p.x = Math.random()*canvas.width; }
        let img = p.type === 'meteor' ? meteorImg : asteroidImg;
        if (img.complete && img.naturalWidth !== 0) {
            ctx.globalAlpha = 0.3; ctx.drawImage(img, p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
        }
    });
    ctx.filter = 'none'; 
    ctx.fillStyle = 'white';
    stars.forEach(s => {
        s.y += s.speed * (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
        if(Game.levelTransitioning) s.y += 10; 
        if(s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; }
        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    if(Game.levelTransitioning && Game.frameCount % 2 === 0) createParticles(0,0, '#fff', 2, 'warp');
    ctx.globalAlpha = 1;

    // 2. Update Player (Movement, Visuals, Shield)
    Game.updatePlayer();

    // 3. Handle Shooting & Powerups
    Game.handlePlayerShooting();

    // 4. Enemy Spawning
    if(!Game.levelTransitioning && !Game.boss && Game.frameCount % 35 === 0) Game.spawnEnemy();

    // 5. Bullets
    ctx.globalCompositeOperation = 'lighter'; 
    if(Game.powerupState.beam <= 0) { 
        for(let i = Game.bullets.length-1; i>=0; i--) {
            let b = Game.bullets[i];
            b.x += (b.vx || 0) * Game.timeScale; b.y += b.vy * Game.timeScale;
            ctx.fillStyle = b.color; ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h); 
            if(b.y < -50) { Game.bullets.splice(i,1); continue; }
            for(let j=Game.enemies.length-1; j>=0; j--) {
                let e = Game.enemies[j];
                if(Math.abs(b.x - e.x) < e.w/2 + b.w/2 && Math.abs(b.y - e.y) < e.h/2 + b.h/2) {
                    Game.bullets.splice(i,1); hitEnemy(e, j, 1); break;
                }
            }
            if(Game.boss && Math.abs(b.x - Game.boss.x) < Game.boss.w/2 && Math.abs(b.y - Game.boss.y) < Game.boss.h/2) {
                Game.bullets.splice(i,1); Game.boss.hp--;
                createParticles(b.x, b.y, '#fff', 3, 'spark');
                if(Game.boss.hp <= 0) Game.killBoss();
            }
        }
    }

    // 6. Enemies
    const moveMult = (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
    ctx.globalCompositeOperation = 'source-over';
    for(let i=Game.enemies.length-1; i>=0; i--) {
        let e = Game.enemies[i];
        e.y += e.vy * moveMult; e.x += (e.vx || 0) * moveMult; e.rot += e.rotSpeed * moveMult;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot);
        if (e.isMinion) {
            let mImg = new Image(); mImg.src = e.imgSrc;
            if(mImg.complete) ctx.drawImage(mImg, -e.w/2, -e.h/2, e.w, e.h);
            else { ctx.fillStyle = 'red'; ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h); }
        } else if (e.isBossBullet) {
             ctx.fillStyle = '#ff3366'; ctx.shadowBlur = 10; ctx.shadowColor = 'red';
             ctx.beginPath(); ctx.arc(0,0, e.w/2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        } else {
            let img = (e.imgType === 'meteor' && meteorImg.complete) ? meteorImg : asteroidImg;
            if (img.complete && img.naturalWidth !== 0) { ctx.drawImage(img, -e.w/2, -e.h/2, e.w, e.h); } 
            else { ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(0,0, e.w/2, 0, Math.PI*2); ctx.fill(); }
            ctx.rotate(-e.rot); 
            ctx.fillStyle = e.isTrap ? '#ff0000' : (e.letter && Game.currentTarget.indexOf(e.letter) > -1 && !Game.foundLetters[Game.currentTarget.indexOf(e.letter)] ? '#00ff00' : '#fff');
            ctx.font = `bold ${24 + (e.scale-1)*10}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText(e.letter, 0, 0); ctx.fillText(e.letter, 0, 0);
        }
        ctx.restore();
        if(Game.player.invulnerable === 0) {
            const dx = Game.player.x - e.x; const dy = Game.player.y - e.y;
            if(Math.sqrt(dx*dx + dy*dy) < (Game.player.w/2 + e.w/2)) {
                if(Game.powerupState.shield) {
                    Game.powerupState.shield = false; Game.player.invulnerable = 60;
                    createParticles(Game.player.x, Game.player.y, '#00ffff', 10, 'spark');
                    Game.activatePowerup('shield'); Game.enemies.splice(i,1);
                } else { Game.takeDamage(); Game.enemies.splice(i,1); }
            }
        }
        if(e.y > canvas.height + 100 || e.x < -50 || e.x > canvas.width + 50) Game.enemies.splice(i,1);
    }

    // 7. Boss
    if(Game.boss) {
        Game.updateBoss(moveMult);
        Game.drawBossHealth();
        Game.checkBossCollisions();
    }

    // 8. Powerups & Floating Text
    for (let i = Game.powerups.length - 1; i >= 0; i--) {
        let p = Game.powerups[i];
        if(Game.powerupState.magnet > 0 && p.type !== 'heart') { p.x += (Game.player.x - p.x) * 0.1; p.y += (Game.player.y - p.y) * 0.1; } 
        else { p.y += p.vy * Game.timeScale; }
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.type === 'heart') {
            ctx.fillStyle = '#ff3366'; ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(0, 5, -10, -5, -5, -10); ctx.bezierCurveTo(0, -13, 0, -8, 0, -5); ctx.bezierCurveTo(0, -8, 0, -13, 5, -10); ctx.bezierCurveTo(10, -5, 0, 5, 0, 5); ctx.fill();
        } else {
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            let icon = "⚡"; if(p.type === 'shield') icon = "🛡️"; if(p.type === 'spread') icon = "🚀"; if(p.type === 'magnet') icon = "🧲"; if(p.type === 'freeze') icon = "❄️";
            ctx.fillText(icon, 0, 2);
        }
        ctx.restore();
        if(Math.sqrt((Game.player.x - p.x)**2 + (Game.player.y - p.y)**2) < (Game.player.w/2 + 15)) {
            if(p.type === 'heart') { Game.lives = Math.min(Game.lives + 1, 9); updateLivesUI(); AudioSys.playCollect(true); floatingTexts.push({x: Game.player.x, y: Game.player.y - 40, text: "❤️", life: 1.5, vy: -1, color: '#ff3366'}); } 
            else { Game.activatePowerup(p.type); }
            Game.powerups.splice(i, 1); continue;
        }
        if(p.y > canvas.height + 50) Game.powerups.splice(i, 1);
    }
    
    ctx.globalCompositeOperation = 'lighter';
    for(let i=floatingTexts.length-1; i>=0; i--) {
        let ft = floatingTexts[i];
        if(Game.powerupState.magnet > 0 && ft.isLetter) { ft.x += (Game.player.x - ft.x) * 0.1; ft.y += (Game.player.y - ft.y) * 0.1; if(Math.abs(ft.x - Game.player.x) < 20 && Math.abs(ft.y - Game.player.y) < 20) { floatingTexts.splice(i,1); continue; } } 
        else { ft.y += ft.vy * Game.timeScale; }
        ft.life -= 0.02; if(ft.life <= 0) { floatingTexts.splice(i,1); continue; }
        ctx.globalAlpha = ft.life; ctx.font = 'bold 30px Arial'; ctx.fillStyle = ft.color || '#00ffcc'; ctx.fillText(ft.text, ft.x, ft.y);
    }
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx * Game.timeScale; p.y += p.vy * Game.timeScale; p.life -= (p.decay || 0.04);
        if(p.life <= 0) { particles.splice(i,1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    animFrameId = requestAnimationFrame(loop);
    ctx.restore(); 
}