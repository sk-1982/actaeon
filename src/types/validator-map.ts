import { Awaitable } from '@/types/awaitable';

type Validator<T, K extends keyof T, D> = undefined extends D ?
	(val: T[K]) => Awaitable<T[K] | null | undefined> | void :
	(val: T[K], data: D) => Awaitable<T[K] | null | undefined> | void;

export type ValidatorMap<T, D=undefined> = {
	set: <K extends keyof T>(key: K, val: Validator<T, K, D>) => void,
	get: <K extends keyof T>(key: K) => Validator<T, K, D> | undefined,
	has: (key: string) => boolean
};
