<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

try {
    $db = DB::get();
    $stmt = $db->query('SELECT setting_key, setting_value FROM site_settings');
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $keys = ['site_name', 'site_tagline', 'seo_description', 'maintenance_mode', 'google_analytics_id', 'logo_path', 'seo_keywords', 'robots_meta', 'global_custom_scripts'];
    $settings = [];
    foreach ($keys as $key) {
        $settings[$key] = isset($rows[$key]) ? $rows[$key] : '';
    }
    
    jsonResponse($settings);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
