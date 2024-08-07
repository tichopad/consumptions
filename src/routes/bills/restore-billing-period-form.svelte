<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { startEndDateFmt } from '$lib/i18n/helpers';
	import type { BillingPeriod } from '$lib/models/billing-period';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import {
		archiveBillingPeriodFormSchema,
		type ArchiveBillingPeriodForm
	} from './archive-billing-period-form-schema';

	/** Controls whether the dialog's open */
	export let open = false;
	/** Form data from superforms */
	export let data: SuperValidated<Infer<ArchiveBillingPeriodForm>>;
	/** The billingPeriod */
	export let billingPeriod: BillingPeriod | null;

	const form = superForm(data, {
		validators: zodClient(archiveBillingPeriodFormSchema),
		onUpdated({ form }) {
			if (form.valid) {
				if (form.posted) {
					open = false;
				}
				toast.success(form.message ?? 'Vyúčtování bylo obnoveno.');
			} else {
				toast.error(form.message ?? 'Nepodařilo se obnovit vyúčtování.');
			}
		},
		onError({ result }) {
			if (result.error.message) {
				toast.error(result.error.message);
			}
		}
	});
	const { form: formData, enhance, delayed } = form;

	$: if (billingPeriod) {
		$formData.billingPeriodId = billingPeriod.id;
		$formData.startDate = billingPeriod.startDate;
		$formData.endDate = billingPeriod.endDate;
	}
</script>

{#if billingPeriod !== null}
	<Dialog.Root bind:open>
		<Dialog.Trigger />
		<Dialog.Content class="sm:max-w-[425px]">
			<form method="post" action="?/restoreBillingPeriod" use:enhance>
				<input type="hidden" name="billingPeriodId" bind:value={$formData.billingPeriodId} />
				<input type="hidden" name="startDate" bind:value={$formData.startDate} />
				<input type="hidden" name="endDate" bind:value={$formData.endDate} />
				<Dialog.Header>
					<Dialog.Title class="flex flex-col items-start gap-1">
						<span>Obnovit vyúčtování</span>
						<span>{startEndDateFmt(billingPeriod)}?</span>
					</Dialog.Title>
					<Dialog.Description class="py-2">
						Tato operace znovu zpřístupní vyúčtování.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer class="pt-3">
					<Button type="button" variant="outline" on:click={() => (open = false)}>Ne</Button>
					<Form.Button disabled={$delayed}>{$delayed ? 'Obnovuji ...' : 'Ano'}</Form.Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
