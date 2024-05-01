import { Matrix4, Vector3f } from "./math.js";
import {cube } from "./models.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const RENDERING = "GOURAD";

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

const interpolate = (i0, i1, d0, d1) => {
  if (i0 === i1) {
    return [d0];
  }

  let values = [];
  let a = (d1 - d0) / (i1 - i0);
  let d = d0;
  for (let i = i0; i <= i1; i++) {
    values.push(d);
    d += a;
  }

  return values;
};

let zBuffer = Array(width * height).fill(0);

const zBufferAccess = (x, y) => {
  x = canvas.width / 2 + (x | 0);
  y = canvas.height / 2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;
  return zBuffer[Math.floor(offset)];
};

const zBufferWrite = (x, y, value) => {
  x = canvas.width / 2 + (x | 0);
  y = canvas.height / 2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;

  zBuffer[offset] = value;
};

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

const multiplyColorScalar = (color, scalar) => {
  return {
    r: clamp(color.r * scalar, 0, 255),
    g: clamp(color.g * scalar, 0, 255),
    b: clamp(color.b * scalar, 0, 255),
    a: 255,
  };
};

let lights = [
  {
    type: "POINT",
    position: new Vector3f(80, 2, -10),
    intensity: 0.1,
  },
  {
    type: "DIRECTIONAL",
    intensity: 0.2,
    direction: new Vector3f(3, 0, 1),
  },
  {
    type: "AMBIENT",
    intensity: 0.2,
  },
];

const calculateLightIntensity = (point, worldPoint, vertexNormal, lights) => {
  let totalLight = 0;
  let lightDirection;

  lights.forEach((light) => {
    if (light.type === "POINT") {
      const cameraOrientation = camera.orientation;
      const cameraPosition = camera.position;
      const cameraMatrix = cameraOrientation
        .Transpose()
        .multM(new Matrix4().Translate(cameraPosition.prod(-1)));
      const transformedLightPosition = cameraMatrix.multV(light.position);
      lightDirection = transformedLightPosition.sub(worldPoint);
    } else if (light.type === "DIRECTIONAL") {
      const cameraOrientation = camera.orientation;
      const cameraMatrix = cameraOrientation.Transpose();
      const transformedLightPosition = cameraMatrix.multV(light.direction);
      lightDirection = transformedLightPosition.sub(worldPoint);
    } else {
      totalLight += light.intensity;
    }

    const cos_alpha =
      lightDirection.dot(vertexNormal) /
      (lightDirection.magnitude() * vertexNormal.magnitude());

    const reflective = vertexNormal
      .prod(2 * vertexNormal.dot(lightDirection))
      .sub(lightDirection);

    const reflectiveFactor = Math.pow(
      reflective.dot(vertexNormal) /
        (reflective.magnitude() * vertexNormal.magnitude()),
      1000
    );

    if (cos_alpha > 0) {
      totalLight += (cos_alpha + reflectiveFactor) * light.intensity;
    }

    // TODO: add reflective component
  });

  return totalLight;
};

const isBiggerEdgeAtLeftSide = (x02, x12) => {
  const midIndex = (x12.length / 2) | 0;
  return x02[midIndex] < x12[midIndex];
};

const buildInterpolatedEdgeValues = (i0, i1, i2, d0, d1, d2) => {
  const i12 = interpolate(i1, i2, d1, d2);
  const i01 = interpolate(i0, i1, d0, d1);
  const i02 = interpolate(i0, i2, d0, d2);

  i01.pop();
  const smaller = [...i01, ...i12];

  return {
    smallEdge: smaller,
    bigEdge: i02,
  };
};

const interpolateVector = (i0, i1, v0, v1) => {
  const v01x = interpolate(i0, i1, v0.x, v1.x);
  const v01y = interpolate(i0, i1, v0.y, v1.y);
  const v01z = interpolate(i0, i1, v0.z, v1.z);

  let resultVectors = [];

  for (let i = 0; i < v01x.length; i++) {
    resultVectors.push(new Vector3f(v01x[i], v01y[i], v01z[i]));
  }

  return resultVectors;
};

