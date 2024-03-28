import { AimeUser, DB } from '@/types/db';

export type DBUserPayload = Omit<AimeUser, 'password'> & Omit<DB['actaeon_user_ext'], 'userId'> & {
	chuni: boolean
};

export type UserPayload = {
	[T in keyof DBUserPayload]: DBUserPayload[T] extends (Date | null) ? (string | null) :
		DBUserPayload[T]
} & {
	iat: number,
	exp: number,
};

export const enum UserVisibility {
	FRIENDS = 1,
	TEAMMATES = 2,
	ARCADE = 4,
	LOGGED_IN = 8,
	EVERYONE = 16
}

export const USER_VISIBILITY_NAMES = new Map([
	[UserVisibility.EVERYONE, 'Everyone'],
	[UserVisibility.LOGGED_IN, 'Logged-in Users'],
	[UserVisibility.ARCADE, 'Shared Arcade Members'],
	[UserVisibility.TEAMMATES, 'Teammates'],
	[UserVisibility.FRIENDS, 'Friends'],
]);

export const USER_VISIBILITY_MASK = UserVisibility.FRIENDS | UserVisibility.TEAMMATES |
	UserVisibility.ARCADE | UserVisibility.LOGGED_IN | UserVisibility.EVERYONE;
