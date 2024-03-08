import { Matrix4, Vector3f } from "./math.js";

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
  blit();
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
  x = Math.floor(canvas.width / 2 + x);
  y = Math.floor(canvas.height / 2 - y - 1);

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;
  return zBuffer[Math.floor(offset)];
};
const zBufferWrite = (x, y, value) => {
  x = Math.floor(canvas.width / 2 + x);
  y = Math.floor(canvas.height / 2 - y - 1);

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

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];
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
};

const multiplyColorScalar = (color, scalar) => {
  return {
    r: clamp(color.r * scalar, 0, 255),
    g: clamp(color.g * scalar, 0, 255),
    b: clamp(color.b * scalar, 0, 255),
    a: color.a,
  };
};

let lights = [
  {
    type: "POINT",
    position: new Vector3f(-3, 2, -10),
    intensity: 0.9,
  },
  {
    type: "DIRECTIONAL",
    intensity: 0.1,
    direction: new Vector3f(0, 0, 1),
  },
  {
    type: "AMBIENT",
    intensity: 0.2,
  },
];

const calculateLightIntensityForEachVertex = (
  p0,
  p1,
  p2,
  op0,
  op1,
  op2,
  p0Normal,
  p1Normal,
  p2Normal,
  lights
) => {
  op0.lightIntensity = 0;
  op1.lightIntensity = 0;
  op2.lightIntensity = 0;

  /**
   * TODO:
   * This should be removed. Instead, the caculateLightIntensity should expect the normal at the given point.
   * Then, it should calculate the lightIntesity for the vertex point.
   *
   */
  let v = p1.sub(p0);
  let w = p2.sub(p0);

  const normal = v.cross(w);

  let vl;

  let pointList = [p0, p1, p2];
  let originalPoints = [op0, op1, op2];

  let pointIntensity = [];
  /*
   * TODO:
   * This is computing lighting wrong. It is summing light from all three vertices all-together.
   * This should instead calculate the lighting for a given point, and a given normal.
   * */
  for (let i = 0; i < 3; i++) {
    let currentPoint = pointList[i];
    lights.forEach((light) => {
      if (light.type === "POINT") {
        const cameraOrientation = camera.orientation;
        const cameraPosition = camera.position;
        const cameraMatrix = cameraOrientation
          .Transpose()
          .multM(new Matrix4().Translate(cameraPosition.prod(-1)));
        const transformedLightPosition = cameraMatrix.multV(light.position);
        vl = transformedLightPosition.sub(currentPoint);
      } else if (light.type === "DIRECTIONAL") {
        const cameraOrientation = camera.orientation;
        const cameraMatrix = cameraOrientation.Transpose();
        const transformedLightPosition = cameraMatrix.multV(light.direction);
        vl = transformedLightPosition.sub(currentPoint);
      }
      const cos_alpha = vl.dot(normal) / (vl.magnitude() * normal.magnitude());
      if (cos_alpha > 0) {
        originalPoints[i].lightIntensity += light.intensity * cos_alpha;
      }
      // TODO: add reflective component
    });
    pointIntensity.push(originalPoints[i]);
  }

  return pointIntensity;
};

