const express = require('express');
const http = require('http');
const https = require('https');
const app = express();

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const client = targetUrl.startsWith('https') ? https : http;

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': targetUrl,
            'Accept': '*/*'
        }
    };

    client.get(targetUrl, options, (proxyRes) => {
        // কন্টেন্ট টাইপ ঠিকমতো পাস করা যাতে ভিডিও প্লেয়ার বুঝতে পারে
        if (proxyRes.headers['content-type']) {
            res.setHeader('Content-Type', proxyRes.headers['content-type']);
        }
        res.writeHead(proxyRes.statusCode);
        proxyRes.pipe(res);
    }).on('error', (err) => {
        res.status(500).send('Proxy error: ' + err.message);
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
