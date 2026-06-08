<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/admin/includes/db.php';

try {
    $db = DB::get();
    
    // Fetch active games
    $stmt = $db->query('SELECT slug FROM games WHERE is_active = 1 ORDER BY id ASC');
    $games = $stmt->fetchAll();
    
    $today = date('Y-m-d');
    $domain = "https://yourdomain.com";
    
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    // Homepage
    $xml .= "    <url>\n";
    $xml .= "        <loc>" . htmlspecialchars($domain . "/") . "</loc>\n";
    $xml .= "        <lastmod>" . $today . "</lastmod>\n";
    $xml .= "        <changefreq>daily</changefreq>\n";
    $xml .= "        <priority>1.0</priority>\n";
    $xml .= "    </url>\n";
    
    // Privacy Policy
    $xml .= "    <url>\n";
    $xml .= "        <loc>" . htmlspecialchars($domain . "/privacy.html") . "</loc>\n";
    $xml .= "        <lastmod>" . $today . "</lastmod>\n";
    $xml .= "        <changefreq>monthly</changefreq>\n";
    $xml .= "        <priority>0.5</priority>\n";
    $xml .= "    </url>\n";
    
    // Game pages
    foreach ($games as $game) {
        $xml .= "    <url>\n";
        $xml .= "        <loc>" . htmlspecialchars($domain . "/game.html?slug=" . $game['slug']) . "</loc>\n";
        $xml .= "        <lastmod>" . $today . "</lastmod>\n";
        $xml .= "        <changefreq>weekly</changefreq>\n";
        $xml .= "        <priority>0.8</priority>\n";
        $xml .= "    </url>\n";
    }
    
    $xml .= '</urlset>';
    
    $sitemapPath = __DIR__ . '/sitemap.xml';
    if (file_put_contents($sitemapPath, $xml) === false) {
        throw new Exception("Unable to write sitemap.xml to root folder");
    }
    
    $totalCount = count($games) + 1; // plus homepage
    echo "Sitemap generated with " . $totalCount . " URLs\n";
    
} catch (Exception $e) {
    echo "Error generating sitemap: " . $e->getMessage() . "\n";
}
