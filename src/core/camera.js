import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera(
	60, window.innerWidth / window.innerHeight, 0.1, 500
);
camera.position.set(0, 6, 10);
camera.lookAt(0, 2, -10);

export { camera };
