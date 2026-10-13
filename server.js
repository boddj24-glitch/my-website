const express = require('express');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const app = express();

// CORS Preflight Request
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(204);
});

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    fetchAndProxy(targetUrl, req, res, 0);
});

function fetchAndProxy(targetUrl, req, res, redirectCount) {
    if (redirectCount > 5) {
        return res.status(500).send('Too many redirects');
    }

    let parsedTarget;
    try {
        parsedTarget = new URL(targetUrl);
    } catch (e) {
        return res.status(400).send('Invalid Target URL');
    }

    const client = parsedTarget.protocol === 'https:' ? https : http;

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': `${parsedTarget.protocol}//${parsedTarget.host}/`,
            'Origin': `${parsedTarget.protocol}//${parsedTarget.host}`,
            'Accept': '*/*'
        }
    };

    client.get(targetUrl, options, (proxyRes) => {
        // Handle Redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
            let newUrl = proxyRes.headers.location;
            if (!newUrl.startsWith('http')) {
                newUrl = new URL(newUrl, targetUrl).href;
            }
            return fetchAndProxy(newUrl, req, res, redirectCount + 1);
        }

        let contentType = proxyRes.headers['content-type'] || '';

        // .m3u8 প্লেলিস্ট রিকনফিগার করা
        if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl')) {
            let data = '';
            proxyRes.on('data', chunk => { data += chunk; });
            proxyRes.on('end', () => {
                const baseUrl = `${parsedTarget.protocol}//${parsedTarget.host}${parsedTarget.pathname.substring(0, parsedTarget.pathname.lastIndexOf('/') + 1)}`;

                const lines = data.split('\n');
                const rewrittenLines = lines.map(line => {
                    let trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        let absoluteUrl;
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                            absoluteUrl = trimmed;
                        } else if (trimmed.startsWith('/')) {
                            absoluteUrl = `${parsedTarget.protocol}//${parsedTarget.host}${trimmed}`;
                        } else {
                            absoluteUrl = `${baseUrl}${trimmed}`;
                        }
                        return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    }
                    return line;
                });

                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                res.send(rewrittenLines.join('\n'));
            });
        } else {
            // .ts সেগমেন্ট ও ভিডিও ফাইল স্ট্রিম করা
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }
    }).on('error', (err) => {
        res.status(500).send('Proxy error: ' + err.message);
    });
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
