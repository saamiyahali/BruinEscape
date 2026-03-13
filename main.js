import * as THREE from 'three';
import { scene, renderer, mainLight } from './src/core/scene.js';
import { camera } from './src/core/camera.js';
import { Input } from './src/player/input.js';
import { createHallway, updateHallway } from './src/world/hallway.js';
import { HALLWAY_BOUNDS } from './src/world/bounds.js';
import { initObstacleModels } from './src/world/obstacles.js';
import { LEVELS } from './src/world/levels.js';

// Placeholder cube, this is where we add joe.js
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshPhongMaterial({ color: 0x3284bf, transparent: true });
const player = new THREE.Mesh(playerGeo, playerMat);
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();
const coinBox = new THREE.Box3();
let score = 0;
player.position.set(0, 1, 0);
player.castShadow = true;
player.receiveShadow = true;
scene.add(player);

//levels
let currentLevelIndex = 0;
let currentLevel = LEVELS[currentLevelIndex];


initObstacleModels();

//screen ui

const GAME_STATES = {
    START: "start",
    LEVEL_SELECT: "level_select",
    LEVEL_BRIEFING: "level_briefing",
    PLAYING: "playing",
    PAUSED: "paused",
    LEVEL_COMPLETED: "level_completed",
    GAME_OVER: "game_over",
    VICTORY: "victory"
};

let gameState = GAME_STATES.START;
let unlockedLevel = Number(localStorage.getItem("unlockedLevel") || 1);

const startScreenUI = document.getElementById('start-screen');
const levelSelectScreenUI = document.getElementById('level-select-screen');
const pauseScreenUI = document.getElementById('pause-screen');
const victoryScreenUI = document.getElementById('victory-screen');
const gameOverUI = document.getElementById('game-over');
const levelButtonsUI = document.getElementById('level-buttons');

const startButton = document.getElementById('start-button');
const levelSelectButton = document.getElementById('level-select-button');
const backToStartButton = document.getElementById('back-to-start-button');
const retryButton = document.getElementById('retry-button');
const gameOverLevelSelectButton = document.getElementById('game-over-level-select-button');
const victoryLevelSelectButton = document.getElementById('victory-level-select-button');

const resumeButton = document.getElementById('resume-button');
const pauseResetButton = document.getElementById('pause-reset-button');
const pauseLevelSelectButton = document.getElementById('pause-level-select-button');
const pauseMainMenuButton = document.getElementById('pause-main-menu-button');

const levelBriefingScreenUI = document.getElementById('level-briefing-screen');
const briefingTitleUI = document.getElementById('briefing-title');
const briefingGoalUI = document.getElementById('briefing-goal');
const briefingObstaclesUI = document.getElementById('briefing-obstacles');
const briefingStartButton = document.getElementById('briefing-start-button');
const briefingBackButton = document.getElementById('briefing-back-button');

const levelCompleteScreenUI = document.getElementById('level-complete-screen');
const levelCompleteTextUI = document.getElementById('level-complete-text');
const nextLevelButton = document.getElementById('next-level-button');
const levelCompleteLevelSelectButton = document.getElementById('level-complete-level-select-button');

//game Overlay UI
const heartsUI = document.getElementById('hearts');
const scoreUI = document.getElementById('score');
const finalScoreUI = document.getElementById('final-score');

function hideAllMenus() {
    startScreenUI.classList.remove('show');
    levelSelectScreenUI.classList.remove('show');
    pauseScreenUI.classList.remove('show');
    gameOverUI.classList.remove('show');
    victoryScreenUI.classList.remove('show');
    levelCompleteScreenUI.classList.remove('show');
    levelBriefingScreenUI.classList.remove('show');
}

function showStartScreen() {
    gameState = GAME_STATES.START;
    hideAllMenus();
    startScreenUI.classList.add('show');
}

function showLevelSelectScreen() {
    gameState = GAME_STATES.LEVEL_SELECT;
    hideAllMenus();
    renderLevelButtons();
    levelSelectScreenUI.classList.add('show');
}

function showPauseScreen() {
    gameState = GAME_STATES.PAUSED;
    hideAllMenus();
    pauseScreenUI.classList.add('show');
}

function showGameOverScreen() {
    gameState = GAME_STATES.GAME_OVER;
    updateGameOverScore();
    hideAllMenus();
    gameOverUI.classList.add('show');
}

function showVictoryScreen() {
    gameState = GAME_STATES.VICTORY;
    hideAllMenus();
    victoryScreenUI.classList.add('show');
}

function resumeGame() {
    hideAllMenus();
    gameState = GAME_STATES.PLAYING;
}

