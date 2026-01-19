// --- UPDATED MAIN LOOP WITH DOUBLE-TAP & HEART UI ---

let animFrameId = null;
let backgroundObjects = []; let stars = [];
let lastTapTime = 0; 

function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    if (!Game.gameRunning) { Game.player.x = canvas.width/2; Game.player.y = canvas.height - 150; }
}
window.addEventListener('resize', resize); resize();

function initBackground() {
    stars = []; for(let i=0; i<80; i++) stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+0.5, speed: Math.random()*4+1 });
    backgroundObjects = []; for(let i=0; i<4; i++) {
        backgroundObjects.push({
            x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 40 + Math.random()*100,
            speed: 0.2 + Math.random()*0.5, hue: Math.random()*360, type: Math.random() > 0.5 ? 'asteroid' : 'meteor', rotation: Math.random() * Math.PI * 2
        });
    }
}

// heart png health ui implementation
function updateLivesUI() {
    const cont = document.getElementById('lives-display'); cont.innerHTML = '';
    const heartURL = "https://nitnapple.github.io/Ananya/Savegalaxy/Heart.png";
    for(let i=0; i<Game.lives; i++) {
        const img = document.createElement('img'); img.src = heartURL;
        img.style.width = "24px"; img.style.height = "24px"; img.style.marginRight = "4px";
        img.style.filter = "drop-shadow(0 0 5px rgba(255, 51, 102, 0.5))";
        cont.appendChild(img);
    }
}

function updateComboUI() {
    const disp = document.getElementById('combo-display');
    if(Game.combo > 1) {
        disp.style.display = 'block'; disp.innerText = `x${Game.combo}`; disp.classList.add('combo-active');
        AudioSys.startBGM(1 + (Game.combo*0.1));
    } else { disp.style.display = 'none'; disp.classList.remove('combo-active'); AudioSys.startBGM(1); }
}

function updateTime() {
    if (Game.levelTransitioning || !Game.gameRunning) return;
    const effectiveTime = Date.now() - Game.gameStartTime - Game.pausedTime;
    const elapsed = Math.max(0, Math.floor(effectiveTime / 1000));
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('time-display').innerText = `${m}:${s}`;
}

// double-tap logic
function handleInputStart(x, y) {
    if(Game.isPaused) return;
    
    const now = Date.now();
    const distToPlayer = Math.hypot(x - Game.player.x, y - Game.player.y);
    if (now - lastTapTime < 300 && distToPlayer < 80) {
        if (typeof Game.executeSuperAttack === 'function') Game.executeSuperAttack();
    }
    lastTapTime = now;

    input.active = true; input.rawX = x; input.rawY = y;
    input.offsetX = Game.player.x - x; input.offsetY = Game.player.y - y;
    AudioSys.resume();
}

function handleInputMove(x, y) {
    if(!input.active || Game.isPaused) return;
    input.x = x + input.offsetX; input.y = y + input.offsetY;
}

