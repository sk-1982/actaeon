'use client';

import { createUserWithAccessCode, deleteUser, setUserPermissions } from '@/actions/user';
import { PermissionEditModal } from './permission-edit-modal';
import { useState } from 'react';
import { USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import { Button, Divider, Tooltip, Input, Accordion, AccordionItem, Link, Spacer } from '@nextui-org/react';
import { ChevronDownIcon, CreditCardIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usePromptModal } from './prompt-modal';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { generateAccessCode } from '@/helpers/access-code';
import { useUser } from '@/helpers/use-user';
import { TbBrandAppleArcade, TbCrown, TbFileSettings, TbUserShield } from 'react-icons/tb';
import { hasPermission } from '@/helpers/permissions';
import { AimeCard } from './aime-card';
import { useErrorModal } from './error-modal';
import { AdminUser } from '@/data/user';
import { adminAddCardToUser } from '@/actions/card';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useConfirmModal } from './confirm-modal';

const PERMISSION_ICONS = new Map([
	[UserPermissions.USERMOD, TbUserShield],
	[UserPermissions.ACMOD, TbBrandAppleArcade],
	[UserPermissions.SYSADMIN, TbFileSettings],
	[UserPermissions.OWNER, TbCrown]
]);

const FORMAT = {
	month: 'numeric',
	day: 'numeric',
	year: '2-digit',
	hour: 'numeric',
	minute: '2-digit'
} as const;

export const AdminUserList = ({ users: initialUsers }: { users: AdminUser[]; }) => {
	const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
	const [users, setUsers] = useState(initialUsers);
	const user = useUser();
	const prompt = usePromptModal();
	const setError = useErrorModal();
	const confirm = useConfirmModal();

	const promptAccessCode = (message: string, onConfirm: (val: string) => void) => {
		prompt({
			size: '2xl',
			title: 'Enter Access Code', content: (val, setVal) => <>
				{ message }
				<div className="flex overflow-hidden rounded-lg">
					<Input label="Access Code" inputMode="numeric" size="sm" type="text" maxLength={24} radius="none"
						classNames={{ input: `[font-feature-settings:"fwid"] text-xs sm:text-sm` }}
						value={val.match(/.{1,4}/g)?.join('-') ?? ''}
						onValueChange={v => setVal(v.replace(/\D/g, ''))} />
					<Tooltip content="Generate Random Code">
						<Button isIconOnly color="primary" size="lg" radius="none" onPress={() => setVal(generateAccessCode())}>
							<ArrowPathIcon className="h-7" />
						</Button>
					</Tooltip>
				</div>
			</>
		}, v => onConfirm(v.replace(/\D/g, '')));
	}

	return (<main className="max-w-5xl mx-auto w-full">
		<header className="p-4 font-semibold text-2xl flex items-center">
			Users

			<Tooltip content="Create new user">
				<Button isIconOnly className="ml-auto"
					onPress={() => promptAccessCode('Enter an access code to create this user', code => {
						createUserWithAccessCode(code)
							.then(res => {
								if (res.error)
									return setError(res.message!);
								setUsers(res.data);
							})
					})}>
					<PlusIcon className="h-6" />
				</Button>
			</Tooltip>
		</header>

		<Divider className="mb-2" />

		<PermissionEditModal user={editingUser} onClose={() => setEditingUser(null)}
			permissions={USER_PERMISSION_NAMES} disallowDemoteOwners
			displayUpTo={hasPermission(user?.permissions, UserPermissions.OWNER) ? UserPermissions.OWNER : UserPermissions.ACMOD}
			onEdit={(id, permissions) => {
				setUserPermissions(id, permissions);
				setUsers(u => u.map(u => u.id === id ? { ...u, permissions } : u));
			}} />
		
		{users.map(userEntry => <Accordion key={userEntry.id} className="my-1 border-b sm:border-b-0 border-divider sm:bg-content1 sm:rounded-lg sm:px-4 overflow-hidden">
			<AccordionItem key="1" indicator={({ isOpen }) => <Tooltip content="Show cards">
				<div className="flex items-center">
					<CreditCardIcon className="h-6 w-6 mr-1" />
					<ChevronDownIcon className={`h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
				</div>
			</Tooltip>}
				disableIndicatorAnimation
				title={
					<header className="w-full flex items-center flex-wrap gap-y-1">

						{!hasPermission(userEntry.permissions, UserPermissions.SYSADMIN) && userEntry.id !== user?.id && <Tooltip content="Delete user">
							<div className="mr-1.5 p-1.5 rounded-lg transition bg-danger hover:brightness-90" onClick={() => {
								confirm(<span>
									Do you want to delete this user? This will remove all user data including scores. <br />
									<span className="font-bold">THIS ACTION CANNOT BE UNDONE.</span>
								</span>, () => {
									confirm(<span>Are you <span className="font-bold">REALLY</span> sure?</span>, () => {
										deleteUser(userEntry.id)
											.then(res => {
												if (res.error) return setError(res.message);
												setUsers(u => u.filter(u => u.id !== userEntry.id));
											});
									});
								});
							}}>
								<TrashIcon className="w-5" />
							</div>
						</Tooltip>}
						
						{hasPermission(user?.permissions, UserPermissions.OWNER) && <Tooltip content="Edit permissions">
							<div className="mr-1.5 p-1.5 rounded-lg transition bg-default hover:brightness-90" onClick={() => setEditingUser(userEntry)}>
								<PencilSquareIcon className="w-5" />
							</div>
						</Tooltip>}

						<Spacer className="w-px" />

						{userEntry.username ? <>
							<Link href={`/user/${userEntry.uuid}`} className="text-white font-semibold transition hover:text-secondary">
								{userEntry.username}
							</Link>
							<span className="text-medium">&nbsp;({userEntry.email})</span>
						</> :
							<span className="italic text-gray-500">
								Unregistered User
							</span>
						}

						{[...PERMISSION_ICONS].filter(([permission]) => userEntry.permissions! & (1 << permission))
							.map(([permission, Icon]) => <Tooltip key={permission} content={USER_PERMISSION_NAMES.get(permission)!.title}>
								<div className="ml-2"><Icon className="h-6 w-6" /></div>
							</Tooltip>)}

						<Spacer className="flex-grow" />

						{userEntry.created_date && <time className="text-xs mr-4" dateTime={userEntry.created_date.toISOString()}>
							<span className="font-semibold text-sm">Created </span>
							{userEntry.created_date.toLocaleTimeString(undefined, FORMAT)}
						</time>}
						{userEntry.last_login_date && <time className="text-xs mr-4" dateTime={userEntry.last_login_date.toISOString()}>
							<span className="font-semibold text-sm">Last Login: </span>
							{userEntry.last_login_date.toLocaleTimeString(undefined, FORMAT)}
						</time>}
					</header>
				}>
				<section className="flex sm:p-4">
					<div className="flex-grow flex flex-wrap items-center justify-center gap-2">
						{userEntry.cards.map(c => <AimeCard key={c.access_code}
							card={{
								...c,
								created_date: new Date(c.created_date!),
								last_login_date: c.last_login_date ? new Date(c.last_login_date!) : null,
								id: c.id!,
								user: c.user!
							}} />)}
					</div>
					<Tooltip content="Add new card to this user">
						<Button isIconOnly onPress={() => promptAccessCode('Enter an access code to add',
							code => adminAddCardToUser(userEntry.id, code).then(res => {
								if (res.error)
									return setError(res.message);
								setUsers(res.data);
							}))}>
							<PlusIcon className="h-6" />
						</Button>
					</Tooltip>
				</section>
			</AccordionItem>
		</Accordion>)}
	</main>);
};