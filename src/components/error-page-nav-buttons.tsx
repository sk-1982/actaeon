'use client';

import { Button } from '@nextui-org/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export const ErrorPageNavButtons = () => {
	const router = useRouter();

	return (<>
		<Button size="lg" variant="flat" onPress={() => router.back()}>
			Go Back
		</Button>
		<Link href="/">
			<Button size="lg" variant="flat">
				Go Home
			</Button>
		</Link>
		<Link href="/dashboard">
			<Button size="lg" variant="flat">
				Go to Dashboard
			</Button>
		</Link>
	</>);
};