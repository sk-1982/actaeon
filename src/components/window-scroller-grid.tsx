import { ReactNode, useEffect, useRef } from 'react';
import { AutoSizer, List, WindowScroller } from 'react-virtualized';

type WindowScrollerGridProps<D> = {
	rowSize: number,
	colSize: number,
	items: D[],
	children: (data: D) => ReactNode
};

export const WindowScrollerGrid = <D extends any>({ rowSize, colSize, items, children }: WindowScrollerGridProps<D>) => {
	const listRef = useRef<List | null>(null);

	useEffect(() => {
		listRef.current?.recomputeRowHeights(0);
	}, [rowSize, colSize, items]);

	return (<WindowScroller>{({ height, isScrolling, onChildScroll, scrollTop }) =>
		(<AutoSizer disableHeight>
			{({ width }) => {
				const itemsPerRow = Math.max(1, Math.floor(width / colSize));
				const rowCount = Math.ceil(items.length / itemsPerRow);

				return (<List ref={listRef} autoHeight isScrolling={isScrolling} onScroll={onChildScroll} scrollTop={scrollTop}
					rowCount={rowCount} height={height} rowHeight={rowSize} width={width} rowRenderer={({ index, key, style }) =>
					(<div key={key} style={{ ...style, height: `${rowSize}px` }} className="max-w-full h-full w-full flex justify-center">
						{items.slice(index * itemsPerRow, (index + 1) * itemsPerRow).map((item, i) => (<div key={i} style={{ width: `${colSize}px` }} className="h-full max-w-full">
							{children(item)}
						</div>))}
					</div>)
				} />)
			}}
		</AutoSizer>)
	}</WindowScroller>)
};
