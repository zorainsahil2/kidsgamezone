<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !is_array($data)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid request payload'
    ], 400);
}

$newUsername = isset($data['new_username']) ? trim($data['new_username']) : '';
$newPassword = isset($data['new_password']) ? $data['new_password'] : '';
$confirmPassword = isset($data['confirm_password']) ? $data['confirm_password'] : '';
$currentPassword = isset($data['current_password']) ? $data['current_password'] : '';

// Validation
if (empty($newUsername)) {
    jsonResponse([
        'success' => false,
        'message' => 'Username cannot be empty.'
    ], 400);
}

if (strlen($newUsername) < 3 || strlen($newUsername) > 50) {
    jsonResponse([
        'success' => false,
        'message' => 'Username must be between 3 and 50 characters.'
    ], 400);
}

if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $newUsername)) {
    jsonResponse([
        'success' => false,
        'message' => 'Username can only contain alphanumeric characters, underscores, hyphens, and dots.'
    ], 400);
}

if (empty($currentPassword)) {
    jsonResponse([
        'success' => false,
        'message' => 'Please enter your current password to authorize this action.'
    ], 400);
}

if (!empty($newPassword)) {
    if (strlen($newPassword) < 6) {
        jsonResponse([
            'success' => false,
            'message' => 'New password must be at least 6 characters long.'
        ], 400);
    }
    if ($newPassword !== $confirmPassword) {
        jsonResponse([
            'success' => false,
            'message' => 'New passwords do not match.'
        ], 400);
    }
}

try {
    $db = DB::get();
    $adminId = $_SESSION['admin_id'];

    // 1. Fetch current password hash to verify current password
    $stmt = $db->prepare('SELECT id, password FROM admin_users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $adminId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password'])) {
        jsonResponse([
            'success' => false,
            'message' => 'Incorrect current password.'
        ], 400);
    }

    // 2. Check if the new username is already taken by another user
    $checkStmt = $db->prepare('SELECT id FROM admin_users WHERE username = :username AND id != :id LIMIT 1');
    $checkStmt->execute([':username' => $newUsername, ':id' => $adminId]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Username is already taken.'
        ], 400);
    }

    // 3. Update query execution
    if (!empty($newPassword)) {
        // Change username and password
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $updateStmt = $db->prepare('UPDATE admin_users SET username = :username, password = :password WHERE id = :id');
        $updateStmt->execute([
            ':username' => $newUsername,
            ':password' => $newHash,
            ':id' => $adminId
        ]);
    } else {
        // Change username only
        $updateStmt = $db->prepare('UPDATE admin_users SET username = :username WHERE id = :id');
        $updateStmt->execute([
            ':username' => $newUsername,
            ':id' => $adminId
        ]);
    }

    // 4. Update active session properties
    $_SESSION['admin_username'] = $newUsername;

    // 5. Re-generate persistent signed session cookie
    if (defined('SECRET_KEY')) {
        $secure = false;
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            $secure = true;
        } elseif (defined('SITE_URL') && stripos(SITE_URL, 'https://') === 0) {
            $secure = true;
        }
        
        $expires = time() + 86400 * 7;
        $payloadJson = json_encode([
            'admin_id' => $adminId,
            'admin_username' => $newUsername,
            'expires' => $expires
        ]);
        $signature = hash_hmac('sha256', $payloadJson, SECRET_KEY);
        $cookieValue = base64_encode($payloadJson) . '.' . $signature;
        
        setcookie('kgz_admin_token', $cookieValue, [
            'expires' => $expires,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Profile updated successfully.'
    ]);

} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
