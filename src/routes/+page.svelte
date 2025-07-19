<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';

	let guides = [
		{
			title: 'Langkah 1',
			text: 'Cari tempat yang nyaman dan kondusif supaya kamu lebih fokus dan teliti.'
		},
		{
			title: 'Langkah 2',
			text: 'Masukkan nama lengkap, kelas, dan gugus sebelum memulai tes.'
		},
		{
			title: 'Langkah 3',
			text: 'Jawab pertanyaan dengan jujur, pilih seberapa sering kamu melakukan hal tersebut.'
		},
		{
			title: 'Langkah 4',
			text: 'Lihat hasil tipe belajar kamu: Visual, Auditori, atau Kinestetik.'
		}
	];

	let current = 0;
	let previous = 0;
	let direction = 1;
	let interval;

	onMount(() => {
		// const saved = localStorage.getItem('vak-answers');
		// if (saved) {
		// 	const answers = JSON.parse(saved);
		// 	if (Object.keys(answers).length >= 33) {
		// 		goto('/result');
		// 	}
		// }

		interval = setInterval(() => next(), 5000);
	});

	function mulaiTes() {
		goto('/test');
	}

	function next() {
		previous = current;
		direction = 1;
		current = (current + 1) % guides.length;
	}

	function prev() {
		previous = current;
		direction = -1;
		current = (current - 1 + guides.length) % guides.length;
	}

	const getFly = (dir) => ({ x: dir * 300, duration: 300 });

	let touchStartX = 0;
	let touchEndX = 0;

	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event) {
		touchEndX = event.changedTouches[0].clientX;
		let diff = touchStartX - touchEndX;
		if (Math.abs(diff) > 50) {
			if (diff > 0) {
				next();
			} else {
				prev();
			}
		}
	}
</script>


<main
	class="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-blue-300 to-blue-400 text-center"
>
	<div class="">&nbsp;</div>
	<!-- Logo -->
	<div class="mx-auto my-4 w-full max-w-2xl">
		<img
			src="/img/logo.png"
			alt="Logo VAK"
			class="h-[55vw] max-h-56 w-full object-contain drop-shadow-xl"
		/>
		<!-- Header -->
		<div class="mt-6 px-4 text-left">
			<h1 class="drop-shadow-xl text-3xl font-bold text-white sm:text-4xl md:text-5xl">
				Tes Gaya Belajar
			</h1>
			<p class="mt-1 text-sm font-medium text-white md:text-xl md:mt-3 drop-shadow">
				Cari tahu apakah kamu Visual, Auditori, atau Kinestetik!
			</p>
		</div>
	</div>

	<!-- Container bawah -->
	<div class="w-full max-w-2xl rounded-t-4xl bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
		<!-- Carousel -->
		<div
			class="relative h-38 w-full overflow-hidden p-4"
			on:touchstart={handleTouchStart}
			on:touchend={handleTouchEnd}
		>
			<h2 class="font-light text-gray-800 text-sm absolute top-2 left-0 right-0">Instruksi Pengerjaan Tes </h2>
			<hr class="mt-4 border-gray-200 w-3/4 mx-auto" />
			{#each guides as guide, i (i)}
				{#if i === current}
					<div
						class="absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center space-y-2 px-2"
						in:fly={{ ...getFly(direction), opacity: 0 }}
						out:fly={{ ...getFly(-direction), opacity: 0 }}
					>
						<h2 class="text-base font-medium text-gray-700">{guide.title}</h2>
						<p class="px-4 text-sm text-gray-600">{guide.text}</p>
					</div>
				{/if}
			{/each}

			<!-- Bullet -->
			<div class="absolute right-0 bottom-1 left-0 flex justify-center space-x-2">
				{#each guides as _, i}
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						class="h-2 w-2 rounded-full transition-all duration-300
						{i === current ? 'scale-150 bg-blue-400' : 'bg-gray-300'}"
						on:click={() => {
							previous = current;
							direction = i > current ? 1 : -1;
							current = i;
						}}
					></button>
				{/each}
			</div>
		</div>

		<!-- Tombol -->
		<div class="px-6 pt-2 pb-6 mt-3 pb-8">
			<button
				on:click={mulaiTes}
				class="w-full text-lg rounded-lg bg-blue-500 px-6 py-4  text-white shadow hover:bg-blue-700"
			>
				Mulai Tes
			</button>
		</div>
	</div>
</main>

<style>
	button {
		touch-action: manipulation;
	}
</style>
