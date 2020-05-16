import './styles.scss';
import App from './components/App/App.svelte';
import {ContextKeys} from './modules/context';
import {ApiServiceDummy} from './services/api';

const api = new ApiServiceDummy();

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
