'use client';

import { ReactNode } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ErrorProvider } from '@/components/error-modal';
import { ConfirmProvider } from '@/components/confirm-modal';
import { PromptProvider } from '@/components/prompt-modal';

export function ClientProviders({ children }: { children: ReactNode }) {
	return (<ErrorProvider>
		<ConfirmProvider>
			<PromptProvider>
				<NextUIProvider className="h-full flex">
					<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
						{children}
					</NextThemesProvider>
				</NextUIProvider>
			</PromptProvider>
		</ConfirmProvider>
	</ErrorProvider>);
}
