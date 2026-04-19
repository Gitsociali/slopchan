type ErrorLike = {
  cause?: unknown;
  details?: unknown;
  message?: unknown;
};

const normalizeUnknownErrorPart = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map(normalizeUnknownErrorPart).filter(Boolean);
    return parts.length ? parts.join('; ') : undefined;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => {
        const normalizedValue = normalizeUnknownErrorPart(entryValue);
        return normalizedValue ? `${key}: ${normalizedValue}` : undefined;
      })
      .filter(Boolean);

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
