<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, getDocs } from 'firebase/firestore';

	async function downloadFirestoreData() {
		try {
			const snapshot = await getDocs(collection(db, 'results')); // ganti dengan nama koleksi kamu
			const data = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));

			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'firestore-data.json';
			a.click();

			URL.revokeObjectURL(url);
		} catch (e) {
			console.error('Gagal mengambil data dari Firestore:', e);
		}
	}

	let loggedIn = false;
	let email = '';
	let password = '';
	let errors: Record<string, string[]> = {};
	let data = [];

	onMount(async () => {
		const token = localStorage.getItem('admin-token');
		loggedIn = token !== null;
		if (loggedIn) await loadData();
	});

	async function login() {
		errors = {};
		try {
			const res = await fetch('https://mock.supriatna.my.id/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const result = await res.json();

			if (!res.ok) {
				if (res.status === 422) {
					for (const err of result.message) {
						if (!errors[err.path]) errors[err.path] = [];
						errors[err.path].push(err.msg);
					}
				} else if (res.status === 401) {
					localStorage.removeItem('admin-token');
					alert(result.message || 'Login gagal');
				} else {
					alert(result.message || 'Login gagal');
				}
				return;
			}

			localStorage.setItem('admin-token', result['access_token']);
			loggedIn = true;
			await loadData();
		} catch (e) {
			alert('Gagal terhubung ke server');
			console.error(e);
		}
	}

	function logout() {
		localStorage.removeItem('admin-token');
		loggedIn = false;
		data = [];
	}

	async function loadData() {
		const token = localStorage.getItem('admin-token');
		if (!token) return;

		try {
			const res = await fetch('https://mock.supriatna.my.id/v5/api/answer?perPage=3000', {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) {
				alert('Gagal mengambil data');
				return;
			}

			const result = await res.json();
			data = result.resource || [];
			ekstrakPertanyaanUnik();
			await tick();

			const table = document.getElementById('myTable');
			if (table) {
				const $ = globalThis.$;
				if ($.fn.dataTable.isDataTable(table)) {
					$(table).DataTable().clear().destroy(); // 💥 destroy dulu
				}
				// if ($ && !$.fn.dataTable.isDataTable(table)) {
				// $(table).DataTable({
				// 	dom: 'Bfrtip',
				// 	buttons: ['excel'],
				// 	responsive: true
				// });
				setTimeout(() => {
					$(table).DataTable({
						scrollX: true,
						dom: 'Bfrtip',
						buttons: ['excel'],
						responsive: true
					});
				}, 0);
				// }
			}
		} catch (err) {
			console.error(err);
			alert('Error saat mengambil data');
		}
	}

	function formatTanggal(tanggalIso: string): string {
		const date = new Date(tanggalIso);
		return (
			new Intl.DateTimeFormat('id-ID', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Jakarta',
				hour12: false
			})
				.format(date)
				.replace('.', ':') + ' WIB'
		);
	}

	let pertanyaanUnik: string[] = [];

	function mapJawaban(answers: any[]): Record<string, string> {
		const m: Record<string, string> = {};
		for (const a of answers) {
			const key = `[${a.type?.toUpperCase()}] ${a.question}`;
			m[key] = a.answer || '-';
		}
		return m;
	}

	function ekstrakPertanyaanUnik() {
		const set = new Set<string>();
		for (const d of data) {
			for (const a of d.answers) {
				const key = `[${a.type?.toUpperCase()}] ${a.question}`;
				set.add(key);
			}
		}
		pertanyaanUnik = Array.from(set).sort(); // 🔥 urutkan supaya semua row konsisten
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css" />
	<link
		rel="stylesheet"
		href="https://cdn.datatables.net/buttons/2.4.1/css/buttons.dataTables.min.css"
	/>
	<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
	<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
	<script src="https://cdn.datatables.net/buttons/2.4.1/js/dataTables.buttons.min.js"></script>
	<script src="https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
</svelte:head>

{#if !loggedIn}
	<!-- Login -->
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4"
	>
		<div class="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-md">
			<h1 class="text-center text-xl font-bold">Login Admin</h1>
			<div>
				<input
					type="email"
					bind:value={email}
					placeholder="Email"
					class="w-full rounded border p-2"
				/>
				{#if errors.email}<p class="mt-1 text-sm text-red-500">{errors.email.join(', ')}</p>{/if}
			</div>
			<div>
				<input
					type="password"
					bind:value={password}
					placeholder="Password"
					class="w-full rounded border p-2"
				/>
				{#if errors.password}
					<p class="mt-1 text-sm text-red-500">{errors.password.join(', ')}</p>
				{/if}
			</div>
			<button on:click={login} class="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700">
				Masuk
			</button>
		</div>
	</div>
{:else}
	<!-- Admin Panel -->
	<div class="min-h-screen bg-gray-100 p-4">
		<div class="mb-4 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Admin Panel</h1>
			<!-- <button
				on:click={downloadFirestoreData}
				class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
			>
				Download JSON dari Firestore
			</button> -->
			<button on:click={logout} class="text-sm text-red-600 underline">Logout</button>
		</div>

		<div class="overflow-x-auto">
			<table id="myTable" class="display nowrap w-full">
				<thead>
					<tr>
						<th>Tanggal</th>
						<th>Nama</th>
						<th>Kelas</th>
						<!-- <th>Gugus</th> -->
						<th>Visual %</th>
						<th>Auditory %</th>
						<th>Kinesthetic %</th>
						<th>Dominan</th>
						<!-- <th>Jawaban</th> -->
						{#each pertanyaanUnik as q}
							<th>{q}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data as d}
						<tr>
							<td>{formatTanggal(d.created_at)}</td>
							<td>{d.name.toUpperCase()}</td>
							<td>{d.kelas}</td>
							<!-- <td>{d.gugus}</td> -->
							<td>{d.result['visual-percentage']}%</td>
							<td>{d.result['auditory-percentage']}%</td>
							<td>{d.result['kinesthetic-percentage']}%</td>
							<td class="font-bold">{d.result.dominant}</td>
							<!-- <td>
								<div class="max-h-[80px] space-y-1 overflow-y-auto pr-1 text-xs">
									{#each d.answers as a}
										<div>
											<span class="font-medium">{a.question}</span> — <em>{a.answer}</em>
											<span class="ml-2 text-gray-500">[{a.type}]</span>
										</div>
									{/each}
								</div>
								
							</td> -->
							{#each pertanyaanUnik as q}
								<td>{mapJawaban(d.answers)[q] || '-'}</td>
							{/each}
							<!-- {#each pertanyaanUnik as q}
								<td>
									{#if mapJawaban(d.answers)[q]}
										{mapJawaban(d.answers)[q]}
									{:else}
										-
									{/if}
								</td>
							{/each} -->
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
