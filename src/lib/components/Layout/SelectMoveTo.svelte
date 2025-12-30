<script lang="ts">
	import { Label, RadioGroup } from 'bits-ui';
	import { t } from '@konemono/svelte5-i18n';
	import { type BookmarkItem } from '$lib/types/bookmark.svelte';
	import ConfirmDialog from './Dialog/ConfirmDialog.svelte';
	import { toastStore } from '$lib/utils/util';

	interface RadioItem {
		kind: string;
		label: string;
	}

	interface Props {
		item: BookmarkItem;
		onconfirm: (props: { kind: number; id: string }) => void;
	}

	let { item, onconfirm }: Props = $props();

	let radioItems: RadioItem[] = $derived([
		{ kind: '10003', label: $t('bookmark.sections.10003') },
		{ kind: '30003', label: $t('bookmark.sections.30003') },
		{ kind: '30001', label: $t('bookmark.sections.30001') }
	]);

	let radioValue: string = $state('');
	let inputId: string = $state('');

	function myAttach(el: any) {
		//console.log('mounted', el);
		inputId = item.identifier || '';

		return () => {
			inputId = '';
			//console.log('cleanup');
		};
	}

	let comfirmOpen = $state(false);
</script>

<RadioGroup.Root
	bind:value={radioValue}
	class="border-dark-40 my-2 flex flex-col gap-2 rounded border p-2 text-sm font-medium"
>
	{#each radioItems as it}
		<div class="text-foreground group flex items-center transition-all select-none">
			<RadioGroup.Item
				id={it.kind}
				value={it.kind}
				disabled={item.event.kind === 10003 && it.kind === '10003'}
				class="border-border-input bg-background hover:border-dark-40 data-[state=checked]:border-foreground size-5 shrink-0 cursor-default rounded-full border transition-all duration-100 ease-in-out data-[state=checked]:border-6 "
			/>
			<Label.Root for={it.kind} class="pl-3 ">{it.label} (kind:{it.kind.toString()})</Label.Root>
		</div>
	{/each}
</RadioGroup.Root>

{#if radioValue !== radioItems[0].kind}
	<!---->
	ID: <input {@attach myAttach} bind:value={inputId} class="border-b" />
{/if}

<button
	class="h-input rounded-input shadow-mini float-end mt-1 inline-flex items-center justify-center bg-blue-600 px-12.5 text-[15px] font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-[0.98]"
	onclick={() => {
		if (radioValue !== '10003' && inputId === '') {
			toastStore.error({
				title: $t('bookmark.error'),
				description: `input ID`
			});
		} else {
			comfirmOpen = true;
		}
	}}>OK</button
>

<ConfirmDialog
	bind:open={comfirmOpen}
	title={$t('moveList.confirm.title')}
	description={$t('moveList.confirm.desc', {
		from: `${$t(`bookmark.sections.${item.event.kind}`)} ${item.identifier || ''}`,
		to: `${$t(`bookmark.sections.${radioValue}`)} ${inputId}`
	})}
	okText={$t('common.move')}
	onConfirm={() => onconfirm({ kind: Number(radioValue), id: inputId })}
></ConfirmDialog>
