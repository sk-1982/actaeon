'use client';

import { AccordionItem, Accordion } from '@nextui-org/accordion';
import { Button } from '@nextui-org/button';
import { DropdownItem, DropdownTrigger, Dropdown, DropdownMenu } from '@nextui-org/dropdown';
import { Input } from '@nextui-org/input';
import { Pagination } from '@nextui-org/pagination';
import { SelectItem, Select } from '@nextui-org/select';
import { Slider } from '@nextui-org/slider';
import { Spinner } from '@nextui-org/spinner';
import { Switch } from '@nextui-org/switch';
import { Tooltip } from '@nextui-org/tooltip';
import { ComponentProps, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { ArrowLongUpIcon } from '@heroicons/react/24/solid';
import { useDebounceCallback, useIsMounted } from 'usehooks-ts';
import { ReadonlyURLSearchParams, usePathname, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@nextui-org/shared-icons';
import { DateSelect } from '@/components/date-select';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { Awaitable } from '@/types/awaitable';
import { useWindowListener } from '@/helpers/use-window-listener';
import { DateRange } from 'react-day-picker';
import { Entries } from 'type-fest';


type ValueType = {
	slider: [number, number],
	select: Set<string>,
	switch: boolean,
	dateSelect: ComponentProps<typeof DateSelect>['range']
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
	props?: ComponentProps<FilterTypes[T]>,
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
	children: (displayMode: M, data: D[]) => ReactNode,
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

type LocalState = {
	sorter?: Set<string>,
	ascending?: boolean,
	pageSize?: Set<string>,
	currentPage?: number,
	displayMode?: Set<string>
} & { [K: string]: any; };

const getParamsFromState = (data: LocalState & { query: string }) => {
	const params = new URLSearchParams();

	Object.entries(data).forEach(([key, val]) => {
		if (val === undefined || val === null) return;

		if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
			params.set(key, val.toString());
		} else if (val instanceof Set || Array.isArray(val)) {
			params.set(key, [...val].join(','));
		} else if ('from' in val || 'to' in val) {
			if (val.from)
				params.set(`${key}-begin`, val.from.toISOString());
			if (val.to)
				params.set(`${key}-end`, val.to.toISOString());
		}
	});

	params.sort();
	return params;
};

const getStateFromParams = <K extends keyof LocalState & string>(params: ReadonlyURLSearchParams, key: K, val: LocalState[K]): LocalState[K] => {
	if (typeof val === 'boolean') {
		if (params.has(key))
			return params.get(key) === 'true';
	} else if (typeof val === 'number') {
		return +(params.get(key) ?? val);
	} else if (typeof val === 'string') {
		return params.get(key) ?? val;
	} else if ((val as any) instanceof Set) {
		if (params.has(key))
			return new Set(params.get(key)?.split(',')?.filter(x => x));
	} else if (Array.isArray(val)) {
		if (params.has(key))
			return params.get(key)!.split(',');
	} else if (params.has(`${key}-begin`) || params.has(`${key}-end`)) {
		const range: DateRange = {
			from: new Date(params.get(`${key}-begin`)!)
		};
		if (params.has(`${key}-end`))
			range.to = new Date(params.get(`${key}-end`)!);
		return range;
	}

	return val;
};

const getFilterStateFromParams = <S extends object>(params: ReadonlyURLSearchParams, state: S) => Object.fromEntries((Object.entries(state) as Entries<S>).map(([key, val]) => {
		return [key, getStateFromParams(params, key as any, val)];
})) as S;

const FilterSorterComponent = <D, M extends string, N extends string, S extends string>({ defaultData, defaultAscending, filterers, data, pageSizes, sorters, displayModes, searcher, className, children }: FilterSorterProps<D, M, N, S> & { defaultData: any; }) => {
	const defaultFilterState: Record<N, any> = {} as any;
	filterers.forEach(filter => {
		defaultFilterState[filter.name] = filter.value;
	});

	const { sorter: defaultSorter, ascending: storedAscending, pageSize: defaultPageSize, currentPage: defaultCurrentPage,
		displayMode: defaultDisplayMode, ...payloadFilterState } = defaultData;

	const params = useSearchParams();
	const [filterState, _setFilterState] = useState<typeof defaultFilterState>(getFilterStateFromParams(params, Object.keys(payloadFilterState).length ? payloadFilterState :
		defaultFilterState));
	const [pageSize, _setPageSize] = useState<Set<string>>(getStateFromParams(params, 'pageSize', defaultPageSize ?? new Set([(pageSizes?.[0] ?? 25).toString()]))!);
	const [sorter, _setSorter] = useState<Set<string>>(getStateFromParams(params, 'sorter', defaultSorter ?? new Set(sorters.length ? [sorters[0].name] : []))!);
	const [ascending, _setAscending] = useState<boolean>(getStateFromParams(params, 'ascending', storedAscending ?? defaultAscending ?? true)!);
	const [displayMode, _setDisplayMode] = useState<Set<string>>(getStateFromParams(params, 'displayMode', defaultDisplayMode ?? new Set([displayModes?.length ? displayModes[0].name : '']))!);
	const [currentPage, _setCurrentPage] = useState(getStateFromParams(params, 'currentPage', 1)!);
	const [query, _setQuery] = useState(getStateFromParams(params, 'query', ''));
	const [processedData, setProcessedData] = useState(Array.isArray(data) ? data : []);
	const [totalCount, setTotalCount] = useState(Array.isArray(data) ? data.length : -1);
	const [selectedKeys, setSelectedKeys] = useState(new Set(['1']));
	const [loadingRemoteData, setLoadingRemoteData] = useState(false);
	const paramsChangedByState = useRef<string | null>(null);
	const lastParams = useRef(params.toString());
	const pathname = usePathname();
	const prevNonce = useRef(1);
	const resetPage = useRef(false);
	const flush = useRef(false);
	const searchRef = useRef<HTMLInputElement | null>(null);
	const mounted = useIsMounted();
	const breakpoint = useBreakpoint();
	const dataCallback = useCallback(typeof data === 'function' ? data : (() => { }), []);
	const dataDep = typeof data === 'function' ? dataCallback : data;

	const localStateKey = `filter-sort-${pathname}`;

	const dataRemote = !Array.isArray(data);
	const pageSizeNum = +[...pageSize][0];
	
	useEffect(() => {
		history.replaceState({}, '', `?${getParamsFromState({
			sorter,
			ascending,
			pageSize,
			currentPage,
			displayMode,
			...filterState,
			query
		})}`);
	}, []);

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

		const newParams = getParamsFromState({ sorter, ascending, pageSize, currentPage: page, displayMode, query, ...filterState });
		const paramUrlString = `?${newParams}`;
		paramsChangedByState.current = newParams.toString();
		if (paramUrlString !== location.search)
			history.pushState({}, '', paramUrlString);

		const sort = sorters.find(s => sorter.has(s.name))!;
		if (Array.isArray(dataDep)) {
			const lower = query.toLowerCase();

			const filteredSorted = dataDep
				.filter(d => filterers.every(f => f.filter?.(filterState[f.name], d)) && searcher?.(lower, d)!)
				.sort(sorters.find(s => sorter.has(s.name))!.sort);
			if (ascending)
				setProcessedData(filteredSorted);
			else
				setProcessedData(filteredSorted.reverse());
			setTotalCount(filteredSorted.length);

			if (!Number.isNaN(pageSizeNum) && currentPage > Math.ceil(filteredSorted.length / pageSizeNum))
				setCurrentPage(1)

			return;
		}

		const nonce = Math.random();
		prevNonce.current = nonce;
		setLoadingRemoteData(true);
		Promise.resolve(dataDep({ ascending, filters: filterState, sort: sort.name, pageSize: pageSizeNum, search: query, currentPage: page })!)
			.then(d => {
				if (nonce === prevNonce.current) {
					setProcessedData(d.data);
					setTotalCount(d.total);
				}
			})
			.finally(() => setLoadingRemoteData(false));
	}, [dataDep, filterers, pageSize, filterState, currentPage, ascending, searcher, sorters, sorter, mounted, query]), dataRemote ? 250 : 100, debounceOptions);

	const onQuery = useDebounceCallback(useCallback(() => {
		onChange();
		onChange.flush();
	}, [query]), 500)

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
	}, [dataDep, filterers, filterState, currentPage, ascending, searcher, sorters, sorter, pageSize]);

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

	useWindowListener('keydown', ev => {
		if (ev.code === 'KeyF' && ev.ctrlKey) {
			ev.stopPropagation();
			ev.preventDefault();
			setSelectedKeys(new Set(['1']));
			searchRef.current?.focus();
		}
	});

	useEffect(() => {
		if (params.toString() === lastParams.current)
			return;
		lastParams.current = params.toString();
		if (paramsChangedByState.current === params.toString()) {
			return;
		}
		paramsChangedByState.current = null;
		flush.current = true;
		initialQuery.current = true;
		_setSorter(getStateFromParams(params, 'sorter', sorter)!);
		_setAscending(getStateFromParams(params, 'ascending', ascending)!);
		_setPageSize(getStateFromParams(params, 'pageSize', pageSize)!);
		_setCurrentPage(getStateFromParams(params, 'currentPage', currentPage)!);
		_setDisplayMode(getStateFromParams(params, 'displayMode', displayMode)!);
		_setFilterState(getFilterStateFromParams(params, filterState));
		_setQuery(getStateFromParams(params, 'query', query)!);
	}, [params, sorter, ascending, pageSize, currentPage, displayMode, filterState, query]);

	const updateLocalState = (payload: Partial<LocalState & { query: string; }>) => {
		const state = {
			sorter,
			ascending,
			pageSize,
			currentPage,
			displayMode,
			...filterState,
			...payload,
		};
		const data = JSON.stringify(state, (k, v) => v instanceof Set ? { type: 'set', value: [...v] } : v);
		localStorage.setItem(localStateKey, data);
	};
	const setCurrentPage = (currentPage: number) => {
		updateLocalState({ currentPage });
		_setCurrentPage(currentPage);
	};

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
		updateLocalState({ query: q });
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
							<Select name="page" label="Per Page" size="sm" className="w-1/2" selectedKeys={pageSize} onSelectionChange={sel => sel !== 'all' && sel.size && setPageSize(sel as Set<string>)}>
								{ (pageSizes ?? [25, 50, 100]).map(s => <SelectItem key={s === Infinity ? 'all' : s.toString()} value={s === Infinity ? 'all' : s.toString()}>
									{s === Infinity ? 'All' : s.toString()}
								</SelectItem>) }
							</Select>
							<Select name="sort" label="Sort" size="sm" className="w-1/2" selectedKeys={sorter} onSelectionChange={sel => sel !== 'all' && sel.size && setSorter(sel as Set<string>)}>
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
              <DropdownMenu selectionMode="single" selectedKeys={displayMode} onSelectionChange={sel => sel !== 'all' && sel.size && setDisplayMode(sel as Set<string>)}>
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

