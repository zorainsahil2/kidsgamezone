<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../admin/includes/db.php';

try {
    $db = DB::get();
    $stmt = $db->query('SELECT slot_name, network, ad_code, skip_after_seconds FROM ad_slots WHERE is_active = 1');
    $slots = $stmt->fetchAll();
    
    // Cast variables
    foreach ($slots as &$slot) {
        $slot['skip_after_seconds'] = (int)$slot['skip_after_seconds'];
    }
    
    echo json_encode($slots, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    // Database connection failed fallback: return static ad slots
    $slots = [
        ["slot_name" => "pre_roll", "network" => "demo", "ad_code" => '<div id="demo-pre-roll" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #FF6B35; color: #FFFFFF; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 2.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; z-index: 999999;">🎮 Advertisement – Skip in 5s</div>', "skip_after_seconds" => 5],
        ["slot_name" => "header_banner", "network" => "demo", "ad_code" => '<div style="width: 728px; height: 90px; background-color: #4ECDC4; color: #FFFFFF; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; margin: 10px auto;">📢 Header Banner Ad – 728x90</div>', "skip_after_seconds" => 5],
        ["slot_name" => "sidebar_left", "network" => "demo", "ad_code" => '<div style="width: 160px; height: 600px; background-color: #A855F7; color: #FFFFFF; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 1.2rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; padding: 10px; box-sizing: border-box;">📢 Left Sidebar Ad – 160x600</div>', "skip_after_seconds" => 5],
        ["slot_name" => "sidebar_right", "network" => "demo", "ad_code" => '<div style="width: 300px; height: 250px; background-color: #FFE66D; color: #2D3748; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 1.3rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; padding: 15px; box-sizing: border-box; border: 3px dashed #2D3748;">📢 Right Sidebar Ad – 300x250</div>', "skip_after_seconds" => 5],
        ["slot_name" => "footer_banner", "network" => "demo", "ad_code" => '<div style="width: 728px; height: 90px; background-color: #EC4899; color: #FFFFFF; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; margin: 10px auto;">📢 Footer Banner Ad – 728x90</div>', "skip_after_seconds" => 5]
    ];
    echo json_encode($slots, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
