<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse form fields
if (!isset($_POST['game_id']) || !isset($_FILES['thumbnail'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Missing required fields'
    ], 400);
}

$gameId = (int)$_POST['game_id'];
$file = $_FILES['thumbnail'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse([
        'success' => false,
        'message' => 'File upload failed with error code ' . $file['error']
    ], 400);
}

// Validate file size (max 2MB)
if ($file['size'] > 2 * 1024 * 1024) {
    jsonResponse([
        'success' => false,
        'message' => 'File size exceeds maximum limit of 2MB'
    ], 400);
}

// Validate image mime type
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedMimes, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed.'
    ], 400);
}

try {
    $db = DB::get();
    
    // Fetch the slug of the game
    $stmt = $db->prepare('SELECT slug FROM games WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $gameId]);
    $game = $stmt->fetch();
    
    if (!$game) {
        jsonResponse([
            'success' => false,
            'message' => 'Game not found'
        ], 404);
    }
    
    $slug = $game['slug'];
    $targetDir = __DIR__ . '/../../assets/images/thumbnails/';
    
    // Create directory if missing
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    // Target filepath
    $fileName = $slug . '.jpg';
    $targetPath = $targetDir . $fileName;
    $dbPath = 'assets/images/thumbnails/' . $fileName;
    
    // Move uploaded file to target
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Update database row
        $updateStmt = $db->prepare('UPDATE games SET thumbnail = :thumbnail WHERE id = :id');
        $updateStmt->execute([
            ':thumbnail' => $dbPath,
            ':id' => $gameId
        ]);
        
        jsonResponse([
            'success' => true,
            'thumbnail_path' => $dbPath
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Failed to move uploaded file to target directory'
        ], 500);
    }
    
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
