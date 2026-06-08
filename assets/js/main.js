/**
 * KidsGameZone Homepage Interactive Manager
 */

// Category Emoji Map for fallback placeholders
const categoryEmojis = {
  platformer: '🏃',
  arcade: '🕹️',
  puzzle: '🧩',
  racing: '🚗',
  action: '⚔️',
  memory: '🃏',
  casual: '🎈',
  educational: '🎓',
  creative: '🎨',
  strategy: '🏰',
  cooking: '🍕',
  'dress-up': '👑',
  'virtual-pet': '🐶',
  sandbox: '🧱',
  rhythm: '🎵',
  idle: '⏳'
};

const categoryHexColors = {
  platformer: '#FF6B35',
  arcade: '#4ECDC4',
  puzzle: '#FFE66D',
  racing: '#EF4444',
  action: '#F43F5E',
  memory: '#3B82F6',
  casual: '#10B981',
  educational: '#8B5CF6',
  creative: '#EC4899',
  strategy: '#6B7280',
  cooking: '#F59E0B',
  'dress-up': '#D946EF',
  'virtual-pet': '#14B8A6',
  sandbox: '#84CC16',
  rhythm: '#6366F1',
  idle: '#06B6D4'
};

function generateSvgPlaceholder(title, category) {
  const initial = title ? title.charAt(0).toUpperCase() : '🎮';
  const bg = categoryHexColors[category] || '#FF6B35';
  const fg = category === 'puzzle' ? '#2D3748' : '#FFFFFF';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="55%" font-family="'Fredoka', 'Nunito', sans-serif" font-size="80" font-weight="bold" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const HomepageManager = {
  games: [],               // Store fetched games in memory
  activeCategory: 'all',   // Selected filter category tab
  searchQuery: '',         // Real-time search query input
  cardObserver: null,      // Intersection Observer for virtual grid loading

  /**
   * Fetch games list from database on startup
   */
  async init() {
    try {
      const response = await fetch('/api/games.php');
      if (!response.ok) {
        throw new Error('API fetch failed.');
      }
      this.games = await response.json();
      
      // Initialize Intersection Observer for lazy/virtual loading
      this.initCardObserver();
      
      // Read initial category filter from URL params if present
      const params = new URLSearchParams(window.location.search);
      const urlCat = params.get('cat');
      if (urlCat) {
        this.activeCategory = urlCat.toLowerCase().trim();
      }

      // Render components
      this.renderFeaturedRow();
      this.buildCategoryTabs();
      this.applyFilters();
      
      // Bind event listeners
      this.bindEvents();
    } catch (error) {
      console.error('HomepageManager: Init failed.', error);
      document.getElementById('gamesGrid').innerHTML = `
        <div class="no-games-box">
          <div class="no-games-box__icon">😢</div>
          <div class="no-games-box__text">Failed to connect to the games library. Please reload the page.</div>
        </div>
      `;
    }
  },

  /**
   * Set up Intersection Observer for virtual scrolling card rendering
   */
  initCardObserver() {
    this.cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wrapper = entry.target;
        const gameId = parseInt(wrapper.dataset.gameId);
        const game = this.games.find(g => g.id === gameId);
        
        if (entry.isIntersecting) {
          if (wrapper.innerHTML === '') {
            const card = this.createGameCard(game, false);
            wrapper.appendChild(card);
            
            // Set image source from data-src when it lazy loads
            const img = card.querySelector('img[data-src]');
            if (img) {
              img.src = img.dataset.src;
            }
          }
        } else {
          // Reclaim memory when off screen
          wrapper.innerHTML = '';
        }
      });
    }, { rootMargin: '300px 0px' });
  },

  /**
   * Bind event handlers for search input
   */
  bindEvents() {
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }
  },

  /**
   * Render featured games horizontally (is_featured = 1)
   */
  renderFeaturedRow() {
    const row = document.getElementById('featuredRow');
    if (!row) return;

    const featuredGames = this.games.filter(g => g.is_featured === 1);
    
    if (featuredGames.length === 0) {
      document.getElementById('featuredSection').style.display = 'none';
      return;
    }

    row.innerHTML = '';
    featuredGames.forEach(game => {
      const card = this.createGameCard(game, true);
      row.appendChild(card);
      // Featured games are above-the-fold, load immediately
      const img = card.querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
      }
    });
  },

  /**
   * Generate category filter buttons dynamically based on seeded games
   */
  buildCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    // Get unique categories present in games
    const categories = ['all', ...new Set(this.games.map(g => g.category))];
    
    tabsContainer.innerHTML = '';
    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `category-tab ${cat === this.activeCategory ? 'category-tab--active' : ''}`;
      tab.innerText = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
      tab.dataset.category = cat;

      tab.addEventListener('click', () => {
        // Toggle active states
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('category-tab--active'));
        tab.classList.add('category-tab--active');
        
        this.activeCategory = cat;
        this.applyFilters();
      });

      tabsContainer.appendChild(tab);
    });
  },

  /**
   * Apply AND logic combinations of Search and Category selectors
   */
  applyFilters() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;

    // Apply filters
    const filtered = this.games.filter(game => {
      const matchesCategory = this.activeCategory === 'all' || game.category === this.activeCategory;
      const matchesSearch = game.title.toLowerCase().includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });

    // Render filtered grid
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-games-box">
          <div class="no-games-box__icon">😢</div>
          <div class="no-games-box__text">No games found matching your search.</div>
        </div>
      `;
      return;
    }

    // Clean observers first
    if (this.cardObserver) {
      document.querySelectorAll('.game-card-wrapper').forEach(w => this.cardObserver.unobserve(w));
    }

    filtered.forEach(game => {
      const wrapper = document.createElement('div');
      wrapper.className = 'game-card-wrapper';
      wrapper.style.minHeight = '320px';
      wrapper.dataset.gameId = game.id;
      grid.appendChild(wrapper);
      
      if (this.cardObserver) {
        this.cardObserver.observe(wrapper);
      }
    });
  },

  /**
   * Create HTML structure for a Game Card element
   *
   * @param {object} game 
   * @param {boolean} isFeaturedCard 
   * @returns {HTMLElement}
   */
  createGameCard(game, isFeaturedCard) {
    const card = document.createElement('div');
    card.className = `game-card ${isFeaturedCard ? 'game-card--featured' : ''}`;
    
    // Set card redirection handler
    card.addEventListener('click', () => {
      window.location.href = `game.html?slug=${game.slug}&id=${game.id}`;
    });

    card.innerHTML = `
      <div class="game-card__media">
        <span class="game-card__badge badge-color--${game.category}">${game.category.replace('-', ' ')}</span>
        <img 
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          data-src="${game.thumbnail}" 
          alt="${game.title}" 
          class="game-card__image" 
          width="300"
          height="200"
          onerror="handleImageError(this, '${game.title.replace(/'/g, "\\'")}', '${game.category}')"
        >
      </div>
      <div class="game-card__info">
        <h4 class="game-card__title">${game.title}</h4>
        <button class="game-card__button">▶ Play Now</button>
      </div>
    `;

    return card;
  }
};

/**
 * Handle 404 thumbnail image load error by drawing category emoji placeholder
 *
 * @param {HTMLImageElement} imgElement 
 * @param {string} category 
 */
function handleImageError(imgElement, title, category) {
  imgElement.onerror = null;
  imgElement.src = generateSvgPlaceholder(title, category);
}

// Auto-boot index managers
document.addEventListener('DOMContentLoaded', () => HomepageManager.init());
