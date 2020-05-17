<script>
    import { modal, modalResponse } from '../../modules/modal/store';
    import { Notification, Dialog } from 'svelma'

    const types = {
        alert: openAlert,
        success: openSuccess,
        prompt: openPrompt
    };

    $: types[$modal.type] && types[$modal.type]($modal.text);

    function openAlert(text) {
        Notification.create({ message: text, type: 'is-danger', position: 'is-top', duration: 5000 })
    }

    function openSuccess(text) {
        Notification.create({ message: text, type: 'is-success', position: 'is-top', duration: 5000 })
    }

    function openPrompt(text) {
        Dialog.prompt({
            message: text,
        }).then(prompt => modalResponse.set(prompt))
    }
</script>
