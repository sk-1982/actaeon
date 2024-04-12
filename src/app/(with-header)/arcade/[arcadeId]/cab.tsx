import { ArcadeCab } from '@/data/arcade';
import { GAME_IDS } from '@/types/game-ids';
import { COUNTRY_CODES } from '@/types/country';
import { useConfirmModal } from '@/components/confirm-modal';
import { useUser } from '@/helpers/use-user';
import { hasArcadePermission } from '@/helpers/permissions';
import { ArcadePermissions } from '@/types/permissions';
import { Autocomplete, AutocompleteItem } from '@nextui-org/autocomplete';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import { Textarea, Input } from '@nextui-org/input';
import { SelectItem, Select } from '@nextui-org/select';
import { Tooltip } from '@nextui-org/tooltip';
import { ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createMachine, deleteMachine, updateMachine } from '@/actions/machine';
import { useRef, useState } from 'react';
import { Entries } from 'type-fest';
import { useErrorModal } from '@/components/error-modal';
import { generateRandomKeychip } from '@/helpers/keychip';

type CabProps = {
	cab?: ArcadeCab,
	permissions: number | null,
	onDelete: () => void,
	onEdit?: (cab: ArcadeCab) => void,
	onNewData?: (cab: ArcadeCab[]) => void,
	creatingNew?: boolean
};

const formatSerial = (s: string) => {
	s = s.replace(/[-\s]/g, '');
	if (s.length < 4) return s;
	return `${s.slice(0, 4)}-${s.slice(4)}`;
};

