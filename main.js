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

const GAME_STATES = {
    START: "start",
    LEVEL_SELECT: "level_select",
    PLAYING: "playing",
    GAME_OVER: "game_over",
    VICTORY: "victory"
};

let gameState = GAME_STATES.START;
let unlockedLevel = Number(localStorage.getItem("unlockedLevel") || 1);

const startScreenUI = document.getElementById('start-screen');
const levelSelectScreenUI = document.getElementById('level-select-screen');
const victoryScreenUI = document.getElementById('victory-screen');
const levelButtonsUI = document.getElementById('level-buttons');

const startButton = document.getElementById('start-button');
const levelSelectButton = document.getElementById('level-select-button');
const backToStartButton = document.getElementById('back-to-start-button');
const retryButton = document.getElementById('retry-button');
const gameOverLevelSelectButton = document.getElementById('game-over-level-select-button');
const victoryLevelSelectButton = document.getElementById('victory-level-select-button');

function hideAllMenus() {
    startScreenUI.style.display = 'none';
    levelSelectScreenUI.style.display = 'none';
    gameOverUI.style.display = 'none';
    victoryScreenUI.style.display = 'none';
}

function showStartScreen() {
    gameState = GAME_STATES.START;
    hideAllMenus();
    startScreenUI.style.display = 'block';
}

function showLevelSelectScreen() {
    gameState = GAME_STATES.LEVEL_SELECT;
    hideAllMenus();
    renderLevelButtons();
    levelSelectScreenUI.style.display = 'block';
}

function showGameOverScreen() {
    gameState = GAME_STATES.GAME_OVER;
    updateGameOverScore();
    hideAllMenus();
    gameOverUI.style.display = 'block';
}

function showVictoryScreen() {
    gameState = GAME_STATES.VICTORY;
    hideAllMenus();
    victoryScreenUI.style.display = 'block';
}

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

//Blinking
let blinkTimer = 0;
const BLINK_DURATION = 2.0;
const BLINK_INTERVAL = 0.1;
let blinkAccumulator = 0;

//UI
const heartsUI = document.getElementById('hearts');
const gameOverUI = document.getElementById('game-over');
const scoreUI = document.getElementById('score');
const finalScoreUI = document.getElementById('final-score');


// Hallway
const hallway = createHallway(scene, currentLevel);

function updateScore() {
    scoreUI.innerText = "Coins: " + score;
}

function updateGameOverScore() {
    finalScoreUI.innerText = "Final Score: " + score;
}

function updateHearts() {
    heartsUI.innerText = '❤️'.repeat(lives) + '🖤'.repeat(5 - lives);
}

function renderLevelButtons() {
    levelButtonsUI.innerHTML = "";

    LEVELS.forEach((level, index) => {
        const button = document.createElement("button");
        button.textContent = `Level ${level.id}`;
        button.disabled = level.id > unlockedLevel;

        button.addEventListener("click", () => {
            currentLevelIndex = index;
            currentLevel = LEVELS[currentLevelIndex];
            hallway.setLevelConfig(currentLevel);
            resetGame();
            hideAllMenus();
            gameState = GAME_STATES.PLAYING;
        });

        levelButtonsUI.appendChild(button);
    });
}

startButton.addEventListener("click", () => {
    currentLevelIndex = 0;
    currentLevel = LEVELS[currentLevelIndex];
    hallway.setLevelConfig(currentLevel);
    resetGame();
    hideAllMenus();
    gameState = GAME_STATES.PLAYING;
});

levelSelectButton.addEventListener("click", showLevelSelectScreen);
backToStartButton.addEventListener("click", showStartScreen);

retryButton.addEventListener("click", () => {
    resetGame();
    hideAllMenus();
    gameState = GAME_STATES.PLAYING;
});

gameOverLevelSelectButton.addEventListener("click", showLevelSelectScreen);
victoryLevelSelectButton.addEventListener("click", showLevelSelectScreen);

function resetGame() {
    lives = 5;
    currentSpeed = currentLevel.speed;
    score = 0;
    
    isGameOver = false;
    isInvincible = false;
    gameOverUI.style.display = 'none';

    updateScore();
    updateHearts();

    player.position.set(0, GROUND_Y, 0);
    velY = 0.0;

    hallway.resetSegments();
}

function levelComplete() {
    const nextUnlocked = Math.min(currentLevelIndex + 2, LEVELS.length);
    if (nextUnlocked > unlockedLevel) {
        unlockedLevel = nextUnlocked;
        localStorage.setItem("unlockedLevel", String(unlockedLevel));
    }

    currentLevelIndex++;

    if (currentLevelIndex >= LEVELS.length) {
        showVictoryScreen();
        return;
    }

    currentLevel = LEVELS[currentLevelIndex];
    hallway.setLevelConfig(currentLevel);
    resetGame();
}

// Game loop
const clock = new THREE.Clock();

function animate() {

    if (gameState !== GAME_STATES.PLAYING) {
        renderer.render(scene, camera);
        return;
    }

	if (isGameOver) {
        if (input.jump()) resetGame(); 
        return; 
    }
	const dt = clock.getDelta();
	if (currentSpeed < MAX_SPEED) {
        currentSpeed += SPEED_INCREMENT * dt;
    }
    hallway.speed = currentSpeed;
	
	//Jump
	if(input.jump() && player.position.y <= GROUND_Y + 1e-4) {
		velY = JUMP_VEL;
	}

    //Gravity
	velY -= GRAVITY * dt;
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
