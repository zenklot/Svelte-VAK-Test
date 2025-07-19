<script>
    let {
        showModal = $bindable(),
        header,
        children,
        closable = true,
        footer = undefined,
    } = $props();

    let dialog = $state(); // HTMLDialogElement

 $effect(() => {
        if (showModal && dialog) dialog.showModal();
        if (!showModal && dialog && dialog.open) dialog.close();
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
    bind:this={dialog}
    onclose={() => (showModal = false)}
    onclick={(e) => {
        if (closable && e.target === dialog) dialog.close();
    }}
>
    <div>
        {@render header?.()}
        {@render children?.()}
        {#if footer}
            {@render footer?.()}
        {/if}
    </div>
</dialog>

<style>
    dialog {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: fixed;
        border-radius: 0.2em;
        border: none;
        padding: 0;
        width: 80%;
        max-width: 600px;
    }
    dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
    }
    dialog > div {
        padding: 1em;
    }
    dialog[open] {
        animation: zoom 0.5s ease-in-out;
    }
    @keyframes zoom {
        from {
            scale: 0;
        }
        to {
            scale: 1;
        }
    }
    dialog[open]::backdrop {
        animation: fade 0.3s ease-out;
    }
    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
</style>
