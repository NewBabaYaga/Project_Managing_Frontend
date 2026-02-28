/**
 * Extract a human-readable error message from an axios error response.
 * Handles both simple { message } and detailed { message, errors } formats.
 */
export function getErrorMessage(err, fallback = 'An error occurred') {
  const data = err?.response?.data;
  if (!data) return fallback;

  if (data.errors) {
    // Field-level validation errors — flatten into a single string
    const messages = Object.entries(data.errors)
      .flatMap(([field, msgs]) =>
        msgs.map((m) => `${field.replace(/^.*\./, '')}: ${m}`)
      );
    return messages.join('\n') || data.message || fallback;
  }

  return data.message || fallback;
}

/**
 * Extract field errors as an object { fieldName: errorString }
 * for inline form validation display.
 */
export function getFieldErrors(err) {
  const data = err?.response?.data;
  if (!data?.errors) return {};
  return Object.fromEntries(
    Object.entries(data.errors).map(([k, msgs]) => [
      k.replace(/^.*\./, '').toLowerCase(),
      msgs[0],
    ])
  );
}
