<script>
    import Page from '../Page/Page.svelte';
    import {Button} from 'svelma';
    import {router} from '../../modules/router/store';
    import {modal, modalResponse} from '../../modules/modal/store';
    import {getContext, onMount} from 'svelte';
    import {ContextKeys} from '../../modules/context';
    import {waitForNotNull} from '../../helpers/store';

    const api = getContext(ContextKeys.API);

    function onClick() {
        router.nav('settings');
    }

    onMount(() =>
        api.listen('file-get', async ({name}) => {
            modal.prompt(`Someone send you file ${name}. Write path where to save it`);

            const value = await waitForNotNull(modalResponse);

            const {error} = await api.save({path: value});

            if (error) {
              modal.alert(`Error while save file ${error}`);
              return;
            }

            modal.success('File was saved to ' + value);
        })
    );

    async function onChange(e) {
        if (!e || !e.target || !e.target.files || !e.target.files[0]) {
            modal.alert('Error while read file');
            return;
        }

        const {error} = await api.send({file: e.target.files[0]});

        if (error) {
            modal.alert(`Error while load file ${error}`);
            return;
        }

        modal.success('File was sent');
    }

</script>

<Page title="chat">
    <h1>Send file</h1>
    <div class="main">
        <div class="file is-boxed">
            <label class="file-label">
                <input class="file-input" type="file" name="resume" on:change={onChange}>
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
