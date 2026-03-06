<script lang="ts">
	import { parseNaddr } from '$lib/utils/util';
	import * as Nostr from 'nostr-typedef';

	import { parseContent, TokenType, type Token } from '@konemono/nostr-content-parser';
	import * as nip19 from 'nostr-tools/nip19';

	import DecodedContent from './DecodedContent.svelte';
	import CustomEmoji from '../Layout/CustomEmoji.svelte';
	import UrlDisplay from '../Layout/UrlDisplay.svelte';

	interface Props {
		event: Partial<Nostr.Event>;
	}

	let { event }: Props = $props();

	const text = $derived(event.content || '');
	const tags = $derived(event.tags || []);
	const parts: Token[] = $derived(parseContent(text, tags));

	const nip19Decode = (content: string | undefined): nip19.DecodedResult | undefined => {
		if (content === undefined) {
			return undefined;
		}
		try {
			const decoded = nip19.decode(content);
			if (decoded.type === 'naddr') {
				return { type: decoded.type, data: decoded.data };
			} else if (decoded.type === 'nevent') {
				return { type: decoded.type, data: decoded.data };
			} else if (decoded.type === 'nprofile') {
				return { type: decoded.type, data: decoded.data };
			} else if (decoded.type === 'nsec') {
				return { type: decoded.type, data: decoded.data };
			} else {
				return { type: decoded.type, data: decoded.data };
			}
		} catch {
			return undefined;
		}
	};

	const arekore = (type: string, id: string): nip19.DecodedResult | undefined => {
		try {
			switch (type) {
				case 'a':
					return { type: 'naddr', data: parseNaddr(['a', id]) };
				case 'p':
					return { type: 'npub', data: id };
				case 'e':
					return { type: 'note', data: id };
			}
		} catch {
			return undefined;
		}
	};
</script>

{#each parts as part, i (i)}
	{#if part.type === 'nip19'}
		{@const decoded = nip19Decode(part.metadata.plainNip19)}
		{#if decoded}
			<DecodedContent {decoded} {part} />{:else}{part.content}{/if}
	{:else if part.type === TokenType.LEGACY_REFERENCE && part.metadata && part.metadata.tagType && part.metadata.referenceId}
		{@const decoded = arekore(part.metadata.tagType as string, part.metadata.referenceId as string)}
		{#if decoded}
			<DecodedContent {decoded} {part} />{:else}{part.content}{/if}
	{:else if part.type === 'url'}
		<UrlDisplay {part} />
	{:else if part.type === TokenType.CUSTOM_EMOJI}
		<CustomEmoji {part} />
	{:else}
		<span class="break-words whitespace-pre-wrap" style="word-break: break-word;"
			>{part.content}</span
		>
	{/if}
{/each}
