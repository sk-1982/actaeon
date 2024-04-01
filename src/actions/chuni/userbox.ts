'use server';

import { UserPayload } from '@/types/user';
import { db, GeneratedDB } from '@/db';
import { ExpressionBuilder, SelectQueryBuilder } from 'kysely';
import { ItemKind } from '@/helpers/chuni/items';
import { jsonObjectArray } from '@/types/json-object-array';
import { AvatarCategory } from '@/helpers/chuni/avatar';
import { DB } from '@/types/db';
import { ChuniUserData } from '@/actions/chuni/profile';
import { parseJsonResult } from '@/helpers/parse-json-result';
import { getGlobalConfig } from '@/config';

const joinItem = <DB extends GeneratedDB, TB extends keyof DB, O>(builder: SelectQueryBuilder<DB, TB, O>, joinKey: any, user: UserPayload, itemKind: ItemKind, ...equipped: (number | null | undefined)[]) => {
	const canEquipUnearned = (getGlobalConfig('chuni_allow_equip_unearned') & user.permissions!);
	
	return (builder.leftJoin('chuni_item_item', join =>
		join.onRef('chuni_item_item.itemId' as any, '=', joinKey)
			.on('chuni_item_item.user' as any, '=', user.id)
			.on('chuni_item_item.itemKind' as any, '=', itemKind)
	) as any)
		.where((eb: ExpressionBuilder<any, any>) => eb.or(canEquipUnearned ? [eb.lit(true)] : [
			eb('chuni_item_item.itemId', 'is not', null), // owned item
			...equipped.map(id => eb(joinKey, '=', id ?? -1)) // equipped but not owned
		])) as SelectQueryBuilder<DB, TB, O>;
};

type ImageKeys = 'id' | 'name' | 'sortName' | 'imagePath';

export type UserboxItems = {
	mapIcon: Pick<DB['actaeon_chuni_static_map_icon'], ImageKeys>[],
	namePlate: Pick<DB['actaeon_chuni_static_name_plate'], ImageKeys>[],
	systemVoice: Pick<DB['actaeon_chuni_static_system_voice'], ImageKeys | 'cuePath'>[],
	trophy: Pick<DB['actaeon_chuni_static_trophies'], 'id' | 'name' | 'rareType' | 'explainText'>[]
} & {
	[K in `avatar${'Wear' | 'Head' | 'Face' | 'Skin' | 'Item' | 'Front' | 'Back'}`]:
		Pick<DB['chuni_static_avatar'], 'avatarAccessoryId' | 'name' | 'iconPath' | 'texturePath'>[]
};

export const getUserboxItems = async (user: UserPayload, profile: ChuniUserData): Promise<UserboxItems> => {
	const res = await db
		.with('map_icons', eb => joinItem(eb.selectFrom('actaeon_chuni_static_map_icon as map_icon'),
			'map_icon.id', user, ItemKind.MAP_ICON, profile?.mapIconId)
			.select(eb => jsonObjectArray(eb, [
				'map_icon.id',
				'map_icon.name',
				'map_icon.sortName',
				'map_icon.imagePath'
			]).as('mapIcon'))
		)
		.with('name_plates', eb => joinItem(eb.selectFrom('actaeon_chuni_static_name_plate as name_plate'),
			'name_plate.id', user, ItemKind.NAME_PLATE, profile?.nameplateId)
			.select(eb => jsonObjectArray(eb, [
				'name_plate.id',
				'name_plate.name',
				'name_plate.sortName',
				'name_plate.imagePath'
			]).as('namePlate')))
		.with('system_voices', eb => joinItem(eb.selectFrom('actaeon_chuni_static_system_voice as system_voice'),
			'system_voice.id', user, ItemKind.SYSTEM_VOICE, profile?.voiceId)
			.select(eb => jsonObjectArray(eb, [
				'system_voice.id',
				'system_voice.name',
				'system_voice.sortName',
				'system_voice.imagePath',
				'system_voice.cuePath',
			]).as('systemVoice')))
		.with('trophies', eb => joinItem(eb.selectFrom('actaeon_chuni_static_trophies as trophy'),
			'trophy.id', user, ItemKind.TROPHY, profile?.nameplateId)
			.select(eb => jsonObjectArray(eb, [
				'trophy.id',
				'trophy.name',
				'trophy.rareType',
				'trophy.explainText'
			]).as('trophy')))
		.with('avatars', eb => joinItem(eb.selectFrom('chuni_static_avatar as avatar'),
			'avatar.avatarAccessoryId', user, ItemKind.AVATAR_ACCESSORY, profile?.avatarBack, profile?.avatarFace, profile?.avatarItem,
			profile?.avatarWear, profile?.avatarFront, profile?.avatarSkin, profile?.avatarHead)
			.where(({ selectFrom, eb }) => eb('avatar.version', '=', selectFrom('chuni_static_avatar')
				.select(({ fn }) => fn.max('version').as('latest'))))
			.groupBy('avatar.category')
			.select(eb => ['avatar.category', jsonObjectArray(eb, [
				'avatar.avatarAccessoryId as id',
				'avatar.name',
				'avatar.iconPath',
				'avatar.texturePath'
			]).as('avatar')] as const))
		.selectFrom(['map_icons', 'name_plates', 'system_voices', 'trophies', 'avatars'])
		.select(eb => ['map_icons.mapIcon', 'name_plates.namePlate', 'system_voices.systemVoice', 'trophies.trophy',
			jsonObjectArray(eb, [
				'avatars.category', 'avatars.avatar'
			]).as('avatar')
		] as const)
		.executeTakeFirstOrThrow();

	const data = parseJsonResult(res, ['mapIcon', 'namePlate', 'systemVoice', 'trophy', 'avatar']);

	const { avatar, ...output } = data;

	const itemTypes: { [key: number]: any[] } = {};
	Object.entries(AvatarCategory).forEach(([category, number]) => {
		const key = `avatar${category[0]}${category.slice(1).toLowerCase()}`;
		output[key as keyof typeof output] = itemTypes[number] = [];
	});
	avatar
		?.forEach(({ category, avatar }) => itemTypes[category!].push(...avatar));

	output.mapIcon ??= [];
	output.namePlate ??= [];
	output.systemVoice ??= [];
	output.trophy ??= [];
	return output as any;
};
