import * as THREE from "three";
import { populateObstacles } from "./obstacles.js";

const SEGMENT_LENGTH = 40; // length of hallway segment
const SEGMENT_COUNT = 5; // number of segments generated at a time
const HALLWAY_WIDTH = 14;
const HALLWAY_SPEED = 15;

// boelter hall colors
const COLORS = {
  floorBase: 0xeeeeee,
  floorGrey: 0x666666,
  floorPink: 0xd6a8a8,
  wall: 0xf5f5dc,
  door: 0xc48f28,
  beamDark: 0x5e5d5c,
  beamRed: 0x880000,
  goldText: 0x7d6522,
};

class HallwayManager {
  constructor(scene, levelConfig) {
    this.scene = scene;
    this.segments = []; // stores the 5 hallway segments
    this.speed = levelConfig?.speed ?? HALLWAY_SPEED; // forward speed of the hallway, can be modified by level config

    // geometries
    this.wallGeo = new THREE.BoxGeometry(1, 10, SEGMENT_LENGTH);
    this.wallMat = new THREE.MeshPhongMaterial({ color: COLORS.wall });

    this.ceilingGeo = new THREE.PlaneGeometry(HALLWAY_WIDTH, SEGMENT_LENGTH);
    this.ceilingMat = new THREE.MeshPhongMaterial({color: 0xe8e8dc,side: THREE.DoubleSide,});

    this.doorGeo = new THREE.BoxGeometry(0.5, 7, 4);
    this.doorMat = new THREE.MeshPhongMaterial({ color: COLORS.door });

    this.beamGeo = new THREE.BoxGeometry(HALLWAY_WIDTH + 2, 1.5, 2);
    this.beamLegGeo = new THREE.BoxGeometry(1.2, 10, 2);
    this.signPlaneGeo = new THREE.PlaneGeometry(HALLWAY_WIDTH, 1.5);

    // materials
    this.matBeamRed = new THREE.MeshPhongMaterial({ color: COLORS.beamRed });
    this.matBeamDark = new THREE.MeshPhongMaterial({ color: COLORS.beamDark });

    // paint the Boelter Hall text onto a texture
    const textTexture = this.createSignTexture("Boelter Hall");
    this.matSignFace = new THREE.MeshBasicMaterial({ map: textTexture });

    const tileSize = HALLWAY_WIDTH / 10;
    this.tileSize = tileSize;
    this.rows = Math.round(SEGMENT_LENGTH / tileSize);
    this.tileSizeZ = SEGMENT_LENGTH / this.rows;
    this.tileGeo = new THREE.PlaneGeometry(tileSize, this.tileSizeZ);

    // floor materials for the white, grey, pink tiles
    this.matBase = new THREE.MeshPhongMaterial({
      color: COLORS.floorBase,
      side: THREE.DoubleSide,
    });
    this.matGrey = new THREE.MeshPhongMaterial({
      color: COLORS.floorGrey,
      side: THREE.DoubleSide,
    });
    this.matPink = new THREE.MeshPhongMaterial({
      color: COLORS.floorPink,
      side: THREE.DoubleSide,
    });

    // for tiley look, create a grid material and edge geometry for outlines
    this.gridMat = new THREE.LineBasicMaterial({
      color: 0x555555,
      opacity: 0.15,
      transparent: true,
    });
    this.tileOutlineGeo = new THREE.EdgesGeometry(this.tileGeo);

    // initlialize the first 5 segments and place them consecutively
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zPos = -i * SEGMENT_LENGTH;
      const segment = this.createSegment(zPos, i, i === 0);
      this.segments.push(segment);
      this.scene.add(segment);
    }
  }

  setLevelConfig(levelConfig) {
    this.levelConfig = levelConfig;
    for (const segment of this.segments) {
      this.repopulateSegment(segment);
    }
  }

  repopulateSegment(segment) {
    const spawnGroup = segment.getObjectByName("SpawnGroup");
    if (!spawnGroup) return;

    spawnGroup.clear();

    populateObstacles(
      spawnGroup,
      SEGMENT_LENGTH,
      HALLWAY_WIDTH,
      this.levelConfig,
    );
  }

  resetSegments() {
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const segment = this.segments[i];
      segment.position.z = -i * SEGMENT_LENGTH;
      const spawnGroup = segment.getObjectByName("SpawnGroup");
      if (!spawnGroup) continue;
      spawnGroup.clear();
      if (i !== 0) {
        populateObstacles(
          spawnGroup,
          SEGMENT_LENGTH,
          HALLWAY_WIDTH,
          this.levelConfig,
        );
      }
    }
  }

  // create canvas texture for the text "sign" on the beam
  createSignTexture(text) {
    const canvas = document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // text details
    ctx.font = "bold 120px Arial";
    ctx.fillStyle = "#b79c15cd";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // shadow for the text
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update(dt) {
    // move all segments forward
    for (const segment of this.segments) {
      segment.position.z += this.speed * dt;
    }

    // if the whole first segment has moved past the camera, recycle it to the back of the hallway
    const first = this.segments[0];
    if (first.position.z > SEGMENT_LENGTH) {
      const recycled = this.segments.shift();
      const lastZ = this.segments[this.segments.length - 1].position.z;
      recycled.position.z = lastZ - SEGMENT_LENGTH;

      this.repopulateSegment(recycled);
      this.segments.push(recycled);
    }
  }

  createSegment(zStart, index, skipsawns = false) {
    const group = new THREE.Group();
    group.position.z = zStart;

    // calculate how many rows fit in the 40 units
    const cols = 10;
    const rows = this.rows;
    const tileGroup = new THREE.Group();
    tileGroup.rotation.x = -Math.PI / 2;

    // place tiles in grid, logic for calculating color pattern
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        let mat = this.matBase;
        if (x === 1 || x === 8) mat = this.matGrey;
        if (x >= 3 && x <= 6) {
          const pRow = (z + index * rows) % 8;
          if (pRow >= 2) {
            const isEdge = pRow === 2 || pRow === 7 || x === 3 || x === 6;
            mat = isEdge ? this.matPink : this.matGrey;
          }
        }
        const tile = new THREE.Mesh(this.tileGeo, mat);
        const xPos = x * this.tileSize - HALLWAY_WIDTH / 2 + this.tileSize / 2;
        const zPos =
          z * this.tileSizeZ - SEGMENT_LENGTH / 2 + this.tileSizeZ / 2;
        tile.position.set(xPos, zPos, 0);
        tile.receiveShadow = true;
        tile.frustumCulled = false;
        tileGroup.add(tile);

        // add wireframe grid
        const outline = new THREE.LineSegments(
          this.tileOutlineGeo,
          this.gridMat,
        );
        outline.position.set(xPos, zPos, 0.005);
        outline.frustumCulled = false;
        tileGroup.add(outline);
      }
    }
    group.add(tileGroup);

    // place walls
    const leftWall = new THREE.Mesh(this.wallGeo, this.wallMat);
    leftWall.position.set(-HALLWAY_WIDTH / 2 - 0.5, 5, 0);
    leftWall.frustumCulled = false;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(this.wallGeo, this.wallMat);
    rightWall.position.set(HALLWAY_WIDTH / 2 + 0.5, 5, 0);
    rightWall.frustumCulled = false;
    group.add(rightWall);

    // doors
    const door1 = new THREE.Mesh(this.doorGeo, this.doorMat);
    door1.position.set(-HALLWAY_WIDTH / 2 + 0.2, 3.5, -10);
    door1.frustumCulled = false;
    group.add(door1);

    const door2 = new THREE.Mesh(this.doorGeo, this.doorMat);
    door2.position.set(HALLWAY_WIDTH / 2 - 0.2, 3.5, 10);
    door2.frustumCulled = false;
    group.add(door2);

    const ceiling = new THREE.Mesh(this.ceilingGeo, this.ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 10, 0); // same general top height as walls
    ceiling.receiveShadow = true;
    ceiling.castShadow = false;
    ceiling.frustumCulled = false;
    group.add(ceiling);

    // beam
    const isSignBeam = index === 0;
    const zBeam = 18;

    // main beam
    // the first segment will have the boelter sign beam, the rest are red
    const beamMat = isSignBeam ? this.matBeamDark : this.matBeamRed;
    const beamMesh = new THREE.Mesh(this.beamGeo, beamMat);
    beamMesh.position.set(0, 9.25, zBeam);
    beamMesh.frustumCulled = false;
    group.add(beamMesh);

    // sign
    if (isSignBeam) {
      const signMesh = new THREE.Mesh(this.signPlaneGeo, this.matSignFace);
      signMesh.position.set(0, 9.25, zBeam + 1.01);
      signMesh.frustumCulled = false;
      group.add(signMesh);
    }

    const legLeft = new THREE.Mesh(this.beamLegGeo, beamMat);
    legLeft.position.set(-(HALLWAY_WIDTH / 2) + 0.6, 5, zBeam);
    legLeft.frustumCulled = false;
    group.add(legLeft);

    const legRight = new THREE.Mesh(this.beamLegGeo, beamMat);
    legRight.position.set(HALLWAY_WIDTH / 2 - 0.6, 5, zBeam);
    legRight.frustumCulled = false;
    group.add(legRight);

    const spawnGroup = new THREE.Group();
    spawnGroup.name = "SpawnGroup";
    group.add(spawnGroup);

    if (!skipsawns) {
      populateObstacles(spawnGroup, SEGMENT_LENGTH, HALLWAY_WIDTH);
    }

    return group;
  }
}

export function createHallway(scene, levelConfig) {
  return new HallwayManager(scene, levelConfig);
}

export function updateHallway(hallway, dt) {
  hallway.update(dt);
}
