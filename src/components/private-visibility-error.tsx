'use client';

import { useUser } from '@/helpers/use-user';
import { login } from '@/actions/auth';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export const PrivateVisibilityError = () => {
	const user = useUser();

	return (<main className="flex flex-col w-full m-auto items-center gap-4 pb-10 text-center">
		<LockClosedIcon className="w-48 mb-10" />
		<header className="text-2xl font-semibold">This page is private.</header>
		{!user ? <span>You may be able to access it by&nbsp;
			<span className="underline hover:text-secondary transition cursor-pointer" onClick={() => login()
				.then(r => setTimeout(() => location.href = r.redirect!, 10))}>logging in.</span>
		</span> : <span>You do not have permission to view this page.</span>}
	</main>);
}
