<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['game_id']) || !isset($data['title']) || !isset($data['category']) || !isset($data['thumbnail'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Missing required fields'
    ], 400);
}

$gameId = (int)$data['game_id'];
$title = trim($data['title']);
$category = trim($data['category']);
$thumbnail = trim($data['thumbnail']);
$seoTitle = isset($data['seo_title']) ? trim($data['seo_title']) : '';
$seoDescription = isset($data['seo_description']) ? trim($data['seo_description']) : '';
$seoKeywords = isset($data['seo_keywords']) ? trim($data['seo_keywords']) : '';
$robotsMeta = isset($data['robots_meta']) ? trim($data['robots_meta']) : 'default';

if ($title === '' || $category === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Title and Category cannot be empty'
    ], 400);
}

// Sanitize inputs
$title = sanitizeInput($title);
$category = sanitizeInput($category);
$thumbnail = sanitizeInput($thumbnail);
$seoTitle = sanitizeInput($seoTitle);
$seoDescription = sanitizeInput($seoDescription);
$seoKeywords = sanitizeInput($seoKeywords);
$robotsMeta = sanitizeInput($robotsMeta);

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

    // Update
    $stmt = $db->prepare('UPDATE games SET title = :title, category = :category, thumbnail = :thumbnail, seo_title = :seo_title, seo_description = :seo_description, seo_keywords = :seo_keywords, robots_meta = :robots_meta WHERE id = :id');
    $stmt->execute([
        ':title' => $title,
        ':category' => $category,
        ':thumbnail' => $thumbnail,
        ':seo_title' => $seoTitle,
        ':seo_description' => $seoDescription,
        ':seo_keywords' => $seoKeywords,
        ':robots_meta' => $robotsMeta,
        ':id' => $gameId
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Game saved successfully'
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
