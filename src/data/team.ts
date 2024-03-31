import { GeneratedDB, db } from '@/db';
import { JoinPrivacy, Visibility } from '@/types/privacy-visibility';
import crypto from 'crypto';
import { userIsVisible, withUsersVisibleTo } from './user';
import { Transaction } from 'kysely';
import { UserPayload } from '@/types/user';
import { hasPermission } from '@/helpers/permissions';
import { UserPermissions } from '@/types/permissions';

export const createActaeonTeamsFromExistingTeams = async () => {
	await db.transaction().execute(async trx => {
		const chuniTeams = (await trx.selectFrom('chuni_profile_team as chuni')
			.leftJoin('actaeon_teams as teams', 'teams.chuniTeam', 'chuni.id')
			.where('teams.chuniTeam', 'is', null)
			.select(({ selectFrom }) => [
				'chuni.id', 'chuni.teamName',
				selectFrom('chuni_profile_data as profile')
					.whereRef('profile.teamId', '=', 'chuni.id')
					.select('profile.user')
					.limit(1)
					.as('owner')
			] as const)
			.execute())
			.filter(x => x.owner !== null);
		
		if (!chuniTeams.length) return;

		const insertValues = chuniTeams.map(team => ({
			uuid: crypto.randomUUID(),
			visibility: Visibility.PRIVATE,
			joinPrivacy: JoinPrivacy.INVITE_ONLY,
			name: team.teamName,
			owner: team.owner!,
			chuniTeam: team.id!
		}));

		await trx.insertInto('actaeon_teams')
			.values(insertValues)
			.executeTakeFirst();
		
		for (const val of insertValues) {
			await trx.updateTable('actaeon_user_ext')
				.where('userId', '=', val.owner)
				.set({ team: val.uuid })
				.executeTakeFirst();
		}
	});
};

export const getTeams = async ({ showUnlisted, uuids, user }:
	{ showUnlisted?: boolean, uuids?: string[], user?: UserPayload | null; }) => {
	await createActaeonTeamsFromExistingTeams().catch(console.error);
	
	const res = await withUsersVisibleTo(user)
		.selectFrom('actaeon_teams as team')
		.leftJoin('chuni_profile_team as chuni', 'team.chuniTeam', 'chuni.id')
		.leftJoin('actaeon_user_ext as ext', 'ext.userId', 'team.owner')
		.leftJoin('aime_user as owner', 'owner.id', 'team.owner')
		.select(({ selectFrom, eb }) => [
			'team.uuid', 'team.visibility', 'team.joinPrivacy', 'team.name',
			'owner.username as ownerUsername', 'ext.uuid as ownerUuid',
			userIsVisible('owner.id').as('ownerVisible'),
			selectFrom('actaeon_user_ext as uext2')
				.whereRef('uext2.team', '=', 'team.uuid')
				.select(({ fn }) => fn.count('uext2.uuid').as('count'))
				.as('userCount'),
			eb('team.uuid', '=', user?.team!).as('isMember'),
			eb.or([
				eb('team.visibility', '=', Visibility.PUBLIC),
				eb('team.uuid', '=', user?.team!),
				...(showUnlisted ? [
					eb('team.visibility', '=', Visibility.UNLISTED)
				] : []),
			]).as('visible'),
			'chuni.teamPoint as chuniTeamPoint'
		] as const)
		.where(({ and, eb }) => and([
			...(uuids?.length ? [
				eb('team.uuid', 'in', uuids)
			] : [eb.lit(true)])
		]))
		.execute();
	
	const userTeam = res.findIndex(t => t.uuid === user?.team);
	if (userTeam !== -1)
		res.unshift(...res.splice(userTeam, 1));

	return res.map(({ ownerUsername, ownerUuid, ownerVisible, ...rest }) => ({
		...rest,
		ownerUsername: ownerVisible ? ownerUsername : null,
		ownerUuid: ownerVisible ? ownerUuid : null
	}));
};

export type Team = Awaited<ReturnType<typeof getTeams>>[number];

export const syncUserTeams = async (user: number, team?: { chuniTeam: number } | null, transaction?: Transaction<GeneratedDB>) => {
	const cb = async (trx: Transaction<GeneratedDB>) => {
		if (team === undefined)
			team = await db.selectFrom('actaeon_user_ext as ext')
				.where('ext.userId', '=', user)
				.innerJoin('actaeon_teams as teams', 'teams.uuid', 'ext.team')
				.select('teams.chuniTeam')
				.executeTakeFirst();

		await db.updateTable('chuni_profile_data')
			.where('user', '=', user)
			.set({ teamId: team?.chuniTeam ?? null })
			.executeTakeFirst();
	};
	
	if (transaction)
		await cb(transaction)
	else
		await db.transaction().execute(cb);
};

export const getTeamUsers = async ({ user, team }: { user?: UserPayload | null, team: Team }) => {
	const res = await withUsersVisibleTo(user, { allTeam: !!team.ownerUuid && team.ownerUuid === user?.uuid })
		.selectFrom('actaeon_user_ext as ext')
		.leftJoin('aime_user as u', 'u.id', 'ext.userId')
		.where('ext.team', '=', team.uuid)
		.select(['u.username', 'ext.uuid', userIsVisible('u.id').as('visible'), 'u.id'])
		.execute();
	
	const data = res.map(({ username, uuid, visible, id }) => ({
		uuid: visible ? uuid : null,
		username: visible ? username : null,
		visible,
		isOwner: uuid === team.ownerUuid,
		id: visible ? id : null
	}));

	data.unshift(...data.splice(data.findIndex(u => u.isOwner), 1));
	return data;
};

export type TeamUser = Awaited<ReturnType<typeof getTeamUsers>>[number];

export const getTeamInviteLinks = async ({ user, team }: { user?: UserPayload | null, team: Team }) => {
	if (!hasPermission(user?.permissions, UserPermissions.OWNER) && user?.uuid !== team.ownerUuid)
		return [];

	return db.selectFrom('actaeon_team_join_keys')
		.where('teamId', '=', team.uuid)
		.selectAll()
		.execute();
};
