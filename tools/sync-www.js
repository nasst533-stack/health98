// 코드를 수정하고 npm run build 한 뒤, 이 스크립트로 Capacitor용 www/ 폴더를
// 최신 상태로 갱신하세요: node tools/sync-www.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const wwwDir = path.join(root, "www");

function copyFile(name) {
  fs.copyFileSync(path.join(root, name), path.join(wwwDir, name));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.mkdirSync(wwwDir, { recursive: true });
[
  "index.html",
  "styles.css",
  "manifest.json",
  "favicon.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png",
  "food-db.json",
].forEach(copyFile);
copyDir(path.join(root, "dist"), path.join(wwwDir, "dist"));

console.log("www/ 폴더를 최신 상태로 갱신했어요.");
