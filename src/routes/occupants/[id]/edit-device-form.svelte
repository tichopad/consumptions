<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { Occupant } from '$lib/models/occupant';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editDeviceFormSchema } from './edit-device-form-schema';
	import type { MeasuringDevice } from '$lib/models/measuring-device';

	/** Form data coming from superforms */
	export let data: SuperValidated<Infer<typeof editDeviceFormSchema>>;
	/** Device owner */
	export let occupant: Occupant;
	/** The device data */
	export let device: MeasuringDevice | null = null;
	/** Controls whether the dialog's open */
	export let open = false;

	const form = superForm(data, {
		invalidateAll: 'force',
		validators: zodClient(editDeviceFormSchema),
		onUpdated({ form }) {
			if (form.valid) {
				if (form.posted) {
					open = false;
				}
				toast.success(form.message ?? `Měřící zařízení ${form.data.name} bylo aktualizováno.`);
			} else {
				toast.error(`Nepodařilo se aktualizovat měřící zařízení pro subjekt ${occupant.name}.`);
			}
		},
		onError({ result }) {
			if (result.error.message) {
				toast.error(result.error.message);
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	// Set default values
	// TODO: Explore whether it's not a better idea to handle the edit dialog differently
	// E.g. form-per-device or a separate route for the dialog
	$: if (device) $formData = device;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger />
	<Dialog.Content class="sm:max-w-[425px]">
		<form method="post" action="?/editMeasuringDevice" use:enhance>
			<input type="hidden" name="id" bind:value={$formData.id} />
			<Dialog.Header>
				<Dialog.Title>Přejmenovat měřící zařízení</Dialog.Title>
				<Dialog.Description>
					Změňte název měřícího zařízení a klikněte na tlačítko Uložit, pokud je vše hotovo.
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Název</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Form.Button disabled={$delayed}>{$delayed ? 'Ukládám ...' : 'Uložit'}</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
