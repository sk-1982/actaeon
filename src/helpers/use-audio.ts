'use client';

import { RefObject, useCallback, useEffect, useRef } from 'react';

type UseAudioEvents = Partial<{
	readonly [K in keyof HTMLMediaElementEventMap]: ((this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any) |
		[(this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any,
			options?: boolean | AddEventListenerOptions]
}>;

type UseAudioCallback = (audio: HTMLAudioElement) => any;

type UseAudio = {
	(src: string, events: UseAudioEvents, cb?: UseAudioCallback): RefObject<HTMLAudioElement | null>,
	(events: UseAudioEvents, cb?: UseAudioCallback): RefObject<HTMLAudioElement | null>
};

export const useAudio: UseAudio = (srcOrEvents, eventsOrCb, cb?) => {
	const src = typeof srcOrEvents === 'string' ? srcOrEvents : undefined;
	const events = typeof eventsOrCb === 'object' ? eventsOrCb : (srcOrEvents as UseAudioEvents);
	const callback = useCallback(typeof cb === 'function' ? cb : eventsOrCb as UseAudioCallback, []);

	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (!audioRef.current)
			audioRef.current = new Audio(src);
		const audio = audioRef.current;

		if (audio.src !== src && src) audio.src = src;

		Object.entries(events).forEach(([name, listener]) => {
			if (typeof listener === 'function')
				audio.addEventListener(name, listener as any);
			else
				audio.addEventListener(name, ...(listener as [any, any]));
		});

		return () => {
			Object.entries(events).forEach(([name, listener]) => {
				if (typeof listener === 'function')
					audio.removeEventListener(name, listener as any);
				else
					audio.removeEventListener(name, ...(listener as [any, any]));
			});
			audio.pause();
		}
	}, [src]);

	useEffect(() => {
		if (callback && audioRef.current) callback(audioRef.current);
	}, [callback]);

	return audioRef;
};
