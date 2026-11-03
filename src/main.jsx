import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import { AppProvider }   from './context/AppContext';
import App               from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </ToastProvider>
);
