// Game configuration
const gameConfig = {
    canvasWidth: 400,
    canvasHeight: 600,
    gravity: 0.5,
    jumpPower: -12,
    platformSpeed: 2,
    platformWidth: 80,
    platformHeight: 20,
    playerSize: 20,
    colors: {
        background: "#87CEEB",
        player: "#FF6B6B",
        platform: "#4ECDC4",
        platformAlt: "#45B7D1",
        text: "#2C3E50",
        score: "#FFFFFF"
    }
};

// Game state
let gameState = {
    isPlaying: false,
    gameStarted: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('stackJumpHighScore')) || 0,
    camera: { y: 0 },
    platforms: [],
    particles: []
};

// Player object
let player = {
    x: gameConfig.canvasWidth / 2,
    y: gameConfig.canvasHeight - 100,
    width: gameConfig.playerSize,
    height: gameConfig.playerSize,
    velY: 0,
    onGround: false,
    platformIndex: -1
};

// Game elements
let canvas, ctx, startScreen, gameOverScreen, currentScoreEl, highScoreEl, finalScoreEl, newBestEl;

// Audio context for sound effects
let audioContext;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    currentScoreEl = document.getElementById('currentScore');
    highScoreEl = document.getElementById('highScore');
    finalScoreEl = document.getElementById('finalScore');
    newBestEl = document.getElementById('newBest');

    // Set initial high score display
    highScoreEl.textContent = gameState.highScore;

    // Ensure start screen is visible and game over screen is hidden
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');

    // Initialize audio context
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio not supported');
    }

    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // Touch and click controls for jumping (only when playing)
    canvas.addEventListener('click', handleJump);
    canvas.addEventListener('touchstart', handleJump);
    
    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Initialize platforms for start screen display
    initializeStartScreenPlatforms();

    // Start the game loop
    gameLoop();
}

// Initialize platforms for start screen display
function initializeStartScreenPlatforms() {
    gameState.platforms = [];
    gameState.camera.y = 0;
    
    // Create initial platform
    gameState.platforms.push({
        x: gameConfig.canvasWidth / 2 - gameConfig.platformWidth / 2,
        y: gameConfig.canvasHeight - 50,
        width: gameConfig.platformWidth,
        height: gameConfig.platformHeight,
        speed: 0,
        direction: 1,
        color: gameConfig.colors.platform
    });

    // Reset player position
    player.x = gameConfig.canvasWidth / 2 - player.width / 2;
    player.y = gameConfig.canvasHeight - 100;
    player.velY = 0;
    player.onGround = true;
    player.platformIndex = 0;
}

// Handle jump input
function handleJump(e) {
    e.preventDefault();
    
    if (!gameState.isPlaying) return;
    
    if (player.onGround) {
        player.velY = gameConfig.jumpPower;
        player.onGround = false;
        playSound(220, 0.1); // Jump sound
    }
}

// Start the game
function startGame() {
    gameState.isPlaying = true;
    gameState.gameStarted = true;
    gameState.score = 0;
    gameState.camera.y = 0;
    
    // Reset player
    player.x = gameConfig.canvasWidth / 2 - player.width / 2;
    player.y = gameConfig.canvasHeight - 100;
    player.velY = 0;
    player.onGround = true;
    player.platformIndex = 0;
    
    // Initialize platforms
    gameState.platforms = [];
    createInitialPlatform();
    
    // Clear particles
    gameState.particles = [];
    
    // Hide start screen
    startScreen.classList.add('hidden');
    updateScore();
}

// Restart the game
function restartGame() {
    gameOverScreen.classList.add('hidden');
    newBestEl.classList.add('hidden');
    startGame();
}

// Create initial platform
function createInitialPlatform() {
    gameState.platforms.push({
        x: gameConfig.canvasWidth / 2 - gameConfig.platformWidth / 2,
        y: gameConfig.canvasHeight - 50,
        width: gameConfig.platformWidth,
        height: gameConfig.platformHeight,
        speed: 0,
        direction: 1,
        color: gameConfig.colors.platform
    });
    
    // Create first moving platform
    spawnPlatform();
}

// Spawn a new platform
function spawnPlatform() {
    const lastPlatform = gameState.platforms[gameState.platforms.length - 1];
    const newY = lastPlatform.y - 100 - Math.random() * 50;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = gameConfig.platformSpeed + Math.random() * 2;
    const startX = direction > 0 ? -gameConfig.platformWidth : gameConfig.canvasWidth;
    
    gameState.platforms.push({
        x: startX,
        y: newY,
        width: gameConfig.platformWidth,
        height: gameConfig.platformHeight,
        speed: speed,
        direction: direction,
        color: Math.random() > 0.5 ? gameConfig.colors.platform : gameConfig.colors.platformAlt
    });
}

