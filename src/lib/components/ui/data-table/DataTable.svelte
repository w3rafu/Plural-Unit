<script lang="ts" generics="TData">
	import * as Table from "$lib/components/ui/table";
	import type { Table as TanStackTable, Header, Cell } from "@tanstack/table-core";
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		table,
		class: className = "",
		emptyMessage = "No results.",
		toolbar,
	}: {
		table: TanStackTable<TData>;
		class?: string;
		emptyMessage?: string;
		toolbar?: Snippet;
	} = $props();

	function renderHeader<T>(header: Header<T, unknown>): string {
		const def = header.column.columnDef.header;
		if (typeof def === "string") return def;
		if (typeof def === "function") return String(def(header.getContext()) ?? "");
		return "";
	}

	function renderCell<T>(cell: Cell<T, unknown>): string {
		const def = cell.column.columnDef.cell;
		if (typeof def === "string") return def;
		if (typeof def === "function") return String(def(cell.getContext()) ?? "");
		return String(cell.getValue() ?? "");
	}
</script>

{#if toolbar}
	<div class="mb-3 flex items-center gap-2">
		{@render toolbar()}
	</div>
{/if}

<div class={cn("rounded-xl border", className)}>
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head>
							{#if !header.isPlaceholder}
								{renderHeader(header)}
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							{renderCell(cell)}
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={table.getAllColumns().length} class="h-24 text-center">
						{emptyMessage}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
