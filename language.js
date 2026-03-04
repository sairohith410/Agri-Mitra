class LanguageSwitcher {
  constructor() {
    this.languages = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिंदी' },
      { code: 'te', name: 'తెలుగు' }
    ];

    // Check if googtrans cookie is set
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    this.currentLang = match ? match[1] : 'en';

    this.init();
  }

  init() {
    this.injectGoogleTranslate();

    // Defer UI creation slightly to ensure nav elements are painted
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createUI();
        this.protectIcons();
        this.addStyles();
      });
    } else {
      this.createUI();
      this.protectIcons();
      this.addStyles();
    }
  }

  protectIcons() {
    const iconSelectors = [
      '.nav-logo-icon', '.hero-card-icon', '.feature-icon', '.result-icon',
      '.about-visual-icon', '.upload-icon', '.review-avatar', '.tip-bullet',
      '.hero-badge'
    ];

    iconSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('notranslate');
      });
    });
  }

  injectGoogleTranslate() {
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,te',
        autoDisplay: false,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    };

    const container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none'; // Hidden
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  createUI() {
    this.createDesktopUI();
    this.createMobileUI();

    // Ensure the dropdowns reflect the correct current language
    this.syncDropdowns(this.currentLang);
  }

  createDesktopUI() {
    let desktopLinks = document.querySelector('.nav-desktop-links');
    if (!desktopLinks) return;

    // Prevent multiple additions
    if (document.getElementById('custom-lang-switcher')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'custom-lang-switcher';
    wrapper.className = 'notranslate';
    wrapper.setAttribute('aria-label', 'Select Language');

    const select = document.createElement('select');
    select.className = 'lang-select';
    select.setAttribute('aria-label', 'Language selection');

    this.languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });

    wrapper.appendChild(select);
    desktopLinks.appendChild(wrapper);
  }

  createMobileUI() {
    const mobileNav = document.getElementById('mobile-nav');
    if (!mobileNav) return;

    // Prevent multiple additions
    if (document.querySelector('.mobile-nav-lang-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-nav-lang-wrapper notranslate';

    const select = document.createElement('select');
    select.className = 'mobile-lang-select form-select';
    select.setAttribute('aria-label', 'Language selection mobile');

    this.languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = `Language: ${lang.name}`;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
      if (typeof window.closeMobileNav === 'function') window.closeMobileNav();
    });

    wrapper.appendChild(select);
    mobileNav.insertBefore(wrapper, mobileNav.firstChild);
  }

  syncDropdowns(langCode) {
    document.querySelectorAll('.lang-select, .mobile-lang-select').forEach(select => {
      if (select.value !== langCode) {
        select.value = langCode;
      }
    });
  }

  switchLanguage(langCode) {
    // 1. Persist the cookie everywhere possible to ensure it sticks across subpages
    if (langCode === 'en') {
      this.clearCookie('googtrans');
    } else {
      this.setPersistentCookie('googtrans', `/en/${langCode}`);
    }
    this.currentLang = langCode;
    this.syncDropdowns(langCode);

    // 2. Trigger native translation via Google translation frame
    const frame = document.querySelector('iframe.goog-te-menu-frame');
    if (frame && frame.contentWindow) {
      this.triggerNativeTranslate(frame, langCode);
    } else {
      // Fallback: If the iframe isn't ready or inaccessible
      window.location.reload();
    }
  }

  triggerNativeTranslate(frame, langCode) {
    try {
      const innerDoc = frame.contentWindow.document;
      const links = innerDoc.querySelectorAll('.goog-te-menu2-item span.text');

      let found = false;
      for (let i = 0; i < links.length; i++) {
        if (
          (langCode === 'en' && links[i].innerText.includes('English')) ||
          (langCode === 'hi' && links[i].innerText.includes('Hindi')) ||
          (langCode === 'te' && links[i].innerText.includes('Telugu'))
        ) {
          links[i].click();
          found = true;
          break;
        }
      }

      if (!found) {
        window.location.reload();
      }
    } catch (e) {
      // Cross-origin iframe frame protection fallback
      window.location.reload();
    }
  }

  setPersistentCookie(name, value) {
    const domain = location.hostname;
    const rootDomain = '.' + domain.split('.').reverse().slice(0, 2).reverse().join('.');

    const expires = new Date();
    expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expStr = `expires=${expires.toUTCString()}`;

    document.cookie = `${name}=${value}; ${expStr}; path=/;`;
    // We do not want to fail if the URL is localhost
    if (rootDomain !== '.' && location.hostname !== "localhost") {
      document.cookie = `${name}=${value}; ${expStr}; path=/; domain=${rootDomain};`;
    }
  }

  clearCookie(name) {
    const domain = location.hostname;
    const rootDomain = '.' + domain.split('.').reverse().slice(0, 2).reverse().join('.');

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    if (rootDomain !== '.' && location.hostname !== "localhost") {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
    }
  }

  addStyles() {
    if (document.getElementById('lang-switcher-styles')) return;

    const style = document.createElement('style');
    style.id = 'lang-switcher-styles';
    style.textContent = `
      #custom-lang-switcher {
        display: inline-flex;
        align-items: center;
        background: transparent;
        margin-left: 12px;
        position: relative;
        z-index: 201;
      }
      .lang-select {
        padding: 5px 8px;
        border-radius: var(--radius-xs);
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-mid);
        border: 1px solid var(--card-border);
        background: var(--cream);
        cursor: pointer;
        outline: none;
        font-family: inherit;
        transition: var(--transition);
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%234A5E52' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
        background-size: 8px;
        padding-right: 20px;
      }
      .lang-select:hover {
        border-color: var(--leaf);
        color: var(--forest);
        background-color: var(--white);
      }
      .lang-select:focus {
        border-color: var(--leaf);
        box-shadow: 0 0 0 2px rgba(74,140,92,0.1);
        background-color: var(--white);
      }
      .lang-select option {
        color: var(--text-dark);
        background: var(--cream);
      }
      
      /* Mobile Nav styles */
      .mobile-nav-lang-wrapper {
         padding: 0px 14px 14px 14px;
         display: flex;
         align-items: center;
         border-bottom: 1px solid var(--card-border);
         margin-bottom: 10px;
      }
      .mobile-lang-select {
         background: rgba(74,140,92,0.08); /* Lighter background */
         border: 1px solid rgba(74,140,92,0.15); /* More subtle border */
         border-radius: var(--radius-sm);
         padding: 10px 14px;
         font-size: 0.95rem;
         font-weight: 600;
         color: var(--forest);
         outline: none;
         cursor: pointer;
         transition: var(--transition);
         width: 100%;
         font-family: inherit;
      }
      .mobile-lang-select:focus {
         background: var(--white);
         border-color: var(--leaf);
      }
      
      /* THIS FIXES THE LAYOUT BREAKAGE */
      /* Google Translate injects <font> tags around text to translate it. 
         If text is inside a flexbox or grid relying on direct children for layout, 
         these extra <font> tags break the CSS grid/flex expectations. 
         'display: contents' tells the browser to NOT treat <font> as a box. 
         NOTE: We omit !important so we don't accidentally unhide Google's hidden original-text elements! */
      font {
          display: contents; 
      }
      
      .goog-te-combo {
          display: none !important;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
         .lang-select {
             background-color: var(--card-bg, rgba(16, 30, 21, 0.97));
             color: var(--text-dark, #ddeee3);
             border-color: var(--card-border, rgba(74, 140, 92, 0.17));
             background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2388b598' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
         }
         .lang-select option {
             background-color: var(--cream, #111c16);
             color: var(--text-dark, #ddeee3);
         }
         .lang-select:hover, .lang-select:focus {
             background-color: rgba(16, 30, 21, 1);
         }
         .mobile-lang-select {
             background: rgba(74,140,92,0.15);
             border-color: rgba(74,140,92,0.25);
             color: #7ed4a0;
         }
         .mobile-lang-select:focus {
             background: rgba(16, 30, 21, 1);
         }
      }
      
      /* Hide the default Google Translate widgets & popups */
      body { top: 0 !important; }
      .skiptranslate, #google_translate_element, .goog-te-banner-frame { 
        display: none !important; 
      }
      .goog-tooltip {
          display: none !important;
      }
      .goog-tooltip:hover {
          display: none !important;
      }
      .goog-text-highlight {
          background-color: transparent !important;
          border: none !important; 
          box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Single initialization
if (!window._langSwitcherInstance) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window._langSwitcherInstance = new LanguageSwitcher();
    });
  } else {
    window._langSwitcherInstance = new LanguageSwitcher();
  }
}
