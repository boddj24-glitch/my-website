// ===================================================
// সিক্রেট আইডি
// ===================================================
const EXPIRE_CODE = "48436844"; 

// মূল M3U প্লেলিস্ট URL
const PLAYLIST_URL = 'https://raw.githubusercontent.com/boddj24-glitch/my-website/refs/heads/main/playlist.m3u';
// ===================================================

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const host = url.host;
    const protocol = url.protocol.replace(':', '');
    const requestUrl = request.url;
    const targetUrl = url.searchParams.get("url");

    // ---------------------------------------------------------
    // ১. M3U প্লেলিস্ট রিকোয়েস্ট হ্যান্ডলিং
    // ---------------------------------------------------------
    if (!targetUrl && (requestUrl.includes('.m3u') || requestUrl.includes('playlist-expire'))) {
      if (EXPIRE_CODE && !requestUrl.includes(EXPIRE_CODE)) {
        return new Response(JSON.stringify({ error: 'Access Denied: Invalid or Expired ID' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const response = await fetch(PLAYLIST_URL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          redirect: 'follow'
        });

        if (!response.ok) {
          return new Response(JSON.stringify({ error: 'Failed to fetch playlist' }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const content = await response.text();
        const baseUrl = response.url;

        const lines = content.split('\n');
        const rewrittenLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            try {
              const absUrl = new URL(trimmed, baseUrl).href;
              return `${protocol}://${host}/?url=${encodeURIComponent(absUrl)}`;
            } catch (e) {
              return line;
            }
          }
          return line;
        });

        return new Response(rewrittenLines.join('\n'), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ---------------------------------------------------------
    // ২. নির্দিষ্ট স্ট্রিম বা চ্যানেল ফেচিং
    // ---------------------------------------------------------
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      let reqOrigin = '';
      let reqReferer = '';

      try {
        const parsedTarget = new URL(targetUrl);
        reqOrigin = parsedTarget.origin;
        reqReferer = parsedTarget.origin + '/';
      } catch (e) {}

      // টার্গেট সার্ভারে রিকোয়েস্ট পাঠানো
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
          'Origin': reqOrigin,
          'Referer': reqReferer,
          'Accept': '*/*',
          'Connection': 'keep-alive'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Stream failed with status (${response.status})` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const contentType = response.headers.get('content-type') || '';
      const finalUrl = response.url; 

      const isPlaylist = targetUrl.includes('.m3u') || 
                         contentType.includes('mpegurl') || 
                         contentType.includes('m3u') || 
                         contentType.includes('text/plain');

      if (isPlaylist) {
        const text = await response.text();

        if (text.trim().startsWith('#EXTM3U') || targetUrl.includes('.m3u8')) {
          const lines = text.split('\n');
          const rewrittenLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith('#')) {
              if (trimmed.includes('URI=')) {
                return trimmed.replace(/URI=["']([^"']+)["']/g, (match, uri) => {
                  try {
                    const abs = new URL(uri, finalUrl).href;
                    return `URI="${protocol}://${host}/?url=${encodeURIComponent(abs)}"`;
                  } catch (e) {
                    return match;
                  }
                });
              }
              return line;
            }

            try {
              const abs = new URL(trimmed, finalUrl).href;
              return `${protocol}://${host}/?url=${encodeURIComponent(abs)}`;
            } catch (e) {
              return line;
            }
          });

          return new Response(rewrittenLines.join('\n'), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8'
            }
          });
        }

        return new Response(text, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': contentType || 'text/plain'
          }
        });
      }

      // ভিডিও সেগমেন্ট স্ট্রিম করা
      return new Response(response.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType || 'video/mp2t',
          'Cache-Control': 'public, max-age=3600'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: 'Proxy Fetch Error: ' + error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
