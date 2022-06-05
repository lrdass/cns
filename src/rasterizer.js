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
//const BLUE = { r: 0, g: 0, b: 255, a: 255 };

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

const triangle = [
  { x: 0, y: 0 },
  { x: 50, y: 50 },
  { x: 100, y: -65 },
];

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


const fillTriangle = (p0, p1, p2, color) => {
  [p0, p1, p2] = [p0, p1, p2].sort((point1, point2) => point1.y > point2.y);

  const xCoordinatesForP1P2 = interpolate(p1.y, p2.y, p1.x, p2.x);
  const xCoordinatesForP0P1 = interpolate(p0.y, p1.y, p0.x, p1.x);
  const xCoordinatesForP0P2 = interpolate(p0.y, p2.y, p0.x, p2.x);

  xCoordinatesForP0P1.pop();
  const xCoordinatesForSmallerSide = [...xCoordinatesForP0P1, ...xCoordinatesForP1P2];
  const midIndex = Math.floor(xCoordinatesForP0P2.length / 2);

  let xLeft, xRight;
  if (xCoordinatesForP0P2[midIndex] < xCoordinatesForSmallerSide[midIndex]) {
    xLeft = xCoordinatesForP0P2;
    xRight = xCoordinatesForSmallerSide;
  } else {
    xLeft = xCoordinatesForSmallerSide;
    xRight = xCoordinatesForP0P2;
  }


  for (let y = p0.y; y < p2.y; y++) {
    let currentIndex = y - p0.y;
    drawLine({ x: xLeft[currentIndex], y }, { x: xRight[currentIndex], y }, color);
    blit();
  }
};

fillTriangle(triangle[0], triangle[1], triangle[2], RED);

blit();
