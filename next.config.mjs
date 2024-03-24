let baseAssetUrl = process.env.ASSET_URL ?? '/';
if (!baseAssetUrl.endsWith('/')) baseAssetUrl += '/';

let basePath = process.env.BASE_PATH ?? '';
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);

/** @type {import('next').NextConfig} */
const nextConfig = {
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
            source: '/',
            destination: '/dashboard',
            permanent: false
        }, {
            source: '/chuni',
            destination: '/chuni/dashboard',
            permanent: false
        }]
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_ASSET_URL: baseAssetUrl
    },
    sassOptions: {
        additionalData: `$asset-url: "${baseAssetUrl}";`
    },
    experimental: {
        instrumentationHook: true
    },
    productionBrowserSourceMaps: true
};

export default nextConfig;
