import 'react-grid-layout';

type CalcGridColParams = {
	margin: [number, number],
	containerPadding: [number, number],
	containerWidth: number,
	cols: number;
};
const calcGridColWidth: (pos: CalcGridColParams) => number;

const calcGridItemWHPx: (gridUnits: number, colOrRowSize: number, marginPx: number) => number;

declare module 'react-grid-layout' {
	export const calculateUtils = { calcGridColWidth, calcGridItemWHPx };
}
