<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../admin/includes/db.php';

try {
    echo "Attempting to connect to DB...\n";
    $db = DB::get();
    echo "Connected successfully!\n";
    
    // Check if admin_users exists
    echo "Checking admin_users table...\n";
    $stmt = $db->query("SELECT id, username, password FROM admin_users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($users) . " users in admin_users table:\n";
    foreach ($users as $u) {
        echo " - ID: {$u['id']}, Username: {$u['username']}, Password Hash: {$u['password']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Code: " . $e->getCode() . "\n";
    echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
