<script lang="ts">
	import { cn } from '$lib/components/ui/utils';
</script>

<h2 class={cn('scroll-m-20 text-2xl font-semibold tracking-tight', $$props.class)}>
	<slot />
</h2>
