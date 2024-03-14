import { ReactNode } from 'react';
import './ticker.scss';

export type TickerProps = {
	children?: ReactNode,
	hoverOnly?: boolean,
	className?: string,
	noDelay?: boolean
}

export const Ticker = ({ children, hoverOnly, className, noDelay }: TickerProps) => {
	const hoverClass = hoverOnly ? '[&:hover_*]:[animation-play-state:running] [&_*]:[animation-play-state:paused]' : '[&:hover_*]:[animation-play-state:paused]';
	const outerAnimation = noDelay ? 'animate-[outer-overflow-nodelay_15s_linear_infinite_alternate]' : 'animate-[outer-overflow_15s_linear_infinite_alternate]';
	const innerAnimation = noDelay ? 'animate-[inner-overflow-nodelay_15s_linear_infinite_alternate]' : 'animate-[inner-overflow_15s_linear_infinite_alternate]';

	return (<div className={`text-nowrap whitespace-nowrap overflow-hidden w-full ${hoverClass} ${className ?? ''}`}>
		<div className={`${outerAnimation} ticker max-w-full inline-block`}>
			<div className={`${innerAnimation} ticker inline-block`}>
				{ children }
			</div>
		</div>
	</div>)
};
