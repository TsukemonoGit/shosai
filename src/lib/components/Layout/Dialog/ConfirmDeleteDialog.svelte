<script lang="ts">
	import { t } from '@konemono/svelte5-i18n';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import TagRenderer from '../../Bookmark/TagRenderer.svelte';
	import type { DndTagItem } from '$lib/types/utiles';

	interface Props {
		disabled: boolean;
		onConfirm: () => void;
		selectedTags: DndTagItem[];
	}
	let { disabled, onConfirm, selectedTags }: Props = $props();

	let isOpen = $state(false);
</script>

<button
	{disabled}
	onclick={() => (isOpen = true)}
	class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 dark:disabled:bg-red-700"
>
	{$t('deleteConfirm.trigger')}
</button>

<ConfirmDialog
	bind:open={isOpen}
	title={$t('deleteConfirm.title')}
	description={$t('deleteConfirm.description', { count: selectedTags.length })}
	okText={$t('common.delete')}
	{onConfirm}
>
	{#snippet children()}
		<div
			class="flex max-h-60 flex-col items-start divide-y divide-neutral-500 overflow-y-auto pt-7 pb-11"
		>
			{#each selectedTags as id}
				<TagRenderer tag={id.tag} />
			{/each}
		</div>
	{/snippet}
</ConfirmDialog>
