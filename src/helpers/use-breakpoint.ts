import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '@/../tailwind.base';
import { useMediaQuery } from 'usehooks-ts';

const config = resolveConfig(tailwindConfig);
const breakpoints = Object.entries(config.theme.screens)
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
