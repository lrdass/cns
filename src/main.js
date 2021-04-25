import { Teste } from "./test.js";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const canvasBuffer = context.getImageData(0, 0, canvas.width, canvas.height);

console.log(Teste);
const putPixel = (x, y, r, g, b, a) => {
  const index = (x + y * canvas.width) * 4;

  canvasBuffer.data[index + 0] = r;
  canvasBuffer.data[index + 1] = g;
  canvasBuffer.data[index + 2] = b;
  canvasBuffer.data[index + 3] = a;
};

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

putPixel(1, 1, 255, 0, 0, 255);
putPixel(1, 2, 255, 0, 0, 255);
putPixel(1, 3, 255, 0, 0, 255);
putPixel(1, 4, 255, 0, 0, 255);
putPixel(1, 5, 0, 255, 0, 255);
putPixel(1, 6, 0, 255, 0, 255);

blit();
