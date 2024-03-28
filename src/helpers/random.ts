export const randomInt = (min: number, max: number) => {
	const a = new Uint32Array(1);
	crypto.getRandomValues(a);
	return a[0] % (max - min + 1) + min;
};

export const choice = <T>(arr: ArrayLike<T>): T => {
	return arr[randomInt(0, arr.length - 1)];
}

export const choices = <T>(arr: ArrayLike<T>, k: number): T[] => [...new Array(k)]
	.map(() => choice(arr));

export const randomString = (length: number) => {
	return [...Array(length)].map(() => {
		let l = '';
		do {
			l = String.fromCharCode(randomInt(48, 123));
		} while (!/[A-Z\d]/i.test(l));
		return l;
	}).join('');
};
