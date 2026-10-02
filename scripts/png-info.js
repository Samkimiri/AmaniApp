// Tiny helper: print width/height/file size for the PNG assets, so the
// social-preview card and manifest icon sizes can be checked against reality.
const fs = require("fs");
const paths = [
  "assets/icon.png",
  "assets/adaptive-icon.png",
  "assets/splash.png",
  "assets/favicon.png",
  "public/icon.png",
  "public/favicon.png",
];
for (const p of paths) {
  if (!fs.existsSync(p)) {
    console.log(p, "MISSING");
    continue;
  }
  const b = fs.readFileSync(p);
  console.log(`${p}  ${b.readUInt32BE(16)}x${b.readUInt32BE(20)}  ${b.length}B`);
}