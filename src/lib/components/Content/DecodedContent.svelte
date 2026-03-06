<script lang="ts">
	import { NIP19SubType, TokenType, type Token } from '@konemono/nostr-content-parser';
	import { nip19 } from 'nostr-tools';
	import UrlDisplay from '../Layout/UrlDisplay.svelte';
	import UserName from '../Layout/UserName.svelte';
	import { commonMenu } from '$lib/utils/stores.svelte';
	import Link from '../Layout/Link.svelte';

	interface Props {
		decoded: nip19.DecodedResult;
		part: Token;
	}

	let { decoded, part }: Props = $props();

	let data = $derived(
		part.metadata as {
			plainNip19: string;
			subType: NIP19SubType;
			hasNostrPrefix: boolean;
		}
	);
</script>

<div class="inline w-fit overflow-hidden">
	{#if decoded.type === 'npub'}
		<span class="inline-flex w-fit align-middle text-primary-300"
			><UserName pubhex={decoded.data} />
		</span>{:else if decoded.type === 'nprofile'}<span class="w-fit align-middle text-primary-300"
			><UserName pubhex={decoded.data.pubkey} /></span
		>
	{:else if commonMenu.get().light.checked}<Link
			class=" link break-all text-primary-300 underline hover:opacity-80"
			href={`https://njump.me/${data.plainNip19 || ''}`}>{part.content}</Link
		>
	{:else}
		<UrlDisplay
			part={{
				type: TokenType.URL,
				content: `https://njump.me/${data.plainNip19 || ''}`,
				start: 0,
				end: 0,
				metadata: { text: part.content }
			} as Token}
		/>{/if}
</div>
