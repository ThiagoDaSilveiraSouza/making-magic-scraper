const fs = require("fs");
const path = require("path");

function sanitizeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveFile(content, filePath) {
  fs.writeFileSync(filePath, content, "utf-8");
}

module.exports = {
  sanitizeFileName,
  ensureDir,
  saveFile
};