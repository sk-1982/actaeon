'use client';

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from '@nextui-org/modal';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonProps, Input } from '@nextui-org/react';
import { SearchIcon } from '@nextui-org/shared-icons';
import { useDebounceCallback } from 'usehooks-ts';
import { useRouter } from 'next/navigation';
import { useWindowListener } from '@/helpers/use-window-listener';
import { useReloaded } from './client-providers';
import { useVirtualizer } from '@tanstack/react-virtual';

type Data<I extends string> = {
	name?: string | null,
} & { [K in I]: any };

export type SelectModalProps<T extends 'grid' | 'list', I extends string, D extends Data<I>> = {
	isOpen: boolean,
	onSelected: (item: D | null | undefined) => void,
	selectedItem: D | null | undefined,
	modalSize?: ModalProps['size'],
	displayMode: T,
	rowSize: number,
	items: D[],
	renderItem: (item: D) => ReactNode,
	gap?: number,
	onSelectionChanged?: (item: D) => void,
	footer?: ReactNode,
	itemId: I
} & (T extends 'grid' ? {
	colSize: number
} : {
	colSize?: never
		});

const SelectModalList = <I extends string, D extends Data<I>>({ onSelectionChanged, setSelected, gap, rowSize, renderItem, items, selected, itemId }:
	Pick<SelectModalProps<'list', I, D>, 'itemId' | 'onSelectionChanged' | 'gap' | 'rowSize' | 'renderItem' | 'items'> & { selected?: D | null, setSelected: (d: D) => void }) => { 
	const listRef = useRef<HTMLDivElement | null>(null);
	const lastHeight = useRef(rowSize);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => listRef.current,
		estimateSize: () => lastHeight.current,
		overscan: 5,
		scrollingDelay: 0,
		measureElement: el => {
			return lastHeight.current = el.clientHeight;
		}
	});

	const buttonStyle = { height: `calc(100% - ${gap ?? 0}px)` };

	return (<div ref={listRef} className="w-full overflow-y-auto overflow-x-hidden">
		<div className="w-full relative" style={{
			height: `${virtualizer.getTotalSize()}px`
		}}>
			{virtualizer.getVirtualItems().map(item => {
				const data = items[item.index];
				const child = renderItem(data);

				return (<div key={item.key} ref={virtualizer.measureElement} data-index={item.index}
					className="flex items-center justify-center absolute top-0 left-0 w-full"
					style={{
						transform: `translateY(${item.start}px)`
					}}>
					<Button
						style={buttonStyle}
						className={`w-full h-fit max-h-full px-0 transition ${data[itemId] === selected?.[itemId] ? 'bg-gray-400/75' : 'bg-transparent'}`}
						variant="flat" onPress={() => { setSelected(data); onSelectionChanged?.(data); }}>
						{child}
					</Button>
				</div>)
			})}
		</div>
	</div>)
};

