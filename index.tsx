import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Initializing BubbleLift App...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  const errorMsg = "Could not find root element to mount to";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app mounted successfully.");
} catch (error) {
  console.error("Critical error during app mount:", error);
}