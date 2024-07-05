<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { energyTypes, labelsByEnergyType } from '$lib/models/common';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms/client';
	import { createOccupantFormSchema } from '../create-edit-form-schema';
	import { capitalize } from '$lib/utils';

	export let data: SuperValidated<Infer<typeof createOccupantFormSchema>>;

	const editForm = superForm(data, {
		validators: zodClient(createOccupantFormSchema),
		// Required in order for the loader data to take precedence over the returned form data
		invalidateAll: 'force',
		onUpdated(event) {
			if (event.form.valid) {
				toast.success(event.form.message ?? `Subjekt ${event.form.data.name} byl aktualizován.`);
			} else {
				toast.error(`Nepodařilo se aktualizovat subjekt ${event.form.data.name}.`);
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
				<Form.Label>Název</Form.Label>
				<Input {...attrs} bind:value={$formData.name} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="flex gap-2 flex-col sm:flex-row">
			<!-- Area -->
			<Form.Field form={editForm} name="squareMeters" class="flex-1">
				<Form.Control let:attrs>
					<Form.Label>Výměra (m²)</Form.Label>
					<Input {...attrs} type="number" step="0.001" bind:value={$formData.squareMeters} />
				</Form.Control>
				<Form.Description>Aktuální výměra užívaná subjektem.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
			<!-- Fixed heating cost share -->
			<Form.Field form={editForm} name="heatingFixedCostShare" class="flex-1">
				<Form.Control let:attrs>
					<Form.Label>Podíl na fixním nákladu tepla</Form.Label>
					<Input
						{...attrs}
						type="number"
						step="0.001"
						bind:value={$formData.heatingFixedCostShare}
					/>
				</Form.Control>
				<Form.Description>
					Definuje, jestli a jakým podílem přispívá subjekt k opakovanému fixnímu nákladu tepla.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
	<fieldset class="py-2">
		<div class="pb-4">
			<legend class="font-medium leading-none text-base py-2">Spotřeba na základě výměry</legend>
			<p class="text-[0.8rem] text-muted-foreground">
				Vyberte, které spotřeby jsou účtovány na základě výměry subjektu.
			</p>
		</div>
		<div class="py-2">
			{#each energyTypes as energyType}
				<Form.Field form={editForm} name={`chargedUnmeasured${capitalize(energyType)}`}>
					<div class="flex flex-row items-start space-x-3">
						<Form.Control let:attrs>
							<Checkbox
								{...attrs}
								bind:checked={$formData[`chargedUnmeasured${capitalize(energyType)}`]}
							/>
							<Form.Label class="flex gap-1 items-center font-normal">
								<EnergyTypeIcon class="w-4 h-4" {energyType} withTooltip={false} />
								{labelsByEnergyType[energyType]}
							</Form.Label>
							<input
								name={attrs.name}
								value={$formData[`chargedUnmeasured${capitalize(energyType)}`]}
								hidden
							/>
						</Form.Control>
					</div>
					<Form.FieldErrors />
				</Form.Field>
			{/each}
		</div>
	</fieldset>
	<Form.Button disabled={$delayed || !isTainted($tainted)} class="mt-1">
		{$delayed ? 'Ukládám ...' : 'Uložit'}
	</Form.Button>
</form>
