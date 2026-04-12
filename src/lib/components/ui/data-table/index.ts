import {
	createTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	type TableOptions,
	type TableOptionsResolved,
	type RowData,
	type ColumnDef,
	type Table,
	type SortingState,
	type ColumnFiltersState,
} from "@tanstack/table-core";

export type { ColumnDef, Table, SortingState, ColumnFiltersState };

/**
 * Creates a reactive TanStack Table instance for Svelte 5.
 *
 * Usage:
 * ```ts
 * const table = createSvelteTable({
 *   get data() { return rows; },
 *   columns,
 *   getCoreRowModel: getCoreRowModel(),
 * });
 * ```
 */
export function createSvelteTable<TData extends RowData>(
	options: TableOptions<TData>
): Table<TData> {
	const resolvedOptions: TableOptionsResolved<TData> = {
		state: {},
		onStateChange() {},
		renderFallbackValue: null,
		...options,
	};

	const table = createTable(resolvedOptions);

	let tableState = $state(table.initialState);

	table.setOptions((prev) => ({
		...prev,
		...options,
		state: { ...tableState, ...options.state },
		onStateChange: (updater) => {
			if (typeof updater === "function") {
				tableState = updater(tableState);
			} else {
				tableState = updater;
			}
			options.onStateChange?.(updater);
		},
	}));

	// Re-apply options on each access so reactive data flows through.
	return new Proxy(table, {
		get(target, prop, receiver) {
			// Re-sync options before reading any property.
			target.setOptions((prev) => ({
				...prev,
				...options,
				state: { ...tableState, ...options.state },
				onStateChange: (updater) => {
					if (typeof updater === "function") {
						tableState = updater(tableState);
					} else {
						tableState = updater;
					}
					options.onStateChange?.(updater);
				},
			}));
			return Reflect.get(target, prop, receiver);
		},
	});
}

export { getCoreRowModel, getSortedRowModel, getFilteredRowModel };
