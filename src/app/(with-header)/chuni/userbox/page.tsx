import { requireUser } from '@/actions/auth';
import { getUserData } from '@/actions/chuni/profile';
import { getUserboxItems } from '@/actions/chuni/userbox';
import { ChuniUserbox } from './userbox';
import { Viewport } from 'next';
import { ChuniNoProfile } from '@/components/chuni/no-profile';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	interactiveWidget: 'resizes-content'
};

export const dynamic = 'force-dynamic';

export default async function ChuniUserboxPage() {
	const user = await requireUser();

	if (!user?.chuni)
		return (<ChuniNoProfile />);

	const profile = await getUserData(user);
	const userboxItems = await getUserboxItems(user, profile);

	return (<ChuniUserbox profile={profile} userboxItems={userboxItems} />);
}
