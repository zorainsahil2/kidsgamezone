<?php
// Gateway Router for Vercel Serverless PHP Execution
if (isset($_GET['version'])) {
    header('Content-Type: text/plain');
    echo "Version: 1.0.1 - Commit: 7ea0dce\n";
    exit;
}
$path = $_GET['path'] ?? '';

// Sanitize path to prevent directory traversal
$path = str_replace(['..', '\\'], '', $path);
$path = ltrim($path, '/');

// Resolve absolute path
$root = dirname(__DIR__);
$file = $root . '/' . $path;

// If path points to a directory, look for index.php inside it
if ($path && is_dir($file)) {
    $file = rtrim($file, '/') . '/index.php';
    $path = rtrim($path, '/') . '/index.php';
} elseif (!$path) {
    // Default fallback if path parameter is empty
    $file = $root . '/index.php';
    $path = 'index.php';
}

if (file_exists($file) && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) === 'php') {
    // Mock environment variables to match direct script execution
    $_SERVER['SCRIPT_FILENAME'] = $file;
    $_SERVER['SCRIPT_NAME'] = '/' . $path;
    $_SERVER['PHP_SELF'] = '/' . $path;
    
    // Change working directory to target script location for relative requires/includes
    chdir(dirname($file));
    
    // Execute target script
    include $file;
} else {
    http_response_code(404);
    header("Content-Type: text/plain; charset=utf-8");
    echo "404 - Page Not Found";
}
