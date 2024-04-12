'use client';

import { Arcade, ArcadeCab, ArcadeLink, ArcadeUser } from '@/data/arcade';
import { JoinPrivacy } from '@/types/privacy-visibility';
import { Autocomplete, AutocompleteItem } from '@nextui-org/autocomplete';
import { Button } from '@nextui-org/button';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { SelectItem, Select } from '@nextui-org/select';
import { Tooltip } from '@nextui-org/tooltip';
import { LinkIcon, PencilIcon, PencilSquareIcon, PlusIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import { useUser } from '@/helpers/use-user';
import { hasArcadePermission, hasPermission } from '@/helpers/permissions';
import { ARCADE_PERMISSION_NAMES, ArcadePermissions, UserPermissions } from '@/types/permissions';
import { ALLNET_JAPAN_REGION, WACCA_REGION } from '@/types/region';
import { COUNTRY_CODES } from '@/types/country';
import { ArcadeUpdate, createArcadeLink, deleteArcade, deleteArcadeLink, joinPublicArcade, removeUserFromArcade, setUserArcadePermissions, updateArcade } from '@/actions/arcade';
import { useErrorModal } from '@/components/error-modal';
import { Entries } from 'type-fest';
import { Cab } from './cab';
import Link from 'next/link';
import { useConfirmModal } from '@/components/confirm-modal';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { JoinLinksModal } from '@/components/join-links-modal';
import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionEditModal, PermissionEditModalUser } from '@/components/permission-edit-modal';
import { VisibilityDropdown } from '@/components/visibility-dropdown';

export type ArcadeProps = {
	arcade: Arcade,
	users: ArcadeUser[],
	cabs: ArcadeCab[],
	links: ArcadeLink[]
};

const ARCADE_KEYS = ['nickname', 'city', 'state', 'country', 'country_id', 'timezone', 'region_id', 'ip'] as const;

const ARCADE_UPDATE_KEYS = ['visibility', 'joinPrivacy', 'name', 'nickname', 'country', 'country_id',
	'state', 'city', 'region_id', 'timezone', 'ip'];

const getArcadeLabel = (k: string) => {
	if (k === 'ip') return 'IP';
	if (k === 'region_id') return 'Region';

	return `${k[0].toUpperCase()}${k.slice(1).replace(/_id$/ig, ' ID')}`;
};

const getArcadeValue = <T extends { country: string | null | undefined, region_id: string | null | undefined }>(arcade: T, k: keyof T) => {
	if (k === 'country')
		return COUNTRY_CODES.get(arcade.country as any) ?? arcade.country;
	if (k === 'region_id')
		return ALLNET_JAPAN_REGION.get(+(arcade.region_id as any)) ?? arcade.region_id;

	return arcade[k]?.toString();
}

