import { Matrix4, Vector3f, } from './math'

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const canvasPixel = (x, y, r, g, b, a) => {
  x = Math.floor(x);
  y = Math.floor(y);
  const index = (x + y * width) * 4;
  canvasBuffer.data[index + 0] = r;
  canvasBuffer.data[index + 1] = g;
  canvasBuffer.data[index + 2] = b;
  canvasBuffer.data[index + 3] = a;
};

const putPixel = (x, y, color) => {
  let canvasX = width / 2 + x;
  let canvasY = height / 2 - y;

  canvasPixel(canvasX, canvasY, color.r, color.g, color.b, color.a);
};

const drawLine = (p0, p1, color) => {
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (p0.x > p1.x) {
      let copy = p1;
      p1 = p0;
      p0 = copy;
    }
    const a = dy / dx;
    let b = p0.y - a * p0.x;

    for (let x = p0.x; x < p1.x; x++) {
      let y = a * x + b;
      putPixel(x, y, color);
    }
  } else {
    if (p0.y > p1.y) {
      let copy = p1;
      p1 = p0;
      p0 = copy;
    }

    const a = dx / dy;
    const b = p0.x - a * p0.y;

    for (let y = p0.y; y < p1.y; y++) {
      let x = a * y + b;
      putPixel(x, y, color);
      // x = x + a;
    }
  }
};

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const CYAN = { r: 255, g: 0, b: 255, a: 255 };
const PURPLE = { r: 0, g: 255, b: 255, a: 255 };

const interpolate = (i0, i1, d0, d1) => {
  if (i0 === i1) {
    return [d0];
  }
  [i0, i1] = [i0, i1].sort((x, y) => x > y);
  let values = [];
  let a = (d1 - d0) / (i1 - i0);
  let d = d0;
  for (let i = i0; i < i1; i++) {
    values.push(Math.floor(d));
    d += a;
  }
  return values;
};

// const triangle = [
//   { x: 0, y: 0 },
//   { x: 50, y: 50 },
//   { x: 100, y: -65 },
// ];

// const fillTriangle0 = (p0, p1, p2, color) => {
//   [p0, p1, p2] = [p0, p1, p2].sort((point1, point2) => point1.y > point2.y);

//   // Compute X coordinates of the edges.
//   var x01 = interpolate(p0.y, p1.y, p0.x, p1.x);
//   var x12 = interpolate(p1.y, p2.y, p1.x, p2.x);
//   var x02 = interpolate(p0.y, p2.y, p0.x, p2.x);

//   // Merge the two short sides.
//   x01.pop();
//   var x012 = x01.concat(x12);

//   // Determine which is left and which is right.
//   var x_left, x_right;
//   var m = (x02.length / 2) | 0;
//   if (x02[m] < x012[m]) {
//     x_left = x02;
//     x_right = x012;
//   } else {
//     x_left = x012;
//     x_right = x02;
//   }

//   // Draw horizontal segments.
//   for (var y = p0.y; y <= p2.y; y++) {
//     for (var x = x_left[y - p0.y]; x <= x_right[y - p0.y]; x++) {
//       putPixel(x, y, color);
//     }
//   }
// };


let zBuffer = Array(width * height).fill(Number.MAX_VALUE)
const zBufferAccess = (x, y) => {
	x = canvas.width/2 + (x | 0);
  y = canvas.height/2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width*y;
  return zBuffer[offset]
}
const zBufferWrite = (x, y, value) => {
	x = canvas.width/2 + (x | 0);
  y = canvas.height/2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width*y;

  zBuffer[offset] = value
}

