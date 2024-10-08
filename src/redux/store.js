import { configureStore, createStore } from '@reduxjs/toolkit';
import rootReducer from './reducer';

const store = createStore(
    rootReducer,
    process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION__
        ? window.__REDUX_DEVTOOLS_EXTENSION__()
        : undefined
);

export default store;
