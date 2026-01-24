// js/menu.js

const Menu = {
    active: false,
    stars: [],
    mouseX: 0,
    mouseY: 0,
    
    init: function() {
        // Initialize 300 stars for the warp effect
        this.stars = [];
        for(let i=0; i<300; i++) {
            this.stars.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                z: Math.random() * canvas.width
            });
        }
        
        // Mouse listener for Parallax Effect
        window.addEventListener('mousemove', e => {
            this.mouseX = (e.clientX - canvas.width/2) * 0.02;
            this.mouseY = (e.clientY - canvas.height/2) * 0.02;
            
            // Apply Parallax to Title and Button
            const title = document.querySelector('#start-screen h1');
            const btn = document.querySelector('#start-btn');
            
            if(title) {
                title.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px) rotateY(${this.mouseX * 0.5}deg) rotateX(${-this.mouseY * 0.5}deg)`;
            }
            if(btn) {
                btn.style.transform = `translate(${-this.mouseX * 0.5}px, ${-this.mouseY * 0.5}px)`;
            }
        });
    },
    
    start: function() {
        if (!this.stars.length) this.init();
        this.active = true;
        document.getElementById('start-screen').style.display = 'flex';
        document.getElementById('game-hud').style.display = 'none';
        
        // Start the Menu Loop
        this.loop();
    },
    
    stop: function() {
        this.active = false;
        document.getElementById('start-screen').style.display = 'none';
    },
    
    loop: function() {
        if(!this.active) return;
        
        // 1. Clear Screen with slight fade for trails
        if (!ctx) return;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 2. Draw Warp Stars
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        // Make stars move away from mouse cursor slightly
        const shiftX = this.mouseX * 5;
        const shiftY = this.mouseY * 5;

        ctx.fillStyle = '#fff';
        
        this.stars.forEach(star => {
            // Move star closer
            star.z -= 15; 
            
            // Reset if it passes the screen
            if(star.z <= 0) {
                star.x = Math.random() * 2000 - 1000;
                star.y = Math.random() * 2000 - 1000;
                star.z = canvas.width;
            }
            
            // Perspective Math
            const k = 128.0 / star.z;
            const px = (star.x + shiftX) * k + cx;
            const py = (star.y + shiftY) * k + cy;
            
            if(px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                // Size grows as it gets closer
                const size = (1 - star.z / canvas.width) * 4;
                const alpha = (1 - star.z / canvas.width);
                
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });
        
        requestAnimationFrame(() => this.loop());
    }
};