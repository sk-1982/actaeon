import type { Config } from 'tailwindcss';

const config = {
	mode: 'jit',
	darkMode: ["class"],
	content: [
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	prefix: "",
	theme: {
		extend: {
			screens: {
				'3xl': '1600px',
				'4xl': '1920px',
				'5xl': '2560px',
				'6xl': '3440px'
			},
			colors: {
				'chuni-justice-critical': '#dfb920',
				'chuni-justice': '#db7814',
				'chuni-attack': '#61a873',
				'chuni-miss': '#adadad'
			}
		}
	}
} satisfies Config;

export default config;
