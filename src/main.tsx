import React from 'react'
import ReactDOM from 'react-dom/client'
import './components/index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.tsx'
import { Provider } from 'react-redux';
import { store } from './store';
import {registerSW} from "virtual:pwa-register";


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  registerSW()
}