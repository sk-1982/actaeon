import { Awaitable } from '@/types/awaitable';
import { Entries } from 'type-fest';

type Validator<T, K extends keyof T, D> = undefined extends D ?
	(val: NonNullable<Required<T>[K]>) => Awaitable<T[K] | null | undefined> | void :
	(val: NonNullable<Required<T>[K]>, data: D) => Awaitable<T[K] | null | undefined> | void;

export type ValidatorMap<T, D=undefined> = {
	set: <K extends keyof T>(key: K, val: Validator<Required<T>, K, D>) => void,
	get: <K extends keyof T>(key: K) => Validator<Required<T>, K, D> | undefined,
	has: (key: string) => boolean
};

type ValidationResult<T> = { error: true, message: string; } | { error: false, value: T; };

type ValidatorChecker<T, R, D = undefined> = undefined extends D ? (val: T) => Promise<ValidationResult<R>> :
	(val: T, data: D) => Promise<ValidationResult<R>>;

type ValidationInput<T> = { [K in keyof T]?: T[K] | null };

type Validated<T, NonNullableKeys extends keyof T, RequiredKeys extends keyof T> = { [K in keyof T]?: (K extends NonNullableKeys ? T[K] : T[K] | null) } &
	{ [K in RequiredKeys]-?: (K extends NonNullableKeys ? T[K] : T[K] | null) };

class ValidatorBuilder<T extends object, D, NonNullableKeys extends keyof T, RequiredKeys extends keyof T> {
	private _nonNullableKeys: ((keyof T) & string)[] = [];
	private _requiredKeys: ((keyof T) & string)[] = [];
	private validatorMap: ValidatorMap<ValidationInput<T>, D> = new Map();

	withValidator<K extends keyof T>(key: K, validator: Validator<Required<ValidationInput<T>>, K, D>): this{
		this.validatorMap.set(key, validator);
		return this;
	}

	requiredKeys<K extends keyof T = never>(...keys: (string & K)[]) {
		this._requiredKeys = keys;
		return this as ValidatorBuilder<T, D, NonNullableKeys, K>;
	}

	nonNullableKeys<K extends keyof T = never>(...keys: (string & K)[]) {
		this._nonNullableKeys = keys;
		return this as ValidatorBuilder<T, D, K, RequiredKeys>;
	}

	validate = (async (value, data) => {
		for (const k of this._requiredKeys) {
			if (!(k in value))
				return { error: true, message: `Key ${k} is required` };
		}

		const update: ValidationInput<T> = {};

		for (let [key, val] of (Object.entries(value) as Entries<ValidationInput<T>>)) {
			if (!this.validatorMap.has(key as any))
				return { error: true, message: `Unknown key ${key}` };

			if (val === undefined) val = null;
			try {
				if (val !== null)
					val = (await this.validatorMap.get(key as any)!(val as any, data)) ?? val;
			} catch (e: any) {
				return { error: true, message: e?.message ?? 'Unknown error occurred' };
			}
			if (val === null && this._nonNullableKeys?.includes(key as any))
				return { error: true, message: `Key ${key} is required` };
			update[key as keyof ValidationInput<T>] = val as any;
		}

		return { error: false, value: update };
	 }) as ValidatorChecker<ValidationInput<T>, Validated<T, NonNullableKeys, RequiredKeys>, D>;
}

export const makeValidator = <T extends object, D>() => {
	return new ValidatorBuilder<T, D, never, never>();
};
