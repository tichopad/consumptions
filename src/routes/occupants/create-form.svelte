<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { labelsByEnergyType } from '$lib/models/common';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms/client';
	import { createOccupantFormSchema, type CreateOccupantForm } from './create-form-schema';

	/** Form's data */
	export let data: SuperValidated<Infer<CreateOccupantForm>>;

	/** Is form dialog open? */
	export let open = false;

	const form = superForm(data, {
		validators: zodClient(createOccupantFormSchema),
		onError({ result }) {
			console.log(result.error);
		},
		onUpdated({ form }) {
			console.log(form);
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger />
	<Dialog.Content class="sm:max-w-[425px]">
		<form method="post" action="?/createOccupant" use:enhance>
			<!-- Header -->
			<Dialog.Header>
				<Dialog.Title>Create new occupant</Dialog.Title>
				<Dialog.Description>
					Create and add new occupant. Click save when you're done.
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<!-- Name -->
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Name</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Area -->
				<Form.Field {form} name="squareMeters">
					<Form.Control let:attrs>
						<Form.Label>Area (m²)</Form.Label>
						<Input
							{...attrs}
							type="number"
							step="0.01"
							class="col-span-3"
							bind:value={$formData.squareMeters}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Fixed heating cost share -->
				<Form.Field {form} name="heatingFixedCostShare">
					<Form.Control let:attrs>
						<Form.Label>Fixed heating cost share</Form.Label>
						<Input
							{...attrs}
							type="number"
							step="0.01"
							class="col-span-3"
							bind:value={$formData.heatingFixedCostShare}
						/>
						<Form.Description>
							Defines if and how much does the occupant contribute to the recurring fixed heating
							cost.
						</Form.Description>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Unmeasured energy types -->
				<fieldset class="pt-2">
					<div class="pb-4">
						<legend class="font-medium leading-none text-base py-2"
							>Consumption charged by area</legend
						>
						<p class="text-[0.8rem] text-muted-foreground">
							Select which energy consumption is charged based on occupant's area.
						</p>
					</div>
					<div class="py-2">
						<!-- Electricity -->
						<Form.Field {form} name="chargedUnmeasuredElectricity">
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
						<Form.Field {form} name="chargedUnmeasuredHeating">
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
						<Form.Field {form} name="chargedUnmeasuredWater">
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
			</div>
			<Dialog.Footer>
				<Form.Button disabled={$delayed}>{$delayed ? 'Saving ...' : 'Save'}</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
