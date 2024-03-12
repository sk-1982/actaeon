import { ReactNode } from 'react';
import { CookiesProvider } from 'next-client-cookies/server';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';

export async function Providers({ children }: { children: ReactNode }) {
	return (<SessionProvider session={(await auth())} basePath={process.env.NEXT_PUBLIC_BASE_PATH + '/api/auth'}>
		{children}
	</SessionProvider>);
}
