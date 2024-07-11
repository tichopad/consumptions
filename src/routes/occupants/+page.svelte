<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import Header1 from '$lib/components/ui/typography/header1.svelte';
	import Page from '$lib/components/ui/typography/page.svelte';
	import type { Occupant } from '$lib/models/occupant';
	import ArchiveOccupantForm from './archive-occupant-form.svelte';
	import CreateForm from './create-form.svelte';
	import OccupantsList from './occupants-list.svelte';

	export let data;

	// Controls whether the create dialog is open
	let createDialogOpen = false;
	// Controls whether the archive dialog is open
	let archiveDialogOpen = false;
	// The selected occupant for the archive dialog
	let selectedOccupant: Occupant | null = null;

	// Opens the archive occupant dialog
	const openDeleteOccupant = (occupant: Occupant) => {
		selectedOccupant = occupant;
		archiveDialogOpen = true;
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
						occupants={data.unarchivedOccupants}
						actions={[
							{
								label: 'Archivovat',
								title: 'Archivovat subjekt',
								onClick: openDeleteOccupant
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
						occupants={data.archivedOccupants}
						actions={[
							{
								label: 'Odstranit',
								title: 'Odstranit subjekt',
								// TODO: implement
								onClick: console.log
							}
						]}
					/>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</Page>
