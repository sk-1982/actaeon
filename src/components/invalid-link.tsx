import { TfiUnlink } from 'react-icons/tfi';

export const InvalidLink = () => {
	return (<main className="flex flex-col w-full m-auto items-center gap-4 pb-10 text-center">
		<TfiUnlink  className="w-48 h-48 mb-10" />
		<header className="text-2xl font-semibold">The link you requested is invalid.</header>
		<span>It may have expired, or you may have entered it incorrectly.</span>
	</main>);
};
