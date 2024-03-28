import { JsonPrimitive } from 'type-fest';

declare const parseableToJson: unique symbol;

// opaque type helper for setting the return type of json.parse
export type ParseableToJSON<T> = string & { [parseableToJson]: T };

export type ParsedToJSON<T, ParseKeys extends keyof T = keyof T> = { [K in keyof T]: K extends ParseKeys ? T[K] extends ParseableToJSON<infer R> ? R : T[K] : T[K] };

// helper type to convert data types to json returned from db selects
export type DBJSONPrimitive<T> = T extends Date ? string : // dates get converted to strings
	T extends ParseableToJSON<infer R> ? R : // unwrap nested ParseableToJSON
	T extends JsonPrimitive ? T : // types directly representable as json
	T extends object ? { [K in keyof T]: DBJSONPrimitive<T[K]> } : // object, convert entries to json
	T extends any[] ? DBJSONPrimitive<T[number]> : // array, convert entries to json
		never; // cannot serialize other types

declare global {
	interface JSON {
		parse<T = any>(text: (T extends string ? T : never) | string, reviver?: (this: any, key: string, value: any) => any):
			T extends ParseableToJSON<infer R> ?
				R : // jsonparseable helper
				string extends T ?
					any : // plain string passed in, could be any type
					T;    // type assertion through manual type argument
	}
}
