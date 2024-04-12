import { ServerStatus } from '@/data/status';
import { CHUNI_VERSIONS } from '@/types/game-versions';
import { CardBody, CardHeader, Card } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';

export const ActaeonStatus = ({ status, className }: { status: ServerStatus, className?: string }) => { 
	return (<Card className={`${className} px-2 py-1`}>
		<CardHeader className="font-semibold text-lg md:text-2xl pb-3">
			Actaeon Status
		</CardHeader>
		<Divider />
		<CardBody className="pt-2 flex flex-col flex-wrap gap-0.5 md:text-lg overflow-hidden">
			<span><span className="font-semibold">User Count: </span>{status.userCount}</span>
			{!!status.teamCount && <span><span className="font-semibold">Team Count: </span>{status.teamCount}</span>}
			{!!status.arcadeCount && <span><span className="font-semibold">Arcade Count: </span>{status.arcadeCount}</span>}
			{status.chuniVersion !== null && <span><span className="font-semibold">Latest Chunithm Version: </span>{CHUNI_VERSIONS[status.chuniVersion]}</span>}
		</CardBody>
	</Card>)
};
