import * as THREE from "three";

let groundTexture;
let jumpTexture;

export function initJoeTextures() {
  const loader = new THREE.TextureLoader();

  groundTexture = loader.load("/assets/textures/bruinskate.png");
  jumpTexture = loader.load("/assets/textures/bruinskate2.png");

  [groundTexture, jumpTexture].forEach(tex => {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
  });
}

export function createJoe() {

  const width = 2;
  const height = 3;

  const geometry = new THREE.PlaneGeometry(width, height);

  const material = new THREE.MeshPhongMaterial({
    map: groundTexture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide
  });

  const joe = new THREE.Mesh(geometry, material);

  joe.position.set(0, 0.5, 1.25);

  joe.castShadow = true;
  joe.receiveShadow = true;

  joe.name = "Player";

  joe.userData = {
    groundMap: groundTexture,
    jumpMap: jumpTexture,
    isJumping: false,
    facingLeft: false,
    billboard: true
  };

  return joe;
}

export function setJoeJump(joe, jumping) {

  if (joe.userData.isJumping === jumping) return;

  joe.userData.isJumping = jumping;

  joe.material.map = jumping
    ? joe.userData.jumpMap
    : joe.userData.groundMap;

  joe.material.needsUpdate = true;
}

export function setJoeDirection(joe, left) {

  joe.userData.facingLeft = left;

  const scale = Math.abs(joe.scale.x);
  joe.scale.x = left ? -scale : scale;
}

export function updateJoe(joe, camera) {

  if (!joe) return;

  joe.lookAt(camera.position.x, joe.position.y, camera.position.z);

  const scale = Math.abs(joe.scale.x);
  joe.scale.x = joe.userData.facingLeft ? -scale : scale;
}