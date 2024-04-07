import './globals.scss';
import { LayoutProps } from '@/types/layout';
import { getAssetUrl } from '@/helpers/assets';
import { Providers } from '@/components/providers';
import Script from 'next/script';

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
				<Script id="version-info">
					const c = [`color:#7300ac`,`color:#7800ae`,`color:#7d00b0`,`color:#8300b2`,`color:#8800b4`,`color:#8d00b6`,`color:#9200b8`,`color:#9700bb`,`color:#9c00bd`,`color:#a200bf`,`color:#a700c1`,`color:#ac00c3`,`color:#b100c5`,`color:#b600c7`,`color:#bc00c9`,`color:#c100cb`,`color:#c600cd`,`color:#cb00cf`,`color:#d000d1`,`color:#d600d3`,`color:#db00d5`,`color:#e000d8`,`color:#e500da`,`color:#ea00dc`,`color:#ef00de`,`color:#f500e0`,`color:#fa00e2`,`color:#ff00e4`];
					console.log(`%c▄%c▀%c█%c %c█%c▀%c▀%c %c▀%c█%c▀%c %c▄%c▀%c█%c %c█%c▀%c▀%c %c█%c▀%c█%c %c█%c▄%c░%c█\n%c█%c▀%c█%c %c█%c▄%c▄%c %c░%c█%c░%c %c█%c▀%c█%c %c█%c█%c▄%c %c█%c▄%c█%c %c█%c░%c▀%c█`, ...c, ...c);
					console.log(`This is free software. %cIf you payed for it, you have been scammed.`, `font-weight:bold`);
					console.log(`%c{process.env.NEXT_PUBLIC_VERSION_STRING}`, `color:gray;font-style:italic`);
				</Script>
			</body>
		</html>
	);
}
