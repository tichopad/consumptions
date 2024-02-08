<div class="flex flex-col w-full min-h-screen">
	<header class="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
		<nav
			class="flex-col hidden gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			<a class="flex items-center gap-2 text-lg font-semibold md:text-base" href="#"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="w-6 h-6"
					><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path
						d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"
					></path><path d="M12 3v6"></path></svg
				><span class="sr-only">Acme Inc</span></a
			><a class="font-bold" href="#"> Dashboard </a><a
				class="text-gray-500 dark:text-gray-400"
				href="#"
			>
				Bills
			</a><a class="text-gray-500 dark:text-gray-400" href="#"> Measurements </a>
		</nav>
		<div class="flex items-center w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<form class="flex-1 ml-auto sm:flex-initial">
				<div class="relative">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400"
						><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg
					><input
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
						placeholder="Search bills..."
						type="search"
					/>
				</div>
			</form>
			<button
				class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 rounded-full"
				><img
					src="https://play-lh.googleusercontent.com/M9pAMJrC6s8XbWDs3CNxvsZStRFvi16nV4Yu0_K1oNcvfrDtTig5ZvRJPeKdeqttqQ"
					width="32"
					height="32"
					class="rounded-full"
					alt="Avatar"
					style="aspect-ratio: 32 / 32; object-fit: cover;"
				/><span class="sr-only">Toggle user menu</span></button
			>
		</div>
	</header>
	<main
		class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
	>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
				<div class="p-6 flex flex-row items-center justify-between pb-2 space-y-0">
					<h3 class="whitespace-nowrap tracking-tight text-sm font-medium">Total Energy Costs</h3>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4 text-gray-500 dark:text-gray-400"
						><line x1="12" x2="12" y1="2" y2="22"></line><path
							d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
						></path></svg
					>
				</div>
				<div class="p-6">
					<div class="text-2xl font-bold">1,145,231.89 CZK</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">+20.1% from last month</p>
				</div>
			</div>
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
				<div class="p-6 flex flex-row items-center justify-between pb-2 space-y-0">
					<h3 class="whitespace-nowrap tracking-tight text-sm font-medium">
						Electricity Consumption
					</h3>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4 text-gray-500 dark:text-gray-400"
						><path
							d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
						></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg
					>
				</div>
				<div class="p-6">
					<div class="text-2xl font-bold">+2350 kWh</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">+180.1% from last month</p>
				</div>
			</div>
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
				<div class="p-6 flex flex-row items-center justify-between pb-2 space-y-0">
					<h3 class="whitespace-nowrap tracking-tight text-sm font-medium">Water Consumption</h3>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4 text-gray-500 dark:text-gray-400"
						><path
							d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"
						></path><path
							d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"
						></path></svg
					>
				</div>
				<div class="p-6">
					<div class="text-2xl font-bold">+12,234 m3</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">+19% from last month</p>
				</div>
			</div>
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
				<div class="p-6 flex flex-row items-center justify-between pb-2 space-y-0">
					<h3 class="whitespace-nowrap tracking-tight text-sm font-medium">Heating Consumption</h3>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4 text-gray-500 dark:text-gray-400"
						><path
							d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
						></path></svg
					>
				</div>
				<div class="p-6">
					<div class="text-2xl font-bold">+573 GJ</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">+201 since last hour</p>
				</div>
			</div>
		</div>
		<div>
			<div class="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
				<div class="relative w-full overflow-auto">
					<table class="w-full caption-bottom text-sm">
						<thead class="[&amp;_tr]:border-b"
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><th
									class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 w-[100px]"
									>Bill</th
								><th
									class="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 text-right"
									>Amount (CZK)</th
								></tr
							></thead
						><tbody class="[&amp;_tr:last-child]:border-0"
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium"
									>BILL001</td
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right"
									>6,250.00 CZK</td
								></tr
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium"
									>BILL002</td
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right"
									>3,750.00 CZK</td
								></tr
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium"
									>BILL003</td
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right"
									>8,750.00 CZK</td
								></tr
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium"
									>BILL004</td
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right"
									>11,250.00 CZK</td
								></tr
							><tr
								class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium"
									>BILL005</td
								><td class="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right"
									>13,750.00 CZK</td
								></tr
							></tbody
						>
					</table>
				</div>
			</div>
		</div>
	</main>
</div>
