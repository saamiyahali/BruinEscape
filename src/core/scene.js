import * as THREE from 'three';
import { camera } from './camera.js';

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const ceilingLight = new THREE.PointLight(0xffffff, 80, 50);
ceilingLight.position.set(0, 9, 0);
ceilingLight.castShadow = true;
scene.add(ceilingLight);

// Resize handling
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

export { scene, renderer };
