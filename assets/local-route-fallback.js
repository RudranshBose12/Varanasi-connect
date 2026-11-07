(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  var localPages = {
    '/': '/index.html',
    '/about': '/about.html',
    '/events': '/events.html',
    '/rules': '/rules.html',
    '/reviews': '/reviews.html',
    '/blogs': '/blogs.html',
    '/blog': '/blog.html'
  };

  function updateLink(link) {
    if (!link || !link.hasAttribute('href')) return;
    try {
      var url = new URL(link.getAttribute('href'), location.href);
      if (url.origin !== location.origin || !localPages[url.pathname]) return;
      url.pathname = localPages[url.pathname];
      link.setAttribute('href', url.pathname + url.search + url.hash);
    } catch (_) {}
  }

  document.querySelectorAll('a[href]').forEach(updateLink);
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('a[href]')) updateLink(node);
        if (node.querySelectorAll) node.querySelectorAll('a[href]').forEach(updateLink);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
