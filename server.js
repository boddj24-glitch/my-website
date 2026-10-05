const express = require('express');
const http = require('http');
const https = require('https');
const app = express();

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is missing');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    const client = targetUrl.startsWith('https') ? https : http;

    client.get(targetUrl, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    }).on('error', (err) => {
        res.status(500).send('Proxy error: ' + err.message);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
