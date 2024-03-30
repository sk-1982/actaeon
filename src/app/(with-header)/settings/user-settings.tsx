'use client';

import { setUserSettings } from '@/actions/user';
import { useUser } from '@/helpers/use-user';
import { getValidHomepageRoutes } from '@/routes';
import { USER_VISIBILITY_NAMES, UserVisibility } from '@/types/user';
import { Button, Checkbox, CheckboxGroup, Divider, Select, SelectItem, SelectSection } from '@nextui-org/react';
import { useState } from 'react';
import { useErrorModal } from '@/components/error-modal';

export const UserSettings = () => {
	const user = useUser({ required: true });
	const homepageRoutes = getValidHomepageRoutes(user);
	const [homepage, setHomepage] = useState(user.homepage);
	const [visibility, setVisibility] = useState(user.visibility);
	const [saved, setSaved] = useState(true);
	const [loading, setLoading] = useState(false);
	const setError = useErrorModal();

	return (<section className="w-full rounded-lg sm:bg-content1 sm:shadow-lg">
		<header className="text-2xl font-semibold px-4 items-center h-16 flex">
			Settings
			{!saved && <Button className="ml-auto" color="primary" isDisabled={loading} onPress={() => {
				setLoading(true);
				setUserSettings({ visibility, homepage })
					.then(res => {
						if (res?.error)
							setError(res.message);
						else
							setSaved(true);
					})
					.finally(() => setLoading(false));
			}}>Save</Button>}
		</header>
		<Divider className="mb-4 hidden sm:block" />
		<section className="px-3 pb-4 flex flex-col gap-4">
			<Select label="Homepage" labelPlacement="outside" placeholder="Default"
				isDisabled={loading}
				onSelectionChange={k => {
					if (typeof k === 'string') return;
					const val = [...k][0];
					setHomepage(val?.toString() ?? null);
					setSaved(false);
				}}
				selectedKeys={new Set(homepage ? [homepage] : [])}>
				{homepageRoutes.map(({ name, routes }, i) => (<SelectSection key={i} title={name}
					showDivider={i < homepageRoutes.length - 1}>
					{routes.map(({ name: subrouteName, url }) => (<SelectItem key={url} value={url} textValue={`${name}┃${subrouteName}`}>
						{subrouteName}
					</SelectItem>))}
				</SelectSection>))}
			</Select>

			<div className="flex flex-col gap-1">
				<span className="text-sm mb-0.5">Profile Visibility</span>
				{[...USER_VISIBILITY_NAMES].map(([mask, name]) => (<Checkbox key={mask} isSelected={!!(mask & visibility)}
					isDisabled={loading ||
						(mask !== UserVisibility.EVERYONE && !!(visibility & UserVisibility.EVERYONE))}
					onValueChange={s => {
						setVisibility(v => s ? (v | mask) : (v & ~mask));
						setSaved(false);
					}}>
					{name}
				</Checkbox>))}
			</div>
		</section>
	</section>);
};