const express = require('express');
const http = require('http');
const https = require('https');
const app = express();

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }

    // CORS এবং সিকিউরিটি হেডার এলাউ করা
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const client = targetUrl.startsWith('https') ? https : http;

    client.get(targetUrl, (proxyRes) => {
        // অরিজিনাল স্ট্রিমিং সার্ভারের স্ট্যাটাস এবং হেডারগুলো হুবহু ফরোয়ার্ড করা
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    }).on('error', (err) => {
        res.status(500).send('Proxy error: ' + err.message);
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
