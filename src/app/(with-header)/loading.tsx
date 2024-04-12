import { Spinner } from '@nextui-org/spinner';

export default function Loading() {
	return (<div className="w-full h-full flex flex-grow items-center justify-center">
		<Spinner size="lg" />
	</div>);
}