const fillTriangleShaded = (
  { p0, worldP0, p0Normal },
  { p1, worldP1, p1Normal },
  { p2, worldP2, p2Normal },
  color,
  lights
) => {
  const lightIntensityPoints = calculateLightIntensityForEachVertex(
    new Vector3f(worldP0.x, worldP0.y, worldP0.z),
    new Vector3f(worldP1.x, worldP1.y, worldP1.z),
    new Vector3f(worldP2.x, worldP2.y, worldP2.z),
    p0,
    p1,
    p2,
    p0Normal,
    p1Normal,
    p2Normal,
    lights
  );
  // lightIntensityPoints

  [p0, p1, p2] = lightIntensityPoints.sort(
    (point1, point2) => point1.y - point2.y
  );

  const xCoordinatesForP1P2 = interpolate(p1.y, p2.y, p1.x, p2.x);
  const xCoordinatesForP0P1 = interpolate(p0.y, p1.y, p0.x, p1.x);
  const xCoordinatesForP0P2 = interpolate(p0.y, p2.y, p0.x, p2.x);

  const zCoordinatesForP1P2 = interpolate(p1.y, p2.y, 1.0 / p1.z, 1.0 / p2.z);
  const zCoordinatesForP0P1 = interpolate(p0.y, p1.y, 1.0 / p0.z, 1.0 / p1.z);
  const zCoordinatesForP0P2 = interpolate(p0.y, p2.y, 1.0 / p0.z, 1.0 / p2.z);

  const lightIntensityP1P2 = interpolate(
    p1.y,
    p2.y,
    p1.lightIntensity,
    p2.lightIntensity
  );
  const lightIntensityP0P1 = interpolate(
    p0.y,
    p1.y,
    p0.lightIntensity,
    p1.lightIntensity
  );
  const lightIntensityP0P2 = interpolate(
    p0.y,
    p2.y,
    p0.lightIntensity,
    p2.lightIntensity
  );

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

  lightIntensityP0P1.pop();
  const lightIntensitySmallerSide = [
    ...lightIntensityP0P1,
    ...lightIntensityP1P2,
  ];

  const midIndex = Math.floor(xCoordinatesForP0P2.length / 2);

  let xLeft, xRight, zLeft, zRight, lightLeft, lightRight;
  if (xCoordinatesForP0P2[midIndex] < xCoordinatesForSmallerSide[midIndex]) {
    [xLeft, xRight] = [xCoordinatesForP0P2, xCoordinatesForSmallerSide];
    [zLeft, zRight] = [zCoordinatesForP0P2, zCoordinatesForSmallerSide];
    [lightLeft, lightRight] = [lightIntensityP0P2, lightIntensitySmallerSide];
  } else {
    [xLeft, xRight] = [xCoordinatesForSmallerSide, xCoordinatesForP0P2];
    [zLeft, zRight] = [zCoordinatesForSmallerSide, zCoordinatesForP0P2];
    [lightLeft, lightRight] = [lightIntensitySmallerSide, lightIntensityP0P2];
  }

  for (let y = p0.y; y < p2.y; y++) {
    let currentIndex = Math.floor(y - p0.y);

    let [xFloor, xCeiling] = [xLeft[currentIndex], xRight[currentIndex]];
    let [lightFloor, lightCeiling] = [
      lightLeft[currentIndex],
      lightRight[currentIndex],
    ];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];
    let zScan = interpolate(xFloor, xCeiling, zl, zr);

    let lightScan = interpolate(xFloor, xCeiling, lightFloor, lightCeiling);

    for (let x = xFloor; x < xCeiling; x++) {
      let currentZ = zScan[Math.floor(x - xFloor)];
      let currentLight = lightScan[Math.floor(x - xFloor)];
      putPixel(x, y, multiplyColorScalar(color, currentLight));
      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(color, currentLight));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

// fillTriangle(triangle[0], triangle[1], triangle[2], RED);
const cullTriangles = (meshes, worldVertices, renderedCamera) => {
  return meshes.filter((mesh) => {
    let triangle = {
      a: new Vector3f(
        worldVertices[mesh.vertices[0]].x,
        worldVertices[mesh.vertices[0]].y,
        worldVertices[mesh.vertices[0]].z
      ),
      b: new Vector3f(
        worldVertices[mesh.vertices[1]].x,
        worldVertices[mesh.vertices[1]].y,
        worldVertices[mesh.vertices[1]].z
      ),
      c: new Vector3f(
        worldVertices[mesh.vertices[2]].x,
        worldVertices[mesh.vertices[2]].y,
        worldVertices[mesh.vertices[2]].z
      ),
    };

    let AB = triangle.b.sub(triangle.a);
    let AC = triangle.c.sub(triangle.a);

    let triangleNormal = AB.cross(AC);

    let ABtoCamera = renderedCamera.sub(triangle.a);

    let angleWithCamera = ABtoCamera.dot(triangleNormal);

    if (angleWithCamera > 0) {
      return mesh;
    }
  });
};

const drawTriangle = (p1, p2, p3, color) => {
  drawLine(p1, p2, color);
  drawLine(p2, p3, color);
  drawLine(p3, p1, color);
};

const PLANE_DISTANCE = 1;
const PLANE_WIDTH = 1;
const PLANE_HEIGHT = 1;

const viewPortToCanvas = ({ x, y, z }) => {
  return { x: x * (width / PLANE_WIDTH), y: y * (height / PLANE_HEIGHT), z: z };
};

/**
 * TODO:
 * Migrate this cube object definition to a separate file, where this can be instantiated as it wills.
 * Also, it should create a sphere so gourad for spheres with proper normals could be properly rendered
 */

const generateSphere = (divs, color) => {
  let vertices = [];
  let meshes = [];

  let delta_angle = (2.0 * Math.PI) / divs;

  // Generate vertices and normals.
  for (let d = 0; d < divs + 1; d++) {
    let y = (2.0 / divs) * (d - divs / 2);
    let radius = Math.sqrt(1.0 - y * y);
    for (let i = 0; i < divs; i++) {
      const vertex = new Vector3f(
        radius * Math.cos(i * delta_angle),
        y,
        radius * Math.sin(i * delta_angle)
      );
      vertices.push(vertex);
    }
  }

  // Generate triangles.
  for (let d = 0; d < divs; d++) {
    for (let i = 0; i < divs; i++) {
      let i0 = d * divs + i;
      let i1 = (d + 1) * divs + ((i + 1) % divs);
      let i2 = divs * d + ((i + 1) % divs);
      let tri0 = [i0, i1, i2];
      let tri1 = [i0, i0 + divs, i1];

      meshes.push({
        vertices: tri0,
        normals: [vertices[tri0[0]], vertices[tri0[1]], vertices[tri0[2]]],
        color,
      });

      meshes.push({
        vertices: tri1,
        normals: [vertices[tri1[0]], vertices[tri1[1]], vertices[tri1[2]]],
        color,
      });
    }
  }

  return {
    vertices,
    meshes,
  };
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
    {
      // abd
      vertices: [0, 1, 3],
      color: CYAN,
      normals: [
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
      ],
    },
    {
      //bcd
      vertices: [1, 2, 3],
      color: CYAN,
      normals: [
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
      ],
    },
    {
      //bgc
      vertices: [1, 6, 2],
      color: PINK,
      normals: [
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
      ],
    },
    {
      //bfg
      vertices: [1, 5, 6],
      color: PINK,
      normals: [
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
      ],
    },
    {
      // eah
      vertices: [4, 0, 7],
      color: GREEN,
      normals: [
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
      ],
    },
    {
      // adh
      vertices: [0, 3, 7],
      color: GREEN,
      normals: [
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
      ],
    },
    {
      // dch
      vertices: [3, 2, 7],
      color: YELLOW,
      normals: [
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
      ],
    },
    {
      // hcg
      vertices: [7, 2, 6],
      color: YELLOW,
      normals: [
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
      ],
    },
    {
      // aeb
      vertices: [0, 4, 1],
      color: RED,
      normals: [
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
      ],
    },
    {
      // efb
      vertices: [0, 4, 1],
      color: RED,
      normals: [
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
      ],
    },
    {
      // feh
      vertices: [5, 4, 7],
      color: BLUE,
      normals: [
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
      ],
    },
    {
      // fhg
      vertices: [5, 7, 6],
      color: BLUE,
      normals: [
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
      ],
    },
  ],
};

