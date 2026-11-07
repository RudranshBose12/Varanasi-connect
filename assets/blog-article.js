(function () {
  'use strict';
  var feature = window.VC_BLOG_FEATURE;
  var root = document.getElementById('blogArticle');
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function safeUrl(value) {
    var raw = String(value || '');
    return /^https:\/\//i.test(raw) || /^http:\/\//i.test(raw) || /^\/(?!\/)/.test(raw) || /^\.\//.test(raw) ? raw : '';
  }
  function niceDate(value) { return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : ''; }
  function updateMeta(post) {
    var title = post.seo_title || post.title;
    document.title = title + ' — Varanasi Connect';
    var description = post.meta_description || post.excerpt || '';
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelector('meta[property="og:image"]').content = safeUrl(post.cover_image_url);
    var base = /localhost|127\.0\.0\.1/.test(location.hostname) ? location.origin + '/blog.html?slug=' + encodeURIComponent(post.slug) : location.origin + '/blog/' + encodeURIComponent(post.slug);
    document.querySelector('link[rel="canonical"]').href = base;
  }
  function render(post) {
    updateMeta(post);
    var body = String(post.body || '').split(/\n\s*\n/).map(function (part) { return part.trim(); }).filter(Boolean).map(function (part) { return '<p>' + esc(part).replace(/\n/g, '<br>') + '</p>'; }).join('');
    var sources = Array.isArray(post.source_links) ? post.source_links : [];
    var sourceHtml = sources.length ? '<section class="blog-sources"><h2>Sources and further reading</h2><ul>' + sources.map(function (source) { var url = safeUrl(source.url); return url ? '<li><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.title || url) + '</a></li>' : ''; }).join('') + '</ul></section>' : '';
    var image = safeUrl(post.cover_image_url);
    root.innerHTML = '<article><header class="blog-article-header"><p class="blog-eyebrow">' + esc(post.category || 'Varanasi') + '</p><h1>' + esc(post.title) + '</h1><p class="blog-article-excerpt">' + esc(post.excerpt) + '</p><div class="blog-article-byline">By ' + esc(post.author_name || 'Varanasi Connect') + (post.published_at ? ' · ' + esc(niceDate(post.published_at)) : '') + '</div></header>' + (image ? '<img class="blog-article-cover" src="' + esc(image) + '" alt="' + esc(post.cover_image_alt || post.title) + '">' : '') + '<div class="blog-article-content">' + body + '</div>' + sourceHtml + '<a class="blog-back" href="/blogs">← Back to all stories</a></article>';
  }
  var slug = new URLSearchParams(location.search).get('slug') || location.pathname.split('/').filter(Boolean).pop();
  function showDisabled() {
    root.innerHTML = '<p class="blog-loading">The blog is temporarily turned off. <a href="/">Return to the homepage.</a></p>';
  }
  async function loadPost() {
    var post = await feature.getPost(slug);
    if (!post) { root.innerHTML = '<p class="blog-loading">That story could not be found. <a href="/blogs">Browse all stories.</a></p>'; return; }
    render(post);
  }
  feature.getEnabled().then(function (enabled) { return enabled ? loadPost() : showDisabled(); })
    .catch(function () { showDisabled(); });
  window.addEventListener('vc-blog-visibility-change', function (event) {
    if (event.detail.enabled) loadPost().catch(function () { root.innerHTML = '<p class="blog-loading">This story could not be loaded. Please try again shortly.</p>'; });
    else showDisabled();
  });
})();
