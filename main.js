import * as THREE from 'three';
import { scene, renderer } from './src/core/scene.js';
import { camera } from './src/core/camera.js';
import { Input } from './src/player/input.js';
import { createHallway, updateHallway } from './src/world/hallway.js';
import { HALLWAY_BOUNDS } from './src/world/bounds.js';
import { initObstacleModels } from './src/world/obstacles.js';

// Placeholder cube, this is where we add joe.js
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshPhongMaterial({ color: 0x3284bf });
const player = new THREE.Mesh(playerGeo, playerMat);
const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();
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

let lives = 5;
let isInvincible = false;
let isGameOver = false;
let currentSpeed = 15.0; 
const SPEED_INCREMENT = 0.2; 
const MAX_SPEED = 45.0;

const heartsUI = document.getElementById('hearts');
const gameOverUI = document.getElementById('game-over');

function updateHearts() {
    heartsUI.innerText = '❤️'.repeat(lives) + '🖤'.repeat(5 - lives);
}

function resetGame() {
    lives = 5;
    currentSpeed = 15.0;
    isGameOver = false;
    isInvincible = false;
    gameOverUI.style.display = 'none';
    updateHearts();
    player.position.set(0, GROUND_Y, 0);
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

if (!isInvincible) {
        for (const segment of hallway.segments) {
            for (const child of segment.children) {
                if (child.name === "Obstacle") {
                    obstacleBox.setFromObject(child);
                    if (playerBox.intersectsBox(obstacleBox)) {
                        lives--;
                        updateHearts();

                        if (lives > 0) {
                            isInvincible = true;
                            player.position.set(0, GROUND_Y, 0);
                            for (let i = 0; i < hallway.segments.length; i++) {
                                hallway.segments[i].position.z = -i * 40;
                            }
                            setTimeout(() => { isInvincible = false; }, 1000);
                        } else {
                            isGameOver = true;
                            gameOverUI.style.display = 'block';
                        }
                    }
                }
            }
        }
    }

    updateHallway(hallway, dt);
    input.endFrame();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
