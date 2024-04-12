'use client';

import 'react-resizable/css/styles.css';
import 'react-grid-layout/css/styles.css';

import GridLayout, { ItemCallback, Layout, calculateUtils } from 'react-grid-layout';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChuniNameplate } from '@/components/chuni/nameplate';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { useWindowListener } from '@/helpers/use-window-listener';
import { UserPayload } from '@/types/user';
import { ChuniUserData } from '@/actions/chuni/profile';
import { ChuniNoProfile } from '@/components/chuni/no-profile';
import { useUser } from '@/helpers/use-user';
import { Button } from '@nextui-org/button';
import { Card, CardBody } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import { DropdownItem, DropdownTrigger, Dropdown, DropdownMenu } from '@nextui-org/dropdown';
import { Tooltip } from '@nextui-org/tooltip';
import { ChuniAvatar } from '@/components/chuni/avatar';
import { Entries, IsEqual } from 'type-fest';
import { ChevronRightIcon, ChevronLeftIcon, DevicePhoneMobileIcon, PencilIcon, SquaresPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SaveIcon } from '@/components/save-icon';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { ServerStatus } from '@/data/status';
import { ActaeonStatus } from '@/components/actaeon-status';
import { setDashboard } from '@/actions/dashboard';
import { TAILWIND_SCREENS } from '@/types/tailwind';

const COLS = {
	xs: 6,
	sm: 7,
	md: 7,
	lg: 9,
	xl: 9,
	'2xl': 11,
	'3xl': 11,
	'4xl': 11,
	'5xl': 13,
	'6xl': 13
} as { [k: string]: number; };

const OVERRIDE_COLS = new Map([
	[COLS.xs, {
		width: 412,
		name: 'Mobile',
		breakpoint: 0
	}],
	[COLS.sm, {
		width: 768,
		name: 'Small',
		breakpoint: parseInt(TAILWIND_SCREENS.sm)
	}],
	[COLS.lg, {
		width: 1280,
		name: 'Medium',
		breakpoint: parseInt(TAILWIND_SCREENS.lg)
	}],
	[COLS['2xl'], {
		width: 1920,
		name: 'Large',
		breakpoint: parseInt(TAILWIND_SCREENS['2xl'])
	}],
	[COLS['5xl'], {
		width: 2160,
		name: 'Extra Large',
		breakpoint: parseInt(TAILWIND_SCREENS['5xl'])
	}]
]);

type Item<D> = {
	aspect?: [number, number],
	render: IsEqual<D, undefined> extends true ? (() => ReactNode) : ((data: D) => ReactNode),
	available?: (user: UserPayload | null | undefined) => boolean,
	minH?: number,
	name: string
};

type ItemData = {
	'chuni-nameplate': ChuniUserData,
	'chuni-avatar': ChuniUserData,
	'actaeon-status': ServerStatus
};

const NO_CHUNI_PROFILE = <Card className="w-full h-full"><CardBody><ChuniNoProfile /></CardBody></Card>;

const ITEMS: { [K in keyof ItemData]: Item<ItemData[K]> } = {
	'chuni-nameplate': {
		aspect: [576, 228],
		render: d => d ? (<ChuniNameplate profile={d} className="h-full" />) : NO_CHUNI_PROFILE,
		available: u => !!u?.chuni,
		name: 'Chunithm Nameplate'
	},
	'chuni-avatar': {
		aspect: [544, 588],
		render: d => d ? (<ChuniAvatar className="h-full"
			wear={d.avatarWearTexture}
			head={d.avatarHeadTexture}
			face={d.avatarFaceTexture}
			skin={d.avatarSkinTexture}
			item={d.avatarItemTexture}
			back={d.avatarBackTexture}
		/>) : NO_CHUNI_PROFILE,
		available: u => !!u?.chuni,
		name: 'Chunithm Avatar'
	},
	'actaeon-status': {
		render: s => (<ActaeonStatus status={s} className="w-full h-full" />),
		minH: 225,
		name: 'Actaeon Status'
	}
};


type Layouts = { [k: string]: Layout[]; }

const centerX = ({ w, col }: { w: number, col: number; }) => Math.floor((col - w) / 2);

