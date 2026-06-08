// Farm Animal Sorter - KidsGameZone Game Logic

const STATE_MENU = "MENU";
const STATE_PLAYING = "PLAYING";
const STATE_GAMEOVER = "GAMEOVER";

let gameState = STATE_MENU;
let score = 0;
let highScore = 0;
let timeLeft = 60;
let currentIndex = 0;

let correctCount = 0;
let totalAnswered = 0;

// Entire pool of animals
const ANIMAL_POOL = [
    { name: "Cow", emoji: "🐄", bin: "Farm" },
    { name: "Pig", emoji: "🐖", bin: "Farm" },
    { name: "Sheep", emoji: "🐑", bin: "Farm" },
    { name: "Horse", emoji: "🐎", bin: "Farm" },
    { name: "Chicken", emoji: "🐔", bin: "Farm" },
    { name: "Donkey", emoji: "🫏", bin: "Farm" },
    { name: "Duck", emoji: "🦆", bin: "Farm" },
    
    { name: "Dolphin", emoji: "🐬", bin: "Ocean" },
    { name: "Fish", emoji: "🐟", bin: "Ocean" },
    { name: "Crab", emoji: "🦀", bin: "Ocean" },
    { name: "Octopus", emoji: "🐙", bin: "Ocean" },
    { name: "Whale", emoji: "🐋", bin: "Ocean" },
    { name: "Shark", emoji: "🦈", bin: "Ocean" },
    
    { name: "Lion", emoji: "🦁", bin: "Jungle" },
    { name: "Monkey", emoji: "🐒", bin: "Jungle" },
    { name: "Parrot", emoji: "🦜", bin: "Jungle" },
    { name: "Elephant", emoji: "🐘", bin: "Jungle" },
    { name: "Tiger", emoji: "🐯", bin: "Jungle" },
    { name: "Gorilla", emoji: "🦍", bin: "Jungle" },
    { name: "Panda", emoji: "🐼", bin: "Jungle" },
    
    { name: "Polar Bear", emoji: "🐻‍❄️", bin: "Arctic" },
    { name: "Penguin", emoji: "🐧", bin: "Arctic" },
    { name: "Seal", emoji: "🦭", bin: "Arctic" },
    { name: "Arctic Fox", emoji: "🦊", bin: "Arctic" },
    { name: "Walrus", emoji: "🦭", bin: "Arctic" },
    { name: "Arctic Wolf", emoji: "🐺", bin: "Arctic" },
    { name: "Snowy Owl", emoji: "🦉", bin: "Arctic" }
];

let sessionAnimals = [];
let isChecking = false;

// Dragging variables
const animalCard = document.getElementById("animalCard");
let isDragging = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;

// Audio Synthesizer
let audioCtx = null;
function playTone(freq, type, duration, targetFreq = null) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (targetFreq) {
            osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e){}
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    score = 0;
    timeLeft = 60;
    currentIndex = 0;
    correctCount = 0;
    totalAnswered = 0;
    isChecking = false;

    // Pick 30 random animals
    let pool = [...ANIMAL_POOL];
    shuffle(pool);
    sessionAnimals = pool.slice(0, 30);

    // Reset card snapping
    animalCard.style.transform = "translate(0px, 0px)";
    
    updateUI();
    loadAnimal();
}

function updateUI() {
    document.getElementById("scoreVal").textContent = score;
    document.getElementById("progressVal").textContent = `${currentIndex + 1} / 30`;
    document.getElementById("timerVal").textContent = timeLeft + "s";
}

function loadAnimal() {
    if (currentIndex >= sessionAnimals.length) {
        triggerGameOver();
        return;
    }
    
    const animal = sessionAnimals[currentIndex];
    document.getElementById("animalEmoji").textContent = animal.emoji;
    document.getElementById("animalName").textContent = animal.name.toUpperCase();
    
    // Add pop animation reset
    animalCard.style.animation = "none";
    animalCard.offsetHeight; // trigger reflow
    animalCard.style.animation = "popCard 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    animalCard.style.transform = "translate(0px, 0px)";
    
    isChecking = false;
}

