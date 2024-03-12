export const floorToDp = (num: number | string, decimals: number) => {
	if (typeof num === 'string') {
		return num.slice(0, num.indexOf('.') + decimals + 1);
	}

	const mult = (10 ** decimals);
	return (Math.floor(num * mult) / mult).toFixed(decimals);
};
