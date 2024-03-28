import { ErrorPageNavButtons } from '@/components/error-page-nav-buttons';
import { NoSymbolIcon } from '@heroicons/react/24/outline';

export default function ForbiddenPage() {
	return (<main className="flex flex-col w-full h-full justify-center items-center gap-4 text-center">
		<NoSymbolIcon className="w-48 mb-10" />
		<header className="text-2xl font-semibold mb-5">
			You do not have permissions to do that.
		</header>
		<section className="flex gap-2">
			<ErrorPageNavButtons />
		</section>
	</main>);
}