import { getUser } from '@/actions/auth';
import { getArcadeCabs, getArcadeInviteLinks, getArcades, getArcadeUsers } from '@/data/arcade';
import { notFound } from 'next/navigation';
import { ArcadeDetail } from './arcade';
import { PrivateVisibilityError } from '@/components/private-visibility-error';

export const dynamic = 'force-dynamic';

export default async function ArcadeDetailPage({ params }: { params: { arcadeId: string }}) {
	const user = await getUser();
	const arcade = (await getArcades({ user, uuids: [params.arcadeId], includeUnlisted: true }))[0];

	if (!arcade)
		return notFound();

	if (!arcade.visible)
		return <PrivateVisibilityError />;

	const [users, cabs, links] = await Promise.all([
		getArcadeUsers({ arcade: arcade.id, permissions: arcade.permissions, user }),
		getArcadeCabs({ arcade: arcade.id, permissions: arcade.permissions, user }),
		getArcadeInviteLinks({ arcade: arcade.id, permissions: arcade.permissions, user })
	]);

	return (<ArcadeDetail users={users} arcade={arcade} cabs={cabs} links={links} />)
};
