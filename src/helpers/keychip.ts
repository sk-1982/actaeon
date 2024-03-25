import { choice, randomInt } from '@/helpers/random';

export const KEYCHIP_PLATFORMS = {
	RING: ['A72E'],
	NU: ['A60E'],
	NUSX: ['A61X', 'A69X'],
	ALLS: ['A63E']
} as const;

export const generateRandomKeychip = () => {
	const platform = choice(Object.values(KEYCHIP_PLATFORMS).flat());

	return platform +
		// TODO: looks like more keychip numbers than just these are accepted by games
		(platform[3] === 'X' ? '20A' : `01${choice('ABCDU')}`) +
		randomInt(0, 9999_9999).toString().padStart(8, '0');
};
