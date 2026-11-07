(function () {
  'use strict';
  var feature = window.VC_BLOG_FEATURE;
  var grid = document.getElementById('blogGrid');
  var empty = document.getElementById('blogDisabled');
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function imageUrl(value) {
    var raw = String(value || '');
    if (/^https:\/\//i.test(raw) || /^http:\/\//i.test(raw) || /^\/(?!\/)/.test(raw) || /^\.\//.test(raw)) return raw;
    return '';
  }
  function articleHref(slug) {
    return /localhost|127\.0\.0\.1/.test(location.hostname) ? './blog.html?slug=' + encodeURIComponent(slug) : '/blog/' + encodeURIComponent(slug);
  }
  function dateLabel(post) {
    var date = post.published_at || post.created_at;
    if (!date) return 'Varanasi Connect';
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
  }
  function showDisabled() {
    grid.hidden = true;
    empty.hidden = false;
    var intro = document.querySelector('.blog-intro'), heading = document.querySelector('.blog-section-heading'), note = document.querySelector('.blog-note');
    if (intro) intro.hidden = true;
    if (heading) heading.hidden = true;
    if (note) note.hidden = true;
  }
  function showEnabledFrame() {
    grid.hidden = false;
    empty.hidden = true;
    var intro = document.querySelector('.blog-intro'), heading = document.querySelector('.blog-section-heading'), note = document.querySelector('.blog-note');
    if (intro) intro.hidden = false;
    if (heading) heading.hidden = false;
    if (note) note.hidden = false;
  }
  async function renderPosts() {
    showEnabledFrame();
    var posts = await feature.getPublished();
    if (!posts.length) { grid.innerHTML = '<p class="blog-loading">No stories have been published yet.</p>'; return; }
    document.getElementById('blogCount').textContent = posts.length + (posts.length === 1 ? ' story' : ' stories');
    grid.innerHTML = posts.map(function (post) {
      var image = imageUrl(post.cover_image_url);
      return '<article class="blog-card"><a class="blog-card-image" href="' + esc(articleHref(post.slug)) + '" aria-label="Read ' + esc(post.title) + '">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(post.cover_image_alt || post.title) + '" loading="lazy">' : '') + '</a><div class="blog-card-copy"><span class="blog-card-category">' + esc(post.category || 'Varanasi') + '</span><h3><a href="' + esc(articleHref(post.slug)) + '">' + esc(post.title) + '</a></h3><p>' + esc(post.excerpt) + '</p><div class="blog-card-meta">' + esc(post.author_name || 'Varanasi Connect') + ' · ' + esc(dateLabel(post)) + '</div></div></article>';
    }).join('');
  }
  feature.getEnabled().then(function (enabled) { return enabled ? renderPosts() : showDisabled(); })
    .catch(function () { showDisabled(); });
  window.addEventListener('vc-blog-visibility-change', function (event) {
    if (event.detail.enabled) renderPosts().catch(function () { grid.innerHTML = '<p class="blog-loading">Stories could not be loaded right now. Please try again shortly.</p>'; });
    else showDisabled();
  });
})();
