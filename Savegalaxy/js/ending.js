// js/ending.js

const Ending = {
    canvas: null,
    ctx: null,
    active: false,
    fireworks: [],
    particles: [],
    hue: 120,
    animationId: null,
    
    // Audio Context & Buffers
    audioCtx: null,
    noiseBuffer: null,
    isMuted: false,

    init: function() {
        // Create Canvas dynamically
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'fireworks-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Z-Index 5 places it ABOVE the game (0) but BEHIND the UI (10+)
        // This ensures the "Play Again" button is clickable.
        this.canvas.style.zIndex = '5'; 
        
        this.canvas.style.pointerEvents = 'auto'; // Allows clicking to spawn fireworks
        this.canvas.style.background = 'transparent'; 
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Input Listener for Manual Fireworks
        this.canvas.addEventListener('mousedown', (e) => {
            this.createFirework(e.clientX, e.clientY);
            this.resumeAudio();
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.createFirework(e.touches[0].clientX, e.touches[0].clientY);
            this.resumeAudio();
        });

        window.addEventListener('resize', () => this.resize());
        this.resize();
    },

    resize: function() {
        if(!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    start: function() {
        if (!this.canvas) this.init();
        this.active = true;
        this.canvas.style.display = 'block';
        this.fireworks = [];
        this.particles = [];
        this.initAudio();
        this.loop();
    },

    stop: function() {
        this.active = false;
        if (this.canvas) this.canvas.style.display = 'none';
        if (this.animationId) cancelAnimationFrame(this.animationId);
    },

    // --- AUDIO SYSTEM (Web Audio API) ---
    initAudio: function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioCtx && AudioContext) {
            this.audioCtx = new AudioContext();
            // Create Noise Buffer (1 second of white noise)
            const bufferSize = this.audioCtx.sampleRate;
            this.noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        }
    },

    resumeAudio: function() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    playLaunchSound: function() {
        if (!this.audioCtx || this.isMuted) return;
        this.resumeAudio();

        const t = this.audioCtx.currentTime;
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        // Bandpass Filter for "Whoosh"
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(800, t + 0.3);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        source.start(t);
        source.stop(t + 0.5);
    },

    playExplosionSound: function() {
        if (!this.audioCtx || this.isMuted) return;
        this.resumeAudio();

        const t = this.audioCtx.currentTime;
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        // Lowpass Filter for "Boom"
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        source.start(t);
        source.stop(t + 0.8);
    },

    // --- PHYSICS LOOP ---
    loop: function() {
        if (!this.active) return;
        
        // 1. Trail Effect (Semi-transparent black)
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Fades out trails
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. Lighter blending for glow
        this.ctx.globalCompositeOperation = 'lighter';

        // 3. Logic
        this.hue += 0.5;
        this.updateFireworks();
        this.updateParticles();

        // 4. Auto-Fire (Randomly)
        if (Math.random() < 0.05) { // 5% chance per frame
            const targetX = Math.random() * this.canvas.width;
            const targetY = Math.random() * (this.canvas.height / 2); // Top half
            this.createFirework(targetX, targetY);
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    createFirework: function(tx, ty) {
        const sx = this.canvas.width / 2;
        const sy = this.canvas.height;
        this.fireworks.push(new Firework(sx, sy, tx, ty, this.hue));
        this.playLaunchSound();
    },

    createParticles: function(x, y, hue) {
        for (let i = 0; i < 40; i++) {
            this.particles.push(new Particle(x, y, hue));
        }
        this.playExplosionSound();
    },

    updateFireworks: function() {
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            let f = this.fireworks[i];
            f.update();
            f.draw(this.ctx);
            
            if (f.distanceTraveled >= f.distanceToTarget) {
                this.createParticles(f.tx, f.ty, f.hue);
                this.fireworks.splice(i, 1);
            }
        }
    },

    updateParticles: function() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.update();
            p.draw(this.ctx);
            if (p.alpha <= 0.05) {
                this.particles.splice(i, 1);
            }
        }
    }
};

// --- CLASSES ---

class Firework {
    constructor(sx, sy, tx, ty, hue) {
        this.x = sx; this.y = sy;
        this.sx = sx; this.sy = sy;
        this.tx = tx; this.ty = ty;
        this.hue = hue;
        this.distanceToTarget = Math.hypot(sx - tx, sy - ty);
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;
        
        // Angle to target
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = Math.random() * 20 + 50;

        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
    }

    update() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        
        this.speed *= this.acceleration;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        
        this.distanceTraveled = Math.hypot(this.sx - (this.x + vx), this.sy - (this.y + vy));
        this.x += vx;
        this.y += vy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, hue) {
        this.x = x; this.y = y;
        this.coordinates = [];
        this.coordinateCount = 5;
        while(this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 10 + 1;
        this.friction = 0.95;
        this.gravity = 1;
        this.hue = Math.random() * 20 + hue - 10;
        this.brightness = Math.random() * 20 + 50;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }

    update() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}