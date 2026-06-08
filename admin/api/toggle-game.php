<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['game_id']) || !isset($data['field'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Missing required fields'
    ], 400);
}

$gameId = (int)$data['game_id'];
$field = $data['field'];

// Validate allowed fields strictly to prevent SQL injection
$allowedFields = ['is_active', 'is_featured', 'play_count'];
if (!in_array($field, $allowedFields, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid field'
    ], 400);
}

try {
    $db = DB::get();
    
    // Check if game exists
    $checkStmt = $db->prepare('SELECT id FROM games WHERE id = :id');
    $checkStmt->execute([':id' => $gameId]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Game not found'
        ], 404);
    }

    if ($field === 'play_count') {
        $stmt = $db->prepare('UPDATE games SET play_count = play_count + 1 WHERE id = :id');
        $stmt->execute([':id' => $gameId]);
    } else {
        $value = isset($data['value']) ? (int)$data['value'] : 0;
        if ($value !== 0 && $value !== 1) {
            jsonResponse([
                'success' => false,
                'message' => 'Value must be 0 or 1'
            ], 400);
        }
        
        $stmt = $db->prepare("UPDATE games SET $field = :value WHERE id = :id");
        $stmt->execute([':value' => $value, ':id' => $gameId]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Game updated'
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
