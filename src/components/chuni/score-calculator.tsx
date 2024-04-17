import { ChuniMusic } from '@/actions/chuni/music';
import { ChuniUserRating } from '@/actions/chuni/profile';
import { useHashNavigation } from '@/helpers/use-hash-navigation';
import { Modal, ModalHeader, ModalContent, ModalBody, ModalFooter } from '@nextui-org/modal';
import { Button } from '@nextui-org/button';
import { CHUNI_DIFFICULTIES } from '@/helpers/chuni/difficulties';
import { floorToDp } from '@/helpers/floor-dp';
import { Input } from '@nextui-org/input';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { chuniRating, chuniRatingInverse } from '@/helpers/chuni/rating';
import { ChuniRating } from './rating';
import { ChuniScoreRankBadge } from './score-badge';
import { CHUNI_SCORE_RANKS, CHUNI_SCORE_THRESHOLDS, getRankFromScore } from '@/helpers/chuni/score-ranks';
import { Tabs, Tab } from '@nextui-org/tabs';
import { BigDecimal } from '@/helpers/big-decimal';
import { Divider } from '@nextui-org/divider';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/dropdown';
import { useValueChange } from '@/helpers/use-value-change';
import { Entries, RequireExactlyOne } from 'type-fest';

export type ChuniScoreCalculatorProps = {
	topRating?: ChuniUserRating,
	music: Pick<ChuniMusic, 'scoreMax' | 'allJudgeCount' | 'level' | 'songId' | 'chartId' | 'title' | 'rating'> | null,
	onClose: () => void
};

const calculateTop = ({ topRating, subtract, rating, totalTopRating }:
	{ topRating?: ChuniUserRating, subtract: BigDecimal | null, rating: BigDecimal, totalTopRating: BigDecimal }) => { 
	if (!topRating) return [null, null];
	
	let topIncrease: string | null = null;
	let topIndex: number | null = null;

	if (subtract !== null && rating.compare(subtract) > 0) {
		topIncrease = totalTopRating.add(rating.sub(subtract)).div(30, 4n).sub(totalTopRating.div(30, 4n)).toFixed(3);
		topIndex = topRating.top.findIndex(t => rating.compare(t.rating) >= 0);
		if (topIndex === -1)
			topIndex = null;
	}

	return [topIncrease, topIndex] as const;
};

type MissAttackState = { miss: string, attack: string, totalAttack: number, missPercent: number; };
type MissAttackAction = { miss: string; } | { attack: string, recompute?: boolean; } | { miss: string, totalAttack: number; } | { missPercent: number; } | 'recompute';
type NoteValues = { noteMiss: string, noteAttack: string, noteJustice: string, noteJusticeCritical: string; };
type NoteState = NoteValues & { order: (keyof NoteValues)[], totalNote: number };

const STORAGE_KEY = 'chuni-score-calculator';

type StoredState = {
	selectedKey: string,
	score: string,
	rating: string,
	topRatingIncrease: string,
	ratio: string,
	missPercent: number
};

