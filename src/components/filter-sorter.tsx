'use client';

import { Accordion, AccordionItem, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Pagination, Select, SelectItem, Slider, Spinner, Switch, Tooltip } from '@nextui-org/react';
import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Awaitable } from '@auth/core/types';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { ArrowLongUpIcon } from '@heroicons/react/24/solid';
import { useDebounceCallback, useIsMounted } from 'usehooks-ts';
import { usePathname } from 'next/navigation';
import { SearchIcon } from '@nextui-org/shared-icons';
import { DateSelect } from '@/components/date-select';
import { ArrayIndices } from 'type-fest';
import internal from 'stream';
import { useBreakpoint } from '@/helpers/use-breakpoint';


type ValueType = {
	slider: [number, number],
	select: Set<string>,
	switch: boolean,
	dateSelect: React.ComponentProps<typeof DateSelect>['range']
};

type FilterTypes = {
	select: typeof Select,
	slider: typeof Slider,
	switch: typeof Switch,
	dateSelect: typeof DateSelect
};

export type FilterField<D, T extends keyof FilterTypes, N extends string> = {
	type: T,
	name: N,
	label: string,
	filter?: (val: any, data: D) => boolean,
	value: ValueType[T],
	props?: React.ComponentProps<FilterTypes[T]>,
	className?: string
};

export type Filterers<D, N extends string> = readonly FilterField<D, keyof FilterTypes, N>[];

export type Sorter<S extends string, D> = {
	readonly name: S,
	readonly sort?: (a: D, b: D) => number
};

type FilterSorterProps<D, M extends string, N extends string, S extends string> = {
	className?: string,
	pageSizes?: number[],
	readonly sorters: Readonly<Sorter<S, D>[]>,
	displayModes?: { name: M, icon: ReactNode }[],
	searcher?: (search: string, data: D) => boolean | undefined,
	children: (displayMode: M, data: D[]) => React.ReactNode,
	defaultAscending?: boolean
} & ({
	filterers: Filterers<D, N>,
	data: D[]
} | {
	filterers: Filterers<any, N>,
	data: ((options: {
		filters: { [K in N]: any },
		sort: S,
		search: string,
		pageSize: number,
		currentPage: number,
		ascending: boolean
	}) => Awaitable<{ data: D[], total: number }>),
});

const debounceOptions = {
	leading: false,
	trailing: true,
} as const;

const queryDebounceOptions = { leading: false, trailing: true };

