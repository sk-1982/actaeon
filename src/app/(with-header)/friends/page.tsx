import { requireUser } from '@/actions/auth';
import { getFriends } from '@/data/friend';
import { Friends } from './friends';

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
	const user = await requireUser();
	const friends = await getFriends(user.id);

	return (<Friends friends={friends} />);
};