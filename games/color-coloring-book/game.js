/**
 * KidsGameZone: Coloring Book
 * Programmatic closed-loop vector outlines, Paint Brush mouse/touch drag,
 * 16-color swatches, queue-based boundary Flood Fill bucket, and Web Audio.
 */

// Colors Definition (16 bright kid-friendly colors)
const paletteColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#06b6d4', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
    '#d946ef', '#ec4899', '#f43f5e', '#78350f'
];

// Hex to RGB parser helper
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

// Canvas & state setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const modeVal = document.getElementById('modeVal');
const paletteGrid = document.getElementById('paletteGrid');
const thumbStrip = document.getElementById('thumbStrip');

// Tools & Action buttons
const fillTool = document.getElementById('fillTool');
const brushTool = document.getElementById('brushTool');
const eraserTool = document.getElementById('eraserTool');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

// Active configuration
let activeTool = 'fill';
let activeColor = '#ef4444';
let activeColorRGB = [239, 68, 68];
let currentTemplate = 'sun';
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Audio Configuration
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let brushSoundOsc = null;
let brushSoundGain = null;

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'fill') {
        // Squishy splash pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
    }
}

// Start Brush humming sound
function startBrushSound() {
    if (!audioCtx || brushSoundOsc) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    brushSoundOsc = audioCtx.createOscillator();
    brushSoundGain = audioCtx.createGain();
    brushSoundOsc.connect(brushSoundGain);
    brushSoundGain.connect(audioCtx.destination);

    brushSoundOsc.type = 'triangle';
    brushSoundOsc.frequency.setValueAtTime(110, audioCtx.currentTime); // low hum
    brushSoundGain.gain.setValueAtTime(0.02, audioCtx.currentTime);

    brushSoundOsc.start();
}

function stopBrushSound() {
    if (brushSoundOsc) {
        try {
            brushSoundOsc.stop();
        } catch(e){}
        brushSoundOsc = null;
        brushSoundGain = null;
    }
}

// Initialize palette swatch DOMs
paletteColors.forEach((color, idx) => {
    const swatch = document.createElement('div');
    swatch.className = `color-swatch ${idx === 0 ? 'selected' : ''}`;
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        activeColor = color;
        activeColorRGB = hexToRgb(color);
        playSound('fill');
    });
    paletteGrid.appendChild(swatch);
});

// Outlines templates drawings
function drawTemplateOutline(name) {
    // 1. Draw solid white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b'; // solid dark blue-black outline
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (name === 'sun') {
        // Core center circle
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 52, 0, Math.PI * 2);
        ctx.stroke();

        // Rays (8 closed triangles so they can be filled separately!)
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 52, cy - 10 + Math.sin(a) * 52);
            ctx.lineTo(cx + Math.cos(a - 0.16) * 85, cy - 10 + Math.sin(a - 0.16) * 85);
            ctx.lineTo(cx + Math.cos(a + 0.16) * 85, cy - 10 + Math.sin(a + 0.16) * 85);
            ctx.closePath();
            ctx.stroke();
        }
    }
    else if (name === 'house') {
        // Base box
        ctx.beginPath();
        ctx.strokeRect(cx - 100, cy - 30, 200, 140);

        // Roof triangle
        ctx.beginPath();
        ctx.moveTo(cx - 120, cy - 30);
        ctx.lineTo(cx, cy - 125);
        ctx.lineTo(cx + 120, cy - 30);
        ctx.closePath();
        ctx.stroke();

        // Door
        ctx.beginPath();
        ctx.strokeRect(cx - 30, cy + 30, 60, 80);

        // Doorknob
        ctx.beginPath();
        ctx.arc(cx + 18, cy + 70, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Attic window
        ctx.beginPath();
        ctx.arc(cx, cy - 65, 20, 0, Math.PI * 2);
        ctx.stroke();
        // window pane crosses
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 65); ctx.lineTo(cx + 20, cy - 65);
        ctx.moveTo(cx, cy - 85); ctx.lineTo(cx, cy - 45);
        ctx.stroke();
    }
    else if (name === 'flower') {
        // Stem
        ctx.beginPath();
        ctx.strokeRect(cx - 6, cy + 40, 12, 110);

        // Leaves (left/right closed curves)
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 80);
        ctx.quadraticCurveTo(cx - 60, cy + 60, cx - 6, cy + 120);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 6, cy + 90);
        ctx.quadraticCurveTo(cx + 60, cy + 70, cx + 6, cy + 130);
        ctx.closePath();
        ctx.stroke();

        // 5 closed petals
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
            const px = cx + Math.cos(a) * 44;
            const py = cy - 30 + Math.sin(a) * 44;
            ctx.beginPath();
            ctx.arc(px, py, 26, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Center disk
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 26, 0, Math.PI * 2);
        ctx.stroke();
    }
    else if (name === 'fish') {
        // Main body oval
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 56, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Tail fin
        ctx.beginPath();
        ctx.moveTo(cx - 86, cy);
        ctx.lineTo(cx - 136, cy - 50);
        ctx.lineTo(cx - 136, cy + 50);
        ctx.closePath();
        ctx.stroke();

        // Side fin
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 20);
        ctx.quadraticCurveTo(cx - 30, cy + 55, cx + 15, cy + 45);
        ctx.closePath();
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 18, 8, 0, Math.PI * 2);
        ctx.stroke();
        // Pupil
        ctx.beginPath();
        ctx.arc(cx + 52, cy - 18, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Mouth smile
        ctx.beginPath();
        ctx.arc(cx + 80, cy + 10, 10, Math.PI * 0.9, Math.PI * 1.4);
        ctx.stroke();
    }
    else if (name === 'butterfly') {
        // Center body capsule
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 10, 80, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Antennae
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 70);
        ctx.quadraticCurveTo(cx - 24, cy - 110, cx - 14, cy - 110);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 70);
        ctx.quadraticCurveTo(cx + 24, cy - 110, cx + 14, cy - 110);
        ctx.stroke();

        // Wings (Left Top/Bottom)
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 30);
        ctx.bezierCurveTo(cx - 120, cy - 130, cx - 130, cy + 10, cx - 10, cy + 15);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 20);
        ctx.bezierCurveTo(cx - 100, cy + 90, cx - 90, cy + 120, cx - 10, cy + 55);
        ctx.closePath();
        ctx.stroke();

        // Wings (Right Top/Bottom)
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - 30);
        ctx.bezierCurveTo(cx + 120, cy - 130, cx + 130, cy + 10, cx + 10, cy + 15);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 10, cy + 20);
        ctx.bezierCurveTo(cx + 100, cy + 90, cx + 90, cy + 120, cx + 10, cy + 55);
        ctx.closePath();
        ctx.stroke();
    }
}

