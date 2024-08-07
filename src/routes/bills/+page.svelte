<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { dateFmt } from '$lib/i18n/helpers';
	import type { BillingPeriod } from '$lib/models/billing-period';
	import { Archive as ArchiveIcon, Reset as ResetIcon, Trash as TrashIcon } from 'svelte-radix';
	import ArchiveBillingPeriodForm from './archive-billing-period-form.svelte';
	import BillsList from './bills-list.svelte';
	import DeleteBillingPeriodForm from './delete-billing-period-form.svelte';
	import RestoreBillingPeriodForm from './restore-billing-period-form.svelte';

	export let data;

	// The selected billing period for the archive and delete dialogs
	let selectedBillingPeriod: BillingPeriod | null = null;

	// Controls whether the archive dialog is open
	let archivedDialogOpen = false;
	// Controls whether the restore dialog is open
	let restoredDialogOpen = false;
	// Controls whether the delete dialog is open
	let deletedDialogOpen = false;

	// Opens the archive billing period dialog
	const archiveBillingPeriod = (billingPeriod: BillingPeriod) => {
		selectedBillingPeriod = billingPeriod;
		archivedDialogOpen = true;
	};
	// Opens the restore billing period dialog
	const restoreBillingPeriod = (billingPeriod: BillingPeriod) => {
		selectedBillingPeriod = billingPeriod;
		restoredDialogOpen = true;
	};
	// Opens the delete billing period dialog
	const deleteBillingPeriod = (billingPeriod: BillingPeriod) => {
		selectedBillingPeriod = billingPeriod;
		deletedDialogOpen = true;
	};
</script>

<!-- Billing period archive form -->
<ArchiveBillingPeriodForm
	billingPeriod={selectedBillingPeriod}
	bind:open={archivedDialogOpen}
	data={data.archiveBillingPeriodForm}
/>

<!-- Billing period restore form -->
<RestoreBillingPeriodForm
	billingPeriod={selectedBillingPeriod}
	bind:open={restoredDialogOpen}
	data={data.restoreBillingPeriodForm}
/>

<!-- Billing period delete form -->
<DeleteBillingPeriodForm
	billingPeriod={selectedBillingPeriod}
	bind:open={deletedDialogOpen}
	data={data.deleteBillingPeriodForm}
/>

<Page>
	<section slot="header">
		<div class="flex justify-between items-center">
			<Header1>Vyučtování</Header1>
			<Button href="/bills/create">Vytvořit</Button>
		</div>
	</section>
	<Tabs.Root value="unarchived">
		<Tabs.List>
			<Tabs.Trigger value="unarchived">Aktivní</Tabs.Trigger>
			<Tabs.Trigger value="archived">Archivované</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="unarchived">
			<Card.Root>
				<Card.Content class="pt-6">
					<BillsList
						actions={[
							{
								label: 'Archivovat',
								title: 'Archivovat vyúčtování',
								icon: ArchiveIcon,
								onClick: archiveBillingPeriod
							}
						]}
						billingPeriods={data.billingPeriodsWithEnergyBills}
						emptyMessage="Zatím nebyly vytvořeny žádná vyúčtování. Stiskněte na tlačítko Vytvořit pro přidání prvního."
						extraColumns={[
							{
								label: 'Vytvořeno',
								value: (billingPeriod) => {
									return dateFmt(billingPeriod.created, {
										dateStyle: 'medium',
										timeStyle: undefined
									});
								}
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="archived">
			<Card.Root>
				<Card.Content class="pt-6">
					<BillsList
						actions={[
							{
								label: 'Obnovit',
								title: 'Obnovit vyúčtování',
								icon: ResetIcon,
								onClick: restoreBillingPeriod
							},
							{
								label: 'Vymazat',
								title: 'Vymazat vyúčtování',
								icon: TrashIcon,
								onClick: deleteBillingPeriod
							}
						]}
						billingPeriods={data.archivedBillingPeriodsWithEnergyBills}
						emptyMessage="Zatím nebyly žádné subjekty archivovány."
						extraColumns={[
							{
								label: 'Vymazat',
								value: (billingPeriod) => {
									if (billingPeriod.archived === null) return '-';
									return dateFmt(billingPeriod.archived, {
										dateStyle: 'medium',
										timeStyle: undefined
									});
								}
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</Page>
