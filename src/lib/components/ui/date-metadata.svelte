<script lang="ts">
	import { dateFmt } from '$lib/i18n/helpers';
	import { isNullable } from '$lib/utils';
	import { Separator } from './separator';
	import { cn } from './utils';

	export let created: Date;
	export let updated: Date | undefined = undefined;
	export let archived: Date | undefined | null = undefined;
</script>

<div class={cn('text-xs flex flex-col md:flex-row gap-1 md:gap-2', $$props.class)}>
	<ul class="flex gap-1">
		<li class="font-medium">Vytvořeno&nbsp;-</li>
		<li class="text-muted-foreground">
			{dateFmt(created, { dateStyle: 'long', timeStyle: 'short' })}
		</li>
	</ul>
	{#if updated !== undefined}
		<Separator orientation="vertical" class="hidden md:block" />
		<ul class="flex gap-1">
			<li class="font-medium">Poslední úprava&nbsp;-</li>
			<li class="text-muted-foreground">
				{dateFmt(updated, { dateStyle: 'long', timeStyle: 'short' })}
			</li>
		</ul>
	{/if}
	{#if !isNullable(archived)}
		<Separator orientation="vertical" class="hidden md:block" />
		<ul class="flex gap-1">
			<li class="font-medium">Archivováno&nbsp;-</li>
			<li class="text-muted-foreground">
				{dateFmt(archived, { dateStyle: 'long', timeStyle: 'short' })}
			</li>
		</ul>
	{/if}
</div>
