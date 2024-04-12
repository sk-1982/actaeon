import { generateAccessCode } from '@/helpers/access-code';
import { PromptCallback } from './prompt-modal';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Tooltip } from '@nextui-org/tooltip';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const promptAccessCode = (prompt: PromptCallback, message: string, onConfirm: (val: string) => void) => {
	prompt({
		size: '2xl',
		title: 'Enter Access Code', content: (val, setVal) => <>
			{message}
			<div className="flex overflow-hidden rounded-lg">
				<Input label="Access Code" inputMode="numeric" size="sm" type="text" maxLength={24} radius="none"
					classNames={{ input: `[font-feature-settings:"fwid"] text-xs sm:text-sm` }}
					value={val.match(/.{1,4}/g)?.join('-') ?? ''}
					onValueChange={v => setVal(v.replace(/\D/g, ''))} />
				<Tooltip content="Generate Random Code">
					<Button isIconOnly color="primary" size="lg" radius="none" onPress={() => setVal(generateAccessCode())}>
						<ArrowPathIcon className="h-7" />
					</Button>
				</Tooltip>
			</div>
		</>
	}, v => onConfirm(v.replace(/\D/g, '')));
};
