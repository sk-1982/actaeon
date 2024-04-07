import NextAuth, { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db, GeneratedDB } from '@/db';
import { DBUserPayload } from '@/types/user';
import { cache } from 'react';
import { SelectQueryBuilder, sql } from 'kysely';
import { AimeUser } from '@/types/db';
import crypto from 'crypto';
import { createActaeonTeamsFromExistingTeams } from './data/team';
import { createActaeonFriendsFromExistingFriends } from './data/friend';

let basePath = process.env.BASE_PATH ?? '';
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);

const selectUserProps = (builder: SelectQueryBuilder<GeneratedDB & { u: AimeUser }, 'u', {}>) => builder.leftJoin(
	eb => eb.selectFrom('chuni_profile_data as chuni')
		.where(({ eb, selectFrom }) => eb('chuni.version', '=', selectFrom('chuni_static_music')
			.select(({ fn }) => fn.max('version').as('latest'))))
		.selectAll()
		.as('chuni'),
	join => join.onRef('chuni.user', '=', 'u.id'))
	.leftJoin('actaeon_user_ext as ext', 'ext.userId', 'u.id')
	.select(({ fn }) => [
		'u.username', 'u.password', 'u.id', 'u.email', 'u.permissions', 'u.created_date', 'u.last_login_date',
		'u.suspend_expire_time',
		'ext.uuid',
		'ext.visibility',
		'ext.homepage',
		'ext.team',
		fn<boolean>('not isnull', ['chuni.id']).as('chuni')
	] as const)
	.executeTakeFirst();

const config: Partial<NextAuthConfig> = {};

if (['0', 'false', 'no'].includes(process.env.COOKIE_SECURE?.toLowerCase()!))
	config.useSecureCookies = false;
else if (['1', 'true', 'yes'].includes(process.env.COOKIE_SECURE?.toLowerCase()!))
	config.useSecureCookies = true;

const nextAuth = NextAuth({
	pages: {
		signIn: `${basePath}/auth/login`
	},
	...config,
	basePath: `${basePath}/api/auth/`,
	session: {
		strategy: 'jwt'
	},
	trustHost: true,
	callbacks: {
		async jwt({ token, user  }) {
			token.user ??= user;

			if (db) {
				const dbUser = await selectUserProps(db.selectFrom('aime_user as u')
					.where('u.id', '=', (token.user as any).id));

				if (dbUser) {
					const { password, ...payload } = dbUser;
					token.user = { ...(token.user as any), ...payload };
				}
			}

			return token;
		},
		session({ session, token, user }) {
			session.user = { ...session.user, ...(token.user as any) };
			return session;
		},
		async signIn({ user }) {
			if ((user as any).visibility === null) {
				const uuid = crypto.randomUUID();
				await db.insertInto('actaeon_user_ext')
					.values({
						userId: (user as any).id,
						uuid,
						visibility: 0
					})
					.executeTakeFirst();
				(user as any).uuid = uuid;
				(user as any).visibility = 0;

				await Promise.all([
					createActaeonTeamsFromExistingTeams().catch(console.error),
					createActaeonFriendsFromExistingFriends().catch(console.error)
				]);
			}

			const now = new Date();
			(user as any).last_login_date = now;
			await db.updateTable('aime_user')
				.set({ last_login_date: now })
				.where('id', '=', (user as any).id)
				.executeTakeFirst();

			return true;
		}
	},
	providers: [CredentialsProvider({
		name: 'Credentials',
		credentials: {
			username: { label: 'Username', type: 'text', placeholder: 'Username' },
			password: { label: 'Password', type: 'password' }
		},
		async authorize({ username, password }, req) {
			const bcrypt = await import('bcrypt');

			if (typeof username !== 'string' || typeof password !== 'string')
				return null;

			const user = await selectUserProps(db.selectFrom('aime_user as u')
				.where(({ eb, fn }) =>
					eb(fn<string>('lower', ['u.username']), '=', username.toLowerCase().trim())));

			if (!user?.password || !await bcrypt.compare(password.trim(), user.password))
				return null;

			const { password: _, ...payload } = user satisfies { [K in keyof DBUserPayload]: DBUserPayload[K] | null };

			return payload as any;
		}
	})]
});

export const auth = process.env.NEXT_RUNTIME !== 'edge' ? cache(nextAuth.auth) : (null as never);

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth: uncachedAuth
} = nextAuth;
