import { useEffect } from 'react';

export const useWindowListener = <K extends keyof WindowEventMap>(event: K,
                                                           listener: (this: Window, ev: WindowEventMap[K]) => any,
																													 deps: any[] = [],
                                                           options?: boolean | AddEventListenerOptions) => {
	useEffect(() => {
		window.addEventListener(event, listener, options);
		return () => window.removeEventListener(event, listener, options);
	}, [event, listener, options, ...deps]);
};
