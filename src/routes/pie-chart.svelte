<script lang="ts">
	import type { PieChartData } from '$lib/common-types';
	import { currencyFmt } from '$lib/i18n/helpers';
	import * as echarts from 'echarts';
	import { init } from 'echarts/core';
	import { Chart } from 'svelte-echarts';

	/** Data for the chart */
	export let chartData: PieChartData = [];

	/** Size of the chart (in pixels) */
	export let size = 300;

	const options = {
		tooltip: {
			trigger: 'item',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			formatter: ({ value }: any) => currencyFmt(value),
			textStyle: {
				fontSize: '0.9em'
			}
		},
		legend: {
			top: 'top',
			left: '-4.5em',
			orient: 'horizontal'
		},
		series: [
			{
				type: 'pie',
				radius: ['40%', '70%'],
				padAngle: 1,
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 10,
					borderColor: '#fff',
					borderWidth: 1
				},
				label: {
					show: false,
					position: 'center'
				},
				emphasis: {
					label: {
						show: true
					}
				},
				labelLine: {
					show: false
				},
				top: '25%',
				width: '100%',
				data: chartData
			}
		]
	} satisfies echarts.EChartsOption;
</script>

<div style="width: 100%; height: {size}px;">
	<Chart {init} {options} />
</div>
