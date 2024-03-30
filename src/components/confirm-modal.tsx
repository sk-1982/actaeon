import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader } from '@nextui-org/react';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

type ConfirmCallback = (message: ReactNode, onConfirm: () => void, onCancel?: () => void) => void;
const ConfirmContext = createContext<ConfirmCallback>(() => {});

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
	const [message, setMessage] = useState<ReactNode | null>(null);
	const confirmCallback = useRef<() => void>();
	const cancelCallback = useRef<() => void>();

	const setConfirm: ConfirmCallback = useCallback((message, onConfirm, onCancel) => {
		setMessage(message);
		confirmCallback.current = onConfirm;
		cancelCallback.current = onCancel;
	}, []);

	const close = () => {
		setMessage(null);
		confirmCallback.current = undefined;
		cancelCallback.current = undefined;
	};

	const onModalClose = useHashNavigation({
		onClose: close,
		isOpen: message !== null,
		hash: '#confirm'
	});

	return (<>
		<Modal isOpen={message !== null} onClose={onModalClose}>
			<ModalContent>
				{onClose => <>
					<ModalHeader className="text-danger">Are you sure?</ModalHeader>
					<ModalBody>{message}</ModalBody>
					<ModalFooter className="gap-2">
						<Button onPress={() => {
							if (cancelCallback.current)
								setTimeout(cancelCallback.current, 100);
							onClose();
						}} >
							Cancel
						</Button>
						<Button onPress={() => {
							if (confirmCallback.current)
								setTimeout(confirmCallback.current, 100);
							onClose();
						}} color="danger">
							Confirm
						</Button>
					</ModalFooter>
				</>}
			</ModalContent>
		</Modal>
		<ConfirmContext.Provider value={setConfirm}>
			{children}
		</ConfirmContext.Provider>
	</>);
}

export const useConfirmModal = () => useContext(ConfirmContext);
