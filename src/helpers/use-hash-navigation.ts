import { useWindowListener } from '@/helpers/use-window-listener';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type UseHashNavigationOptions = {
	onClose: () => void,
	isOpen: boolean,
	hash: string
};

export const useHashNavigation = (options: UseHashNavigationOptions) => {
	const router = useRouter();

	useWindowListener('hashchange', () => {
		if (window.location.hash !== options.hash && options.isOpen)
			options.onClose();
		else if (window.location.hash === options.hash && !options.isOpen)
			router.replace('', { scroll: false });
	}, [options.isOpen, options.hash])

	useEffect(() => {
		if (window.location.hash === options.hash) {
			options.onClose();
			router.replace('', { scroll: false });
		}
	}, [options.hash]);

	useEffect(() => {
		if (options.isOpen)
			router.push(options.hash, { scroll: false });
	}, [options.isOpen, options.hash]);

	return () => {
		router.back();
		options.onClose();
	};
};
