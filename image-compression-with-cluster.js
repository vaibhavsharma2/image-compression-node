const cluster = require("cluster");
const os = require("os");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Function to compress an image
async function compressImage(filePath, outputDir) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime();
    sharp(filePath)
      .webp({ quality: 10 })
      .toFile(
        path.join(
          outputDir,
          `${path.basename(filePath, path.extname(filePath))}-compressed.webp`
        ),
        (err, info) => {
          if (err) {
            reject(err);
          } else {
            const endTime = process.hrtime(startTime);
            const elapsedSeconds = endTime[0] + endTime[1] / 1e9;
            resolve({ info, elapsedSeconds });
          }
        }
      );
  });
}

// Main process
if (cluster.isMaster) {
  const dirPath = process.argv[2];
  const outputDir = path.join(dirPath, "compressed");
  const numWorkers = os.cpus().length; // Use number of CPU cores

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Get list of image files in the directory
  const imageFiles = fs
    .readdirSync(dirPath)
    .filter((file) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file));

  // Fork worker processes
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // Track completed tasks
  let completedTasks = 0;

  // Listen for 'online' event to ensure workers are online before sending tasks
  cluster.on("online", (worker) => {
    const startIndex = worker.id - 1; // Adjust index based on worker ID
    for (let i = startIndex; i < imageFiles.length; i += numWorkers) {
      worker.send({ file: path.join(dirPath, imageFiles[i]), outputDir });
    }
  });

  // Listen for messages from worker processes
  cluster.on("message", (worker, message) => {
    console.log(message);
    completedTasks++;
    if (completedTasks === imageFiles.length) {
      // All tasks completed, exit master process
      console.log(`All images compressed successfully`);
      process.exit();
    }
  });
}
// Worker process
else {
  // Listen for messages from master process
  process.on("message", async ({ file, outputDir }) => {
    try {
      const result = await compressImage(
        file,
        outputDir
      );
      process.send(
        `Image compressed: ${path.basename(
          file
        )}, Elapsed time: ${result.elapsedSeconds.toFixed(2)} seconds`
      );
    } catch (error) {
      process.send(
        `Error compressing image ${path.basename(file)}: ${error.message}`
      );
    }
  });
}
