import { Matrix4, Vector3f } from "./math";

let lightDistanceSlider = document.getElementById("light_position");

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const clear = () => {
  for (let i = 0; i < width * height * 4; i++) {
    canvasBuffer.data[i + 0] = 255;
    canvasBuffer.data[i + 1] = 255;
    canvasBuffer.data[i + 2] = 255;
    canvasBuffer.data[i + 3] = 255;
  }
  blit();
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
  blit()
};

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const PINK = { r: 255, g: 0, b: 255, a: 255 };
const CYAN = { r: 0, g: 255, b: 255, a: 255 };

const interpolate = (i0, i1, d0, d1) => {
  if (i0 === i1) {
    return [d0];
  }
  [i0, i1] = [i0, i1].sort((x, y) => x > y);
  let values = [];
  let a = (d1 - d0) / (i1 - i0);
  let d = d0;
  // acho que existe um erro aqui ; esse for parece iterar sobre
  // valores discretos
  for (let i = i0; i < i1; i++) {
    values.push(d);
    d += a;
  }
  return values;
};

let zBuffer = Array(width * height).fill(0);
const zBufferAccess = (x, y) => {
  x = Math.floor((canvas.width / 2) + x);
  y = Math.floor((canvas.height / 2) - y - 1);

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;
  return zBuffer[Math.floor(offset)];
};
const zBufferWrite = (x, y, value) => {
  x = Math.floor((canvas.width / 2) + x);
  y = Math.floor((canvas.height / 2) - y - 1);

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;

  zBuffer[offset] = value;
};

const fillTriangle = (p0, p1, p2, color) => {
  [p0, p1, p2] = [p0, p1, p2].sort((point1, point2) => point1.y - point2.y);

  const xCoordinatesForP1P2 = interpolate(p1.y, p2.y, p1.x, p2.x);
  const xCoordinatesForP0P1 = interpolate(p0.y, p1.y, p0.x, p1.x);
  const xCoordinatesForP0P2 = interpolate(p0.y, p2.y, p0.x, p2.x);

  const zCoordinatesForP1P2 = interpolate(p1.y, p2.y, 1.0 / p1.z, 1.0 / p2.z);
  const zCoordinatesForP0P1 = interpolate(p0.y, p1.y, 1.0 / p0.z, 1.0 / p1.z);
  const zCoordinatesForP0P2 = interpolate(p0.y, p2.y, 1.0 / p0.z, 1.0 / p2.z);

  xCoordinatesForP0P1.pop();
  const xCoordinatesForSmallerSide = [
    ...xCoordinatesForP0P1,
    ...xCoordinatesForP1P2,
  ];

  zCoordinatesForP0P1.pop();
  const zCoordinatesForSmallerSide = [
    ...zCoordinatesForP0P1,
    ...zCoordinatesForP1P2,
  ];

  const midIndex = Math.floor(xCoordinatesForP0P2.length / 2);

  let xLeft, xRight, zLeft, zRight;
  if (xCoordinatesForP0P2[midIndex] < xCoordinatesForSmallerSide[midIndex]) {
    [xLeft, xRight] = [xCoordinatesForP0P2, xCoordinatesForSmallerSide];
    [zLeft, zRight] = [zCoordinatesForP0P2, zCoordinatesForSmallerSide];
  } else {
    [xLeft, xRight] = [xCoordinatesForSmallerSide, xCoordinatesForP0P2];
    [zLeft, zRight] = [zCoordinatesForSmallerSide, zCoordinatesForP0P2];
  }

  for (let y = p0.y; y < p2.y; y++) {
    let currentIndex = Math.floor(y - p0.y);

    let [xFloor, xCeiling] = [xLeft[currentIndex], xRight[currentIndex]];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]]
    let zScan = interpolate(xFloor, xCeiling, zl, zr);

    // drawLine({ x: xFloor, y: y }, { x: xCeiling, y: y }, color)
    for (let x = xFloor; x < xCeiling; x++) {
      let currentZ = zScan[Math.floor(x - xFloor)];
      putPixel(x, y, color);
      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, color);
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
}

const multiplyColorScalar = (color, scalar) => {
  return {
    r: clamp(color.r * scalar, 0, 255),
    g: clamp(color.g * scalar, 0, 255),
    b: clamp(color.b * scalar, 0, 255),
    a: color.a
  }
}

let lights = [
  {
    type: 'POINT',
    color: '#ffffff',
    position: new Vector3f(0, 0, 0),
    intensity: 6.0
  },
  {
    type: 'AMBIENT',
    intensity: 0.2
  }
]

