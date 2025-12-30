<script lang="ts">
	import { t } from '@konemono/svelte5-i18n';
	import { Trash2 } from '@lucide/svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import type { BookmarkItem } from '$lib/types/bookmark.svelte';

	interface Props {
		disabled?: boolean;
		onConfirm: () => void;
		item: BookmarkItem;
		isSelected?: boolean;
	}
	let { disabled = false, onConfirm, item, isSelected = false }: Props = $props();

	let isOpen = $state(false);
</script>

<button
	{disabled}
	onclick={() => (isOpen = true)}
	class="rounded p-1 text-neutral-500 transition-opacity hover:bg-red-500 hover:text-white {isSelected
		? 'opacity-100'
		: 'opacity-0 group-hover:opacity-100'}"
	aria-label={$t('common.delete')}
>
	<Trash2 size="16" />
</button>

<ConfirmDialog
	bind:open={isOpen}
	title={$t('deleteItem.title')}
	description={$t('deleteItem.description', {
		name: item.title || item.identifier || item.event.kind
	})}
	okText={$t('common.delete')}
	{onConfirm}
/>
