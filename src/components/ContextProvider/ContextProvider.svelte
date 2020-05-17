<script>
    import {setContext} from 'svelte';

    export let context = {};

    Object.entries(context).forEach(([key, value]) => {
      setContext(key, value);
    });
</script>

<slot></slot>

