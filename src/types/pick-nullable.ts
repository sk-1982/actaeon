export type PickNullable<T, K extends keyof NonNullable<T>> =
	T extends undefined | null ? T :
			Pick<NonNullable<T>, K>;
