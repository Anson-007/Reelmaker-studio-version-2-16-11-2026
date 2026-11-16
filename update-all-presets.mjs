// Save as: D:\reel-maker\update-all-presets.mjs
// Run in terminal: node update-all-presets.mjs

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PRESETS_DIR = path.join(ROOT, "src", "app", "preset");
const PUBLIC_DIR = path.join(ROOT, "public");
const DEFAULTS_DIR = path.join(PUBLIC_DIR, "defaults");

// Video-only templates and their slot counts
const VIDEO_TEMPLATES = {
  "neeti-mullai": 4,
  "serene-cinematic-drift": 8,
  "grand-horizon-flow": 13,
};

// 1. Ensure public/defaults/<slug>/ exists and is seeded with starter files if empty
function ensureDefaultMediaFolders(slugs) {
  if (!fs.existsSync(DEFAULTS_DIR)) {
    fs.mkdirSync(DEFAULTS_DIR, { recursive: true });
  }

  const samplePhotos = [
    "/w1.jpg",
    "/w2.jpg",
    "/w3.jpg",
    "/w4.jpg",
    "/w5.jpg",
    "/w6.jpg",
    "/w7.jpg",
    "/w8.jpg",
  ]
    .map((p) => path.join(PUBLIC_DIR, p.slice(1)))
    .filter((p) => fs.existsSync(p));

  const sampleVideo = path.join(PUBLIC_DIR, "v1.mp4");

  for (const slug of slugs) {
    const folder = path.join(DEFAULTS_DIR, slug);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const existingFiles = fs.readdirSync(folder);
    if (existingFiles.length > 0) continue; // Never overwrite user's custom default files

    if (VIDEO_TEMPLATES[slug]) {
      const count = VIDEO_TEMPLATES[slug];
      if (fs.existsSync(sampleVideo)) {
        for (let i = 1; i <= count; i++) {
          fs.copyFileSync(sampleVideo, path.join(folder, `${i}.mp4`));
        }
      }
    } else if (samplePhotos.length > 0) {
      for (let i = 1; i <= 15; i++) {
        const srcPhoto = samplePhotos[(i - 1) % samplePhotos.length];
        fs.copyFileSync(srcPhoto, path.join(folder, `${i}.jpg`));
      }
    }
  }
}

