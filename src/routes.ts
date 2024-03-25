import { UserPayload } from '@/types/user';

export type UserOnly = boolean | keyof UserPayload;

type Subroute = {
	url: string,
	name: string,
	userOnly?: UserOnly
};

type Route = {
	url: string,
	name: string,
	title: string,
	userOnly?: UserOnly,
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
