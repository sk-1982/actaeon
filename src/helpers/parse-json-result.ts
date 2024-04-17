import { ParseableToJSON, ParsedToJSON } from '@/types/json-parseable';
import { Entries } from 'type-fest';

type ParseableKeys<T> = {
	[K in keyof T]: T[K] extends ParseableToJSON<any> ? K : never
}[keyof T];

type ParseJSONResultOptions = {
	<T extends object, K extends ParseableKeys<T>>(data: T, keys: K[]): ParsedToJSON<T, K>,
	<T extends object, K extends ParseableKeys<T>>(data: T[], keys: K[]): ParsedToJSON<T, K>[]
};

export const parseJsonResult = (<T extends object, K extends ParseableKeys<T>>(data: T | T[], keys: K[]) => {
	if (Array.isArray(data))
		return data.map(d => parseJsonResult(d, keys));
	return Object.fromEntries((Object.entries(data) as Entries<T>)
		.map(([key, val]) => [key, typeof val === 'string' && keys.includes(key as any) ? JSON.parse(val as any) : val]));
}) as ParseJSONResultOptions;
