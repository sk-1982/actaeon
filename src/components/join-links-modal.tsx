import { useEffect, useRef, useState, Fragment } from 'react';
import { Button } from '@nextui-org/button';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { Modal, ModalHeader, ModalContent } from '@nextui-org/modal';
import { Tooltip } from '@nextui-org/tooltip';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import Link from 'next/link';
import { ClipboardDocumentIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useHashNavigation } from '@/helpers/use-hash-navigation';

export type JoinLink = {
	id: string,
	remainingUses: number | null,
	totalUses: number
};

export type JoinLinksModalProps = {
	links: JoinLink[],
	prefix: string,
	onDelete: (id: string) => void,
	onCreate: (remainingUses: number | null) => Promise<string>,
	open: boolean,
	onClose: () => void
};

export const JoinLinksModal = ({ links: initialLinks, prefix, onDelete, onCreate, open, onClose }: JoinLinksModalProps) => {
	const [fullPrefix, setFullPrefix] = useState('');
	const [links, setLinks] = useState(initialLinks);
	const [loading, setLoading] = useState(false);
	const remainingUses = useRef<HTMLInputElement | null>(null);
	const router = useRouter();

	useEffect(() => {
		setFullPrefix(window.location.origin + process.env.NEXT_PUBLIC_BASE_PATH + prefix)
	}, [prefix]);

	const onModalClose = useHashNavigation({
		onClose,
		isOpen: open,
		hash: '#links'
	});

	return (<Modal isOpen={open} onClose={onModalClose} size="5xl">
		<ModalContent>
			{onClose => <>
				<ModalHeader>Invite Links</ModalHeader>
				<ModalBody className="flex flex-col overflow-y-auto gap-0">
					<div className="ml-auto flex gap-3 items-center text-nowrap">
						Create Link
						<Input label="Max uses" className="" placeholder="Unlimited" min={1} size="sm" type="number"
							disabled={loading} ref={remainingUses} />
						<Tooltip content="Create new link">
							<Button isIconOnly disabled={loading} onPress={() => {
								setLoading(true);
								let uses: number | null = +remainingUses.current?.value!;
								if (!Number.isInteger(uses) || uses < 1) uses = null;
								onCreate(uses)
									.then(id => setLinks(l => [{ id, remainingUses: uses, totalUses: 0 }, ...l]))
									.finally(() => setLoading(false))
							}}>
								<PlusIcon className="h-1/2" />
							</Button>
						</Tooltip>
					</div>
					<Divider className="my-2" />
					{!links.length && <div className="italic text-gray-500">No links</div>}
					{links.map(link => (<Fragment key={link.id}>
						<div className="flex items-center gap-x-0.5">
							<Link href={fullPrefix + link.id} prefetch={false}
								className="text-xs md:text-sm lg:text-medium underline text-secondary hover:text-primary transition text-nowrap overflow-hidden">
								{fullPrefix + link.id}
							</Link>

							<Tooltip content="Copy link">
								<Button isIconOnly variant="light" className="ml-auto"
									onPress={() => navigator?.clipboard?.writeText(fullPrefix + link.id)}>
									<ClipboardDocumentIcon className="h-3/4" />
								</Button>
							</Tooltip>
							<Tooltip content={<span className="text-danger">Delete link</span>}>
								<Button isIconOnly variant="light" color="danger" onPress={() => {
									onDelete(link.id);
									setLinks(l => l.filter(l => l.id !== link.id));
								}}>
									<TrashIcon className="h-3/4" />
								</Button>
							</Tooltip>
						</div>
						<div className="flex items-center justify-around pr-8 flex-wrap text-sm sm:text-medium">
							<span><span className="font-semibold">Remaining Uses: </span>{link.remainingUses ?? '∞'}</span>
							<span><span className="font-semibold">Total Uses: </span>{link.totalUses}</span>
						</div>
						<Divider className="my-2" />
					</Fragment>))}
				</ModalBody>
				<ModalFooter>
					<Button color="danger" onPress={onClose}>
						Close
					</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
}
