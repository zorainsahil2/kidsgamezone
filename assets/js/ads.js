/**
 * KidsGameZone Public Ads System Manager
 */
const AdsManager = {
  slots: {}, // Active ad slots loaded from API

  /**
   * Fetch active ad slots and initialize ad injections
   */
  async init() {
    // 1. Read inline config if present
    if (typeof window !== 'undefined' && window.adSlotsConfig !== undefined && window.adSlotsConfig !== null) {
      if (Array.isArray(window.adSlotsConfig)) {
        window.adSlotsConfig.forEach(slot => {
          this.slots[slot.slot_name] = slot;
        });
      } else {
        this.slots = window.adSlotsConfig;
      }
      // Inject standard banner slots
      this.injectAll();
      return;
    } else if (typeof window !== 'undefined' && window.preRollAdCode !== undefined && window.preRollAdCode !== null) {
      this.slots['pre_roll'] = {
        slot_name: 'pre_roll',
        ad_code: window.preRollAdCode,
        skip_after_seconds: window.preRollSkipSeconds || 5
      };
      // Banner ads are printed server-side directly in index.php and game.php,
      // so we do not fetch or inject them dynamically on these pages.
      return;
    }

    // 2. Fallback to API if not inlined
    try {
      const response = await fetch('/api/get-ads.php', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ad slot configurations.');
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        data.forEach(slot => {
          this.slots[slot.slot_name] = slot;
        });
      }
      
      // Inject standard banner slots
      this.injectAll();
    } catch (error) {
      console.warn('AdsManager: Failed to initialize ads.', error);
    }
  },

  /**
   * Inject all standard active banner slots
   */
  injectAll() {
    const bannerSlots = ['header_banner', 'sidebar_left', 'sidebar_right', 'footer_banner'];
    bannerSlots.forEach(slotName => {
      this.inject(slotName);
    });
  },

  /**
   * Inject ad code into target div and track impression
   *
   * @param {string} slotName 
   */
  inject(slotName) {
    const slot = this.slots[slotName];
    const targetDiv = document.getElementById(slotName);
    
    if (targetDiv && slot) {
      const isScriptAd = slot.ad_code && (slot.ad_code.includes('<script') || slot.network === 'adsterra' || slot.network === 'adsense' || slot.network === 'medianet' || slot.network === 'propellerads');
      
      if (isScriptAd && slotName !== 'pre_roll') {
        this.injectIframeAd(targetDiv, slot.ad_code, slotName);
      } else {
        this.injectHtmlWithScripts(targetDiv, slot.ad_code);
      }
      this.trackEvent('ad_impression', null, slotName);
    }
  },

  /**
   * Return predefined ad unit sizing dimensions based on page slot
   *
   * @param {string} slotName 
   * @returns {object}
   */
  getSlotDimensions(slotName) {
    switch (slotName) {
      case 'header_banner':
      case 'footer_banner':
        return { width: 728, height: 90 };
      case 'sidebar_left':
        return { width: 160, height: 600 };
      case 'sidebar_right':
        return { width: 300, height: 250 };
      case 'pre_roll':
        return { width: 300, height: 250 };
      default:
        return { width: 300, height: 250 };
    }
  },

  /**
   * Helper to write ad codes inside an isolated iframe, protecting parent window scope from document.write crashes
   *
   * @param {HTMLElement} element 
   * @param {string} adCode 
   * @param {string} slotName 
   */
  injectIframeAd(element, adCode, slotName) {
    element.innerHTML = '';
    const dim = this.getSlotDimensions(slotName);
    
    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.width = dim.width;
    iframe.height = dim.height;
    iframe.setAttribute('scrolling', 'no');
    
    element.appendChild(iframe);
    
    const html = '<!DOCTYPE html><html><head><style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; background-color: transparent; }</style></head><body>' + adCode + '</body></html>';
    
    if ('srcdoc' in iframe) {
      iframe.srcdoc = html;
    } else {
      try {
        const iframeDoc = iframe.contentWindow.document || iframe.contentDocument;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      } catch (e) {
        console.warn('AdsManager: Dynamic iframe write fallback failed.', e);
        element.innerHTML = adCode;
      }
    }
  },

  /**
   * Helper to set innerHTML and force inline scripts to execute
   *
   * @param {HTMLElement} element 
   * @param {string} html 
   */
  injectHtmlWithScripts(element, html) {
    element.innerHTML = html;
    const scripts = element.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      // Copy all attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copy inline text contents
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  },

  /**
   * Displays full-screen pre-roll overlay ad with countdown skip timer
   *
   * @param {number} gameId 
   * @param {function} onComplete Callback after skip or completion
   */
  showPreRoll(gameId, onComplete) {
    const preRoll = this.slots['pre_roll'];
    if (!preRoll) {
      onComplete();
      return;
    }

    // 1. Create overlay backdrop container
    const overlay = document.createElement('div');
    overlay.id = 'preroll-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(26, 32, 44, 0.98)', // Sleek dark slate
      zIndex: '999999',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Nunito', sans-serif",
      color: '#FFFFFF',
      padding: '20px',
      boxSizing: 'border-box'
    });

    // 2. Create ad content wrapper
    const adContainer = document.createElement('div');
    Object.assign(adContainer.style, {
      marginBottom: '30px',
      width: '100%',
      maxWidth: '728px',
      minHeight: '250px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '4px solid #FFF',
      borderRadius: '16px',
      backgroundColor: '#000',
      overflow: 'hidden'
    });
    
    const isScriptAd = preRoll.ad_code && (preRoll.ad_code.includes('<script') || preRoll.network === 'adsterra' || preRoll.network === 'adsense' || preRoll.network === 'medianet' || preRoll.network === 'propellerads');
    if (isScriptAd) {
      this.injectIframeAd(adContainer, preRoll.ad_code, 'pre_roll');
    } else {
      this.injectHtmlWithScripts(adContainer, preRoll.ad_code);
    }
    overlay.appendChild(adContainer);

    // Track initial ad impression
    this.trackEvent('ad_impression', gameId, 'pre_roll');

    // 3. Create timer control widget
    const timerContainer = document.createElement('div');
    timerContainer.style.textAlign = 'center';
    overlay.appendChild(timerContainer);

    let secondsLeft = parseInt(preRoll.skip_after_seconds);
    if (isNaN(secondsLeft) || secondsLeft < 0) {
      secondsLeft = 5;
    }

    // Countdown subtitle text
    const countdownText = document.createElement('p');
    Object.assign(countdownText.style, {
      fontSize: '1.4rem',
      fontWeight: '700',
      marginBottom: '15px',
      color: '#FFE66D', // ACCENT Yellow
      fontFamily: "'Fredoka', sans-serif"
    });
    countdownText.innerText = `🎮 Advertisement – Skip in ${secondsLeft}s`;
    timerContainer.appendChild(countdownText);

    // Action Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skip-ad-btn';
    Object.assign(skipBtn.style, {
      display: secondsLeft <= 0 ? 'inline-block' : 'none',
      padding: '12px 35px',
      fontSize: '1.25rem',
      fontFamily: "'Fredoka', sans-serif",
      backgroundColor: '#FF6B35', // PRIMARY Orange
      color: '#FFFFFF',
      border: '3px solid #2D3748',
      borderRadius: '12px',
      boxShadow: '0 6px 0px #2D3748',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.1s ease',
      letterSpacing: '0.5px'
    });
    skipBtn.innerText = 'Skip Ad ▶';
    
    // Add micro-interaction styling
    skipBtn.addEventListener('mouseenter', () => { skipBtn.style.backgroundColor = '#FF8552'; });
    skipBtn.addEventListener('mouseleave', () => { skipBtn.style.backgroundColor = '#FF6B35'; });
    skipBtn.addEventListener('mousedown', () => {
      skipBtn.style.transform = 'translateY(4px)';
      skipBtn.style.boxShadow = '0 2px 0px #2D3748';
    });
    skipBtn.addEventListener('mouseup', () => {
      skipBtn.style.transform = 'translateY(0px)';
      skipBtn.style.boxShadow = '0 6px 0px #2D3748';
    });

    skipBtn.addEventListener('click', () => {
      this.trackEvent('ad_skip', gameId, 'pre_roll');
      clearInterval(interval);
      document.body.removeChild(overlay);
      onComplete();
    });
    timerContainer.appendChild(skipBtn);

    document.body.appendChild(overlay);

    // If skip seconds is 0, show button instantly
    if (secondsLeft <= 0) {
      return;
    }

    // Start timer interval countdown
    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        countdownText.innerText = `🎮 Advertisement – Skip in ${secondsLeft}s`;
      } else {
        clearInterval(interval);
        countdownText.style.display = 'none';
        skipBtn.style.display = 'inline-block';
      }
    }, 1000);
  },

  /**
   * POST analytical event log (Fire and Forget)
   *
   * @param {string} eventType 
   * @param {number|null} gameId 
   * @param {string|null} adSlot 
   */
  trackEvent(eventType, gameId = null, adSlot = null) {
    const payload = {
      event_type: eventType,
      game_id: gameId,
      ad_slot: adSlot
    };
    
    fetch('/api/track.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      // Fail silently to avoid interrupting gameplay experience
      console.warn('Analytics failure:', err);
    });
  }
};

// Auto-run initialization on content load
document.addEventListener('DOMContentLoaded', () => AdsManager.init());
