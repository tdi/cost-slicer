import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const Root = () => {
  return (
    <React.StrictMode>
        <App />
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<Root />);