import { UserPayload } from '@/types/user';
import { UserPermissions } from '@/types/permissions';
import { hasPermission } from './helpers/permissions';

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
		url: '/team',
		name: 'Teams'
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

export const filterRoute = (user: UserPayload | null | undefined, { userOnly, permissions }: { userOnly?: UserOnly, permissions?: (UserPermissions | UserPermissions[])[]; }) => {
	if (typeof userOnly === 'string' && !user?.[userOnly])
		return false;
	if (typeof userOnly === 'boolean' && !user)
		return false;
	if (permissions?.length && !hasPermission(user?.permissions, ...permissions))
		return false;
	return true;
};

export const getValidHomepageRoutes = (user: UserPayload) => {
	const filter = filterRoute.bind(null, user);
	return [MAIN_ROUTES, ...ROUTES.slice(0, -1)].filter(filter)
		.map(({ name, routes }) => ({
			name,
			routes: routes.filter(filter)
				.flatMap(r => [r, ...(r.routes?.filter(filter)
					?.map(d => ({ ...d, name: `${r.name}┃${d.name}` })) ?? [])])
				.filter(r => !r.url.startsWith('/admin'))
				.map(({ name, url }) => ({ name, url }))
		}));
};
