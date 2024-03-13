import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import bcrypt from 'bcrypt';
import { DBUserPayload } from '@/types/user';

let basePath = process.env.BASE_PATH ?? '';
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);

export const {
	handlers: { GET, POST },
	auth,
	signIn,
	signOut
} = NextAuth({
	pages: {
		signIn: `${basePath}/auth/login`
	},
	basePath: `${basePath}/api/auth/`,
	session: {
		strategy: 'jwt'
	},
	trustHost: true,
	callbacks: {
		jwt({ token, user  }) {
			token.user ??= user;
			return token;
		},
		session({ session, token, user }) {
			session.user = { ...session.user, ...(token.user as any) };
			return session;
		}
	},
	providers: [CredentialsProvider({
		name: 'Credentials',
		credentials: {
			username: { label: 'Username', type: 'text', placeholder: 'Username' },
			password: { label: 'Password', type: 'password' }
		},
		async authorize({ username, password }, req) {
			if (typeof username !== 'string' || typeof password !== 'string')
				return null;

			const user = await db.selectFrom('aime_user as u')
				.where(({ eb, fn }) =>
					eb(fn<string>('lower', ['u.username']), '=', username.toLowerCase().trim()))
				.leftJoin(
					eb => eb.selectFrom('chuni_profile_data as chuni')
						.where(({ eb, selectFrom }) => eb('chuni.version', '=', selectFrom('chuni_static_music')
							.select(({ fn }) => fn.max('version').as('latest'))))
						.selectAll()
						.as('chuni'),
					join => join.onRef('chuni.user', '=', 'u.id'))
				.select(({ fn }) => [
					'u.username', 'u.password', 'u.id', 'u.email', 'u.permissions', 'u.created_date', 'u.last_login_date',
					'u.suspend_expire_time',
					fn<boolean>('not isnull', ['chuni.id']).as('chuni')
				])
				.executeTakeFirst();

			if (!user?.password || !await bcrypt.compare(password.trim(), user.password))
				return null;

			const { password: _, ...payload } = user satisfies DBUserPayload;

			return payload as any;
		}
	})]
});
