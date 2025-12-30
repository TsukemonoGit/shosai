<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Dialog, Separator } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		okText?: string;
		onConfirm: () => void;
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		okText = 'OK',
		onConfirm,
		children
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
		/>

		<Dialog.Content
			class="rounded-card-lg shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border bg-neutral-100 p-5 outline-hidden sm:max-w-122.5 dark:bg-neutral-900"
		>
			<Dialog.Title class="flex w-full justify-center text-lg font-semibold tracking-tight">
				{title}
			</Dialog.Title>

			<Separator.Root class="bg-muted -mx-5 mt-5 mb-6 h-px" />

			<Dialog.Description class="text-foreground-alt text-sm">
				{description}
			</Dialog.Description>

			{#if children}
				{@render children()}
			{/if}

			<div class="mt-4 flex justify-end">
				<button
					onclick={() => {
						onConfirm();
						open = false;
					}}
					class="h-input rounded-input shadow-mini inline-flex items-center justify-center bg-red-600 px-12.5 text-[15px] font-semibold text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-[0.98]"
				>
					{okText}
				</button>
			</div>

			<Dialog.Close
				class="absolute top-5 right-5 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
			>
				<X class="text-foreground size-5" />
				<span class="sr-only">close</span>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
