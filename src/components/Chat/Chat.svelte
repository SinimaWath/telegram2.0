<script>
    import Page from '../Page/Page.svelte';
    import { Button } from 'svelma';

    import { router } from '../../modules/router/store';

    function onClick() {
        router.nav('settings');
    }

</script>

<Page title="chat">
    <h1>Send file</h1>
    <div class="main">
        <div class="file is-boxed">
            <label class="file-label">
                <input class="file-input" type="file" name="resume">
                <span class="file-cta">
          <span class="file-icon">
            <i class="ico upload"></i>
          </span>
          <span class="file-label">
            Choose a file to upload…
          </span>
        </span>
            </label>
        </div>

        <Button on:click={onClick} type="is-primary">Go To Settings</Button>
    </div>
</Page>


<style>
    .ico.upload {
        width: 24px;
        height: 24px;
        background-repeat: no-repeat;
    }

    .file.is-boxed {
        margin: auto;
    }

    .main {
        height: 80%;
        display: flex;
        flex-direction: column;
    }
</style>
