<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Force session setup
startAdminSession();

// 1. Rate Limiting check (5 failed attempts within 10 minutes)
if (!isset($_SESSION['failed_logins'])) {
    $_SESSION['failed_logins'] = [];
}

$now = time();

// Filter out attempts older than 10 minutes (600 seconds)
$_SESSION['failed_logins'] = array_filter($_SESSION['failed_logins'], function($timestamp) use ($now) {
    return ($now - $timestamp) < 600;
});

if (count($_SESSION['failed_logins']) >= 5) {
    $oldestAttempt = min($_SESSION['failed_logins']);
    $secondsLeft = 600 - ($now - $oldestAttempt);
    $minutesLeft = ceil($secondsLeft / 60);
    
    jsonResponse([
        'success' => false,
        'message' => "Too many login attempts. Please try again in {$minutesLeft} minute(s)."
    ], 429);
}

// 2. Parse Inputs (Form URL-encoded or JSON payload)
$username = '';
$password = '';

$contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
if (stripos($contentType, 'application/json') !== false) {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $username = isset($decoded['username']) ? $decoded['username'] : '';
        $password = isset($decoded['password']) ? $decoded['password'] : '';
    }
} else {
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
}

$username = trim($username);

// 3. Process Login
if (empty($username) || empty($password)) {
    jsonResponse([
        'success' => false,
        'message' => 'Please provide both username and password.'
    ], 400);
}

if (loginAdmin($username, $password)) {
    // Clear failed login attempts on successful login
    unset($_SESSION['failed_logins']);
    
    jsonResponse([
        'success' => true,
        'redirect' => 'dashboard.php'
    ]);
} else {
    // Track failed login attempt
    $_SESSION['failed_logins'][] = time();
    
    jsonResponse([
        'success' => false,
        'message' => 'Invalid username or password'
    ], 401);
}
