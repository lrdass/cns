import { Vector3f } from "./vector.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const canvasPixel = (x, y, r, g, b, a) => {
  const index = (x + y * width) * 4;
  canvasBuffr.data[index + 0] = r;
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
  return { x, y };
};

const rayCastSphere = (direction, world) => {
  return {};
};

for (let x = -width / 2; x < width / 2; x++) {
  for (let y = -height / 2; y < height / 2; y++) {
    let { xWorld, yWorld } = mapScreenToWorldPlane(x, y);
    const direction = new Vector3f(xWorld, yWorld, 1);

    const hit = rayCastSphere(direction, world);
    if (hit) {
      putPixel(x, y, hit.color);
    }
  }
}

blit();
