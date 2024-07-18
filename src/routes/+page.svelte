<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
</script>

<Page>
	<section slot="header">
		<Header1>Přehled</Header1>
	</section>
	<section>
		<Card.Root>
			<Card.Header>
				<Card.Title>Poslední celkové spotřeby</Card.Title>
				<Card.Description>You made 265 sales this month.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-8">
					<div class="flex items-center">
						<div class="ml-4 space-y-1">
							<p class="text-sm font-medium leading-none">Olivia Martin</p>
							<p class="text-sm text-muted-foreground">olivia.martin@email.com</p>
						</div>
						<div class="ml-auto font-medium">+$1,999.00</div>
					</div>
					<div class="flex items-center">
						<div class="ml-4 space-y-1">
							<p class="text-sm font-medium leading-none">Jackson Lee</p>
							<p class="text-sm text-muted-foreground">jackson.lee@email.com</p>
						</div>
						<div class="ml-auto font-medium">+$39.00</div>
					</div>
					<div class="flex items-center">
						<div class="ml-4 space-y-1">
							<p class="text-sm font-medium leading-none">Isabella Nguyen</p>
							<p class="text-sm text-muted-foreground">isabella.nguyen@email.com</p>
						</div>
						<div class="ml-auto font-medium">+$299.00</div>
					</div>
					<div class="flex items-center">
						<div class="ml-4 space-y-1">
							<p class="text-sm font-medium leading-none">William Kim</p>
							<p class="text-sm text-muted-foreground">will@email.com</p>
						</div>
						<div class="ml-auto font-medium">+$99.00</div>
					</div>
					<div class="flex items-center">
						<div class="ml-4 space-y-1">
							<p class="text-sm font-medium leading-none">Sofia Davis</p>
							<p class="text-sm text-muted-foreground">sofia.davis@email.com</p>
						</div>
						<div class="ml-auto font-medium">+$39.00</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</Page>
