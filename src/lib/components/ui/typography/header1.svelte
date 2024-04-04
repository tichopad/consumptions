<script lang="ts">
	import { cn } from '$lib/utils';
</script>

<h1 class={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', $$props.class)}>
	<slot />
</h1>
