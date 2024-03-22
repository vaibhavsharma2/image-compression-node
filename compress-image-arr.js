const fs = require("fs");
const path = require("path");
const { stdout } = require("process");
const sharp = require("sharp");
const os = require("node:os");
const util = require("util");
const { spawn } = require('node:child_process');



async function convertImageArr(allFiles = [], dirPath = '') {

  allFiles = JSON.parse(process.argv[2]);
  dirPath = process.argv[3];


  console.log('all files :: ', allFiles);
  console.log('dirpatj', dirPath)

  let validExtension = ["jpeg", "jpg", "png", "webp"];
  let promises = [];
  allFiles.map(file => {

    let stats = fs.statSync(file, { throwIfNoEntry: false });
    if (!stats?.isDirectory()) {
      let pathArr = file.split(".");
      let extension = pathArr.slice(-1)[0];
      let fileWithoutExtension = pathArr.slice(0, -1).join("");
      let absPath = path.join(dirPath, file);

      if (
        validExtension.indexOf(extension) != -1
        // && file.search('compressed') == -1
      ) {

        console.log({ fileWithoutExtension, extension, absPath });

        
        return new Promise((resolve, reject) => {
          sharp(absPath)
            .webp({ quality: 10 })
            .toFile(
              `${dirPath}compressed/${fileWithoutExtension}-compressed.webp`,
              (err, info) => {
                if (err) {
                  console.log("Error compressing file", err);
                  reject(err);
                }

                // DELETE THE ORIGINAL FILE AFTER COMPRESSION

                // try {
                //   fs.unlinkSync(absPath)
                // } catch (err) {
                //   console.log('error deleting a file :: ', absPath)
                // }

                // console.log(
                //   "compression success  -- size after compression :: ",
                //   { before: stats?.size, after: info.size }
                // );
                resolve(info);
              }
            );
        });
        promises.push(promise);

      }
    } else {
      console.log("else :: ");
    }
  })
  }



convertImageArr()


module.exports = {
  convertImageArr
}

