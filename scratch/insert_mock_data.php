<?php
require_once __DIR__ . '/../admin/includes/db.php';

try {
    $db = DB::get();
    
    // Insert some mock plays, impressions, clicks, skips
    // Game 1 views (platformer category)
    $db->exec("INSERT INTO analytics (event_type, game_id, created_at) VALUES ('game_view', 1, DATE_SUB(NOW(), INTERVAL 2 DAY))");
    $db->exec("INSERT INTO analytics (event_type, game_id, created_at) VALUES ('game_view', 1, DATE_SUB(NOW(), INTERVAL 1 DAY))");
    $db->exec("INSERT INTO analytics (event_type, game_id, created_at) VALUES ('game_view', 1, NOW())");
    
    // Game 2 views (arcade category)
    $db->exec("INSERT INTO analytics (event_type, game_id, created_at) VALUES ('game_view', 2, DATE_SUB(NOW(), INTERVAL 5 DAY))");
    $db->exec("INSERT INTO analytics (event_type, game_id, created_at) VALUES ('game_view', 2, NOW())");
    
    // Ad Pre-Roll impressions, clicks, skips
    $db->exec("INSERT INTO analytics (event_type, ad_slot, created_at) VALUES ('ad_impression', 'pre_roll', NOW())");
    $db->exec("INSERT INTO analytics (event_type, ad_slot, created_at) VALUES ('ad_click', 'pre_roll', NOW())");
    $db->exec("INSERT INTO analytics (event_type, ad_slot, created_at) VALUES ('ad_skip', 'pre_roll', NOW())");
    
    // Ad Header banner impressions, clicks
    $db->exec("INSERT INTO analytics (event_type, ad_slot, created_at) VALUES ('ad_impression', 'header_banner', NOW())");
    $db->exec("INSERT INTO analytics (event_type, ad_slot, created_at) VALUES ('ad_click', 'header_banner', NOW())");
    
    echo "Mock analytics data seeded successfully!\n";
} catch (PDOException $e) {
    echo "Error seeding: " . $e->getMessage() . "\n";
}