function showLevelCompleteScreen() {
    gameState = GAME_STATES.LEVEL_COMPLETE;
    hideAllMenus();

    levelCompleteTextUI.innerText = `Level ${currentLevel.id} complete!`;
    levelCompleteScreenUI.classList.add('show');
}

function updateScore() {
    scoreUI.innerText = "Coins: " + score;
}

function updateGameOverScore() {
    finalScoreUI.innerText = "Final Score: " + score;
}

function updateHearts() {
    heartsUI.innerText = '❤️'.repeat(lives) + '🖤'.repeat(5 - lives);
}

function getObstacleNamesForLevel(level) {
    if (!level.obstacleTypes || level.obstacleTypes.length === 0) {
        return ["None"];
    }
    return level.obstacleTypes;
}

function showLevelBriefingScreen() {
    gameState = GAME_STATES.LEVEL_BRIEFING;
    hideAllMenus();

    briefingTitleUI.innerText = `Floor ${currentLevel.id}`;
    briefingGoalUI.innerText = `Collect ${currentLevel.goalCoins} coins`;

    const obstacleNames = getObstacleNamesForLevel(currentLevel);
    briefingObstaclesUI.innerHTML = `
        <strong>Obstacles in this floor:</strong><br>
        ${obstacleNames.map(name => `• ${name}`).join('<br>')}
    `;

    levelBriefingScreenUI.classList.add('show');
}

function renderLevelButtons() {
    levelButtonsUI.innerHTML = "";

    LEVELS.forEach((level, index) => {
        const button = document.createElement("button");
        button.textContent = `Floor ${level.id}`;
        button.disabled = level.id > unlockedLevel;

        button.addEventListener("click", () => {
            currentLevelIndex = index;
            currentLevel = LEVELS[currentLevelIndex];
            hallway.setLevelConfig(currentLevel);
            resetGame();
            showLevelBriefingScreen();
        });

        levelButtonsUI.appendChild(button);
    });
}

startButton.addEventListener("click", () => {
    currentLevelIndex = 0;
    currentLevel = LEVELS[currentLevelIndex];
    hallway.setLevelConfig(currentLevel);
    resetGame();
    showLevelBriefingScreen();
});

briefingStartButton.addEventListener("click", () => {
    hideAllMenus();
    gameState = GAME_STATES.PLAYING;
});

briefingBackButton.addEventListener("click", () => {
    showLevelSelectScreen();
});

levelSelectButton.addEventListener("click", showLevelSelectScreen);
backToStartButton.addEventListener("click", showStartScreen);

retryButton.addEventListener("click", () => {
    resetGame();
    hideAllMenus();
    gameState = GAME_STATES.PLAYING;
});

resumeButton.addEventListener("click", () => {
    resumeGame();
});

pauseResetButton.addEventListener("click", () => {
    resetGame();
    resumeGame();
});

pauseLevelSelectButton.addEventListener("click", () => {
    showLevelSelectScreen();
});

pauseMainMenuButton.addEventListener("click", () => {
    showStartScreen();
});

gameOverLevelSelectButton.addEventListener("click", showLevelSelectScreen);
victoryLevelSelectButton.addEventListener("click", showLevelSelectScreen);

nextLevelButton.addEventListener("click", () => {
    currentLevelIndex++;
    currentLevel = LEVELS[currentLevelIndex];
    hallway.setLevelConfig(currentLevel);
    resetGame();
    showLevelBriefingScreen();
});

levelCompleteLevelSelectButton.addEventListener("click", () => {
    showLevelSelectScreen();
});

// Placeholder input, add input.js here
const input = new Input();

// Gravity
const GRAVITY = 25.0;
const JUMP_VEL = 14.0;
const GROUND_Y = 1.0;

let velY = 0.0;

// Player movement constants
const MOVE_SPEED = 8.0;

//Lives and game state
let lives = 5;
let isInvincible = false;
let isGameOver = false;
let currentSpeed = 15.0; 
const SPEED_INCREMENT = 0.2; 
const MAX_SPEED = 30.0;

//Blinking (for damage invincibility)
let blinkTimer = 0;
const BLINK_DURATION = 2.0;
const BLINK_INTERVAL = 0.1;
let blinkAccumulator = 0;

// Hallway
const hallway = createHallway(scene, currentLevel);

function resetGame() {
    lives = 5;
    currentSpeed = currentLevel.speed;
    score = 0;
    
    isGameOver = false;
    isInvincible = false;
    blinkTimer = 0;
    blinkAccumulator = 0;
    player.material.opacity = 1;

    updateScore();
    updateHearts();
    updateGameOverScore();

    player.position.set(0, GROUND_Y, 0);
    velY = 0.0;

    hallway.setLevelConfig(currentLevel);
    hallway.resetSegments();
}

