<script>
	import { goto } from "$app/navigation";

    function goMain() {
        goto('/')
    }
</script>
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-300 to-blue-400 transition-opacity duration-300"
>
	<div class="flex flex-col gap-4">
		<img src="/img/not-found.png" alt="Splash" class="h-[55vw] animate-pulse" />
        <h1 class="text-2xl text-white text-center font-bold drop-shadow-lg">404 Not Found</h1>
        <button on:click={goMain} class="w-full bg-orange-500 text-white px-6 py-2 rounded">
            Kembali ke Main
        </button>
	</div>
</div>
