import { AliasedExpression, AliasNode, ColumnNode, Expression, IdentifierNode, ReferenceNode, sql } from 'kysely';

export const jsonObjectArray = (...refs: (Expression<any> | AliasedExpression<any, string>)[]) => {
	const args: string[] = [];

	for (const ref of refs) {
		let node = ref.toOperationNode();
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
		args.push(`'${name}'`);

		let identifier: string = '`' + node.column.column.name + '`';
		if (node.table)
			identifier = '`' + node.table.table.identifier.name + '`.' +identifier;
		args.push(identifier);
	}

	return sql<string>`JSON_ARRAYAGG(JSON_OBJECT(${sql.raw(args.join(','))}))`;
};
