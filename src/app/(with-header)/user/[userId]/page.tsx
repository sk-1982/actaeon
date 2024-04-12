import { getUser } from '@/actions/auth';
import { userIsVisible, withUsersVisibleTo } from '@/data/user';
import { notFound } from 'next/navigation';
import { getUserData as getChuniUserData } from '@/actions/chuni/profile';
import { UserProfile } from './user-profile';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: { userId: string; }; }) {
	const viewingUser = await getUser();
	const user = structuredClone(await withUsersVisibleTo(viewingUser)
		.selectFrom('aime_user as u')
		.innerJoin('actaeon_user_ext as ext', 'ext.userId', 'u.id')
		.where('ext.uuid', '=', params.userId)
		.select([
			'u.username',
			'u.id',
			'ext.uuid',
			'u.permissions',
			'created_date',
			'last_login_date',
			userIsVisible('u.id').as('visible')
		])
		.executeTakeFirst());
	
	if (!user)
		return notFound();
	
	const [friend, pendingFriend] = await Promise.all([
		db.selectFrom('actaeon_user_friends')
			.where('user1', '=', user.id)
			.where('user2', '=', viewingUser?.id!)
			.select('chuniRival')
			.executeTakeFirst().then(d => structuredClone(d)),
		db.selectFrom('actaeon_friend_requests')
			.where('user', '=', user.id)
			.where('friend', '=', viewingUser?.id!)
			.select('user')
			.executeTakeFirst().then(d => structuredClone(d))
	]);

	if (!user.visible)
		return (<UserProfile friend={friend} pendingFriend={!!pendingFriend} user={user as UserProfile<false>}/>);
	
	const chuniProfile = structuredClone(await getChuniUserData(user));

	return (<UserProfile friend={friend} pendingFriend={!!pendingFriend} user={user as UserProfile<true>} chuniProfile={chuniProfile} />);
}
