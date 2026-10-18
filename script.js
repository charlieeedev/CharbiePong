const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const pwdScreen = document.getElementById('password-screen');
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const pwdInput = document.getElementById('password-input');
const pwdBtn = document.getElementById('password-btn');
const pwdError = document.getElementById('password-error');
const btn1p = document.getElementById('btn-1p');
const btn2p = document.getElementById('btn-2p');
const score1El = document.getElementById('score-p1');
const score2El = document.getElementById('score-p2');

// Game State & Settings
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
let players = 1;
let gameRunning = false;

// Load Images
const imgP1 = new Image(); imgP1.src = 'images/me.png';
const imgP2 = new Image(); imgP2.src = 'images/abbie.png';
const imgBall = new Image(); imgBall.src = 'images/plushie.png';

// Entities
const ball = { x: 0, y: 0, w: 40, h: 40, vx: 5, vy: 5, baseSpeed: 6, maxSpeed: 22 };
const p1 = { x: 0, y: 0, w: 60, h: 60, speed: 8, score: 0, vx: 0, vy: 0, prevX: 0, prevY: 0 };
const p2 = { x: 0, y: 0, w: 60, h: 60, speed: 8, score: 0, vx: 0, vy: 0, prevX: 0, prevY: 0 };

// Keyboard Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// --- Initialization & Setup ---
function resize() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.75;
    resetBall();
    p1.x = 50; p1.y = canvas.height / 2 - p1.h / 2;
    p2.x = canvas.width - 50 - p2.w; p2.y = canvas.height / 2 - p2.h / 2;
}
window.addEventListener('resize', resize);

pwdBtn.addEventListener('click', () => {
    if (pwdInput.value.toLowerCase() === 'charbie') {
        pwdScreen.classList.add('hidden');
        if (isMobile) {
            players = 1;
            startGame();
        } else {
            setupScreen.classList.remove('hidden');
        }
    } else {
        pwdError.textContent = 'Incorrect password.';
    }
});

btn1p.addEventListener('click', () => { players = 1; startGame(); });
btn2p.addEventListener('click', () => { players = 2; startGame(); });

function startGame() {
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resize();
    gameRunning = true;
    requestAnimationFrame(update);
}

// --- Controls ---
window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Mobile Touch Controls (Player 1 slides anywhere on screen)
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    let touchX = e.touches[0].clientX;
    let touchY = e.touches[0].clientY;
    
    // Calculate movement delta
    let dx = touchX - touchStartX;
    let dy = touchY - touchStartY;
    
    p1.x += dx;
    p1.y += dy;
    
    touchStartX = touchX;
    touchStartY = touchY;
}, {passive: false});

// --- Game Logic ---
function resetBall() {
    ball.x = canvas.width / 2 - ball.w / 2;
    ball.y = canvas.height / 2 - ball.h / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * ball.baseSpeed;
    ball.vy = (Math.random() * 2 - 1) * ball.baseSpeed;
}

function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

function update() {
    if (!gameRunning) return;

    // Track previous positions to calculate velocity
    p1.prevX = p1.x; p1.prevY = p1.y;
    p2.prevX = p2.x; p2.prevY = p2.y;

    // Player 1 Movement (PC)
    if (keys.w) p1.y -= p1.speed;
    if (keys.s) p1.y += p1.speed;
    if (keys.a) p1.x -= p1.speed;
    if (keys.d) p1.x += p1.speed;

    // Player 2 Movement (PC or AI)
    if (players === 2) {
        if (keys.ArrowUp) p2.y -= p2.speed;
        if (keys.ArrowDown) p2.y += p2.speed;
        if (keys.ArrowLeft) p2.x -= p2.speed;
        if (keys.ArrowRight) p2.x += p2.speed;
    } else {
        // Simple AI logic
        if (ball.y < p2.y + p2.h / 2 - 15) p2.y -= p2.speed * 0.7;
        if (ball.y > p2.y + p2.h / 2 + 15) p2.y += p2.speed * 0.7;
        
        // AI returns to its side
        if (p2.x > canvas.width - 100) p2.x -= p2.speed * 0.5;
        if (p2.x < canvas.width - 100) p2.x += p2.speed * 0.5;
    }

    // Boundaries: Lock P1 to left half, P2 to right half
    p1.x = Math.max(0, Math.min(p1.x, canvas.width / 2 - p1.w));
    p1.y = Math.max(0, Math.min(p1.y, canvas.height - p1.h));
    
    p2.x = Math.max(canvas.width / 2, Math.min(p2.x, canvas.width - p2.w));
    p2.y = Math.max(0, Math.min(p2.y, canvas.height - p2.h));

    // Calculate current frame velocity (for momentum transfer)
    p1.vx = p1.x - p1.prevX; p1.vy = p1.y - p1.prevY;
    p2.vx = p2.x - p2.prevX; p2.vy = p2.y - p2.prevY;

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ball Top/Bottom Wall Collisions
    if (ball.y <= 0 || ball.y + ball.h >= canvas.height) {
        ball.vy *= -1;
        ball.y = ball.y <= 0 ? 0 : canvas.height - ball.h;
    }

    // Ball & Paddle Collisions (Includes Momentum Transfer)
    if (checkCollision(ball, p1)) {
        ball.vx = Math.abs(ball.vx); // Force right
        ball.vx += p1.vx * 0.6;      // Transfer 60% horizontal paddle speed
        ball.vy += p1.vy * 0.5;      // Transfer 50% vertical paddle speed
        ball.x = p1.x + p1.w;        // Prevent sticking inside paddle
    } else if (checkCollision(ball, p2)) {
        ball.vx = -Math.abs(ball.vx); // Force left
        ball.vx += p2.vx * 0.6;
        ball.vy += p2.vy * 0.5;
        ball.x = p2.x - ball.w;       // Prevent sticking inside paddle
    }

    // Clamp ball speed (so it doesn't break the game if hit too hard)
    let currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    if (currentSpeed > ball.maxSpeed) {
        let ratio = ball.maxSpeed / currentSpeed;
        ball.vx *= ratio;
        ball.vy *= ratio;
    }
    
    // Enforce minimum horizontal speed (prevent stalling out)
    if (Math.abs(ball.vx) < 3) ball.vx = ball.vx < 0 ? -3 : 3;

    // Scoring
    if (ball.x < 0) { p2.score++; updateScore(); resetBall(); }
    if (ball.x > canvas.width) { p1.score++; updateScore(); resetBall(); }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    score1El.textContent = p1.score;
    score2El.textContent = p2.score;
}

// Draw images with fallback shapes if images aren't found
function drawEntity(img, x, y, w, h, fallbackColor) {
    if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, w, h);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Center Dashed Line
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Player 1 (Me), Player 2 (Abbie), and Ball (Plushie)
    drawEntity(imgP1, p1.x, p1.y, p1.w, p1.h, '#4dabf7');
    drawEntity(imgP2, p2.x, p2.y, p2.w, p2.h, '#ff6b6b');
    drawEntity(imgBall, ball.x, ball.y, ball.w, ball.h, '#fcc419');
}