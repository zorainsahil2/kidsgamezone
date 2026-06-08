<?php
require_once __DIR__ . '/../admin/includes/db.php';

try {
    $db = DB::get();
    
    // Add seo_title and seo_description columns to games table
    $db->exec("ALTER TABLE games ADD COLUMN seo_title VARCHAR(255) NULL AFTER title");
    $db->exec("ALTER TABLE games ADD COLUMN seo_description TEXT NULL AFTER category");
    
    echo "Successfully added seo_title and seo_description columns to the 'games' table!\n";
} catch (PDOException $e) {
    echo "Database migration failed: " . $e->getMessage() . "\n";
}
