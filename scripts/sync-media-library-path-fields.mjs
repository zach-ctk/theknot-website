// Moves legacy Keystatic upload values into their "…LibraryPath" counterpart and
// drops the upload key.
//
// Background: image slots used to have two fields — a `pathReference` picker
// ("…LibraryPath") and a `fields.image` upload. The upload field OWNS its file:
// Keystatic deletes the file from public/images/canva-final the moment the field
// is cleared, so "remove" on a staff card wiped the image out of the shared
// library for every page using it. Uploads now happen only in the Image Library
// collection, and every other slot is a reference that can be cleared safely.
//
// The upload value used to win at render time, so this script copies the upload
// path INTO the library field (overwriting a different pick) — that keeps every
// page rendering exactly the same image it renders today. Idempotent: once the
// upload keys are gone there is nothing left to move.
//
// Usage: node ./scripts/sync-media-library-path-fields.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content');
const DRY_RUN = process.argv.includes('--dry-run');

// upload key -> library key. Applied at every depth, so nested objects and array
// items (activity cards, amenity cards, discount partners, event flyers) are all
// covered without naming each container.
const FIELD_PAIRS = [
  ['photo', 'photoLibraryPath'],
  ['image', 'imageLibraryPath'],
  ['backgroundImage', 'backgroundImageLibraryPath'],
  ['benefitsImage', 'benefitsImageLibraryPath'],
  ['flyer', 'flyerLibraryPath'],
];

// Array-of-strings equivalent (shop products).
const ARRAY_FIELD_PAIRS = [['images', 'imageLibraryPaths']];

function toLibraryPath(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (value.startsWith('public/')) return value;
  if (value.startsWith('/')) return `public${value}`;
  return value;
}

function fileExists(libraryPath) {
  return fs.existsSync(path.join(ROOT, libraryPath));
}

const moves = [];
const missing = [];

function visit(node, file, trail) {
  if (Array.isArray(node)) {
    // reduce, not forEach — an item that changed has to propagate up or the
    // containing file never gets written back.
    return node.reduce((changed, item, index) => visit(item, file, `${trail}[${index}]`) || changed, false);
  }
  if (!node || typeof node !== 'object') return false;

  let changed = false;

  for (const [uploadKey, libraryKey] of FIELD_PAIRS) {
    if (!(uploadKey in node)) continue;
    const libraryPath = toLibraryPath(node[uploadKey]);
    if (libraryPath) {
      if (!fileExists(libraryPath)) {
        missing.push(`${file}${trail}.${uploadKey} -> ${libraryPath}`);
        continue; // leave the entry alone rather than point it at a missing file
      }
      if (node[libraryKey] !== libraryPath) {
        moves.push(`${file}${trail}: ${libraryKey} = ${libraryPath}${node[libraryKey] ? ` (was ${node[libraryKey]})` : ''}`);
      }
      node[libraryKey] = libraryPath;
    }
    delete node[uploadKey];
    changed = true;
  }

  for (const [uploadKey, libraryKey] of ARRAY_FIELD_PAIRS) {
    if (!(uploadKey in node)) continue;
    const mapped = (Array.isArray(node[uploadKey]) ? node[uploadKey] : [])
      .map(toLibraryPath)
      .filter((value) => value && fileExists(value));
    if (mapped.length) {
      const existing = Array.isArray(node[libraryKey]) ? node[libraryKey] : [];
      const merged = [...new Set([...mapped, ...existing])];
      if (JSON.stringify(merged) !== JSON.stringify(existing)) {
        moves.push(`${file}${trail}: ${libraryKey} = [${merged.join(', ')}]`);
      }
      node[libraryKey] = merged;
    }
    delete node[uploadKey];
    changed = true;
  }

  for (const key of Object.keys(node)) {
    changed = visit(node[key], file, `${trail}.${key}`) || changed;
  }

  return changed;
}

function collectJsonFiles(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectJsonFiles(fullPath, output);
    else if (entry.isFile() && entry.name.endsWith('.json')) output.push(fullPath);
  }
  return output;
}

let changedFiles = 0;
for (const filePath of collectJsonFiles(CONTENT_ROOT)) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    continue;
  }

  const relPath = path.relative(ROOT, filePath).split(path.sep).join('/');
  if (!visit(data, relPath, '')) continue;

  changedFiles += 1;
  if (!DRY_RUN) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

for (const move of moves) console.log(`  ${move}`);
if (missing.length) {
  console.log('\nSkipped (upload value points at a file that is not on disk):');
  for (const entry of missing) console.log(`  ${entry}`);
}
console.log(`\n${DRY_RUN ? '[dry run] would update' : 'Updated'} ${changedFiles} file(s); ${moves.length} library path(s) set.`);
