type ErrorLike = {
  cause?: unknown;
  details?: unknown;
  message?: unknown;
};

const CIRCULAR_REFERENCE_LABEL = '[Circular]';
const UNDEFINED_LABEL = '[undefined]';

const normalizeErrorForClipboard = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return UNDEFINED_LABEL;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }
  if (typeof value === 'symbol' || typeof value === 'function') {
    return String(value);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? String(value) : value.toISOString();
  }
  if (value instanceof Error) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const normalized: Record<string, unknown> = {
      name: value.name,
      message: value.message,
    };
    if (value.stack) {
      normalized.stack = value.stack;
    }
    for (const [key, entryValue] of Object.entries(value)) {
      normalized[key] = normalizeErrorForClipboard(entryValue, seen);
    }
    if ('cause' in value && value.cause !== undefined) {
      normalized.cause = normalizeErrorForClipboard(value.cause, seen);
    }
    seen.delete(value);
    return normalized;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const normalized = value.map((entry) => normalizeErrorForClipboard(entry, seen));
    seen.delete(value);
    return normalized;
  }
  if (value instanceof Map) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const normalized = Object.fromEntries([...value.entries()].map(([key, entryValue]) => [String(key), normalizeErrorForClipboard(entryValue, seen)]));
    seen.delete(value);
    return normalized;
  }
  if (value instanceof Set) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const normalized = [...value].map((entry) => normalizeErrorForClipboard(entry, seen));
    seen.delete(value);
    return normalized;
  }
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const normalized: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      normalized[key] = normalizeErrorForClipboard(entryValue, seen);
    }
    seen.delete(value);
    return normalized;
  }
  return String(value);
};

export const serializeErrorForClipboard = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  const serializableError = normalizeErrorForClipboard(error);

  try {
    return JSON.stringify(serializableError, null, 2) ?? String(error);
  } catch {
    return String(error);
  }
};

const normalizeUnknownErrorPart = (value: unknown, seen = new WeakSet<object>()): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol' || typeof value === 'function') {
    return String(value);
  }
  if (value instanceof Error) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const parts = [normalizeUnknownErrorPart(value.message, seen)];
    for (const [key, entryValue] of Object.entries(value)) {
      const normalizedValue = normalizeUnknownErrorPart(entryValue, seen);
      if (normalizedValue) {
        parts.push(`${key}: ${normalizedValue}`);
      }
    }
    if ('cause' in value) {
      const normalizedCause = normalizeUnknownErrorPart(value.cause, seen);
      if (normalizedCause) {
        parts.push(`cause: ${normalizedCause}`);
      }
    }
    seen.delete(value);
    return parts.filter(Boolean).join('; ') || value.name;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const parts = value.map((entryValue) => normalizeUnknownErrorPart(entryValue, seen)).filter(Boolean);
    seen.delete(value);
    return parts.length ? parts.join('; ') : undefined;
  }
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return CIRCULAR_REFERENCE_LABEL;
    }
    seen.add(value);
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => {
        const normalizedValue = normalizeUnknownErrorPart(entryValue, seen);
        return normalizedValue ? `${key}: ${normalizedValue}` : undefined;
      })
      .filter(Boolean);
    seen.delete(value);

    if (entries.length) {
      return entries.join('; ');
    }

    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const formatErrorForDisplay = (error: unknown): string | undefined => {
  if (!error) {
    return undefined;
  }

  const normalizedString = normalizeUnknownErrorPart(error);
  if (typeof error === 'string') {
    return normalizedString;
  }

  const { cause, details, message } = error as ErrorLike;
  const normalizedMessage = normalizeUnknownErrorPart(message);
  const normalizedDetails = normalizeUnknownErrorPart(details);
  const normalizedCause = normalizeUnknownErrorPart(cause);

  const detailParts = [normalizedDetails, normalizedCause].filter(Boolean);
  if (normalizedMessage && detailParts.length) {
    const detailText = detailParts.join('; ');
    return normalizedMessage.includes(detailText) ? normalizedMessage : `${normalizedMessage}: ${detailText}`;
  }

  return normalizedMessage || detailParts[0] || normalizedString;
};
