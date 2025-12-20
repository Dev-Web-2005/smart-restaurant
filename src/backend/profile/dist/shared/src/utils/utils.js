"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJSONIgnoreNullsOrUndefined = toJSONIgnoreNullsOrUndefined;
exports.filterNullValues = filterNullValues;
exports.extractFields = extractFields;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
exports.sleep = sleep;
exports.randomString = randomString;
exports.isValidTimeString = isValidTimeString;
exports.isFutureTime = isFutureTime;
function toJSONIgnoreNullsOrUndefined(obj) {
    const jsonObj = {};
    for (const key in obj) {
        const value = obj[key];
        if (value !== null && value !== undefined) {
            jsonObj[key] = value;
        }
    }
    return jsonObj;
}
function filterNullValues(obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});
}
function extractFields(source, fields) {
    return fields.reduce((acc, field) => {
        if (source[field] !== undefined && source[field] !== null) {
            acc[field] = source[field];
        }
        return acc;
    }, {});
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === "string")
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === "object")
        return Object.keys(value).length === 0;
    return false;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function randomString(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function isValidTimeString(time) {
    try {
        const date = new Date(time);
        return !isNaN(date.getTime());
    }
    catch {
        return false;
    }
}
function isFutureTime(time) {
    try {
        const date = typeof time === "string" ? new Date(time) : time;
        if (isNaN(date.getTime()))
            return false;
        return date.getTime() > Date.now();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=utils.js.map