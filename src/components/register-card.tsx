'use client';

import { Button, Card, CardBody, CardHeader, Divider, Input } from '@nextui-org/react';
import { BackButton } from '@/components/back-button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@/helpers/use-user';
import { redirect } from 'next/navigation';
import { register } from '@/actions/auth';

export type RegisterCardProps = {
	callback?: string | null,
};

export const RegisterCard = ({ callback }: RegisterCardProps) => {
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const user = useUser();

	if (user)
		return redirect(callback ?? '/');
	const submit = (data: FormData) => {
		setLoading(true);
		setError('');
		register(data)
			.then(({ error, message }) => {
				if (!error)
					return setSuccess(true);
				setError(message ?? 'Unknown error occurred');
			})
			.finally(() => setLoading(false));
	};

	return (<Card className="mb-10 w-96 max-w-full">
		<CardHeader>
			<BackButton isIconOnly variant="ghost">
				<ArrowLeftIcon className="h-5" />
			</BackButton>
			<div className="font-bold text-lg ml-auto mx-2 my-1">Register</div>
		</CardHeader>
		<Divider />
		<CardBody>
			<form className="flex flex-col" action={submit}>
				<Input type="text" name="username" isRequired label="Username" placeholder="Enter username" className="mb-3" />
				<Input type="email" name="email" isRequired label="Email" placeholder="Enter email" className="mb-3" />
				<Input type="password" name="password" minLength={8} isRequired label="Password" placeholder="Enter password" className="mb-3" />
				<Input type="password" name="password2" minLength={8} isRequired label="Confirm Password" placeholder="Re-enter password" className="mb-3" />
				<Input type="text" inputMode="numeric" maxLength={20} name="accessCode" isRequired pattern="\d{20}"
					label="Access Code" placeholder="Enter code" className="mb-3" title="Enter valid 20 digit code" />
				<div className="flex mb-3">
					<Link href={callback ?
						`/auth/login?callbackUrl=${encodeURIComponent(callback)}` :
						'/auth/login'}
						className="underline text-sm mr-2 ml-auto text-gray-400">
						Login
					</Link>
				</div>
				{error && <div className="mb-2 text-danger text-center">
					{error}
        </div>}
				{success && <div className="mb-2 text-success text-center">
            Success! You may now log in.
        </div>}
				<Button type="submit" color="primary" disabled={loading}>
					Register
				</Button>
			</form>
		</CardBody>
	</Card>);
};
