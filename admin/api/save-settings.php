<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !is_array($data)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid request payload'
    ], 400);
}

// Whitelist of allowed keys
$allowedKeys = ['site_name', 'site_tagline', 'seo_description', 'maintenance_mode', 'google_analytics_id', 'seo_keywords', 'robots_meta', 'global_custom_scripts'];

// Check for any unauthorized key in request
foreach (array_keys($data) as $key) {
    if (!in_array($key, $allowedKeys, true)) {
        jsonResponse([
            'success' => false,
            'message' => 'Invalid key: ' . $key
        ], 400);
    }
}

try {
    $db = DB::get();
    
    // Prepare upsert statement (compatible with MySQL and PostgreSQL/Supabase)
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'pgsql') {
        $stmt = $db->prepare('
            INSERT INTO site_settings (setting_key, setting_value) 
            VALUES (:key, :value) 
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
        ');
    } else {
        $stmt = $db->prepare('
            INSERT INTO site_settings (setting_key, setting_value) 
            VALUES (:key, :value) 
            ON DUPLICATE KEY UPDATE setting_value = :value
        ');
    }
    
    foreach ($data as $key => $val) {
        if ($key === 'global_custom_scripts') {
            $cleanVal = trim((string)$val);
        } else {
            $cleanVal = sanitizeInput((string)$val);
        }
        $stmt->execute([
            ':key' => $key,
            ':value' => $cleanVal
        ]);
    }
    
    jsonResponse([
        'success' => true,
        'message' => 'Settings saved successfully'
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
