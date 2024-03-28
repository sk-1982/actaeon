import { UserPayload } from '@/types/user';
import { UserPermissions } from '@/types/permissions';

export type UserOnly = boolean | keyof UserPayload;

export type Subroute = {
	url: string,
	name: string,
	userOnly?: UserOnly,
	permissions?: (UserPermissions | UserPermissions[])[],
	routes?: Omit<Subroute, 'routes'>[]
};

export type Route = {
	url: string,
	name: string,
	title: string,
	userOnly?: UserOnly,
	permissions?: (UserPermissions | UserPermissions[])[],
	routes: Subroute[]
};

export const MAIN_ROUTES: Route = {
	url: '/',
	name: "Actaeon",
	title: 'Actaeon',
	routes: [{
		url: '/dashboard',
		name: 'Overview'
	}, {
		url: '/arcade',
		name: 'Arcades'
	}, {
		url: '/admin',
		name: 'Admin',
		permissions: [[UserPermissions.USERMOD, UserPermissions.SYSADMIN]],
		routes: [{
			url: '/admin/users',
			name: 'Users',
			permissions: [UserPermissions.USERMOD]
		}, {
			url: '/admin/system-config',
			name: 'System Config',
			permissions: [UserPermissions.SYSADMIN]
		}]
	}]
};

export const ROUTES: Route[] = [{
	url: '/chuni',
	name: 'Chunithm',
	title: 'Chunithm',
	userOnly: 'chuni',
	routes: [{
		url: '/chuni/dashboard',
		name: 'Dashboard',
		userOnly: 'chuni'
	}, {
		url: '/chuni/music',
		name: 'Music List'
	}, {
		url: '/chuni/playlog',
		name: 'Playlog',
		userOnly: 'chuni'
	}, {
		url: '/chuni/userbox',
		name: 'Userbox',
		userOnly: 'chuni'
	}]
}, MAIN_ROUTES];
