import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'antd/dist/reset.css'
import { ConfigProvider, theme } from 'antd';

ReactDOM.createRoot(document.getElementById('root')).render(
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ConfigProvider>
)
