'use client';

import { createContext, ReactNode, useContext, useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader } from '@nextui-org/react';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

const ErrorContext = createContext<(err: string) => void>(() => {});

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
	const [error, setError] = useState<string | null>(null);

	const onModalClose = useHashNavigation({
		onClose: () => setError(null),
		isOpen: !!error,
		hash: '#error'
	});

	return (<>
		<Modal isOpen={!!error} onClose={onModalClose}>
			<ModalContent>
				{onClose => <>
					<ModalHeader className="text-danger">
						Error
					</ModalHeader>
					<ModalBody>
						{error}
					</ModalBody>
					<ModalFooter>
						<Button onPress={onClose}>
							Close
						</Button>
					</ModalFooter>
				</>}
			</ModalContent>
		</Modal>
		<ErrorContext.Provider value={setError}>
			{children}
		</ErrorContext.Provider>
	</>)
};

export const useErrorModal = () => useContext(ErrorContext);
