'use client';

import { setGlobalConfig } from '@/actions/config';
import { useErrorModal } from '@/components/error-modal';
import { GlobalConfig } from '@/config';
import { USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import { Button, Checkbox, Divider, Input, Select, SelectItem } from '@nextui-org/react';
import { useState } from 'react';

type SystemConfigProps = {
	config: GlobalConfig
};

export const SystemConfig = ({ config: initialConfig }: SystemConfigProps) => {
	const [config, setConfig] = useState(initialConfig);
	const [loading, setLoading] = useState(false);
	const [saved, setSaved] = useState(true);
	const setError = useErrorModal();

	const setConfigKey = <T extends keyof GlobalConfig>(key: T, val: GlobalConfig[T]) => {
		setSaved(false);
		setConfig(c => ({ ...c, [key]: val }));
	};

	const save = () => {
		setLoading(true);
		setGlobalConfig(config)
			.then(res => {
				if (res?.error)
					return setError(res.message);
				setSaved(true);
			})
			.finally(() => setLoading(false));
	};

	return (<main className="flex flex-col max-w-3xl w-full mx-auto">
		<header className="px-4 font-semibold text-2xl flex items-center h-16">
			System Config

			{!saved && <Button className="ml-auto" color="primary" isDisabled={loading} onPress={save}>Save</Button>}
		</header>
		<Divider />
		<label className="p-3 w-full flex flex-wrap items-center text-sm md:text-base">
			Allow users to add cards

			<Checkbox size="lg" className="ml-auto" isDisabled={loading}
				checked={config.allow_user_add_card}
				onValueChange={v => setConfigKey('allow_user_add_card', v)} />

			<span className="w-full mt-2 text-xs sm:text-sm text-gray-500">
				Normally, only user moderators can add cards to users. By enabling this, normal users can add cards.
			</span>
		</label>
		<Divider className="bg-divider/5" />
		<label className={`p-3 w-full flex flex-wrap items-center text-sm md:text-base ${config.allow_user_add_card ? '' : 'text-gray-500'}`}>
			Max card count per user

			<Input type="number" min={1} className="w-28 ml-auto" size="sm" placeholder="Unlimited"
				isDisabled={loading || !config.allow_user_add_card}
				value={config.user_max_card?.toString() ?? ''}
				onValueChange={v => setConfigKey('user_max_card', (!v || +v < 1) ? null : +v)} />

			<span className="w-full mt-2 text-xs sm:text-sm text-gray-500">
				If &ldquo;Allow users to add cards&rdquo; is enabled, this controls the max card count per user. Note that user moderators can exceed this count.
			</span>
		</label>
		<Divider className="bg-divider/5" />
		<header className="p-4 font-semibold text-xl">Chunithm Config</header>
		<Divider className="bg-divider/5" />
		<label className="p-3 w-full flex flex-wrap items-center text-sm md:text-base">
			Allow equip unearned

			<Select selectionMode="multiple" className="w-48 ml-auto" size="sm" placeholder="None" isDisabled={loading}
				selectedKeys={new Set([UserPermissions.USER, ...USER_PERMISSION_NAMES.keys()]
					.filter(p => config.chuni_allow_equip_unearned & (1 << p))
					.map(p => p.toString()))}
				onSelectionChange={s => typeof s !== 'string' && setConfigKey('chuni_allow_equip_unearned',
					([...s] as number[]).reduce((t, x) => +t | (1 << +x), 0))}>
				{[[UserPermissions.USER, { title: 'All Users' }] as const, ...USER_PERMISSION_NAMES]
					.map(([permission, { title }]) => (<SelectItem key={permission?.toString()}>
					{title}
				</SelectItem>)) }
			</Select>

			<span className="w-full mt-2 text-xs sm:text-sm text-gray-500">
				Allow these user roles to equip userbox items that they have not earned.
			</span>
		</label>
	</main>);
};