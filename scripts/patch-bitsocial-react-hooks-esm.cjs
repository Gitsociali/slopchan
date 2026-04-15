#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageDistPath = path.join(__dirname, '..', 'node_modules', '@bitsocialnet', 'bitsocial-react-hooks', 'dist');
const logPrefix = '[patch-bitsocial-react-hooks-esm]';
const packageIndexPath = path.join(packageDistPath, 'index.js');
const communitiesPagesStorePath = path.join(packageDistPath, 'stores', 'communities-pages', 'communities-pages-store.js');

if (!fs.existsSync(packageDistPath)) {
  console.log(`${logPrefix} Skip: @bitsocialnet/bitsocial-react-hooks dist not found.`);
  process.exit(0);
}

const relativeImportPattern = /(from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\2/g;
let touchedFiles = 0;
let rewrittenImports = 0;
let removedNodeDebugPatches = 0;
let patchedCommunityFirstPageGuards = 0;

const nodeDebugPatchPattern =
  /\/\/ fix DEBUG_DEPTH bug https:\/\/github\.com\/debug-js\/debug\/issues\/746\s*try\s*\{\s*if \(process\.env\.DEBUG_DEPTH\) \{\s*require\("util"\)\.inspect\.defaultOptions\.depth = process\.env\.DEBUG_DEPTH;\s*\}\s*if \(process\.env\.DEBUG_ARRAY\) \{\s*require\("util"\)\.inspect\.defaultOptions\.maxArrayLength = process\.env\.DEBUG_ARRAY;\s*\}\s*\}\s*catch \(e\) \{ \}/m;
const communityFirstPageAssertNeedle =
  "    assert(community === null || community === void 0 ? void 0 : community.address, `getCommunityFirstPageCid community '${community}' invalid`);\n";

const splitSpecifier = (specifier) => {
  const suffixStart = specifier.search(/[?#]/);

  if (suffixStart === -1) {
    return { bareSpecifier: specifier, suffix: '' };
  }

  return {
    bareSpecifier: specifier.slice(0, suffixStart),
    suffix: specifier.slice(suffixStart),
  };
};

const resolveSpecifier = (filePath, specifier) => {
  const { bareSpecifier, suffix } = splitSpecifier(specifier);

  if (path.extname(bareSpecifier)) {
    return null;
  }

  const absoluteSpecifierPath = path.resolve(path.dirname(filePath), bareSpecifier);

  if (fs.existsSync(`${absoluteSpecifierPath}.js`)) {
    return `${bareSpecifier}.js${suffix}`;
  }

  if (fs.existsSync(path.join(absoluteSpecifierPath, 'index.js'))) {
    return `${bareSpecifier}/index.js${suffix}`;
  }

  return null;
};

const patchFile = (filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  let fileImportCount = 0;

  let updated = source.replace(relativeImportPattern, (match, prefix, quote, specifier) => {
    const resolvedSpecifier = resolveSpecifier(filePath, specifier);

    if (!resolvedSpecifier || resolvedSpecifier === specifier) {
      return match;
    }

    fileImportCount += 1;
    return `${prefix}${quote}${resolvedSpecifier}${quote}`;
  });

  if (filePath === packageIndexPath) {
    const nextUpdated = updated.replace(
      nodeDebugPatchPattern,
      '// Browser bundle: skip Node-only util DEBUG_DEPTH/DEBUG_ARRAY tuning.\n',
    );

    if (nextUpdated !== updated) {
      updated = nextUpdated;
      removedNodeDebugPatches += 1;
    }
  }

  if (filePath === communitiesPagesStorePath) {
    const nextUpdated = updated.replace(
      communityFirstPageAssertNeedle,
      "    if (!(community === null || community === void 0 ? void 0 : community.address)) {\n        return;\n    }\n",
    );

    if (nextUpdated !== updated) {
      updated = nextUpdated;
      patchedCommunityFirstPageGuards += 1;
    }
  }

  if (!fileImportCount && updated === source) {
    return;
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  touchedFiles += 1;
  rewrittenImports += fileImportCount;
};

const walk = (currentPath) => {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      patchFile(entryPath);
    }
  }
};

walk(packageDistPath);

if (!touchedFiles) {
  console.log(`${logPrefix} No relative ESM imports needed patching.`);
  process.exit(0);
}

console.log(
  `${logPrefix} Patched ${rewrittenImports} imports across ${touchedFiles} files${removedNodeDebugPatches ? `, removed ${removedNodeDebugPatches} browser-incompatible debug util block(s)` : ''}${patchedCommunityFirstPageGuards ? `, and relaxed ${patchedCommunityFirstPageGuards} community first-page guard(s)` : ''}.`,
);
