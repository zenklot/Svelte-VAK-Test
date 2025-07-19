<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import questions from '$lib/questions.json';
	import kelasList from '$lib/kelas.json';
	import gugusList from '$lib/gugus.json';
	import Modal from '$lib/components/Modal.svelte';
	import Loading from '$lib/components/Loading.svelte';

	let biodata = {
		nama: '',
		kelas: '',
		gugus: ''
	};
	let showIntro = true;

	let showResetModal = false;
	let answers: Record<string, number> = {};
	let current = 0;
	let total = questions.length;
	let selected: number | null = null;
	let isRedirecting = false;
	let isLoading = false;

	onMount(() => {
		const savedBio = localStorage.getItem('vak-biodata');
		showIntro = !savedBio;

		if (savedBio) {
			biodata = JSON.parse(savedBio);
		}

		const saved = localStorage.getItem('vak-answers');
		if (saved) {
			answers = JSON.parse(saved);
			// 🔁 Redirect jika semua soal sudah dijawab
			if (Object.keys(answers).length === questions.length) {
				goto('/result');
				return;
			}
		}

		const qIndex = parseInt($page.url.searchParams.get('q') || '1', 10) - 1;
		current = Math.max(0, Math.min(qIndex, total - 1));
		selected = answers[questions[current].id] ?? null;
	});

	function startTest() {
		if (!biodata.nama || !biodata.kelas || !biodata.gugus) return;
		localStorage.setItem('vak-biodata', JSON.stringify(biodata));
		showIntro = false;
		goto('/test?q=1', { replaceState: true });
	}

	function goTo(index: number) {
		current = index;
		selected = answers[questions[index].id] ?? null;
		goto(`/test?q=${index + 1}`, { replaceState: true });
	}

	function goMain() {
		localStorage.removeItem('vak-answers');
		localStorage.removeItem('vak-biodata');
		localStorage.removeItem('vak-result');
		goto('/');
	}

	function jawab(score: number) {
		selected = score;
	}

	function next() {
		if (selected == null) return;

		answers[questions[current].id] = selected;
		localStorage.setItem('vak-answers', JSON.stringify(answers));

		if (Object.keys(answers).length === total) return;

		if (current === total - 1) {
			const nextUnanswered = questions.findIndex((q) => answers[q.id] == null);
			if (nextUnanswered !== -1) {
				goTo(nextUnanswered);
			}
		} else {
			goTo(current + 1);
		}
	}

	function back() {
		if (current > 0) goTo(current - 1);
	}

	function showModalClose() {
		showResetModal = true;
	}

	import { saveResultToFirebase } from '$lib/firebaseSave'; // pastikan ini sesuai path kamu

	async function lihatHasil() {
		isLoading = true;

		const answerCounts = {
			Visual: 0,
			Auditory: 0,
			Kinestetik: 0
		};

		const totalPerType = {
			Visual: questions.filter((q) => q.type === 'Visual').length,
			Auditory: questions.filter((q) => q.type === 'Auditory').length,
			Kinestetik: questions.filter((q) => q.type === 'Kinestetik').length
		};

		const combinedAnswers = questions.map((q) => {
			const score = answers[q.id] ?? 0;
			answerCounts[q.type] += score;

			let label = '';
			if (score === 2) label = 'Sering';
			else if (score === 1) label = 'Kadang-kadang';
			else label = 'Jarang';

			return {
				id: q.id,
				type: q.type,
				question: q.question,
				answer: label
			};
		});

		const totalScore = answerCounts.Visual + answerCounts.Auditory + answerCounts.Kinestetik;

		const visualPercentage = Math.round((answerCounts.Visual / totalScore) * 100);
		const auditoryPercentage = Math.round((answerCounts.Auditory / totalScore) * 100);
		const kinestheticPercentage = 100 - visualPercentage - auditoryPercentage;

		const allPercentages = [
			{ type: 'Visual', value: visualPercentage },
			{ type: 'Auditori', value: auditoryPercentage },
			{ type: 'Kinestetik', value: kinestheticPercentage }
		];
		const maxVal = Math.max(...allPercentages.map((p) => p.value));
		const dominantTypes = allPercentages.filter((p) => p.value === maxVal).map((p) => p.type);
		const dominant = dominantTypes.join(', ');

		const payload = {
			name: biodata.nama,
			kelas: biodata.kelas,
			gugus: biodata.gugus,
			answers: combinedAnswers,
			result: {
				visual: answerCounts.Visual,
				auditory: answerCounts.Auditory,
				kinesthetic: answerCounts.Kinestetik,
				'visual-percentage': visualPercentage,
				'auditory-percentage': auditoryPercentage,
				'kinesthetic-percentage': kinestheticPercentage,
				dominant
			}
		};

		// Simpan ke localStorage
		localStorage.setItem('vak-result', JSON.stringify(payload));

		try {
			const res = await fetch('https://mock.supriatna.my.id/v5/api/answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				console.log('✅ Data berhasil dikirim ke API utama');
			} else {
				console.warn('⚠️ Gagal dari API utama, simpan ke Firebase sebagai fallback');
				await saveResultToFirebase(payload);
			}
		} catch (err) {
			console.error('❌ Error saat mengirim ke API utama:', err);
			console.log('📥 Menyimpan ke Firebase sebagai cadangan...');
			await saveResultToFirebase(payload);
		} finally {
			isLoading = false;
			goto('/result'); // Tetap redirect
		}
	}

	$: progress = Math.floor((Object.keys(answers).length / total) * 100);
	$: isAnswered = selected != null;
	$: isAllAnswered = Object.keys(answers).length === total;
