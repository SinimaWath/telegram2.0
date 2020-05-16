<script>
    import { router } from '../../modules/router/store';
    export let name = '';
</script>

{#if name === $router.name }
    <slot></slot>
{/if}
