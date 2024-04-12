'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { UserPermissions } from '@/types/permissions';
import { requirePermission } from '@/helpers/permissions';
import { UserPayload } from '@/types/user';
import { sql } from 'kysely';
import { EMAIL_REGEX } from '@/helpers/validators';
import { createActaeonTeamsFromExistingTeams } from '@/data/team';
import { createActaeonFriendsFromExistingFriends } from '@/data/friend';

export const getUser = async () => {
	const session = await auth();
	return session?.user;
};

type RequireUserOptions = {
	permission?: UserPermissions[] | UserPermissions
};

export const requireUser = async (opts?: RequireUserOptions): Promise<UserPayload> => {
	const user = await getUser();

	if (!user) {
		return redirect(`/auth/login?error=1&callbackUrl=${encodeURIComponent(headers().get('x-path') ?? '/')}`)
	}

	if (opts?.permission !== undefined)
		requirePermission(user.permissions, ...(Array.isArray(opts.permission) ? opts.permission : [opts.permission]));

	return user;
};

type LoginOptions = {
	username?: string | null,
	password?: string | null,
	redirectTo?: string | null
}

export const login = async (options?: LoginOptions) => {
	if (!options)
		return { redirect: await signIn(undefined, { redirect: false }) as string };

	try {
		const res = await signIn('credentials', {
			...options,
			redirectTo: options.redirectTo ?? '/',
			redirect: false,
		});
		return { redirect: res };
	} catch (e) {
		if (e instanceof AuthError) {
			if (e.type === 'CredentialsSignin')
				return { error: true, message: 'Invalid username or password' };

			return { error: true, message: 'Unknown log in error' };
		}

		throw e;
	}
};

export const logout = async (options: { redirectTo?: string }) => {
	return await signOut({
		...options,
		redirect: false
	});
};

export const register = async (formData: FormData) => {
	const username = formData.get('username')?.toString()?.trim();
	const password = formData.get('password')?.toString()?.trim();
	const email = formData.get('email')?.toString()?.trim();
	const password2 = formData.get('password2')?.toString()?.trim();
	const accessCode = formData.get('accessCode')?.toString()?.trim();

	if (!username)
		return { error: true, message: 'Username required' };
	if (!password)
		return { error: true, message: 'Password required' };
	if (!email)
		return { error: true, message: 'Email required' };
	if (!accessCode)
		return { error: true, message: 'Access code required' };
	if (password !== password2)
		return { error: true, message: 'Passwords do not match' };
	if (password.length < 8)
		return { error: true, message: 'Password must be at least 8 characters' };
	if (!/^\d{20}$/.test(accessCode))
		return { error: true, message: 'Invalid access code format' };
	if (!EMAIL_REGEX.test(email))
		return { error: true, message: 'Invalid email' };

	const hashedPassword = await bcrypt.hash(password, process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12)

	const existingUser = await db.selectFrom('aime_user as u')
		.leftJoin('aime_card as c', 'c.user', 'u.id')
		.where(({eb, and, or, fn}) =>
			or([
				eb(fn<string>('lower', ['u.username']), '=', username.toLowerCase()),
				eb(fn<string>('lower', ['u.email']), '=', email.toLowerCase()),
				and([
					eb('c.access_code', '=', accessCode),
					or([
						eb('u.username', 'is not', null),
						eb('u.email', 'is not', null)
					])
				])
			])
		)
		.select('u.id')
		.executeTakeFirst();

	if (existingUser)
		return { error: true, message: 'User already exists' };

	const user = await db.selectFrom('aime_user as u')
		.leftJoin('aime_card as c', 'c.user', 'u.id')
		.where(eb => eb('c.access_code', '=', accessCode)
			.and(eb('u.email', 'is', null))
			.and(eb('u.username', 'is', null)))
		.select('u.id')
		.executeTakeFirst();

	if (!user)
		return { error: true, message: 'Access code does not exist' };

	await db.updateTable('aime_user')
		.where('id', '=', user.id)
		.set('username', username)
		.set('password', hashedPassword)
		.set('email', email)
		.execute();

	await db.insertInto('actaeon_user_ext')
		.values({
			userId: user.id,
			uuid: sql`uuid_v4()`,
			visibility: 0
		})
		.executeTakeFirst();

	await Promise.all([
		createActaeonTeamsFromExistingTeams().catch(console.error),
		createActaeonFriendsFromExistingFriends().catch(console.error)
	]);

	return { error: false };
};
