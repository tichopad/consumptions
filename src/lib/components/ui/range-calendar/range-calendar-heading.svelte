<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/components/ui/utils';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type $$Props = RangeCalendarPrimitive.HeadingProps;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<RangeCalendarPrimitive.Heading
	let:headingValue
	class={cn('text-sm font-medium', className)}
	{...$$restProps}
>
	<slot {headingValue}>
		{headingValue}
	</slot>
</RangeCalendarPrimitive.Heading>
