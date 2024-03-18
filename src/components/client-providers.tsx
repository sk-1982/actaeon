'use client';

import { ReactNode } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ErrorProvider } from '@/components/error-modal';

export function ClientProviders({ children }: { children: ReactNode }) {
	return (<ErrorProvider>
		<NextUIProvider className="h-full flex">
			<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
				{children}
			</NextThemesProvider>
		</NextUIProvider>
	</ErrorProvider>);
}
