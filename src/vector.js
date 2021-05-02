export class Vector3f {
  constructor(x, y, z) {
    return { x, y, z };
  }

  add = (vector) => {
    return {
      x: this.x + vector.x,
      y: this.y + vector.y,
      z: this.z + vector.z,
    };
  };
  sub = (vector) => {
    return {
      x: this.x - vector.x,
      y: this.y - vector.y,
      z: this.z - vector.z,
    };
  };
}
