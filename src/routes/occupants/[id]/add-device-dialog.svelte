<script lang="ts">
	import { pushState } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { insertMeasuringDeviceSchema, type EnergyType, type ID } from '$lib/models/schema';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: SuperValidated<Infer<typeof insertMeasuringDeviceSchema>>;
	export let occupantId: ID;

	const form = superForm(data, {
		validators: zodClient(insertMeasuringDeviceSchema),
		onError({ result }) {
			// TODO: better error messages
			toast.error(result.error.message);
		},
		onUpdated({ form }) {
			if (form.valid && form.message) {
				toast.success(form.message);
			}
		}
	});

	const { form: formData, enhance, delayed } = form;

	const energies: { value: EnergyType; label: string }[] = [
		{ value: 'electricity', label: 'Electricity' },
		{ value: 'heating', label: 'Heating' },
		{ value: 'water', label: 'Water' }
	];
</script>

<Dialog.Root
	open
	onOpenChange={(isOpen) => {
		// The dialog uses shallow routing, so it can be closed by navigating back
		if (!isOpen) pushState('', { showModal: false });
	}}
>
	<Dialog.Trigger />
	<Dialog.Content class="sm:max-w-[425px]">
		<form method="post" action="?/createMeasuringDevice" use:enhance>
			<input type="hidden" name="occupantId" value={occupantId} />
			<Dialog.Header>
				<Dialog.Title>Add measuring device</Dialog.Title>
				<Dialog.Description>
					Create and add new measuring device. Click save when you're done.
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						<Form.Label>Name</Form.Label>
						<Input {...attrs} class="col-span-3" bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="energyType">
					<Form.Control let:attrs>
						<Form.Label>Energy type</Form.Label>
						<Select.Root>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select ..." />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each energies as energy}
										<Select.Item {...energy}>{energy.label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input {...attrs} />
						</Select.Root>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Form.Button disabled={$delayed}>{$delayed ? 'Saving ...' : 'Save'}</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
