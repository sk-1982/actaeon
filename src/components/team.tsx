'use client';

import { useRef, useState } from 'react';
import { Team, TeamUser } from '@/data/team';
import { VisibilityDropdown } from './visibility-dropdown';
import { Button, Divider, Input, Select, SelectItem, Tooltip } from '@nextui-org/react';
import { JoinPrivacy } from '@/types/privacy-visibility';
import { LinkIcon, PencilIcon, UserMinusIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/helpers/use-user';
import { createTeamLink, deleteTeam, deleteTeamLink, joinPublicTeam, modifyTeam, removeUserFromTeam } from '@/actions/team';
import { useErrorModal } from './error-modal';
import { UserPermissions } from '@/types/permissions';
import { hasPermission } from '@/helpers/permissions';
import { useConfirmModal } from './confirm-modal';
import { DB } from '@/types/db';
import { JoinLinksModal } from './join-links-modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type TeamDetailProps = {
	team: Team,
	users: TeamUser[],
	links: DB['actaeon_team_join_keys'][]
};

export const TeamDetail = ({ team: initialTeam, users: initialUsers, links }: TeamDetailProps) => {
	const [team, setTeam] = useState(initialTeam);
	const [users, setUsers] = useState(initialUsers);
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [linksOpen, setLinksOpen] = useState(false);
	const teamRestore = useRef({ ...team });
	const user = useUser();
	const setError = useErrorModal();
	const confirm = useConfirmModal();
	const router = useRouter();

	const save = () => {
		setLoading(true);
		modifyTeam(team.uuid, {
			name: team.name!,
			visibility: team.visibility,
			joinPrivacy: team.joinPrivacy
		})
			.then(res => {
				if (res.error)
					return setError(res.message);
				setEditing(false);
			})
			.finally(() => setLoading(false));
	};

	const isMember = !!users.find(u => user && u.uuid === user?.uuid);
	const isOwner = hasPermission(user?.permissions, UserPermissions.OWNER) || (user && user.uuid === team.ownerUuid);

	return (<main className="w-full flex flex-col mt-2">
		<JoinLinksModal links={links} prefix={`/team/${team.uuid}/join/`}
			onDelete={id => deleteTeamLink(team.uuid, id)}
			onCreate={uses => createTeamLink(team.uuid, uses)}
			open={linksOpen} onClose={() => setLinksOpen(false)} />

		<header className="font-bold text-5xl self-center flex gap-3 items-center">
			<VisibilityDropdown visibility={team.visibility} editing={editing} loading={loading}
				onVisibilityChange={v => setTeam(t => ({ ...t, visibility: v }))} />
			{editing ? <Input aria-label="Name" size="lg" className="font-normal mr-2" labelPlacement="outside-left" type="text"
				isDisabled={loading} isRequired placeholder="Name"
				value={team.name ?? ''} onChange={ev => setTeam(t => ({ ...t, name: ev.target.value }))}
				classNames={{
					input: 'text-4xl leading-none',
					inputWrapper: 'h-24'
				}} /> : team.name}
		</header>

		<section className={`flex ${editing ? 'flex-col gap-x-2' : 'gap-x-10'} sm:flex-row w-full justify-center mt-5 gap-y-3 text-xl items-center`}>
			{editing ? <>
				<Select isRequired label="Join Privacy" selectedKeys={new Set([team.joinPrivacy.toString()])} className="w-full px-2 sm:w-60 sm:ml-14"
					isDisabled={loading} size="sm"
					onSelectionChange={s => typeof s !== 'string' && s.size && setTeam(t => ({ ...t, joinPrivacy: +[...s][0] }))}>
					<SelectItem key={JoinPrivacy.INVITE_ONLY.toString()}>Invite Only</SelectItem>
					<SelectItem key={JoinPrivacy.PUBLIC.toString()}>Public</SelectItem>
				</Select>

				<div className="h-full flex gap-2 min-h-12 ml-auto mr-2 sm:m-0">
					<Button className="h-full" variant="light" color="danger" onPress={() => {
						setTeam(teamRestore.current);
						setEditing(false);
					}}>Cancel</Button>
					<Button className="h-full" color="primary" onPress={save}>Save</Button>
				</div>
		</> : <>
				<div>
					<span className="font-semibold">Chunithm Team Points: </span>
						{team.chuniTeamPoint?.toLocaleString()}
				</div>

				<div>
					<span className="font-semibold">Join Privacy: </span>
					{team.joinPrivacy === JoinPrivacy.PUBLIC ? 'Public' : 'Invite Only'}
				</div>

					{isOwner && <Tooltip content="Edit team settings">
					<Button isIconOnly variant="light" radius="full" onPress={() => {
						setEditing(true);
						teamRestore.current = { ...team };
					}}>
						<PencilIcon className="h-1/2" />
					</Button>
				</Tooltip>}
			</>}

		</section>

		<Divider className="mt-4" />
		
		<section className="max-w-screen-4xl w-full mx-auto">
			<header className="py-4 pl-4 sm:pl-0 flex items-center text-2xl font-semibold">
				<span className="mr-auto">Users</span>

				{(team.joinPrivacy === JoinPrivacy.PUBLIC || isOwner) && !isMember &&
					!user?.team && <Tooltip content="Join this team">
					<Button className="mr-2" isIconOnly size="lg" onPress={() => joinPublicTeam(team.uuid).then(res => {
						if (res?.error) return setError(res.message);
						location.reload();
					})}>
						<UserPlusIcon className="h-1/2" />
					</Button>
				</Tooltip>}

				{!isOwner && isMember && <Tooltip content={<span className="text-danger">Leave this team</span>}>
					<Button className="mr-2" isIconOnly size="lg" variant="flat" color="danger" onPress={() => {
						confirm('Would you like to leave this team?', () => {
							removeUserFromTeam(team.uuid)
								.then(res => {
									if (res?.error) return setError(res.message);
									location.reload();
								});
						});
					}}>
						<UserMinusIcon className="h-1/2" />
					</Button>
				</Tooltip>}

				{isOwner && <Tooltip content="Manage invite links">
					<Button className="mr-2" isIconOnly size="lg" onPress={() => setLinksOpen(true)}>
						<LinkIcon className="h-1/2" />
					</Button>
				</Tooltip>}
			</header>

			{!users.length && <span className="italic text-gray-500">This arcade has no users</span>}

			<div className="flex flex-wrap gap-3 px-2 sm:px-0">
				{users.map((teamUser, index) => <div key={index}
					className="p-3 bg-content1 shadow w-full sm:w-64 max-w-full h-16 overflow-hidden flex items-center rounded-lg gap-1">
					{teamUser.uuid ? <Link className="font-semibold underline transition hover:text-secondary mr-auto"
						href={`/user/${teamUser.uuid}`}>
						{teamUser.username}
					</Link> : <span className="text-gray-500 italic mr-auto">Anonymous User</span>}

					{isOwner && teamUser.uuid !== user?.uuid && <Tooltip content={<span className="text-danger">Kick user</span>}>
						<Button isIconOnly color="danger" size="sm" onPress={() => {
							confirm('Are you sure you want to kick this user?',
								() => removeUserFromTeam(team.uuid, teamUser.id!)
									.then(() => setUsers(u => u.filter(u => u.uuid !== teamUser.uuid))));
						}}>
							<XMarkIcon className="h-1/2" />
						</Button>
					</Tooltip>}
				</div>)}
			</div>
		</section>

		{isOwner && <>
			<Divider className="mt-4" />

			<section className="max-w-screen-4xl w-full mx-auto">
				<header className="py-4 pl-4 sm:pl-0 flex items-center text-2xl font-semibold">
					Management
				</header>

				<Button color="danger" onPress={() => {
					confirm(<span>Do you want to delete this team? This will remove all team data such as team points.
						<span className="font-bold">THIS ACTION CANNOT BE UNDONE.</span></span>, () =>
							confirm(<span>Are you <span className="font-bold">REALLY</span> sure?</span>, () => {
								deleteTeam(team.uuid)
									.then(() => { router.push('/team'); router.refresh() });
							}));
				}}>
					Delete this team
				</Button>
			</section>
		</>}
	</main>);
};
