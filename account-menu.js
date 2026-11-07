(() => {
  const phonePattern = /Android|iPhone|iPod|IEMobile|Windows Phone/i;
  const isPhone = navigator.userAgentData?.mobile === true ||
    (navigator.userAgentData?.mobile !== false && phonePattern.test(navigator.userAgent));

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch (error) {
        console.warn('Clipboard API was unavailable; trying the browser fallback.', error);
      }
    }

    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Clipboard copy was not available.');
  };

  document.addEventListener('click', async (event) => {
    const link = event.target.closest('[data-support-phone]');
    if (!link || isPhone) return;

    event.preventDefault();
    const originalLabel = link.dataset.originalLabel || link.textContent;
    link.dataset.originalLabel = originalLabel;
    try {
      await copyText(link.dataset.supportPhone);
      link.textContent = 'Number copied';
      window.clearTimeout(link.copyFeedbackTimer);
      link.copyFeedbackTimer = window.setTimeout(() => {
        link.textContent = originalLabel;
      }, 1800);
    } catch (error) {
      console.error('Could not copy the support number:', error);
      window.alert('Could not copy automatically. Support number: ' + link.dataset.supportPhone);
    }
  });
})();
