import { db } from './db';

export type GlobalConfig = {
	chuni_allow_equip_unearned: number,
	allow_user_add_card: boolean,
	user_max_card: number | null
};

type ConfigEntry<T extends keyof GlobalConfig> = {
	defaultValue: GlobalConfig[T],
	validate: (val: any) => ({ error: true, message: string; } | { error?: false, value?: GlobalConfig[T] } | undefined | void)
};

const CONFIG_ENTRIES: { [K in keyof GlobalConfig]: ConfigEntry<K> } = {
	chuni_allow_equip_unearned: {
		validate: val => {
			if (!Number.isInteger(val))
				return { error: true, message: 'Invalid permission mask' };
		},
		defaultValue: 0
	},
	allow_user_add_card: {
		validate: val => {
			if (![0, 1, true, false].includes(val))
				return { error: true, message: 'Invalid boolean value' };
			return { value: !!val };
		},
		defaultValue: false
	},
	user_max_card: {
		validate: val => {
			if (val === null)
				return;

			if (!Number.isInteger(val) || val < 1)
				return { error: true, message: 'Invalid max card count' };
		},
		defaultValue: 4
	}
} as const;

let CONFIG = {} as GlobalConfig;

if ((globalThis as any).CONFIG) CONFIG = (globalThis as any).CONFIG;

type GetConfig = {
	<T extends keyof GlobalConfig>(key: T): GlobalConfig[T],
	(): GlobalConfig
};

export const getGlobalConfig: GetConfig = <T extends keyof GlobalConfig>(key?: T) => key ? CONFIG[key] : CONFIG;

export const setGlobalConfig = async (update: Partial<GlobalConfig>) => {
	for (const [key, value] of Object.entries(update)) {
		if (!Object.hasOwn(CONFIG, key))
			return { error: true, message: `Unknown key ${key}` };

		const res = CONFIG_ENTRIES[key as keyof typeof CONFIG].validate(value);
		if (res?.error)
			return res;

		const val = res?.value ?? value;
		if (val === (CONFIG as any)[key])
			delete update[key as keyof typeof update];
		else
			(CONFIG as any)[key] = res?.value ?? value;		
	}

	await db.transaction().execute(async trx => { 
		for (const [key, value] of Object.entries(update)) {
			await trx.updateTable('actaeon_global_config')
				.where('key', '=', key)
				.set({ value: JSON.stringify((CONFIG as any)[key]) })
				.executeTakeFirst();
		}
	});
};

export const loadConfig = async () => {
	const entries = await db.selectFrom('actaeon_global_config')
		.selectAll()
		.execute();
	
	const updates: { key: string, value: string }[] = [];
	const inserts: { key: string, value: string; }[] = [];

	if (!entries.length) {
		console.log('[INFO] first startup detected, loading global config default values');
		CONFIG = Object.fromEntries(Object.entries(CONFIG_ENTRIES).map(([k, { defaultValue }]) => {
			inserts.push({ key: k, value: JSON.stringify(defaultValue) });

			return [k, defaultValue];
		})) as GlobalConfig;
	} else {
		CONFIG = Object.fromEntries(Object.entries(CONFIG_ENTRIES).map(([k, { defaultValue, validate }]) => {
			const index = entries.findIndex(({ key }) => key === k);
			if (index === -1) {
				console.log(`[INFO] config key ${k} not found, loading default`);
				inserts.push({ key: k, value: JSON.stringify(defaultValue) });
				return [k, defaultValue];
			}

			const { value } = entries.splice(index, 1)[0];
			let parsed: any;

			try {
				parsed = JSON.parse(value);
			} catch {
				console.warn(`[WARN] failed to parse config value for ${k}, falling back to default`);
				updates.push({ key: k, value: JSON.stringify(defaultValue) });
				return [k, defaultValue];
			}

			const res = validate(parsed);
			if (res?.error) {
				console.warn(`[WARN] failed to parse config value for ${k}: ${res.message ?? 'unknown error'}; falling back to default`);
				updates.push({ key: k, value: JSON.stringify(defaultValue) });
				return [k, defaultValue];
			}

			return [k, res?.value ?? parsed];
		})) as GlobalConfig;
	}

	await db.transaction().execute(async trx => {
		if (inserts.length)
			await trx.insertInto('actaeon_global_config')
				.values(inserts)
				.execute();
		
		for (const update of updates) {
			await trx.updateTable('actaeon_global_config')
				.where('key', '=', update.key)
				.set({ value: update.value })
				.executeTakeFirst();
		}
	});

	(globalThis as any).CONFIG = CONFIG;
};
