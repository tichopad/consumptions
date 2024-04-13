<script lang="ts">
	import { cn } from '../utils';
</script>

<!-- General page layout component with a centered content and a named slot for headings -->

<main class="bg-stone-50 flex justify-center items-stretch">
	<div
		class={cn(
			'flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col p-4 md:p-10 lg:max-w-5xl',
			$$props.class
		)}
	>
		<slot name="header" />
		<section class="flex flex-col gap-4 pt-4 sm:pt-6">
			<slot />
		</section>
	</div>
</main>
