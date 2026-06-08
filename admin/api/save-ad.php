<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse inputs
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

if (!is_array($inputData)) {
    $inputData = $_POST;
}

$slot_name = isset($inputData['slot_name']) ? trim($inputData['slot_name']) : '';
$network = isset($inputData['network']) ? trim($inputData['network']) : '';
// Allow raw HTML/JS code (do NOT sanitize)
$ad_code = isset($inputData['ad_code']) ? $inputData['ad_code'] : null;
$is_active = isset($inputData['is_active']) ? (int)$inputData['is_active'] : 1;
$skip_after_seconds = isset($inputData['skip_after_seconds']) ? (int)$inputData['skip_after_seconds'] : 5;

// Validation lists
$allowed_slots = ['pre_roll', 'header_banner', 'sidebar_left', 'sidebar_right', 'footer_banner'];
$allowed_networks = ['adsense', 'adsterra', 'medianet', 'propellerads', 'direct', 'affiliate', 'demo'];

if (!in_array($slot_name, $allowed_slots)) {
    jsonResponse(['success' => false, 'message' => 'Invalid slot name.'], 400);
}

if (!in_array($network, $allowed_networks)) {
    jsonResponse(['success' => false, 'message' => 'Invalid ad network.'], 400);
}

try {
    $db = DB::get();
    $stmt = $db->prepare('UPDATE ad_slots SET 
        network = :network, 
        ad_code = :ad_code, 
        is_active = :is_active, 
        skip_after_seconds = :skip_after_seconds 
        WHERE slot_name = :slot_name');
        
    $stmt->execute([
        ':network' => $network,
        ':ad_code' => $ad_code,
        ':is_active' => $is_active ? 1 : 0,
        ':skip_after_seconds' => $skip_after_seconds,
        ':slot_name' => $slot_name
    ]);
    
    jsonResponse([
        'success' => true,
        'message' => 'Ad slot updated successfully'
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