const calculateLightIntensity = (p0, p1, p2, lights) => {
  // flatshading - calculando a normal do triangulo:

  let v = p1.sub(p0);
  let w = p2.sub(p0);

  const normal = v.cross(w);

  let lightIntensity = 0;


  const baricenter = new Vector3f((p0.x + p1.x + p2.x) / 3, (p0.y + p1.y + p2.y) / 3, (p0.z + p1.z + p2.z) / 3);

  lights.forEach(light => {
    if (light.type === 'POINT') {
      light.position = new Vector3f(0, 0, lightDistanceSlider.value)
      let lightDirection = light.position.sub(baricenter);
      let cameraDirection = new Vector3f(0, 0, 0).sub(p0);
      // console.log('normal dot light', normal.dot(lightDirection));

      const difuseIntensity = normal.dot(lightDirection) / (normal.magnitude() * lightDirection.magnitude());
      // console.log('diffuse', difuseIntensity)
      const reflectionVector = normal.prod(normal.dot(lightDirection)).prod(2).sub(lightDirection);
      const reflectionIntensity = Math.pow(reflectionVector.dot(cameraDirection) / (reflectionVector.magnitude() * cameraDirection.magnitude()), 1.4);
      // console.log('reflection', reflectionIntensity)
      //

      console.log('difuse', difuseIntensity)

      if(difuseIntensity > 0 ){
        lightIntensity += light.intensity * (difuseIntensity + reflectionIntensity);
      }


    }
    if(light.type === 'AMBIENT') {
      lightIntensity += light.intensity;
    }
  })
  return lightIntensity;
}

const fillTriangleShaded = (p0, p1, p2, color, lights) => {

  const lightIntensity = calculateLightIntensity(
    new Vector3f(p0.x, p0.y, p0.z),
    new Vector3f(p1.x, p1.y, p1.z),
    new Vector3f(p2.x, p2.y, p1.z),
    lights
  );

  [p0, p1, p2] = [p0, p1, p2].sort((point1, point2) => point1.y - point2.y);

  console.log('light intensity', lightIntensity)

  const xCoordinatesForP1P2 = interpolate(p1.y, p2.y, p1.x, p2.x);
  const xCoordinatesForP0P1 = interpolate(p0.y, p1.y, p0.x, p1.x);
  const xCoordinatesForP0P2 = interpolate(p0.y, p2.y, p0.x, p2.x);

  const zCoordinatesForP1P2 = interpolate(p1.y, p2.y, 1.0 / p1.z, 1.0 / p2.z);
  const zCoordinatesForP0P1 = interpolate(p0.y, p1.y, 1.0 / p0.z, 1.0 / p1.z);
  const zCoordinatesForP0P2 = interpolate(p0.y, p2.y, 1.0 / p0.z, 1.0 / p2.z);

  xCoordinatesForP0P1.pop();
  const xCoordinatesForSmallerSide = [
    ...xCoordinatesForP0P1,
    ...xCoordinatesForP1P2,
  ];

  zCoordinatesForP0P1.pop();
  const zCoordinatesForSmallerSide = [
    ...zCoordinatesForP0P1,
    ...zCoordinatesForP1P2,
  ];

  const midIndex = Math.floor(xCoordinatesForP0P2.length / 2);

  let xLeft, xRight, zLeft, zRight;
  if (xCoordinatesForP0P2[midIndex] < xCoordinatesForSmallerSide[midIndex]) {
    [xLeft, xRight] = [xCoordinatesForP0P2, xCoordinatesForSmallerSide];
    [zLeft, zRight] = [zCoordinatesForP0P2, zCoordinatesForSmallerSide];
  } else {
    [xLeft, xRight] = [xCoordinatesForSmallerSide, xCoordinatesForP0P2];
    [zLeft, zRight] = [zCoordinatesForSmallerSide, zCoordinatesForP0P2];
  }

  for (let y = p0.y; y < p2.y; y++) {
    let currentIndex = Math.floor(y - p0.y);

    let [xFloor, xCeiling] = [xLeft[currentIndex], xRight[currentIndex]];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]]
    let zScan = interpolate(xFloor, xCeiling, zl, zr);

    // drawLine({ x: xFloor, y: y }, { x: xCeiling, y: y }, color)
    for (let x = xFloor; x < xCeiling; x++) {
      let currentZ = zScan[Math.floor(x - xFloor)];
      putPixel(x, y, multiplyColorScalar(color, lightIntensity));
      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(color, lightIntensity));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

// fillTriangle(triangle[0], triangle[1], triangle[2], RED);
const cullTriangles = (meshes, worldVertices, camera) => {
  return meshes.filter(mesh => {
    let triangle = {
      a: new Vector3f(worldVertices[mesh[0]].x, worldVertices[mesh[0]].y, worldVertices[mesh[0]].z),
      b: new Vector3f(worldVertices[mesh[1]].x, worldVertices[mesh[1]].y, worldVertices[mesh[1]].z),
      c: new Vector3f(worldVertices[mesh[2]].x, worldVertices[mesh[2]].y, worldVertices[mesh[2]].z)
    }

    let AB = triangle.b.sub(triangle.a)
    let AC = triangle.c.sub(triangle.a)

    let triangleNormal = AB.cross(AC)

    let ABtoCamera = camera.sub(triangle.a)

    let angleWithCamera = ABtoCamera.dot(triangleNormal)

    if (angleWithCamera > 0) {
      return mesh
    }

  })
}

