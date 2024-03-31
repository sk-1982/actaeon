'use client';

import { ChuniUserData } from '@/actions/chuni/profile';
import { ChuniAvatar } from '@/components/chuni/avatar';
import { ChuniNameplate } from '@/components/chuni/nameplate';
import { hasPermission } from '@/helpers/permissions';
import { useUser } from '@/helpers/use-user';
import { USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import { UserPayload } from '@/types/user';
import { ArrowUpRightIcon } from '@heroicons/react/16/solid';
import { UserIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Button, Divider, Tooltip } from '@nextui-org/react';
import Link from 'next/link';
import { PermissionIcon } from '@/components/permission-icon';

export type UserProfile<V extends boolean> = Pick<UserPayload, 'username' | 'id' | 'uuid' | 'permissions'> & { visible: V; };

export type UserProfileProps<T extends boolean> = T extends false ? {
	user: UserProfile<false>,
	isFriend: boolean
} : {
	user: UserProfile<true>,
	chuniProfile: ChuniUserData,
	isFriend: boolean
};

export const UserProfile = <T extends boolean>(props: UserProfileProps<T>) => {
	const viewingUser = useUser();

	const header = (<>
		<header className="flex flex-wrap w-full text-4xl font-bold mt-4 px-4 sm:mt-12 max-w-4xl mx-auto items-center gap-3">
			<div className="flex items-center mx-auto sm:mx-0">
				<span>{props.user.username}</span>
				{[...USER_PERMISSION_NAMES].filter(([permission]) => props.user.permissions! & (1 << permission))
					.map(([permission]) => <PermissionIcon permission={permission} className="ml-2.5 h-7 w-7" />)}
			</div>

			<div className="ml-auto flex gap-2">
				{hasPermission(viewingUser?.permissions, UserPermissions.USERMOD) && <Link href={`/admin/users#${props.user.uuid}`}>
					<Tooltip content="View user in admin panel">
						<Button isIconOnly size="lg" className="relative">
							<UserIcon className="w-[47%] -translate-x-0.5" />
							<ArrowUpRightIcon className="w-[33%] absolute top-2.5 right-2" />
						</Button>
					</Tooltip>
				</Link>}

				{props.isFriend ? <Tooltip content={<span className="text-danger">Unfriend</span>}>
					<Button isIconOnly size="lg" color="danger" variant="flat">
						<UserMinusIcon className="h-1/2" />
					</Button>
				</Tooltip> : <Tooltip content="Send friend request">
					<Button isIconOnly size="lg">
						<UserPlusIcon className="h-1/2" />
					</Button>
				</Tooltip>}
			</div>
		</header>
		<Divider className="sm:mt-12 sm:mb-12 my-4 max-w-7xl mx-auto" />
	</>);
	
	if (!props.user.visible)
		return (<main>
			{ header }
		</main>)
	
	const { chuniProfile } = props as UserProfileProps<true>;

	return (<main className="flex flex-col">
		{header}
		{chuniProfile && <section className="w-full flex flex-col max-w-7xl mx-auto">
			<header className="mb-8 font-semibold text-2xl px-4">Chunithm Profile</header>
			<section className="md:h-96 flex flex-col md:flex-row gap-x-5 gap-y-2 justify-center items-center">
				<div className="w-full md:w-auto md:h-full flex-grow-[2.75]">
					<ChuniNameplate profile={chuniProfile} className="w-full" />
				</div>
				<div className="w-full md:w-auto max-w-80 sm:max-w-72 md:max-w-none md:h-full flex-grow">
					<ChuniAvatar className="w-full"
						wear={chuniProfile.avatarWearTexture}
						head={chuniProfile.avatarHeadTexture}
						face={chuniProfile.avatarFaceTexture}
						skin={chuniProfile.avatarSkinTexture}
						item={chuniProfile.avatarItemTexture}
						back={chuniProfile.avatarBackTexture}
					/>
				</div>
			</section>

		</section>}
	</main>);
};
