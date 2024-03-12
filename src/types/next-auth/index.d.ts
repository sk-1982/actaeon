import NextAuth from 'next-auth';
import { UserPayload } from '@/types/user';

declare module 'next-auth' {
	interface Session {
		user: {
			[T in keyof UserPayload]: UserPayload[T]
		},
	}

	interface JWT {
		user: {
			[T in keyof UserPayload]: UserPayload[T]
		}
	}
}