const buildInterpolatedEdgeVectors = (i0, i1, i2, v0, v1, v2) => {
  const v12 = interpolateVector(i1, i2, v1, v2);
  const v01 = interpolateVector(i0, i1, v0, v1);
  const v02 = interpolateVector(i0, i2, v0, v2);

  v01.pop();
  const smaller = [...v01, ...v12];

  return {
    smallEdge: smaller,
    bigEdge: v02,
  };
};

const fillTriangleShadedPhong = (vertex0, vertex1, vertex2, color, lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

  const { bigEdge: x02, smallEdge: x12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    p0.x,
    p1.x,
    p2.x
  );

  const { bigEdge: z02, smallEdge: z12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    1.0 / p0.z,
    1.0 / p1.z,
    1.0 / p2.z
  );

  const { bigEdge: v02, smallEdge: v12 } = buildInterpolatedEdgeVectors(
    p0.y,
    p1.y,
    p2.y,
    vertex0.normal,
    vertex1.normal,
    vertex2.normal
  );

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, vecLeft, vecRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    [vecLeft, vecRight] = [v02, v12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    [vecLeft, vecRight] = [v12, v02];
  }

  // para cada linha entre p0 e p2
  for (let y = p0.y; y <= p2.y; y++) {
    //  atual indice da linha
    let currentIndex = y - p0.y;

    let [xFloor, xCeiling] = [
      xLeft[currentIndex] | 0,
      xRight[currentIndex] | 0,
    ];

    let [vFloor, vCeiling] = [vecLeft[currentIndex], vecRight[currentIndex]];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];

    let zScan = interpolate(xFloor, xCeiling, zl, zr);
    let vectorScan = interpolateVector(xFloor, xCeiling, vFloor, vCeiling);

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];

      let oz = 1.0 / currentZ;

      const objX = (x * oz) / PLANE_DISTANCE;
      const objY = (y * oz) / PLANE_DISTANCE;
      const objZ = 1.0 / currentZ;

      const rx = (objX * PLANE_WIDTH) / width;
      const ry = (objY * PLANE_HEIGHT) / height;

      let currentLight = calculateLightIntensity(
        new Vector3f(rx, ry, oz),
        new Vector3f(rx, ry, oz),
        vectorScan[currentPixel],
        lights
      );

      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(color, currentLight));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

