import { UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export const JoinSuccess = ({ href }: { href: string }) => {
	return (<main className="flex flex-col w-full m-auto items-center gap-4 pb-10 text-center">
		<UserGroupIcon className="w-48 h-48 mb-10" />
		<header className="text-2xl font-semibold">Success! You have joined</header>
		<span>Click <Link href={href} className="underline hover:text-secondary transition">here</Link> to be redirected.</span>
	</main>)
}
