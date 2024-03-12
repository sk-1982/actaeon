import { getPlaylog } from '@/actions/chuni/playlog';
import { ChuniNameplate } from '@/components/chuni/nameplate';
import { ChuniPlaylogCard } from '@/components/chuni/playlog-card';
import { getUserData, getUserRating } from '@/actions/chuni/profile';
import { requireUser } from '@/actions/auth';
import { notFound } from 'next/navigation';
import { ChuniTopRating } from '@/components/chuni/top-rating';
import { ChuniTopRatingSidebar } from '@/components/chuni/top-rating-sidebar';

export default async function ChuniDashboard() {
	const user = await requireUser();
	const [profile, rating, playlog] = await Promise.all([
		getUserData(user),
		getUserRating(user),
		getPlaylog({ limit: 72 })
	])

	if (!profile) return notFound();

	return (<div className="flex h-full flex-col md:flex-row">
		<ChuniNameplate className="block md:hidden w-full" profile={profile} />
		<div className="mr-4 w-full md:w-[16rem] 2xl:w-[32rem] flex-shrink-0">
			<ChuniTopRatingSidebar rating={rating} />
		</div>
		<div className="flex flex-col h-full flex-grow">
			<ChuniNameplate className="hidden md:block max-w-[38rem] w-full ml-auto" profile={profile} />
			<div className="text-lg font-semibold px-4 pt-4 border-t border-gray-500 md:hidden">Playlog</div>
			<div className="my-4 w-full flex-grow grid gap-2 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 5xl:grid-cols-6 6xl:grid-cols-8">
				{playlog.data.map((entry, i) => <ChuniPlaylogCard className="w-full h-48" playlog={entry} key={i} />)}
			</div>
		</div>
	</div>);
}

