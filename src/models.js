import { Vector3f } from "./math.js";

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const PINK = { r: 255, g: 0, b: 255, a: 255 };
const CYAN = { r: 0, g: 255, b: 255, a: 255 };


var Texture = function(url) {
  if (!(this instanceof Texture)) { return new Texture(url); }

  this.url = url;

}

Texture.prototype.loadImage = function() {
  const callback = () => {

    let iw, ih;
    iw = this.image.width;
    ih = this.image.height;

    this.iw = iw
    this.ih = ih

    this.canvas = document.createElement("canvas")
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;

    let canvas2D = this.canvas.getContext('2d')
    canvas2D.drawImage(this.image, 0, 0, iw, ih)

    this.pixelData = canvas2D.getImageData(0, 0, iw, ih).data
    console.log( 'image callback pixel data',this.pixelData)
    return this
  }

  return new Promise(resolve => {
    const image = new Image();

    image.addEventListener('load', () => {
      this.image = image
      resolve(callback);
    });

    image.src = this.url;
  });

}

Texture.prototype.getTexel = function(u, v) {
  var iu = (u*this.iw) | 0;
  var iv = (v*this.ih) | 0;

  var offset = (iv*this.iw*4 + iu*4);


  return {
    r: this.pixelData[offset + 0],
    g: this.pixelData[offset + 1],
    b: this.pixelData[offset + 2]
  };
}

let experimentTextureLoad = await Texture('../assets/texture-target.png').loadImage()
const experimentTexture = experimentTextureLoad()

const cube =  {
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
      texture: experimentTexture,
      textureCoords: [
        [0, 0.333],
        [0.25, 0.333],
        [0, 0.666],
      ]
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
      texture: experimentTexture,
      textureCoords: [
        [0.25, 0.333],
        [0.25, 0.666],
        [0, 0.666],
      ]
    },
    {
      // bgc
      vertices: [1, 6, 2],
      color: PINK,
      normals: [
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
      ],
      texture: experimentTexture,
      textureCoords: [
        [0.25, 0.333],
        [0.5, 0.666],
        [0.25, 0.666],
      ]
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
      texture: experimentTexture,
      textureCoords: [
        [0.25, 0.333],
        [0.5, 0.333],
        [0.5, 0.666],
      ]
    },
  //   {
  //   //  eah
  //     vertices: [4, 0, 7],
  //     color: GREEN,
  //     normals: [
  //       new Vector3f(-1, 0, 0),
  //       new Vector3f(-1, 0, 0),
  //       new Vector3f(-1, 0, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 0],
  //       [1, 0],
  //       [0, 1],
  //     ]
  //   },
  // //   {
  //     // adh
  //     vertices: [0, 3, 7],
  //     color: GREEN,
  //     normals: [
  //       new Vector3f(-1, 0, 0),
  //       new Vector3f(-1, 0, 0),
  //       new Vector3f(-1, 0, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [1, 0],
  //       [1, 1],
  //       [0, 1],
  //     ]
  //   },
  //   {
  //     // dch
  //     vertices: [3, 2, 7],
  //     color: YELLOW,
  //     normals: [
  //       new Vector3f(0, -1, 0),
  //       new Vector3f(0, -1, 0),
  //       new Vector3f(0, -1, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 0],
  //       [1, 0],
  //       [0, 1],
  //     ]
  //   },
  //   {
  //     // hcg
  //     vertices: [7, 2, 6],
  //     color: YELLOW,
  //     normals: [
  //       new Vector3f(0, -1, 0),
  //       new Vector3f(0, -1, 0),
  //       new Vector3f(0, -1, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 1],
  //       [1, 0],
  //       [1, 1],
  //     ]
  //   },
  //   {
  //     // aeb
  //     vertices: [0, 4, 1],
  //     color: RED,
  //     normals: [
  //       new Vector3f(0, 1, 0),
  //       new Vector3f(0, 1, 0),
  //       new Vector3f(0, 1, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 1],
  //       [0, 0],
  //       [1, 1],
  //     ]
  //   },
  //   {
  //     // efb
  //     vertices: [4, 5, 1],
  //     color: RED,
  //     normals: [
  //       new Vector3f(0, 1, 0),
  //       new Vector3f(0, 1, 0),
  //       new Vector3f(0, 1, 0),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 0],
  //       [1, 0],
  //       [1, 1],
  //     ]
  //   },
  //   {
  //     // feh
  //     vertices: [5, 4, 7],
  //     color: BLUE,
  //     normals: [
  //       new Vector3f(0, 0, 1),
  //       new Vector3f(0, 0, 1),
  //       new Vector3f(0, 0, 1),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 0],
  //       [1, 0],
  //       [1, 1],
  //     ]
  //   },
  //   {
  //     // fhg
  //     vertices: [5, 7, 6],
  //     color: BLUE,
  //     normals: [
  //       new Vector3f(0, 0, 1),
  //       new Vector3f(0, 0, 1),
  //       new Vector3f(0, 0, 1),
  //     ],
  //     texture: experimentTexture,
  //     textureCoords: [
  //       [0, 0],
  //       [1, 1],
  //       [0, 1],
  //     ]
  //   },
   ],
};

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



export { cube, generateSphere, CYAN, RED, BLUE, GREEN, YELLOW, PINK };
