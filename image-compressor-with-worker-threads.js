const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Function to compress an image
function compressImage(filePath, outputDir) {
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

// Main thread
if (isMainThread) {
  const dirPath = process.argv[2];
  const outputDir = path.join(dirPath, "compressed");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Get list of image files in the directory
  const imageFiles = fs.readdirSync(dirPath).filter((file) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file);
  });

  // Start timer
  const startTime = process.hrtime();

  // Create a pool of worker threads
  const numWorkers = Math.min(imageFiles.length, require("os").cpus().length); // Use number of CPU cores
  const workers = [];
  let completedTasks = 0;

  // Function to check if all tasks are completed
  function checkCompletion() {
    completedTasks++;
    if (completedTasks === imageFiles.length) {
      // All tasks completed, stop timer and log elapsed time
      const endTime = process.hrtime(startTime);
      const elapsedSeconds = endTime[0] + endTime[1] / 1e9;
      console.log(
        `All images compressed successfully in ${elapsedSeconds.toFixed(
          2
        )} seconds`
      );
      process.exit(); // Exit main thread
    }
  }

  // Listen for messages from worker threads
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(__filename, { workerData: { outputDir } });
    workers.push(worker);

    worker.on("message", (message) => {
      console.log(message);
      checkCompletion();
    });

    worker.on("error", (error) => {
      console.error(error);
      checkCompletion();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      checkCompletion();
    });
  }

  // Distribute image files among worker threads
  for (const file of imageFiles) {
    workers[completedTasks % numWorkers].postMessage({
      file: path.join(dirPath, file),
    });
  }
}
// Worker thread
else {
  const { outputDir } = workerData;

  // Listen for messages from the main thread
  parentPort.on("message", async ({ file }) => {
    try {
      const result = await compressImage(file, outputDir);
      parentPort.postMessage(
        `Image compressed: ${path.basename(
          file
        )}, Elapsed time: ${result.elapsedSeconds.toFixed(2)} seconds`
      );
    } catch (error) {
      parentPort.postMessage(
        `Error compressing image ${path.basename(file)}: ${error.message}`
      );
    }
  });
}
