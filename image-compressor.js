const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { stdout } = require("process");
const { FileExplorer } = require("./file-explorer");
// let dirPath = process.argv[2];

class ImageCompressor {
  constructor(dirPath, fileExplorer) {
    this.fileExplorer = fileExplorer;
    this.dirPath = dirPath;
    this.imageFiles = this.fileExplorer.getFiles(dirPath, "jpg");
    this.progress = 0;
  }

  compress(file) {
    let stats = fs.statSync(file, { throwIfNoEntry: false });
    if (!stats?.isDirectory()) {
      let pathArr = file.split(".");
      let fileWithoutExtension = pathArr.slice(0, -1).join("");
      let absPath = path.join(this.dirPath, file);

      return new Promise((resolve, reject) => {
        sharp(absPath)
          .webp({ quality: 10 })
          .toFile(
            `${this.dirPath}compressed/${fileWithoutExtension}.webp`,
            (err, info) => {
              if (err) {
                console.log("Error compressing file", err);
                reject(err);
              }
              showProgress(++this.progress, this.imageFiles.length);
              resolve(info);
            }
          );
      });
    }
  }
}

const dirPath = process.argv[2];
const fileExplorer = new FileExplorer(dirPath, 'image');
const imageCompressor = new ImageCompressor(dirPath, fileExplorer);

let startTime = process.hrtime();
console.log(`Compressing ${imageCompressor.imageFiles.length} image files in ${dirPath}...`);

Promise.all(imageCompressor.imageFiles.map(async (file, i) => {
  return imageCompressor.compress(file);
})).then((compressedImages) => {
  console.log(`\n`,compressedImages.length, " images compressed");
  let endTime = process.hrtime(startTime);
  console.log("Time taken to compress images :: ", endTime);
});

function showProgress(progress, totalLength) {
  process.stdout.clearLine(); // Clear the current line
  process.stdout.cursorTo(0); // Move cursor to the beginning of the line
  process.stdout.write(`Progress: ${progress}/${totalLength}`); // Write the progress
}






