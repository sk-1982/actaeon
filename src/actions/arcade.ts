'use server';

import { ActaeonArcadeExt as DBArcadeExt, Arcade as DBArcade } from '@/types/db';
import { Arcade, countryValidator, getArcadePermissions } from '@/data/arcade';
import { db } from '@/db';
import { requireUser } from '@/actions/auth';
import { hasPermission, requireArcadePermission, requirePermission } from '@/helpers/permissions';
import { ArcadePermissions, UserPermissions } from '@/types/permissions';
import { ValidatorMap } from '@/types/validator-map';
import { JoinPrivacy, PRIVACY_VALUES, Visibility, VISIBILITY_VALUES } from '@/types/privacy-visibility';
import { IP_REGEX, TIMEZONE_REGEX } from '@/helpers/validators';
import { notFound, redirect } from 'next/navigation';
import { randomString } from '@/helpers/random';
import crypto from 'crypto';

import type { Entries } from 'type-fest';
import { revalidatePath } from 'next/cache';

export type ArcadeUpdate = Partial<Pick<Arcade, 'visibility' | 'joinPrivacy' | 'name' | 'nickname' | 'country' | 'country_id' |
	'state' | 'city' | 'region_id' | 'timezone' | 'ip'>>;

const ARCADE_VALIDATORS: ValidatorMap<ArcadeUpdate> = new Map();

ARCADE_VALIDATORS.set('visibility', val => {
	if (!VISIBILITY_VALUES.has(val!))
		throw new Error('Invalid visibility value');
});
ARCADE_VALIDATORS.set('joinPrivacy', val => {
	if (!PRIVACY_VALUES.has(val!))
		throw new Error('Invalid join privacy value');
});
(['name', 'nickname', 'state', 'city'] as const).forEach(v => ARCADE_VALIDATORS.set(v, () => {}));
(['country_id', 'region_id'] as const).forEach(v => ARCADE_VALIDATORS.set(v, val => {
	const name = v.split('_')[0];
	if (typeof val !== 'number' || !Number.isInteger(val))
		throw new Error(`${name[0].toUpperCase()}${name.slice(1)} ID must be a number`);
}));
ARCADE_VALIDATORS.set('timezone', val => {
	if (!TIMEZONE_REGEX.test(val ?? ''))
		throw new Error('Timezone must be in the format ±##:## or ±####');
});
ARCADE_VALIDATORS.set('ip', val => {
	if (!IP_REGEX.test(val ?? ''))
		throw new Error('Invalid IP format');
});

ARCADE_VALIDATORS.set('country', countryValidator);


export const updateArcade = async (id: number, update: ArcadeUpdate) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, id);

	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.EDITOR);

	const arcadeUpdate: Partial<DBArcade> = {};
	const arcadeExtUpdate: Partial<DBArcadeExt> = {};

	for (let [key, val] of (Object.entries(update) as Entries<ArcadeUpdate>)) {
		if (!ARCADE_VALIDATORS.has(key))
			return { error: true, message: `Unknown key ${key}` };

		if (key === 'name' && !val?.toString()?.trim())
			return { error: true, message: `Name is required` };

		try {
			if (val === undefined) val = null;
			if (val !== null)
				val = (await ARCADE_VALIDATORS.get(key as keyof ArcadeUpdate)!(val)) ?? val;
		} catch (e: any) {
			return { error: true, message: e?.message ?? 'Unknown error' };
		}

		if (key === 'joinPrivacy' || key === 'visibility')
			arcadeExtUpdate[key] = val as any;
		else
			arcadeUpdate[key] = val as any;
	}

	await db.transaction().execute(async trx => {
		if (Object.keys(arcadeUpdate).length)
			await trx.updateTable('arcade')
				.set(arcadeUpdate)
				.where('id', '=', id)
				.executeTakeFirst();

		if (Object.keys(arcadeExtUpdate).length)
			await trx.updateTable('actaeon_arcade_ext')
				.set(arcadeExtUpdate)
				.where('arcadeId', '=', id)
				.executeTakeFirst();
	});

	revalidatePath('/arcade', 'page');
	revalidatePath('/arcade/[arcadeId]', 'page');
};

