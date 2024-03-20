export const enum UserPermissions {
	USER = 0, // regular user
	USERMOD = 1, // can moderate other users
	ACMOD = 2, // can add arcades and cabs
	SYSADMIN = 3, // can change settings

	OWNER = 7 // can do anything
}

export const enum ArcadePermissions {
	VIEW = 0, // view info and cabs
	BOOKKEEP = 1, // view bookkeeping info
	EDITOR = 2, // can edit name, settings
	REGISTRAR = 3, // can add cabs

	OWNER = 7 // can do anything
}
