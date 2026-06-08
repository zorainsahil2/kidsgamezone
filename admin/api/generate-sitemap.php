<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

try {
    $db = DB::get();
    
    // Fetch active games
    $stmt = $db->query('SELECT slug, id FROM games WHERE is_active = 1 ORDER BY id ASC');
    $games = $stmt->fetchAll();
    
    // Determine dynamic base URL based on requests
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost:8000';
    $baseUrl = $protocol . $host;
    
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    // 1. Homepage URL
    $xml .= "    <url>\n";
    $xml .= "        <loc>" . htmlspecialchars($baseUrl . "/") . "</loc>\n";
    $xml .= "        <changefreq>daily</changefreq>\n";
    $xml .= "        <priority>1.0</priority>\n";
    $xml .= "    </url>\n";
    
    // 1.5. Privacy Policy URL
    $xml .= "    <url>\n";
    $xml .= "        <loc>" . htmlspecialchars($baseUrl . "/privacy.html") . "</loc>\n";
    $xml .= "        <changefreq>monthly</changefreq>\n";
    $xml .= "        <priority>0.5</priority>\n";
    $xml .= "    </url>\n";
    
    // 2. Dynamic Game Player URLs
    foreach ($games as $game) {
        $gameUrl = $baseUrl . "/game.html?slug=" . $game['slug'] . "&amp;id=" . $game['id'];
        $xml .= "    <url>\n";
        $xml .= "        <loc>" . htmlspecialchars($gameUrl) . "</loc>\n";
        $xml .= "        <changefreq>daily</changefreq>\n";
        $xml .= "        <priority>0.8</priority>\n";
        $xml .= "    </url>\n";
    }
    
    $xml .= '</urlset>';
    
    // Write physical file to the root directory
    $sitemapPath = __DIR__ . '/../../sitemap.xml';
    if (file_put_contents($sitemapPath, $xml) === false) {
        throw new Exception("Unable to write sitemap.xml to root folder");
    }
    
    jsonResponse([
        'success' => true,
        'message' => 'Sitemap physical file generated successfully'
    ]);
} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
}
