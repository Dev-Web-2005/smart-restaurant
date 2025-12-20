interface JsonObject {
    [key: string]: unknown;
}
export declare function toJSONIgnoreNullsOrUndefined(obj: JsonObject): JsonObject;
export declare function filterNullValues(obj: any): any;
export declare function extractFields(source: any, fields: string[]): any;
export declare function deepClone<T>(obj: T): T;
export declare function isEmpty(value: any): boolean;
export declare function sleep(ms: number): Promise<void>;
export declare function randomString(length?: number): string;
export declare function isValidTimeString(time: string): boolean;
export declare function isFutureTime(time: string | Date): boolean;
export {};
