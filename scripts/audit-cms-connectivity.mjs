import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content');

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function fileExists(targetPath) {
  return fs.existsSync(targetPath);
}

function readJson(targetPath) {
  try {
    return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch (error) {
    fail(`Unable to parse JSON: ${path.relative(ROOT, targetPath).replace(/\\/g, '/')} (${error.message})`);
    return null;
  }
}

function toList(value) {
  return Array.isArray(value) ? value : [];
}

function hasString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasImageRef(entry, libraryKey, uploadKey) {
  return hasString(entry?.[libraryKey]) || hasString(entry?.[uploadKey]);
}

function validateAboutPage() {
  const candidatePaths = [
    path.join(CONTENT_ROOT, 'pages', 'about', 'index.json'),
    path.join(CONTENT_ROOT, 'pages', 'about.json'),
  ];
  const aboutPath = candidatePaths.find((candidate) => fileExists(candidate));
  if (!aboutPath) {
    fail('Missing About page CMS file (expected src/content/pages/about/index.json or src/content/pages/about.json).');
    return;
  }

  const about = readJson(aboutPath);
  if (!about) return;

  const coreValues = toList(about.coreValues);
  const faqItems = toList(about.faqItems);

  if (coreValues.length === 0) {
    fail('About page Core Values list is empty.');
  }
  if (faqItems.length === 0) {
    fail('About page FAQ Items list is empty.');
  }

  coreValues.forEach((item, index) => {
    if (!hasString(item?.title) || !hasString(item?.content)) {
      fail(`About coreValues[${index}] is missing title/content.`);
    }
  });

  faqItems.forEach((item, index) => {
    if (!hasString(item?.title) || !hasString(item?.content)) {
      fail(`About faqItems[${index}] is missing question/answer.`);
    }
  });
}

function validateHomePage() {
  const homePath = path.join(CONTENT_ROOT, 'pages', 'home.json');
  if (!fileExists(homePath)) {
    fail('Missing Home page CMS file: src/content/pages/home.json.');
    return;
  }

  const home = readJson(homePath);
  if (!home) return;

  const hero = home.hero || {};
  const membership = home.membership || {};

  if (!hasImageRef(hero, 'backgroundImageLibraryPath', 'backgroundImage')) {
    fail('Home hero is missing a connected background image (library path or upload path).');
  }
  if (!hasImageRef(membership, 'imageLibraryPath', 'image')) {
    warn('Home membership section is missing a connected image.');
  }
}

function validateCollectionImages(dirName, label, libraryKey, uploadKey) {
  const dir = path.join(CONTENT_ROOT, dirName);
  if (!fileExists(dir)) {
    warn(`Missing collection directory: src/content/${dirName}`);
    return;
  }

  const files = fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => path.join(dir, fileName));

  if (files.length === 0) {
    warn(`${label} collection has no entries.`);
    return;
  }

  for (const filePath of files) {
    const data = readJson(filePath);
    if (!data) continue;
    if (!hasImageRef(data, libraryKey, uploadKey)) {
      fail(`${label} entry missing connected image: ${path.relative(ROOT, filePath).replace(/\\/g, '/')}`);
    }
  }
}

function validateRequiredSingletonPages() {
  const singletonChecks = [
    {
      relPath: 'src/content/pages/membership.json',
      check: (data) => {
        if (!hasString(data?.hero?.headline)) {
          fail('Membership page hero headline is empty.');
        }
        if (!hasImageRef(data?.hero, 'backgroundImageLibraryPath', 'backgroundImage')) {
          fail('Membership page hero is missing a connected background image.');
        }
        if (!hasString(data?.portalButton?.text) || !hasString(data?.portalButton?.url)) {
          fail('Membership page portal button is incomplete.');
        }
        if (!hasString(data?.pricing?.headline) || !hasString(data?.pricing?.billingText)) {
          fail('Membership page billing section is incomplete.');
        }
        if (!hasImageRef(data?.pricing, 'imageLibraryPath', 'image')) {
          fail('Membership page manage membership section is missing a connected image.');
        }
        if (!Array.isArray(data?.benefits) || data.benefits.length === 0) {
          fail('Membership page benefits list is empty.');
        }
      },
    },
    {
      relPath: 'src/content/pages/new-climbers.json',
      check: (data) => {
        if (!hasString(data?.hero?.headline)) {
          fail('New Climbers hero headline is empty.');
        }
        if (!hasImageRef(data?.hero, 'backgroundImageLibraryPath', 'backgroundImage')) {
          fail('New Climbers hero is missing a connected background image.');
        }
        if (!Array.isArray(data?.welcome?.paragraphs) || data.welcome.paragraphs.length === 0) {
          fail('New Climbers welcome paragraphs are empty.');
        }
        if (!hasImageRef(data?.welcome, 'imageLibraryPath', 'image')) {
          fail('New Climbers welcome section is missing a connected image.');
        }
        if (!Array.isArray(data?.activityCards) || data.activityCards.length === 0) {
          fail('New Climbers activity cards are empty.');
        }
      },
    },
    {
      relPath: 'src/content/pages/amenities.json',
      check: (data) => {
        if (!hasString(data?.hero?.headline)) {
          fail('Amenities hero headline is empty.');
        }
        if (!hasImageRef(data?.hero, 'backgroundImageLibraryPath', 'backgroundImage')) {
          fail('Amenities hero is missing a connected background image.');
        }
        if (!Array.isArray(data?.amenityCards) || data.amenityCards.length === 0) {
          fail('Amenities cards are empty.');
        }
        if (!Array.isArray(data?.ctaButtons) || data.ctaButtons.length === 0) {
          fail('Amenities CTA buttons are empty.');
        }
      },
    },
    {
      relPath: 'src/content/pages/shop.json',
      check: (data) => {
        if (!hasString(data?.hero?.headline)) {
          fail('Shop hero headline is empty.');
        }
        if (!hasImageRef(data?.hero, 'backgroundImageLibraryPath', 'backgroundImage')) {
          fail('Shop hero is missing a connected background image.');
        }
        if (!hasString(data?.gearStoreButton?.text) || !hasString(data?.gearStoreButton?.url)) {
          fail('Shop gear store button is incomplete.');
        }
      },
    },
  ];

  for (const singletonCheck of singletonChecks) {
    const absPath = path.join(ROOT, singletonCheck.relPath);
    if (!fileExists(absPath)) {
      fail(`Missing required singleton file: ${singletonCheck.relPath}`);
      continue;
    }
    const data = readJson(absPath);
    if (!data) continue;
    singletonCheck.check(data);
  }
}

function run() {
  validateAboutPage();
  validateHomePage();
  validateCollectionImages('team', 'Team', 'photoLibraryPath', 'photo');
  validateCollectionImages('events', 'Event', 'imageLibraryPath', 'image');
  validateCollectionImages('not-ready-cards', 'Not-ready card', 'imageLibraryPath', 'image');
  validateRequiredSingletonPages();

  if (warnings.length > 0) {
    console.log('CMS connectivity warnings:');
    for (const message of warnings) {
      console.log(`  - ${message}`);
    }
  }

  if (failures.length > 0) {
    console.error('CMS connectivity validation failed:');
    for (const message of failures) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  }

  console.log('CMS connectivity validation passed.');
}

run();
