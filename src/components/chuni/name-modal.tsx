import { Modal, ModalBody, ModalContent, ModalHeader, ModalFooter } from '@nextui-org/modal';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { useEffect, useRef, useState } from 'react';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

const SYMBOLS = `・×÷♂♀∀☆○◎◇□△▽♪†‡ΣαβγθφψωДё`;
const ALLCHARS = new Set([...`　＃＆＊．＠＋－＝：；？！～／ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９${SYMBOLS}`]);

const FULLWIDTHS = new Map([...ALLCHARS]
	.map(c => [c.normalize('NFKC'), c]));

const normalizeUsername = (s: string) => [...s.normalize('NFKC')]
	.map(c => {
		if (c === 'ë') return 'ё'; // u+003b (latin small letter with diaeresis) -> u+0451 (cyrillic small letter io)
		return FULLWIDTHS.get(c) ?? c;
	}).join('');

type ChuniNameModalProps = {
	username: string,
	setUsername: (u: string) => void,
	isOpen: boolean,
	onClose: () => void
};

export const ChuniNameModal = ({ onClose, isOpen, username, setUsername }: ChuniNameModalProps) => {
	const [editingUsername, setEditingUsername] = useState(username);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const previousOpen = useRef(false);
	const onModalClose = useHashNavigation({
		onClose,
		isOpen,
		hash: '#edit-username'
	});

	let warnings: string[] = [];

	if ([...editingUsername].length > 8)
		warnings.push('Your username is longer than 8 characters. It may be squished in-game.');
	if ([...editingUsername].some(c => !ALLCHARS.has(c)))
		warnings.push('Your username contains characters not typically used in-game. It may not show correctly.');

	useEffect(() => { 
		if (isOpen && !previousOpen.current)
			setEditingUsername(username);
		previousOpen.current = isOpen;
	}, [isOpen, username, previousOpen]);

	return (<Modal size="3xl" isOpen={isOpen} onClose={onModalClose}>
		<ModalContent>
			{onModalClose => <>
				<ModalBody className="max-sm:px-2">
					<ModalHeader>Change Username</ModalHeader>
					{!editingUsername.length && <div className="flex text-danger mb-2 items-center max-sm:text-sm">
						<ExclamationCircleIcon className="h-6 sm:h-7 mr-1.5" />
						You cannot have an empty username
					</div>}
					{warnings.map(warning => <div key={warning} className="flex text-warning mb-2 items-center max-sm:text-sm">
						<ExclamationTriangleIcon className="h-6 sm:h-7 mr-1.5" />
						{warning}
					</div>)}	
					<Input placeholder="Username" label="Username"
						maxLength={25}
						value={editingUsername}
						isRequired
						onValueChange={v => setEditingUsername(normalizeUsername(v))}
						ref={inputRef}
						className="max-sm:px-2"
						classNames={{ input: `[font-feature-settings:"fwid"] font-semibold` }} />
					<div className="flex flex-wrap gap-0.5 sm:gap-1 w-full justify-center">
						{[...SYMBOLS].map(s => <div key={s}
							className={`[font-feature-settings:"fwid"] font-bold sm:text-2xl sm:h-12 sm:w-12 h-10 w-10 border-2 border-divider flex items-center justify-center rounded-xl cursor-pointer transition hover:bg-content2 select-none`}
							onClick={(e) => {
								e.preventDefault();
								setEditingUsername(val => {
									if (!inputRef.current || [...val].length >= 25) return val;
									const chars = [...val];
									const { selectionStart, selectionEnd } = inputRef.current;
									inputRef.current.focus();
									setTimeout(() => {
										inputRef.current!.focus();
										inputRef.current!.selectionStart = selectionStart! + 1;
										inputRef.current!.selectionEnd = selectionStart! + 1;
									});
									return chars.slice(0, selectionStart!).join('') + s + chars.slice(selectionEnd!).join('');
								})
							}}>
							{s}
						</div>)}
					</div>
				</ModalBody>
				<ModalFooter>
					<Button variant="light" color="danger" onPress={onModalClose}>Cancel</Button>
					<Button color="primary" isDisabled={!editingUsername}
						onPress={() => { onModalClose(); setUsername(editingUsername); }}>Set</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
};
