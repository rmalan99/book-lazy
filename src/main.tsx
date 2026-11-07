import React from 'react'; import {createRoot} from 'react-dom/client'; import {registerSW} from 'virtual:pwa-register'; import './styles.css'; import {Router} from './app/router';
registerSW({immediate:true}); createRoot(document.getElementById('root')!).render(<React.StrictMode><Router/></React.StrictMode>);
