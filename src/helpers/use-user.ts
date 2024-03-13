import { redirect, usePathname } from 'next/navigation';
import { UserPayload } from '@/types/user';
import { useSession } from 'next-auth/react';

type UseUserProps<R extends boolean> = {
	required?: R
};

export const useUser = <R extends boolean>({ required }: UseUserProps<R> = {}): R extends true ? UserPayload : UserPayload | null | undefined => {
	const session = useSession({
		required: required ?? false
	});
	const path = usePathname();

	if (required && !session.data?.user)
		return redirect(`/auth/login?error=1&callbackUrl=${encodeURIComponent(process.env.NEXT_PUBLIC_BASE_PATH! + path)}`);

	return session.data?.user as UserPayload;
};
