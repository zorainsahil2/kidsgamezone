<?php
header("Content-Type: application/xml; charset=utf-8");

require_once __DIR__ . '/admin/includes/db.php';

try {
    $db = DB::get();
    
    // Fetch active games
    $stmt = $db->query('SELECT slug, id FROM games WHERE is_active = 1 ORDER BY id ASC');
    $games = $stmt->fetchAll();
    
    // Determine base URL dynamically
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost:8000';
    $baseUrl = $protocol . $host;
    
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    // 1. Homepage URL
    echo "    <url>\n";
    echo "        <loc>" . htmlspecialchars($baseUrl . "/") . "</loc>\n";
    echo "        <changefreq>daily</changefreq>\n";
    echo "        <priority>1.0</priority>\n";
    echo "    </url>\n";
    
    // 1.5. Privacy Policy URL
    echo "    <url>\n";
    echo "        <loc>" . htmlspecialchars($baseUrl . "/privacy.html") . "</loc>\n";
    echo "        <changefreq>monthly</changefreq>\n";
    echo "        <priority>0.5</priority>\n";
    echo "    </url>\n";
    
    // 2. Dynamic Game Player URLs
    foreach ($games as $game) {
        $gameUrl = $baseUrl . "/game.php?slug=" . $game['slug'] . "&id=" . $game['id'];
        echo "    <url>\n";
        echo "        <loc>" . htmlspecialchars($gameUrl) . "</loc>\n";
        echo "        <changefreq>daily</changefreq>\n";
        echo "        <priority>0.8</priority>\n";
        echo "    </url>\n";
    }
    
    echo '</urlset>';
} catch (Exception $e) {
    // Return empty sitemap with a comment in case of error
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<!-- Error generating sitemap: ' . htmlspecialchars($e->getMessage()) . ' -->' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
}
