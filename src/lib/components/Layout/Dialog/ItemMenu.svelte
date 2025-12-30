<script lang="ts">
	import { ExternalLink, FileBraces, Menu, Pencil, Share } from '@lucide/svelte';
	import TagEditor from '../../Bookmark/TagEditor.svelte';
	import { type QueryKey } from '@tanstack/svelte-query';
	import { type Event as NostrEvent } from 'nostr-typedef';
	import JsonView from './JsonView.svelte';
	import { nostrShare, queryClient, shareText } from '$lib/utils/stores.svelte';
	import { encodetoNaddr, encodetoNevent } from '$lib/utils/encode';
	import type { EventPacket } from 'rx-nostr';
	import { getRelaysById } from '$lib/nostr/nostrSubscriptions';
	import DropdownMenuComponent from './DropdownMenuComponent.svelte';
	import type { MenuItem } from '$lib/types/utiles';

	interface Props {
		tag: string[];
		onConformEditTag: (tag: string[]) => void;
		editable: boolean;
		event?: NostrEvent | null;
		setRelayHint?: (relay: string) => void;
	}

	let { tag, onConformEditTag, editable, event = $bindable(null), setRelayHint }: Props = $props();
	let openTagEditor = $state(false);
	let openJsonView = $state(false);
	let menuItem: MenuItem[] = $derived([
		...(editable ? [{ id: 'edit', label: 'Edit', Icon: Pencil }] : []),
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
			case 'edit':
				openTagEditor = true;
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
</script>

<DropdownMenuComponent items={menuItem} {onSelect}
	>{#snippet trigger()}
		<Menu />
	{/snippet}</DropdownMenuComponent
>
<TagEditor bind:isOpen={openTagEditor} initTag={tag} {onConformEditTag} />
<JsonView {event} {tag} bind:isOpen={openJsonView} {setRelayHint} {editable} />
