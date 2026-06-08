<?php

/**
 * Sanitize user input to protect against XSS
 *
 * @param string $input
 * @return string
 */
function sanitizeInput($input) {
    if ($input === null) {
        return '';
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Respond with structured JSON data and end execution
 *
 * @param array|object $data
 * @param int $statusCode
 * @return void
 */
function jsonResponse($data, $statusCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Check if the request is an AJAX request
 *
 * @return bool
 */
function isAjax() {
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}
