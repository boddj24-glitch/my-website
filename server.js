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
            'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
            'Accept': '*/*'
        }
    };

    client.get(targetUrl, options, (proxyRes) => {
        let contentType = proxyRes.headers['content-type'] || '';
        
        // যদি ফাইলটি m3u8 বা প্লেলিস্ট হয়, তবে ভেতরের লিংকগুলো রিডাইরেক্ট বা রিরাইট করতে হবে
        if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl')) {
            let data = '';
            proxyRes.on('data', chunk => { data += chunk; });
            proxyRes.on('end', () => {
                const parsedTarget = new URL(targetUrl);
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
            // অন্য ফাইল বা .ts সেগমেন্টগুলোর জন্য নরমাল পাইপ চলবে
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }
    }).on('error', (err) => {
        res.status(500).send('Proxy error: ' + err.message);
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
