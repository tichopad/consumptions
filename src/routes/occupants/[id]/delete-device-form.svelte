<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { type MeasuringDevice } from '$lib/models/schema';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { deleteDeviceFormSchema, type DeleteDeviceForm } from './delete-device-form-schema';

	/** Controls whether the dialog's open */
	export let open = false;
	/** Form data from superforms */
	export let data: SuperValidated<Infer<DeleteDeviceForm>>;
	/** The device */
	export let device: MeasuringDevice | null;

	const form = superForm(data, {
		validators: zodClient(deleteDeviceFormSchema),
		onUpdated({ form }) {
			if (form.valid) {
				if (form.posted) {
					open = false;
				}
				toast.success(form.message ?? 'Měřící zařízení bylo odebráno.');
			} else {
				toast.error('Nepodařilo se odebrat měřící zařízení.');
			}
		},
		onError({ result }) {
			if (result.error.message) {
				toast.error(result.error.message);
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	$: if (device) {
		$formData.deviceId = device.id;
		$formData.name = device.name;
	}
</script>

{#if device !== null}
	<Dialog.Root bind:open>
		<Dialog.Trigger />
		<Dialog.Content class="sm:max-w-[425px]">
			<form method="post" action="?/deleteMeasuringDevice" use:enhance>
				<input type="hidden" name="deviceId" bind:value={$formData.deviceId} />
				<input type="hidden" name="name" bind:value={$formData.name} />
				<Dialog.Header>
					<Dialog.Title>Odstranit měřící zařízení {device.name}?</Dialog.Title>
					<Dialog.Description class="py-2">
						Tato operace je <b>nevratná</b>! Záznamy spojené s tímto zařízením budou zachovány.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer class="pt-3">
					<Button type="button" variant="outline" on:click={() => (open = false)}>Ne</Button>
					<Form.Button disabled={$delayed}>{$delayed ? 'Odstraňuji ...' : 'Ano'}</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
