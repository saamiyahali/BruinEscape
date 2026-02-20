import * as THREE from "three";

const SEGMENT_LENGTH = 40;
const SEGMENT_COUNT = 5;
const HALLWAY_WIDTH = 15;
const HALLWAY_SPEED = 15.0;

class HallwayManager {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.speed = HALLWAY_SPEED;

    this.floorGeo = new THREE.PlaneGeometry(HALLWAY_WIDTH, SEGMENT_LENGTH);
    this.floorMat = new THREE.MeshPhongMaterial({ color: 0x333333, side: THREE.DoubleSide });

    this.wallGeo = new THREE.BoxGeometry(1, 10, SEGMENT_LENGTH);
    this.wallMat = new THREE.MeshPhongMaterial({ color: 0xeecfa1 });

    this.beamGeo = new THREE.BoxGeometry(HALLWAY_WIDTH, 1, 1);
    this.beamMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zPos = -i * SEGMENT_LENGTH;
      const segment = this.createSegment(zPos);
      this.segments.push(segment);
      this.scene.add(segment);
    }
  }

  update(dt) {
    for (const segment of this.segments) {
      segment.position.z += this.speed * dt;
    }

    const first = this.segments[0];

    // recycle the hallway segment when the segment’s center passes +L/2
    if (first.position.z > SEGMENT_LENGTH) {
      const recycled = this.segments.shift();
      const lastZ = this.segments[this.segments.length - 1].position.z;
      recycled.position.z = lastZ - SEGMENT_LENGTH;
      this.segments.push(recycled);
    }
  }

  createSegment(zStart) {
    const group = new THREE.Group();
    group.position.z = zStart;

    // floor
    const floor = new THREE.Mesh(this.floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.frustumCulled = false; 
    group.add(floor);

    // walls
    const leftWall = new THREE.Mesh(this.wallGeo, this.wallMat);
    leftWall.position.set(-HALLWAY_WIDTH / 2, 5, 0);
    leftWall.frustumCulled = false;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(this.wallGeo, this.wallMat);
    rightWall.position.set(HALLWAY_WIDTH / 2, 5, 0);
    rightWall.frustumCulled = false; 
    group.add(rightWall);

    // beams
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(this.beamGeo, this.beamMat);
      beam.position.set(0, 9, (i * 10) - 15);
      beam.frustumCulled = false; 
      group.add(beam);
    }

    return group;
  }
}

export function createHallway(scene) {
  return new HallwayManager(scene);
}

export function updateHallway(hallway, dt) {
  hallway.update(dt);
}