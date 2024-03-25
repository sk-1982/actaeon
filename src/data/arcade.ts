import { sql } from 'kysely';
import { db } from '@/db';
import { JoinPrivacy, Visibility } from '@/types/privacy-visibility';
import { hasArcadePermission, hasPermission } from '@/helpers/permissions';
import { ArcadePermissions, UserPermissions } from '@/types/permissions';
import { UserPayload } from '@/types/user';
import { userIsVisible, withUsersVisibleTo } from '@/data/user';
import { COUNTRY_CODES } from '@/types/country';

const createArcadeExtIfNecessary = async () => {
	await db.transaction().execute(async trx => {
		const updateExtArcades = await trx.selectFrom('arcade')
			.leftJoin('actaeon_arcade_ext as ext', 'arcade.id', 'ext.arcadeId')
			.where('ext.arcadeId', 'is', null)
			.select('arcade.id')
			.execute();

		if (!updateExtArcades.length) return;

		await trx.insertInto('actaeon_arcade_ext')
			.values(updateExtArcades.map(({ id }) => ({
				arcadeId: id,
				uuid: sql`uuid_v4()`,
				visibility: Visibility.PRIVATE,
				joinPrivacy: JoinPrivacy.INVITE_ONLY
			})))
			.executeTakeFirst();
	});
}

export const getArcades = async ({ user, uuids, includeUnlisted }: { user?: UserPayload | null, uuids?: string[], includeUnlisted?: boolean }) => {
	await createArcadeExtIfNecessary().catch(console.error);

	const result = await withUsersVisibleTo(user)
		.selectFrom('arcade')
		.innerJoin('actaeon_arcade_ext as ext', 'arcade.id', 'ext.arcadeId')
		.leftJoin('arcade_owner', join => join.onRef('arcade_owner.arcade', '=', 'arcade.id')
			.on('arcade_owner.user', '=', user?.id!))
		.leftJoin(eb => eb.selectFrom('arcade_owner as o')
			.innerJoin('aime_user as u', 'u.id', 'o.user')
			.innerJoin('actaeon_user_ext as owner_ext', 'u.id', 'owner_ext.userId')
			.where('o.permissions', '>=', 1 << ArcadePermissions.OWNER)
			.where(userIsVisible('o.user'))
			.select(({ fn }) => ['u.username', fn.min('u.id').as('id'), 'owner_ext.uuid', 'o.arcade'])
			.groupBy('o.arcade')
			.as('owner'), join => join.onRef('owner.arcade', '=', 'arcade.id'))
		.where(({ eb, and }) => and([
			...(uuids?.length ? [eb('ext.uuid', 'in', uuids)] : [eb.lit(true)])
		]))
		.select(({ selectFrom, or, eb }) => [
			or([
				// acmod can view all
				...(hasPermission(user?.permissions, UserPermissions.ACMOD) ? [eb.lit(true)] : []),
				// public arcades are visible by default
				eb('ext.visibility', '=', Visibility.PUBLIC),
				...(includeUnlisted ? [eb('ext.visibility', '=', Visibility.UNLISTED)] : []),
				// show arcades this user is a member of
				eb('arcade_owner.user', 'is not', null),
			]).as('visible'),

			'ext.uuid', 'ext.visibility', 'ext.joinPrivacy',
			'arcade_owner.permissions',
			'arcade.id', 'arcade.name', 'arcade.nickname', 'arcade.country', 'arcade.country_id', 'arcade.state',
			'arcade.city', 'arcade.region_id', 'arcade.timezone', 'arcade.ip',
			'owner.id as ownerId', 'owner.username as ownerUsername', 'owner.uuid as ownerUuid',

			selectFrom('arcade_owner as o2')
				.whereRef('o2.arcade', '=', 'arcade.id')
				.select(({ fn }) => fn.count('o2.arcade').as('arcade'))
				.as('userCount'),

			selectFrom('machine')
				.whereRef('machine.arcade', '=', 'arcade.id')
				.select(({ fn }) => fn.count('machine.id').as('id'))
				.as('machineCount')
		])
		.execute();

	return result.map(({ ownerId, ip, ...rest }) => ({
		...rest,
		// hide arcade ip if plain viewer
		ip: hasArcadePermission(rest.permissions, user?.permissions,
			[ArcadePermissions.BOOKKEEP, ArcadePermissions.EDITOR, ArcadePermissions.REGISTRAR]) ? ip : null
	}));
}

type ArcadeUserOpts = { arcade: number, user?: UserPayload | null, permissions?: number | null };

export const getArcadeUsers = async ({ arcade, user, permissions }: ArcadeUserOpts) => {
	const res = await withUsersVisibleTo(user, { allArcade: hasArcadePermission(permissions, user?.permissions, ArcadePermissions.BOOKKEEP) })
		.selectFrom('arcade_owner as o')
		.innerJoin('aime_user as u', 'u.id', 'o.user')
		.innerJoin('actaeon_user_ext as uext', 'u.id', 'uext.userId')
		.where('o.arcade', '=', arcade)
		.select([
			userIsVisible('o.user').as('visible'),
			'u.username', 'o.permissions', 'u.id',
			'uext.uuid'
		])
		.orderBy('o.permissions desc')
		.execute();

	return res.map(({ username, visible, uuid, ...rest }) => visible ? ({ ...rest, username, uuid }) : ({ ...rest }));
};

export const getArcadeCabs = async ({ arcade, user, permissions }: ArcadeUserOpts) => {
	return db.selectFrom('machine')
		.where('arcade', '=', arcade)
		.select([
			'id', 'game', 'country', 'timezone', 'ota_enable', 'is_cab',  'memo', 'arcade',
			...(hasArcadePermission(permissions, user?.permissions, ArcadePermissions.BOOKKEEP) ? [
				'board', 'serial'
			] as const : [])
		])
		.execute();
}

export const getArcadeInviteLinks = async ({ arcade, user, permissions }: ArcadeUserOpts) => {
	if (!hasPermission(permissions, ArcadePermissions.OWNER) &&
		!hasPermission(user?.permissions, UserPermissions.OWNER)) return [];

	return db.selectFrom('actaeon_arcade_join_keys')
		.where('arcadeId', '=', arcade)
		.selectAll()
		.execute();
}


export const getArcadePermissions = async (user: UserPayload, arcade: number) => (await db.selectFrom('arcade_owner as o')
	.where('o.arcade', '=', arcade)
	.where('o.user', '=', user.id!)
	.select('o.permissions')
	.executeTakeFirst())?.permissions;

export const countryValidator = (val: string | null | undefined) => {
	if (!COUNTRY_CODES.has(val!))
		throw new Error('Invalid country');
};

export type ArcadeCab = Awaited<ReturnType<typeof getArcadeCabs>>[number];

export type ArcadeUser = Awaited<ReturnType<typeof getArcadeUsers>>[number];

export type Arcade = Awaited<ReturnType<typeof getArcades>>[number];

export type ArcadeLink = Awaited<ReturnType<typeof getArcadeInviteLinks>>[number];
