const fs = require("fs");
const path = require("path");
const { stdout } = require("process");
const sharp = require("sharp");
const os = require("node:os");
const { promisify } = require("util");
const { spawn, spawnSync } = require('node:child_process');

// const { convertImageArr } = require('./compress-image-arr');
//

const promisedSpawn = promisify(spawn);

async function convert() {
  // get path from command line
  let dirPath = process.argv[2];

  let cores = os.cpus();

  console.log(cores);

  try {
    console.time("compressing images");
    const start = process.hrtime.bigint();
    let allFiles = fs.readdirSync(dirPath);


    let parts = convertToParts(allFiles);

    console.log('parts :: ', parts)

    // process.exit(0);

    // await convertImageArr(allFiles, dirPath)

    // for (let partArr of parts) {
    //   let stringifiedData = JSON.stringify(partArr);
    //   let x = await promisedSpawn('node', ['./compress-image-arr.js', stringifiedData, dirPath], { stdio: 'inherit' });
    //   console.log('x :: ', x)
    // }

    await parts.map(async (partArr) => {
      let stringifiedData = JSON.stringify(partArr);
      promisedSpawn('node', ['./compress-image-arr.js', stringifiedData, dirPath], { stdio: 'inherit' }).then((res) => {
        console.log('res :: ', res)
      });
    })



    const end = process.hrtime.bigint();
    console.log(
      `Benchmark took ${((end - start))} seconds`
    );
  } catch (err) {
    stdout.write("Directory does not exist \n");
    console.log("Error :: ", err);
  }
}

function convertToParts(arr) {

  var coreLength = os.cpus().length;

  console.log({ coreLength })

  if (arr.length > 2 && coreLength > arr.length) {
    coreLength = 2;
  }

  console.log({ coreLength })

  let eachPartLength = Math.floor(arr.length / coreLength)

  let parts = [];
  let start;
  for (let i = 0; i < coreLength; i++) {
    console.log({ i })
    if (i == 0) {
      start = 0;
    } else {
      start = i * eachPartLength;
    }
    let temp = arr.slice(start, (i + 1) * eachPartLength)
    parts.push(temp)
  }
  return parts;
}

convert().then(() => {
  console.log('========== done ===========')
  process.exit(0);
});
