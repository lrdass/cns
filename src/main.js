import { Vector3f } from "./vector.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const world = {
  spheres: [
    {
      center: new Vector3f(0, 0, 7),
      radius: 1,
      color: { r: 255, g: 0, b: 0, a: 255 },
    },
  ],
};

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const canvasPixel = (x, y, r, g, b, a) => {
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

const mapScreenToWorldPlane = (x, y) => {
  let updateX = x / width;
  let updateY = y / height;
  return [updateX, updateY];
};

const intersectSphere = (direction, sphere) => {
  let centerToOrigin = new Vector3f(0, 0, 0).sub(sphere.center);

  let a = direction.dot(direction);
  let b = 2 * centerToOrigin.dot(direction);
  let c = centerToOrigin.dot(centerToOrigin) - sphere.radius ** 2;

  let delta = b ** 2 - 4 * a * c;

  if (delta < 0) {
    return [Infinity, Infinity];
  }

  let sol1 = (-b + Math.sqrt(delta)) / (2 * a);
  let sol2 = (-b - Math.sqrt(delta)) / (2 * a);
  return [sol1, sol2];
};

const traceRay = (direction, world) => {
  let closestSphere = { sphere: null, distance: Infinity };

  world.spheres.forEach((sphere) => {
    let [sol1, sol2] = intersectSphere(direction, sphere);

    if (sol1 < closestSphere.distance && sol1 > 1) {
      closestSphere = { sphere: sphere, distance: sol1 };
    } else if (sol2 < closestSphere.distance && sol2 > 1) {
      closestSphere = { sphere: sphere, distance: sol2 };
    }
  });

  if (closestSphere.sphere === null) return false;
  return closestSphere.sphere;
};

for (let x = -width / 2; x < width / 2; x++) {
  for (let y = -height / 2; y < height / 2; y++) {
    let [xWorld, yWorld] = mapScreenToWorldPlane(x, y);
    const direction = new Vector3f(xWorld, yWorld, 1);

    const hit = traceRay(direction, world);
    if (hit) {
      putPixel(x, y, hit.color);
    } else {
      putPixel(x, y, { r: 255, g: 255, b: 255, a: 255 });
    }
  }
}

blit();
