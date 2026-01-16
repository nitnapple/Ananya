const AUDIO_URLS = { 
    entry: "https://raw.githubusercontent.com/nitnapple/src/main/entry1.mp3", 
    laugh1: "https://raw.githubusercontent.com/nitnapple/src/main/laugh1.mp3", 
    laugh2: "https://raw.githubusercontent.com/nitnapple/src/main/laugh-2.mp3", 
    scream1: "https://raw.githubusercontent.com/nitnapple/src/main/screaming-1.mp3", 
    scream2: "https://raw.githubusercontent.com/nitnapple/src/main/screaming-2.mp3" 
};

const AudioSys = {
    ctx: null, 
    masterGain: null, 
    bgmOscillators: [], 
    audioBuffers: {}, 
    isMuted: false, 
    beatInterval: null, 
    baseTempo: 500,

    init: function() {
        // Create context if it doesn't exist
        if (!this.ctx) { 
            const AudioContext = window.AudioContext || window.webkitAudioContext; 
            if (AudioContext) { 
                this.ctx = new AudioContext(); 
                this.masterGain = this.ctx.createGain(); 
                this.masterGain.gain.value = 0.5; 
                this.masterGain.connect(this.ctx.destination); 
            } 
        }
        // Always try to resume
        this.resume();
        this.preloadAllSounds(); 
    },

    resume: function() { 
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                console.log("AudioContext Resumed Successfully");
            }).catch(e => console.log("Audio Resume Failed:", e));
        } 
    },

    preloadAllSounds: function() { 
        // Only load if we haven't already
        if (Object.keys(this.audioBuffers).length > 0) return;

        for (const [key, url] of Object.entries(AUDIO_URLS)) { 
            fetch(url)
                .then(r => {
                    if (!r.ok) throw new Error("HTTP error " + r.status);
                    return r.arrayBuffer();
                })
                .then(b => this.ctx.decodeAudioData(b))
                .then(a => { this.audioBuffers[key] = a; })
                .catch(e => console.warn(`Failed to load sound: ${key} from ${url}`, e)); 
        } 
    },

    toggleMute: function() { 
        this.isMuted = !this.isMuted; 
        if(this.masterGain && this.ctx) { 
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime); 
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime, 0.1); 
        } 
        return this.isMuted; 
    },

    speak: function(text) { 
        if (this.isMuted || !window.speechSynthesis) return; 
        // Cancel previous speech to prevent lag
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); 
        u.rate = 1.1; u.pitch = 1.0; u.volume = 1.0; 
        window.speechSynthesis.speak(u); 
    },

    playBuffer: function(key) { 
        if (this.isMuted || !this.ctx || !this.audioBuffers[key]) return; 
        try { 
            const s = this.ctx.createBufferSource(); 
            s.buffer = this.audioBuffers[key]; 
            s.connect(this.masterGain); 
            s.start(0); 
        } catch(e) { console.warn("Audio Buffer Error", e); } 
    },

    // Specific Play Functions
    playBossEntry: function() { this.playBuffer('entry'); }, 
    playBossLaugh: function(f) { this.playBuffer(f ? 'laugh2' : 'laugh1'); }, 
    playBossScream: function(f) { this.playBuffer(f ? 'scream2' : 'scream1'); },

    // Synthesized Sounds (Work even if files fail)
    playShoot: function() { 
        if (!this.ctx || this.isMuted) return; 
        const o = this.ctx.createOscillator(); 
        const g = this.ctx.createGain(); 
        o.type = 'triangle'; 
        o.frequency.setValueAtTime(800, this.ctx.currentTime); 
        o.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1); 
        g.gain.setValueAtTime(0.15, this.ctx.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1); 
        o.connect(g); g.connect(this.masterGain); 
        o.start(); o.stop(this.ctx.currentTime + 0.1); 
    },

    playCollect: function(good = true) { 
        if (!this.ctx || this.isMuted) return; 
        const o = this.ctx.createOscillator(); 
        const g = this.ctx.createGain(); 
        o.type = good ? 'sine' : 'sawtooth'; 
        o.frequency.setValueAtTime(good ? 600 : 200, this.ctx.currentTime); 
        o.frequency.linearRampToValueAtTime(good ? 1200 : 50, this.ctx.currentTime + 0.1); 
        g.gain.setValueAtTime(0.3, this.ctx.currentTime); 
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2); 
        o.connect(g); g.connect(this.masterGain); 
        o.start(); o.stop(this.ctx.currentTime + 0.2); 
    },

    playPowerupCollect: function() { 
        if (!this.ctx || this.isMuted) return; 
        const o = this.ctx.createOscillator(); 
        const g = this.ctx.createGain(); 
        o.type = 'square'; 
        o.frequency.setValueAtTime(300, this.ctx.currentTime); 
        o.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.3); 
        g.gain.setValueAtTime(0.15, this.ctx.currentTime); 
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3); 
        o.connect(g); g.connect(this.masterGain); 
        o.start(); o.stop(this.ctx.currentTime + 0.3); 
    },

    playExplosion: function() { 
        if (!this.ctx || this.isMuted) return; 
        const o = this.ctx.createOscillator(); 
        const g = this.ctx.createGain(); 
        o.type = 'sawtooth'; 
        o.frequency.setValueAtTime(100, this.ctx.currentTime); 
        o.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3); 
        g.gain.setValueAtTime(0.4, this.ctx.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3); 
        o.connect(g); g.connect(this.masterGain); 
        o.start(); o.stop(this.ctx.currentTime + 0.3); 
    },

    startBGM: function(tm = 1) { 
        if (!this.ctx) return; 
        // Ensure resumed
        this.resume();
        this.stopBGM(); 
        
        // Drone layer
        const o = this.ctx.createOscillator(); 
        o.type = 'sawtooth'; 
        o.frequency.value = 55; 
        const g = this.ctx.createGain(); 
        g.gain.value = 0.1; 
        const f = this.ctx.createBiquadFilter(); 
        f.type = 'lowpass'; 
        f.frequency.value = 400; 
        o.connect(f); f.connect(this.masterGain); 
        o.start(); 
        this.bgmOscillators.push(o); 
        
        // Beat layer
        const interval = this.baseTempo / tm; 
        this.beatInterval = setInterval(() => { 
            if(this.isMuted || !this.ctx || window.isPaused) return; 
            const k = this.ctx.createOscillator(); 
            const kg = this.ctx.createGain(); 
            k.frequency.setValueAtTime(150, this.ctx.currentTime); 
            k.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2); 
            kg.gain.setValueAtTime(0.3, this.ctx.currentTime); 
            kg.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2); 
            k.connect(kg); kg.connect(this.masterGain); 
            k.start(); k.stop(this.ctx.currentTime + 0.2); 
        }, interval); 
    },

    stopBGM: function() { 
        this.bgmOscillators.forEach(o => { try{ o.stop(); } catch(e){} }); 
        this.bgmOscillators = []; 
        if (this.beatInterval) clearInterval(this.beatInterval); 
    }
};