<?php
require_once __DIR__ . '/../admin/includes/db.php';

try {
    $db = DB::get();
    
    // 1. Check & add columns to games table
    $gamesTableCheck = $db->query("SHOW COLUMNS FROM games");
    $columns = $gamesTableCheck->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('seo_keywords', $columns)) {
        $db->exec("ALTER TABLE games ADD COLUMN seo_keywords VARCHAR(255) NULL AFTER seo_description");
        echo "Successfully added 'seo_keywords' column to 'games' table.\n";
    } else {
        echo "'seo_keywords' column already exists in 'games' table.\n";
    }
    
    if (!in_array('robots_meta', $columns)) {
        $db->exec("ALTER TABLE games ADD COLUMN robots_meta VARCHAR(50) DEFAULT 'default' AFTER seo_keywords");
        echo "Successfully added 'robots_meta' column to 'games' table.\n";
    } else {
        echo "'robots_meta' column already exists in 'games' table.\n";
    }
    
    // 2. Insert site settings keys if not exists
    $settingsCheck = $db->prepare("SELECT COUNT(*) FROM site_settings WHERE setting_key = :key");
    
    // Insert seo_keywords
    $settingsCheck->execute([':key' => 'seo_keywords']);
    if ($settingsCheck->fetchColumn() == 0) {
        $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:key, :value)")
           ->execute([
               ':key' => 'seo_keywords',
               ':value' => 'kids games, free online games, kids arcade, browser games'
           ]);
        echo "Inserted default 'seo_keywords' in site_settings.\n";
    } else {
        echo "'seo_keywords' already exists in site_settings.\n";
    }
    
    // Insert robots_meta
    $settingsCheck->execute([':key' => 'robots_meta']);
    if ($settingsCheck->fetchColumn() == 0) {
        $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:key, :value)")
           ->execute([
               ':key' => 'robots_meta',
               ':value' => 'index, follow'
           ]);
        echo "Inserted default 'robots_meta' in site_settings.\n";
    } else {
        echo "'robots_meta' already exists in site_settings.\n";
    }
    
    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Database migration failed: " . $e->getMessage() . "\n";
}
