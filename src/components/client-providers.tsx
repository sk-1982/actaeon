'use client';

import { ReactNode } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ClientProviders({ children }: { children: ReactNode }) {
	return (<NextUIProvider className="h-full flex">
		<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
			{children}
		</NextThemesProvider>
	</NextUIProvider>);
}
