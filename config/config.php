<?php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'kidsgamezone');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('SITE_URL', getenv('SITE_URL') ?: 'http://localhost');
define('SECRET_KEY', getenv('SECRET_KEY') ?: 'change-this-in-production');
define('ADMIN_SESSION_NAME', 'kgz_admin_session');
define('SESSION_LIFETIME', 3600); // 1 hour

