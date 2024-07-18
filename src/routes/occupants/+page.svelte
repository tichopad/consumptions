<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import { dateFmt } from '$lib/i18n/helpers';
	import type { Occupant } from '$lib/models/occupant';
	import ArchiveOccupantForm from './archive-occupant-form.svelte';
	import CreateForm from './create-form.svelte';
	import DeleteOccupantForm from './delete-occupant-form.svelte';
	import OccupantsList from './occupants-list.svelte';
	import RestoreOccupantForm from './restore-occupant-form.svelte';
	import { Archive as ArchiveIcon, Reset as ResetIcon, Trash as TrashIcon } from 'svelte-radix';

	export let data;

	// The selected occupant for the archive and delete dialogs
	let selectedOccupant: Occupant | null = null;

	// Controls whether the create dialog is open
	let createDialogOpen = false;
	// Controls whether the archive dialog is open
	let archiveDialogOpen = false;
	// Controls whether the delete dialog is open
	let deleteDialogOpen = false;
	// Controls whether the restore dialog is open
	let restoreDialogOpen = false;

	// Opens the archive occupant dialog
	const openArchiveOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		archiveDialogOpen = true;
	};
	// Opens the delete occupant dialog
	const openDeleteOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		deleteDialogOpen = true;
	};
	// Opens the restore occupant dialog
	const openRestoreOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		restoreDialogOpen = true;
	};
</script>

<!-- Occupant creation form -->
<CreateForm data={data.createForm} bind:open={createDialogOpen} />

<!-- Occupant archival form -->
<ArchiveOccupantForm
	data={data.archiveForm}
	occupant={selectedOccupant}
	bind:open={archiveDialogOpen}
/>

<!-- Occupant deletion form -->
<DeleteOccupantForm
	data={data.deleteForm}
	occupant={selectedOccupant}
	bind:open={deleteDialogOpen}
/>

<!-- Occupant restoration form -->
<RestoreOccupantForm
	data={data.restoreForm}
	occupant={selectedOccupant}
	bind:open={restoreDialogOpen}
/>

<Page>
	<section slot="header">
		<div class="flex justify-between items-center">
			<Header1>Subjekty</Header1>
			<Button on:click={() => (createDialogOpen = true)}>Přidat</Button>
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
					<OccupantsList
						emptyMessage="Zatím nejsou žádné subjekty k dispozici. Stiskněte na tlačítko Přidat pro přidání prvního."
						occupants={data.unarchivedOccupants}
						actions={[
							{
								label: 'Archivovat',
								title: 'Archivovat subjekt',
								icon: ArchiveIcon,
								onClick: openArchiveOccupant
							}
						]}
						extraColumns={[
							{
								label: 'Vytvořeno',
								value: (occupant) => {
									return dateFmt(occupant.created, { dateStyle: 'medium', timeStyle: undefined });
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
					<OccupantsList
						emptyMessage="Zatím nebyly žádné subjekty archivovány."
						occupants={data.archivedOccupants}
						actions={[
							{
								label: 'Obnovit',
								title: 'Obnovit subjekt',
								icon: ResetIcon,
								onClick: openRestoreOccupant
							},
							{
								label: 'Vymazat',
								title: 'Vymazat subjekt',
								icon: TrashIcon,
								onClick: openDeleteOccupant
							}
						]}
						extraColumns={[
							{
								label: 'Archivováno',
								value: (occupant) => {
									if (occupant.archived === null) return '-';
									return dateFmt(occupant.archived, { dateStyle: 'medium', timeStyle: undefined });
								}
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</Page>
