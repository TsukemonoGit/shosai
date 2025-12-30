<script lang="ts">
	import type { MenuItem } from '$lib/types/utiles';
	import { Menu } from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		trigger: Snippet;
		items: MenuItem[];
		onSelect: (itemId: string) => void;
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	}

	let { trigger, items, onSelect, align = 'start', sideOffset = 3 }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="flex items-center rounded-md bg-neutral-200 p-1 text-sm font-medium text-neutral-800 hover:bg-neutral-300  dark:bg-neutral-700 dark:text-neutral-200 hover:dark:bg-neutral-600"
	>
		{#if trigger}
			{@render trigger()}
		{:else}<Menu />{/if}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="focus-override shadow-popover z-50 w-full max-w-55 rounded-xl border bg-neutral-200 px-1 py-1.5 focus-visible:outline-hidden dark:bg-neutral-800"
			{align}
			{sideOffset}
		>
			{#each items as item}
				{#if item.separator}
					<DropdownMenu.Separator class="my-1 h-px bg-neutral-300 dark:bg-neutral-600" />
				{:else}
					<DropdownMenu.Item
						class="data-highlighted:bg-muted flex h-10 items-center rounded-md py-3 pr-1.5 pl-3 text-sm font-medium select-none hover:bg-neutral-300 focus-visible:outline-none dark:hover:bg-neutral-600"
						onclick={() => onSelect(item.id)}
					>
						{#if item.Icon}
							<item.Icon class="mr-1" size="20" />
						{/if}
						{item.label}
					</DropdownMenu.Item>
				{/if}
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
