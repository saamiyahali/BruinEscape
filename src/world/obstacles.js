import * as THREE from "three";

// 1. Add 'pit' to our textures list
const TEXTURES = {
  sign: null,
  robot: null,
  trash: null,
  student: null,
  pit: null,
  coin: null
};

export function initObstacleModels() {
  const loader = new THREE.TextureLoader();

  TEXTURES.sign = loader.load('/assets/textures/caution_sign.png');
  TEXTURES.robot = loader.load('/assets/textures/starship.png');
  TEXTURES.trash = loader.load('/assets/textures/garbage.png');
  TEXTURES.student = loader.load('/assets/textures/student.png');
  TEXTURES.pit = loader.load('/assets/textures/pit.png');
  TEXTURES.coin = loader.load('/assets/textures/coin.png');
  
  Object.values(TEXTURES).forEach(tex => {
    if (tex) {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
    }
  });
}

export function populateObstacles(segmentGroup, segmentLength, hallwayWidth) {
  const safeLength = segmentLength - 4; 
  const laneWidth = hallwayWidth / 4;
  const lanes = [
    -laneWidth * 1.5, 
    -laneWidth * 0.5, 
     laneWidth * 0.5, 
     laneWidth * 1.5  
  ];

  const numObstacles = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numObstacles; i++) {
    const rand = Math.random();
    
    let texture = null;
    let scaleX = 2, scaleY = 2; 
    let heightOffset = 1; 
    let isPit = false; 

    // Robot: 30% chance (0.00 to 0.30)
    if (rand < 0.30) {
      texture = TEXTURES.robot;
      scaleX = 3.0; scaleY = 2; 
      heightOffset = 0.75;
    } 
    // Trash: 25% chance (0.30 to 0.55)
    else if (rand < 0.55) {
      texture = TEXTURES.trash;
      scaleX = 3; scaleY = 3; 
      heightOffset = 1.0;
    } 
    // Sign: 25% chance (0.55 to 0.80)
    else if (rand < 0.80) {
      texture = TEXTURES.sign;
      scaleX = 1.5; scaleY = 1.5; 
      heightOffset = 0.75; 
    } 
    // Pit: 15% chance (0.80 to 0.95)
    else if (rand < 0.95) {
      texture = TEXTURES.pit;
      scaleX = 6; scaleY = 5; 
      isPit = true; 
    } 
    // Student: 5% chance (0.95 to 1.00)
    else {
      texture = TEXTURES.student;
      scaleX = 3.0; scaleY = 5.0; 
      heightOffset = 2.5;
    }

    if (!texture) continue;

    const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
    const randomZ = (Math.random() * safeLength) - (safeLength / 2);

    let obstacleMesh;

    if (isPit) {
      const geometry = new THREE.PlaneGeometry(scaleX, scaleY);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true 
      });
      obstacleMesh = new THREE.Mesh(geometry, material);
      
      obstacleMesh.rotation.x = -Math.PI / 2;
      
      obstacleMesh.position.set(randomLane, 0.01, randomZ);
    } else {
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      obstacleMesh = new THREE.Sprite(material);
      obstacleMesh.scale.set(scaleX, scaleY, 1);
      obstacleMesh.position.set(randomLane, heightOffset, randomZ);
    }
    
    obstacleMesh.name = "Obstacle"; 
    
    segmentGroup.add(obstacleMesh);
  }


  const numCoins = Math.floor (Math.random() * 3) + 1;
  for (let i = 0; i < numCoins; i++) {
    if (!TEXTURES.coin) continue;

    const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
    const randomZ = (Math.random() * safeLength) - (safeLength /2);

    const coinMaterial = new THREE.SpriteMaterial({ map: TEXTURES.coin, transparent: true});
    const coinMesh = new THREE.Sprite(coinMaterial);
    coinMesh.scale.set(2,2,1);
    coinMesh.position.set(randomLane, 1.5, randomZ);
    coinMesh.name = "Coin";

    segmentGroup.add(coinMesh);

  }
}