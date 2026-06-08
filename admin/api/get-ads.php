<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

try {
    $db = DB::get();
    $stmt = $db->query('SELECT id, slot_name, network, ad_code, is_active, skip_after_seconds FROM ad_slots ORDER BY id ASC');
    $slots = $stmt->fetchAll();
    
    // Cast variables correctly (especially integers/booleans)
    foreach ($slots as &$slot) {
        $slot['id'] = (int)$slot['id'];
        $slot['is_active'] = (int)$slot['is_active'];
        $slot['skip_after_seconds'] = (int)$slot['skip_after_seconds'];
    }
    
    jsonResponse($slots);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
