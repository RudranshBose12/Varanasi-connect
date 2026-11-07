(function () {
  'use strict';

  var config = window.VC_CONFIG || {};
  var button = document.getElementById('authButton');
  var label = document.getElementById('authLabel');
  var avatar = document.getElementById('profileAvatar');
  var fallback = document.getElementById('profileFallback');
  var menu = document.getElementById('profileMenu');
  var nameNode = document.getElementById('profileMenuName');
  var emailNode = document.getElementById('profileMenuEmail');
  if (!button || !label || !window.supabase || !config.supabaseUrl || !config.supabasePublishableKey) return;

  var client = window.VC_ACTIVITY && window.VC_ACTIVITY.client;
  if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  if (window.VC_ACTIVITY) window.VC_ACTIVITY.attach(client);
  var activeUser = null;

  function avatarFor(user) {
    var meta = user.user_metadata || {};
    var direct = meta.avatar_url || meta.picture || meta.avatarUrl;
    if (direct) return direct;
    var identity = (user.identities || []).find(function (item) { return item.provider === 'discord'; });
    var identityData = identity && identity.identity_data || {};
    var id = meta.provider_id || meta.sub || identityData.sub || identity && identity.id;
    var hash = meta.avatar || identityData.avatar;
    if (!id || !hash) return '';
    var extension = String(hash).startsWith('a_') ? 'gif' : 'png';
    return 'https://cdn.discordapp.com/avatars/' + encodeURIComponent(id) + '/' + encodeURIComponent(hash) + '.' + extension + '?size=96';
  }

  async function updateDashboardLinks(user) {
    var websiteLink = document.getElementById('websiteControlPanelLink');
    var botLink = document.getElementById('discordBotDashboardLink');
    if (!websiteLink || !botLink) return;
    websiteLink.hidden = true;
    botLink.hidden = true;
    if (!user) return;
    try {
      var results = await Promise.all([
        client.from('vc_admins').select('role').eq('user_id', user.id).maybeSingle(),
        client.from('vc_dashboard_access').select('can_view_website_panel,can_view_bot_dashboard').eq('user_id', user.id).maybeSingle()
      ]);
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var isAdmin = !!results[0].data && ['owner', 'admin'].includes(results[0].data.role);
      websiteLink.hidden = !(isAdmin || results[1].data && results[1].data.can_view_website_panel === true);
      botLink.hidden = !(isAdmin || results[1].data && results[1].data.can_view_bot_dashboard === true);
      var divider = menu.querySelector('.profile-menu-divider');
      if (divider) divider.hidden = websiteLink.hidden && botLink.hidden;
    } catch (error) {
      console.error('Could not load dashboard permissions:', error);
    }
  }

  function render(user) {
    activeUser = user || null;
    if (!activeUser) {
      button.classList.remove('is-signed-in');
      button.title = 'Log in with Discord';
      button.setAttribute('aria-label', 'Log in');
      button.setAttribute('aria-expanded', 'false');
      label.textContent = 'Log in';
      avatar.hidden = true;
      avatar.removeAttribute('src');
      fallback.hidden = true;
      menu.hidden = true;
      updateDashboardLinks(null);
      return;
    }
    var meta = user.user_metadata || {};
    var displayName = meta.global_name || meta.full_name || meta.name || meta.preferred_username || user.email || 'Your account';
    var image = avatarFor(user);
    button.classList.add('is-signed-in');
    button.title = 'Open account menu';
    button.setAttribute('aria-label', 'Open account menu for ' + displayName);
    label.textContent = '';
    avatar.onerror = function () { avatar.hidden = true; fallback.hidden = false; };
    if (image) { avatar.src = image; avatar.hidden = false; fallback.hidden = true; }
    else { avatar.hidden = true; fallback.hidden = false; }
    nameNode.textContent = displayName;
    emailNode.textContent = user.email || 'Signed in with Discord';
    updateDashboardLinks(user);
  }

  function setMenu(open) {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  client.auth.onAuthStateChange(function (_event, session) { render(session && session.user || null); });
  client.auth.getSession().then(function (result) {
    if (result.error) throw result.error;
    render(result.data.session && result.data.session.user || null);
  }).catch(function (error) { console.error('Could not load the account session:', error); render(null); });

  button.addEventListener('click', async function () {
    if (activeUser) { setMenu(menu.hidden); return; }
    button.disabled = true;
    label.textContent = 'Opening Discord…';
    try {
      var redirectTo = location.origin + location.pathname + location.search;
      var result = await client.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: redirectTo } });
      if (result.error) throw result.error;
    } catch (error) {
      console.error('Discord sign-in failed:', error);
      label.textContent = 'Log in';
      window.alert('Discord sign-in could not be completed. ' + (error.message || ''));
    } finally {
      button.disabled = false;
    }
  });

  menu.addEventListener('click', async function (event) {
    var action = event.target.closest('[data-account-action]')?.dataset.accountAction;
    if (action === 'logout') {
      try {
        var result = await client.auth.signOut();
        if (result.error) throw result.error;
        render(null);
      } catch (error) {
        console.error('Sign out failed:', error);
        window.alert('Could not log out. Please try again.');
      }
    } else if (action === 'events') {
      location.href = './events.html';
    }
  });
  document.addEventListener('click', function (event) { if (!event.target.closest('#profileWrap')) setMenu(false); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') setMenu(false); });
})();
