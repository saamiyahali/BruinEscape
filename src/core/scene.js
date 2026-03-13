import * as THREE from "three";
import { camera } from "./camera.js";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // softer shadow edges
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
mainLight.position.set(2, 12, 5);
mainLight.castShadow = true;

mainLight.shadow.camera.left = -12;
mainLight.shadow.camera.right = 12;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -45;
mainLight.shadow.camera.near = 0.1;
mainLight.shadow.camera.far = 80;

mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.bias = -0.002;

scene.add(mainLight);
scene.add(mainLight.target);

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export { scene, renderer, mainLight };
