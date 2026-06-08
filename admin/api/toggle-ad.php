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
$is_active = isset($inputData['is_active']) ? (int)$inputData['is_active'] : 0;

$allowed_slots = ['pre_roll', 'header_banner', 'sidebar_left', 'sidebar_right', 'footer_banner'];

if (!in_array($slot_name, $allowed_slots)) {
    jsonResponse(['success' => false, 'message' => 'Invalid slot name.'], 400);
}

try {
    $db = DB::get();
    $stmt = $db->prepare('UPDATE ad_slots SET is_active = :is_active WHERE slot_name = :slot_name');
    $stmt->execute([
        ':is_active' => $is_active ? 1 : 0,
        ':slot_name' => $slot_name
    ]);
    
    jsonResponse([
        'success' => true
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
