import { LibsqlError } from '@libsql/client';

interface LibsqlForeignKeyConstraintError extends LibsqlError {
	code: 'SQLITE_CONSTRAINT';
}

/**
 * Guard that checks for foreign key constraint errors
 */
export function isFailedForeignKeyConstraint(
	error: unknown
): error is LibsqlForeignKeyConstraintError {
	return error instanceof LibsqlError && error.code === 'SQLITE_CONSTRAINT';
}
