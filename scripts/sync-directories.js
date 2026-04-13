// Best-effort sync of 5chan-directories.json from GitHub
// Updates the vendored fallback in src/data/ so production builds ship a fresh snapshot.
// Never fails the build — if the fetch fails (offline, rate-limited, etc.), the existing file is kept.

import { existsSync, writeFileSync, readFileSync } from 'fs';
import { isAbsolute, join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_URL = 'https://raw.githubusercontent.com/bitsocialnet/lists/master/5chan-directories.json';
const DIRECTORIES_SOURCE_PATH = process.env.DIRECTORIES_SOURCE_PATH;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', '5chan-directories.json');
const TIMEOUT_MS = 5000;
const DEFAULT_METADATA = {
  title: '5chan directories',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const isRecord = (value) => typeof value === 'object' && value !== null;

const getStringValue = (...values) => values.find((value) => typeof value === 'string' && value.length > 0);

const normalizeFeatures = (value) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const normalizedFeatures = Object.entries(value).reduce((acc, [key, featureValue]) => {
    if (typeof featureValue === 'string' || typeof featureValue === 'boolean' || typeof featureValue === 'number') {
      acc[key] = featureValue;
    }
    return acc;
  }, {});

  return Object.keys(normalizedFeatures).length > 0 ? normalizedFeatures : undefined;
};

const deriveNsfw = (value) => {
  const features = value.features;
  const safeForWork = typeof features?.safeForWork === 'boolean' ? features.safeForWork : undefined;
  if (safeForWork !== undefined) {
    return !safeForWork;
  }
  const featuresNsfw = typeof features?.nsfw === 'boolean' ? features.nsfw : undefined;
  const topLevelNsfw = typeof value.nsfw === 'boolean' ? value.nsfw : undefined;
  return topLevelNsfw ?? featuresNsfw;
};

const toCanonicalCommunity = ({ address, communityAddress, name, publicKey, title, nsfw, directoryCode, features }) => {
  const normalizedName = getStringValue(name, address, communityAddress);
  if (!normalizedName) {
    return null;
  }

  const normalizedFeatures = normalizeFeatures(features);
  const normalizedNsfw = deriveNsfw({ nsfw, features: normalizedFeatures });

  return {
    name: normalizedName,
    ...(typeof publicKey === 'string' ? { publicKey } : {}),
    ...(typeof title === 'string' ? { title } : {}),
    ...(typeof directoryCode === 'string' ? { directoryCode } : {}),
    ...(normalizedFeatures ? { features: normalizedFeatures } : {}),
    ...(normalizedNsfw !== undefined ? { nsfw: normalizedNsfw } : {}),
  };
};

const dedupeCommunities = (entries) => {
  const seenAddresses = new Set();
  const normalized = [];

  for (const entry of entries) {
    const dedupeKey = entry.publicKey || entry.name;
    if (seenAddresses.has(dedupeKey)) {
      continue;
    }
    seenAddresses.add(dedupeKey);
    normalized.push(entry);
  }

  return normalized;
};

const adaptV2Directories = (value) => {
  if (!Array.isArray(value.directories)) {
    return [];
  }

  const communities = value.directories
    .map((directory) => {
      if (!isRecord(directory)) {
        return null;
      }
      const features = isRecord(directory.features) ? directory.features : null;
      return toCanonicalCommunity({
        communityAddress: directory.communityAddress,
        name: directory.name,
        publicKey: directory.publicKey,
        title: directory.title,
        directoryCode: directory.directoryCode,
        features,
      });
    })
    .filter(Boolean);

  return dedupeCommunities(communities);
};

const adaptV1Communities = (value) => {
  if (!Array.isArray(value.communities)) {
    return [];
  }

  const communities = value.communities
    .map((community) => {
      if (!isRecord(community)) {
        return null;
      }
      return toCanonicalCommunity({
        address: community.address,
        name: community.name,
        publicKey: community.publicKey,
        title: community.title,
        nsfw: community.nsfw,
        directoryCode: community.directoryCode,
        features: community.features,
      });
    })
    .filter(Boolean);

  return dedupeCommunities(communities);
};

const normalizeDirectoriesData = (value, fallbackMetadata = DEFAULT_METADATA) => {
  if (!isRecord(value)) {
    return null;
  }

  const adapters = [adaptV2Directories, adaptV1Communities];
  const communities = adapters.map((adapter) => adapter(value)).find((normalized) => normalized.length > 0) || [];
  if (communities.length === 0) {
    return null;
  }

  return {
    title: typeof value.title === 'string' ? value.title : fallbackMetadata.title,
    description: typeof value.description === 'string' ? value.description : fallbackMetadata.description,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : fallbackMetadata.createdAt,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : fallbackMetadata.updatedAt,
    communities,
  };
};

const getErrorMessage = (error) => (error instanceof Error ? error.message : String(error));

const loadDirectoriesSource = async () => {
  if (DIRECTORIES_SOURCE_PATH) {
    const resolvedSourcePath = isAbsolute(DIRECTORIES_SOURCE_PATH) ? DIRECTORIES_SOURCE_PATH : resolve(process.cwd(), DIRECTORIES_SOURCE_PATH);
    console.log(`ℹ️  Syncing vendored directories from local file: ${resolvedSourcePath}`);
    if (!existsSync(resolvedSourcePath)) {
      throw new Error(`Local directories source not found: ${resolvedSourcePath}`);
    }
    return JSON.parse(readFileSync(resolvedSourcePath, 'utf8'));
  }

  console.log(`ℹ️  Syncing vendored directories from URL: ${GITHUB_URL}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(GITHUB_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const sync = async () => {
  try {
    let existing = '';
    let fallbackMetadata = DEFAULT_METADATA;
    try {
      existing = readFileSync(OUTPUT_PATH, 'utf8');
      const parsedExisting = JSON.parse(existing);
      const normalizedExisting = normalizeDirectoriesData(parsedExisting);
      if (normalizedExisting) {
        fallbackMetadata = {
          title: normalizedExisting.title,
          description: normalizedExisting.description,
          createdAt: normalizedExisting.createdAt,
          updatedAt: normalizedExisting.updatedAt,
        };
      }
    } catch {
      // file doesn't exist yet or is invalid JSON
    }

    const data = normalizeDirectoriesData(await loadDirectoriesSource(), fallbackMetadata);
    if (!data) {
      throw new Error('Invalid directories payload');
    }

    const formatted = JSON.stringify(data, null, 2) + '\n';

    if (formatted === existing) {
      console.log('✅ Vendored directories already up to date');
      return;
    }

    writeFileSync(OUTPUT_PATH, formatted, 'utf8');
    console.log(`✅ Synced vendored directories (${data.communities.length} communities)`);
  } catch (e) {
    console.warn(`⚠️  Could not sync directories from GitHub (keeping existing file): ${getErrorMessage(e)}`);
  }
};

sync();
