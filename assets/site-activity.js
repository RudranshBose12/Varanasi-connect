(function () {
  'use strict';

  var config = window.VC_CONFIG || {};
  var api = (config.supabaseUrl || '').replace(/\/$/, '') + '/rest/v1';
  var key = config.supabasePublishableKey || '';
  var currentUserId = null;
  var heartbeat = null;
  var pathname = (location.pathname || '/').slice(0, 180);
  var reportedError = false;
  var authClients = new WeakSet();

  function report() {
    if (reportedError) return;
    reportedError = true;
    console.info('Website activity tracking is waiting for its database setup.');
  }

  function recordAnonymous(type, target) {
    if (!api || !key) return;
    fetch(api + '/vc_site_activity', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ activity_type: type, page_path: pathname, target: target || null }),
      keepalive: true
    }).then(function (response) { if (!response.ok) report(); }).catch(report);
  }

  function safeTarget(element) {
    var link = element.closest('a[href]');
    if (link) {
      try {
        var url = new URL(link.href, location.href);
        return (url.origin === location.origin ? url.pathname : url.hostname).slice(0, 180);
      } catch (_) {
        return 'link';
      }
    }
    var label = element.dataset.analyticsLabel || element.id || element.getAttribute('aria-label') || 'button';
    return label.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 180) || 'button';
  }

  function stopHeartbeat(client, removePresence) {
    if (heartbeat) window.clearInterval(heartbeat);
    heartbeat = null;
    var oldId = currentUserId;
    currentUserId = null;
    if (removePresence && oldId && client) {
      client.from('vc_active_accounts').delete().eq('user_id', oldId).then(function (result) {
        if (result.error) report();
      }).catch(report);
    }
  }

  function startHeartbeat(client, userId) {
    if (!userId) return stopHeartbeat(client, true);
    if (currentUserId !== userId) stopHeartbeat(client, true);
    currentUserId = userId;
    function send() {
      if (document.visibilityState !== 'visible' || currentUserId !== userId) return;
      client.from('vc_active_accounts').upsert({ user_id: userId, last_seen: new Date().toISOString() }, { onConflict: 'user_id' })
        .then(function (result) { if (result.error) report(); }).catch(report);
    }
    send();
    if (heartbeat) window.clearInterval(heartbeat);
    heartbeat = window.setInterval(send, 60000);
  }

  function attach(client) {
    if (!client || !client.auth || authClients.has(client)) return;
    authClients.add(client);
    client.auth.onAuthStateChange(function (event, session) {
      window.setTimeout(function () {
        var userId = session && session.user && session.user.id;
        if (event === 'SIGNED_IN' && userId) {
          var loginKey = 'vc-activity-login-' + userId, lastLogin = 0;
          try { lastLogin = Number(localStorage.getItem(loginKey)) || 0; } catch (_) {}
          if (Date.now() - lastLogin > 60000) {
            try { localStorage.setItem(loginKey, String(Date.now())); } catch (_) {}
            client.from('vc_site_activity').insert({ activity_type: 'login', page_path: pathname, user_id: userId }).then(function (result) {
              if (result.error) report();
            }).catch(report);
          }
        }
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') stopHeartbeat(client, true);
        else startHeartbeat(client, userId);
      }, 0);
    });
    client.auth.getSession().then(function (result) {
      if (result.error) return;
      var session = result.data && result.data.session;
      startHeartbeat(client, session && session.user && session.user.id);
    }).catch(function () {});
  }

  recordAnonymous('page_view', null);
  document.addEventListener('click', function (event) {
    var target = event.target.closest('a[href], button');
    if (!target || target.disabled || target.closest('[data-no-analytics]')) return;
    recordAnonymous('click', safeTarget(target));
  }, { passive: true });

  window.VC_ACTIVITY = { attach: attach, client: null };
  if (document.body.classList.contains('blog-site') && window.supabase && config.supabaseUrl && key) {
    window.VC_ACTIVITY.client = window.supabase.createClient(config.supabaseUrl, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    attach(window.VC_ACTIVITY.client);
  }
})();
