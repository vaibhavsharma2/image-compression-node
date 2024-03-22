const fs = require("fs");
class FileExplorer {
  imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  docExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

  constructor(dirPath, fileType) {
    this.dirPath = dirPath;
    this.filteredFiles = [];
    this.fileType = fileType;
  }

  getFiles() {
    let allFiles = fs.readdirSync(this.dirPath);
    console.log({allFiles})
    if (this.fileType == "image") {
      console.log('if')
      this.filteredFiles = allFiles.filter((file) => {
        let pathArr = file.split(".");
        let extension = pathArr.splice(-1)[0];
        return this.imageExtensions.indexOf(extension) != -1;
      });
      console.log({ w: this.filteredFiles });
    } else if (this.fileType == "doc") {
      console.log("else");
      this.filteredFiles = allFiles.filter((file) => {
        let pathArr = file.split(".");
        let extension = pathArr.splice(-1)[0];
        return this.docExtensions.indexOf(extension) != -1;
      });
    } else {
      console.log("Unsupported file type");
      return;
    }
    console.log({files : this.filteredFiles})
    return this.filteredFiles;
  }
}

module.exports = { FileExplorer };


