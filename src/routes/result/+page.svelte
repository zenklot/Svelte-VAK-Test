<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import questions from '$lib/questions.json';
	import Modal from '$lib/components/Modal.svelte';

	let result = $state(null);
	let showResetModal = $state(false);

	const openConfirmReset = () => {
		showResetModal = true;
	};

	onMount(() => {
		const raw = localStorage.getItem('vak-answers');
		if (!raw) return;

		const answers = JSON.parse(raw);

		if (!answers || Object.keys(answers).length < questions.length) {
			goto('/test?q=1');
		}

		const raw2 = localStorage.getItem('vak-result');
		if (!raw2) {
			goto('/test?q=1');
			return;
		}

		const data = JSON.parse(raw2);

		if (!data || !data.result) {
			goto('/test?q=1');
			return;
		}

		result = {
			biodata: {
				name: data.name,
				kelas: data.kelas,
				gugus: data.gugus,
			},
			scores: {
				visual: data.result['visual-percentage'],
				auditory: data.result['auditory-percentage'],
				kinesthetic: data.result['kinesthetic-percentage']
			},
			dominant: data.result.dominant
		};
	});

	function resetTes() {
		localStorage.removeItem('vak-answers');
		localStorage.removeItem('vak-biodata');
		localStorage.removeItem('vak-result');
		goto('/test');
	}

	function goMain() {
		goto('/');
	}
</script>

{#if result}
	<main
		class="flex h-screen flex-col items-center justify-between bg-gradient-to-b from-blue-300 to-blue-400 text-center"
	>
		<div
			class="fixed z-[0] h-screen w-screen opacity-35"
			style="background-image: url('/img/pattern.svg'); background-repeat: repeat; background-size: 50%;"
		></div>
		<style>
			@media (min-width: 768px) {
				div[style*='/img/pattern.svg'] {
					background-size: 15% !important;
				}
			}
		</style>
		<div>&nbsp;</div>
		<div class="mx-auto flex w-full flex-col items-center justify-center gap-10 px-4">
			<h1 class="mb-4 max-w-2xl text-2xl font-bold text-white drop-shadow-md">
				Hasil Tes Gaya Belajar {result?.biodata?.name}, Kelas {result?.biodata?.kelas}, {result?.biodata?.gugus}
			</h1>
			<div class="relative w-full max-w-2xl rounded-xl bg-white p-2 shadow-xl">
				<img
					src={`/img/${result.dominant?.toLowerCase()}.png`}
					alt="result"
					class="absolute top-0 left-1/2 h-24 w-24 -translate-1/2 transform rounded-full border-2 border-blue-500 bg-white drop-shadow-xl"
				/>
				<h2 class="mt-16 mb-6 text-4xl font-extrabold text-blue-600 drop-shadow-2xl">
					{result.dominant}
				</h2>
				<hr />
				<h2 class="pt-4 pb-1 tracking-wider">Rincian hasil :</h2>
				<div class="flex items-center justify-around gap-2 py-6">
					<div
						class="flex flex-col items-center justify-center"
						class:opacity-100={result.dominant?.toLowerCase().includes('visual')}
						class:opacity-50={!result.dominant?.toLowerCase().includes('visual')}
					>
						<img
							src="/img/visual.png"
							alt="result"
							class="h-12 w-12 rounded-full border-2 border-blue-200 bg-white p-1 drop-shadow-xl"
						/>
						<h2 class="font-light">Visual</h2>
						<h3 class="text-xl font-bold tracking-wide">{result.scores.visual}%</h3>
					</div>
					<div
						class="flex flex-col items-center justify-center"
						class:opacity-100={result.dominant?.toLowerCase().includes('auditori')}
						class:opacity-50={!result.dominant?.toLowerCase().includes('auditori')}
					>
						<img
							src="/img/auditori.png"
							alt="result"
							class="h-12 w-12 rounded-full border-2 border-blue-200 bg-white p-1 drop-shadow-xl"
						/>
						<h2 class="font-light">Auditori</h2>
						<h3 class="text-xl font-bold tracking-wide">{result.scores.auditory}%</h3>
					</div>
					<div
						class="flex flex-col items-center justify-center"
						class:opacity-100={result.dominant?.toLowerCase().includes('kinestetik')}
						class:opacity-50={!result.dominant?.toLowerCase().includes('kinestetik')}
					>
						<img
							src="/img/kinestetik.png"
							alt="result"
							class="h-12 w-12 rounded-full border-2 border-blue-200 bg-white p-1 drop-shadow-xl"
						/>
						<h2 class="font-light">Kinestetik</h2>
						<h3 class="text-xl font-bold tracking-wide">{result.scores.kinesthetic}%</h3>
					</div>
				</div>
			</div>
		</div>

		<div class="z-10 w-full max-w-2xl rounded-t-4xl bg-white px-3 py-6">
			<div class="flex justify-between gap-2">
				<button
					class="w-full rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
					onclick={goMain}
				>
					Main
				</button>
				<button
					class="w-full rounded px-6 py-2 text-blue-500 ring-1 ring-blue-500 hover:bg-blue-400"
					onclick={openConfirmReset}
				>
					Ulangi Tes
				</button>
			</div>
		</div>
	</main>
{:else}
	<div
		class="mx-auto flex h-screen w-full flex-col items-center justify-between bg-gradient-to-b from-blue-300 to-blue-400 text-gray-500"
	>
		<div class="flex basis-full flex-col items-center justify-center gap-3">
			<img src="/img/no-test.png" alt="not-test" />
			<p class="text-xl font-semibold text-white">Belum ada data tes ditemukan.</p>
		</div>
		<div class="w-full max-w-xl rounded-t-4xl bg-white p-4">
			<button
				class="w-full rounded-lg bg-blue-500 px-6 py-4 text-lg text-white shadow hover:bg-blue-700"
				onclick={resetTes}
			>
				Mulai Tes
			</button>
		</div>
	</div>
{/if}

<Modal bind:showModal={showResetModal} closable={true}>
	{#snippet header()}
		<h2 class="font-bold text-blue-600">Konfirmasi Ulangi Tes</h2>
	{/snippet}
	<div class="py-4">Apakah Anda yakin ingin mengulangi tes ?</div>
	{#snippet footer()}
		<div class="mt-4 flex justify-end gap-2">
			<!-- svelte-ignore a11y_autofocus -->
			<button
				autofocus
				class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
				onclick={() => (showResetModal = false)}>Batal</button
			>
			<button class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" onclick={resetTes}
				>Ya, Ulangi</button
			>
		</div>
	{/snippet}
</Modal>
