/**
 * Describes a certain period of time
 */
export type DateRange = {
	start: Date;
	end: Date;
};

/**
 * Data for a chart
 */
export type PieChartData = Array<{
	name: string;
	value: number;
}>;
