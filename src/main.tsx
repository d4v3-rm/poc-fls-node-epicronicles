import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { AppShell } from './components/app/AppShell';
import { store } from './store/gameStore';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AppShell />
    </Provider>
  </StrictMode>,
);
