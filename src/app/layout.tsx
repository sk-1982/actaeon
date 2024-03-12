import './globals.scss';
import { LayoutProps } from '@/types/layout';
import { getAssetUrl } from '@/helpers/assets';
import { Providers } from '@/components/providers';

export default async function RootLayout({children}: LayoutProps) {
	return (
		<html lang="en" className="h-full dark">
			<head>
				<title>Actaeon</title>
				<link rel="preload" href={getAssetUrl('/fonts/rodinl.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/rodinm.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/rodindb.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/rodinb.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/rodineb.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/rodinub.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
			</head>
				<body className="h-full">
				<Providers>
					{children}
				</Providers>
				</body>
		</html>
	);
}
