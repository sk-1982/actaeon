export const enum UserPermissions {
	USER = 0, // regular user
	USERMOD = 1, // can moderate other users
	ACMOD = 2, // can add arcades and cabs
	SYSADMIN = 3, // can change settings

	OWNER = 7 // can do anything
}

export const USER_PERMISSION_NAMES = new Map([
	[UserPermissions.USERMOD, { title: 'User Moderator', description: 'Can moderate, view, and edit all users' }],
	[UserPermissions.ACMOD, { title: 'Arcade Moderator', description: 'Can create, delete, and modify arcades' }],
	[UserPermissions.SYSADMIN, { title: 'Sysadmin', description: 'Can change server settings' }],
	[UserPermissions.OWNER, { title: 'Owner', description: 'Can do anything' }]
]);

export const USER_PERMISSION_MASK = (1 << UserPermissions.USER) | (1 << UserPermissions.USERMOD) |
	(1 << UserPermissions.ACMOD) | (1 << UserPermissions.SYSADMIN) | (1 << UserPermissions.OWNER);

export const enum ArcadePermissions {
	VIEW = 0, // view info and cabs
	BOOKKEEP = 1, // view bookkeeping info
	EDITOR = 2, // can edit name, settings
	REGISTRAR = 3, // can add cabs

	OWNER = 7 // can do anything
}

export const ARCADE_PERMISSION_NAMES = new Map([
	[ArcadePermissions.BOOKKEEP, { title: 'Bookkeeper', description: 'Can view bookkeeping info (registered users and arcade IP)' }],
	[ArcadePermissions.EDITOR, { title: 'Editor', description: 'Can edit arcade settings' }],
	[ArcadePermissions.REGISTRAR, { title: 'Registrar', description: 'Can add and edit cabs' }],
	[ArcadePermissions.OWNER, { title: 'Arcade Owner', description: 'Can do anything' }]
]);

export const ARCADE_PERMISSION_MASK = (1 << ArcadePermissions.VIEW) | (1 << ArcadePermissions.BOOKKEEP) |
	(1 << ArcadePermissions.EDITOR) | (1 << ArcadePermissions.REGISTRAR) | (1 << ArcadePermissions.OWNER);
