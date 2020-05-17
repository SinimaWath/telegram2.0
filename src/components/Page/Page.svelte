<script>
    export let title = 'Telegram 2.0';
</script>
<svelte:head>
    <title>{title}</title>
</svelte:head>

<main class="content">
    <slot></slot>
</main>


<style>
    main {
        text-align: center;
        padding: 24px;
        margin: 0 auto;
        height: 100%;
    }
</style>
