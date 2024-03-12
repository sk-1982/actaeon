import { AimeUser } from '@/types/db';

export type DBUserPayload = Omit<AimeUser, 'password'> & {
	chuni: boolean
};

export type UserPayload = {
	[T in keyof DBUserPayload]: DBUserPayload[T] extends (Date | null) ? (string | null) :
		DBUserPayload[T]
} & {
	iat: number,
	exp: number,
};