// Update game logic
function update() {
    if (!gameState.isPlaying) return;
    
    // Update player physics
    player.velY += gameConfig.gravity;
    player.y += player.velY;
    
    // Update camera to follow player
    const targetCameraY = player.y - gameConfig.canvasHeight * 0.7;
    gameState.camera.y += (targetCameraY - gameState.camera.y) * 0.1;
    
    // Update platforms
    gameState.platforms.forEach(platform => {
        platform.x += platform.speed * platform.direction;
        
        // Wrap platforms around screen
        if (platform.direction > 0 && platform.x > gameConfig.canvasWidth) {
            platform.x = -platform.width;
        } else if (platform.direction < 0 && platform.x + platform.width < 0) {
            platform.x = gameConfig.canvasWidth;
        }
    });
    
    // Check platform collisions
    checkPlatformCollisions();
    
    // Move player with platform if on ground
    if (player.onGround && player.platformIndex >= 0) {
        const platform = gameState.platforms[player.platformIndex];
        if (platform) {
            player.x += platform.speed * platform.direction;
        }
    }
    
    // Spawn new platforms
    const highestPlatform = Math.min(...gameState.platforms.map(p => p.y));
    if (highestPlatform > gameState.camera.y - 200) {
        spawnPlatform();
    }
    
    // Update particles
    updateParticles();
    
    // Check for game over
    if (player.y > gameState.camera.y + gameConfig.canvasHeight + 100) {
        gameOver();
    }
    
    // Remove old platforms
    gameState.platforms = gameState.platforms.filter(platform => 
        platform.y < gameState.camera.y + gameConfig.canvasHeight + 100
    );
}

// Check collisions with platforms
function checkPlatformCollisions() {
    player.onGround = false;
    
    gameState.platforms.forEach((platform, index) => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + 10 &&
            player.velY >= 0) {
            
            player.y = platform.y - player.height;
            player.velY = 0;
            player.onGround = true;
            
            // Check if this is a new platform
            if (player.platformIndex < index) {
                player.platformIndex = index;
                gameState.score++;
                updateScore();
                playSound(440, 0.1); // Score sound
                createParticles(player.x + player.width / 2, player.y + player.height);
            }
        }
    });
}

// Update particles
function updateParticles() {
    gameState.particles.forEach(particle => {
        particle.y += particle.velY;
        particle.x += particle.velX;
        particle.velY += 0.2; // Gravity on particles
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
    });
    
    gameState.particles = gameState.particles.filter(particle => particle.life > 0);
}

// Create particle effects
function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        gameState.particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            velX: (Math.random() - 0.5) * 4,
            velY: -Math.random() * 3 - 1,
            life: 30,
            maxLife: 30,
            alpha: 1,
            color: '#FFD700'
        });
    }
}

// Render the game
function render() {
    // Clear canvas
    ctx.fillStyle = gameConfig.colors.background;
    ctx.fillRect(0, 0, gameConfig.canvasWidth, gameConfig.canvasHeight);
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(0, -gameState.camera.y);
    
    // Draw platforms
    gameState.platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add platform shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height * 0.3);
    });
    
    // Draw player
    ctx.fillStyle = gameConfig.colors.player;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Add player shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(player.x, player.y, player.width, player.height * 0.4);
    
    // Draw particles
    gameState.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update score display
function updateScore() {
    currentScoreEl.textContent = gameState.score;
}

// Game over
function gameOver() {
    gameState.isPlaying = false;
    
    // Check for high score
    let isNewBest = false;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreEl.textContent = gameState.highScore;
        localStorage.setItem('stackJumpHighScore', gameState.highScore);
        isNewBest = true;
    }
    
    // Show game over screen
    finalScoreEl.textContent = gameState.score;
    
    if (isNewBest) {
        newBestEl.classList.remove('hidden');
        playSound(660, 0.2); // New best sound
    } else {
        newBestEl.classList.add('hidden');
        playSound(150, 0.3); // Game over sound
    }
    
    gameOverScreen.classList.remove('hidden');
}

// Play simple beep sounds
function playSound(frequency, duration) {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Sound playback failed');
    }
}

// Prevent scrolling and zooming on mobile
document.addEventListener('touchstart', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle resize
window.addEventListener('resize', function() {
    // Keep canvas size consistent
    const container = canvas.parentElement;
    const containerRect = container.getBoundingClientRect();
    const scale = Math.min(containerRect.width / gameConfig.canvasWidth, containerRect.height / gameConfig.canvasHeight);
    
    canvas.style.width = (gameConfig.canvasWidth * scale) + 'px';
    canvas.style.height = (gameConfig.canvasHeight * scale) + 'px';
});

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', init);