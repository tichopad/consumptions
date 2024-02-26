<script lang="ts">
	export let data;

	import * as Table from '$lib/components/ui/table';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { type EnergyType } from '$lib/helpers.js';

	const energies: { value: EnergyType; label: string }[] = [
		{ value: 'electricity', label: 'Electricity' },
		{ value: 'heating', label: 'Heating' },
		{ value: 'water', label: 'Water' }
	];
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Occupant</p>
		<h1 class="text-2xl font-bold py-2">{data.occupant.name}</h1>
		<p class="text-gray-500 dark:text-gray-400">{data.occupant.squareMeters} m²</p>
	</div>

	<div>
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold py-2">Measuring devices</h2>
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Add</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<form method="post">
						<Dialog.Header>
							<Dialog.Title>Add measuring device</Dialog.Title>
							<Dialog.Description>
								Create and add new measuring device. Click save when you're done.
							</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="name" class="text-right">Name</Label>
								<Input id="name" class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="energyType" class="text-right">Energy type</Label>
								<Select.Root>
									<Select.Trigger class="w-[275px]">
										<Select.Value placeholder="Select ..." />
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Label>Energy type</Select.Label>
											{#each energies as energy}
												<Select.Item value={energy.value} label={energy.label}
													>{energy.label}</Select.Item
												>
											{/each}
										</Select.Group>
									</Select.Content>
									<Select.Input name="energyType" />
								</Select.Root>
							</div>
						</div>
						<Dialog.Footer>
							<Button type="submit">Save changes</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-right">Type</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.occupant.measuringDevices as device (device.id)}
					<Table.Row class="hover:bg-slate-100">
						<Table.Cell class="font-medium whitespace-nowrap pr-0">
							{device.name}
						</Table.Cell>
						<Table.Cell class="text-right">{device.energyType}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>
