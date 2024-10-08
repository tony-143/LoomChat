import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppComponent from './App.jsx'
import './index.css'
import store from './redux/store.js'


// Polyfill the 'global' object for the browser
if (typeof global === 'undefined') {
  var global = window;
}


createRoot(document.getElementById('root')).render(

  <StrictMode store={store}>

    <AppComponent />

  </StrictMode>,

)
