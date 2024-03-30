import { requireUser } from '@/actions/auth';
import { getUserData } from '@/actions/chuni/profile';
import { getUserboxItems } from '@/actions/chuni/userbox';
import { ChuniUserbox } from './userbox';
import { Viewport } from 'next';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	interactiveWidget: 'resizes-content'
};

export default async function ChuniUserboxPage() {
	const user = await requireUser();
	const profile = await getUserData(user);
	const userboxItems = await getUserboxItems(user, profile);

	return (<ChuniUserbox profile={profile} userboxItems={userboxItems} />);
}
