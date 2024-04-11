const fs = require('fs');
const path = require('path');
const bundleAnalyzer = require('@next/bundle-analyzer');
require('ts-node').register({ compilerOptions: { module: 'commonjs' } });

const resolveConfig = require('tailwindcss/resolveConfig.js');
const tailwindConfig = require('./tailwind.base.ts');
const resolved = resolveConfig(tailwindConfig);

let baseAssetUrl = process.env.ASSET_URL ?? '/';
if (!baseAssetUrl.endsWith('/')) baseAssetUrl += '/';

let basePath = process.env.BASE_PATH ?? '';
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);

const packageInfo = JSON.parse(fs.readFileSync('package.json').toString());

let versionString = `Actaeon v${packageInfo.version}`;

try {
    const rev = fs.readFileSync('.git/HEAD').toString().trim();
    if (!rev.includes(':'))
        versionString += ` (${rev})`;
    const branch = rev.replace(/^ref:\s+refs\/heads\//, '');
    const hash = fs.readFileSync(`.git/${rev.slice(5)}`).toString().trim();
    if (branch !== 'main')
        versionString += ` on ${branch}`;
    versionString += ` (${hash.slice(0, 8)})`;
} catch { }

/** @type {import('next').NextConfig} */
module.exports = bundleAnalyzer({ enabled: !!process.env.ANALYZE })({
    images: {
        unoptimized: true
    },
    basePath,
    async redirects() {
        return [...(basePath ? [{
            source: '/',
            destination: basePath,
            permanent: false,
            basePath: false
        }] : []), {
            source: '/chuni',
            destination: '/chuni/dashboard',
            permanent: false
        }]
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_ASSET_URL: baseAssetUrl,
        NEXT_PUBLIC_VERSION_STRING: versionString,
        NEXT_PUBLIC_TAILWIND_SCREENS: JSON.stringify(resolved.theme.screens)
    },
    sassOptions: {
        additionalData: `$asset-url: "${baseAssetUrl}";`
    },
    experimental: {
        instrumentationHook: true
    },
    productionBrowserSourceMaps: true,
    webpack: config => {
        config.externals = [...config.externals, 'bcrypt', 'mysql2'];
        return config;
    }
});
