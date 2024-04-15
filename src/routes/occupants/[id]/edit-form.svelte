<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { labelsByEnergyType } from '$lib/models/common';
	import type { Occupant } from '$lib/models/occupant';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms/client';
	import { createOccupantFormSchema } from '../create-edit-form-schema';

	export let occupant: Occupant;
	export let data: SuperValidated<Infer<typeof createOccupantFormSchema>>;

	const editForm = superForm(data, {
		validators: zodClient(createOccupantFormSchema),
		// Required in order for the loader data to take precedence over the returned form data
		invalidateAll: 'force',
		onUpdated(event) {
			if (event.form.valid) {
				toast.success(event.form.message ?? 'Occupant updated.');
			} else {
				toast.error(`Failed to update ${occupant.name}.`);
			}
		},
		onError({ result }) {
			if (result.error.message) {
				toast.error(result.error.message);
			}
		}
	});

	const { form: formData, enhance, delayed, isTainted, tainted } = editForm;
</script>

<form method="post" action="?/editOccupant" use:enhance>
	<div class="flex flex-col">
		<!-- Name -->
		<Form.Field form={editForm} name="name">
			<Form.Control let:attrs>
				<Form.Label>Name</Form.Label>
				<Input {...attrs} bind:value={$formData.name} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="flex gap-2 flex-col sm:flex-row">
			<!-- Area -->
			<Form.Field form={editForm} name="squareMeters" class="flex-1">
				<Form.Control let:attrs>
					<Form.Label>Area (m²)</Form.Label>
					<Input {...attrs} type="number" step="0.001" bind:value={$formData.squareMeters} />
				</Form.Control>
				<Form.Description>The area that's currently in use by the occupant.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
			<!-- Fixed heating cost share -->
			<Form.Field form={editForm} name="heatingFixedCostShare" class="flex-1">
				<Form.Control let:attrs>
					<Form.Label>Fixed heating cost share</Form.Label>
					<Input
						{...attrs}
						type="number"
						step="0.001"
						bind:value={$formData.heatingFixedCostShare}
					/>
				</Form.Control>
				<Form.Description>
					Defines if and how much does the occupant contribute to the recurring fixed heating cost.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
	<fieldset class="py-2">
		<div class="pb-4">
			<legend class="font-medium leading-none text-base py-2">Consumption charged by area</legend>
			<p class="text-[0.8rem] text-muted-foreground">
				Select which energy consumption is charged based on occupant's area.
			</p>
		</div>
		<div class="py-2">
			<!-- Electricity -->
			<Form.Field form={editForm} name="chargedUnmeasuredElectricity">
				<div class="flex flex-row items-start space-x-3">
					<Form.Control let:attrs>
						<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredElectricity} />
						<Form.Label class="flex gap-1 items-center font-normal">
							<EnergyTypeIcon class="w-4 h-4" energyType="electricity" withTooltip={false} />
							{labelsByEnergyType['electricity']}
						</Form.Label>
						<input name={attrs.name} value={$formData.chargedUnmeasuredElectricity} hidden />
					</Form.Control>
				</div>
				<Form.FieldErrors />
			</Form.Field>
			<!-- Heating -->
			<Form.Field form={editForm} name="chargedUnmeasuredHeating">
				<div class="flex flex-row items-start space-x-3">
					<Form.Control let:attrs>
						<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredHeating} />
						<Form.Label class="flex gap-1 items-center font-normal">
							<EnergyTypeIcon class="w-4 h-4" energyType="heating" withTooltip={false} />
							{labelsByEnergyType['heating']}
						</Form.Label>
						<input name={attrs.name} value={$formData.chargedUnmeasuredHeating} hidden />
					</Form.Control>
				</div>
				<Form.FieldErrors />
			</Form.Field>
			<!-- Water -->
			<Form.Field form={editForm} name="chargedUnmeasuredWater">
				<div class="flex flex-row items-start space-x-3">
					<Form.Control let:attrs>
						<Checkbox {...attrs} bind:checked={$formData.chargedUnmeasuredWater} />
						<Form.Label class="flex gap-1 items-center font-normal">
							<EnergyTypeIcon class="w-4 h-4" energyType="water" withTooltip={false} />
							{labelsByEnergyType['water']}
						</Form.Label>
						<input name={attrs.name} value={$formData.chargedUnmeasuredWater} hidden />
					</Form.Control>
				</div>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</fieldset>
	<Form.Button disabled={$delayed || !isTainted($tainted)} class="mt-1">
		{$delayed ? 'Saving ...' : 'Save'}
	</Form.Button>
</form>