const sphere = generateSphere(16, GREEN);

const instance = {
  model: sphere,
  transform: {
    position: new Vector3f(0, 0, 3),
    scale: new Vector3f(1, 1, 1),
    rotation: new Vector3f(0, 1, 0),
  },
};

/*
const instance2 = {
  model: cube,
  transform: {
    position: new Vector3f(-1, -2, 6),
    scale: new Vector3f(0.5, 0.5, 0.5),
    rotation: new Vector3f(0, 2.1, 0),
  },
};
*/

let sceneInstances = [instance];

let camera = {
  position: new Vector3f(0, 0, 0),
  orientation: new Matrix4().RotateY(new Vector3f(0, 0, 0)),
};

const render = () => {
  sceneInstances.forEach((instance) => {
    const projectedVertices = [];
    const worldVertices = [];
    const { meshes } = instance.model;

    instance.model.vertices.forEach((vertex) => {
      const { position, scale, rotation } = instance.transform;
      const scaling = new Matrix4().Scale(scale);
      const rotating = new Matrix4().RotateY(rotation);
      const translating = new Matrix4().Translate(position);
      const projecting = new Matrix4().Projection(PLANE_DISTANCE);

      // estou usando no culling os pontos ja projetados
      // deveria usar os pontos tridimensionais e nao os
      const worldCoordinates = translating
        .multM(rotating.multM(scaling))
        .multV(vertex);
      worldVertices.push(worldCoordinates);

      const projectedVertex = projecting.multV(worldCoordinates);

      projectedVertices.push(projectedVertex.toVector3f());
    });

    const culledMesh = cullTriangles(meshes, worldVertices, camera.position);

    culledMesh.forEach((mesh) => {
      fillTriangleShaded(
        {
          p0: viewPortToCanvas({
            x: projectedVertices[mesh.vertices[0]].x,
            y: projectedVertices[mesh.vertices[0]].y,
            z: projectedVertices[mesh.vertices[0]].z,
          }),
          worldP0: worldVertices[mesh.vertices[0]],
          p0Normal: mesh.normals[0],
        },
        {
          p1: viewPortToCanvas({
            x: projectedVertices[mesh.vertices[1]].x,
            y: projectedVertices[mesh.vertices[1]].y,
            z: projectedVertices[mesh.vertices[1]].z,
          }),
          worldP1: worldVertices[mesh.vertices[1]],
          p1Normal: mesh.normals[1],
        },
        {
          p2: viewPortToCanvas({
            x: projectedVertices[mesh.vertices[2]].x,
            y: projectedVertices[mesh.vertices[2]].y,
            z: projectedVertices[mesh.vertices[2]].z,
          }),
          worldP2: worldVertices[mesh.vertices[2]],
          p2Normal: mesh.normals[2],
        },
        mesh.color,
        lights
      );
    });
  });
};

/*
let i = 0;
let last = null;
let second = null;
let rendered = 0;
  const draw = (now) => {
  if (!last) {
    last = now;
  }

  if (now - second > 1000) {
    rendered = 0;
    second = now;
  }

  if (now - last > 30) {
    clear();
    render();
    blit();

    i += 0.01;
    rendered += 1;

    instance.transform.rotation = new Vector3f(0, i, 0);
    instance2.transform.rotation = new Vector3f(0, -1.3 * i, 0);
    last = now;
  }

  requestAnimationFrame(draw);
};

draw();

*/

clear();
render();
blit();
