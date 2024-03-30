import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Button, Input, InputProps, Modal, ModalContent, ModalHeader } from '@nextui-org/react';
import { ModalBody, ModalFooter, ModalProps } from '@nextui-org/modal';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

type PromptOptions = { title: string, size?: ModalProps['size'] } &
	(({ message: string, content?: never } & Partial<Pick<InputProps, 'type' | 'name' | 'label' | 'placeholder'>>) |
	{ content: (value: string, setValue: (v: string) => void) => ReactNode, message?: never });
type PromptCallback = (options: PromptOptions, onConfirm: (val: string) => void, onCancel?: () => void) => void;
const PromptContext = createContext<PromptCallback>(() => {});

export const PromptProvider = ({ children }: { children: ReactNode }) => {
	const [options, setOptions] = useState<PromptOptions | null>(null);
	const confirmCallback = useRef<(val: string) => void>();
	const cancelCallback = useRef<() => void>();
	const [value, setValue] = useState('');

	const setPrompt: PromptCallback = useCallback((options, onConfirm, onCancel) => {
		setValue('');
		setOptions(options);
		confirmCallback.current = onConfirm;
		cancelCallback.current = onCancel;
	}, []);

	const close = () => {
		setOptions(null);
		confirmCallback.current = undefined;
		cancelCallback.current = undefined;
	};

	const onModalClose = useHashNavigation({
		onClose: close,
		isOpen: options !== null,
		hash: '#prompt'
	});

	const { title, message, size, content, ...inputProps } = options ?? {};

	return (<>
		<Modal isOpen={options !== null} onClose={onModalClose} size={size}>
			<ModalContent>
				{onClose => <>
					<ModalHeader>{ title }</ModalHeader>
					<ModalBody>
						{content ? content(value, setValue) : <>{ message }
							<Input type="text" size="sm" {...inputProps} value={value} onValueChange={setValue} />
						</>}
					</ModalBody>
					<ModalFooter className="gap-2">
						<Button onPress={() => {
							if (cancelCallback.current)
								setTimeout(cancelCallback.current, 5);
							onClose();
						}} color="danger" variant="light" >
							Cancel
						</Button>
						<Button onPress={() => {
							if (confirmCallback.current)
								setTimeout(confirmCallback.current, 100, value ?? '');
							onClose();
						}} color="primary">
							Confirm
						</Button>
					</ModalFooter>
				</>}
			</ModalContent>
		</Modal>
		<PromptContext.Provider value={setPrompt}>
			{children}
		</PromptContext.Provider>
	</>);
}

export const usePromptModal = () => useContext(PromptContext);
