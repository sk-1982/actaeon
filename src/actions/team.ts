'use server';

import { ActionResult } from '@/types/action-result';
import { requireUser } from './auth';
import { db } from '@/db';
import crypto from 'crypto';
import { JoinPrivacy, PRIVACY_VALUES, VISIBILITY_VALUES, Visibility } from '@/types/privacy-visibility';
import { syncUserTeams } from '@/data/team';
import { notFound, redirect } from 'next/navigation';
import { UserPermissions } from '@/types/permissions';
import { hasPermission, requirePermission } from '@/helpers/permissions';
import { makeValidator } from '@/types/validator-map';
import { DB } from '@/types/db';
import { randomString } from '@/helpers/random';

const validator = makeValidator<TeamUpdate, DB['actaeon_teams'] | null>()
	.nonNullableKeys('name', 'joinPrivacy', 'visibility')
	.withValidator('name', async (val, team) => {
		val = val.trim();

		if (!val)
			throw new Error('Team name cannot be empty');

		const existingTeam = await db.selectFrom('actaeon_teams')
			.where(({ fn, eb, and }) => and([
				eb(fn('lower', ['name']), '=', val.toLowerCase()),
				...(team ? [eb('uuid', '!=', team.uuid)] : [])
			]))
			.select('uuid')
			.executeTakeFirst();

		if (existingTeam)
			throw new Error('A team with that name already exists');

		return val;
	})
	.withValidator('joinPrivacy', val => {
		if (!PRIVACY_VALUES.has(val))
			throw new Error('Invalid privacy value');
	})
	.withValidator('visibility', val => {
		if (!VISIBILITY_VALUES.has(val))
			throw new Error('Invalid visibility value');
	});


export const createTeam = async (name: string): Promise<ActionResult> => {
	const user = await requireUser();

	if (user.team)
		return { error: true, message: 'You are already part of a team' };

	const data = await validator.validate({ name }, null);

	if (data.error)
		return data;

	const uuid = crypto.randomUUID();
	
	await db.transaction().execute(async trx => {
		const chuniTeam = Number((await db.insertInto('chuni_profile_team')
			.values({
				teamName: data.value.name,
				teamPoint: 0
			})
			.executeTakeFirst()).insertId);

		await db.insertInto('actaeon_teams')
			.values({
				uuid,
				name: data.value.name,
				visibility: Visibility.PRIVATE,
				joinPrivacy: JoinPrivacy.INVITE_ONLY,
				owner: user.id!,
				chuniTeam
			})
			.executeTakeFirst();
		
		await db.updateTable('actaeon_user_ext')
			.where('userId', '=', user.id)
			.set({ team: uuid } )
			.executeTakeFirst();
		
		await syncUserTeams(user.id, { chuniTeam }, trx);
	});

	redirect(`/team/${uuid}`);
};

const requireOwner = async ({ team, orPermission, teamData }: {
	team: string,
	orPermission?: UserPermissions,
	teamData?: DB['actaeon_teams']
}) => {
	const user = await requireUser();

	if (!teamData)
		teamData = await db.selectFrom('actaeon_teams')
			.where('uuid', '=', team)
			.selectAll()
			.executeTakeFirst();
	
	if (!teamData)
		notFound();
	
	if (hasPermission(user.permissions, orPermission ?? UserPermissions.OWNER))
		return teamData;

	if (teamData.owner !== user.id)
		redirect('/forbidden');

	return teamData;
}

export type TeamUpdate = Partial<{
	name: string,
	joinPrivacy: JoinPrivacy,
	visibility: Visibility
}>;

export const modifyTeam = async (team: string, update: TeamUpdate): Promise<ActionResult<{}>> => {
	const teamData = await requireOwner({ team });
	const res = await validator.validate(update, teamData);
	if (res.error) return res;

	await db.updateTable('actaeon_teams')
		.where('uuid', '=', team)
		.set(res.value)
		.executeTakeFirst();
	
	if (res.value.name)
		await db.updateTable('chuni_profile_team')
			.where('id', '=', teamData.chuniTeam)
			.set({ teamName: res.value.name })
			.executeTakeFirst()

	return {};
};

export const joinPublicTeam = async (team: string) => {
	const user = await requireUser();
	const teamData = await db.selectFrom('actaeon_teams')
		.where('uuid', '=', team)
		.selectAll()
		.executeTakeFirst();
	
	if (!teamData)
		return notFound();

	if (teamData.joinPrivacy !== JoinPrivacy.PUBLIC)
		return requirePermission(user.permissions, UserPermissions.OWNER);

	if (user.team)
		return { error: true, message: 'You are already part of a team' };
	
	await db.transaction().execute(async trx => {
		await trx.updateTable('actaeon_user_ext')
			.where('userId', '=', user.id)
			.set({ team })
			.executeTakeFirst();
		
		await syncUserTeams(user.id, teamData, trx);
	});
};

export const removeUserFromTeam = async (team: string, userId?: number) => {
	const user = await requireUser();
	userId ??= user.id;

	const teamData = await db.selectFrom('actaeon_teams')
		.where('uuid', '=', team)
		.selectAll()
		.executeTakeFirst();
	
	if (!teamData) return notFound()
	
	if (userId === teamData.owner)
		return { error: true, message: 'The owner of this team cannot be removed' };

	if (user.id !== userId)
		await requireOwner({ team, teamData, orPermission: UserPermissions.USERMOD });

	await db.transaction().execute(async trx => { 
		await trx.updateTable('actaeon_user_ext')
			.where('userId', '=', userId)
			.where('team', '=', team)
			.set({ team: null })
			.executeTakeFirst();
		
		await syncUserTeams(userId, null, trx);
	});
};

export const deleteTeam = async (team: string) => {
	const teamData = await requireOwner({ team });
	
	await db.transaction().execute(async trx => {
		await trx.deleteFrom('chuni_profile_team')
			.where('id', '=', teamData.chuniTeam)
			.executeTakeFirst();
		
		await trx.deleteFrom('actaeon_teams')
			.where('uuid', '=', teamData.uuid)
			.executeTakeFirst();
	});
};

export const deleteTeamLink = async (team: string, link: string) => {
	const teamData = await requireOwner({ team });
	await db.deleteFrom('actaeon_team_join_keys')
		.where('teamId', '=', teamData.uuid)
		.where('id', '=', link)
		.executeTakeFirst();
};

export const createTeamLink = async (team: string, remainingUses: number | null) => {
	const teamData = await requireOwner({ team });
	const id = randomString(10);

	await db.insertInto('actaeon_team_join_keys')
		.values({
			id,
			teamId: team,
			remainingUses,
			totalUses: 0
		})
		.executeTakeFirst();
	
	return id;
};