// Queue-based boundary Flood Fill algorithm
function performFloodFill(startX, startY, fillRGB) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = imgData.width;
    const height = imgData.height;

    const startIdx = (startY * width + startX) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // Target matches color already
    if (Math.abs(startR - fillRGB[0]) < 8 &&
        Math.abs(startG - fillRGB[1]) < 8 &&
        Math.abs(startB - fillRGB[2]) < 8 &&
        startA === 255) {
        return;
    }

    // Boundary condition checker
    function isOutline(r, g, b, a) {
        return r < 100 && g < 100 && b < 100 && a > 120;
    }

    if (isOutline(startR, startG, startB, startA)) return;

    // Queue-based flood fill structure
    const queue = [startX, startY];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
        const y = queue.pop();
        const x = queue.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const pos = y * width + x;
        if (visited[pos]) continue;
        visited[pos] = 1;

        const idx = pos * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (isOutline(r, g, b, a)) continue;

        // Tolerance check matching start color region
        if (Math.abs(r - startR) > 50 ||
            Math.abs(g - startG) > 50 ||
            Math.abs(b - startB) > 50) {
            continue;
        }

        // Apply fill color
        data[idx] = fillRGB[0];
        data[idx + 1] = fillRGB[1];
        data[idx + 2] = fillRGB[2];
        data[idx + 3] = 255;

        // Add 4-directional neighbors
        queue.push(x + 1, y);
        queue.push(x - 1, y);
        queue.push(x, y + 1);
        queue.push(x, y - 1);
    }

    ctx.putImageData(imgData, 0, 0);
}

// Coordinate retrieval
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: Math.floor((clientX - rect.left) * (canvas.width / rect.width)),
        y: Math.floor((clientY - rect.top) * (canvas.height / rect.height))
    };
}

// Mouse Down hooks (Handles drawing start or fills)
function handleDown(e) {
    const coords = getCanvasCoords(e);

    if (activeTool === 'fill') {
        // Run bucket flood fill
        performFloodFill(coords.x, coords.y, activeColorRGB);
        playSound('fill');
    } else {
        // Draw brush / eraser
        isDrawing = true;
        lastX = coords.x;
        lastY = coords.y;
        startBrushSound();
        drawStroke(coords.x, coords.y);
    }
}

function handleMove(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    drawStroke(coords.x, coords.y);
}

function handleUp() {
    isDrawing = false;
    stopBrushSound();
}

