export default async function handler(req, res) {
  // এখানে আপনার M3U বা প্লেলিস্ট ফাইলের সঠিক GitHub Raw Link বসাবেন
  const targetUrl = 'https://raw.githubusercontent.com/boddj24-glitch/my-website/refs/heads/main/smart%2020tv';

  try {
    const response = await fetch(targetUrl);
    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
}
