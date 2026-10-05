const express = require('express');
const request = require('request');
const app = express();

app.get('/proxy', (f, res) => {
    const targetUrl = f.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL parameter is missing');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.pipe(request(targetUrl)).pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
