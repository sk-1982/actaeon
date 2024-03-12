import { PageProps } from '@/types/page';
import { RegisterCard } from '@/components/register-card';

export default async function RegisterPage({ searchParams }: PageProps) {
	return (<RegisterCard callback={searchParams?.['callbackUrl']?.toString()} />)
}
