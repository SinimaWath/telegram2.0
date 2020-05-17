<script>
    import Settings from '../Settings/Settings.svelte';
    import ContextProvider from '../ContextProvider/ContextProvider.svelte';
    import Route from '../Route/Route.svelte';
    import Welcome from '../Welcome/Welcome.svelte';
    import Chat from '../Chat/Chat.svelte';

    import {onMount} from 'svelte';
    import {router} from '../../modules/router/store';

    export let context = {};
    export let defaultRoute = 'welcome';

    onMount(() => {
        router.nav(defaultRoute);
    });

    let isHasSettings = false;
</script>

<ContextProvider context={context}>
    <Route name="welcome">
        <Welcome/>
    </Route>
    <Route name="settings">
        <Settings/>
    </Route>
    <Route name="chat">
        <Chat/>
    </Route>
</ContextProvider>