const payloadValid = (payload: any, filterers: Filterers<any, any>) => {
	for (const p of ['sorter', 'pageSize', 'displayMode']) {
		if (p in payload && !(payload[p] instanceof Set))
			return false;
	}

	if ('currentPage' in payload && typeof payload.currentPage !== 'number')
		return false;

	for (const filterer of filterers) {
		if (!(filterer.name in payload)) continue;
		const data = payload[filterer.name];
		if (filterer.type === 'select' && !(data instanceof Set))
			return false;
		if (filterer.type === 'slider' && !Array.isArray(data))
			return false;
		if (filterer.type === 'dateSelect' && data !== undefined && (
			data.from === undefined ||
			(data.from !== undefined && !(data.from instanceof Date)) ||
			(data.to !== undefined && !(data.to instanceof Date))
		))
			return false;
	}

	return true;
}

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
			payload = JSON.parse(stored, (k, v) => {
				if (typeof v === 'object' && v !== null) {
					if ('type' in v && v.type === 'set')
						return new Set(v.value);

					const filterer = props.filterers.find(f => f.name === k);
					if (filterer?.type === 'dateSelect')
						return {
							from: typeof v.from === 'string' ? new Date(v.from) : undefined,
							to: typeof v.to === 'string' ? new Date(v.to) : undefined
						};
				}

				return v;
			});

			if (!payloadValid(payload, props.filterers))
				payload = {};

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
