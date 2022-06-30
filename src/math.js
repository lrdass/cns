class Matrix4 {
  constructor() {
    this.body = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
  }

  multV(vector) {
    let matrix = this.body
    let vec = [vector.x, vector.y, vector.z, vector.w]
    if (!vector.w) vec[3] = 1
    let result = []

    for (let i = 0; i < matrix.length; i++) {
      let pos = 0
      for (let j = 0; j < matrix[i].length; j++) {
        pos += matrix[i][j] * vec[j]
      }
      result[i] = pos
    }
    return new Vector4f(result[0], result[1], result[2], result[3])
  }

  multM(matrix) {
    let prevMatrix = this.body;
    let result = new Matrix4()

    for (let i = 0; i < prevMatrix.length; i++) {
      for (let j = 0; j < prevMatrix.length; j++) {
        for (let k = 0; k < prevMatrix.length; k++) {
          result.body[i][j] += prevMatrix[i][k] * matrix.body[k][j]
        }
      }
    }
    this.body = result.body
    return this
  }

  Translate(translation) {
    const { x, y, z } = translation
    this.body = [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1],
    ]
    return this
  }

  Scale(scale) {
    const { x, y, z } = scale
    this.body = [
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1],
    ]
    return this
  }

  RotateY(rotationVector) {
    const { y: angle } = rotationVector

    this.body = [
      [Math.cos(angle), 0, Math.sin(angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(angle), 0, Math.cos(angle), 0],
      [0, 0, 0, 1],
    ]
    return this
  }

  Projection(planeDistance) {
    this.body = [
      [planeDistance, 0, 0, 0],
      [0, planeDistance, 0, 0],
      [0, 0, planeDistance, 0],
      [0, 0, 1, 0],
    ]
    return this
  }



}
// Matrix4.Projection(plane_distance).mult(vector)
//

class Vector {
  constructor(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
}

class Vector2f extends Vector {

  super(x, y) {
    this.x = x
    this.y = y
  }
}

class Vector3f extends Vector {

  super(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }
}
class Vector4f extends Vector {
  super(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  toVector3f() {
    return new Vector3f(this.x / this.w, this.y / this.w, this.z)
  }
  toVector2f() {
    return new Vector2f(this.x / this.w, this.y / this.w,)
  }

}
export { Matrix4, Vector2f, Vector3f, Vector4f }

