<script>
    import Page from '../Page/Page.svelte';
    import { Button } from 'svelma';
    import { router } from '../../modules/router/store';

    function onClick() {
      router.nav('settings');
    }
</script>
<Page title="Welcome">
    <h1>Welcome</h1>
    <div class="ico port"></div>
    <h4 class="help">
        Before start sending file,
        need to tune your COM port
    </h4>

    <Button on:click={onClick} type="is-primary">Go To Settings</Button>
</Page>


<style>
    .ico {
        width: 256px;
        height: 256px;
        margin: auto auto 12px;
    }

    .help {
        margin-bottom: 52px;
    }

</style>
