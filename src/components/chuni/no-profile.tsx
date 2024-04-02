import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { ChuniPenguinIcon } from './chuni-penguin-icon';

export const ChuniNoProfile = () => {
	return (<section className="w-full h-full flex flex-col items-center justify-center gap-3">
		<div className="w-1/2 max-w-72 aspect-square relative">
			<div className="absolute inset-0 w-full h-full flex items-center justify-center">
				<ChuniPenguinIcon className="h-[70%]" />
			</div>
			<NoSymbolIcon className="w-full h-full" />
		</div>
		<header className="mb-8">You don&apos;t have a Chunithm profile.</header>
	</section>)
};