const SelectModalGrid = <I extends string, D extends Data<I>>({ onSelectionChanged, setSelected, gap, rowSize, renderItem, items, selected, colSize, itemId }:
	Pick<SelectModalProps<'grid', I, D>, 'itemId' | 'onSelectionChanged' | 'gap' | 'rowSize' | 'renderItem' | 'items' | 'colSize'> & { selected?: D | null, setSelected: (d: D) => void; }) => { 
	const listRef = useRef<HTMLDivElement | null>(null);
	const lastHeight = useRef(rowSize);
	const [width, setWidth] = useState(0)

	const itemsPerRow = Math.max(1, Math.floor(width / colSize));
	const rowCount = Math.ceil(items.length / itemsPerRow);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => listRef.current,
		estimateSize: () => lastHeight.current,
		overscan: 5,
		scrollingDelay: 0,
		measureElement: el => {
			return lastHeight.current = el.clientHeight;
		}
	});

	const buttonStyle = {
		maxWidth: `${colSize}px`,
		aspectRatio: `${colSize}/${rowSize}`
	};
	const rowStyle = { gap: `${gap ?? 0}px`, paddingBottom: `${gap ?? 0}px` };

	useEffect(() => setWidth(listRef.current?.clientWidth ?? 0), []);
	useWindowListener('resize', () => setWidth(listRef.current?.clientWidth ?? 0));

	return (<div ref={listRef} className="w-full overflow-y-auto overflow-x-hidden">
		<div className="w-full relative" style={{
			height: `${virtualizer.getTotalSize()}px`
		}}>
			{virtualizer.getVirtualItems().map(item => {
				const row = items.slice(item.index * itemsPerRow, (item.index + 1) * itemsPerRow);
				const children = row.map((item, i) => (<Button key={i} style={buttonStyle}
					className={`w-full px-0 h-full ${selected?.[itemId] === item[itemId] ? 'bg-gray-400/75' : 'bg-transparent'}`} onPress={() => {
						onSelectionChanged?.(item);
						setSelected(item);
					}}>
					{renderItem(item)}
				</Button>));

				return (<div key={item.key} ref={virtualizer.measureElement} data-index={item.index}
					className="absolute top-0 left-0 w-full flex items-center justify-center"
					style={{
						transform: `translateY(${item.start}px)`,
						...rowStyle
					}}>
					{ children }
					{item.index === rowCount - 1 ? [...new Array(itemsPerRow - children.length)].map((_, i) =>
						<div key={i} style={buttonStyle} className="w-full h-full"></div>) : null }
				</div>)
			})}
		</div>
	</div>)
};

const SelectModal = <T extends 'grid' | 'list', I extends string, D extends Data<I>>({ footer, onSelectionChanged, gap, selectedItem, renderItem, displayMode, items, isOpen, onSelected, modalSize, colSize, rowSize, itemId }: SelectModalProps<T, I, D>) => {
	const [selected, setSelected] = useState(selectedItem);
	const [filteredItems, setFilteredItems] = useState(items);
	const outputSelected = useRef<null | undefined | D>(null);

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

	const renderedContent = useMemo(() => {
		if (!isOpen) return null;

		if (displayMode === 'list')
			return <SelectModalList onSelectionChanged={onSelectionChanged} gap={gap} rowSize={rowSize} renderItem={renderItem}
				items={filteredItems} selected={selected} setSelected={setSelected} itemId={itemId} />

		return <SelectModalGrid onSelectionChanged={onSelectionChanged} gap={gap} rowSize={rowSize} renderItem={renderItem}
			items={filteredItems} selected={selected} setSelected={setSelected} colSize={colSize!} itemId={itemId} />
	}, [displayMode, filteredItems, colSize, rowSize, selected, isOpen, gap]);

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

export const SelectModalButton = <T extends 'grid' | 'list', I extends string, D extends Data<I>>(props: Omit<ButtonProps, 'onClick'> &
	Pick<SelectModalProps<T, I, D>, 'itemId' | 'modalSize' | 'displayMode' | 'colSize' | 'rowSize' | 'items' | 'renderItem' | 'selectedItem' | 'onSelected' | 'gap' | 'onSelectionChanged' | 'footer'> &
	{ modalId: string; }) => {
	const router = useRouter();
	const [isOpen, setOpen] = useState(false);
	const { modalId, footer, onSelectionChanged, gap, onSelected, selectedItem, renderItem, items, colSize, rowSize, displayMode, modalSize, itemId } = props;
	const historyPushed = useRef(false);
	const reloaded = useReloaded();

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
			colSize={colSize as any} rowSize={rowSize} items={items} renderItem={renderItem} onSelectionChanged={onSelectionChanged} itemId={itemId}
			onSelected={item => {
				setOpen(false);
				onSelected(item);
				if (document.referrer.includes(location.origin) || historyPushed.current || reloaded) {
					router.back();
				} else {
					router.replace('', { scroll: false });
				}
			}} />
		<Button {...(props as object)} onClick={() => {
			setOpen(true);
			router.push(`#modal-${modalId}`, { scroll: false });
			historyPushed.current = true;
		}} />
	</>);
};
