'use client';

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from '@nextui-org/modal';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonProps, Input } from '@nextui-org/react';
import { SearchIcon } from '@nextui-org/shared-icons';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import { useDebounceCallback } from 'usehooks-ts';
import { CellMeasurerChildProps } from 'react-virtualized/dist/es/CellMeasurer';
import { useRouter } from 'next/navigation';
import { useWindowListener } from '@/helpers/use-window-listener';



export type SelectModalProps<T extends 'grid' | 'list', D extends { name?: string | null }> = {
	isOpen: boolean,
	onSelected: (item: D | null | undefined) => void,
	selectedItem: D | null | undefined,
	modalSize?: ModalProps['size'],
	displayMode: T,
	rowSize: number,
	items: D[],
	renderItem: (item: D) => (ReactNode | ((props: Pick<CellMeasurerChildProps, 'measure'>) => ReactNode)),
	gap?: number,
	onSelectionChanged?: (item: D) => void,
	footer?: ReactNode
} & (T extends 'grid' ? {
	colSize: number
} : {
	colSize?: never
});

const SelectModal = <T extends 'grid' | 'list', D extends { name?: string | null }>({ footer, onSelectionChanged, gap, selectedItem, renderItem, displayMode, items, isOpen, onSelected, modalSize, colSize, rowSize }: SelectModalProps<T, D>) => {
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
	const outputSelected = useRef<null | undefined | D>(null);

	useEffect(() => {
		// reset filtered and displayed selected item on open
		if (isOpen) {
			setSelected(selectedItem);
			setFilteredItems(items);
		}
	}, [isOpen]);

	useEffect(() => {
		listRef.current?.recomputeRowHeights();
	}, [colSize, rowSize]);

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
											variant="flat" onPress={() => { setSelected(filteredItems[index]); onSelectionChanged?.(filteredItems[index]) }}>
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
				setTimeout(() => setGridRowCount(rowCount));

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
												onPress={() => { setSelected(item); onSelectionChanged?.(item) }}>
												{ typeof res === 'function' ? res({ measure }) : res }
											</Button>)
										});

									return <div style={{...style, ...rowStyle}} className="w-full h-full flex items-center justify-center" ref={registerChild as any}>
										{children}
										{ index === rowCount - 1 ? [...new Array(itemsPerRow - children.length)].map((_, i) =>
											<div key={i} style={buttonStyle} className="w-full"></div>) : null }
									</div>;
								}}
							</CellMeasurer>)} />)}
					</AutoSizer>
				</div>);
			})}
		</AutoSizer>)
	}, [displayMode, filteredItems, colSize, rowSize, selected, isOpen, gridRowCount, gap, onSelectionChanged]);

	return (<Modal classNames={{ wrapper: 'overflow-hidden' }} size={modalSize} onClose={() => {
		onSelected(outputSelected.current);
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
				<ModalFooter className="items-center flex-wrap gap-2">
					{ footer }
					<div className="flex gap-1">
						<Button variant="light" color="danger" onClick={() => {
							setSelected(null);
							outputSelected.current = null;
							onModalClose();
						}}>Cancel</Button>
						<Button variant="solid" color="primary" onClick={() => {
							outputSelected.current = selected;
							onModalClose();
						}}>Select</Button>
					</div>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
};

export type SelectModalButtonProps<T extends 'grid' | 'list', D extends { name?: string | null }> = Omit<ButtonProps, 'onClick'> &
	Pick<SelectModalProps<T, D>, 'modalSize' | 'displayMode' | 'colSize' | 'rowSize' | 'items' | 'renderItem' | 'selectedItem' | 'onSelected' | 'gap' | 'onSelectionChanged' | 'footer'> &
	{ modalId: string };
export const SelectModalButton = <T extends 'grid' | 'list', D extends { name?: string | null }>(props: SelectModalButtonProps<T, D>) => {
	const router = useRouter();
	const [isOpen, setOpen] = useState(false);
	const { modalId, footer, onSelectionChanged, gap, onSelected, selectedItem, renderItem, items, colSize, rowSize, displayMode, modalSize } = props;

	useWindowListener('hashchange', () => {
		if (window.location.hash !== `#modal-${modalId}` && isOpen) {
			setOpen(false);
			onSelected(null);
		}
	}, [isOpen, modalId]);

	useEffect(() => {
		if (window.location.hash === `#modal-${modalId}`)
			setOpen(true);
	}, []);

	return (<>
		<SelectModal displayMode={displayMode} modalSize={modalSize} isOpen={isOpen} selectedItem={selectedItem} gap={gap} footer={footer}
			colSize={colSize as any} rowSize={rowSize} items={items} renderItem={renderItem} onSelectionChanged={onSelectionChanged}
			onSelected={item => {
				setOpen(false);
				onSelected(item);
				router.back();
			}} />
		<Button {...(props as object)} onClick={() => {
			setOpen(true);
			router.push(`#modal-${modalId}`,{ scroll: false });
		}} />
	</>);
};