function levelComplete() {
    const nextUnlocked = Math.min(currentLevelIndex + 2, LEVELS.length);
    if (nextUnlocked > unlockedLevel) {
        unlockedLevel = nextUnlocked;
        localStorage.setItem("unlockedLevel", String(unlockedLevel));
    }

    if (currentLevelIndex >= LEVELS.length - 1) {
        showVictoryScreen();
        return;
    }

    showLevelCompleteScreen();
}

// Game loop
const clock = new THREE.Clock();

function animate() {

    const dt = clock.getDelta();

    if (input.pause()) {
        if (gameState === GAME_STATES.PLAYING) {
            showPauseScreen();
        } else if (gameState === GAME_STATES.PAUSED) {
            resumeGame();
        }

    }
    if (gameState !== GAME_STATES.PLAYING) {
        input.endFrame();
        renderer.render(scene, camera);
        return;
    }

    if (input.reset()) {
        resetGame();
        input.endFrame();
        renderer.render(scene, camera);
    return;
    }

	if (isGameOver) {
        input.endFrame();
        renderer.render(scene, camera);
        return; 
    }

	if (currentSpeed < MAX_SPEED) {
        currentSpeed += SPEED_INCREMENT * dt;
    }
    hallway.speed = currentSpeed;

	
	//Jump
	if(input.jump() && player.position.y <= GROUND_Y + 1e-4) {
		velY = JUMP_VEL;
	}

    const fastFallMultiplier = input.slide() && player.position.y > GROUND_Y + 1e-4 ? 5 : 1.0;

    //Gravity
	velY -= GRAVITY * fastFallMultiplier *dt;
	player.position.y += velY * dt;

	// Ground collision
	if (player.position.y < GROUND_Y) {
		player.position.y = GROUND_Y;
		velY = 0.0;
	}
	// left right input from input.js
	if (input.left())  player.position.x -= MOVE_SPEED * dt;
	if (input.right()) player.position.x += MOVE_SPEED * dt;

	// Keep the player within hallway bounds
	player.position.x = Math.max(HALLWAY_BOUNDS.minX, Math.min(HALLWAY_BOUNDS.maxX, player.position.x));

    playerBox.setFromObject(player);
    playerBox.expandByScalar(-0.1); 

    const coinsToRemove = [];

    for (const segment of hallway.segments) {
        const spawnGroup = segment.getObjectByName("SpawnGroup");
        if (!spawnGroup) continue;
        
        for (const child of spawnGroup.children) {
            if (child.name === "Coin") {

                coinBox.setFromObject(child);
                coinBox.expandByScalar(-0.1);

                if (playerBox.intersectsBox(coinBox)) {
                    score++;
                    updateScore();
                    if (score >= currentLevel.goalCoins) {
                        levelComplete();
                    }

                    coinsToRemove.push({spawnGroup, coin: child});

                }
            }
        }
    }



    for (const entry of coinsToRemove) {
        entry.spawnGroup.remove(entry.coin);
    }

    if (isInvincible) {
        blinkTimer -= dt;
        blinkAccumulator += dt;

        if (blinkAccumulator > BLINK_INTERVAL) {
            blinkAccumulator = 0;
            player.material.opacity = player.material.opacity === 1 ? 0.3 : 1;
        }

        if (blinkTimer <= 0) {
            isInvincible = false;
            player.material.opacity = 1;
        }
    }

    for (const segment of hallway.segments) {
        const spawnGroup = segment.getObjectByName("SpawnGroup");
        if (!spawnGroup) continue;

        for (const child of spawnGroup.children) {
            if (child.name === "Coin") {
                child.rotation.y += child.userData.spinSpeed * dt;
            }
        }
    }

    if (!isInvincible) {
        let gotHit = false;

        for (const segment of hallway.segments) {
            const spawnGroup = segment.getObjectByName("SpawnGroup");
            if (!spawnGroup) continue;

            for (const child of spawnGroup.children) {
                if (child.name === "Obstacle") {
                    obstacleBox.setFromObject(child);
                    obstacleBox.expandByScalar(-0.1);

                    if (playerBox.intersectsBox(obstacleBox)) {
                        lives--;
                        updateHearts();
                        gotHit = true;

                        if (lives > 0) {
                            isInvincible = true;
                            blinkTimer = BLINK_DURATION;
                            blinkAccumulator = 0;
                            velY = 0.0;
                            
                        } else {
                            isGameOver = true;
                            showGameOverScreen();
                        }
                        break;
                    }
                }
            }

            if (gotHit) break;
        }
    }

    updateHallway(hallway, dt);

    mainLight.position.set(player.position.x + 2, 12, player.position.z + 5);
    mainLight.target.position.set(player.position.x, 0, player.position.z - 15);

    input.endFrame();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
