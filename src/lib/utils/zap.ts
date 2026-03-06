import { verifyEvent, type EventTemplate } from 'nostr-tools';
import * as Nostr from 'nostr-typedef';

import { bech32 } from '@scure/base';
import { type QueryKey } from '@tanstack/svelte-query';

import { decode } from 'light-bolt11-decoder';
import { utf8Decoder } from 'nostr-tools/utils';
import { queryClient } from './stores.svelte';
import { hexRegex, nip33Regex } from './regex';

interface LnurlBody {
	allowsNostr: boolean;
	nostrPubkey?: string;
	callback?: string;
	[key: string]: unknown;
}

interface Bolt11Section {
	name: string;
	value: unknown;
}

export interface InvoiceProp {
	metadata: Nostr.Event;
	eventTag?: string[];
	amount: number;
	comment: string;
	zapRelays: string[];
	kind?: number;
}

export async function makeInvoice({
	metadata,
	eventTag,
	amount,
	comment,
	zapRelays,
	kind
}: InvoiceProp): Promise<string | null> {
	try {
		const zapEndpoint = await getZapEndpoint(metadata);
		console.log(zapEndpoint);
		if (!zapEndpoint) {
			return null;
		}

		const zapRequest: EventTemplate = makeZapRequest({
			profile: metadata.pubkey,
			eventTag: eventTag ?? null,
			amount: amount,
			relays: zapRelays,
			comment: comment,
			...(kind !== undefined ? { kind } : {})
		});
		const signedRequest = await (window.nostr as Nostr.Nip07.Nostr)?.signEvent(zapRequest);
		const encoded = encodeURI(JSON.stringify(signedRequest));

		const url = `${zapEndpoint}?amount=${amount}&nostr=${encoded}`;
		console.log('[zap url]', url);
		const response = await fetch(url);
		if (!response.ok) {
			console.error('[zap failed]', await response.text());
			return null;
		}
		const payment = await response.json();
		const { pr: zapInvoice } = payment;
		console.log('[zap invoice]', zapInvoice);
		if (zapInvoice === undefined) {
			console.error('[zap failed]', payment);
			return null;
		}
		return zapInvoice;
	} catch {
		return null;
	}
}

export const getZapLNURLPubkey = async (
	metadata: Nostr.Event
): Promise<{ pub: string | undefined; error?: string }> => {
	const client = queryClient.get();
	if (!client) return { pub: undefined, error: 'query client error' };
	const data: { pub: string | undefined; error?: string } | undefined = client.getQueryData([
		'zapLNURLPubkey',
		metadata.pubkey
	]);
	if (data) {
		return data;
	}
	const result = await client.fetchQuery({
		queryKey: ['zapLNURLPubkey', metadata.pubkey] as QueryKey,
		queryFn: () => fetchZapLNURLPubkey(metadata),
		staleTime: Infinity,
		gcTime: Infinity
	});

	return result;
};

export async function fetchZapLNURLPubkey(
	metadata: Nostr.Event
): Promise<{ pub: string | undefined; error?: string }> {
	try {
		let lnurl: string = '';
		const { lud06, lud16 } = JSON.parse(metadata.content);

		if (lud16) {
			const [name, domain] = lud16.split('@');
			lnurl = new URL(`/.well-known/lnurlp/${name}`, `https://${domain}`).toString();
		} else if (lud06) {
			const { words } = bech32.decode(lud06, 1000);
			const data = bech32.fromWords(words);
			lnurl = new TextDecoder().decode(data);
		} else {
			return {
				pub: undefined,
				error: "Failed to retrieve the zapped user's LNURL."
			};
		}

		const body = await getNurlFetch(lnurl);
		if (!body) {
			return { pub: undefined, error: `Failed to fetch from ${lnurl}` };
		}

		if (body.allowsNostr && body.nostrPubkey) {
			return { pub: body.nostrPubkey };
		} else {
			return {
				pub: undefined,
				error: !body.allowsNostr
					? 'Error in the allowsNostr field of the LNURL Server.'
					: 'The nostrPubkey field of the LNURL Server is not set.'
			};
		}
	} catch {
		return {
			pub: undefined,
			error: 'An error occurred while fetching LNURL data.'
		};
	}
}

