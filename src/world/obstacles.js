import * as THREE from "three";

// 1. Add 'pit' to our textures list
const TEXTURES = {
  sign: null,
  robot: null,
  trash: null,
  student: null,
  pit: null,
  coin: null,
  alien: null,
  slenderman: null,
  fish: null,
};

const COIN_HEIGHTS = [1.5, 3.5, 4.5];

export function initObstacleModels() {
  const loader = new THREE.TextureLoader();

  TEXTURES.sign = loader.load("/assets/textures/caution_sign.png");
  TEXTURES.robot = loader.load("/assets/textures/starship.png");
  TEXTURES.trash = loader.load("/assets/textures/garbage.png");
  TEXTURES.student = loader.load("/assets/textures/student.png");
  TEXTURES.pit = loader.load("/assets/textures/pit.png");
  TEXTURES.coin = loader.load("/assets/textures/coin.png");
  TEXTURES.alien = loader.load("/assets/textures/alien1.png");
  TEXTURES.slenderman = loader.load("/assets/textures/slenderman.png");
  TEXTURES.fish = loader.load("/assets/textures/fish.png");

  Object.values(TEXTURES).forEach((tex) => {
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
    blocksObstacles: true,
  },
  trash: {
    textureKey: "trash",
    width: 3.0,
    height: 3.0,
    depth: 2.5,
    y: 1.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
  sign: {
    textureKey: "sign",
    width: 2,
    height: 2,
    depth: 2.0,
    y: 0.75,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
  pit: {
    textureKey: "pit",
    width: 4.5,
    height: 5.0,
    depth: 5.0,
    y: 0.2,
    kind: "pit",
    blocksCoins: true,
    blocksObstacles: true,
  },
  student: {
    textureKey: "student",
    width: 3.0,
    height: 5.0,
    depth: 2.5,
    y: 2.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
  coin: {
    textureKey: "coin",
    width: 2.0,
    height: 2.0,
    depth: 2.0,
    y: 1.5,
    kind: "coin",
    blocksCoins: false,
    blocksObstacles: false,
  },
  alien: {
    textureKey: "alien",
    width: 3.0,
    height: 3.0,
    depth: 2.5,
    y: 4.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
  slenderman: {
    textureKey: "slenderman",
    width: 3.0,
    height: 7.0,
    depth: 2.5,
    y: 3.5,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
  fish: {
    textureKey: "fish",
    width: 3.0,
    height: 2.0,
    depth: 2.0,
    y: 2.0,
    kind: "sprite",
    blocksCoins: true,
    blocksObstacles: true,
  },
};

function canPlaceObject(candidate, placedObjects) {
  for (const placed of placedObjects) {
    const laneDiff = Math.abs(candidate.laneIndex - placed.laneIndex);
    const zDiff = Math.abs(candidate.z - placed.z);

    const requiredZGap = candidate.depth / 2 + placed.depth / 2 + 1.5;

    if (laneDiff === 0 && zDiff < requiredZGap) {
      return false;
    }

    if (laneDiff === 1) {
      const wideEnough = candidate.width > 3.5 || placed.width > 3.5;

      if (wideEnough && zDiff < requiredZGap - 0.5) {
        return false;
      }
    }
  }

  return true;
}

function pickWeightedType(types, weights = {}) {
  let totalWeight = 0;

  for (const type of types) {
    totalWeight += weights[type] ?? 1;
  }

  let r = Math.random() * totalWeight;

  for (const type of types) {
    r -= weights[type] ?? 1;
    if (r <= 0) return type;
  }

  return types[types.length - 1];
}

function canPlaceCoin(candidate, placedObjects) {
  for (const placed of placedObjects) {
    const laneDiff = Math.abs(candidate.laneIndex - placed.laneIndex);
    const zDiff = Math.abs(candidate.z - placed.z);

    if (placed.type !== "coin") {
      if (laneDiff === 0 && zDiff < placed.depth / 2 + 3.0) {
        return false;
      }

      if (
        laneDiff <= 1 &&
        placed.type === "pit" &&
        zDiff < placed.depth / 2 + 2.5
      ) {
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

function findValidSpawn({
  laneCenters,
  safeLength,
  placedObjects,
  objectDef,
  type,
  maxAttempts = 30,
}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const laneIndex = Math.floor(Math.random() * laneCenters.length);
    const x = laneCenters[laneIndex];
    const z = Math.random() * safeLength - safeLength / 2;

    const candidate = {
      type,
      laneIndex,
      x,
      z,
      width: objectDef.width,
      depth: objectDef.depth,
    };

    const valid =
      type === "coin"
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
      side: THREE.DoubleSide,
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(spawn.x, def.y, spawn.z);
    mesh.receiveShadow = true;

    mesh.userData.isPit = true;
    mesh.userData.width = def.width;
    mesh.userData.depth = def.depth;
  } else {
    const geometry = new THREE.PlaneGeometry(def.width, def.height);

    let opacity = 1.0;
    if (type === "slenderman") {
      opacity = 0.5;
    }

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    let y = def.y;

    if (type === "alien") {
      y = THREE.MathUtils.randFloat(3.5, 4.5);
    }

    if (type === "fish") {
      y = THREE.MathUtils.randFloat(1.5, 5.0);

      if (Math.random() < 0.5) {
        mesh.scale.x = -1;
      }
    }

    mesh.position.set(spawn.x, y, spawn.z);
    mesh.userData.isPit = false;
    mesh.userData.billboard = true;
  }

  mesh.name = "Obstacle";
  mesh.userData.type = type;
  return mesh;
}

function createCoinFaceTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createRadialGradient(
    size * 0.4,
    size * 0.4,
    0,
    size / 2,
    size / 2,
    size * 0.5,
  );
  bgGrad.addColorStop(0, "#FFE766");
  bgGrad.addColorStop(0.6, "#FFD700");
  bgGrad.addColorStop(1, "#C8A200");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  const innerR = size * 0.35;
  const innerGrad = ctx.createRadialGradient(
    size * 0.45,
    size * 0.42,
    0,
    size / 2,
    size / 2,
    innerR,
  );
  innerGrad.addColorStop(0, "#FFEC80");
  innerGrad.addColorStop(0.5, "#DAA520");
  innerGrad.addColorStop(1, "#B8860B");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, innerR, 0, Math.PI * 2);
  ctx.fillStyle = innerGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100, 60, 0, 0.6)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, innerR - 3, Math.PI * 1.1, Math.PI * 1.8);
  ctx.strokeStyle = "rgba(255, 240, 150, 0.5)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = "bold 180px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(100, 60, 0, 0.5)";
  ctx.fillText("B", size / 2 + 3, size / 2 + 3);
  ctx.fillStyle = "#8B6914";
  ctx.fillText("B", size / 2, size / 2);
  ctx.fillStyle = "rgba(255, 230, 100, 0.3)";
  ctx.fillText("B", size / 2 - 2, size / 2 - 2);

  const rotated = document.createElement("canvas");
  rotated.width = size;
  rotated.height = size;
  const rCtx = rotated.getContext("2d");
  rCtx.translate(size / 2, size / 2);
  rCtx.rotate(-Math.PI / 2);
  rCtx.drawImage(canvas, -size / 2, -size / 2);

  const texture = new THREE.CanvasTexture(rotated);
  texture.needsUpdate = true;
  return texture;
}

function createCoinMesh(_def, spawn) {
  const coinGroup = new THREE.Group();

  const radius = 0.8;
  const thickness = 0.25;

  const bodyGeo = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  const faceTexture = createCoinFaceTexture();

  const sideMat = new THREE.MeshPhongMaterial({
    color: 0xdaa520,
    emissive: 0x996500,
    emissiveIntensity: 0.15,
    specular: 0xffffaa,
    shininess: 120,
  });
  const faceMat = new THREE.MeshPhongMaterial({
    map: faceTexture,
    emissive: 0x996500,
    emissiveIntensity: 0.15,
    specular: 0xffffaa,
    shininess: 120,
  });

  const body = new THREE.Mesh(bodyGeo, [sideMat, faceMat, faceMat]);
  body.castShadow = true;
  body.receiveShadow = true;
  coinGroup.add(body);

  const rimGeo = new THREE.TorusGeometry(radius, 0.08, 12, 32);
  const rimMat = new THREE.MeshPhongMaterial({
    color: 0xb8860b,
    emissive: 0x665000,
    emissiveIntensity: 0.1,
    specular: 0xffffaa,
    shininess: 100,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  coinGroup.add(rim);

  coinGroup.rotation.x = Math.PI / 2;

  const y = COIN_HEIGHTS[Math.floor(Math.random() * COIN_HEIGHTS.length)];
  coinGroup.position.set(spawn.x, y, spawn.z);
  coinGroup.name = "Coin";
  coinGroup.userData.spinSpeed = 5;

  return coinGroup;
}

export function populateObstacles(
  segmentGroup,
  segmentLength,
  hallwayWidth,
  levelConfig = null,
) {
  const safeLength = segmentLength - 4;
  const laneWidth = hallwayWidth / 4;
  const laneCenters = [
    -laneWidth * 1.5,
    -laneWidth * 0.5,
    laneWidth * 0.5,
    laneWidth * 1.5,
  ];

  if (!levelConfig) {
    levelConfig = {
      obstacleTypes: [
        "robot",
        "trash",
        "sign",
        "pit",
        "student",
        "alien",
        "fish",
      ],
      obstacleMin: 1,
      obstacleMax: 3,
      coinMin: 1,
      coinMax: 3,
    };
  }

  const placedObjects = [];
  const obstacleTypes = levelConfig.obstacleTypes;

  const numObstacles =
    Math.floor(
      Math.random() * (levelConfig.obstacleMax - levelConfig.obstacleMin + 1),
    ) + levelConfig.obstacleMin;
  let pitPlaced = false;

  for (let i = 0; i < numObstacles; i++) {
    let type = pickWeightedType(
      obstacleTypes,
      levelConfig.obstacleWeights || {},
    );

    if (type === "pit" && pitPlaced) continue;

    const def = OBSTACLE_TYPES[type];

    const spawn = findValidSpawn({
      laneCenters,
      safeLength,
      placedObjects,
      objectDef: def,
      type,
    });

    if (!spawn) continue;

    const mesh = createObstacleMesh(type, def, spawn);
    if (!mesh) continue;

    segmentGroup.add(mesh);

    placedObjects.push({
      type,
      laneIndex: spawn.laneIndex,
      x: spawn.x,
      z: spawn.z,
      width: def.width,
      depth: def.depth,
    });
    if (type === "pit") pitPlaced = true;
  }
  const numCoins =
    Math.floor(
      Math.random() * (levelConfig.coinMax - levelConfig.coinMin + 1),
    ) + levelConfig.coinMin;

  for (let i = 0; i < numCoins; i++) {
    const type = "coin";
    const def = OBSTACLE_TYPES.coin;

    const spawn = findValidSpawn({
      laneCenters,
      safeLength,
      placedObjects,
      objectDef: def,
      type,
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
      depth: def.depth,
    });
  }
}