// 2. Inject the 4 snippets into each src/app/preset/<slug>/page.tsx
function patchPresetPage(slug) {
  const filePath = path.join(PRESETS_DIR, slug, "page.tsx");
  if (!fs.existsSync(filePath)) return false;

  let code = fs.readFileSync(filePath, "utf8");

  // Skip if already patched
  if (code.includes("AddOutroGridCard")) {
    console.log(`[SKIP] ${slug}/page.tsx (already has AddOutroGridCard)`);
    return false;
  }

  // Detect state array variable name (uploadedPhotos, uploadedMedia, uploadedVideos, assets)
  let stateVar = "uploadedPhotos";
  if (code.includes("uploadedMedia.map")) stateVar = "uploadedMedia";
  else if (code.includes("uploadedVideos.map")) stateVar = "uploadedVideos";
  else if (code.includes("assets.map")) stateVar = "assets";

  const isVideoTemplate =
    Boolean(VIDEO_TEMPLATES[slug]) ||
    stateVar === "uploadedMedia" ||
    stateVar === "uploadedVideos";
  const mediaType = isVideoTemplate ? "videos" : "photos";

  // Extract maxSlots from .slice(0, N) if present, else fallback to 10
  const sliceMatch = code.match(/\.slice\(\s*0\s*,\s*(\d+)\s*\)/);
  const maxSlots = sliceMatch
    ? Number(sliceMatch[1])
    : VIDEO_TEMPLATES[slug] || 10;

  // Snippet 1: Add imports right after OutroCard import
  const importSnippet = `import {
  AddOutroGridCard,
  SlotCounterPill,
} from "../../../components/EditorMediaAddons";
import { getTemplateConfig } from "../../../data/templates";\n`;

  if (code.includes('from "../../../remotion/OutroCard";')) {
    code = code.replace(
      'from "../../../remotion/OutroCard";',
      `from "../../../remotion/OutroCard";\n${importSnippet}`,
    );
  } else {
    code = importSnippet + code;
  }

  // Snippet 2: Connect DEFAULT_PHOTOS / DEFAULT_MEDIA to getTemplateConfig(slug)
  if (code.includes("const DEFAULT_PHOTOS = [")) {
    code = code.replace(
      "const DEFAULT_PHOTOS = [",
      `const FALLBACK_PHOTOS = [`,
    );
    code = code.replace(
      /const FALLBACK_PHOTOS = \[([\s\S]*?)\];/,
      (match) =>
        `${match}\nconst DEFAULT_PHOTOS = getTemplateConfig("${slug}")?.defaultMedia || FALLBACK_PHOTOS;`,
    );
  } else if (code.includes("const DEFAULT_MEDIA = [")) {
    code = code.replace("const DEFAULT_MEDIA = [", `const FALLBACK_MEDIA = [`);
    code = code.replace(
      /const FALLBACK_MEDIA = \[([\s\S]*?)\];/,
      (match) =>
        `${match}\nconst DEFAULT_MEDIA = getTemplateConfig("${slug}")?.defaultMedia || FALLBACK_MEDIA;`,
    );
  }

  // Snippet 3: Add handleOpenOutroFromGrid right after forcePreviewTransition
  const handlerSnippet = `
  const handleOpenOutroFromGrid = useCallback(() => {
    setActiveTab("branding");
    if (outroData.styleType === "none") {
      setOutroData((prev) => ({ ...prev, styleType: "classic" }));
    }
    ensureOutroVisible(40);
  }, [outroData.styleType, ensureOutroVisible]);
`;

  const forcePreviewRegex =
    /const forcePreviewTransition = useCallback\([\s\S]*?\[BASE_DURATION\],?\s*\);/;
  if (forcePreviewRegex.test(code)) {
    code = code.replace(
      forcePreviewRegex,
      (match) => `${match}\n${handlerSnippet}`,
    );
  }

  // Snippet 4A: Inject <SlotCounterPill /> after the UploadCloud button in the media toolbar
  const uploadBtnRegex = /(<button[\s\S]*?<UploadCloud[\s\S]*?<\/button>)/;
  if (uploadBtnRegex.test(code)) {
    code = code.replace(
      uploadBtnRegex,
      `$1\n                <SlotCounterPill currentCount={${stateVar}.length} maxSlots={${maxSlots}} mediaType="${mediaType}" />`,
    );
  }

  // Snippet 4B: Inject <AddOutroGridCard /> right after {uploadedPhotos.map(...)} inside the grid
  const mapStartToken = `{${stateVar}.map(`;
  const mapStartIdx = code.indexOf(mapStartToken);
  if (mapStartIdx !== -1) {
    // Walk braces from `{uploadedPhotos.map(` to find the matching closing `)}`
    let depth = 0;
    let mapEndIdx = -1;
    for (let i = mapStartIdx; i < code.length; i++) {
      if (code[i] === "{") depth++;
      else if (code[i] === "}") {
        depth--;
        if (depth === 0) {
          mapEndIdx = i + 1;
          break;
        }
      }
    }

    if (mapEndIdx !== -1) {
      const addOutroJSX = `\n                <AddOutroGridCard
                  isOutroEnabled={isOutroEnabled}
                  logoUrl={outroData.logoUrl}
                  onOpenOutroTab={handleOpenOutroFromGrid}
                />`;
      code = code.slice(0, mapEndIdx) + addOutroJSX + code.slice(mapEndIdx);
    }
  }

  fs.writeFileSync(filePath, code, "utf8");
  console.log(`[UPDATED] ${slug}/page.tsx`);
  return true;
}

const slugs = fs
  .readdirSync(PRESETS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

ensureDefaultMediaFolders(slugs);

let updatedCount = 0;
for (const slug of slugs) {
  if (patchPresetPage(slug)) updatedCount++;
}

console.log(
  `\nDone! Updated ${updatedCount} preset pages and prepared ${slugs.length} folders in public/defaults/.`,
);
