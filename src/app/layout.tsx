import './globals.scss';
import { LayoutProps } from '@/types/layout';
import { getAssetUrl } from '@/helpers/assets';
import { Providers } from '@/components/providers';

export default async function RootLayout({children}: LayoutProps) {
	return (
		<html lang="en" className="h-full dark">
			<head>
				<title>Actaeon</title>
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-L-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-M-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-DB-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-B-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-EB-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/FOT-RodinProN-UB-en.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
				<link rel="preload" href={getAssetUrl('/fonts/HelveticaNowDisplay-ExtraBold.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
			</head>
				<body className="h-full">
				<Providers>
					{children}
				</Providers>
				</body>
		</html>
	);
}
