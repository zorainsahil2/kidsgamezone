<?php
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/admin/includes/db.php';
require_once __DIR__ . '/admin/includes/functions.php';

try {
    $db = DB::get();
    
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
} catch (Exception $e) {
    // Fallback settings if DB is down
    $settings = [
        'site_name' => 'KidsGameZone',
        'site_tagline' => 'Play 50 Free Kids Games Online!',
        'seo_description' => 'Free browser games for kids aged 5-14.',
        'seo_keywords' => 'kids games, free online games, browser games',
        'robots_meta' => 'index, follow',
        'logo_path' => '',
        'google_analytics_id' => '',
        'global_custom_scripts' => ''
    ];
    $slots = [];
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
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="assets/images/ui/favicon.png">
    <link rel="apple-touch-icon" href="assets/images/ui/apple-touch-icon.png">

    <!-- PWA Manifest & Theme Color -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#FF6B35">

    <!-- SEO Meta Tags -->
    <title><?php echo htmlspecialchars($settings['site_name'] . ' — ' . $settings['site_tagline']); ?></title>
    <meta name="title" content="<?php echo htmlspecialchars($settings['site_name'] . ' — ' . $settings['site_tagline']); ?>">
    <meta name="description" content="<?php echo htmlspecialchars($settings['seo_description']); ?>">
    <meta name="keywords" content="<?php echo htmlspecialchars($settings['seo_keywords']); ?>">
    <meta name="robots" content="<?php echo htmlspecialchars($settings['robots_meta']); ?>">
    <meta name="author" content="<?php echo htmlspecialchars($settings['site_name']); ?>">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/">
    <meta property="og:title" content="<?php echo htmlspecialchars($settings['site_name'] . ' — ' . $settings['site_tagline']); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($settings['seo_description']); ?>">
    <?php if (!empty($settings['logo_path']) && !str_starts_with($settings['logo_path'], 'data:')): ?>
    <meta property="og:image" content="<?php echo (defined('SITE_URL') ? SITE_URL : '') . '/' . $settings['logo_path']; ?>">
    <?php elseif (!empty($settings['logo_path'])): ?>
    <meta property="og:image" content="<?php echo $settings['logo_path']; ?>">
    <?php endif; ?>
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($settings['site_name'] . ' — ' . $settings['site_tagline']); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($settings['seo_description']); ?>">
    
    <!-- Canonical -->
    <link rel="canonical" href="<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/">

    <!-- Bubbly & Friendly Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
    
    <!-- Critical CSS Inline -->
    <style>
        :root {
          --primary: #FF6B35;
          --secondary: #4ECDC4;
          --accent: #FFE66D;
          --purple: #A855F7;
          --bg: #FFF9F0;
          --card-bg: #FFFFFF;
          --text: #2D3748;
          --text-light: #718096;
          --border-style: 3px solid #2D3748;
          --border-radius: 16px;
          --shadow: 0 8px 0px #2D3748;
          --transition: all 0.2s ease;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Nunito', sans-serif;
          background-color: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .portal-layout {
          display: flex;
          flex-direction: column;
          padding: 30px 20px;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .portal-layout {
            flex-direction: row;
            padding: 30px 40px;
          }
        }
        .portal-main {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
    </style>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="assets/css/main.css">
    
    <!-- Ad and Core Scripts -->
    <script>
        window.adSlotsConfig = <?php echo json_encode($slots, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
    </script>
    <script src="assets/js/ads.js" defer></script>
    <script src="assets/js/main.js" defer></script>
</head>
<body>

    <!-- Portal Top Bar / Header -->
    <header class="portal-header">
        <div class="portal-header__brand">
            <a href="index.php" class="portal-header__logo">
                <?php
                if (!empty($settings['logo_path'])) {
                    echo '<img src="' . $settings['logo_path'] . '" alt="' . htmlspecialchars($settings['site_name']) . '" style="max-height: 50px; max-width: 200px; object-fit: contain;">';
                } else {
                    echo '🎮 ' . htmlspecialchars($settings['site_name']);
                }
                ?>
            </a>
            <div class="portal-header__tagline"><?php echo htmlspecialchars($settings['site_tagline']); ?></div>
        </div>
        
        <!-- Interactive Live Search -->
        <div class="search-container">
            <input type="text" id="gameSearch" class="search-input" placeholder="🔍 Search games..." aria-label="Search games">
        </div>
    </header>

    <!-- Top Leaderboard Ad Slot -->
    <div id="header_banner" class="ad-slot ad-slot--header">
        <?php
        if (isset($slots['header_banner']) && $slots['header_banner']['is_active']) {
            echo $slots['header_banner']['ad_code'];
        }
        ?>
    </div>

    <!-- Main Workspace Layout -->
    <div class="portal-layout">
        
        <!-- Left Sidebar Ad (Desktop Only) -->
        <aside class="portal-sidebar">
            <div id="sidebar_left" class="ad-slot ad-slot--sidebar">
                <?php
                if (isset($slots['sidebar_left']) && $slots['sidebar_left']['is_active']) {
                    echo $slots['sidebar_left']['ad_code'];
                }
                ?>
            </div>
        </aside>

        <!-- Main Portal Body -->
        <main class="portal-main">
            
            <!-- Category Filtering Tabs -->
            <section class="category-section">
                <div id="categoryTabs" class="category-filters">
                    <!-- Loaded dynamically via AJAX -->
                </div>
            </section>

            <!-- Featured Games Row -->
            <section id="featuredSection" class="featured-section">
                <h2 class="section-heading">⭐ Featured Games</h2>
                <div id="featuredRow" class="featured-row">
                    <!-- Loaded dynamically via AJAX -->
                </div>
            </section>

            <!-- All Games Grid Section -->
            <section class="games-grid-container">
                <h2 class="section-heading">🎮 All Games</h2>
                <div id="gamesGrid" class="games-grid">
                    <!-- Loaded dynamically via AJAX -->
                </div>
            </section>
            
        </main>

        <!-- Right Sidebar Ad (Desktop Only) -->
        <aside class="portal-sidebar">
            <div id="sidebar_right" class="ad-slot ad-slot--sidebar">
                <?php
                if (isset($slots['sidebar_right']) && $slots['sidebar_right']['is_active']) {
                    echo $slots['sidebar_right']['ad_code'];
                }
                ?>
            </div>
        </aside>

    </div>

    <!-- Bottom Leaderboard Ad Slot -->
    <div id="footer_banner" class="ad-slot ad-slot--footer">
        <?php
        if (isset($slots['footer_banner']) && $slots['footer_banner']['is_active']) {
            echo $slots['footer_banner']['ad_code'];
        }
        ?>
    </div>

    <!-- Portal Footer -->
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

    <!-- Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('Service Worker registered!', reg))
                    .catch(err => console.error('Service Worker registration failed:', err));
            });
        }
    </script>

    <!-- Structured Data - JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "<?php echo htmlspecialchars($settings['site_name']); ?>",
      "url": "<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>",
      "description": "<?php echo htmlspecialchars($settings['seo_description']); ?>",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "<?php echo (defined('SITE_URL') ? SITE_URL : ''); ?>/?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    
    <!-- Injected Global Integration Scripts -->
    <?php if (!empty($settings['global_custom_scripts'])): ?>
        <?php echo $settings['global_custom_scripts']; ?>
    <?php endif; ?>
</body>
</html>
