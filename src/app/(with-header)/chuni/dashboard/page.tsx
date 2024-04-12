import { getPlaylog } from '@/actions/chuni/playlog';
import { ChuniNameplate } from '@/components/chuni/nameplate';
import { ChuniPlaylogCard } from '@/components/chuni/playlog-card';
import { getUserData, getUserRating } from '@/actions/chuni/profile';
import { requireUser } from '@/actions/auth';
import { ChuniTopRatingSidebar } from './top-rating-sidebar';
import { Button } from '@nextui-org/button';
import Link from 'next/link';
import { ChuniNoProfile } from '@/components/chuni/no-profile';

export const dynamic = 'force-dynamic';

export default async function ChuniDashboard() {
	const user = await requireUser();

	if (!user.chuni)
		return (<ChuniNoProfile />);

	const [profile, rating, playlog] = await Promise.all([
		getUserData(user),
		getUserRating(user),
		getPlaylog({ limit: 72 })
	]);

	return (<div className="flex h-full flex-col md:flex-row">
		<div>
			<ChuniNameplate className="block md:hidden w-full" profile={profile} />
		</div>
		<div className="mr-4 w-full md:w-[16rem] 2xl:w-[32rem] flex-shrink-0">
			<ChuniTopRatingSidebar rating={rating} />
		</div>
		<div className="flex flex-col h-full flex-grow">
			<div className="flex flex-wrap-reverse">
				<div className="text-xl font-semibold mt-auto pt-3 hidden md:block pr-3">Recent Plays</div>
				<ChuniNameplate className="hidden md:block max-w-[50rem] w-full ml-auto" profile={profile} />
			</div>
			<div className="text-lg font-semibold px-4 pt-4 border-t border-gray-500 md:hidden">Recent Plays</div>
			<div className="my-4 w-full flex-grow grid gap-2 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 5xl:grid-cols-6 6xl:grid-cols-8">
				{playlog.data.map((entry, i) => <ChuniPlaylogCard className="w-full h-48"
					badgeClass="h-5 lg:h-[1.125rem] xl:h-6 2xl:h-[1.125rem] 4xl:h-6 5xl:h-[1.125rem]"
					playlog={entry} key={i} />)}
			</div>
			<div className="w-full mb-3 px-2">
				<Link href="/chuni/playlog" className="w-full flex justify-center">
					<Button className="w-full sm:w-96">
						View More
					</Button>
				</Link>
			</div>
		</div>
	</div>);
}

