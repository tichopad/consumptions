<script lang="ts">
	import { cn } from '$lib/components/ui/utils';
</script>

<h1
	class={cn('scroll-m-20 text-3xl py-3 font-extrabold tracking-tight lg:text-4xl', $$props.class)}
>
	<slot />
</h1>
