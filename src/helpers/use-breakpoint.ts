import { useMediaQuery } from 'usehooks-ts';
import { TAILWIND_SCREENS } from '@/types/tailwind';

const breakpoints = Object.entries(TAILWIND_SCREENS)
	.sort(([, a], [, b]) => parseInt(a) - parseInt(b));

export const useBreakpoint = () => {
	let activeName: string | undefined;
	for (const [name, width] of breakpoints) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		if (useMediaQuery(`(min-width: ${width})`))
			activeName = name;
	}

	return activeName;
};
