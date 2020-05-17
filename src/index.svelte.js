import './styles.scss';
import App from './components/App/App.svelte';
import {ContextKeys} from './modules/context';
import {ApiServiceElectron} from './services/api';
const {ipcRenderer} = require('electron');

const api = new ApiServiceElectron(ipcRenderer);

const app = new App({
  target: document.body,
  props: {
    context: {
      [ContextKeys.API]: api
    },
    defaultRoute: 'welcome'
  }
});


export default app;
