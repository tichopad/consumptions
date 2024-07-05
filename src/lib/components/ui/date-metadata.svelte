<script lang="ts">
	import { dateFmt } from '$lib/i18n/helpers';
	import { Separator } from './separator';
	import { cn } from './utils';

	export let created: Date;
	export let updated: Date | undefined = undefined;
</script>

<div class={cn('text-xs flex flex-col sm:flex-row gap-1 sm:gap-2', $$props.class)}>
	<ul class="flex gap-1">
		<li class="font-medium">Vytvořeno&nbsp;-</li>
		<li class="text-muted-foreground">{dateFmt(created)}</li>
	</ul>
	{#if updated !== undefined}
		<Separator orientation="vertical" class="hidden sm:block" />
		<ul class="flex gap-1">
			<li class="font-medium">Poslední úprava&nbsp;-</li>
			<li class="text-muted-foreground">{dateFmt(updated)}</li>
		</ul>
	{/if}
</div>
