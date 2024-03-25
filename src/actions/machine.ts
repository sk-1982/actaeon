'use server';

import { ValidatorMap } from '@/types/validator-map';
import { db } from '@/db';
import { ArcadeCab, countryValidator, getArcadeCabs, getArcadePermissions } from '@/data/arcade';
import { requireUser } from '@/actions/auth';
import { requireArcadePermission } from '@/helpers/permissions';
import { ArcadePermissions } from '@/types/permissions';
import type { Entries } from 'type-fest';

export type CabUpdate = Omit<ArcadeCab, 'id' | 'arcade'>;

const CAB_VALIDATORS: ValidatorMap<CabUpdate, number | null> = new Map();
CAB_VALIDATORS.set('country', countryValidator);


const booleanValidator = (val: number | null | undefined) => {
	val = +(val as any);
	if (val !== 0 && val !== 1)
		throw new Error('Invalid boolean value');
	return val;
}

CAB_VALIDATORS.set('board', async (val, cab) => {
	val = val!.toUpperCase().replace(/-/g, '').trim();

	if (!/^[A-Z\d]{15}$/.test(val!))
		throw new Error('Invalid board number, must be 15 alphanumeric characters');

	const existing = await db.selectFrom('machine')
		.where(({ eb, and }) => and([
			eb('board', '=', val!),
			...(cab === null ? [] : [
				eb('id', '!=', cab)
			])
		]))
		.select('board')
		.executeTakeFirst();

	if (existing)
		throw new Error('That board is already in use');

	return val;
});

const getMachineBySerial = async (serial: string, excludeCab: number | null = null) => {
	return db.selectFrom('machine')
		.where(({ eb, and }) => and([
			eb('serial', 'like', `${serial.slice(0, 11)}%`),
			...(excludeCab === null ? [] : [
				eb('id', '!=', excludeCab)
			])
		]))
		.select('serial')
		.executeTakeFirst();
}

CAB_VALIDATORS.set('serial', async (val, cab) => {
	val = val!.toUpperCase().replace(/-/g, '').trim();

	// https://gitea.tendokyu.moe/Hay1tsme/artemis/src/commit/87c7c91e3a7158aabfd2b8dbf69d6a5ca0249da1/core/adb_handlers/base.py#L123
	if (!/^A\d{2}[EX]\d{2}[A-HJ-NP-Z]\d{8}$/.test(val))
		throw new Error('Invalid keychip format');

	if (await getMachineBySerial(val, cab))
		throw new Error('That serial is already in use');

	return val;
});

CAB_VALIDATORS.set('is_cab', booleanValidator);
CAB_VALIDATORS.set('ota_enable', booleanValidator);
CAB_VALIDATORS.set('game', val => {
	val = val!.trim().toUpperCase();
	// https://gitea.tendokyu.moe/Hay1tsme/artemis/src/commit/87c7c91e3a7158aabfd2b8dbf69d6a5ca0249da1/core/adb_handlers/base.py#L117
	if (!/^S[A-Z\d]{3}P?$/.test(val))
		throw new Error('Game must be in the format Sxxx or SxxxP');
});
CAB_VALIDATORS.set('timezone', () => {});
CAB_VALIDATORS.set('memo', () => {});



export const deleteMachine = async (arcade: number, machine: number) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);

	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.REGISTRAR);

	await db.deleteFrom('machine')
		.where('arcade', '=', arcade)
		.where('id', '=', machine)
		.executeTakeFirst();
};

const validateUpdate = async (update: CabUpdate, cab: number | null) => {
	if (!('serial' in update))
		return { error: true, message: 'Keychip is required' };

	for (let [key, val] of (Object.entries(update) as Entries<CabUpdate>)) {
		if (!CAB_VALIDATORS.has(key))
			return { error: true, message: `Unknown key ${key}` };
		if (key === 'serial' && !val)
			return { error: true, message: 'Keychip is required' };

		try {
			if (val === undefined) val = null;
			if (val !== null)
				(update as any)[key] = ((await CAB_VALIDATORS.get(key)!(val, cab)) ?? val) as any;
			else
				(update as any)[key] = null;
		} catch (e: any) {
			return { error: true, message: e?.message ?? 'Unknown error' };
		}
	}
}

export const updateMachine = async ({ arcade, machine, update }: { arcade: number, machine: number, update: CabUpdate }) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);

	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.REGISTRAR);

	const res = await validateUpdate(update, machine);
	if (res?.error) return res;

	await db.updateTable('machine')
		.where('machine.id', '=', machine)
		.where('machine.arcade', '=', arcade)
		.set(update)
		.executeTakeFirst();
};

export const createMachine = async ({ arcade, update }: { arcade: number, update: CabUpdate }) => {
	const user = await requireUser();
	const arcadePermissions = await getArcadePermissions(user, arcade);

	requireArcadePermission(arcadePermissions, user.permissions, ArcadePermissions.REGISTRAR);

	const res = await validateUpdate(update, null);
	if (res?.error) return { ...res, data: [] };

	await db.insertInto('machine')
		.values({
			...update,
			arcade
		})
		.executeTakeFirst();

	return { error: false, message: '', data: await getArcadeCabs({ arcade, user, permissions: arcadePermissions }) };
}
