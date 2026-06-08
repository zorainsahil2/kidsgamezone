<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['confirm']) || $data['confirm'] !== 'DELETE') {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid confirmation. Please type "DELETE".'
    ], 400);
}

try {
    $db = DB::get();
    
    // Count rows before truncate to return in response
    $count = (int)$db->query('SELECT COUNT(*) FROM analytics')->fetchColumn();
    
    // Truncate analytics table
    $db->exec('TRUNCATE TABLE analytics');
    
    jsonResponse([
        'success' => true,
        'deleted_rows' => $count
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
