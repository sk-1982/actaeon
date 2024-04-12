'use client';

import { Friend } from '@/data/friend';
import { Divider } from '@nextui-org/divider';
import { useState } from 'react';
import { FriendRow } from './friend-row';

export type FriendsProps = {
	friends: Friend[],
};

export const Friends = ({ friends: initialFriends }: FriendsProps) => {
	const [friends, setFriends] = useState(initialFriends);

	return (<main className="w-full mx-auto max-w-7xl flex flex-col">
		<header className="font-semibold flex items-center text-2xl p-4">
			Friends
		</header>

		<Divider className="mb-1.5 sm:mb-2" />

		{!friends.length && <span className="text-gray-500 italic ml-4 mt-4">You don&apos;t have any friends</span>}

		<section className="flex flex-col sm:grid gap-1.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{friends.map(f => (<FriendRow friend={f} key={f.id} onUnfriend={() => {
				setFriends(friends => friends.filter(friend => friend.uuid !== f.uuid))
			}} />))}
		</section>
	</main>);
};