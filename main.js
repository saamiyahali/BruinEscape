import * as THREE from 'three';
import { scene, renderer } from './src/core/scene.js';
import { camera } from './src/core/camera.js';
import { Input } from './src/player/input.js';
import { createHallway, updateHallway } from './src/world/hallway.js';
import { HALLWAY_BOUNDS } from './src/world/bounds.js';

// Placeholder cube, this is where we add joe.js
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshPhongMaterial({ color: 0x3284bf });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
player.castShadow = true;
scene.add(player);

// Hallway
const hallway = createHallway(scene);

// Placeholder input, add input.js here
const input = new Input();

// Gravity
const GRAVITY = 30.0;
const JUMP_VEL = 12.0;
const GROUND_Y = 1.0;

let velY = 0.0;

// Player movement constants
const MOVE_SPEED = 8.0;

// Game loop
const clock = new THREE.Clock();

function animate() {
	const dt = clock.getDelta();

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

	// Scroll hallway
	updateHallway(hallway, dt);
	input.endFrame();
	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
