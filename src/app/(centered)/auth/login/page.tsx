import { PageProps } from '@/types/page';
import { headers } from 'next/headers';
import { LoginCard } from './login-card';

export default async function LoginPage({ searchParams }: PageProps) {
	const referer = headers().get('referer');
	const callback = searchParams?.['callbackUrl']?.toString();

	return (<LoginCard initialError={searchParams?.['error']?.toString()} referer={referer} callback={callback} />);
}
