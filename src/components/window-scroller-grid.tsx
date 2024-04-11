import { ReactNode, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useResizeObserver } from 'usehooks-ts';

type WindowScrollerGridProps<D> = {
	rowSize: number,
	colSize: number,
	items: D[],
	children: (data: D) => ReactNode
};

export const WindowScrollerGrid = <D extends any>({ rowSize, colSize, items, children }: WindowScrollerGridProps<D>) => {
	const listRef = useRef<HTMLDivElement | null>(null);

	const { width = 0 } = useResizeObserver({
		ref: listRef
	});

	const itemsPerRow = Math.max(1, Math.floor(width / colSize));
	const rowCount = Math.ceil(items.length / itemsPerRow);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: () => rowSize,
		scrollMargin: listRef.current?.offsetTop ?? 0,
		overscan: 5,
		scrollingDelay: 0
	});

	return (<div ref={listRef} className={width <= 0 ? `invisible` : ''}>
		{width > 0 && <div className="w-full relative" style={{
			height: `${virtualizer.getTotalSize()}px`
		}}>
			{virtualizer.getVirtualItems().map(item => {
				const row = items.slice(item.index * itemsPerRow, (item.index + 1) * itemsPerRow);
				return (<div key={item.key} className="absolute top-0 left-0 max-w-full h-full w-full flex justify-evenly sm:justify-center" style={{
					height: `${rowSize}px`,
					transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`
				}}>
					{row.map((item, i) => (<div key={i} style={{ width: `${colSize}px` }} className="h-full max-w-full">
						{children(item)}
					</div>))}
				</div>);
			})}
		</div>}
	</div>);
};