const fillTriangleShaded = (vertex0, vertex1, vertex2, texture,  lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const lightIntensityP0 = calculateLightIntensity(
    vertex0.point,
    vertex0.world,
    vertex0.normal,
    lights
  );
  const lightIntensityP1 = calculateLightIntensity(
    vertex1.point,
    vertex1.world,
    vertex1.normal,
    lights
  );
  const lightIntensityP2 = calculateLightIntensity(
    vertex2.point,
    vertex2.world,
    vertex2.normal,
    lights
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

  const textureUV0 = vertex0.textureCoodinates
  const textureUV1 = vertex1.textureCoodinates
  const textureUV2 = vertex2.textureCoodinates

  const { bigEdge: x02, smallEdge: x12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    p0.x,
    p1.x,
    p2.x
  );

  const { bigEdge: z02, smallEdge: z12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    1.0 / p0.z,
    1.0 / p1.z,
    1.0 / p2.z
  );

  const { bigEdge: light02, smallEdge: light12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    lightIntensityP0,
    lightIntensityP1,
    lightIntensityP2
  );

  const {bigEdge: texU02, smallEdge: texU12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[0] / p0.z,
    textureUV1[0] / p1.z,
    textureUV2[0] / p2.z,
  )

  const {bigEdge: texV02, smallEdge: texV12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[1] / p0.z,
    textureUV1[1] / p1.z,
    textureUV2[1] / p2.z,
  )

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, lightLeft, lightRight, texULeft, texURight, texVLeft, texVRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    // light
    [lightLeft, lightRight] = [light02, light12];
    // uv coordinates
    [texULeft, texURight] = [texU02, texU12];
    [texVLeft, texVRight] = [texV02, texV12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    //light
    [lightLeft, lightRight] = [light12, light02];
    // uv coordinates texture
    [texULeft, texURight] = [ texU12, texU02];
    [texVLeft, texVRight] = [ texV12, texV02,];
  }

  // para cada linha entre p0 e p2
  for (let y = p0.y; y <= p2.y; y++) {
    //  atual indice da linha
    let currentIndex = y - p0.y;

    // let {lineBegin: minX, lineEnd: maxY} = triangleEdgePointsByLineIndex()
    // let {lineBegin: minLight, lineEnd: maxLight} = triangleEdgePointsByLineIndex()

    let [xFloor, xCeiling] = [
      xLeft[currentIndex] | 0,
      xRight[currentIndex] | 0,
    ];

    let [lightFloor, lightCeiling] = [
      lightLeft[currentIndex],
      lightRight[currentIndex],
    ];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];
    // texture
    let [ul, ur]  = [texULeft[currentIndex], texURight[currentIndex]]
    let [vl, vr]  = [texVLeft[currentIndex], texVRight[currentIndex]]

    let zScan = interpolate(xFloor, xCeiling, zl, zr);
    let lightScan = interpolate(xFloor, xCeiling, lightFloor, lightCeiling);


    let uScan = interpolate(xFloor, xCeiling, ul, ur)
    let vScan = interpolate(xFloor, xCeiling, vl, vr)

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];
      let currentLight = lightScan[currentPixel];

      // textura u[0, 1] v[0, 1]
      let currentU = uScan[currentPixel]
      let currentV = vScan[currentPixel]


      let pixelColor = texture.getTexel(currentU / currentZ, currentV / currentZ);

      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(pixelColor, currentLight));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

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


const PLANE_DISTANCE = 1;
const PLANE_WIDTH = 1;
const PLANE_HEIGHT = 1;

const viewPortToCanvas = ({ x, y, z }) => {
  return {
    x: Math.floor(x * (width / PLANE_WIDTH)),
    y: Math.floor(y * (height / PLANE_HEIGHT)),
    z: z,
  };
};

/**
 * TODO:
 * Migrate this cube object definition to a separate file, where this can be instantiated as it wills.
 * Also, it should create a sphere so gourad for spheres with proper normals could be properly rendered
 */


let sceneInstances= [
    {
      model: cube,
      transform: {
        position: new Vector3f(-1.75, 0, 8),
        scale: new Vector3f(1, 1, 1),
        rotation: new Vector3f(0, 1, 0),
      },
    }
];

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
      if (RENDERING === "PHONG") {
        fillTriangleShadedPhong(
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[0]].x,
              y: projectedVertices[mesh.vertices[0]].y,
              z: projectedVertices[mesh.vertices[0]].z,
            }),
            world: worldVertices[mesh.vertices[0]],
            normal: mesh.normals[0],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: mesh.normals[1],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: mesh.normals[2],
          },
          mesh.color,
          lights
        );
      } else {
        fillTriangleShaded(
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[0]].x,
              y: projectedVertices[mesh.vertices[0]].y,
              z: projectedVertices[mesh.vertices[0]].z,
            }),
            world: worldVertices[mesh.vertices[0]],
            normal: mesh.normals[0],
            textureCoodinates: mesh.textureCoords[0]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: mesh.normals[1],
            textureCoodinates: mesh.textureCoords[1]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: mesh.normals[2],
            textureCoodinates: mesh.textureCoords[2]
          },
          mesh.texture,
          lights
        );
      }
    });
  });
};



// current fix just to properly lo0ad textures
clear();
render();
blit();