const fillTriangle = (p0, p1, p2, color) => {
  [p0, p1, p2] = [p0, p1, p2].sort((point1, point2) => point1.y > point2.y);

  let [minZ, midZ, maxZ] = [p0, p1, p2].sort((point1, point2) => point1.z > point2.z).map(point => point.z)

  const xCoordinatesForP1P2 = interpolate(p1.y, p2.y, p1.x, p2.x);
  const xCoordinatesForP0P1 = interpolate(p0.y, p1.y, p0.x, p1.x);
  const xCoordinatesForP0P2 = interpolate(p0.y, p2.y, p0.x, p2.x);

  xCoordinatesForP0P1.pop();
  const xCoordinatesForSmallerSide = [...xCoordinatesForP0P1, ...xCoordinatesForP1P2];

  const midIndex = Math.floor(xCoordinatesForP0P2.length / 2);

  let xLeft, xRight;
  if (xCoordinatesForP0P2[midIndex] < xCoordinatesForSmallerSide[midIndex]) {
    [xLeft, xRight] = [xCoordinatesForP0P2, xCoordinatesForSmallerSide];
  } else {
    [xLeft, xRight] = [xCoordinatesForSmallerSide, xCoordinatesForP0P2];
  }

  for (let y = p0.y; y < p2.y; y++) {
    let currentIndex = y - p0.y;

    let [xFloor, xCeiling] = [xLeft[currentIndex], xRight[currentIndex]]

    let zScan = interpolate(xFloor, xCeiling, minZ, maxZ)

    for (let i = xFloor; i < xCeiling; i++) {
      let currentZ = zScan[i - xFloor]
      if (currentZ < zBufferAccess(i, y)) {
        putPixel(i, y, color)
        zBufferWrite(i, y, currentZ)
      }
    }
  }
};

// fillTriangle(triangle[0], triangle[1], triangle[2], RED);

const drawTriangle = (p1, p2, p3, color) => {
  drawLine(p1, p2, color)
  drawLine(p2, p3, color)
  drawLine(p3, p1, color)
}

const PLANE_DISTANCE = 1;
// let projectVertex = (vertex) => {
//   return { x: (vertex.x * PLANE_DISTANCE) / vertex.z, y: (vertex.y * PLANE_DISTANCE) / vertex.z, z: vertex.z }
// }

const PLANE_WIDTH = 1;
const PLANE_HEIGHT = 1;
const viewPortToCanvas = ({ x, y, z }) => {
  return { x: x * (width / PLANE_WIDTH), y: y * (height / PLANE_HEIGHT), z: z }
}

const cube = {
  vertices: [
    { x: -1, y: 1, z: -1 }, // a  0
    { x: 1, y: 1, z: -1 },  // b  1
    { x: 1, y: -1, z: -1 }, // c  2
    { x: -1, y: -1, z: -1 }, // d 3
    { x: -1, y: 1, z: 1 },   // e 4
    { x: 1, y: 1, z: 1 },  // f   5
    { x: 1, y: -1, z: 1 }, // g   6
    { x: -1, y: -1, z: 1 }, //h   7
  ],
  meshes: [
    [0, 1, 3, RED], //abd
    [1, 2, 3, RED], // bcd [1, 2, 5], // bfc
    [1, 6, 2, BLUE], // bgc
    [1, 5, 6, BLUE], // bfg
    [0, 7, 3, GREEN], // ahd
    [0, 4, 7, GREEN], //  aeh
    [2, 7, 6, YELLOW],//chg
    [2, 3, 7, YELLOW],// cdh
    [4, 1, 5, PURPLE], //ebf
    [4, 1, 0, PURPLE], //eba
    [4, 7, 6, CYAN], // ehg
    [4, 6, 5, CYAN],// egf
  ]
}

const instance = {
  model: cube,
  transform: {
    position: new Vector3f(0, 0, 4),
    scale: new Vector3f(0.5, 0.5, 0.5),
    rotation: new Vector3f(0, -Math.PI / 6, 0)
  }
}

let sceneInstances = [
  instance
]
const render = () => {
  sceneInstances.forEach(instance => {
    const projectedVertices = []
    instance.model.vertices.forEach(vertex => {
      const { position, scale, rotation } = instance.transform
      const scaling = new Matrix4().Scale(scale)
      const rotating = new Matrix4().RotateY(rotation)
      const translating = new Matrix4().Translate(position)
      const projecting = new Matrix4().Projection(PLANE_DISTANCE)

      const projectedVertex =
        projecting.multM(translating.multM(rotating.multM(scaling))).multV(vertex)

      projectedVertices.push(projectedVertex.toVector3f())
    })

    instance.model.meshes.forEach(mesh => {
      fillTriangle(
        viewPortToCanvas({ x: projectedVertices[mesh[0]].x, y: projectedVertices[mesh[0]].y, z: projectedVertices[mesh[0]].z }),
        viewPortToCanvas({ x: projectedVertices[mesh[1]].x, y: projectedVertices[mesh[1]].y, z: projectedVertices[mesh[0]].z }),
        viewPortToCanvas({ x: projectedVertices[mesh[2]].x, y: projectedVertices[mesh[2]].y, z: projectedVertices[mesh[0]].z }), mesh[3]
      )
    })
  })
}

const clear = () => {
  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);
  blit();
}

clear();
render();
blit();


