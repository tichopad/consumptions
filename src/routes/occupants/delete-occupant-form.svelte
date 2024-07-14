<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { type Occupant } from '$lib/models/schema';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { deleteOccupantFormSchema, type DeleteOccupantForm } from './delete-occupant-form-schema';

	/** Controls whether the dialog's open */
	export let open = false;
	/** Form data from superforms */
	export let data: SuperValidated<Infer<DeleteOccupantForm>>;
	/** The occupant */
	export let occupant: Occupant | null;

	const form = superForm(data, {
		validators: zodClient(deleteOccupantFormSchema),
		onUpdated({ form }) {
			if (form.valid) {
				if (form.posted) {
					open = false;
				}
				toast.success(form.message ?? 'Subjekt byl odstraněn.');
			} else {
				toast.error('Nepodařilo se odstranit subjekt.');
			}
		},
		onError({ result }) {
			if (result.error.message) {
				toast.error(result.error.message);
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	$: if (occupant) {
		$formData.occupantId = occupant.id;
		$formData.name = occupant.name;
	}
</script>

{#if occupant !== null}
	<Dialog.Root bind:open>
		<Dialog.Trigger />
		<Dialog.Content class="sm:max-w-[425px]">
			<form method="post" action="?/deleteOccupant" use:enhance>
				<input type="hidden" name="occupantId" bind:value={$formData.occupantId} />
				<input type="hidden" name="name" bind:value={$formData.name} />
				<Dialog.Header>
					<Dialog.Title>Odstranit subjekt {occupant.name}?</Dialog.Title>
					<Dialog.Description class="py-2">
						Tato operace je <b>nevratná</b>! Záznamy spojené s tímto subjektem však budou zachovány.
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
