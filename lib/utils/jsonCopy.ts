export function jsonCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