export const ChuniScoreCalculator = ({ topRating, music, onClose }: ChuniScoreCalculatorProps) => {
	const onModalClose = useHashNavigation({
		onClose,
		isOpen: music !== null,
		hash: '#chuni-score-calculator'
	});

	const [selectedKey, setSelectedKey] = useState('rating');
	const [score, setScore] = useState('');
	const [rating, setRating] = useState('');
	const [topRatingIncrease, setTopRatingIncrease] = useState('');
	const [ratio, setRatio] = useState('100');
	const [{ miss, attack, missPercent }, dispatchScore] = useReducer((state: MissAttackState, action: MissAttackAction): MissAttackState => {
		if (action === 'recompute') {
			if (!Number.isInteger(+state.miss)) return state;

			const attack = state.totalAttack - +state.miss * 2;
			if (attack < 0 || Number.isNaN(attack)) return state;
			return { ...state, attack: attack.toString() };
		}

		if ('totalAttack' in action || 'missPercent' in action)
			return { ...state, ...action };
		const totalAttack = state.totalAttack;

		if ('miss' in action) {
			const val = action.miss.trim();
			if (val === '' || !Number.isInteger(+val))
				return { ...state, miss: val };

			const miss = Math.floor(Math.max(Math.min(+action.miss, totalAttack / 2), 0));
			const attack = state.totalAttack - miss * 2;
			if (Number.isNaN(miss)) return state;
			const missPercent = miss / totalAttack;
			return { ...state, miss: miss.toString(), attack: attack.toString(), missPercent };
		} else if ('attack' in action) {
			const val = action.attack.trim();
			if (val === '' || !Number.isInteger(+val))
				return { ...state, attack: val };
			let attack = Math.floor(Math.max(Math.min(+action.attack, totalAttack), 0));
			const miss = Math.min((attack < +state.attack && action.recompute ? Math.ceil : Math.floor)((totalAttack - attack) / 2), Math.floor(totalAttack / 2));
			if (action.recompute)
				attack = state.totalAttack - miss * 2;

			if (Number.isNaN(attack) || attack < 0) return state;
			const missPercent = miss / totalAttack;
			
			return { ...state, miss: miss.toString(), attack: attack.toString(), missPercent };
		}

		return state;
	}, { miss: '0', totalAttack: 0, missPercent: 0, attack: '0' });
	const [unachievable, setUnachievable] = useState(false);
	const [justiceCount, setJusticeCount] = useState(0);
	
	useValueChange(() => { 
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedKey, score, rating, topRatingIncrease, ratio, missPercent }));
	}, [selectedKey, score, rating, topRatingIncrease, ratio, missPercent]);

	useEffect(() => { 
		let data: StoredState;
		try {
			const val = localStorage.getItem(STORAGE_KEY);
			if (val)
				data = JSON.parse(val);
			else
				return;
		} catch (e) {
			console.error(e);
			return;
		}

		setSelectedKey(data.selectedKey);
		setScore(data.score);
		setRating(data.rating);
		setTopRatingIncrease(data.topRatingIncrease);
		setRatio(data.ratio);
		dispatchScore({ missPercent: data.missPercent });
	}, []);

	const [noteCount, dispatchNote] = useReducer((state: NoteState, action: RequireExactlyOne<NoteValues> | number) => {
		if (typeof action === 'number')
			return { ...state, noteMiss: '0', noteAttack: '0', noteJustice: '0', noteJusticeCritical: action.toString(), totalNote: action };
		
		state = { ...state };
		const [key, val] = (Object.entries(action) as Entries<typeof action>)[0];
		state.order = [key, ...state.order.filter(x => x !== key)];
		state[key] = val?.trim() ?? '';
		if (state[key] !== '' && Number.isFinite(+state[key]))
			state[key] = Math.floor(Math.min(Math.max(+state[key], 0), state.totalNote)).toString();

		if (state.order.some(k => state[k] === '' || !Number.isInteger(+state[k])))
			return state;

		let sum = state.order.reduce((t, k) => t + +state[k], 0);
		if (sum === state.totalNote)
			return state;

		if (sum < state.totalNote) {
			const k = state.order.at(-1)!;
			state[k] = (+state[k] + state.totalNote - sum).toString();
		} else {
			[...state.order].reverse().forEach(key => {
				if (sum === state.totalNote) return;
				const val = +state[key];
				const sub = Math.min(val, sum - state.totalNote);
				sum -= sub;
				state[key] = (val - sub).toString();
			});
		}

		return state;
	}, {
		noteMiss: '0', noteAttack: '0', noteJustice: '0', noteJusticeCritical: '0', totalNote: 0,
		order: ['noteMiss', 'noteAttack', 'noteJustice', 'noteJusticeCritical']
	})

	const totalTopRating = useMemo(() => topRating?.top.reduce((t, x) => t.add(x.rating), BigDecimal.ZERO) ?? BigDecimal.ZERO, [topRating]);
	const musicLevel = useMemo(() => music ? new BigDecimal(music.level?.toFixed(1)!) : null, [music]);
	const subtract = useMemo(() => { 
		if (!music) return null;
		const top = topRating?.top.find(r => r.songId === music.songId && r.chartId === music.chartId);
		const maxPossibleRating = musicLevel!.add('2.15');
		
		const smallestRating = topRating?.top.at(-1)?.rating ?? 0;
		if (maxPossibleRating.compare(smallestRating) <= 0)
			return null;

		if (top) {
			const rating = new BigDecimal(top.rating);
			const currentRatingDiff = rating.sub(musicLevel!);
			if (currentRatingDiff.compare('2.15') >= 0)
				return null;
			return rating;
		} else {
			return new BigDecimal(smallestRating);
		}
	}, [musicLevel, topRating, music]);

	const maxPossibleTopIncrease = useMemo(() => { 
		if (!music || selectedKey !== 'top') return null;
		const maxPossibleRating = musicLevel!.add('2.15');

		if (subtract === null) return null;

		return totalTopRating.add(maxPossibleRating.sub(subtract)).div(30, 4n).sub(totalTopRating.div(30, 4n)).toString()
	}, [topRating, music, selectedKey, totalTopRating, musicLevel, subtract]);

	const { musicRating, reverseScore, topIncrease, topIndex, targetTopScore, targetTotalRating, computedNoteScore, computedRating } = useMemo(() => {
		const data: {
			musicRating: BigDecimal | null,
			reverseScore: number | null,
			topIncrease: string | null,
			topIndex: number | null,
			targetTopScore: number | null,
			targetTotalRating: BigDecimal | null,
			computedNoteScore: number | null,
			computedRating: BigDecimal | null,
		} = { musicRating: null, reverseScore: null, topIncrease: null, topIndex: null, targetTopScore: null, targetTotalRating: null, computedNoteScore: null, computedRating: null };

		if (!music) return data;

		let computedRating: BigDecimal | null = null;

		if (selectedKey === 'rating') {
			if (isNaN(+score)) return data;

			data.musicRating = computedRating = chuniRating(Math.max(Math.min(Math.floor(+score), 1010000), 0), music?.level ?? 0, 5n);
		} else if (selectedKey === 'score') {
			if (isNaN(+rating)) return data;

			computedRating = new BigDecimal(rating);
			data.reverseScore = chuniRatingInverse(computedRating, music.level ?? 0);
		} else if (selectedKey === 'top') {
			if (subtract === null || isNaN(+topRatingIncrease)) return data;

			const ratingIncrease = new BigDecimal(topRatingIncrease).mul(30);

			if (ratingIncrease.compare(0) === 0) {
				data.targetTopScore = 0;
				data.targetTotalRating = totalTopRating.div(30, 4n);
				return data;
			}

			const targetSongRating = subtract.add(ratingIncrease);
			const targetScore = chuniRatingInverse(targetSongRating, music.level ?? 0);
			data.targetTopScore = targetScore;

			if (targetScore === Infinity) return data;

			data.targetTotalRating = totalTopRating.add(ratingIncrease).div(30, 4n);
			data.topIndex = calculateTop({ topRating, subtract, totalTopRating, rating: targetSongRating })[1];
		} else {
			if (noteCount.order.some(k => !Number.isInteger(+noteCount[k])))
				return data;

			data.computedNoteScore = Math.floor((+noteCount.noteJusticeCritical * 1_010_000 + +noteCount.noteJustice * 1_000_000 + +noteCount.noteAttack * 500_000) / music.allJudgeCount);
			computedRating = chuniRating(data.computedNoteScore, music?.level ?? 0, 5n);
		}

		if (computedRating !== null) {
			data.computedRating = computedRating;
			const [topIncrease, topIndex] = calculateTop({ topRating, subtract, totalTopRating, rating: computedRating });
			data.topIncrease = topIncrease;
			data.topIndex = topIndex;
		}

		return data;
	}, [music, score, rating, selectedKey, subtract, totalTopRating, topRating, topRatingIncrease, noteCount]);

	useEffect(() => { 
		if (music)
			dispatchNote(music.allJudgeCount);
	}, [music, dispatchNote]);

	let targetScore: number | null;
	if (selectedKey === 'rating')
		targetScore = Math.max(Math.min(Math.floor(+score), 1010000), 0);
	else if (selectedKey === 'score')
		targetScore = reverseScore;
	else if (selectedKey === 'top')
		targetScore = targetTopScore;
	else
		targetScore = computedNoteScore;
	const validScore = targetScore !== null && !isNaN(+targetScore) && isFinite(targetScore);
	const rank = !validScore ? null : getRankFromScore(targetScore!);

	const badge = useMemo(() => rank !== null && <ChuniScoreRankBadge className="h-5 sm:h-8 ml-auto my-auto" rank={rank} />, [rank]);
	const badgeDropdown = useMemo(() => badge !== null && selectedKey !== 'top' && (<Dropdown className="!min-w-0">
		<DropdownTrigger>
			<div className="ml-auto my-auto">
				{badge}
			</div>
		</DropdownTrigger>
		<DropdownMenu>
			{CHUNI_SCORE_RANKS.map((name, i) => (<DropdownItem key={i} className="py-1 px-0.5" onPress={() => {
				if (selectedKey === 'rating')
					setScore(CHUNI_SCORE_THRESHOLDS[i].toString());
				else if (i === 1)
					setRating('0.01');
				else
					setRating((Math.ceil(chuniRating(CHUNI_SCORE_THRESHOLDS[i], music?.level!, 3n).mul(100).valueOf()) / 100).toString());
			}}>
				<ChuniScoreRankBadge className="h-6" rank={i} />
			</DropdownItem>)).reverse()}
		</DropdownMenu>
	</Dropdown>), [badge, selectedKey]);

	useValueChange(() => { 
		if (!music || targetScore === null || !Number.isInteger(targetScore)) return;
		const justiceRatio = Math.min(Math.max(+ratio, 0), 100) / 100;
		if (!Number.isFinite(justiceRatio)) return;
		const noteCount = music.allJudgeCount;

		const maxAttackCount = targetScore <= 500000 ? noteCount :
			Math.floor((noteCount * (10000 * justiceRatio - targetScore + 1000000)) / (10000 * (justiceRatio + 50)));
		
		if (maxAttackCount < 0) {
			setUnachievable(true);
			return;
		}

		setUnachievable(false);

		const remainingJusticeCount = noteCount - maxAttackCount;
		const justiceCriticalCount = Math.floor(remainingJusticeCount * justiceRatio);
		const justiceCount = remainingJusticeCount - justiceCriticalCount;

		setJusticeCount(justiceCount);

		const miss = Math.ceil(Math.min(maxAttackCount * missPercent, Math.floor(maxAttackCount / 2)));
		const attack = maxAttackCount - 2 * miss;
		dispatchScore({ miss: miss.toString(), attack: attack.toString(), totalAttack: maxAttackCount });
	}, [music, targetScore, ratio], [miss, attack]);

	const scoreTargetText = useMemo(() => { 
		if (selectedKey === 'rating') return null;
		let score: number | null = null;
		if (selectedKey === 'score')
			score = reverseScore;
		else if (selectedKey === 'top')
			score = targetTopScore;
		else
			score = computedNoteScore;

		return (<span className="pt-0.5"><span className="sm:text-lg text-xs">Score: </span>{score === Infinity ?
			<span className="text-danger">Error</span> :
			<span className="text-xs sm:text-xl font-semibold">{score?.toLocaleString()}</span>}</span>);
	}, [selectedKey, reverseScore, targetTopScore, computedNoteScore]);

	const topIncreaseText = topIncrease && <span className="text-xs sm:text-sm mt-auto pb-0.5 sm:pb-1 ml-2.5">(Top +{topIncrease}{topIndex !== null && `, #${topIndex + 1}`})</span>;
	
	return (<Modal isOpen={music !== null} onClose={onModalClose} size="3xl">
		<ModalContent>
			{onClose => <>
				<ModalHeader>
					Score Calculator
				</ModalHeader>
				<ModalBody>
					<header className="font-semibold text-lg flex">
						{ music?.title } <span className="ml-auto text-right">{ CHUNI_DIFFICULTIES[music?.chartId!] } ({ music?.level }) </span>
					</header>
					<div className="flex text-xs sm:text-sm md:text-medium">
						{music?.scoreMax !== null && <>
							<span className="font-semibold">High score:&nbsp;</span>
							{music?.scoreMax?.toLocaleString()} ({floorToDp(+music?.rating!, 4)})
						</>}

						<span className="ml-auto text-right">Note count: {music?.allJudgeCount}</span>
					</div>
					<Tabs fullWidth selectedKey={selectedKey} onSelectionChange={k => setSelectedKey(k as string)} size="sm" data-draggable="true">
						<Tab key="rating" title="Score to Rating" className="p-0 m-0">
							<Input labelPlacement="outside-left" placeholder="Enter score" label="Score" type="number" inputMode="numeric" min="0" max="1010000" step="100"
								size="md" classNames={{ mainWrapper: 'w-full' }}
								value={score} onValueChange={setScore} />
							{musicRating && <div className="sm:text-lg flex mt-2.5 flex-wrap">
								<span className="mt-auto text-sm sm:text-lg">Song rating:&nbsp;</span>
								<ChuniRating rating={musicRating.mul(100).valueOf()} className="inline text-lg max-sm:-mb-1 sm:text-2xl mt-auto">{musicRating.toString()}</ChuniRating>
								{topIncreaseText}
								{badgeDropdown}
							</div>}
						</Tab>
						<Tab key="score" title="Rating to Score" className="p-0 m-0">
							<Input labelPlacement="outside-left" placeholder="Enter rating" label="Rating" type="number" inputMode="numeric" min="0" max={music?.level! + 2.15} step="0.01"
								size="md" classNames={{ mainWrapper: 'w-full' }}
								value={rating} onValueChange={setRating} />
							<div className="mt-2.5 flex">
								{scoreTargetText}
								{reverseScore !== Infinity && topIncreaseText}
								{badgeDropdown}
							</div>
						</Tab>
						<Tab key="note" title="Note Count">
							<div className="flex w-full justify-around text-xs sm:text-sm md:text-medium gap-x-2 items-end">
								{([
									['noteJusticeCritical', 'Justice Critical', 'dark:text-yellow-400 text-yellow-500'],
									['noteJustice', 'Justice', 'text-orange-500'],
									['noteAttack', 'Attack', 'text-emerald-600'],
									['noteMiss', 'Miss', 'text-gray-400']
								] as const).map(([key, name, className]) => (<span key={key} className={`${className} drop-shadow text-center max-sm:flex-1`}>
									{name}&nbsp;
									<Input className="max-sm:mt-1 inline-block max-w-[80px]" size="sm" type="number" inputMode="numeric" min="0" max={music?.allJudgeCount}
										classNames={{ input: '!text-inherit' }} value={noteCount[key]} onValueChange={v => dispatchNote({ [key]: v } as any)} />
								</span>))}
							</div>
							<div className="mt-2.5 flex items-center flex-wrap">
								{scoreTargetText}
								{computedNoteScore !== null && topIncreaseText}
								{computedRating !== null && <div className="w-full flex">
									<span className="text-xs sm:text-sm md:text-medium self-center">Rating:&nbsp;</span>
									<ChuniRating rating={computedRating.mul(100).valueOf()} className="inline-block text-lg sm:text-xl md:text-2xl">
										{computedRating.toString()}
									</ChuniRating>
									{badge}
								</div>}
							</div>
						</Tab>
						<Tab key="top" title="Top Rating" className="p-0 m-0">
							{maxPossibleTopIncrease === null ? <header className="italic text-gray-500 w-full text-center mt-3 max-sm:text-sm">This chart cannot increase your top rating.</header> : <div>
								<div className="w-full text-center text-xs sm:text-sm text-gray-500 mb-3 mt-1">
									Maximum possible increase to top rating: <span className="cursor-pointer underline transition hover:text-foreground"
										onClick={() => setTopRatingIncrease(maxPossibleTopIncrease)}>
										{maxPossibleTopIncrease}
									</span>
								</div>
								<Input labelPlacement="outside-left" placeholder="Enter rating" label="Top rating increase" type="number" inputMode="numeric" min="0" max={maxPossibleTopIncrease} step="0.01"
									size="md" classNames={{ mainWrapper: 'w-full', label: 'text-nowrap mr-1.5' }}
									value={topRatingIncrease}
									onValueChange={setTopRatingIncrease} />
								<div className="mt-2.5 flex items-center">
									{scoreTargetText}
									{targetTotalRating !== null && <span className="max-sm:mt-0.5 text-xs sm:text-sm md:text-medium">&nbsp;(Top rating <ChuniRating className="inline-block text-sm md:text-lg" rating={targetTotalRating.mul(100)?.valueOf()!}>
										{targetTotalRating.toFixed(3)}
									</ChuniRating>{topIndex !== null && `, #${topIndex + 1}`})</span>}
									{badge}
								</div>
							</div>}
						</Tab>
					</Tabs>

					{validScore && selectedKey !== 'note' && <>
						<Divider />
						<section className="text-xs md:text-sm lg:text-medium flex gap-y-2 flex-wrap items-center">
							<span>
								Score {targetScore?.toLocaleString()} with a&nbsp;
							</span>
							<span className="dark:text-yellow-400 text-yellow-500 drop-shadow">Justice&nbsp;</span>
							<span className="dark:text-yellow-400 text-yellow-500 drop-shadow">Critical&nbsp;</span>
							<span>accuracy&nbsp;</span>
							<span>of&nbsp;</span>
							<div>
								<Input className="inline-block w-[83px]" size="sm" inputMode="numeric" type="number" min="0" max="100"
									value={ratio} onValueChange={setRatio} />
								<span>%&nbsp;</span>
							</div>
							<span>is&nbsp;</span>
							{unachievable && <span className="font-bold">not&nbsp;</span>}
							<span>achievable&nbsp;</span>
							{unachievable ? <div className="h-8 w-full" /> : <>
								<span>with&nbsp;</span>
								<span>no&nbsp;</span>
								<span>greater&nbsp;</span>
								<span>than:&nbsp;</span>

								<div className="flex gap-6 max-sm:w-full max-sm:mx-auto ml-auto items-center justify-center">
									{!!justiceCount && <div>
										<span className="text-orange-500">{justiceCount} Justice</span>
									</div>}
									<div>
										<Input className="inline-block w-20 mr-1" size="sm" inputMode="numeric" type="number" min="0" step="1" classNames={{ input: '!text-emerald-600' }}
											value={attack.toString()}
											onInput={e => {
												dispatchScore({
													attack: (e.target as HTMLInputElement).value,
													recompute: (e.nativeEvent as InputEvent).inputType === 'insertReplacementText'
												});
											}}
											onBlur={() => dispatchScore('recompute')}
										/>
										<span className="text-emerald-600">
											Attack
										</span>
									</div>
									<div>
										<Input className="inline-block w-20 mr-1" size="sm" inputMode="numeric" type="number" min="0" step="1" classNames={{ input: '!text-gray-400' }}
											value={miss.toString()} onValueChange={v => dispatchScore({ miss: v })} />
										<span className="text-gray-400">
											Miss
										</span>
									</div>
								</div>
							</>}
						</section>
					</>}
				</ModalBody>
				<ModalFooter>
					<Button color="primary" onPress={onClose}>
						Close
					</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
};
