interface JsonObject {
	[key: string]: unknown;
}

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
