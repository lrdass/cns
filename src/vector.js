export class Vector3f {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  add(vector) {
    return new Vector3f(
      this.x + vector.x,
      this.y + vector.y,
      this.z + vector.z
    );
  }
  sub(vector) {
    return new Vector3f(
      this.x - vector.x,
      this.y - vector.y,
      this.z - vector.z
    );
  }
}