export async function getNurlFetch(lnurl: string): Promise<LnurlBody | undefined> {
	const client = queryClient.get();
	if (!client) return undefined;
	const data: LnurlBody | undefined = client.getQueryData(['fetchNnurl', lnurl]);
	if (data) return data;

	try {
		const response = await client.fetchQuery({
			queryKey: ['fetchNnurl', lnurl] as QueryKey,
			queryFn: async (): Promise<LnurlBody> => {
				const res = await fetch(lnurl);
				if (!res.ok) throw new Error(`Failed to fetch from ${lnurl}`);
				return (await res.json()) as LnurlBody;
			},
			staleTime: Infinity,
			gcTime: Infinity
		});
		return response;
	} catch (error: unknown) {
		console.error('Fetch error:', error);
		return undefined;
	}
}

export function extractKind9734(event: Nostr.Event): Nostr.Event | undefined {
	const descriptionTag = event.tags.find((tag) => tag[0] === 'description');
	if (!descriptionTag || descriptionTag.length <= 1) {
		console.log('zap descriptionTag error');
		return;
	}
	try {
		const kind9734 = JSON.parse(descriptionTag[1]);
		if (verifyEvent(kind9734)) {
			return kind9734;
		} else {
			console.log('zap kind9734 error');
			return;
		}
	} catch (error) {
		console.error('Error parsing description tag:', error);
		return;
	}
}

export function extractAmount(
	note: Nostr.Event,
	zapRequestEvent: Nostr.Event | undefined
): number | undefined {
	const bolt11Tag = note.tags.find((tag) => tag[0] === 'bolt11');
	if (!bolt11Tag || bolt11Tag.length <= 1) {
		console.log('zap bolt11Tag error');
		return;
	}
	try {
		const decoded = decode(bolt11Tag[1]);
		if (decoded) {
			const amountSection = (decoded.sections as Bolt11Section[]).find(
				(section) => section.name === 'amount'
			)?.value;

			const requestAmount = zapRequestEvent?.tags.find((tag) => tag[0] === 'amount')?.[1];

			if (requestAmount) {
				if (amountSection !== requestAmount) {
					console.log('zap amount error', amountSection, requestAmount);
					return undefined;
				}
			}
			if (amountSection) {
				return Math.floor(Number(amountSection) / 1000);
			}
		}
	} catch (error) {
		console.error('Error decoding bolt11 tag:', error);
		return;
	}
}

export function makeZapRequest({
	profile,
	eventTag,
	amount,
	relays,
	comment = '',
	kind
}: {
	profile: string;
	eventTag: string[] | null;
	amount: number;
	comment: string;
	relays: string[];
	kind?: number;
}): EventTemplate {
	if (!amount) throw new Error('amount not given');
	if (!profile) throw new Error('profile not given');

	const zr: EventTemplate = {
		kind: 9734,
		created_at: Math.round(Date.now() / 1000),
		content: comment,
		tags: [
			['p', profile],
			['amount', amount.toString()],
			['relays', ...relays],
			...(kind !== undefined ? [['k', kind.toString()]] : [])
		]
	};

	if (eventTag) {
		zr.tags.push(eventTag);
	}

	return zr;
}

export function lnurlToZapAddress(lud06: string): string | undefined {
	try {
		const { words } = bech32.decode(lud06 as `${string}1${string}`, 1000);
		const data = bech32.fromWords(words);
		const lnurl = new TextDecoder().decode(data);

		const match = lnurl.match(/^https:\/\/([^/]+)\/.well-known\/lnurlp\/([^/]+)$/);

		if (match && match.length >= 3) {
			const domain = match[1];
			const username = match[2];
			return `${username}@${domain}`;
		}

		return undefined;
	} catch {
		return undefined;
	}
}

export async function getZapEndpoint(metadata: Nostr.Event): Promise<null | string> {
	try {
		let lnurl: string = '';
		const { lud06, lud16 } = JSON.parse(metadata.content);

		if (lud16) {
			const [name, domain] = lud16.split('@');
			lnurl = new URL(`/.well-known/lnurlp/${name}`, `https://${domain}`).toString();
		} else if (lud06) {
			const { words } = bech32.decode(lud06, 1000);
			const data = bech32.fromWords(words);
			lnurl = utf8Decoder.decode(data);
		} else {
			return null;
		}

		const body = await getNurlFetch(lnurl);

		if (body && body.allowsNostr && body.nostrPubkey) {
			return body.callback ?? null;
		}
	} catch {
		/*-*/
	}

	return null;
}

export function extractZappedId(tags: string[][]): {
	tag: string[];
} {
	const eTag = tags?.find(
		(tag) =>
			(tag[0] === 'e' && hexRegex.test(tag[1])) || (tag[0] === 'a' && nip33Regex.test(tag[1]))
	);
	return {
		tag: eTag ? (eTag as string[]) : []
	};
}
