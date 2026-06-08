<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

try {
    $db = DB::get();
    $stmt = $db->query('SELECT id, slug, title, seo_title, category, seo_description, seo_keywords, robots_meta, thumbnail, game_path, is_active, is_featured, play_count, created_at FROM games ORDER BY id ASC');
    $games = $stmt->fetchAll();
    
    // Cast variables correctly
    foreach ($games as &$game) {
        $game['id'] = (int)$game['id'];
        $game['is_active'] = (int)$game['is_active'];
        $game['is_featured'] = (int)$game['is_featured'];
        $game['play_count'] = (int)$game['play_count'];
    }
    
    jsonResponse($games);
} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
