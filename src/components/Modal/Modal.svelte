<script>
    import { modal, modalResponse } from '../../modules/modal/store';
    import { Notification, Dialog } from 'svelma'

    $: {
        console.log($modal);
        if ($modal.type === 'alert') {
            openAlert($modal.text)
        }

        if ($modal.type === 'success') {
            openSuccess($modal.text)
        }

        if ($modal.type === 'prompt') {
            openPrompt($modal.text)
        }
    }

    function openAlert(text) {
        Notification.create({ message: text, type: 'is-danger', position: 'is-top', duration: 5000 })
    }

    function openSuccess(text) {
        Notification.create({ message: text, type: 'is-success', position: 'is-top', duration: 5000 })
    }

    function openPrompt(text) {
        Dialog.prompt({
            message: text,
        }).then(prompt => {
          // console.log()
          modalResponse.set(prompt)
        })
    }
</script>
