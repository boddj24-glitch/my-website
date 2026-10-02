export default async function handler(req, res) {
  // আপনার সঠিক raw.githubusercontent.com লিংকটি এখানে দিন
  const targetUrl = "https://raw.githubusercontent.com/boddj24-glitch/my-website/refs/heads/main/smart%20tv";

  try {
    const userAgent = req.headers["user-agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": userAgent,
        "Referer": "https://mycoffeetime.net/"
      },
      redirect: 'follow'
    });

    if (response.status === 403 || response.status === 401) {
      return res.status(401).send("Token Expired. Please update the new token link.");
    }

    // CORS হেডার যুক্ত করা
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const data = await response.text();
    return res.status(response.status).send(data);

  } catch (err) {
    return res.status(500).send("Error fetching stream: " + err.message);
  }
}