function selectBin(binName) {
    if (gameState !== STATE_PLAYING || isChecking) return;
    isChecking = true;

    const animal = sessionAnimals[currentIndex];
    const banner = document.getElementById("feedbackBanner");

    totalAnswered++;

    if (animal.bin === binName) {
        // Correct
        score += 10;
        correctCount++;
        playTone(523.25, "sine", 0.15, 659.25); // high ding
        
        banner.className = "feedback-banner active correct";
        banner.textContent = `Correct! The ${animal.name} lives in the ${animal.bin}! 🌟`;
        
        setTimeout(() => {
            banner.classList.remove("active");
            currentIndex++;
            updateUI();
            loadAnimal();
        }, 800);
    } else {
        // Wrong
        score = Math.max(0, score - 5);
        playTone(180, "sawtooth", 0.3, 90); // buzz
        
        banner.className = "feedback-banner active";
        banner.textContent = `Wrong! The ${animal.name} lives in the ${animal.bin}!`;
        
        setTimeout(() => {
            banner.classList.remove("active");
            currentIndex++;
            updateUI();
            loadAnimal();
        }, 1800); // longer delay so they can learn/read the correct bin!
    }
}

function triggerGameOver() {
    gameState = STATE_GAMEOVER;
    playTone(523.25, "sine", 0.2);
    setTimeout(() => playTone(659.25, "sine", 0.3), 100);

    highScore = Math.max(highScore, score);
    localStorage.setItem("kgz_highscore_farm-animal-sorter", highScore);

    // Calculate accuracy
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    document.getElementById("highScoreVal").textContent = highScore;
    document.getElementById("overlayHighScoreVal").textContent = highScore;
    document.getElementById("failScoreVal").textContent = score;
    document.getElementById("accuracyVal").textContent = accuracy + "%";
    document.getElementById("gameOverOverlay").classList.add("active");
}

// Dragging Mechanics (Mouse & Touch)
function startDrag(e) {
    if (gameState !== STATE_PLAYING || isChecking) return;
    isDragging = true;
    
    // Check touch vs mouse
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    animalCard.style.cursor = "grabbing";
    animalCard.style.transition = "none";
}

function drag(e) {
    if (!isDragging) return;
    
    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
    
    currentX = clientX - startX;
    currentY = clientY - startY;

    // Apply translation
    animalCard.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    animalCard.style.cursor = "grab";
    animalCard.style.transition = "transform 0.2s ease";

    // Detect if dropped on any bin coordinates
    // We can check direct distance thresholds
    // Or check vertical drop: if dragged sufficiently down (e.g. currentY > 50px)
    // and horizontal shifts determine the bin.
    // Better method: Check closest environment bin based on raw offset coordinates.
    // The bins are in a 2x2 grid at the bottom of the container.
    // If they drag left or right, we can classify the target.
    
    const threshold = 60;
    if (currentY > threshold) {
        // Dragged down towards bins
        if (currentX < -40) {
            // Down-Left can map to bottom-left categories depending on offset
            // Let's check coordinates. Better yet: snap card back and trigger selectBin on whichever was closest!
            // Bins:
            // Bin 1: Farm (left top)
            // Bin 2: Ocean (right top)
            // Bin 3: Jungle (left bottom)
            // Bin 4: Arctic (right bottom)
            if (currentY > 120) {
                // Bottom row
                if (currentX < 0) selectBin("Jungle");
                else selectBin("Arctic");
            } else {
                // Top row
                if (currentX < 0) selectBin("Farm");
                else selectBin("Ocean");
            }
        } else {
            // Center-ish drop down
            if (currentY > 120) {
                selectBin("Jungle");
            } else {
                selectBin("Farm");
            }
        }
    } else {
        // Snap back
        animalCard.style.transform = "translate(0px, 0px)";
    }
    
    currentX = 0;
    currentY = 0;
}

// Bind Drag Event Listeners
animalCard.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", drag);
window.addEventListener("mouseup", endDrag);

animalCard.addEventListener("touchstart", startDrag, { passive: true });
window.addEventListener("touchmove", drag, { passive: true });
window.addEventListener("touchend", endDrag);

// Timer Tick
setInterval(() => {
    if (gameState === STATE_PLAYING) {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            triggerGameOver();
        }
    }
}, 1000);

// Buttons click handles
document.getElementById("startBtn").addEventListener("click", () => {
    gameState = STATE_PLAYING;
    document.getElementById("startOverlay").classList.remove("active");
    initGame();
});

document.getElementById("failRestartBtn").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameState = STATE_PLAYING;
    initGame();
});

// Load score
highScore = parseInt(localStorage.getItem("kgz_highscore_farm-animal-sorter"), 10) || 0;
document.getElementById("highScoreVal").textContent = highScore;
