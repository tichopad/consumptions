<script>
	import '../app.css';
	import Package from '$lib/components/icons/package.svelte';
	import SearchIcon from '$lib/components/icons/search.svelte';
	import { Input } from '$lib/components/ui/input';
</script>

<div class="flex flex-col w-full min-h-screen">
	<header class="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
		<nav
			class="flex-col hidden gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			<a class="flex items-center gap-2 text-lg font-semibold md:text-base" href="/">
				<Package class="w-6 h-6" />
				<span class="sr-only">Oliera Consumptions Logo</span>
			</a>
			<a class="font-bold" href="/">Dashboard</a>
			<a class="text-gray-500 dark:text-gray-400" href="/buildings">Buildings</a>
			<a class="text-gray-500 dark:text-gray-400" href="/occupants">Occupants</a>
			<a class="text-gray-500 dark:text-gray-400" href="/bills">Bills</a>
		</nav>
		<div class="flex items-center w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<form class="flex-1 ml-auto sm:flex-initial">
				<div class="relative">
					<SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
					<Input
						class="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
						placeholder="Search bills..."
						type="search"
					/>
				</div>
			</form>
		</div>
	</header>
</div>
<main
	class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
	<slot />
</main>
