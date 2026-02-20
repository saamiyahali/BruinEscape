import * as THREE from "three";

const SEGMENT_LENGTH = 40;
const SEGMENT_COUNT = 5;
const HALLWAY_WIDTH = 14;
const HALLWAY_SPEED = 15.0;

const COLORS = {
  floorBase: 0xeeeeee,
  floorGrey: 0x666666,
  floorPink: 0xd6a8a8,
  wall: 0xf5f5dc,
  door: 0xc48f28,
  beamDark: 0x5e5d5c,    
  beamRed: 0x880000,  
  goldText: 0x7d6522
};

class HallwayManager {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.speed = HALLWAY_SPEED;

    // geometries
    this.wallGeo = new THREE.BoxGeometry(1, 10, SEGMENT_LENGTH);
    this.wallMat = new THREE.MeshPhongMaterial({ color: COLORS.wall });

    this.doorGeo = new THREE.BoxGeometry(0.5, 7, 4);
    this.doorMat = new THREE.MeshPhongMaterial({ color: COLORS.door });

    this.beamGeo = new THREE.BoxGeometry(HALLWAY_WIDTH + 2, 1.5, 2);
    this.beamLegGeo = new THREE.BoxGeometry(1.2, 10, 2);
    this.signPlaneGeo = new THREE.PlaneGeometry(HALLWAY_WIDTH, 1.5);

    // materials
    this.matBeamRed = new THREE.MeshPhongMaterial({ color: COLORS.beamRed });
    this.matBeamDark = new THREE.MeshPhongMaterial({ color: COLORS.beamDark });

    const textTexture = this.createSignTexture("Boelter Hall");
    this.matSignFace = new THREE.MeshBasicMaterial({ map: textTexture });

    // floor materials
    const tileSize = HALLWAY_WIDTH / 10;
    this.tileSize = tileSize;
    this.tileGeo = new THREE.PlaneGeometry(tileSize, tileSize);
    this.matBase = new THREE.MeshPhongMaterial({ color: COLORS.floorBase, side: THREE.DoubleSide });
    this.matGrey = new THREE.MeshPhongMaterial({ color: COLORS.floorGrey, side: THREE.DoubleSide });
    this.matPink = new THREE.MeshPhongMaterial({ color: COLORS.floorPink, side: THREE.DoubleSide });

    this.gridMat = new THREE.LineBasicMaterial({ 
      color: 0x555555, opacity: 0.15, transparent: true 
    });
    this.tileOutlineGeo = new THREE.EdgesGeometry(this.tileGeo);

    // initlialize segments
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zPos = -i * SEGMENT_LENGTH;
      const segment = this.createSegment(zPos, i);
      this.segments.push(segment);
      this.scene.add(segment);
    }
  }

  createSignTexture(text) {
    const canvas = document.createElement('canvas');

    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // text details
    ctx.font = 'bold 120px Arial'; 
    ctx.fillStyle = '#b79c15cd';   
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // shadow for the text
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update(dt) {
    for (const segment of this.segments) {
      segment.position.z += this.speed * dt;
    }

    const first = this.segments[0];
    if (first.position.z > SEGMENT_LENGTH) {
      const recycled = this.segments.shift();
      const lastZ = this.segments[this.segments.length - 1].position.z;
      recycled.position.z = lastZ - SEGMENT_LENGTH;
      this.segments.push(recycled);
    }
  }

  createSegment(zStart, index) {
    const group = new THREE.Group();
    group.position.z = zStart;

    // floor
    const cols = 10;
    const rows = Math.ceil(SEGMENT_LENGTH / this.tileSize);
    const tileGroup = new THREE.Group();
    tileGroup.rotation.x = -Math.PI / 2;

    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        let mat = this.matBase;
        if (x === 1 || x === 8) mat = this.matGrey;
        if (x >= 3 && x <= 6) {
          const pRow = z % 8;
          if (pRow >= 2) {
             const isEdge = (pRow === 2 || pRow === 7 || x === 3 || x === 6);
             mat = isEdge ? this.matPink : this.matGrey;
          }
        }
        const tile = new THREE.Mesh(this.tileGeo, mat);
        const xPos = (x * this.tileSize) - (HALLWAY_WIDTH / 2) + (this.tileSize / 2);
        const zPos = (z * this.tileSize) - (SEGMENT_LENGTH / 2) + (this.tileSize / 2);
        tile.position.set(xPos, zPos, 0);
        tile.frustumCulled = false;
        tileGroup.add(tile);
        
        const outline = new THREE.LineSegments(this.tileOutlineGeo, this.gridMat);
        outline.position.set(xPos, zPos, 0.005);
        outline.frustumCulled = false;
        tileGroup.add(outline);
      }
    }
    group.add(tileGroup);

    // walls
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
    door1.position.set(-HALLWAY_WIDTH/2 + 0.2, 3.5, -10);
    door1.frustumCulled = false;
    group.add(door1);

    const door2 = new THREE.Mesh(this.doorGeo, this.doorMat);
    door2.position.set(HALLWAY_WIDTH/2 - 0.2, 3.5, 10);
    door2.frustumCulled = false;
    group.add(door2);

    // beam
    const isSignBeam = (index === 0);
    const zBeam = 18; 

    // main beam
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
    legLeft.position.set(-(HALLWAY_WIDTH/2) + 0.6, 5, zBeam);
    legLeft.frustumCulled = false;
    group.add(legLeft);

    const legRight = new THREE.Mesh(this.beamLegGeo, beamMat);
    legRight.position.set((HALLWAY_WIDTH/2) - 0.6, 5, zBeam);
    legRight.frustumCulled = false;
    group.add(legRight);

    return group;
  }
}

export function createHallway(scene) {
  return new HallwayManager(scene);
}

export function updateHallway(hallway, dt) {
  hallway.update(dt);
}