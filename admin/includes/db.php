<?php
require_once __DIR__ . '/../../config/config.php';

class DB {
    private static $instance = null;

    public static function get(): PDO {
        if (self::$instance === null) {
            $db_type = getenv('DB_TYPE') ?: 'mysql';
            $db_host = getenv('DB_HOST') ?: 'localhost';
            $db_name = getenv('DB_NAME') ?: 'kidsgamezone';
            $db_user = getenv('DB_USER') ?: 'root';
            $db_pass = getenv('DB_PASS') ?: '';
            $db_port = getenv('DB_PORT') ?: ($db_type === 'pgsql' ? '5432' : '3306');
            $db_url = getenv('DATABASE_URL');

            if ($db_type === 'pgsql' || $db_url) {
                if ($db_url) {
                    // Parse standard Heroku / Supabase DATABASE_URL
                    $url = parse_url($db_url);
                    $host = $url["host"] ?? '';
                    $port = $url["port"] ?? '5432';
                    $user = $url["user"] ?? '';
                    $pass = $url["pass"] ?? '';
                    $path = ltrim($url["path"] ?? '', '/');
                    $dsn = "pgsql:host=$host;port=$port;dbname=$path";
                    
                    self::$instance = new PDO($dsn, $user, $pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]);
                } else {
                    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name";
                    self::$instance = new PDO($dsn, $db_user, $db_pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]);
                }
            } else {
                // MySQL default
                $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
                self::$instance = new PDO($dsn, $db_user, $db_pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
            }
        }
        return self::$instance;
    }
}
