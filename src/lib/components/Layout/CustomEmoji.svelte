<script lang="ts">
	import { commonMenu } from '$lib/utils/stores.svelte';
	import type { Token } from '@konemono/nostr-content-parser';

	interface Props {
		part: Token;
		height?: number;
	}

	let { part, height = 24 }: Props = $props();
	let imgError: boolean = $state(false);
	let imgLoad: boolean = $state(false);

	let emoji = $derived(
		part.type === 'custom_emoji' && part.metadata.hasMetadata ? part.metadata : null
	);
</script>

{#if emoji && !imgError && !commonMenu.get().light.checked}
	{#if !imgLoad}{part.content}{/if}
	<img
		height={`${height}px`}
		loading="lazy"
		alt={`${part.content}`}
		src={emoji.url}
		title={`${part.content}`}
		class="m-0 inline overflow-hidden object-contain align-bottom"
		style={`height:${height}px`}
		onload={() => {
			imgLoad = true;
		}}
		onerror={() => {
			imgError = true;
		}}
	/>
{:else}
	{part.content}
{/if}
