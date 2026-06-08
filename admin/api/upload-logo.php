<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

if (!isset($_FILES['logo'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Missing logo file field'
    ], 400);
}

$file = $_FILES['logo'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse([
        'success' => false,
        'message' => 'File upload failed with error code ' . $file['error']
    ], 400);
}

// Validate file size (max 1MB)
if ($file['size'] > 1 * 1024 * 1024) {
    jsonResponse([
        'success' => false,
        'message' => 'File size exceeds maximum limit of 1MB'
    ], 400);
}

// Validate image mime type
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedMimes, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, PNG, GIF, WEBP, and SVG images are allowed.'
    ], 400);
}

try {
    $db = DB::get();
    
    $targetDir = __DIR__ . '/../../assets/images/ui/';
    
    // Create directory if missing
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    // Save as logo.png (overwrites existing)
    $targetPath = $targetDir . 'logo.png';
    $dbPath = 'assets/images/ui/logo.png';
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Update database site_settings row (compatible with MySQL and PostgreSQL/Supabase)
        $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'pgsql') {
            $stmt = $db->prepare("
                INSERT INTO site_settings (setting_key, setting_value) 
                VALUES ('logo_path', :value) 
                ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
            ");
        } else {
            $stmt = $db->prepare("
                INSERT INTO site_settings (setting_key, setting_value) 
                VALUES ('logo_path', :value) 
                ON DUPLICATE KEY UPDATE setting_value = :value
            ");
        }
        $stmt->execute([':value' => $dbPath]);
        
        jsonResponse([
            'success' => true,
            'logo_path' => $dbPath
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Failed to save uploaded file'
        ], 500);
    }
    
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
