
// Scans public/photos for .jpg/.jpeg and writes photos.json
import { readdir, writeFile } from "fs/promises";
import { extname } from "path";

const PHOTOS_DIR = "public/photos";
const OUT_FILE = "public/photos/photos.json";

try {
  const files = await readdir(PHOTOS_DIR);
  const jpgs = files
    .filter(f => [".jpg", ".jpeg"].includes(extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const list = jpgs.map(f => {
    const base = f.replace(/\.[^.]+$/, "");
    return {
      file: `/photos/${f}`,
      name: base
    };
  });

  if (list.length < 3) {
    console.warn("Warning: fewer than 3 photos found — quiz needs at least 3.");
  }

  await writeFile(OUT_FILE, JSON.stringify(list, null, 2));
  console.log(`Wrote ${OUT_FILE} with ${list.length} items`);
} catch (e) {
  console.error("Failed to generate photos.json:", e);
  process.exit(1);
}