export const ArcadeDetail = ({ arcade: initialArcade, users: initialUsers, cabs: initialCabs, links }: ArcadeProps) => {
	const searchParams = useSearchParams();
	const [arcade, setArcade] = useState({
		...initialArcade, region_id:
			initialArcade?.region_id?.toString(),
		country_id: initialArcade?.country_id?.toString()
	});
	const [editing, setEditing] = useState(!!searchParams.get('editing'));
	const [regionValue, setRegionValue] = useState('');
	const [loading, setLoading] = useState(false);
	const [users, setUsers] = useState(initialUsers);
	const arcadeRestore = useRef({ ...arcade });
	const user = useUser();
	const setError = useErrorModal();
	const [cabs, setCabs] = useState(initialCabs);
	const [creatingNewCab, setCreatingNewCab] = useState(false);
	const confirm = useConfirmModal();
	const [linksOpen, setLinksOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<PermissionEditModalUser | null>(null);
	const router = useRouter();

	const save = () => {
		const arcadeUpdateVals = Object.fromEntries(Object.entries(arcade)
			.filter(([k]) => ARCADE_UPDATE_KEYS.includes(k)));

		const update: Partial<ArcadeUpdate> = {
			...arcadeUpdateVals,
			country_id: (arcade.country_id === '' || arcade.country_id === undefined) ? null : +arcade.country_id,
			region_id: null
		};

		const regionText = (arcade.region_id ?? regionValue ?? '')
			.replace(/-wacca$/, '').trim();
		update.region_id = regionText === '' ? null : +regionText;

		(Object.entries(update) as Entries<typeof update>).forEach(([k, v]) => {
			if (typeof v === 'string')
				(update as any)[k] = v = v.trim();
			if (v === '') (update as any)[k] = null;
		});

		setLoading(true);
		updateArcade(initialArcade.id, update)
			.then(data => {
				if (data?.error)
					return setError(data?.message!);
				setEditing(false);
			})
			.finally(() => setLoading(false));
	};

	const renderEdit = (k: keyof Arcade) => {
		const label = getArcadeLabel(k);
		if (k === 'country')
			return (<Select label={label} key={k} isDisabled={loading}
				selectedKeys={new Set(arcade.country ? [arcade.country] : [])}
				onSelectionChange={s => typeof s !== 'string' && setArcade(
					a => ({ ...a, country: [...s][0]?.toString() ?? null }))}>
				{[...COUNTRY_CODES].map(([code, name]) => <SelectItem key={code}>
					{name}
				</SelectItem>)}
			</Select>);

		if (k === 'region_id')
			return (<Autocomplete label={label} key={k} isDisabled={loading} className="col-span-2 sm:col-span-1"
				allowsCustomValue
				selectedKey={arcade.region_id?.toString()}
				inputValue={arcade.region_id === undefined ? regionValue : undefined}
				onInputChange={setRegionValue}
				onSelectionChange={s => setArcade(a => ({ ...a, region_id: s?.toString() }))}>
				{[...[...ALLNET_JAPAN_REGION].map(
					([regionId, name]) => (<AutocompleteItem key={regionId.toString()} textValue={`${name} (${regionId})`}>
						{name} ({regionId})
					</AutocompleteItem>))]
					// looks like allnet -> wacca region id is handled internally by artemis?
					// ...[...WACCA_REGION].map(([regionId, name]) => (
					// 	<AutocompleteItem key={`${regionId}-wacca`} textValue={`(WACCA) ${name} (${regionId})`}>
					// 		(WACCA) {name} ({regionId})
					// 	</AutocompleteItem>))]
				}
			</Autocomplete>);

		return (<Input key={k} value={arcade[k]?.toString() ?? ''} label={label} isDisabled={loading}
			type={k === 'country_id' ? 'number' : 'text'}
			onChange={ev => setArcade(a => ({ ...a, [k]: ev.target.value }))} />);
	};

	return (<main className="w-full flex flex-col mt-2">
			<JoinLinksModal links={links} prefix={`/arcade/${arcade.uuid}/join/`}
				onDelete={id => deleteArcadeLink(arcade.id, id)}
				onCreate={uses => createArcadeLink(arcade.id, uses)}
				open={linksOpen} onClose={() => setLinksOpen(false)} />

			<PermissionEditModal user={editingUser}
				onClose={() => setEditingUser(null)}
				permissions={ARCADE_PERMISSION_NAMES}
				displayUpTo={hasPermission(user?.permissions, UserPermissions.ACMOD) ?
					ArcadePermissions.OWNER : ArcadePermissions.REGISTRAR}
				onEdit={(user, permissions) => {
					setUsers(u => u.map(u => u.id === user ? { ...u, permissions } : u));
					setUserArcadePermissions({ arcadeUser: user, permissions, arcade: arcade.id });
				}} />
			<header className="font-bold text-5xl self-center flex gap-3 items-center">
			<VisibilityDropdown visibility={arcade.visibility} editing={editing} loading={loading}
				onVisibilityChange={v => setArcade(a => ({ ...a, visibility: v }))} />
			{editing ?
				<Input aria-label="Name" size="lg" className="font-normal mr-2" labelPlacement="outside-left" type="text"
					isDisabled={loading} isRequired placeholder="Name"
					value={arcade.name ?? ''} onChange={ev => setArcade(a => ({ ...a, name: ev.target.value }))}
					classNames={{
						input: 'text-4xl leading-none',
						inputWrapper: 'h-24'
					}} />
				:
				arcade.name}
			</header>
			{editing ? <section
					className="grid px-2 sm:px-0 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 5xl:grid-cols-9 gap-2 flex-wrap mt-3">
					{ARCADE_KEYS.map(renderEdit)}
					<Select isRequired label="Join Privacy" selectedKeys={new Set([arcade.joinPrivacy.toString()])}
						isDisabled={loading}
						onSelectionChange={s => typeof s !== 'string' && s.size && setArcade(
							a => ({ ...a, joinPrivacy: +[...s][0] }))}>
						<SelectItem key={JoinPrivacy.INVITE_ONLY.toString()}>Invite Only</SelectItem>
						<SelectItem key={JoinPrivacy.PUBLIC.toString()}>Public</SelectItem>
					</Select>

					<div
						className="col-span-2 sm:col-span-3 xl:col-span-1 5xl:col-span-1 5xl:col-start-5 grid grid-cols-2 gap-2 h-full min-h-10">
						<Button variant="light" color="danger" className="h-full" isDisabled={loading} onClick={() => {
							setArcade(arcadeRestore.current);
							setEditing(false);
						}}>Cancel</Button>
						<Button color="primary" className="h-full" isDisabled={loading} onClick={save}>Save</Button>
					</div>
				</section> :
				<section className="self-center mt-5 gap-x-8 gap-y-4 items-center justify-center text-xl flex flex-wrap">
					{ARCADE_KEYS.map(k =>
						arcade[k] && <span key={k}>
					<span className="font-semibold">{getArcadeLabel(k)}:</span> {getArcadeValue(arcade, k)}
				</span>)
					}
					<span><span className="font-semibold">Join Privacy: </span>
						{arcade.joinPrivacy === JoinPrivacy.INVITE_ONLY ? 'Invite only' : 'Public'}
			</span>
					{hasArcadePermission(arcade.permissions, user?.permissions, ArcadePermissions.EDITOR) &&
						<Tooltip content="Edit arcade settings">
							<Button className="" isIconOnly variant="light" radius="full" onPress={() => {
								setEditing(true);
								arcadeRestore.current = { ...arcade };
							}}>
								<PencilIcon className="h-1/2" />
							</Button>
						</Tooltip>
					}
				</section>}

			<Divider className="mt-4" />

			<section className="max-w-screen-4xl w-full mx-auto">
				<header className="py-4 pl-4 sm:pl-0 flex items-center text-2xl font-semibold">
					Machines
					{!creatingNewCab &&
						<Button className="ml-auto mr-2" isIconOnly size="lg" onPress={() => setCreatingNewCab(true)}>
							<PlusIcon className="h-1/2" />
						</Button>}
				</header>
				<section className="px-2 sm:px-0">
					{creatingNewCab && <Cab permissions={arcade.permissions}
						cab={{ arcade: arcade.id } as any}
						creatingNew
						onDelete={() => setCreatingNewCab(false)}
						onNewData={setCabs} />}
					{(cabs.length || creatingNewCab) ? cabs.map(
							cab => (<Cab key={cab.id} cab={cab} permissions={arcade.permissions}
								onEdit={newCab => setCabs(c => c.map(c => c.id === cab.id ? newCab : c))}
								onDelete={() => setCabs(c => c.filter(c => c.id !== cab.id))} />)) :
						<span className="italic text-gray-500">This arcade has no machines</span>}
				</section>
			</section>

			<Divider className="mt-4 max-w-screen-4xl w-full mx-auto" />

			<section className="max-w-screen-4xl w-full mx-auto">
				<header className="py-4 pl-4 sm:pl-0 flex items-center text-2xl font-semibold">
					<span className="mr-auto">Users</span>

					{(arcade.joinPrivacy === JoinPrivacy.PUBLIC || hasPermission(user?.permissions, UserPermissions.ACMOD)) && !arcade.permissions && <Tooltip content="Join this arcade">
						<Button className="mr-2" isIconOnly size="lg" onPress={() => joinPublicArcade(arcade.id)
							.then(() => location.reload())}>
							<UserPlusIcon className="h-1/2" />
						</Button>
					</Tooltip>}

					{(hasPermission(arcade.permissions, ArcadePermissions.OWNER) ||
						hasPermission(user?.permissions, UserPermissions.OWNER)) && <Tooltip content="Manage invite links">
						<Button className="mr-2" isIconOnly size="lg" onPress={() => setLinksOpen(true)}>
							<LinkIcon className="h-1/2" />
						</Button>
					</Tooltip>}

					{!!arcade.permissions && !hasPermission(arcade.permissions, ArcadePermissions.OWNER) &&
						<Tooltip content={<span className="text-danger">Leave this arcade</span>}>
							<Button className="mr-2" isIconOnly size="lg" variant="flat" color="danger" onPress={() => {
								confirm('Would you like to leave this arcade?', () => {
									removeUserFromArcade(arcade.id).then(() => location.reload());
								});
							}}>
								<UserMinusIcon className="h-1/2" />
							</Button>
						</Tooltip>}
				</header>
				{!users.length && <span className="italic text-gray-500">This arcade has no users</span>}
				<div className="flex flex-wrap gap-3 px-2 sm:px-0">
					{users.map((arcadeUser, index) => (<div key={index}
						className="p-3 bg-content1 shadow w-full sm:w-64 max-w-full h-16 overflow-hidden flex items-center rounded-lg gap-1">
						{'username' in arcadeUser ?
							<Link className="font-semibold underline transition hover:text-secondary mr-auto"
								href={`/user/${arcadeUser.uuid}`}>{arcadeUser.username}</Link> :
							<span className="text-gray-500 italic mr-auto">Anonymous User</span>}

						{(hasPermission(arcade.permissions, ArcadePermissions.OWNER) ||
								hasPermission(user?.permissions, UserPermissions.USERMOD)) &&
							<Tooltip content="Edit user permissions">
								<Button isIconOnly size="sm" onPress={() => setEditingUser(arcadeUser)}>
									<PencilSquareIcon className="h-1/2" />
								</Button>
							</Tooltip>
						}

						{(hasPermission(arcade.permissions, ArcadePermissions.OWNER) ||
								hasPermission(user?.permissions, UserPermissions.USERMOD)) &&
							arcadeUser.id !== user?.id &&
							<Tooltip content={<span className="text-danger">Kick user</span>}>
								<Button isIconOnly color="danger" size="sm" onPress={() => {
									confirm('Are you sure you want to kick this user?',
										() => removeUserFromArcade(arcade.id, arcadeUser.id)
											.then(() => setUsers(u => u.filter(u => u.id !== arcadeUser.id))));
								}}>
									<XMarkIcon className="h-1/2" />
								</Button>
							</Tooltip>}
					</div>))}
				</div>
			</section>

		<Divider className="mt-4 max-w-screen-4xl w-full mx-auto" />

		{hasArcadePermission(arcade.permissions, user?.permissions, ArcadePermissions.OWNER) && <section className="max-w-screen-4xl w-full mx-auto">
			<header className="py-4 pl-4 sm:pl-0 flex items-center text-2xl font-semibold">
				<span className="mr-auto">Management</span>
			</header>

			<Button color="danger" onPress={() => {
				confirm('Do you want to delete this arcade? This action cannot be undone.', () => {
					deleteArcade(arcade.id)
						.then(() => { router.push('/arcade'); router.refresh() });
				});
			}}>
				Delete this arcade
			</Button>
		</section>}
	</main>
);
};
