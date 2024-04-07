'use client';

import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ErrorProvider } from '@/components/error-modal';
import { ConfirmProvider } from '@/components/confirm-modal';
import { PromptProvider } from '@/components/prompt-modal';
import { useWindowListener } from '@/helpers/use-window-listener';
import { usePathname } from 'next/navigation';

const ReloadContext = createContext(false);

export const useReloaded = () => useContext(ReloadContext);

export function ClientProviders({ children }: { children: ReactNode; }) {
	const [isReloaded, setReloaded] = useState(false);
	const pathname = usePathname();
	const lastPathname = useRef<string | null>(null);

	useEffect(() => {
		const reloaded = sessionStorage.getItem('reload');
		if (reloaded && Date.now() - +reloaded < 1000)
			setReloaded(true);
		sessionStorage.removeItem('reload');
	}, []);
	useWindowListener('beforeunload', () => sessionStorage.setItem('reload', Date.now().toString()));
	useEffect(() => {
		if (lastPathname.current !== null) {
			if (lastPathname.current !== pathname)
				setReloaded(false);
		}

		lastPathname.current = pathname;
	}, [pathname]);

	return (<ReloadContext.Provider value={isReloaded}>
		<ErrorProvider>
			<ConfirmProvider>
				<PromptProvider>
					<NextUIProvider className="h-full flex">
						<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
							{children}
						</NextThemesProvider>
					</NextUIProvider>
				</PromptProvider>
			</ConfirmProvider>
		</ErrorProvider>
	</ReloadContext.Provider>);
}
