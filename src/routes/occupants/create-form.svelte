<script lang="ts">
	import EnergyTypeIcon from '$lib/components/icons/energy-type.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { logger } from '$lib/logger';
	import { energyTypes, labelsByEnergyType } from '$lib/models/common';
	import { capitalize } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms/client';
	import { createOccupantFormSchema, type CreateOccupantForm } from './create-edit-form-schema';

	/** Form's data */
	export let data: SuperValidated<Infer<CreateOccupantForm>>;

	/** Is form dialog open? */
	export let open = false;

	const form = superForm(data, {
		validators: zodClient(createOccupantFormSchema),
		onError({ result }) {
			logger.error({ result }, 'Create occupant form error');
			toast.error(result.error.message);
		},
		onUpdated({ form }) {
			logger.info({ form }, 'Create occupant form updated');
			if (form.valid) {
				toast.success(form.message ?? 'Nový subjekt vytvořen.');
			}
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
				<Dialog.Title>Nový subjekt</Dialog.Title>
				<Dialog.Description>
					Vytvořte a přidejte nový subjekt. Klikněte na tlačítko Uložit, pokud je vše hotovo.
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<!-- Name -->
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Název</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Area -->
				<Form.Field {form} name="squareMeters">
					<Form.Control let:attrs>
						<Form.Label>Výměra (m²)</Form.Label>
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
						<Form.Label>Podíl na fixním nákladu</Form.Label>
						<Input
							{...attrs}
							type="number"
							step="0.01"
							class="col-span-3"
							bind:value={$formData.heatingFixedCostShare}
						/>
						<Form.Description>
							Definuje, jestli a jak moc přispívá subjekt k opakovanému fixnímu nákladu. Opakovaný
							fixní náklad se týká pouze tepelné energie.
						</Form.Description>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Unmeasured energy types -->
				<fieldset class="pt-2">
					<div class="pb-4">
						<legend class="font-medium leading-none text-base py-2">
							Energie účtované dle výměry
						</legend>
						<p class="text-[0.8rem] text-muted-foreground">
							Vyberte, které energie budou subjektu účtovány dle výměru. Nevybírejte, pokud je
							subjektu účtována pouze měřená spotřeba.
						</p>
					</div>
					<div class="py-2">
						{#each energyTypes as energyType}
							<Form.Field {form} name={`chargedUnmeasured${capitalize(energyType)}`}>
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
			</div>
			<Dialog.Footer>
				<Form.Button disabled={$delayed}>{$delayed ? 'Saving ...' : 'Save'}</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