const getDefaultLayout = (user: UserPayload | undefined | null) => {
	return Object.fromEntries(Object.values(COLS).map(col => {
		const getXW = (w: number) => ({ w, x: centerX({ w, col }) });

		const layouts: (Layout | null | undefined | false)[] = [
			{ i: 'actaeon-status', y: 0, h: 1, ...getXW({
				[6]: 6,
				[7]: 5,
				[9]: 3,
				[11]: 3,
				[13]: 3
			}[col]!) },
			ITEMS['chuni-nameplate'].available?.(user) && {
				i: 'chuni-nameplate', y: 1, h: 1, ...getXW({
					[6]: 6,
					[7]: 5,
					[9]: 5,
					[11]: 5,
					[13]: 3
				}[col]!) }
		];

		return [col, layouts.filter(x => x) as Layout[]];
	}))
};

const applyLayoutProps = (layouts: Layouts): Layouts => Object.fromEntries(Object.entries(layouts)
	.map(([k, layout]) => [k, layout.map(l => {
		const minH = (ITEMS as any)[l.i]?.minH;
		if (minH) return ({ ...l, h: Math.max(l.h, minH), minH });
		return l;
	})]));

const serializeLayout = (layouts: Layouts) => {
	const data = Object.fromEntries(Object.entries(layouts)
		.map(([key, layout]) => {
			let lastY = 0;
			let yIndex = 0;

			return [key, [...layout]
				.sort((a, b) => a.y - b.y)
				.map(({ x, y, w, h, i}) => {
					if (y !== lastY) {
						lastY = y;
						yIndex++;
					}
					return { y: yIndex, x, w, i, h: ITEMS[i as keyof ItemData].aspect ? 1 : h };
				})];
		}));
	return JSON.stringify(data);
};

type DashboardProps = {
	chuniProfile?: ChuniUserData,
	serverStatus: ServerStatus,
	dashboard?: any
};

