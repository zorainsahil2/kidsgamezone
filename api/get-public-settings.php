<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300'); // 5-minute client caching

require_once __DIR__ . '/../admin/includes/db.php';

try {
    $db = DB::get();
    
    $stmt = $db->query('SELECT setting_key, setting_value FROM site_settings');
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $allowedKeys = ['site_name', 'site_tagline', 'seo_description', 'logo_path', 'maintenance_mode', 'google_analytics_id', 'seo_keywords', 'robots_meta'];
    
    $settings = [];
    foreach ($allowedKeys as $key) {
        $settings[$key] = isset($rows[$key]) ? $rows[$key] : '';
    }
    
    // Set sensible defaults if keys are absent
    if (empty($settings['site_name'])) $settings['site_name'] = 'KidsGameZone';
    if (empty($settings['site_tagline'])) $settings['site_tagline'] = 'Play 50 Free Kids Games Online!';
    if ($settings['maintenance_mode'] !== '1') $settings['maintenance_mode'] = '0';
    
    echo json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    // Database connection failed fallback: return static site settings
    $settings = [
        'site_name' => 'KidsGameZone',
        'site_tagline' => 'Play 50 Free Kids Games Online!',
        'seo_description' => 'Free browser games for kids aged 5-14. Play puzzle, racing, arcade and educational games instantly!',
        'logo_path' => '',
        'maintenance_mode' => '0',
        'google_analytics_id' => '',
        'seo_keywords' => 'free games, kids games, online games',
        'robots_meta' => 'index, follow'
    ];
    echo json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
