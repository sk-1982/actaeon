import { Button, Input, InputProps, Modal, ModalContent, ModalHeader, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { ModalBody, ModalFooter } from '@nextui-org/modal';

export type DateSelectProps = {
	range: DateRange | undefined,
	onChange: (range: DateRange | undefined) => void
} & Omit<InputProps, 'isReadOnly' | 'value' | 'onChange'>;

export const DateSelect = ({ range, onChange, ...inputProps }: DateSelectProps) => {
	const [open, setOpen] = useState(false);
	const breakpoint = useBreakpoint();

	const dayPicker = (<DayPicker mode="range"
		toDate={new Date()}
		fromDate={new Date(2015, 1, 1)}
		selected={range}
		onSelect={onChange}
		captionLayout="dropdown-buttons"
		showOutsideDays
		className="!m-0 !sm:m-2"
	/>);

	return (<>
		<Modal isOpen={!breakpoint && open} onOpenChange={setOpen}>
			<ModalContent className="flex flex-col items-center overflow-hidden">{onClose => <>
				<ModalHeader className="w-full">{ inputProps.placeholder ?? 'Select date range' }</ModalHeader>
				<ModalBody>{ dayPicker }</ModalBody>
				<ModalFooter className="w-full">
					<Button color="primary" className="self-baseline">Close</Button>
				</ModalFooter>
			</>}</ModalContent>
		</Modal>
		<Popover isOpen={breakpoint !== undefined && open} onOpenChange={setOpen}>
			<PopoverTrigger className="aria-expanded:scale-1 aria-expanded:opacity-100 select-none">
				<div className="w-full">
					<Input value={(range?.from || range?.to) ? `${range?.from?.toLocaleDateString() ?? ''}\u2013${range?.to?.toLocaleDateString() ?? ''}` : ''}
						type="text" {...inputProps} isReadOnly />
				</div>
			</PopoverTrigger>
			<PopoverContent>
				{ dayPicker }
			</PopoverContent>
		</Popover>
	</>);
};