canvas.addEventListener('mousedown', e => handleInputStart(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => handleInputMove(e.clientX, e.clientY));
canvas.addEventListener('mouseup', () => input.active = false);

canvas.addEventListener('touchstart', e => { 
    e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchmove', e => { 
    e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
canvas.addEventListener('touchend', e => { 
    e.preventDefault(); if(e.touches.length === 0) input.active = false;
});

document.getElementById('start-btn').addEventListener('click', () => window.triggerStartGame(false));
document.getElementById('pause-btn').addEventListener('click', () => {
    if(!Game.gameRunning) return;
    Game.isPaused = !Game.isPaused;
    if(Game.isPaused) { Game.pauseStart = Date.now(); document.getElementById('pause-screen').style.display = 'flex'; } 
    else { Game.pausedTime += (Date.now() - Game.pauseStart); document.getElementById('pause-screen').style.display = 'none'; animFrameId = requestAnimationFrame(loop); }
    input.active = false;
});

function loop() {
    if(!Game.gameRunning || Game.isPaused) return;
    ctx.save(); ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (Game.screenShake > 0) {
        const dx = (Math.random() - 0.5) * Game.screenShake; const dy = (Math.random() - 0.5) * Game.screenShake;
        ctx.translate(dx, dy); Game.screenShake *= 0.9; if(Game.screenShake < 0.5) Game.screenShake = 0;
    }
    Game.frameCount++; if(Game.frameCount % 30 === 0) updateTime();
    if(Game.superAttackCooldown > 0) Game.superAttackCooldown--;

    backgroundObjects.forEach(p => {
        p.y += p.speed * (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
        if(p.y > canvas.height + 100) { p.y = -100; p.x = Math.random()*canvas.width; }
        let img = p.type === 'meteor' ? meteorImg : asteroidImg;
        if (img.complete && img.naturalWidth !== 0) { ctx.globalAlpha = 0.3; ctx.drawImage(img, p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; }
    });
    ctx.fillStyle = 'white'; stars.forEach(s => {
        s.y += s.speed * (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
        if(s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; }
        ctx.globalAlpha = Math.random() * 0.5 + 0.2; ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    if (typeof Game.updatePlayer === 'function') Game.updatePlayer();
    if (typeof Game.handlePlayerShooting === 'function') Game.handlePlayerShooting();
    if(!Game.levelTransitioning && !Game.boss && Game.frameCount % 35 === 0) Game.spawnEnemy();

    ctx.globalCompositeOperation = 'lighter';
    for(let i = Game.bullets.length-1; i>=0; i--) {
        let b = Game.bullets[i]; b.x += (b.vx || 0) * Game.timeScale; b.y += b.vy * Game.timeScale;
        ctx.fillStyle = b.color; ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
        if(b.y < -50) { Game.bullets.splice(i,1); continue; }
        for(let j=Game.enemies.length-1; j>=0; j--) {
            let e = Game.enemies[j]; if(Math.abs(b.x - e.x) < e.w/2 + b.w/2 && Math.abs(b.y - e.y) < e.h/2 + b.h/2) {
                Game.bullets.splice(i,1); Game.hitEnemy(e, j, 1); break;
            }
        }
        if(Game.boss && Math.abs(b.x - Game.boss.x) < Game.boss.w/2 && Math.abs(b.y - Game.boss.y) < Game.boss.h/2) {
            Game.bullets.splice(i,1); Game.boss.hp--; if(Game.boss.hp <= 0) Game.killBoss();
        }
    }

    const moveMult = (Game.powerupState.freeze > 0 ? 0.2 : 1) * Game.timeScale;
    ctx.globalCompositeOperation = 'source-over';
    for(let i=Game.enemies.length-1; i>=0; i--) {
        let e = Game.enemies[i];
        if (e.pathType === 'sin') { e.x = e.originX + Math.sin(e.y * 0.02) * 80; } 
        else if (e.pathType === 'cos') { e.x = e.originX + Math.cos(e.y * 0.02) * 80; } 
        else { e.x += (e.vx || 0) * moveMult; }

        e.y += e.vy * moveMult; e.rot += e.rotSpeed * moveMult;
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot);
        if (e.isMinion) {
            let mImg = new Image(); mImg.src = e.imgSrc; if(mImg.complete) ctx.drawImage(mImg, -e.w/2, -e.h/2, e.w, e.h);
        } else if (e.isBossBullet) {
             ctx.fillStyle = '#ff3366'; ctx.beginPath(); ctx.arc(0,0, e.w/2, 0, Math.PI*2); ctx.fill();
        } else {
            let img = (e.imgType === 'meteor' && meteorImg.complete) ? meteorImg : asteroidImg;
            if (img.complete) ctx.drawImage(img, -e.w/2, -e.h/2, e.w, e.h);
            ctx.rotate(-e.rot); ctx.fillStyle = e.letter && Game.currentTarget.indexOf(e.letter) > -1 ? '#00ff00' : '#fff';
            ctx.font = `bold ${24 + (e.scale-1)*10}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.letter, 0, 0);
        }
        ctx.restore();
        
        if(Game.player.invulnerable === 0 && Math.hypot(Game.player.x - e.x, Game.player.y - e.y) < (Game.player.w/2 + e.w/2)) {
            if(Game.powerupState.shield > 0) { Game.powerupState.shield = 0; Game.player.invulnerable = 60; Game.enemies.splice(i,1); } 
            else { Game.takeDamage(); Game.enemies.splice(i,1); }
        }
        if(e.y > canvas.height + 100) Game.enemies.splice(i,1);
    }

    if(Game.boss) { Game.updateBoss(moveMult); Game.drawBossHealth(); Game.checkBossCollisions(); }

    for (let i = Game.powerups.length - 1; i >= 0; i--) {
        let p = Game.powerups[i]; p.y += p.vy * Game.timeScale;
        ctx.save(); ctx.translate(p.x, p.y); if (p.type === 'heart') {
            if(heartImg.complete) ctx.drawImage(heartImg, -20, -20, 40, 40);
        } else {
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText("⚡", 0, 2);
        }
        ctx.restore();
        if(Math.hypot(Game.player.x - p.x, Game.player.y - p.y) < (Game.player.w/2 + 15)) {
            if(p.type === 'heart') { Game.lives = Math.min(Game.lives + 1, 9); updateLivesUI(); AudioSys.playCollect(true); } 
            else { Game.activatePowerup(p.type); }
            Game.powerups.splice(i, 1);
        }
    }
    
    ctx.globalCompositeOperation = 'lighter';
    for(let i=floatingTexts.length-1; i>=0; i--) {
        let ft = floatingTexts[i]; ft.y += ft.vy * Game.timeScale; ft.life -= 0.02;
        if(ft.life <= 0) { floatingTexts.splice(i,1); continue; }
        ctx.globalAlpha = ft.life; ctx.font = 'bold 30px Arial'; ctx.fillStyle = ft.color || '#00ffcc'; ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1; animFrameId = requestAnimationFrame(loop); ctx.restore();
}