export const joinPublicArcade = async (arcade: number) => {
	const user = await requireUser();
	const arcadeData = await db.selectFrom('arcade')
		.innerJoin('actaeon_arcade_ext as ext', 'ext.arcadeId', 'arcade.id')
		.where('arcade.id', '=', arcade)
		.select(['ext.joinPrivacy', 'ext.uuid'])
		.executeTakeFirst();

	if (!arcadeData)
		return notFound();

	if (arcadeData.joinPrivacy !== JoinPrivacy.PUBLIC)
		requirePermission(user.permissions, UserPermissions.ACMOD);

	await db.insertInto('arcade_owner')
		.values({
			arcade,
			user: user.id,
			permissions: 1
		})
		.executeTakeFirst();
	
	revalidatePath('/arcade', 'page');
	revalidatePath(`/arcade/${arcadeData.uuid}`, 'page');
}

export const removeUserFromArcade = async (arcade: number, userId?: number) => {
	const user = await requireUser();
	userId ??= user.id;
	if (user.id !== userId) {
		const arcadePermissions = await getArcadePermissions(user, arcade);
		if (!hasPermission(arcadePermissions, ArcadePermissions.OWNER))
			requirePermission(user.permissions, UserPermissions.USERMOD);
	}

	await db.deleteFrom('arcade_owner')
		.where('arcade', '=', arcade)
		.where('user', '=', userId)
		.executeTakeFirst();
	
	revalidatePath('/arcade', 'page');
	revalidatePath('/arcade/[arcadeId]', 'page');
}

export const createArcadeLink = async (arcade: number, remainingUses: number | null) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);
	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.OWNER);
	const id = randomString(10);
	await db.insertInto('actaeon_arcade_join_keys')
		.values({
			id,
			arcadeId: arcade,
			remainingUses,
			totalUses: 0
		})
		.executeTakeFirst();
	revalidatePath('/arcade/[arcadeId]', 'page');
	return id;
};

export const deleteArcadeLink = async (arcade: number, link: string) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);
	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.OWNER);
	await db.deleteFrom('actaeon_arcade_join_keys')
		.where('arcadeId', '=', arcade)
		.where('id', '=', link)
		.executeTakeFirst();
	revalidatePath('/arcade/[arcadeId]', 'page');
};

export const createArcade = async (name: string) => {
	const user = await requireUser({ permission: UserPermissions.ACMOD });
	const uuid = crypto.randomUUID();

	await db.transaction().execute(async trx => {
		const arcade = await trx.insertInto('arcade')
			.values({ name })
			.executeTakeFirstOrThrow();

		await trx.insertInto('actaeon_arcade_ext')
			.values({
				arcadeId: Number(arcade.insertId!),
				uuid,
				visibility: Visibility.PRIVATE,
				joinPrivacy: JoinPrivacy.INVITE_ONLY
			})
			.executeTakeFirst();

		await trx.insertInto('arcade_owner')
			.values({
				user: user.id,
				arcade: Number(arcade.insertId!),
				permissions: (1 << ArcadePermissions.OWNER) | (1 << ArcadePermissions.VIEW)
			})
			.executeTakeFirst();
	});

	revalidatePath('/arcade', 'page');
	redirect('/arcade/' + uuid);
};

export const deleteArcade = async (id: number) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, id);
	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.OWNER);

	await db.deleteFrom('arcade')
		.where('id', '=', id)
		.executeTakeFirst();

	revalidatePath('/arcade', 'page');
	redirect('/arcade');
}

export const setUserArcadePermissions = async ({ arcadeUser, arcade, permissions }: { arcadeUser: number, arcade: number, permissions: number }) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);
	if (!hasPermission(user.permissions, UserPermissions.USERMOD))
		requirePermission(arcadePermissions, ArcadePermissions.OWNER);

	await db.updateTable('arcade_owner')
		.set({ permissions })
		.where('user', '=', arcadeUser)
		.where('arcade', '=', arcade)
		.executeTakeFirst();
	revalidatePath('/arcade', 'page');
	revalidatePath('/arcade/[arcadeId]', 'page');
};
