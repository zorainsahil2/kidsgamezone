<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['action'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Missing action field'
    ], 400);
}

$action = $data['action'];
$allowedActions = ['activate_all', 'deactivate_all', 'feature_top4'];

if (!in_array($action, $allowedActions, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid action'
    ], 400);
}

try {
    $db = DB::get();
    $affected = 0;
    
    $db->beginTransaction();
    
    if ($action === 'activate_all') {
        $stmt = $db->prepare('UPDATE games SET is_active = 1');
        $stmt->execute();
        $affected = $stmt->rowCount();
    } elseif ($action === 'deactivate_all') {
        $stmt = $db->prepare('UPDATE games SET is_active = 0');
        $stmt->execute();
        $affected = $stmt->rowCount();
    } elseif ($action === 'feature_top4') {
        // Fetch first 4 games by ID ASC
        $fetchStmt = $db->query('SELECT id FROM games ORDER BY id ASC LIMIT 4');
        $ids = $fetchStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Reset all featured
        $resetStmt = $db->prepare('UPDATE games SET is_featured = 0');
        $resetStmt->execute();
        $affected += $resetStmt->rowCount();
        
        if (!empty($ids)) {
            $inQuery = implode(',', array_fill(0, count($ids), '?'));
            $updateStmt = $db->prepare("UPDATE games SET is_featured = 1 WHERE id IN ($inQuery)");
            $updateStmt->execute($ids);
            $affected += $updateStmt->rowCount();
        }
    }
    
    $db->commit();
    
    jsonResponse([
        'success' => true,
        'affected' => $affected
    ]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
