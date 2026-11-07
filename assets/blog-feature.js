/* Optional blog feature: remove this include from the website pages to remove blog navigation. */
(function () {
  'use strict';
  var cfg = window.VC_CONFIG || {};
  var api = (cfg.supabaseUrl || '').replace(/\/$/, '') + '/rest/v1';
  var key = cfg.supabasePublishableKey || '';

  window.VC_BLOG_FEATURE = {
    seeds: [
      {
        slug: 'a-walk-along-the-varanasi-ghats',
        title: 'A thoughtful walk along the Varanasi ghats',
        category: 'Places & culture',
        excerpt: 'The riverfront is more than a postcard view. Here is a simple way to explore it with curiosity and respect.',
        body: 'Varanasi’s ghats are broad stone steps that meet the Ganga. The District Varanasi administration describes 88 ghats, with many used for bathing and puja. Each stretch of riverfront has its own rhythm, so a walk is best approached as a series of small observations rather than a checklist.\n\nStart early if you want a quieter view of the river and the city waking up. Walk at an unhurried pace, leave room for residents to go about their routines, and ask before photographing people. If you take a boat, agree on the route and price before setting off.\n\nThe ghats are living public and religious spaces. Dress and behave respectfully, follow signs and local guidance, and keep a safe distance from ceremonies. A little patience makes the experience richer for visitors and more considerate for the people who live here.',
        cover_image_url: 'https://cdn.s3waas.gov.in/s36da37dd3139aa4d9aa55b8d237ec5d4a/uploads/2018/04/2018040927.jpg',
        cover_image_alt: 'The Ganga riverfront and ghats in Varanasi',
        author_name: 'Varanasi Connect',
        source_links: [{ title: 'District Varanasi — Ganga Ghat', url: 'https://varanasi.nic.in/tourist-place/ganga-ghat/' }],
        seo_title: 'A respectful guide to walking the Varanasi ghats',
        meta_description: 'Explore Varanasi’s Ganga riverfront thoughtfully, with practical tips for a calm and respectful ghat walk.'
      },
      {
        slug: 'sarnath-a-day-trip-from-varanasi',
        title: 'Sarnath: a calm day trip from Varanasi',
        category: 'Nearby places',
        excerpt: 'A little planning helps make a visit to Sarnath more meaningful, comfortable and respectful.',
        body: 'Sarnath is a historic Buddhist pilgrimage site northeast of Varanasi. The District Varanasi administration places it about 10 kilometres from the city. It can feel very different from the bustle of the old city, so plan enough time to move slowly between the site and its museum or other nearby stops.\n\nCheck opening hours, visitor rules and transport before you leave; these can change. Carry water, use marked paths, and be mindful that people visit to pray and reflect. If you are travelling during a busy period, leave extra time for the road journey.\n\nRather than trying to fit in every stop, choose a few places that interest you and give each one your attention. The quieter pace is part of what makes Sarnath a memorable counterpoint to a day in central Varanasi.',
        cover_image_url: 'https://cdn.s3waas.gov.in/s36da37dd3139aa4d9aa55b8d237ec5d4a/uploads/2018/08/2018080841.jpg',
        cover_image_alt: 'A historic monument at Sarnath near Varanasi',
        author_name: 'Varanasi Connect',
        source_links: [{ title: 'District Varanasi — Tourist Places', url: 'https://varanasi.nic.in/tourist-places/' }],
        seo_title: 'Planning a thoughtful day trip to Sarnath from Varanasi',
        meta_description: 'A practical, respectful guide to visiting Sarnath from Varanasi, with planning tips and official visitor information.'
      },
      {
        slug: 'a-quiet-corner-of-bhu-varanasi',
        title: 'A quiet corner of BHU in Varanasi',
        category: 'Campus & city',
        excerpt: 'Banaras Hindu University offers a different pace from the lanes and ghats. Here is what to know before you visit.',
        body: 'Banaras Hindu University is a major part of Varanasi’s academic and cultural life. The university’s published materials describe a large campus with faculties, institutes, gardens and the Shri Vishwanath Temple. For visitors, that scale is a reason to plan ahead instead of assuming every part of the campus is open to casual sightseeing.\n\nCheck current visitor guidance and access rules before travelling. Keep to public areas, respect classes and campus residents, and follow any directions from university staff. If you are visiting the temple, be mindful of worshippers and its posted rules.\n\nThe contrast between a busy city street and a green campus path can make BHU a refreshing stop. Treat it as a working university first, and a place to explore only where visitors are welcome.',
        cover_image_url: '/assets/varanasi/culture/Bhu%20temple.jpg',
        cover_image_alt: 'Temple architecture on the Banaras Hindu University campus',
        author_name: 'Varanasi Connect',
        source_links: [{ title: 'Banaras Hindu University — About the University', url: 'https://www.bhu.ac.in/' }],
        seo_title: 'Visiting Banaras Hindu University in Varanasi',
        meta_description: 'A considerate visitor’s guide to BHU’s campus, public areas and Shri Vishwanath Temple in Varanasi.'
      }
    ],
    async getEnabled() {
      if (!api || !key) return false;
      try {
        var response = await fetch(api + '/vc_blog_settings?select=blogs_enabled&id=eq.1', {
          headers: { apikey: key, Authorization: 'Bearer ' + key },
          cache: 'no-store'
        });
        if (!response.ok) return false;
        var rows = await response.json();
        return rows.length > 0 && rows[0].blogs_enabled === true;
      } catch (_) { return false; }
    },
    async getPublished() {
      if (!api || !key) return this.seeds;
      try {
        var response = await fetch(api + '/vc_blog_posts?select=*&status=eq.published&order=published_at.desc.nullslast,created_at.desc', {
          headers: { apikey: key, Authorization: 'Bearer ' + key }
        });
        if (!response.ok) return this.seeds;
        var rows = await response.json();
        return rows;
      } catch (_) { return this.seeds; }
    },
    async getPost(slug) {
      var rows = await this.getPublished();
      return rows.find(function (row) { return row.slug === slug; }) || null;
    }
  };

  function applyNavVisibility(enabled) {
    document.querySelectorAll('.navlinks').forEach(function (nav) {
      var link = nav.querySelector('[data-blog-nav]');
      if (!link) {
        link = document.createElement('a');
        link.dataset.blogNav = 'true';
        link.href = './blogs.html';
        link.textContent = 'Blogs';
        nav.appendChild(link);
      }
      link.hidden = !enabled;
      link.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    });
  }

  var lastVisibility = null, visibilityRequest = null;
  async function refreshVisibility() {
    if (visibilityRequest) return visibilityRequest;
    visibilityRequest = window.VC_BLOG_FEATURE.getEnabled().then(function (enabled) {
      applyNavVisibility(enabled);
      if (lastVisibility !== null && lastVisibility !== enabled) {
        window.dispatchEvent(new CustomEvent('vc-blog-visibility-change', { detail: { enabled: enabled } }));
      }
      lastVisibility = enabled;
      return enabled;
    }).finally(function () { visibilityRequest = null; });
    return visibilityRequest;
  }
  window.VC_BLOG_FEATURE.refreshVisibility = refreshVisibility;
  refreshVisibility();
  window.addEventListener('focus', refreshVisibility);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshVisibility();
  });
  window.setInterval(function () {
    if (document.visibilityState === 'visible') refreshVisibility();
  }, 30000);

  var serverArticle = document.querySelector('.blog-article-main:not(#blogArticle)');
  if (serverArticle) {
    window.addEventListener('vc-blog-visibility-change', function (event) {
      if (!event.detail.enabled) {
        serverArticle.dataset.visibilityBlocked = 'true';
        serverArticle.innerHTML = '<p class="blog-loading">The blog is temporarily turned off. <a href="/">Return to the homepage.</a></p>';
      } else if (serverArticle.dataset.visibilityBlocked === 'true') {
        window.location.reload();
      }
    });
  }
})();
