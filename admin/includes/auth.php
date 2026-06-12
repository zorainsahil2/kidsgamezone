<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/functions.php';

/**
 * Configure and start secure admin session
 */
function startAdminSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Enforce session name from config
        session_name(ADMIN_SESSION_NAME);
        
        // Auto-detect secure cookie flag based on HTTPS request or SITE_URL config
        $secure = false;
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            $secure = true;
        } elseif (defined('SITE_URL') && stripos(SITE_URL, 'https://') === 0) {
            $secure = true;
        }
        
        // Enforce secure cookie attributes
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        
        session_start();
    }
}

/**
 * Check if the admin is logged in and session is still active
 *
 * @return bool
 */
function isLoggedIn() {
    startAdminSession();
    
    if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_username'])) {
        // Attempt to restore session from secure cookie
        if (isset($_COOKIE['kgz_admin_token']) && defined('SECRET_KEY')) {
            $parts = explode('.', $_COOKIE['kgz_admin_token']);
            if (count($parts) === 2) {
                $payloadB64 = $parts[0];
                $signature = $parts[1];
                $payloadJson = base64_decode($payloadB64);
                if ($payloadJson !== false) {
                    $expectedSignature = hash_hmac('sha256', $payloadJson, SECRET_KEY);
                    if (hash_equals($expectedSignature, $signature)) {
                        $payload = json_decode($payloadJson, true);
                        if (is_array($payload) && isset($payload['admin_id'], $payload['admin_username'], $payload['expires'])) {
                            if ($payload['expires'] > time()) {
                                // Restore session
                                $_SESSION['admin_id'] = $payload['admin_id'];
                                $_SESSION['admin_username'] = $payload['admin_username'];
                                $_SESSION['last_activity'] = time();
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (!isset($_SESSION['admin_id']) || !isset($_SESSION['admin_username'])) {
        return false;
    }
    
    // Validate session lifetime expiration
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
        // Clear active session variables to mark active session as expired
        $_SESSION = [];
        
        // Attempt to restore session from secure cookie
        if (isset($_COOKIE['kgz_admin_token']) && defined('SECRET_KEY')) {
            $parts = explode('.', $_COOKIE['kgz_admin_token']);
            if (count($parts) === 2) {
                $payloadB64 = $parts[0];
                $signature = $parts[1];
                $payloadJson = base64_decode($payloadB64);
                if ($payloadJson !== false) {
                    $expectedSignature = hash_hmac('sha256', $payloadJson, SECRET_KEY);
                    if (hash_equals($expectedSignature, $signature)) {
                        $payload = json_decode($payloadJson, true);
                        if (is_array($payload) && isset($payload['admin_id'], $payload['admin_username'], $payload['expires'])) {
                            if ($payload['expires'] > time()) {
                                // Restore session
                                $_SESSION['admin_id'] = $payload['admin_id'];
                                $_SESSION['admin_username'] = $payload['admin_username'];
                                $_SESSION['last_activity'] = time();
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        logoutAdmin();
        return false;
    }
    
    // Refresh session activity timestamp
    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Middleware to protect admin pages
 */
function requireLogin() {
    if (!isLoggedIn()) {
        if (isAjax()) {
            jsonResponse(['success' => false, 'message' => 'Unauthorized session'], 401);
        } else {
            header('Location: index.php');
            exit;
        }
    }
}

/**
 * Authenticate admin user
 *
 * @param string $username
 * @param string $password
 * @return bool
 */
function loginAdmin($username, $password) {
    startAdminSession();
    
    try {
        $db = DB::get();
        $stmt = $db->prepare('SELECT id, username, password FROM admin_users WHERE username = :username LIMIT 1');
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Set session properties
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['admin_username'] = $user['username'];
            $_SESSION['last_activity'] = time();
            
            // Set secure persistent cookie (Remember Me - lasts 7 days)
            if (defined('SECRET_KEY')) {
                $secure = false;
                if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
                    $secure = true;
                } elseif (defined('SITE_URL') && stripos(SITE_URL, 'https://') === 0) {
                    $secure = true;
                }
                
                $expires = time() + 86400 * 7;
                $payloadJson = json_encode([
                    'admin_id' => $user['id'],
                    'admin_username' => $user['username'],
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
            
            // Prevent Session Fixation attacks
            session_regenerate_id(true);
            return true;
        }
    } catch (PDOException $e) {
        throw new Exception("Database error in loginAdmin: " . $e->getMessage(), 0, $e);
    }
    
    return false;
}

/**
 * Destroy admin session and cookies
 */
function logoutAdmin() {
    startAdminSession();
    
    // Unset all session variables
    $_SESSION = [];
    
    // Delete persistent cookie
    if (isset($_COOKIE['kgz_admin_token'])) {
        setcookie('kgz_admin_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        unset($_COOKIE['kgz_admin_token']);
    }
    
    // Delete session cookie if active
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    
    // Destroy the session
    session_destroy();
    
    // Redirect only if this is not an AJAX logout request
    if (!isAjax()) {
        header('Location: index.php');
        exit;
    }
}
