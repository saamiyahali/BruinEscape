import * as THREE from 'three';
import { scene, renderer } from './src/core/scene.js';
import { camera } from './src/core/camera.js';
import { Input } from './src/player/input.js';
import { createHallway, updateHallway } from './src/world/hallway.js';
import { HALLWAY_BOUNDS } from './src/world/bounds.js';
import { initObstacleModels } from './src/world/obstacles.js';

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
scene.add(player);

initObstacleModels();
// Hallway
const hallway = createHallway(scene);

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
const MAX_SPEED = 45.0;

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

function updateScore() {
    scoreUI.innerText = "Coins: " + score;
}

function updateGameOverScore() {
    finalScoreUI.innerText = "Final Score: " + score;
}

function updateHearts() {
    heartsUI.innerText = '❤️'.repeat(lives) + '🖤'.repeat(5 - lives);
}

function resetGame() {
    lives = 5;
    currentSpeed = 15.0;
    score = 0;
    
    isGameOver = false;
    isInvincible = false;
    gameOverUI.style.display = 'none';

    updateScore();
    updateHearts();

    player.position.set(0, GROUND_Y, 0);
    velY = 0.0;

    for (let i = 0; i < hallway.segments.length; i++) {
        hallway.segments[i].position.z = -i * 40;
    }
}

// Game loop
const clock = new THREE.Clock();

function animate() {

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
                            updateGameOverScore();
                            gameOverUI.style.display = 'block';
                        }
                        break;
                    }
                }
            }

            if (gotHit) break;
        }
    }

    updateHallway(hallway, dt);
    input.endFrame();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