export const Dashboard = ({ chuniProfile, serverStatus, dashboard: initialDashboard }: DashboardProps) => {
	const user = useUser();
	const [layouts, setLayouts] = useState<Layouts>(applyLayoutProps(initialDashboard ?? getDefaultLayout(user)));
	const layoutRestore = useRef(structuredClone(layouts));
	const [width, setWidth] = useState(0);
	const [resizingWindow, setResizingWindow] = useState(true);
	const [mounted, setMounted] = useState(false);
	const [overrideCol, setOverrideCol] = useState<null | number>(null);
	const [overrideWidth, setOverrideWidth] = useState<null | number>(null);
	const [editing, setEditing] = useState(false);
	const lastTimeout = useRef<number | undefined>(undefined);
	const containerRef = useRef<HTMLElement | null>(null);
	const breakpoint = useBreakpoint();
	const trueCol = COLS[breakpoint ?? 'xs'];
	const col = overrideCol ?? trueCol;

	const margin = col === COLS.xs ? [0, 10] : [10, 10];
	const marginClass = col === COLS.xs ? 'py-[5px]' : 'p-[5px]';

	const displayWidth = Math.min(overrideWidth ?? width, width);

	const reflowItemAspect = useCallback((keepWidth: boolean, ...items: GridLayout.Layout[]) => { 
		if (!displayWidth) return items;

		const colWidth = calculateUtils.calcGridColWidth({
			margin: [0, 0],
			containerPadding: [0, 0],
			cols: col,
			containerWidth: displayWidth
		});

		items.forEach(layoutItem => {
			const itemAspect = ITEMS[layoutItem.i as keyof typeof ITEMS]?.aspect;
			if (!itemAspect) return;
			const aspect = (itemAspect[0]) / (itemAspect[1]);

			if (keepWidth) {
				layoutItem.h = Math.max(Math.round((layoutItem.w * colWidth + margin[0]) / aspect + margin[1]), 1);
				return;
			}

			layoutItem.w = Math.min(Math.max(Math.round((layoutItem.h * aspect + margin[0]) / colWidth), 1), col);
			const itemWidth = colWidth * layoutItem.w;
			layoutItem.h = Math.max(Math.round(itemWidth / aspect + margin[1]), 1);

		});
		return items;
	}, [displayWidth, col, margin[0], margin[1]]);

	const handleResize = useCallback(((l, oldLayoutItem, layoutItem, placeholder) => {
		reflowItemAspect(oldLayoutItem.w !== layoutItem.w, layoutItem, placeholder);
	}) as ItemCallback, [reflowItemAspect]);

	useEffect(() => {
		setLayouts(l => ({ ...l, [col]: reflowItemAspect(true, ...l[col].map(i => ({ ...i }))) }));
	}, [reflowItemAspect, setLayouts, col]);

	useWindowListener('resize', () => {
		setWidth(containerRef.current?.clientWidth!);
		setResizingWindow(true);
		clearTimeout(lastTimeout.current);
		lastTimeout.current = setTimeout(() => {
			setResizingWindow(false);
		}, 100) as any as number;
	});

	useEffect(() => { 
		setWidth(containerRef.current?.clientWidth!);
		setMounted(true);
		const timeout = setTimeout(() => setResizingWindow(false), 100);
		return () => clearTimeout(timeout);
	}, []);

	const children = useMemo(() => {
		return layouts[col.toString()].map(layout => {
			let rendered: ReactNode = null;
			const item = ITEMS[layout.i as keyof typeof ITEMS];
			if (!item) return null;

			if (layout.i === 'chuni-nameplate')
				rendered = ITEMS['chuni-nameplate'].render(chuniProfile);
			else if (layout.i === 'chuni-avatar')
				rendered = ITEMS['chuni-avatar'].render(chuniProfile);
			else if (layout.i === 'actaeon-status')
				rendered = ITEMS['actaeon-status'].render(serverStatus);

			if (rendered === null) return null;

			return (<div key={layout.i} className={`${marginClass} ${editing ? 'bg-gray-500/25 select-none' : ''} ${resizingWindow ? '!transition-none' : ''}`}>
				<div className={`w-full max-h-full ${item.aspect ? '' : 'h-full'}`}
					style={item.aspect ? { aspectRatio: `${item.aspect[0]} / ${item.aspect[1]}` } : undefined}>
					{rendered}
				</div>
			</div>);
		});
	}, [layouts, col, marginClass, editing, resizingWindow, chuniProfile, serverStatus]);

	const headerButtons = useMemo(() => {
		if (!editing)
			return (<Tooltip content="Edit layout">
				<Button isIconOnly radius="full" variant="light" onPress={() => {
					layoutRestore.current = structuredClone(layouts);
					setEditing(true);
				}}>
					<PencilIcon className="h-1/2" />
				</Button>
			</Tooltip>);
		
		const usedItems = new Set(Object.values(layouts).flatMap(l => l.map(item => item.i)) as (keyof ItemData)[]);

		const addItem = (item: keyof ItemData) => { 
			setLayouts(layouts => Object.fromEntries(Object.entries(layouts).map(([key, items]) => {
				const maxY = Math.max(...items.map(i => i.y), -1);
				return [key, [...items, ...reflowItemAspect(true, { x: 0, y: maxY + 1, h: 1, w: 1, i: item })]];
			})));
		};

		const removeItem = (item: keyof ItemData) => {
			setLayouts(layouts => Object.fromEntries(Object.entries(layouts)
				.map(([key, items]) => [key, items.filter(i => i.i !== item)])))
		};

		const availablePreviews = [...OVERRIDE_COLS].filter(([col]) => col < trueCol);
		const previewItems = [
			(<DropdownItem key="none" onPress={() => { setOverrideCol(null); setOverrideWidth(null); }}>
				None
			</DropdownItem>),
			...availablePreviews.map(([col, { name, width }]) =>
			(<DropdownItem key={col.toString()} onPress={() => {
				setOverrideCol(col);
				setOverrideWidth(width);
			}}>
					{name}
				</DropdownItem>)
			)
		];
		
		return (<>
			{(!!availablePreviews.length || overrideCol !== null) && <Dropdown>
				<Tooltip content="Preview Device">
					<div>
						<DropdownTrigger>
							<Button isIconOnly radius="full">
								<DevicePhoneMobileIcon className="h-1/2" />
							</Button>
						</DropdownTrigger>
					</div>
				</Tooltip>
				<DropdownMenu selectedKeys={overrideCol ? new Set([overrideCol.toString()]) : new Set(['none'])} selectionMode="single">
					{previewItems}
				</DropdownMenu>
			</Dropdown>}

			<Dropdown>
				<Tooltip content="Modify Items">
					<div>
						<DropdownTrigger>
							<Button isIconOnly radius="full">
								<SquaresPlusIcon className="h-1/2" />
							</Button>
						</DropdownTrigger>
					</div>
				</Tooltip>
				<DropdownMenu selectionMode="multiple" selectedKeys={usedItems}>
					{(Object.entries(ITEMS) as Entries<typeof ITEMS>)
						.filter(([k, i]) => i.available ? i.available(user) : true)
						.map(([key, item]) => (<DropdownItem key={key}
						onPress={() => usedItems.has(key) ? removeItem(key) : addItem(key)}>
						{item.name}
					</DropdownItem>))}
				</DropdownMenu>
			</Dropdown>

			<Tooltip content="Discard Changes">
				<Button isIconOnly radius="full" variant="light" color="danger" className="ml-3"
					onPress={() => {
						setOverrideCol(null);
						setOverrideWidth(null);
						setEditing(false);
						setLayouts(Object.fromEntries(Object.entries(layoutRestore.current).map(([k, v]) => [
							k, reflowItemAspect(true, ...v.map(i => ({ ...i })))
						])));
					}}>
					<XMarkIcon className="h-1/2" />
				</Button>
			</Tooltip>
			<Tooltip content="Save">
				<Button isIconOnly radius="full" color="primary" onPress={() => {
					setOverrideCol(null);
					setOverrideWidth(null);
					setEditing(false);
					setDashboard(serializeLayout(layouts));
				}}>
					<SaveIcon className="h-1/2" />
				</Button>
			</Tooltip>
		</>);
	}, [trueCol, overrideCol, editing, setEditing, setLayouts, layouts, reflowItemAspect, user, layoutRestore]);

	const handle = (<div className="h-full py-2 px-3 w-px cursor-pointer relative">
		<Divider orientation="vertical" />
		<div className="absolute flex top-1/2 left-0.5">
			<ChevronRightIcon className="w-3 -mr-1 text-gray-400" />
			<ChevronLeftIcon className="w-3 text-gray-400" />
		</div>
	</div>);

	const handlePreviewResize = (_: any, data: ResizeCallbackData) => {
		const newWidth = width - 2 * data.size.width;
		if (newWidth < 320) return;
		const [col] = [...OVERRIDE_COLS].findLast(([col, { breakpoint }]) => newWidth >= breakpoint)!;
		setOverrideCol(col);
		setOverrideWidth(newWidth);
	};

	const showResize = mounted && (overrideCol !== null || overrideWidth !== null);

	return (<main className="flex w-full h-full">
		{showResize && <Resizable width={(width - displayWidth) / 2} axis="x"
				resizeHandles={['e']}
				handle={handle}
				onResizeStart={() => setResizingWindow(true)}
				onResizeStop={() => setResizingWindow(false)}
				onResize={handlePreviewResize}>
			<div className={`flex-grow flex justify-end bg-gray-400/25 h-full w-2 sm:-ml-5 ${overrideCol === COLS.xs ? '' : 'sm:mr-5'}`} />
		</Resizable>}
		<section className={`pb-4 overflow-hidden h-full w-full flex-shrink-0 ${mounted ? '' : 'opacity-0'}`} ref={containerRef}
			style={overrideCol ? { maxWidth: `${displayWidth}px` } : undefined}>
			<header className="px-4 font-semibold text-2xl h-12 mb-2 flex items-center gap-1.5">
				<span className="mr-auto">Dashboard</span>
				{headerButtons}
			</header>
			<Divider className="mb-2" />
			<GridLayout className="relative"
				containerPadding={[0, 0]}
				margin={[0, 0]}
				cols={col}
				rowHeight={1}
				width={displayWidth}
				layout={[...layouts[col.toString()]].map(l => ({ ...l }))}
				isDraggable={editing}
				isResizable={editing}
				onResize={handleResize}
				onLayoutChange={l => setLayouts(lay => ({ ...lay, [col]: l }))}>
				{children}
			</GridLayout>

		</section>
		{showResize && <Resizable width={(width - displayWidth) / 2} axis="x"
			resizeHandles={['w']}
			handle={handle}
			onResizeStart={() => setResizingWindow(true)}
			onResizeStop={() => setResizingWindow(false)}
			onResize={handlePreviewResize}>
			<div className={`flex-grow bg-gray-400/25 h-full sm:-mr-5 ${overrideCol === COLS.xs ? '' : 'sm:ml-5'}`} />
		</Resizable>}
	</main>)
};