const FilterSorterComponent = <D, M extends string, N extends string, S extends string>({ defaultData, defaultAscending, filterers, data, pageSizes, sorters, displayModes, searcher, className, children }: FilterSorterProps<D, M, N, S> & { defaultData: any }) => {
	const defaultFilterState: Record<N, any> = {} as any;
	filterers.forEach(filter => {
		defaultFilterState[filter.name] = filter.value;
	});

	const { sorter: defaultSorter, ascending: storedAscending, pageSize: defaultPageSize, currentPage: defaultCurrentPage,
		displayMode: defaultDisplayMode, ...payloadFilterState } = defaultData;

	const [filterState, _setFilterState] = useState<typeof defaultFilterState>(Object.keys(payloadFilterState).length ? payloadFilterState :
		defaultFilterState);
	const [pageSize, _setPageSize] = useState(defaultPageSize ?? new Set([(pageSizes?.[0] ?? 25).toString()]));
	const [sorter, _setSorter] = useState(defaultSorter ?? new Set(sorters.length ? [sorters[0].name] : []));
	const [ascending, _setAscending] = useState<boolean>(storedAscending ?? defaultAscending ?? true);
	const [displayMode, _setDisplayMode] = useState(defaultDisplayMode ?? new Set([displayModes?.length ? displayModes[0].name : '']));
	const [query, _setQuery] = useState('');
	const [processedData, setProcessedData] = useState(Array.isArray(data) ? data : []);
	const [totalCount, setTotalCount] = useState(Array.isArray(data) ? data.length : -1);
	const [currentPage, _setCurrentPage] = useState(defaultCurrentPage ?? 1);
	const [selectedKeys, setSelectedKeys] = useState(new Set(['1']));
	const [loadingRemoteData, setLoadingRemoteData] = useState(false);
	const pathname = usePathname();
	const prevNonce = useRef(1);
	const resetPage = useRef(false);
	const flush = useRef(false);
	const searchRef = useRef<HTMLInputElement | null>(null);
	const mounted = useIsMounted();
	const breakpoint = useBreakpoint();

	const localStateKey = `filter-sort-${pathname}`;

	const dataRemote = !Array.isArray(data);
	const pageSizeNum = +[...pageSize][0];

	const deps = dataRemote ? [data, filterers, pageSize, filterState, currentPage, ascending, searcher, sorters, sorter, mounted, query] :
		[data, filterers, filterState, ascending, searcher, sorters, sorter, mounted, query];

	const onChange = useDebounceCallback(useCallback(() => {
		if (!mounted()) return;

		let page = currentPage;
		if (resetPage.current) {
			setCurrentPage(1);
			resetPage.current = false;
			page = 1;
			if (dataRemote)
				setTotalCount(-1);
		}

		const sort = sorters.find(s => sorter.has(s.name))!;
		if (Array.isArray(data)) {
			const lower = query.toLowerCase();

			const filteredSorted = data
				.filter(d => filterers.every(f => f.filter?.(filterState[f.name], d)) && searcher?.(lower, d)!)
				.sort(sorters.find(s => sorter.has(s.name))!.sort);
			if (ascending)
				setProcessedData(filteredSorted);
			else
				setProcessedData(filteredSorted.reverse());
			setTotalCount(filteredSorted.length);

			if (!Number.isNaN(pageSizeNum) && currentPage > (filteredSorted.length / pageSizeNum))
				setCurrentPage(1)

			return;
		}

		const nonce = Math.random();
		prevNonce.current = nonce;
		setLoadingRemoteData(true);
		Promise.resolve(data({ ascending, filters: filterState, sort: sort.name, pageSize: pageSizeNum, search: query, currentPage: page }))
			.then(d => {
				if (nonce === prevNonce.current) {
					setProcessedData(d.data);
					setTotalCount(d.total);
				}
			})
			.finally(() => setLoadingRemoteData(false));
	}, deps), dataRemote ? 250 : 100, debounceOptions);

	const onQuery = useDebounceCallback(useCallback(() => {
		onChange();
		onChange.flush();
	}, deps), 500)

	useEffect(() => {
		onChange();
		if (flush.current) {
			onChange.flush();
			flush.current = false;
		}
		return () => {
			prevNonce.current = 1;
			onChange.cancel();
		}
	}, [data, filterers, filterState, currentPage, ascending, searcher, sorters, sorter]);

	const initialQuery = useRef(true);

	useEffect(() => {
		if (initialQuery.current) {
			initialQuery.current = false;
			return;
		}

		onQuery();
		return () => {
			prevNonce.current = 1;
			onQuery.cancel();
		}
	}, [query]);

	useEffect(() => {
		if (dataRemote) {
			onChange();
			onChange.flush();
		}
	}, [pageSize, dataRemote, currentPage]);

	useEffect(() => {
		const cb = (ev: KeyboardEvent) => {
			if (ev.code === 'KeyF' && ev.ctrlKey) {
				ev.stopPropagation();
				ev.preventDefault();
				setSelectedKeys(new Set(['1']));
				searchRef.current?.focus();
			}
		};

		window.addEventListener('keydown', cb);

		return () => window.removeEventListener('keydown', cb);
	}, []);

	type LocalState = { sorter?: typeof sorter,
		ascending?: typeof ascending,
		pageSize?: typeof pageSize,
		currentPage?: typeof currentPage,
		displayMode?: typeof displayMode
	} & { [K: string]: any };

	const updateLocalState = (payload: Partial<LocalState>) => {
		payload = {
			sorter,
			ascending,
			pageSize,
			currentPage,
			displayMode,
			...filterState,
			...payload,
		};
		const data = JSON.stringify(payload, (k, v) => v instanceof Set ? { type: 'set', value: [...v] } : v);
		localStorage.setItem(localStateKey, data);
	}
	const setCurrentPage = (currentPage: number) => {
		updateLocalState({ currentPage });
		_setCurrentPage(currentPage);
	}

	const setPageSize = (size: typeof pageSize) => {
		const sizeNum = +[...size][0];
		const newPageNum = Number.isNaN(sizeNum) ? 1 : Math.floor(pageSizeNum * (currentPage - 1) / sizeNum) + 1;
		_setCurrentPage(Number.isNaN(newPageNum) ? 1 : newPageNum);
		_setPageSize(size);
		updateLocalState({ pageSize: size, currentPage: newPageNum });
	};

	const setFilterState = (s: typeof filterState | ((s: typeof filterState) => typeof filterState)) => {
		resetPage.current = true;

		if (typeof s === 'function')
			return _setFilterState(filterState => {
				const newState = s(filterState);
				updateLocalState(newState);
				return newState;
			});
		_setFilterState(s);
		updateLocalState(s);
	};

	const setAscending = (a: (a: boolean) => boolean) => {
		_setAscending(s => {
			const ascending = a(s);
			updateLocalState({ ascending });
			return ascending;
		})
	};

	const setSorter = (s: typeof sorter) => {
		updateLocalState({ sorter: s });
		_setSorter(s);
	};

	const setDisplayMode = (d: typeof displayMode) => {
		updateLocalState({ displayMode: d });
		_setDisplayMode(d);
	}

	const setQuery = (q: string) => {
		_setQuery(q);
		resetPage.current = true;
	}

	const renderedData = useMemo(() => {
		if (!mounted()) return null;

		const pageData = dataRemote || Number.isNaN(pageSizeNum) ? processedData :
			processedData.slice(pageSizeNum * (currentPage - 1), pageSizeNum * currentPage);

		if (!pageData.length)
			return (<div className="m-auto text-lg text-gray-500">No results found.</div>)

		return children([...displayMode][0] as M, pageData);
	}, dataRemote ? [processedData, displayMode, currentPage, mounted] :
		[displayMode, processedData, pageSize, currentPage, mounted]);

	return (<div className={`flex flex-col ${className ?? ''}`}>
		<Accordion selectedKeys={selectedKeys} onSelectionChange={setSelectedKeys as any}>
			<AccordionItem key="1" title="Sort Options">
				<div className="grid grid-cols-12 gap-2 overflow-hidden">
					{filterers.map(filter => {
						if (filter.type === 'slider')
							return <Slider key={filter.name} value={filterState[filter.name] as any} label={filter.label}
								className={filter.className}
								onChange={v => {
									if (Array.isArray(v) && v.length === 1) v = v[0];
									setFilterState(f => ({ ...f, [filter.name]: v }));
								}} size="md" {...filter.props as any} />;
						else if (filter.type === 'select')
							return <div className={`${filter.className ?? ''} flex`} key={filter.name}>
								<Select key={filter.name} selectedKeys={filterState[filter.name] as any} label={filter.label} radius="none" className="rounded-l-lg overflow-hidden"
									onSelectionChange={v => setFilterState(f => ({ ...f, [filter.name]: v }))} size="sm" {...filter.props as any} />
								<Button isIconOnly={true} color="danger" className="rounded-l-none rounded-r-lg h-full" onClick={() =>
									setFilterState(f => ({ ...f, [filter.name]: filter.value }))}>
									<XMarkIcon className="h-full p-2" />
								</Button>
							</div>;
						else if (filter.type === 'switch')
							return <Switch key={filter.name} className={filter.className} isSelected={filterState[filter.name]}
								onValueChange={selected => setFilterState(f => ({ ...f, [filter.name]: selected }))}>
								{filter.label}
							</Switch>
						else if (filter.type === 'dateSelect')
							return <div className={`${filter.className ?? ''} flex w-full`} key={filter.name}>
								<DateSelect range={filterState[filter.name] as any} label={filter.label} radius="none" className="rounded-l-lg overflow-hidden flex-grow"
									onChange={v => setFilterState(f => ({ ...f, [filter.name]: v }))} size="sm"
									{...filter.props as any} />
								<Button isIconOnly={true} color="danger" className="rounded-l-none rounded-r-lg h-full" onClick={() =>
									setFilterState(f => ({ ...f, [filter.name]: filter.value }))}>
									<XMarkIcon className="h-full p-2" />
								</Button>
							</div>;
					})}
					<div className="flex mt-0.5 gap-2 flex-wrap sm:flex-nowrap flex-col-reverse sm:flex-row col-span-12">
						<div className="flex gap-2 flex-grow">
							<Button className="h-full" color="danger" onClick={() => {
								setFilterState(defaultFilterState);
								setQuery('');
							}}>Reset</Button>
							<Input startContent={<SearchIcon />} ref={searchRef} size="sm" label="Search" type="text" isClearable={true} value={query} onValueChange={setQuery} onClear={() => setQuery('')} />
						</div>
						<div className="flex gap-2 sm:w-1/3 flex-grow sm:flex-grow-0 sm:max-w-80 items-center">
							<Select name="page" label="Per Page" size="sm" className="w-1/2" selectedKeys={pageSize} onSelectionChange={sel => sel !== 'all' && sel.size && setPageSize(sel)}>
								{ (pageSizes ?? [25, 50, 100]).map(s => <SelectItem key={s === Infinity ? 'all' : s.toString()} value={s === Infinity ? 'all' : s.toString()}>
									{s === Infinity ? 'All' : s.toString()}
								</SelectItem>) }
							</Select>
							<Select name="sort" label="Sort" size="sm" className="w-1/2" selectedKeys={sorter} onSelectionChange={sel => sel !== 'all' && sel.size && setSorter(sel)}>
								{ sorters.map(s => <SelectItem key={s.name} value={s.name}>
									{s.name}
								</SelectItem>) }
							</Select>
							<Tooltip content={`Currently sorting ${ascending ? 'ascending' : 'descending'}`}>
								<div className="cursor-pointer rotate-90" onClick={() => setAscending(a => !a)}>
									<ArrowLongUpIcon className={`w-5 transition ${ascending ? '-rotate-45' : 'rotate-45'}`} />
								</div>
							</Tooltip>
						</div>
					</div>
				</div>
			</AccordionItem>
		</Accordion>
		<div className="relative flex flex-col flex-grow items-center">
			{displayModes && <div className="absolute right-0 top-0">
          <Dropdown>
              <DropdownTrigger>
                  <Button variant="light" isIconOnly={true} size="sm" className="p-1 bg-black/25 backdrop-blur-sm border border-gray-500/50">
	                  {displayModes.find(m => displayMode.has(m.name))?.icon}
                  </Button>
              </DropdownTrigger>
              <DropdownMenu selectionMode="single" selectedKeys={displayMode} onSelectionChange={sel => sel !== 'all' && sel.size && setDisplayMode(sel)}>
								{displayModes.map(mode => <DropdownItem key={mode.name}>
									{mode.name}
								</DropdownItem>)}
              </DropdownMenu>
          </Dropdown>
      </div>}

			{(renderedData === null || loadingRemoteData) ? <Spinner className="m-auto" /> : renderedData}

			{totalCount > 0 && !Number.isNaN(pageSizeNum) && <div className="mt-auto mb-4" >
          <Pagination total={Math.ceil(totalCount / pageSizeNum)} showControls size={breakpoint ? 'md' : 'sm'}
              isCompact siblings={breakpoint ? 2 : 1} page={currentPage} initialPage={1} onChange={setCurrentPage}>
          </Pagination>
			</div> }
		</div>
	</div>);
};

export const FilterSorter = <D, M extends string, N extends string, S extends string>(props: FilterSorterProps<D, M, N, S>) => {
	const pathname = usePathname();
	const localStateKey = `filter-sort-${pathname}`;
	const [defaultData, setDefaultData] = useState<null | any>(null);

	useEffect(() => {
		const stored = localStorage.getItem(localStateKey);
		if (!stored) {
			setDefaultData({});
			return;
		}
		let payload: any;

		try {
			payload = JSON.parse(stored, (k, v) => typeof v === 'object' && 'type' in v && v.type === 'set' ? new Set(v.value) : v);

			setDefaultData(payload)
		} catch (e) {
			localStorage.removeItem(localStateKey)
			console.error(e);
			setDefaultData({});
		}
	}, []);

	if (defaultData === null)
		return (<Spinner className={props.className} size="lg" />)

	return (<FilterSorterComponent defaultData={defaultData} {...props} />);
};
