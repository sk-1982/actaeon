import type { Config } from "tailwindcss"
import baseConfig from './tailwind.base';
const {nextui} = require("@nextui-org/react");

const config = {
  ...baseConfig,
  plugins: [require('tailwindcss-text-fill-stroke'), nextui({
    themes: {
      dark: {
        colors: {
          background: '#0d0a0f',
          primary: '#9500ff',
          focus: '#9500ff',
          content1: '#050406',
          content2: '#1f202d',
          content3: '#303247',
          content4: '#393b53',
        }
      },
      light: {
        colors: {
          background: '#fefefe',
          primary: {
            DEFAULT: '#9500ff',
            foreground: '#ffffff'
          },
          focus: {
            DEFAULT: '#9500ff',
            foreground: '#ffffff'
          },
          content1: '#f4f3f7'
        }
      }
    }
  })],
} satisfies Config

export default config
