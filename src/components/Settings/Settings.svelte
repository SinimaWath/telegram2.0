<script>
    import {Input, Field, Button} from 'svelma'
    import {settings, apiError, error} from '../../modules/settings/store';
    import {text, type} from './Settings.helpers';
    import {getContext} from 'svelte';
    import {ContextKeys} from '../../modules/context';
    import {router} from '../../modules/router/store';
    import Page from '../Page/Page.svelte';

    const api = getContext(ContextKeys.API);

    async function onSubmit(e) {
        e.preventDefault();

        const {error} = await api.connect($settings);

        if (error) {
            apiError.set(error);
            return;
        }

        router.nav('chat');
    }

    $: speedText = text('speed')($error);
    $: speedType = type('speed')($error);
    $: comportType = type('comport')($error);
    $: comportText = text('comport')($error);
    $: apiErrorText = text('none')($error);

</script>


<Page title="Settings">
    <h1>Settings</h1>
    {#if apiErrorText }
        <p class="help is-danger">{apiErrorText}</p>
    {/if}
    <form action="#" on:submit={onSubmit} class="form">
        <Field label="COM-port" type={comportType} message={comportText}>
            <Input
                    type="text"
                    bind:value={$settings.comport}
                    placeholder="COM1, COM2 and etc"
                    class={comportType}
            />
        </Field>

        <Field label="Speed" type={speedType} message={speedText}>
            <Input
                    type="text"
                    bind:value={$settings.speed}
                    placeholder="1-2000"
                    class={speedType}
            />
        </Field>

        <Button type="is-primary" nativeType="submit" disabled={!!$error && !apiErrorText}>Submit</Button>
    </form>
</Page>

<style>
    .form {
        max-width: 240px;
        margin: auto;
    }
</style>
