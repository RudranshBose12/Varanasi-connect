const SUPABASE_URL = 'https://dtckvnyuwysulevilfse.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LiuULCT4WLxAdL3qq3zuZg_KNgfrnCa';
const SITE = 'https://www.varanasiconnect.in';

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function safeUrl(value) {
  const raw = String(value || '');
  return /^https?:\/\//i.test(raw) || /^\/(?!\/)/.test(raw) ? raw : '';
}
function reply(res, status, title, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)} — Varanasi Connect</title><link rel="stylesheet" href="/assets/blog-pages.css?v=2"></head><body class="blog-site"><main class="blog-article-main"><p>${esc(message)}</p><a href="/blogs">Back to all stories</a></main></body></html>`);
}

module.exports = async function handler(req, res) {
  const slug = String(req.query.slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return reply(res, 404, 'Story not found', 'That story could not be found.');
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` };
  try {
    const [settingResponse, postResponse] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/vc_blog_settings?select=blogs_enabled&id=eq.1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/vc_blog_posts?select=*&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`, { headers })
    ]);
    if (!settingResponse.ok || !postResponse.ok) return reply(res, 503, 'Stories temporarily unavailable', 'The blog is being prepared. Please check back soon.');
    const settings = await settingResponse.json();
    if (!settings.length || settings[0].blogs_enabled === false) return reply(res, 404, 'Blog unavailable', 'The blog is currently turned off.');
    const posts = await postResponse.json();
    const post = posts[0];
    if (!post) return reply(res, 404, 'Story not found', 'That story could not be found.');

    const title = post.seo_title || post.title;
    const description = post.meta_description || post.excerpt;
    const canonical = `${SITE}/blog/${encodeURIComponent(post.slug)}`;
    const image = safeUrl(post.cover_image_url);
    const published = post.published_at || post.created_at;
    const paragraphs = String(post.body || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).map((part) => `<p>${esc(part).replace(/\n/g, '<br>')}</p>`).join('');
    const sources = Array.isArray(post.source_links) ? post.source_links : [];
    const sourceHtml = sources.length ? `<section class="blog-sources"><h2>Sources and further reading</h2><ul>${sources.map((source) => {
      const url = safeUrl(source.url);
      return url ? `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || url)}</a></li>` : '';
    }).join('')}</ul></section>` : '';
    const schema = {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
      description, image: image ? [new URL(image, SITE).href] : undefined,
      datePublished: published, dateModified: post.updated_at || published,
      author: { '@type': 'Organization', name: post.author_name || 'Varanasi Connect', url: SITE },
      publisher: { '@type': 'Organization', name: 'Varanasi Connect', url: SITE }, mainEntityOfPage: canonical
    };
    const schemaText = JSON.stringify(schema).replace(/</g, '\\u003c');
    const accountNav = '<nav class="nav"><div class="nav-inner"><a class="brand" href="/" aria-label="Varanasi Connect home"><img src="/assets/varanasi-connect-dark-logo.png" alt="Varanasi Connect"></a><div class="navlinks"><a href="/about.html">About</a><a href="/events.html">Events</a><a href="/rules.html">Rules</a><a href="/reviews.html">Reviews</a><a href="/blogs" aria-current="page">Blogs</a></div><div class="profile-wrap" id="profileWrap"><button class="auth-cta" id="authButton" type="button" aria-label="Log in" title="Log in with Discord" aria-haspopup="menu" aria-expanded="false"><span id="authLabel">Log in</span><img class="profile-avatar" id="profileAvatar" alt="" hidden><svg class="profile-fallback" id="profileFallback" viewBox="0 0 24 24" aria-hidden="true" hidden><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6"></path></svg></button><div class="profile-menu" id="profileMenu" role="menu" aria-label="Account menu" hidden><div class="profile-menu-heading"><strong id="profileMenuName">Your account</strong><span id="profileMenuEmail"></span></div><button type="button" role="menuitem" data-account-action="events">Registered events</button><details class="profile-menu-group"><summary role="menuitem">Settings</summary><div class="profile-submenu"><a class="profile-menu-link" href="/?open=notifications">Notifications</a></div></details><details class="profile-menu-group"><summary role="menuitem">Support</summary><div class="profile-submenu"><a class="profile-menu-link" href="mailto:community.varanasi@gmail.com?subject=Varanasi%20Connect%20Support">Email</a><a class="profile-menu-link" href="tel:+918004394207" data-support-phone="+91 800 439 4207">Call +91 800 439 4207</a></div></details><a class="profile-menu-link" role="menuitem" id="websiteControlPanelLink" href="https://admin.varanasiconnect.in/" target="_blank" rel="noopener" hidden>Website Control Panel</a><a class="profile-menu-link" role="menuitem" id="discordBotDashboardLink" href="https://VnscBot.varanasiconnect.in/" target="_blank" rel="noopener" hidden>Discord Bot Dashboard</a><div class="profile-menu-divider"></div><button type="button" role="menuitem" class="profile-logout" data-account-action="logout">Log out</button></div></div></div></nav>';
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fbf8f1"><title>${esc(title)} — Varanasi Connect</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Varanasi Connect"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">${image ? `<meta property="og:image" content="${esc(new URL(image, SITE).href)}">` : ''}<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><link rel="stylesheet" href="/assets/shared-nav.css?v=5"><link rel="stylesheet" href="/assets/blog-pages.css?v=2"><script type="application/ld+json">${schemaText}</script></head><body class="blog-site">${accountNav}<main class="blog-article-main"><article><header class="blog-article-header"><p class="blog-eyebrow">${esc(post.category || 'Varanasi')}</p><h1>${esc(post.title)}</h1><p class="blog-article-excerpt">${esc(post.excerpt)}</p><div class="blog-article-byline">By ${esc(post.author_name || 'Varanasi Connect')}${published ? ` · ${esc(new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(published)))}` : ''}</div></header>${image ? `<img class="blog-article-cover" src="${esc(image)}" alt="${esc(post.cover_image_alt || post.title)}">` : ''}<div class="blog-article-content">${paragraphs}</div>${sourceHtml}<a class="blog-back" href="/blogs">← Back to all stories</a></article></main><footer class="blog-footer"><div><a href="/">Varanasi Connect</a><span>© ${new Date().getFullYear()} Varanasi Connect</span></div><nav aria-label="Footer navigation"><a href="/about.html">About</a><a href="/events.html">Events</a><a href="/blogs">Blogs</a></nav></footer><script src="/site-config.js"></script><script src="/assets/blog-feature.js?v=2"></script><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="/assets/site-activity.js"></script><script src="/assets/blog-account.js"></script><script src="/account-menu.js" defer></script></body></html>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(html);
  } catch (_) {
    reply(res, 503, 'Stories temporarily unavailable', 'We could not load this story right now. Please try again shortly.');
  }
};
