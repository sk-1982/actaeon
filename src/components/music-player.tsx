'use client';

import { Button, Card, CardBody, Slider } from '@nextui-org/react';
import { PauseCircleIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import { ReactNode, useEffect, useState } from 'react';
import { useAudio } from '@/helpers/use-audio';
import Image from 'next/image';

export type MusicPlayerProps = {
	audio: string,
	image: string,
	children?: ReactNode,
	className?: string
};

const formatTimestamp = (timestamp: number) => {
	if (Number.isNaN(timestamp))
		return '--:--';

	return `${Math.floor(timestamp / 60).toFixed(0)}:${(timestamp % 60).toFixed(0).padStart(2, '0')}`;
};

export const MusicPlayer = ({ audio, image, children, className }: MusicPlayerProps) => {
	const [duration, setDuration] = useState(NaN);
	const [progress, setProgress] = useState(NaN);
	const [playing, setPlaying] = useState(false);

	const audioRef = useAudio(audio, {
		loadedmetadata() {
			if (this.duration !== undefined)
				setDuration(this.duration);
			setProgress(0);
		},
		timeupdate() {
			if (this.currentTime !== undefined)
				setProgress(this.currentTime);
		},
		ended: () => setPlaying(false)
	}, audio => {
		if (!Number.isNaN(audio.duration)) {
			setDuration(audio.duration)
			setProgress(0);
		}
	});

	useEffect(() => {
		if (playing)
			audioRef.current?.play();
		else
			audioRef.current?.pause();
	}, [playing]);

	const percent = (progress / duration) * 100;

	return (<Card isBlurred radius="none" className={`border-none shadow-lg sm:rounded-2xl w-full max-w-full sm:max-w-[48rem] ${className ?? ''}`}>
		<CardBody className="sm:rounded-2xl sm:p-4 bg-content1 sm:bg-content2">
			<div className="grid grid-cols-12">
				<div className="col-span-full sm:col-span-4 h-full flex items-center justify-center sm:justify-start">
					<Image src={image} alt="Jacket" width={224} height={224}
						className="aspect-square rounded-md shadow-2xl max-w-56 w-full border border-gray-500 sm:border-0" />
				</div>
				<div className="col-span-full sm:col-span-8 h-full flex flex-col pt-4 sm:pt-0 sm:pl-4 text-xl">
					<div className="mb-2 sm:my-auto flex flex-col gap-1 items-center sm:items-start overflow-hidden">
						{children}
					</div>
					<div className="mt-auto flex flex-col items-center">
						<Slider className="cursor-pointer" size="sm" minValue={0} maxValue={100} step={0.0001}
							value={Number.isNaN(percent) ? 0 : percent}
							onChange={v => {
								if (audioRef.current && !Array.isArray(v))
									audioRef.current.currentTime = v / 100 * duration;
							}}/>
						<div className="flex text-medium w-full">
							<span>{formatTimestamp(Math.min(progress, duration))}</span>
							<Button isIconOnly radius="full" variant="light" size="lg" className="mx-auto mt-1" onClick={() => setPlaying(p => !p)}>
								{playing ? <PauseCircleIcon /> : <PlayCircleIcon />}
							</Button>
							<span>{formatTimestamp(duration)}</span>
						</div>
					</div>
				</div>
			</div>
		</CardBody>
	</Card>)
};
