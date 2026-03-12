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

const COIN_HEIGHTS = [1.5, 3.5]

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

const OBSTACLE_TYPES = {
  robot: {
    textureKey: "robot",
    width: 3.5,
    height: 2.5,
    depth: 2.5,
    y: 0.75,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true
  },
  trash: {
    textureKey: "trash",
    width: 3.0,
    height: 3.0,
    depth: 2.5,
    y: 1.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true
  },
  sign: {
    textureKey: "sign",
    width: 2,
    height: 2,
    depth: 2.0,
    y: 0.75,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true
  },
  pit: {
    textureKey: "pit",
    width: 6.0,
    height: 5.0,
    depth: 5.0,
    y: 0.2,
    kind: "pit",
    blocksCoins: true,
    blocksObstacles: true
  },
  student: {
    textureKey: "student",
    width: 3.0,
    height: 5.0,
    depth: 2.5,
    y: 2.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true
  },
  coin: {
    textureKey: "coin",
    width: 2.0,
    height: 2.0,
    depth: 2.0,
    y: 1.5,
    kind: "coin",
    blocksCoins: false,
    blocksObstacles: false
  }
};


function canPlaceObject(candidate, placedObjects) {
  for (const placed of placedObjects) {
    const laneDiff = Math.abs(candidate.laneIndex - placed.laneIndex);
    const zDiff = Math.abs(candidate.z - placed.z);

    const requiredZGap = (candidate.depth / 2) + (placed.depth / 2) + 1.5;

    if (laneDiff === 0 && zDiff < requiredZGap) {
      return false;
    }

    if (laneDiff === 1) {
      const wideEnough =
        candidate.width > 3.5 || placed.width > 3.5;

      if (wideEnough && zDiff < requiredZGap - 0.5) {
        return false;
      }
    }
  }

  return true;
}




function canPlaceCoin(candidate, placedObjects) {
  for (const placed of placedObjects) {
    const laneDiff = Math.abs(candidate.laneIndex - placed.laneIndex);
    const zDiff = Math.abs(candidate.z - placed.z);

    if (placed.type !== "coin") {
      if (laneDiff === 0 && zDiff < placed.depth / 2 + 3.0) {
        return false;
      }

      if (laneDiff <= 1 && placed.type === "pit" && zDiff < placed.depth / 2 + 2.5) {
        return false;
      }
    }

    if (placed.type === "coin") {
      if (laneDiff === 0 && zDiff < 2.5) {
        return false;
      }
    }
  }

  return true;
}




function findValidSpawn({ laneCenters, safeLength, placedObjects, objectDef, type, maxAttempts = 30 }) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const laneIndex = Math.floor(Math.random() * laneCenters.length);
    const x = laneCenters[laneIndex];
    const z = (Math.random() * safeLength) - (safeLength / 2);

    const candidate = {
      type,
      laneIndex,
      x,
      z,
      width: objectDef.width,
      depth: objectDef.depth
    };

    const valid = type === "coin"
      ? canPlaceCoin(candidate, placedObjects)
      : canPlaceObject(candidate, placedObjects);

    if (valid) {
      return candidate;
    }
  }

  return null;
}




function createObstacleMesh(type, def, spawn) {
  const texture = TEXTURES[def.textureKey];
  if (!texture) return null;

  let mesh;

  if (def.kind === "pit") {
    const geometry = new THREE.PlaneGeometry(def.width, def.depth);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(spawn.x, def.y, spawn.z);

    mesh.userData.isPit = true;
    mesh.userData.width = def.width;
    mesh.userData.depth = def.depth;
  } else {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    mesh = new THREE.Sprite(material);
    mesh.scale.set(def.width, def.height, 1);
    mesh.position.set(spawn.x, def.y, spawn.z);

    mesh.userData.isPit = false;
  }

  mesh.name = "Obstacle";
  mesh.userData.type = type;
  return mesh;
}







function createCoinMesh(def, spawn) {
  const texture = TEXTURES[def.textureKey];
  if (!texture) return null;

  const coinGroup = new THREE.Group();

  const geometry = new THREE.PlaneGeometry(def.width, def.height);

  const frontMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide
  });

  const backMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide
  });

  const frontMesh = new THREE.Mesh(geometry, frontMaterial);
  const backMesh = new THREE.Mesh(geometry, backMaterial);

  frontMesh.position.z = 0.01;
  backMesh.rotation.y = Math.PI;
  backMesh.position.z = -0.01;

  coinGroup.add(frontMesh);
  coinGroup.add(backMesh);

  const y = COIN_HEIGHTS[Math.floor(Math.random() * COIN_HEIGHTS.length)];
  coinGroup.position.set(spawn.x, y, spawn.z);
  coinGroup.name = "Coin";
  coinGroup.userData.spinSpeed = 5;

  return coinGroup;
}






export function populateObstacles(segmentGroup, segmentLength, hallwayWidth, levelConfig = null) {
  const safeLength = segmentLength - 4; 
  const laneWidth = hallwayWidth / 4;
  const laneCenters = [
    -laneWidth * 1.5, 
    -laneWidth * 0.5, 
     laneWidth * 0.5, 
     laneWidth * 1.5  
  ];

  if (!levelConfig) {
    levelConfig = {
      obstacleTypes: ["robot", "trash", "sign", "pit", "student"],
      obstacleMin: 1,
      obstacleMax: 3,
      coinMin: 1,
      coinMax: 3
    };
  }


  const placedObjects = [];
  const obstacleTypes = levelConfig.obstacleTypes;

  const numObstacles = Math.floor(Math.random() * (levelConfig.obstacleMax - levelConfig.obstacleMin + 1)) + levelConfig.obstacleMin;
  let pitPlaced = false;

  for (let i = 0; i < numObstacles; i++) {
    let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    if (type === "pit" && pitPlaced) continue;

    const def = OBSTACLE_TYPES[type];

    const spawn = findValidSpawn({
      laneCenters,
      safeLength,
      placedObjects,
      objectDef: def,
      type
    });

    if (!spawn) continue;

    const mesh = createObstacleMesh (type, def, spawn);
    if (!mesh) continue;

    segmentGroup.add(mesh);

    placedObjects.push({
      type,
      laneIndex: spawn.laneIndex,
      x: spawn.x,
      z: spawn.z,
      width: def.width,
      depth: def.depth
    });
    if (type === "pit") pitPlaced = true;

  }
  const numCoins = Math.floor(Math.random() * (levelConfig.coinMax - levelConfig.coinMin + 1)) + levelConfig.coinMin;

  for (let i = 0; i < numCoins; i++) {
    const type = "coin";
    const def = OBSTACLE_TYPES.coin;

    const spawn = findValidSpawn({
      laneCenters,
      safeLength,
      placedObjects,
      objectDef: def,
      type
    });

    if (!spawn) continue;

    const mesh = createCoinMesh(def, spawn);
    if (!mesh) continue;

    segmentGroup.add(mesh);

    placedObjects.push({
      type,
      laneIndex: spawn.laneIndex,
      x: spawn.x,
      z: spawn.z,
      width: def.width,
      depth: def.depth
    });
  }
}