export const Cab = ({ cab: initialCab, permissions, onEdit, onNewData, onDelete, creatingNew }: CabProps) => {
	const confirm = useConfirmModal();
	const user = useUser();
	const [cab, setCab] = useState(initialCab ? {
		...initialCab,
		serial: initialCab?.serial ? formatSerial(initialCab.serial) : initialCab.serial,
		board: initialCab?.board ? formatSerial(initialCab.board) : initialCab.board,
	} : ({} as ArcadeCab));
	const restoreCab = useRef({ ...cab });
	const [editing, setEditing] = useState(false);
	const [gameInput, setGameInput] = useState('');
	const [loading, setLoading] = useState(false);
	const setError = useErrorModal();

	const save = () => {
		setLoading(true);
		const { id, arcade, ...update } = cab;
		update.game ??= gameInput;

		(Object.entries(update) as Entries<ArcadeCab>).forEach(([k, v]) => {
			if (typeof v === 'string')
				(update as any)[k] = v = v.trim();
			if (v === '') (update as any)[k] = null;
		});

		if (creatingNew)
			return createMachine({ arcade, update })
				.then(res => {
					if (res?.error)
						return setError(res.message);
					onNewData?.(res.data)
					onDelete?.();
				})
				.finally(() => setLoading(false))

		updateMachine({ arcade, machine: id, update })
			.then(res => {
				if (res?.error)
					return setError(res.message);
				setEditing(false);
				setCab(c => ({ ...cab, ...update }));
				onEdit?.({ ...cab, ...update });
			})
			.finally(() => setLoading(false))
	};

	const renderEdit = (k: keyof ArcadeCab) => {
		if (k === 'game')
			return (<Autocomplete label="Game"
				isDisabled={loading}
				allowsCustomValue
				size="sm"
				onInputChange={setGameInput}
				inputValue={cab.game === undefined ? gameInput : undefined}
				selectedKey={cab.game}
				onSelectionChange={s => setCab(c => ({ ...c, game: s?.toString() }))}>
				{[...GAME_IDS].map(([id, name]) => (<AutocompleteItem key={id} textValue={`${id} (${name})`}>
					{id} ({name})
				</AutocompleteItem>))}
			</Autocomplete>);

		if (k === 'country')
			return (<Select label="Country" key={k} isDisabled={loading} size="sm"
				selectedKeys={new Set(cab.country ? [cab.country] : [])}
				onSelectionChange={s => typeof s !== 'string' && setCab(c => ({ ...c, country: [...s][0]?.toString() ?? null }))}>
				{[...COUNTRY_CODES].map(([code, name]) => <SelectItem key={code}>
					{name}
				</SelectItem>)}
			</Select>)

		if (k === 'ota_enable' || k === 'is_cab')
			return (<Checkbox className="text-nowrap mr-0.5 row-start-4 my-1" size="lg" isSelected={!!cab[k]} isDisabled={loading}
				onValueChange={v => setCab(c => ({ ...c, [k]: +v }))}>
				{k === 'ota_enable' ? 'OTA Enabled' : 'Is Cab'}
			</Checkbox>)

		const setFormatSerial = () => setCab(c => c.serial ?
			({ ...c, serial: formatSerial(c.serial) }) :
			c
		);

		if (k === 'serial')
			return (<div key={k} className="w-full h-full flex rounded-lg overflow-hidden">
				<Input isRequired size="sm" isDisabled={loading} label="Keychip" radius="none" className="h-full"
					onBlur={setFormatSerial}
					onFocus={setFormatSerial}
					maxLength={16}
					onValueChange={v => setCab(c => ({
						...c,
						serial: v.toUpperCase()
					}))}
					value={cab.serial ?? ''} />
				<Tooltip content="Generate random keychip">
					<Button isIconOnly isDisabled={loading} color="primary" size="lg"  radius="none"
						onPress={() => setCab(c => ({ ...c, serial: formatSerial(generateRandomKeychip()) }))}>
						<ArrowPathIcon className="h-7" />
					</Button>
				</Tooltip>
			</div>)

		return (<Input key={k} value={cab[k]?.toString() ?? ''}
			size="sm" isDisabled={loading}
			onValueChange={val => setCab(c =>
				({ ...c, [k]: k === 'board' ? val.toUpperCase() : val }))}
			label={`${k[0].toUpperCase()}${k.slice(1)}`} />);
	};

	if (creatingNew || editing) return (<section
		className="p-4 rounded-lg bg-content1 flex flex-col gap-2 mb-2 shadow">
		<div className="grid grid-cols-2 gap-2 justify-items-center md:grid-cols-3 lg:flex">
			{(['game', 'serial', 'board', 'country', 'timezone', 'ota_enable', 'is_cab'] as const).map(renderEdit)}

		</div>

		<Textarea label="Comment" placeholder="Enter comment" className="w-full" isDisabled={loading}
			value={cab.memo ?? ''} onValueChange={memo => setCab(c => ({ ...c, memo }))} />
		<div className="w-full sm:w-auto flex self-end">
			<Button className="mr-2 flex-grow" variant="light" color="danger" isDisabled={loading} onPress={() => {
				setEditing(false);
				setCab(restoreCab.current);
				if (creatingNew) onDelete();
			}}>
				Cancel
			</Button>
			<Button className="flex-grow" color="primary" isDisabled={loading} onPress={save}>
				Save
			</Button>
		</div>
	</section>);

	if (!cab) return null;

	return (
		<section
			className="p-4 rounded-lg shadow bg-content1 flex flex-wrap text-xs sm:text-sm md:text-medium gap-x-4 gap-y-2 items-center mb-2">
			<header className="text-lg font-semibold">
				{cab.game ? <>
					{GAME_IDS.has(cab.game) ? `${GAME_IDS.get(cab.game)} (${cab.game})` : cab.game}
				</> : 'Unknown Game'}
			</header>

			{cab.serial && <span>
				<span className="font-semibold">Keychip: </span>{formatSerial(cab.serial)}
			</span>}

			{cab.board && <span>
				<span className="font-semibold">Board: </span>{formatSerial(cab.board)}
			</span>}

			{cab.country && <span>
				<span className="font-semibold">Country: </span>{COUNTRY_CODES.get(cab.country) ?? cab.country}
			</span>}

			{cab.timezone && <span>
				<span className="font-semibold">Timezone: </span>{cab.timezone}
			</span>}

			<span>
				<span className="font-semibold">OTA Enabled: </span>{cab.ota_enable ? 'Yes' : 'No'}
			</span>

			<span>
				<span className="font-semibold">Is Cab: </span>{cab.is_cab ? 'Yes' : 'No'}
			</span>

			{hasArcadePermission(permissions, user?.permissions, ArcadePermissions.REGISTRAR) &&
				<div className="ml-auto flex gap-2">
					<Tooltip content={<span className="text-danger">Delete this machine</span>}>
						<Button isIconOnly color="danger" variant="light" onPress={() =>
							confirm('This action cannot be undone.',
								() => deleteMachine(cab.arcade, cab.id).then(onDelete))}>
							<TrashIcon className="h-1/2" />
						</Button>
					</Tooltip>
					<Tooltip content="Edit">
						<Button isIconOnly variant="flat" onPress={() => {
							setEditing(true);
							restoreCab.current = { ...cab };
						}}>
							<PencilIcon className="h-1/2" />
						</Button>
					</Tooltip>
				</div>}

			{cab.memo && <summary className="block w-full">
				<span className="font-semibold">Comment: </span>
				<span className="text-xs sm:text-sm">{cab.memo}</span>
			</summary>}
		</section>
	);
};
