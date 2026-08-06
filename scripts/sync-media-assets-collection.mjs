import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MEDIA_ROOT = path.join(ROOT, 'public', 'images', 'canva-final');
const COLLECTION_ROOT = path.join(ROOT, 'src', 'content', 'media-assets');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.mp4', '.webm', '.mov', '.m4v', '.pdf']);

function ensureDir(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

function listFilesRecursive(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(fullPath, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function inferCategory(relPathLower) {
  if (relPathLower.includes('newclimbers') || relPathLower.includes('new-climber')) return 'new-climbers';
  if (relPathLower.includes('membership')) return 'membership';
  if (relPathLower.includes('about')) return 'about';
  if (relPathLower.includes('amenit')) return 'amenities';
  if (relPathLower.includes('shop')) return 'shop';
  if (relPathLower.includes('event')) return 'events';
  if (relPathLower.includes('staff-') || relPathLower.includes('team-')) return 'team';
  if (relPathLower.includes('home')) return 'home';
  if (relPathLower.includes('logo') || relPathLower.includes('brand')) return 'global';
  return 'other';
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

ensureDir(COLLECTION_ROOT);

const existingEntries = fs
  .readdirSync(COLLECTION_ROOT)
  .filter((name) => name.endsWith('.json'))
  .map((name) => path.join(COLLECTION_ROOT, name));

// Files an Image Library entry already accounts for. `filePath` is an index
// pointer at a file committed to the repo directly; `image` is a file the entry
// OWNS because it was uploaded through the CMS (stored as a public URL, e.g.
// "/images/canva-final/team-jill/image.jpg"). Owned files must not get a second,
// index-only entry — two entries for one file is confusing, and only the owning
// one can delete it.
const existingByFilePath = new Map();
const ownedFilePaths = new Set();
for (const entryPath of existingEntries) {
  const parsed = readJsonIfExists(entryPath);
  if (parsed?.filePath) {
    existingByFilePath.set(parsed.filePath, entryPath);
  }
  if (typeof parsed?.image === 'string' && parsed.image.startsWith('/')) {
    ownedFilePaths.add(`public${parsed.image}`);
  }
}

const mediaFiles = listFilesRecursive(MEDIA_ROOT);
let created = 0;
let updated = 0;

for (const absolutePath of mediaFiles) {
  const relFromPublic = path.relative(path.join(ROOT, 'public'), absolutePath).replace(/\\/g, '/');
  const relFromLibrary = path.relative(MEDIA_ROOT, absolutePath).replace(/\\/g, '/');
  const filePath = `public/${relFromPublic}`;
  if (ownedFilePaths.has(filePath)) continue;
  const slug = slugify(relFromLibrary);
  const category = inferCategory(relFromLibrary.toLowerCase());
  const targetPath = path.join(COLLECTION_ROOT, `${slug}.json`);

  const payload = {
    name: slug,
    category,
    filePath,
    altText: '',
    tags: [],
    notes: '',
  };

  const existingPath = existingByFilePath.get(filePath);
  if (existingPath) {
    const existingData = readJsonIfExists(existingPath);
    if (!existingData) continue;
    if (existingData.name !== payload.name || !existingData.category) {
      const merged = {
        ...payload,
        ...existingData,
        category: existingData.category || payload.category,
      };
      fs.writeFileSync(existingPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
      updated += 1;
    }
    continue;
  }

  if (fs.existsSync(targetPath)) {
    continue;
  }

  fs.writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  created += 1;
}

console.log(`Media assets synced. Created: ${created}, updated: ${updated}`);