</script>

{#if showIntro}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-300 to-blue-400 px-6"
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
		<style>
			@media (min-width: 768px) {
				div[style*='/img/pattern.svg'] {
					background-size: 15% !important;
				}
			}
		</style>

		<div
			class="fixed top-0 right-0 left-0 flex items-center justify-between bg-white p-3 shadow-2xl"
		>
			<h1 class="text-md font-bold text-blue-500 drop-shadow-2xl md:text-2xl">Tes Gaya Belajar</h1>
			<button
				class="flex h-8 w-8 cursor-pointer flex-col justify-center rounded-full border border-solid p-2 text-center leading-0 hover:bg-red-200 active:bg-red-400"
				onclick={showModalClose}>❌</button
			>
		</div>
		<div class="relative w-full max-w-md">
			<img
				src="/img/hai.png"
				alt="Hai"
				class="animate-naik-turun absolute top-[-60px] right-0 z-[0] h-[80px] w-[80px]"
			/>
			<style>
				@keyframes naikTurun {
					0% {
						transform: translateY(0);
					}
					20% {
						transform: translateY(60px);
					}
					40% {
						transform: translateY(60px); /* diam di atas */
					}
					60% {
						transform: translateY(0);
					}
					80% {
						transform: translateY(0); /* diam di bawah */
					}
					100% {
						transform: translateY(0);
					}
				}

				@layer utilities {
					.animate-naik-turun {
						animation: naikTurun 4s ease-in-out infinite;
					}
				}
			</style>
			<div class="relative z-[1] space-y-4 rounded-3xl bg-white p-4 shadow-2xl">
				<h1 class="text-center text-2xl font-semibold tracking-wide text-blue-950">Data Diri</h1>
				<input
					placeholder="Nama Lengkap"
					bind:value={biodata.nama}
					class="mb-4 w-full rounded border px-4 py-2 text-center text-base"
				/>

				<select
					bind:value={biodata.kelas}
					class="mb-4 w-full rounded border bg-white px-4 py-2 text-center text-base"
				>
					<option disabled value="">Pilih Kelas</option>
					{#each kelasList as k}
						<option value={k.kelas}>{k.kelas}</option>
					{/each}
				</select>

				<select
					bind:value={biodata.gugus}
					class="mb-6 w-full rounded border bg-white px-4 py-2 text-center text-base"
				>
					<option disabled value="">Pilih Gugus</option>
					{#each gugusList as g}
						<option value={g.gugus}>{g.gugus}</option>
					{/each}
				</select>

				<button
					class="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
					onclick={startTest}
					disabled={!biodata.nama || !biodata.kelas || !biodata.gugus}
				>
					Mulai Tes
				</button>
			</div>
		</div>
	</div>
{:else}
	<main
		class="flex h-screen flex-col items-center justify-between bg-gradient-to-b from-blue-300 to-blue-400"
	>
		<div class="z-10 flex w-full flex-col bg-white">
			<!-- Progress Bar -->
			<div
				class="relative h-2 w-full overflow-hidden border border-solid border-blue-500 bg-transparent"
			>
				<div
					class="absolute top-0 left-0 h-full bg-blue-500 transition-all"
					style="width: {progress}%"
				></div>
			</div>
			<div class="flex items-center justify-between px-3 py-2 shadow-2xl">
				<h1 class="text-md font-bold text-blue-500 drop-shadow-2xl md:text-2xl">
					Tes Gaya Belajar
				</h1>
				<button
					class="flex h-8 w-8 cursor-pointer flex-col justify-center rounded-full border border-solid p-2 text-center leading-0 hover:bg-red-200 active:bg-red-400"
					onclick={showModalClose}>❌</button
				>
			</div>
		</div>
		<div class="relative z-10 w-full p-3">
			<div
				class="mx-auto w-full max-w-2xl rounded-xl bg-white px-4 pt-2 pb-8 shadow-2xl drop-shadow-2xl"
			>
				<!-- Pertanyaan -->
				<p class="text-xs text-gray-500">Pertanyaan {current + 1} dari {total}</p>
				<h2 class="my-5 text-lg leading-normal font-semibold tracking-wide text-gray-700">
					{questions[current].question}
				</h2>

				<!-- Pilihan Jawaban -->
				<div class="space-y-2">
					<button
						class="w-full rounded border px-4 py-2 text-left
						{selected === 2 ? 'border border-green-400 bg-green-200' : 'bg-white'}"
						onclick={() => jawab(2)}
					>
						Sering
					</button>
					<button
						class="w-full rounded border px-4 py-2 text-left
						{selected === 1 ? 'border border-green-400 bg-green-200' : 'bg-white'}"
						onclick={() => jawab(1)}
					>
						Kadang-kadang
					</button>
					<button
						class="w-full rounded border px-4 py-2 text-left
						{selected === 0 ? 'border border-green-400 bg-green-200' : 'bg-white'}"
						onclick={() => jawab(0)}
					>
						Jarang
					</button>
				</div>
				<div class="flex w-full max-w-2xl items-center justify-between pt-16">
					{#if current > 0}
						<button onclick={back} class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
							⬅️ Kembali
						</button>
					{/if}

					<div class="flex-1 text-right">
						{#if isAllAnswered}
							<button
								class="ml-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
								disabled={isLoading}
								onclick={lihatHasil}
							>
								{isLoading ? 'Menyimpan...' : 'Simpan & Lihat Hasil'}
							</button>
						{:else}
							<button
								class="ml-2 rounded px-4 py-2 text-white
							{isAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-300'}"
								onclick={next}
								disabled={!isAnswered}
							>
								Berikutnya ➡️
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div>&nbsp;</div>
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
	</main>
{/if}

{#if isLoading}
	<Loading />
{/if}

<Modal bind:showModal={showResetModal} closable={true}>
	{#snippet header()}
		<h2 class="font-bold text-red-600">Konfirmasi Keluar Tes</h2>
	{/snippet}
	<div class="py-4">Apakah Anda yakin ingin keluar dari tes ?</div>
	{#snippet footer()}
		<div class="mt-4 flex justify-end gap-2">
			<!-- svelte-ignore a11y_autofocus -->
			<button
				autofocus
				class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
				onclick={() => (showResetModal = false)}>Batal</button
			>
			<button class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600" onclick={goMain}
				>Ya, Keluar</button
			>
		</div>
	{/snippet}
</Modal>
