/**
 * Input sanitization — XSS prevention
 */
export function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as any)[key] = sanitize(value);
    }
  }
  return result;
}
