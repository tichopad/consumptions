<script lang="ts">
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';

	export let data;

	const form = superForm(data.form, {
		dataType: 'json',
		onError({ result }) {
			console.log(result.error);
		},
		onUpdated({ form }) {
			console.log(form);
		}
	});

	const { form: formData, enhance } = form;
</script>

<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<div>
		<h1 class="text-2xl font-bold py-2">Bills</h1>
	</div>
	<div>
		<form method="post" action="?/createBill" use:enhance>
			<h2 class="text-2xl">New bill</h2>
			<!-- Start date -->
			<Form.Field {form} name="startDate">
				<Form.Control let:attrs>
					<Form.Label>Start Date</Form.Label>
					<Input type="date" {...attrs} bind:value={$formData.startDate} />
				</Form.Control>
			</Form.Field>
			<!-- End date -->
			<Form.Field {form} name="endDate">
				<Form.Control let:attrs>
					<Form.Label>End Date</Form.Label>
					<Input type="date" {...attrs} bind:value={$formData.endDate} />
				</Form.Control>
			</Form.Field>
			<!-- Energy cost -->
			<Form.Field {form} name="electricityUnitCost">
				<Form.Control let:attrs>
					<Form.Label>Electricity Unit Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.electricityUnitCost} />
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="waterUnitCost">
				<Form.Control let:attrs>
					<Form.Label>Water Unit Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.waterUnitCost} />
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="heatingUnitCost">
				<Form.Control let:attrs>
					<Form.Label>Heating Unit Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.heatingUnitCost} />
				</Form.Control>
			</Form.Field>
			<!-- Total cost -->
			<Form.Field {form} name="electricityTotalCost">
				<Form.Control let:attrs>
					<Form.Label>Total Electricity Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.electricityTotalCost} />
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="waterTotalCost">
				<Form.Control let:attrs>
					<Form.Label>Total Water Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.waterTotalCost} />
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="heatingTotalCost">
				<Form.Control let:attrs>
					<Form.Label>Total Heating Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.heatingTotalCost} />
				</Form.Control>
			</Form.Field>
			<!-- Total fixed cost -->
			<Form.Field {form} name="heatingTotalFixedCost">
				<Form.Control let:attrs>
					<Form.Label>Total Fixed Heating Cost</Form.Label>
					<Input type="number" {...attrs} bind:value={$formData.heatingTotalFixedCost} />
				</Form.Control>
			</Form.Field>
			<Form.Fieldset {form} name="occupants">
				<Form.Legend class="text-xl">Occupants</Form.Legend>
				<!-- Occupants -->
				{#each $formData.occupants as occupant, i}
					<Form.ElementField {form} name="occupants[{i}]">
						<h3 class="text-lg">{occupant.name}</h3>
						<input type="hidden" bind:value={occupant.id} />
						<!-- Measuring Devices -->
						{#if occupant.measuringDevices.length > 0}
							<Form.Fieldset {form} class="px-4" name="occupants[{i}].measuringDevices">
								<Form.Legend class="text-lg">Measuring Devices</Form.Legend>
								{#each occupant.measuringDevices as device, j}
									<Form.ElementField
										{form}
										class="px-4"
										name="occupants[{i}].measuringDevices[{j}]"
									>
										<Form.Control let:attrs>
											<input type="hidden" bind:value={device.id} {...attrs} />
										</Form.Control>
										<Form.Control let:attrs>
											<Form.Label>{device.name} ({device.energyType})</Form.Label>
											<Input type="number" {...attrs} bind:value={device.consumption} />
										</Form.Control>
									</Form.ElementField>
								{/each}
							</Form.Fieldset>
						{/if}
					</Form.ElementField>
				{/each}
			</Form.Fieldset>
			<Form.Button>Save</Form.Button>
		</form>
	</div>
	<SuperDebug data={data.form} collapsible />
</main>
