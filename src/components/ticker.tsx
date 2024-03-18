'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';
import './ticker.scss';

export type TickerProps = {
	children?: ReactNode,
	hoverOnly?: boolean,
	className?: string,
	noDelay?: boolean
}

const TickerHoverContext = createContext<boolean | null>(null);

type TickerHoverProviderProps = {
	children: (setHover: (hovering: boolean) => void) => ReactNode
};

export const TickerHoverProvider = ({ children }: TickerHoverProviderProps) => {
	const [hovering, setHovering] = useState(false);

	return <TickerHoverContext.Provider value={hovering}>
		{ children(setHovering) }
	</TickerHoverContext.Provider>;
};


export const Ticker = ({ children, hoverOnly, className, noDelay }: TickerProps) => {
	const outerAnimation = noDelay ? 'animate-[outer-overflow-nodelay_10s_linear_infinite_alternate]' : 'animate-[outer-overflow_10s_linear_infinite_alternate]';
	const innerAnimation = noDelay ? 'animate-[inner-overflow-nodelay_10s_linear_infinite_alternate]' : 'animate-[inner-overflow_10s_linear_infinite_alternate]';
	const hoverContext = useContext(TickerHoverContext);
	const [textHovering, setTextHovering] = useState(false);
	const hovering = (hoverContext !== null && hoverContext) || textHovering;

	const hoverClass = (!hoverOnly && hovering) ? '[&_*]:[animation-play-state:paused]' : '';

	if (hoverOnly && !hovering)
		return (<div className={`text-nowrap whitespace-nowrap overflow-hidden w-full ${className ?? ''}`}
			onMouseEnter={() => setTextHovering(true)}>
			{ children }
		</div>);

	return (<div className={`text-nowrap whitespace-nowrap overflow-hidden w-full ${hoverClass} ${className ?? ''}`}
		onMouseLeave={() => setTextHovering(false)}
		onMouseEnter={() => setTextHovering(true)}>
		<div className={`${outerAnimation} ticker max-w-full inline-block`}>
			<div className={`${innerAnimation} ticker inline-block`}>
				{ children }
			</div>
		</div>
	</div>)
};
