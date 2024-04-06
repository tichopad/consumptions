<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import { numberFmt } from '$lib/i18n/stores';
	import type { Occupant } from '$lib/models/occupant';
	import { QuestionMarkCircled as QuestionMarkCircledIcon } from 'svelte-radix';
	import { superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';

	export let data;

	const form = superForm(data.form, {
		onError({ result }) {
			console.log(result.error);
		},
		onUpdated({ form }) {
			console.log(form);
		}
	});
	const { form: formData, enhance, delayed } = form;

	const isNotChargedForUnmeasuredEnergy = (occupant: Occupant) => {
		return (
			!occupant.chargedUnmeasuredElectricity &&
			!occupant.chargedUnmeasuredHeating &&
			!occupant.chargedUnmeasuredWater
		);
	};
</script>

<div class="bg-stone-50 flex justify-center items-stretch">
	<main
		class="bg-stone-50 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 lg:max-w-5xl"
	>
		<div class="flex justify-between items-center">
			<Header1>Occupants</Header1><Button href="/occupants/create">Create</Button>
		</div>
		<Card.Root>
			<Card.Content class="pt-6">
				{#if data.occupants.length === 0}
					<p class="text-muted-foreground">
						No bills yet. Press <i>Create</i> to add the first one.
					</p>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="lg:w-2/4">Name</Table.Head>
								<Table.Head>Area</Table.Head>
								<Table.Head>Charged based on area</Table.Head>
								<Table.Head class=" flex gap-1 items-center">
									<span>Fixed heating cost share</span>
									<Tooltip.Root openDelay={500}>
										<Tooltip.Trigger>
											<QuestionMarkCircledIcon class="w-4 h-4" />
										</Tooltip.Trigger>
										<Tooltip.Content>
											Lorem ipsum dolor sit amet consectetuer alipiscit elit. Dolero simpacto crenda
											flur ten.
										</Tooltip.Content>
									</Tooltip.Root>
								</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.occupants as occupant (occupant.id)}
								<Table.Row>
									<Table.Cell class="font-medium">
										{occupant.name}
									</Table.Cell>
									<Table.Cell>
										{$numberFmt.format(occupant.squareMeters)}&nbsp;m²
									</Table.Cell>
									<Table.Cell class="flex gap-1">
										{#if occupant.chargedUnmeasuredElectricity}
											<EnergyTypeIcon class="w-4 h-4" energyType="electricity" />
										{/if}
										{#if occupant.chargedUnmeasuredHeating}
											<EnergyTypeIcon class="w-4 h-4" energyType="heating" />
										{/if}
										{#if occupant.chargedUnmeasuredWater}
											<EnergyTypeIcon class="w-4 h-4" energyType="water" />
										{/if}
										{#if isNotChargedForUnmeasuredEnergy(occupant)}
											<span class="text-muted-foreground">None</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{#if occupant.heatingFixedCostShare !== null}
											{$numberFmt.format(occupant.heatingFixedCostShare)}
										{:else}
											<span class="text-muted-foreground">None</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</main>
</div>

<Dialog.Root open>
	<Dialog.Trigger />
	<Dialog.Content class="sm:max-w-[425px]">
		<form method="post" action="?/createOccupant" use:enhance>
			<Dialog.Header>
				<Dialog.Title>Create new occupant</Dialog.Title>
				<Dialog.Description>
					Create and add new occupant. Click save when you're done.
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Name</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="squareMeters">
					<Form.Control let:attrs>
						<Form.Label>Area (m²)</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.squareMeters} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="chargedUnmeasuredElectricity">
					<Form.Control let:attrs>
						<Form.Label>Is charged for electricity based on area</Form.Label>
						<Checkbox
							{...attrs}
							onCheckedChange={(x) => ($formData.chargedUnmeasuredElectricity = x)}
						/>
					</Form.Control>
				</Form.Field>
				<!-- <Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Name</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="energyType">
					<Form.Control let:attrs>
						<Form.Label>Energy type</Form.Label>
						<Select.Root>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select ..." />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each energies as energy}
										<Select.Item {...energy}>{energy.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input {...attrs} />
						</Select.Root>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field> -->
			</div>
			<Dialog.Footer>
				<Form.Button disabled={$delayed}>{$delayed ? 'Saving ...' : 'Save'}</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
