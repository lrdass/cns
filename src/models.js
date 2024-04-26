import { Vector3f } from "./math.js";

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const PINK = { r: 255, g: 0, b: 255, a: 255 };
const CYAN = { r: 0, g: 255, b: 255, a: 255 };

var Texture = function(url) {
  if (!(this instanceof Texture)) { return new Texture(url); }

  this.image = new Image();
  this.image.src = url;

  var texture = this;

  this.image.onload = function() {
    texture.iw = texture.image.width;
    texture.ih = texture.image.height;

    texture.canvas = document.createElement("canvas");
    texture.canvas.width = texture.iw;
    texture.canvas.height = texture.ih;
    var c2d = texture.canvas.getContext("2d");
    c2d.drawImage(texture.image, 0, 0, texture.iw, texture.ih);
    texture.pixel_data = c2d.getImageData(0, 0, texture.iw, texture.ih);
  }
}

Texture.prototype.getTexel = function(u, v) {
  var iu = (u*this.iw) | 0;
  var iv = (v*this.ih) | 0;

  var offset = (iv*this.iw*4 + iu*4);


  return {
    r: this.pixel_data.data[offset + 0],
    g: this.pixel_data.data[offset + 1],
    b: this.pixel_data.data[offset + 2]
  };
}

const woodCrate = Texture("../assets/crate-texture.jpg")

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

let cube;

const awaitTextures = (render)  => {
  if (woodCrate.image.complete) {
    render(woodCrate);
  } else {
    woodCrate.image.addEventListener("load", render(woodCrate));
  }
}

export { cube, generateSphere, CYAN, RED, BLUE, GREEN, YELLOW, PINK, awaitTextures};
