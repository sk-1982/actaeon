import { choice, choices } from './random';

export const generateAccessCode = () => {
	return choice('012456789') + choices('0123456789', 19).join('');
};
