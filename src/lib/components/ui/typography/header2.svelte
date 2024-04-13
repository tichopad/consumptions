<script lang="ts">
	import { cn } from '$lib/components/ui/utils';
</script>

<h1
	class={cn(
		'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
		$$props.class
	)}
>
	<slot />
</h1>
