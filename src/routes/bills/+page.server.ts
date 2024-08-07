import { startEndDateFmt } from '$lib/i18n/helpers';
import { logger } from '$lib/logger';
import { billingPeriods } from '$lib/models/schema';
import { db } from '$lib/server/db/client';
import { isFailedForeignKeyConstraint } from '$lib/server/db/helpers';
import { error, type Actions, type Load } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { archiveBillingPeriodFormSchema } from './archive-billing-period-form-schema';
import { deleteBillingPeriodFormSchema } from './delete-billing-period-form-schema';
import { restoreBillingPeriodFormSchema } from './restore-billing-period-form-schema';

const archiveSchema = zod(archiveBillingPeriodFormSchema);
const restoreSchema = zod(restoreBillingPeriodFormSchema);
const deleteSchema = zod(deleteBillingPeriodFormSchema);

export const load: Load = async () => {
	logger.info('Loading billing periods data');

	const billingPeriodsWithEnergyBills = await db.query.billingPeriods.findMany({
		orderBy: [desc(billingPeriods.endDate), desc(billingPeriods.startDate)],
		where: and(eq(billingPeriods.isArchived, false), eq(billingPeriods.isDeleted, false)),
		with: {
			energyBills: {
				where: isNotNull(billingPeriods.buildingId)
			}
		}
	});

	logger.info('Loaded %d billing periods', billingPeriodsWithEnergyBills.length);

	const archivedBillingPeriodsWithEnergyBills = await db.query.billingPeriods.findMany({
		orderBy: [desc(billingPeriods.endDate), desc(billingPeriods.startDate)],
		where: and(eq(billingPeriods.isArchived, true), eq(billingPeriods.isDeleted, false)),
		with: {
			energyBills: {
				where: isNotNull(billingPeriods.buildingId)
			}
		}
	});

	logger.info('Loaded %d archived billing periods', archivedBillingPeriodsWithEnergyBills.length);

	// Load forms data and prepare forms objects
	const [archiveBillingPeriodForm, restoreBillingPeriodForm, deleteBillingPeriodForm] =
		await Promise.all([
			superValidate(archiveSchema, { id: 'archiveForm' }),
			superValidate(restoreSchema, { id: 'restoreForm' }),
			superValidate(deleteSchema, { id: 'deleteForm' })
		]);

	return {
		archiveBillingPeriodForm,
		archivedBillingPeriodsWithEnergyBills,
		billingPeriodsWithEnergyBills,
		deleteBillingPeriodForm,
		restoreBillingPeriodForm
	};
};

export const actions: Actions = {
	/**
	 * Handles billing period archiving
	 */
	archiveBillingPeriod: async (event) => {
		const form = await superValidate(event, archiveSchema);

		if (!form.valid) {
			logger.info('Failed archiveBillingPeriod form validation. Errors: %o', form.errors);
			return message(form, 'Údaje vyúčtování nebyly správně vyplněny.');
		}

		await db
			.update(billingPeriods)
			.set({ isArchived: true, archived: new Date() })
			.where(eq(billingPeriods.id, form.data.billingPeriodId));

		logger.info('Archived billing period: %o', form.data);

		const formattedDateRange = startEndDateFmt(form.data);

		return message(form, `Vyúčtování ${formattedDateRange} bylo archivováno.`);
	},
	/**
	 * Handles billing period restoration (unarchiving)
	 */
	restoreBillingPeriod: async (event) => {
		const form = await superValidate(event, deleteSchema);

		if (!form.valid) {
			logger.info('Failed restoreBillingPeriod form validation. Errors: %o', form.errors);
			return message(form, 'Údaje vyúčtování nebyly správně vyplněny.');
		}

		await db
			.update(billingPeriods)
			.set({ isArchived: false, archived: null })
			.where(eq(billingPeriods.id, form.data.billingPeriodId));

		logger.info('Restored billing period %o', form.data);

		const formattedDateRange = startEndDateFmt(form.data);

		return message(form, `Vyúčtování ${formattedDateRange} bylo obnoveno.`);
	},
	/**
	 * Handles billing period deletion
	 */
	deleteBillingPeriod: async (event) => {
		const form = await superValidate(event, deleteSchema);

		if (!form.valid) {
			logger.info('Failed deleteBillingPeriod form validation. Errors: %o', form.errors);
			return message(form, 'Údaje vyúčtování nebyly správně vyplněny.');
		}

		try {
			// Soft-deleting is the way to go, but let's first try hard delete to save on storage
			await db.delete(billingPeriods).where(eq(billingPeriods.id, form.data.billingPeriodId));
			logger.info('Hard-deleted billing period: %o', form.data);
		} catch (deletionError) {
			logger.error(
				'Failed to delete an billing period, falling back to soft-delete. Error: %o',
				deletionError
			);
			// If we get here, it means the device has live relations, so we soft-delete instead
			if (isFailedForeignKeyConstraint(deletionError)) {
				await db
					.update(billingPeriods)
					.set({ isDeleted: true, deleted: new Date() })
					.where(eq(billingPeriods.id, form.data.billingPeriodId));
				logger.info('Soft-deleted billing period %o', form.data);
			} else {
				logger.error(
					{ deletionError },
					'Failed to delete an billing period but not due to foreign key constraint'
				);
				return error(500, { message: 'Nepodařilo se odstranit vyúčtování' });
			}
		}

		const formattedDateRange = startEndDateFmt(form.data);

		return message(form, `Vyúčtování ${formattedDateRange} bylo odstraněno.`);
	}
};
