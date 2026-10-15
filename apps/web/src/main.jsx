import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { installImageFallback } from '@/lib/imageUtils';

installImageFallback();

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);