function drawStroke(x, y) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (activeTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 20;
    } else {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 8;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    lastX = x;
    lastY = y;

    // Reinforce the outline template so brush strokes do not cover it
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Redraw outline over current painted pixels
    const tempName = currentTemplate;
    // Drawing outlines again maintains sharp black vectors on top
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    if (tempName === 'sun') {
        ctx.beginPath(); ctx.arc(cx, cy - 10, 52, 0, Math.PI * 2); ctx.stroke();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 52, cy - 10 + Math.sin(a) * 52);
            ctx.lineTo(cx + Math.cos(a - 0.16) * 85, cy - 10 + Math.sin(a - 0.16) * 85);
            ctx.lineTo(cx + Math.cos(a + 0.16) * 85, cy - 10 + Math.sin(a + 0.16) * 85);
            ctx.closePath(); ctx.stroke();
        }
    } else if (tempName === 'house') {
        ctx.strokeRect(cx - 100, cy - 30, 200, 140);
        ctx.beginPath(); ctx.moveTo(cx - 120, cy - 30); ctx.lineTo(cx, cy - 125); ctx.lineTo(cx + 120, cy - 30); ctx.closePath(); ctx.stroke();
        ctx.strokeRect(cx - 30, cy + 30, 60, 80);
        ctx.beginPath(); ctx.arc(cx + 18, cy + 70, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy - 65, 20, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 20, cy - 65); ctx.lineTo(cx + 20, cy - 65); ctx.moveTo(cx, cy - 85); ctx.lineTo(cx, cy - 45); ctx.stroke();
    } else if (tempName === 'flower') {
        ctx.strokeRect(cx - 6, cy + 40, 12, 110);
        ctx.beginPath(); ctx.moveTo(cx - 6, cy + 80); ctx.quadraticCurveTo(cx - 60, cy + 60, cx - 6, cy + 120); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 6, cy + 90); ctx.quadraticCurveTo(cx + 60, cy + 70, ctx + 6, cy + 130); ctx.closePath(); ctx.stroke();
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
            const px = cx + Math.cos(a) * 44; const py = cy - 30 + Math.sin(a) * 44;
            ctx.beginPath(); ctx.arc(px, py, 26, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx, cy - 30, 26, 0, Math.PI * 2); ctx.stroke();
    } else if (tempName === 'fish') {
        ctx.beginPath(); ctx.ellipse(cx, cy, 90, 56, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 86, cy); ctx.lineTo(cx - 136, cy - 50); ctx.lineTo(cx - 136, cy + 50); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 10, cy + 20); ctx.quadraticCurveTo(cx - 30, cy + 55, cx + 15, cy + 45); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 50, cy - 18, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 80, cy + 10, 10, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke();
    } else if (tempName === 'butterfly') {
        ctx.beginPath(); ctx.ellipse(cx, cy + 10, 10, 80, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 6, cy - 70); ctx.quadraticCurveTo(cx - 24, cy - 110, cx - 14, cy - 110); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 6, cy - 70); ctx.quadraticCurveTo(cx + 24, cy - 110, cx + 14, cy - 110); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 10, cy - 30); ctx.bezierCurveTo(cx - 120, cy - 130, cx - 130, cy + 10, cx - 10, cy + 15); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 10, cy + 20); ctx.bezierCurveTo(cx - 100, cy + 90, cx - 90, cy + 120, cx - 10, cy + 55); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 10, cy - 30); ctx.bezierCurveTo(cx + 120, cy - 130, ctx + 130, cy + 10, ctx + 10, cy + 15); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 10, cy + 20); ctx.bezierCurveTo(cx + 100, cy + 90, cx + 90, cy + 120, ctx + 10, cy + 55); ctx.closePath(); ctx.stroke();
    }

    ctx.restore();
}

// Mouse Event Hooking
canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

// Touch Event Hooking
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDown(e);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
}, { passive: false });

window.addEventListener('touchend', handleUp);

// Toolbar buttons mapping
fillTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    fillTool.classList.add('active');
    activeTool = 'fill';
    modeVal.textContent = '🪣 Fill';
    playSound('fill');
});

brushTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    brushTool.classList.add('active');
    activeTool = 'brush';
    modeVal.textContent = '🖌️ Brush';
    playSound('fill');
});

eraserTool.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    eraserTool.classList.add('active');
    activeTool = 'eraser';
    modeVal.textContent = '🧼 Eraser';
    playSound('fill');
});

// Clear action
clearBtn.addEventListener('click', () => {
    drawTemplateOutline(currentTemplate);
    playSound('chime');
});

// Save image action
saveBtn.addEventListener('click', () => {
    playSound('chime');
    setTimeout(() => {
        const link = document.createElement('a');
        link.download = `coloring-${currentTemplate}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, 180);
});

// Thumbnail picture switchers
const thumbButtons = document.querySelectorAll('.thumb-btn');
thumbButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        thumbButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTemplate = btn.getAttribute('data-pic');
        playSound('chime');
        drawTemplateOutline(currentTemplate);
    });
});

// Initial draw loading
drawTemplateOutline(currentTemplate);
