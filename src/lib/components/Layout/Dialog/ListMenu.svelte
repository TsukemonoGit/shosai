<script lang="ts">
	import { Delete, ExternalLink, FileBraces, Menu, NotebookTabs, Share } from '@lucide/svelte';
	import { t } from '@konemono/svelte5-i18n';
	import { X } from '@lucide/svelte';

	import { type QueryKey } from '@tanstack/svelte-query';
	import { type EventParameters, type Event as NostrEvent } from 'nostr-typedef';
	import JsonView from './JsonView.svelte';
	import { nostrShare, queryClient, shareText } from '$lib/utils/stores.svelte';
	import { encodetoNaddr, encodetoNevent } from '$lib/utils/encode';
	import type { EventPacket } from 'rx-nostr';
	import { getRelaysById } from '$lib/nostr/nostrSubscriptions';
	import DropdownMenuComponent from './DropdownMenuComponent.svelte';
	import type { MenuItem } from '$lib/types/utiles';
	import { Dialog, Separator } from 'bits-ui';
	import { bookmarkItemsMap, type BookmarkItem } from '$lib/types/bookmark.svelte';
	import { publishEvent } from '$lib/nostr/publish';
	import SelectMoveTo from '../SelectMoveTo.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { toastStore } from '$lib/utils/util';

	interface Props {
		item: BookmarkItem;
		editable: boolean;

		setRelayHint?: (relay: string) => void;
	}

	let deleteDialogOpen = $state(false);
	let editDialogOpen = $state(false);

	let { item, editable, setRelayHint }: Props = $props();
	let tag = $derived(['a', item.atag]);
	let event = $derived(item.event);

	let openJsonView = $state(false);
	let menuItem: MenuItem[] = $derived([
		...(editable
			? [
					{ id: 'move', label: 'Move', Icon: NotebookTabs },
					{ id: 'delete', label: 'Delete', Icon: Delete }
				]
			: []),
		{ id: 'json', label: 'View Json', Icon: FileBraces },
		...(tag[0] === 'a' || tag[0] === 'e'
			? [
					{ id: 'njump', label: 'Open in njump', Icon: ExternalLink },
					{ id: 'share', label: 'Share', Icon: Share }
				]
			: [])
	]);

	// 使用例のonSelect関数も更新
	function onSelect(id: string) {
		const packet = queryClient.get()?.getQueryData([tag[1]] as QueryKey) as EventPacket | null;
		if (packet) {
			event = packet.event;
		}
		const seenOn: string[] = packet ? getRelaysById(packet.event.id) : [];

		// リンク生成を共通化（更新されたエンコード関数を使用）
		const generateLink = () => {
			return tag[0] === 'e'
				? encodetoNevent({
						id: tag[1],
						author: event?.pubkey,
						kind: event?.kind,
						...(seenOn.length > 0 ? { relays: seenOn } : {})
					})
				: encodetoNaddr(tag[1], seenOn);
		};

		switch (id) {
			case 'move':
				//ほかのリストに移動
				editDialogOpen = true;
				break;
			case 'delete':
				deleteDialogOpen = true;
				//リストを削除
				break;
			case 'json':
				try {
				} catch (error) {
					console.log(error);
				}
				openJsonView = true;
				break;
			case 'njump':
				console.log('njumpで開きます');
				const link = generateLink();
				console.log(link);
				window.open(`https://njump.me/${link}`, '_blank', 'noopener,noreferrer');
				break;
			case 'share':
				const share = nostrShare.get();
				if (share) {
					const link = generateLink();
					shareText.set(`nostr:${link}`);

					const shadowRoot = share.shadowRoot;
					if (shadowRoot) {
						const button = shadowRoot.querySelector('button[part="button"]') as HTMLButtonElement;
						if (button) {
							button.click();
						}
					}
				}
				break;
		}
	}

	async function handleDeleteItem(item: BookmarkItem) {
		console.log(`${$t('bookmark.deleteItem')} ${item.atag}`);

		const ev: EventParameters = {
			kind: 5,
			tags: [
				['a', item.atag],
				['e', item.event.id]
			],
			content: ''
		};

		try {
			await publishEvent(ev, $t('tagEditor.actions.delete'));

			$bookmarkItemsMap.delete(item.atag);
			$bookmarkItemsMap = $bookmarkItemsMap;
			console.log(`${$t('bookmark.removedFromMap')} ${item.atag}`);
		} catch (error) {
			console.error(`${$t('bookmark.deleteError')}`, error);
		}
	}

	const onMoveList = async (destination: { kind: number; id: string }) => {
		console.log('from:', item, ', to:', destination);
		editDialogOpen = false;

		const sourceEvent = $state.snapshot(item.event);

		const buildDestinationTags = () => {
			if (destination.kind === 10003) {
				return sourceEvent.tags.filter((tag) => tag[0] !== 'd');
			}

			const dTagIndex = sourceEvent.tags.findIndex((tag) => tag[0] === 'd');
			const dTag = ['d', destination.id];

			return dTagIndex !== -1
				? sourceEvent.tags.map((tag, i) => (i === dTagIndex ? dTag : tag))
				: [dTag, ...sourceEvent.tags];
		};

		const destinationEventParams: EventParameters = {
			kind: destination.kind,
			content: sourceEvent.content,
			tags: buildDestinationTags()
		};
		const res = await publishEvent(destinationEventParams, $t('tagEditor.actions.publish'));
		console.log(destinationEventParams);

		if (!res) {
			//失敗したら終わり
			return;
		}

		// publishが成功したら移動元を空にする
		// dタグがある場合はdタグのみ残す
		const sourceEventParams: EventParameters = {
			kind: sourceEvent.kind,
			content: '',
			tags: sourceEvent.tags.filter((tag) => tag[0] === 'd')
		};
		const res2 = await publishEvent(sourceEventParams, $t('tagEditor.actions.moveDelete'));
		if (res2) {
			toastStore.success({
				title: $t('common.publishSuccess', { action: $t('tagEditor.actions.move') }),
				description: ``
			});
		}
		console.log(sourceEventParams);
	};
</script>

<DropdownMenuComponent items={menuItem} {onSelect}
	>{#snippet trigger()}
		Menu
	{/snippet}</DropdownMenuComponent
>

<JsonView {event} {tag} bind:isOpen={openJsonView} {setRelayHint} {editable} />
<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={$t('deleteItem.title')}
	description={$t('deleteItem.description', {
		name: item.title || item.identifier || item.event.kind
	})}
	okText={$t('common.delete')}
	onConfirm={() => handleDeleteItem(item)}
/>

<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
		/>
		<Dialog.Content
			class="rounded-card-lg shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] border bg-neutral-100 p-5 outline-hidden sm:max-w-122.5 md:w-full dark:bg-neutral-900"
		>
			<Dialog.Title
				class="flex w-full items-center justify-center text-lg font-semibold tracking-tight"
			>
				{`${$t(`bookmark.sections.${item.event.kind}`)}(kind:${item.event.kind}) ${item.title || item.identifier || ''}`}
			</Dialog.Title>

			<Dialog.Description class="text-foreground-alt mt-2 text-sm break-all whitespace-pre-wrap"
				>{$t('moveList.select')}</Dialog.Description
			>
			<SelectMoveTo {item} onconfirm={onMoveList} />

			<Dialog.Close
				class="focus-visible:ring-foreground focus-visible:ring-offset-background absolute top-5 right-5 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-[0.98]"
			>
				<div>
					<X class="text-foreground size-5" />
					<span class="sr-only">{$t('common.close')}</span>
				</div>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
