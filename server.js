const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }
    
    // CORS হেডার এলাউ করা
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        router: (req) => targetUrl,
        onProxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
        }
    })(req, res);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
