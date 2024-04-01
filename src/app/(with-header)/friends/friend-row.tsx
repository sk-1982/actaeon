import { Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Divider, Tooltip } from '@nextui-org/react';
import { Friend } from '@/data/friend';
import Link from 'next/link';
import { ChuniPenguinIcon } from '@/components/chuni/chuni-penguin-icon';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useConfirmModal } from '@/components/confirm-modal';
import { useState } from 'react';
import { addFriendAsRival, removeFriendAsRival, unfriend } from '@/actions/friend';
import { useErrorModal } from '@/components/error-modal';

type FriendRowProps = {
	friend: Friend,
	onUnfriend: () => void
};

export const FriendRow = ({ friend: initialFriend, onUnfriend }: FriendRowProps) => {
	const confirm = useConfirmModal();
	const [friend, setFriend] = useState(initialFriend);
	const setError = useErrorModal();

	return (<section>
		<section className="px-3 sm:bg-content1 sm:rounded-lg py-2.5 flex items-center">
			<Link href={`/user/${friend.uuid}`} className="flex items-center">
				<Avatar
					name={friend.username?.[0]?.toUpperCase() ?? undefined}
					className={`w-10 h-10 mr-2 text-2xl [font-feature-settings:"fwid"]`} />
				<span className="font-semibold transition hover:text-secondary">{friend.username}</span>
			</Link>
			{!!friend.chuniRival && <Tooltip content="Chunithm Rival">
				<div>
					<ChuniPenguinIcon className="ml-2 h-9" />
				</div>
			</Tooltip>}

			<Dropdown>
				<DropdownTrigger>
					<Button isIconOnly variant="light" className="ml-auto" radius="full">
						<EllipsisVerticalIcon className="h-3/4" />
					</Button>
				</DropdownTrigger>
				<DropdownMenu>
					<DropdownItem onPress={() => {
						if (friend.chuniRival)
							removeFriendAsRival(friend.id).then(() => setFriend({ ...friend, chuniRival: 0 }));
						else
							addFriendAsRival(friend.id).then(res => {
								if (res?.error)
									return setError(res.message);
								setFriend({ ...friend, chuniRival: 1 })
							});
					}}>
						{friend.chuniRival ? 'Remove as rival' : 'Add as rival'}
					</DropdownItem>
					<DropdownItem color="danger" variant="flat" className="text-danger" onPress={() =>
						confirm('Are you sure you want to unfriend this user? This will also remove them as a rival.', () => {
							unfriend(friend.id)
								.then(onUnfriend)
						})}>
						Unfriend
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		</section>
		<Divider className="sm:hidden mt-1.5" />
	</section>);
};