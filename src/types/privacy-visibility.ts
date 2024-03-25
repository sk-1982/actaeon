export const enum Visibility {
	PRIVATE = 0,
	UNLISTED = 1,
	PUBLIC = 2
}

export const VISIBILITY_VALUES = new Set<Visibility>([0,1,2]);

export const enum JoinPrivacy {
	INVITE_ONLY = 0,
	PUBLIC = 1
}

export const PRIVACY_VALUES = new Set<JoinPrivacy>([0,1]);
