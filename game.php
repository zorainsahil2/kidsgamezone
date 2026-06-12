<?php
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/admin/includes/db.php';
require_once __DIR__ . '/admin/includes/functions.php';

try {
    $db = DB::get();
    
    $gameId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

    $game = null;
    if ($gameId > 0) {
        $stmt = $db->prepare('SELECT * FROM games WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $gameId]);
        $game = $stmt->fetch();
    } elseif ($slug !== '') {
        $stmt = $db->prepare('SELECT * FROM games WHERE slug = :slug LIMIT 1');
        $stmt->execute([':slug' => $slug]);
        $game = $stmt->fetch();
    }

    if (!$game) {
        header('Location: index.php');
        exit;
    }
    
    // Load public site settings
    $stmtSettings = $db->query('SELECT setting_key, setting_value FROM site_settings');
    $settingsRows = $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR);
    $settings = [
        'site_name' => $settingsRows['site_name'] ?? 'KidsGameZone',
        'site_tagline' => $settingsRows['site_tagline'] ?? 'Play 50 Free Kids Games Online!',
        'seo_description' => $settingsRows['seo_description'] ?? 'Free browser games for kids.',
        'seo_keywords' => $settingsRows['seo_keywords'] ?? 'kids games, free games',
        'robots_meta' => $settingsRows['robots_meta'] ?? 'index, follow',
        'logo_path' => $settingsRows['logo_path'] ?? '',
        'google_analytics_id' => $settingsRows['google_analytics_id'] ?? '',
        'global_custom_scripts' => $settingsRows['global_custom_scripts'] ?? '',
        'maintenance_mode' => $settingsRows['maintenance_mode'] ?? '0'
    ];
    
    // Maintenance Guard
    if ($settings['maintenance_mode'] === '1') {
        header('Location: maintenance.html');
        exit;
    }
    
    // Load active ad slots
    $stmtAds = $db->query('SELECT slot_name, network, ad_code, skip_after_seconds FROM ad_slots WHERE is_active = 1');
    $slots = [];
    while ($row = $stmtAds->fetch()) {
        $slots[$row['slot_name']] = $row;
    }
    
    // Determine dynamic SEO parameters
    $resolvedTitle = (!empty($game['seo_title'])) ? $game['seo_title'] : "Playing " . $game['title'] . " — " . $settings['site_name'];
    $resolvedDesc = (!empty($game['seo_description'])) ? $game['seo_description'] : $settings['seo_description'];
    $resolvedKeywords = (!empty($game['seo_keywords'])) ? $game['seo_keywords'] : $settings['seo_keywords'];
    $resolvedRobots = ($game['robots_meta'] && $game['robots_meta'] !== 'default') ? $game['robots_meta'] : $settings['robots_meta'];
} catch (Exception $e) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google Analytics (gtag.js) -->
    <?php if (!empty($settings['google_analytics_id'])): ?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo htmlspecialchars($settings['google_analytics_id']); ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?php echo htmlspecialchars($settings['google_analytics_id']); ?>');
    </script>
    <?php endif; ?>
    
    <title><?php echo htmlspecialchars($resolvedTitle); ?></title>
    
    <!-- SEO Meta Tags -->
    <meta name="title" content="<?php echo htmlspecialchars($resolvedTitle); ?>">
    <meta name="description" content="<?php echo htmlspecialchars($resolvedDesc); ?>">
    <meta name="keywords" content="<?php echo htmlspecialchars($resolvedKeywords); ?>">
    <meta name="robots" content="<?php echo htmlspecialchars($resolvedRobots); ?>">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/game.php?slug=<?php echo $game['slug']; ?>&id=<?php echo $game['id']; ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($resolvedTitle); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($resolvedDesc); ?>">
    <?php if (!empty($game['thumbnail'])): ?>
    <meta property="og:image" content="<?php echo (defined('SITE_URL') ? SITE_URL : '') . '/' . $game['thumbnail']; ?>">
    <?php elseif (!empty($settings['logo_path']) && !str_starts_with($settings['logo_path'], 'data:')): ?>
    <meta property="og:image" content="<?php echo (defined('SITE_URL') ? SITE_URL : '') . '/' . $settings['logo_path']; ?>">
    <?php elseif (!empty($settings['logo_path'])): ?>
    <meta property="og:image" content="<?php echo $settings['logo_path']; ?>">
    <?php endif; ?>

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/game.php?slug=<?php echo $game['slug']; ?>&id=<?php echo $game['id']; ?>">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($resolvedTitle); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($resolvedDesc); ?>">
    <?php if (!empty($game['thumbnail'])): ?>
    <meta name="twitter:image" content="<?php echo (defined('SITE_URL') ? SITE_URL : '') . '/' . $game['thumbnail']; ?>">
    <?php endif; ?>

    <!-- Canonical -->
    <link rel="canonical" href="<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/game.php?slug=<?php echo $game['slug']; ?>&id=<?php echo $game['id']; ?>">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="assets/css/game-page.css">
    
    <!-- Ad and Core Scripts -->
    <script>
        window.adSlotsConfig = <?php echo json_encode($slots, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
    </script>
    <script src="assets/js/ads.js" defer></script>
    <script src="assets/js/game-loader.js" defer></script>
</head>
<body>

    <!-- Header / Brand Navigation -->
    <header class="portal-header">
        <a href="index.php" class="portal-header__logo">
            <?php
            if (!empty($settings['logo_path'])) {
                echo '<img src="' . $settings['logo_path'] . '" alt="' . htmlspecialchars($settings['site_name']) . '" style="max-height: 50px; max-width: 200px; object-fit: contain;">';
            } else {
                echo '🎮 ' . htmlspecialchars($settings['site_name']);
            }
            ?>
        </a>
        <a href="index.php" class="portal-header__back-btn">◀ Back to Home</a>
    </header>

    <!-- Top Leaderboard Ad Slot -->
    <div id="header_banner" class="ad-slot ad-slot--header"></div>

    <!-- Breadcrumb Indicator -->
    <div class="breadcrumb-container">
        <ul class="breadcrumb">
            <li><a href="index.php" class="breadcrumb__link">Home</a></li>
            <li class="breadcrumb__separator">></li>
            <li><a href="index.php?cat=<?php echo $game['category']; ?>" id="breadcrumbCategoryLink" class="breadcrumb__link"><?php echo htmlspecialchars(ucwords(str_replace('-', ' ', $game['category']))); ?></a></li>
            <li class="breadcrumb__separator">></li>
            <li id="breadcrumbGameTitle" class="breadcrumb__current"><?php echo htmlspecialchars($game['title']); ?></li>
        </ul>
    </div>

    <!-- Main Player Workspace Layout -->
    <div class="portal-layout">
        
        <!-- Left Sidebar Ad -->
        <aside class="portal-sidebar">
            <div id="sidebar_left" class="ad-slot ad-slot--sidebar"></div>
        </aside>

        <!-- Main Frame Body -->
        <main class="portal-main">
            
            <!-- Game Title Headers -->
            <div class="game-header">
                <h1 id="gameTitleLabel" class="game-header__title"><?php echo htmlspecialchars($game['title']); ?></h1>
                <?php
                $categoryHexColors = [
                    'platformer' => 'badge-color--platformer',
                    'arcade' => 'badge-color--arcade',
                    'puzzle' => 'badge-color--puzzle',
                    'racing' => 'badge-color--racing',
                    'action' => 'badge-color--action',
                    'memory' => 'badge-color--memory',
                    'casual' => 'badge-color--casual',
                    'educational' => 'badge-color--educational',
                    'creative' => 'badge-color--creative',
                    'strategy' => 'badge-color--strategy',
                    'cooking' => 'badge-color--cooking',
                    'dress-up' => 'badge-color--dress-up',
                    'virtual-pet' => 'badge-color--virtual-pet',
                    'sandbox' => 'badge-color--sandbox',
                    'rhythm' => 'badge-color--rhythm',
                    'idle' => 'badge-color--idle'
                ];
                $badgeClass = $categoryHexColors[$game['category']] ?? 'badge-color--arcade';
                ?>
                <span id="gameCategoryBadge" class="game-header__category <?php echo $badgeClass; ?>"><?php echo htmlspecialchars(str_replace('-', ' ', $game['category'])); ?></span>
            </div>

            <!-- Game Player Iframe Box -->
            <div class="game-frame-wrapper">
                <!-- Loading State Spinner -->
                <div id="iframe-spinner" class="game-frame-wrapper__loader">
                    <div class="game-frame-wrapper__spinner"></div>
                    <p>Loading Game Canvas...</p>
                </div>
                
                <!-- Iframe mount target -->
                <div id="game-iframe-container">
                    <!-- Dynamic Iframe loaded after Pre-roll skip -->
                </div>
            </div>

            <!-- Related Category Games Section -->
            <section class="related-section">
                <h2 class="section-heading">⭐ Related Games</h2>
                <div id="relatedRow" class="related-row">
                    <!-- Injected dynamically via JS query -->
                </div>
            </section>
            
        </main>

        <!-- Right Sidebar Ad -->
        <aside class="portal-sidebar">
            <div id="sidebar_right" class="ad-slot ad-slot--sidebar"></div>
        </aside>

    </div>

    <!-- Bottom Leaderboard Ad Slot -->
    <div id="footer_banner" class="ad-slot ad-slot--footer"></div>

    <!-- Footer Agreement Links -->
    <footer class="portal-footer">
        <div class="portal-footer__copyright">
            © 2026 <?php echo htmlspecialchars($settings['site_name']); ?> — Free Games for Kids
        </div>
        <div class="portal-footer__links">
            <a href="privacy.html" class="portal-footer__link">Privacy Policy</a>
            <span style="color: var(--text-light);">|</span>
            <a href="privacy.html" class="portal-footer__link">COPPA Compliance Notice</a>
        </div>
    </footer>

    <!-- Initialization and Client-Side Routing Controller -->
    <script>
        const categoryColorMap = {
            platformer: 'badge-color--platformer',
            arcade: 'badge-color--arcade',
            puzzle: 'badge-color--puzzle',
            racing: 'badge-color--racing',
            action: 'badge-color--action',
            memory: 'badge-color--memory',
            casual: 'badge-color--casual',
            educational: 'badge-color--educational',
            creative: 'badge-color--creative',
            strategy: 'badge-color--strategy',
            cooking: 'badge-color--cooking',
            'dress-up': 'badge-color--dress-up',
            'virtual-pet': 'badge-color--virtual-pet',
            sandbox: 'badge-color--sandbox',
            rhythm: 'badge-color--rhythm',
            idle: 'badge-color--idle'
        };

        document.addEventListener('DOMContentLoaded', function() {
            // Fetch game details from DB and initialize player iframe
            const gamePath = <?php echo json_encode('/' . $game['game_path']); ?>;
            const gameId = <?php echo json_encode((int)$game['id']); ?>;
            const gameSlug = <?php echo json_encode($game['slug']); ?>;
            const gameCategory = <?php echo json_encode($game['category']); ?>;

            // 1. Start game loader (shows pre-roll overlay, then mounts iframe)
            if (typeof loadGame === 'function') {
                loadGame(gameSlug, gameId, gamePath);
            } else {
                setTimeout(() => {
                    if (typeof loadGame === 'function') {
                        loadGame(gameSlug, gameId, gamePath);
                    }
                }, 500);
            }

            // 2. Fetch full library list dynamically for related games suggest row
            fetch('/api/games.php')
                .then(res => res.json())
                .then(games => {
                    renderRelatedGames(games, { id: gameId, category: gameCategory });
                })
                .catch(err => console.error(err));

            // 3. Bind load checker and MutationObserver to hide spinner loader once iframe is successfully injected and loaded
            const iframeContainer = document.getElementById('game-iframe-container');
            const handleIframeLoad = () => {
                const spinner = document.getElementById('iframe-spinner');
                if (spinner) {
                    spinner.style.transition = 'opacity 0.3s ease';
                    spinner.style.opacity = '0';
                    setTimeout(() => {
                        spinner.style.display = 'none';
                    }, 300);
                }
            };

            // Check if iframe is already present (sync load fallback)
            const existingIframe = iframeContainer.querySelector('iframe');
            if (existingIframe) {
                if (existingIframe.contentDocument && existingIframe.contentDocument.readyState === 'complete') {
                    handleIframeLoad();
                } else {
                    existingIframe.addEventListener('load', handleIframeLoad);
                }
            }

            const observer = new MutationObserver((mutations) => {
                const iframe = iframeContainer.querySelector('iframe');
                if (iframe) {
                    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                        handleIframeLoad();
                    } else {
                        iframe.addEventListener('load', handleIframeLoad);
                    }
                    observer.disconnect();
                }
            });
            observer.observe(iframeContainer, { childList: true });
        });

        // Query related same-category games
        function renderRelatedGames(allGames, currentGame) {
            const row = document.getElementById('relatedRow');
            if (!row) return;

            const related = allGames
                .filter(g => g.category === currentGame.category && g.id !== currentGame.id)
                .slice(0, 4);

            if (related.length === 0) {
                const fallbacks = allGames.filter(g => g.id !== currentGame.id).slice(0, 4);
                related.push(...fallbacks);
            }

            row.innerHTML = '';
            related.forEach(game => {
                const card = createRelatedCard(game);
                row.appendChild(card);
            });
        }

        // Render card node
        function createRelatedCard(game) {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.addEventListener('click', () => {
                window.location.href = `game.php?slug=${game.slug}&id=${game.id}`;
            });

            card.innerHTML = `
                <div class="game-card__media">
                    <span class="game-card__badge ${categoryColorMap[game.category] || 'badge-color--arcade'}">${game.category.replace('-', ' ')}</span>
                    <img 
                        src="${game.thumbnail}" 
                        alt="${game.title}" 
                        class="game-card__image" 
                        loading="lazy" 
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

        const categoryHexColors = {
            platformer: '#FF6B35', arcade: '#4ECDC4', puzzle: '#FFE66D', racing: '#EF4444',
            action: '#F43F5E', memory: '#3B82F6', casual: '#10B981', educational: '#8B5CF6',
            creative: '#EC4899', strategy: '#6B7280', cooking: '#F59E0B', 'dress-up': '#D946EF',
            'virtual-pet': '#14B8A6', sandbox: '#84CC16', rhythm: '#6366F1', idle: '#06B6D4'
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

        function handleImageError(imgElement, title, category) {
            imgElement.onerror = null;
            imgElement.src = generateSvgPlaceholder(title, category);
        }
    </script>
    
    <!-- Injected Global Integration Scripts -->
    <?php if (!empty($settings['global_custom_scripts'])): ?>
        <?php echo $settings['global_custom_scripts']; ?>
    <?php endif; ?>
</body>
</html>
