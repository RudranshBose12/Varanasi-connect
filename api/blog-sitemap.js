const SUPABASE_URL = 'https://dtckvnyuwysulevilfse.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LiuULCT4WLxAdL3qq3zuZg_KNgfrnCa';
const SITE = 'https://www.varanasiconnect.in';

module.exports = async function handler(_req, res) {
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` };
  try {
    const [settingResponse, postsResponse] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/vc_blog_settings?select=blogs_enabled&id=eq.1`, { headers, cache: 'no-store' }),
      fetch(`${SUPABASE_URL}/rest/v1/vc_blog_posts?select=slug,updated_at,status&status=eq.published&order=updated_at.desc`, { headers, cache: 'no-store' })
    ]);
    if (!settingResponse.ok || !postsResponse.ok) throw new Error('Blog sitemap data is not ready.');
    const settings = await settingResponse.json();
    const posts = settings[0] && settings[0].blogs_enabled ? await postsResponse.json() : [];
    const urls = posts.map((post) => `<url><loc>${SITE}/blog/${encodeURIComponent(post.slug)}</loc>${post.updated_at ? `<lastmod>${new Date(post.updated_at).toISOString()}</lastmod>` : ''}</url>`).join('');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (_) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};
