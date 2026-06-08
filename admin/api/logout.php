<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Trigger logout cleanup
logoutAdmin();

// Return response confirmation
jsonResponse([
    'success' => true
]);