const drawTriangle = (p1, p2, p3, color) => {
  drawLine(p1, p2, color);
  drawLine(p2, p3, color);
  drawLine(p3, p1, color);
};

const PLANE_DISTANCE = 1;
const PLANE_WIDTH = 1;
const PLANE_HEIGHT = 1;

const viewPortToCanvas = ({ x, y, z }) => {
  return { x: x * (width / PLANE_WIDTH), y: y * (height / PLANE_HEIGHT), z: z};
};

const cube = {
  vertices: [
    { x: -1, y: 1, z: -1 }, // a  0
    { x: 1, y: 1, z: -1 }, // b  1
    { x: 1, y: -1, z: -1 }, // c  2
    { x: -1, y: -1, z: -1 }, // d 3
    { x: -1, y: 1, z: 1 }, // e 4
    { x: 1, y: 1, z: 1 }, // f   5
    { x: 1, y: -1, z: 1 }, // g   6
    { x: -1, y: -1, z: 1 }, //h   7
  ],
  meshes: [
    [0, 1, 3, CYAN], //abd
    [1, 2, 3, CYAN], // bcd
    [1, 6, 2, PINK], // bgc
    [1, 5, 6, PINK], // bfg
    [4, 0, 7, GREEN], // eah
    [0, 3, 7, GREEN], // adh
    [3, 2, 7, YELLOW], // dch
    [7, 2, 6, YELLOW], // hcg
    [0, 4, 1, RED], //aeb
    [4, 5, 1, RED], //efb
    [5, 4, 7, BLUE], // feh
    [5, 7, 6, BLUE], // fhg
  ],
};

const instance = {
  model: cube,
  transform: {
    position: new Vector3f(0, 1, 4),
    scale: new Vector3f(0.5, 0.5, 0.5),
    rotation: new Vector3f(0, 1.2, 0),
  },
};

const instance2 = {
  model: cube,
  transform: {
    position: new Vector3f(-1, -2, 6),
    scale: new Vector3f(0.5, 0.5, 0.5),
    rotation: new Vector3f(0, 2.1, 0),
  },
};

let sceneInstances = [instance, instance2];

const render = () => {
  sceneInstances.forEach((instance) => {
    const projectedVertices = [];
    const worldVertices = []
    const { meshes } = instance.model

    instance.model.vertices.forEach((vertex) => {
      const { position, scale, rotation } = instance.transform;
      const scaling = new Matrix4().Scale(scale);
      const rotating = new Matrix4().RotateY(rotation);
      const translating = new Matrix4().Translate(position);
      const projecting = new Matrix4().Projection(PLANE_DISTANCE);

      // estou usando no culling os pontos ja projetados
      // deveria usar os pontos tridimensionais e nao os
      const worldCoordinates = translating.multM(rotating.multM(scaling))
        .multV(vertex);
      worldVertices.push(worldCoordinates)

      const projectedVertex = projecting.multV(worldCoordinates)

      projectedVertices.push(projectedVertex.toVector3f());
    });

    const culledMesh = cullTriangles(meshes, worldVertices, new Vector3f(0, 0, 0))

    culledMesh.forEach((mesh) => {
      fillTriangleShaded(
        viewPortToCanvas({
          x: projectedVertices[mesh[0]].x,
          y: projectedVertices[mesh[0]].y,
          z: projectedVertices[mesh[0]].z,
        }),
        viewPortToCanvas({
          x: projectedVertices[mesh[1]].x,
          y: projectedVertices[mesh[1]].y,
          z: projectedVertices[mesh[1]].z,
        }),
        viewPortToCanvas({
          x: projectedVertices[mesh[2]].x,
          y: projectedVertices[mesh[2]].y,
          z: projectedVertices[mesh[2]].z,
        }),
        mesh[3],
        lights,
      );
    });


  });
};

let i = 0;
let last = null
let second = null
let rendered = 0
const draw = (now) => {
  if (!last) {
    last = now
  }

  if (now - second > 1000) {
    console.log('frames per second: ', rendered)
    rendered = 0
    second = now
  }

  if (now - last > 30) {
clear()
render();
blit();

    i += 0.01;
    rendered += 1

    instance.transform.rotation = new Vector3f(0, i, 0)
    instance2.transform.rotation = new Vector3f(0, -1.3 * i, 0)
    last = now
  }

  requestAnimationFrame(draw)
}

draw()
