'use client';

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from '@nextui-org/modal';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonProps, Input } from '@nextui-org/react';
import { SearchIcon } from '@nextui-org/shared-icons';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import { useDebounceCallback } from 'usehooks-ts';
import { CellMeasurerChildProps } from 'react-virtualized/dist/es/CellMeasurer';



export type SelectModalProps<T extends 'grid' | 'list', D extends { name?: string | null }> = {
	isOpen: boolean,
	onSelected: (item: D | null | undefined) => void,
	selectedItem: D | null | undefined,
	modalSize?: ModalProps['size'],
	displayMode: T,
	rowSize: number,
	items: D[],
	renderItem: (item: D) => (ReactNode | ((props: Pick<CellMeasurerChildProps, 'measure'>) => ReactNode)),
	gap?: number
} & (T extends 'grid' ? {
	colSize: number
} : {
	colSize?: never
});

const SelectModal = <T extends 'grid' | 'list', D extends { name?: string | null }>({ gap, selectedItem, renderItem, displayMode, items, isOpen, onSelected, modalSize, colSize, rowSize }: SelectModalProps<T, D>) => {
	const measurementCache = useMemo(() => {
		return new CellMeasurerCache({
			defaultHeight: rowSize,
			fixedWidth: true,
			minHeight: Math.ceil(rowSize / 3),
			keyMapper: () => window.innerWidth
		});
	}, [rowSize]);

	const listRef = useRef<List | null>(null);
	const [selected, setSelected] = useState(selectedItem);
	const [filteredItems, setFilteredItems] = useState(items);
	const [gridRowCount, setGridRowCount] = useState(0);

	useEffect(() => {
		// reset filtered and displayed selected item on open
		if (isOpen) {
			setSelected(selectedItem);
			setFilteredItems(items);
		}
	}, [isOpen]);

	const filter = useDebounceCallback((query: string) => {
		const lowerQuery = query.toLowerCase();
		setFilteredItems(items.filter(({ name }) => name?.toLowerCase().includes(lowerQuery)));
	}, 100);

	const recompute = useDebounceCallback(() => {
		listRef.current?.recomputeRowHeights();
	}, 150);

	useEffect(() => {
		if (!isOpen) return;

		let prevWidth = -1;
		const cb = () => {
			if (prevWidth !== window.innerWidth) {
				prevWidth = window.innerWidth;
				recompute();
			}
		};
		window.addEventListener('resize', cb);

		return () => {
			window.removeEventListener('resize', cb);
		};
	}, [isOpen, recompute]);

	const containerStyle = { pointerEvents: 'auto' } as const;

	const renderedContent = useMemo(() => {
		if (!isOpen) return null;

		if (displayMode === 'list') {
			const buttonStyle = { height: `calc(100% - ${gap ?? 0}px)` };

			return (<div style={{ flexBasis: `${filteredItems.length * rowSize}px` }}>
				<AutoSizer>
					{({ height, width }) => (<List containerStyle={containerStyle}
						deferredMeasurementCache={measurementCache}
						rowCount={filteredItems.length}
						height={height}
						width={width}
						rowHeight={measurementCache.rowHeight}
						ref={listRef}
						rowRenderer={({ key, index, style, parent }) => {
							const child = renderItem(filteredItems[index]);

							return (<CellMeasurer cache={measurementCache} parent={parent} columnIndex={0} rowIndex={index} key={key}>
								{({ measure, registerChild }) => {
									return (<div ref={registerChild as any} style={style} className="flex items-center justify-center">
										<Button
											style={buttonStyle}
											className={`w-full h-fit max-h-full px-0 transition ${filteredItems[index] === selected ? 'bg-gray-400/75' : 'bg-transparent'}`}
											variant="flat" onPress={() => setSelected(filteredItems[index])}>
											{typeof child === 'function' ? child({ measure }) : child}
										</Button>
									</div>)
								}}
							</CellMeasurer>);
						}}
					/>)}
				</AutoSizer>
			</div>);
		}

		const buttonStyle = { maxWidth: `${colSize}px`,
			aspectRatio: `${colSize}/${rowSize}`,
			height: `calc(100% - ${gap ?? 0}px)` };
		const rowStyle = { gap: `${gap ?? 0}px` };

		return (<AutoSizer disableHeight className="flex flex-1 max-h-full overflow-hidden" style={{ flexBasis: `${gridRowCount * rowSize}px` }}>
			{(({ width }) => {
				const itemsPerRow = Math.max(1, Math.floor(width / colSize!));
				const rowCount = Math.ceil(filteredItems.length / itemsPerRow);
				setGridRowCount(rowCount);

				return (<div style={{ flexBasis: `${rowCount * rowSize}px` }}>
					<AutoSizer disableWidth>
						{({ height }) => (<List ref={listRef}
							containerStyle={containerStyle}
							deferredMeasurementCache={measurementCache}
							rowCount={rowCount}
							height={height}
							width={width}
							rowHeight={measurementCache.rowHeight}
							rowRenderer={({ key, index, style, parent }) => (<CellMeasurer cache={measurementCache} parent={parent} columnIndex={0} rowIndex={index} key={key}>
								{({ measure, registerChild }) => {
									const children = filteredItems.slice(index * itemsPerRow, (index + 1) * itemsPerRow)
										.map((item, i) => {
											const res = renderItem(item);

											return (<Button key={i} style={buttonStyle} className={`w-full px-0 ${selected === item ? 'bg-gray-400/75' : 'bg-transparent'}`}
												onPress={() => setSelected(item)}>
												{ typeof res === 'function' ? res({ measure }) : res }
											</Button>)
										});

									return <div style={{...style, ...rowStyle}} className="w-full h-full flex items-center justify-center" ref={registerChild as any}>
										{children}
									</div>;
								}}
							</CellMeasurer>)} />)}
					</AutoSizer>
				</div>);
			})}
		</AutoSizer>)
	}, [displayMode, filteredItems, colSize, rowSize, selected, isOpen, gridRowCount, gap]);

	return (<Modal size={modalSize} onClose={() => {
		onSelected(selected);
	}} isOpen={isOpen}
		className={`!rounded-2xl !max-h-[90dvh] sm:!max-h-[85dvh] ${modalSize === 'full' ? 'md:max-w-[90dvw]' : ''}`}>
		<ModalContent className="flex flex-1 max-h-full">
			{onModalClose => <>
				<ModalHeader>Select Item</ModalHeader>
				<ModalBody className="flex max-h-full overflow-hidden">
					<Input type="text" label="Search" size="sm" startContent={<SearchIcon />} isClearable onValueChange={filter}
						onClear={() => setFilteredItems(items)} />
					{renderedContent}
				</ModalBody>
				<ModalFooter>
					<Button variant="light" color="danger" onClick={() => {
						setSelected(null);
						onModalClose()
					}}>Cancel</Button>
					<Button variant="solid" color="primary" onClick={onModalClose}>Select</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
};

export type SelectModalButtonProps<T extends 'grid' | 'list', D extends { name?: string | null }> = Omit<ButtonProps, 'onClick'> &
	Pick<SelectModalProps<T, D>, 'modalSize' | 'displayMode' | 'colSize' | 'rowSize' | 'items' | 'renderItem' | 'selectedItem' | 'onSelected' | 'gap'>
export const SelectModalButton = <T extends 'grid' | 'list', D extends { name?: string | null }>(props: SelectModalButtonProps<T, D>) => {
	const [isOpen, setOpen] = useState(false);
	const { gap, onSelected, selectedItem, renderItem, items, colSize, rowSize, displayMode, modalSize } = props;

	return (<>
		<SelectModal displayMode={displayMode} modalSize={modalSize} isOpen={isOpen} selectedItem={selectedItem} gap={gap}
			colSize={colSize as any} rowSize={rowSize} items={items} renderItem={renderItem}
			onSelected={item => {
				setOpen(false);
				onSelected(item);
			}} />
		<Button {...(props as object)} onClick={() => setOpen(true)} />
	</>);
};
