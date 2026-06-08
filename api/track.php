<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// 1. Session Rate Limiter (Max 10 requests per minute)
if (session_status() === PHP_SESSION_NONE) {
    // Avoid secure-only cookie issue in rate limit tracking by setting default session settings
    session_start();
}

if (!isset($_SESSION['track_attempts'])) {
    $_SESSION['track_attempts'] = [];
}

$now = time();

// Keep only track attempts within the last 60 seconds
$_SESSION['track_attempts'] = array_filter($_SESSION['track_attempts'], function($timestamp) use ($now) {
    return ($now - $timestamp) < 60;
});

if (count($_SESSION['track_attempts']) >= 10) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Rate limit exceeded'
    ]);
    exit;
}

$_SESSION['track_attempts'][] = $now;

// 2. Parse JSON body
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

if (!is_array($inputData)) {
    $inputData = $_POST;
}

$event_type = isset($inputData['event_type']) ? trim($inputData['event_type']) : '';
$game_id = isset($inputData['game_id']) && $inputData['game_id'] !== '' ? (int)$inputData['game_id'] : null;
$ad_slot = isset($inputData['ad_slot']) && $inputData['ad_slot'] !== '' ? trim($inputData['ad_slot']) : null;

// Validate Event Type
$allowed_events = ['game_view', 'ad_impression', 'ad_skip', 'ad_click'];
if (!in_array($event_type, $allowed_events)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid event type'
    ]);
    exit;
}

// 3. Database Log
require_once __DIR__ . '/../admin/includes/db.php';

$ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$ip_hash = hash('sha256', $ip_address);
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

try {
    $db = DB::get();
    
    // Automatically increment game play count on game_view event
    if ($event_type === 'game_view' && $game_id !== null) {
        $updateStmt = $db->prepare('UPDATE games SET play_count = play_count + 1 WHERE id = :game_id');
        $updateStmt->execute([':game_id' => $game_id]);
    }
    
    // Log analytical event
    $stmt = $db->prepare('INSERT INTO analytics (event_type, game_id, ad_slot, ip_hash, user_agent) VALUES (:event_type, :game_id, :ad_slot, :ip_hash, :user_agent)');
    $stmt->execute([
        ':event_type' => $event_type,
        ':game_id' => $game_id,
        ':ad_slot' => $ad_slot,
        ':ip_hash' => $ip_hash,
        ':user_agent' => substr($user_agent, 0, 1000) // Truncate user agent if excessively long
    ]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
