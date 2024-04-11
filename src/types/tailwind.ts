import tailwindConfig from '@/../tailwind.config';
import resolveConfig from 'tailwindcss/resolveConfig';

export type TailwindConfig = ReturnType<typeof resolveConfig<typeof tailwindConfig>>;
export type TailwindScreens = TailwindConfig['theme']['screens'];

export const TAILWIND_SCREENS = JSON.parse(process.env.NEXT_PUBLIC_TAILWIND_SCREENS!) as TailwindScreens;
