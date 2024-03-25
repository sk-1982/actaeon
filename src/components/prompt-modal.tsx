import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Button, Input, InputProps, Modal, ModalContent, ModalHeader } from '@nextui-org/react';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

type PromptOptions = { title: string, message: string } &
	Partial<Pick<InputProps, 'type' | 'name' | 'label' | 'placeholder'>>;
type PromptCallback = (options: PromptOptions, onConfirm: (val: string) => void, onCancel?: () => void) => void;
const PromptContext = createContext<PromptCallback>(() => {});

export const PromptProvider = ({ children }: { children: ReactNode }) => {
	const [options, setOptions] = useState<PromptOptions | null>(null);
	const confirmCallback = useRef<(val: string) => void>();
	const cancelCallback = useRef<() => void>();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const setPrompt: PromptCallback = useCallback((options, onConfirm, onCancel) => {
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

	const { title, message, ...inputProps } = options ?? {};

	return (<>
		<Modal isOpen={options !== null} onClose={onModalClose}>
			<ModalContent>
				{onClose => <>
					<ModalHeader className="text-danger">{ title }</ModalHeader>
					<ModalBody>
						{ message }
						<Input type="text" size="sm" {...inputProps} ref={inputRef} />
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
								setTimeout(confirmCallback.current, 5, inputRef.current?.value ?? '');
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
