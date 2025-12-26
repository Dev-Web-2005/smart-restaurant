interface JsonObject {
  [key: string]: unknown;
}

/**
 * Convert object to JSON, ignoring null and undefined values
 */
export function toJSONIgnoreNullsOrUndefined(obj: JsonObject): JsonObject {
  const jsonObj: JsonObject = {};

  for (const key in obj) {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      jsonObj[key] = value;
    }
  }

  return jsonObj;
}

/**
 * Filter out null and undefined values from an object
 */
export function filterNullValues(obj: any): any {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
}

/**
 * Extract specific fields from source object
 */
export function extractFields(source: any, fields: string[]): any {
  return fields.reduce((acc, field) => {
    if (source[field] !== undefined && source[field] !== null) {
      acc[field] = source[field];
    }
    return acc;
  }, {} as any);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random string
 */
export function randomString(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate and parse time string
 */
export function isValidTimeString(time: string): boolean {
  try {
    const date = new Date(time);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Check if time is in the future
 */
export function isFutureTime(time: string | Date): boolean {
  try {
    const date = typeof time === "string" ? new Date(time) : time;
    if (isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
  } catch {
    return false;
  }
}
