<script lang="ts">
	import { createDateFormatter } from '$lib/i18n/stores';
	import { Separator } from './separator';
	import { cn } from './utils';

	export let created: Date;
	export let updated: Date | undefined = undefined;

	const dateFmt = createDateFormatter();
</script>

<div class={cn('text-xs flex flex-col sm:flex-row gap-1 sm:gap-2', $$props.class)}>
	<ul class="flex gap-1">
		<li class="font-medium">Created at&nbsp;-</li>
		<li class="text-muted-foreground">{$dateFmt.format(created)}</li>
	</ul>
	{#if updated !== undefined}
		<Separator orientation="vertical" class="hidden sm:block" />
		<ul class="flex gap-1">
			<li class="font-medium">Last updated at&nbsp;-</li>
			<li class="text-muted-foreground">{$dateFmt.format(updated)}</li>
		</ul>
	{/if}
</div>
