import { AliasNode, ColumnNode, IdentifierNode, ReferenceNode, sql, RawBuilder, Selection, Simplify, ExpressionBuilder, SelectExpression, OperationNode } from 'kysely';
import { DBJSONPrimitive, ParseableToJSON } from '@/types/json-parseable';


const parseNodeToArgs = (node: OperationNode) => {
	let name: string | null = null;

	if (AliasNode.is(node)) {
		if (!IdentifierNode.is(node.alias))
			throw TypeError(`unexpected alias type ${node.alias}`)
		name = node.alias.name;
		node = node.node;
	}

	if (!ReferenceNode.is(node))
		throw TypeError(`unexpected node type ${node.kind}`);

	if (!ColumnNode.is(node.column))
		throw TypeError('cannot use select all with json');

	name ??= node.column.column.name;
	let identifier: string = '`' + node.column.column.name + '`';
	if (node.table)
		identifier = '`' + node.table.table.identifier.name + '`.' +identifier;

	return [`'${name}'`, identifier];
}

export const jsonObjectArray = <DB, TB extends keyof DB, SE extends SelectExpression<DB, TB>>(eb: ExpressionBuilder<DB, TB>, selections: ReadonlyArray<SE>):
	RawBuilder<ParseableToJSON<Simplify<DBJSONPrimitive<Selection<DB, TB, SE>>>[]>> => {
	const args: string[] = [];

	for (const selection of selections) {
		let node: OperationNode;

		if (typeof selection === 'string') {
			if (selection.includes(' as ')) {
				const [col, as] = selection.split(' as ').map(s => s.trim());
				node = eb.ref(col as any).as(as).toOperationNode();
			} else {
				node = eb.ref(selection as any).toOperationNode();
			}
		} else if (typeof selection === 'function') {
			node = selection(eb).toOperationNode();
		} else {
			node = selection.toOperationNode();
		}

		args.push(...parseNodeToArgs(node));
	}

	return sql`JSON_ARRAYAGG(JSON_OBJECT(${sql.raw(args.join(','))}))`;
}
