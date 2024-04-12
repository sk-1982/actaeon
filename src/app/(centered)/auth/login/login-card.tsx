'use client';

import { Button } from '@nextui-org/button';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { BackButton } from '@/components/back-button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import { login } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { useUser } from '@/helpers/use-user';

export type LoginCardProps = {
	referer?: string | null,
	callback?: string | null,
	initialError?: string | null
};

export const LoginCard = ({ initialError, referer, callback }: LoginCardProps) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(initialError ? 'You must be logged in to do that.' : '');
	const user = useUser();

	if (user) {
		if (callback?.startsWith(process.env.NEXT_PUBLIC_BASE_PATH!))
			callback = callback.replace(process.env.NEXT_PUBLIC_BASE_PATH!, '');

		return redirect(callback ?? '/');
	}

	const submit = (form: FormData) => {
		setLoading(true);
		setError('');
		login({
			username: form.get('username') as string,
			password: form.get('password') as string,
			redirectTo: callback
		})
			.then(res => {
				if (res?.error)
					return setError(res.message)
				setTimeout(() => location.href = res.redirect, 10);
			})
			.finally(() => setLoading(false));
	};

	return (<Card className="mb-10 w-96 max-w-full">
		<CardHeader>
			<BackButton isIconOnly variant="ghost" referer={referer}>
				<ArrowLeftIcon className="h-5" />
			</BackButton>
			<div className="font-bold text-lg ml-auto mx-2 my-1">Login</div>
		</CardHeader>
		<Divider />
		<CardBody>
			<form className="flex flex-col" action={submit}>
				<Input type="text" name="username" isRequired label="Username" placeholder="Enter username" className="mb-3" />
				<Input type="password" name="password" isRequired label="Password" placeholder="Enter password" className="mb-3" />
				<div className="flex mb-3">
					<Link href={callback ?
						`/auth/register?callbackUrl=${encodeURIComponent(callback)}` :
						'/auth/register'}
						className="underline text-sm mr-2 ml-auto text-gray-400">
						Register account
					</Link>
				</div>
				{error && <div className="mb-2 text-danger text-center">
					{error}
        </div>}
				<Button type="submit" color="primary" disabled={loading}>
					Login
				</Button>
			</form>
		</CardBody>
	</Card>);
};
