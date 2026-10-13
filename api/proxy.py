export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response('URL parameter is missing', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    try {
      // পাইথন কোডের মতোই রিকোয়েস্ট পাঠানো
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        redirect: 'follow'
      });

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType
        }
      });

    } catch (e) {
      return new Response(`Proxy Error: ${e.message}`, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }
};
