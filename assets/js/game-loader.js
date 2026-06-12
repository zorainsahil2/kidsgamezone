/**
 * KidsGameZone Dynamic Game Loader Integration
 */

/**
 * Initiates the game load flow by showing the pre-roll ad overlay
 * and then loading the game in an iframe.
 *
 * @param {string} gameSlug 
 * @param {number} gameId 
 * @param {string} gamePath 
 */
function loadGame(gameSlug, gameId, gamePath) {
  // Ensure AdsManager is initialized before calling
  if (typeof AdsManager !== 'undefined') {
    // 1. Show pre-roll ad overlay
    AdsManager.showPreRoll(gameId, () => {
      // 2. Load game iframe on completion
      loadGameIframe(gamePath);
      // 3. Track the game view event
      AdsManager.trackEvent('game_view', gameId);
    });
  } else {
    // Fallback if AdsManager is missing
    loadGameIframe(gamePath);
  }
}

/**
 * Creates and injects the game iframe into the page layout container
 *
 * @param {string} gamePath 
 */
function loadGameIframe(gamePath) {
  const container = document.getElementById('game-iframe-container');
  if (container) {
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = gamePath;
    iframe.width = "100%";
    iframe.height = "600px";
    iframe.frameBorder = "0";
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.border = '4px solid #2D3748';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 8px 0px #2D3748';
    iframe.style.backgroundColor = '#FFFFFF';
    
    // Hide spinner once iframe is loaded
    iframe.addEventListener('load', () => {
      const spinner = document.getElementById('iframe-spinner');
      if (spinner) {
        spinner.style.transition = 'opacity 0.3s ease';
        spinner.style.opacity = '0';
        setTimeout(() => {
          spinner.style.display = 'none';
        }, 300);
      }
    });
    
    container.appendChild(iframe);
  } else {
    console.error('Game Loader: Target container #game-iframe-container not found on page.');
  }
}
