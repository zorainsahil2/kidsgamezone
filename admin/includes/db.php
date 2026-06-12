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

            // Check for missing SEO columns in games table (auto-migration check)
            try {
                self::$instance->query('SELECT seo_title FROM games LIMIT 1');
            } catch (PDOException $e) {
                $driver = self::$instance->getAttribute(PDO::ATTR_DRIVER_NAME);
                if ($driver === 'pgsql') {
                    self::$instance->exec('ALTER TABLE games ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) DEFAULT NULL');
                    self::$instance->exec('ALTER TABLE games ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT NULL');
                    self::$instance->exec('ALTER TABLE games ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(255) DEFAULT NULL');
                    self::$instance->exec('ALTER TABLE games ADD COLUMN IF NOT EXISTS robots_meta VARCHAR(50) DEFAULT \'default\'');
                } else {
                    // Check if columns exist before adding in MySQL to prevent duplicate column errors
                    $checkCols = self::$instance->query("SHOW COLUMNS FROM games LIKE 'seo_title'")->fetch();
                    if (!$checkCols) {
                        self::$instance->exec('ALTER TABLE games ADD COLUMN seo_title VARCHAR(255) DEFAULT NULL');
                        self::$instance->exec('ALTER TABLE games ADD COLUMN seo_description TEXT DEFAULT NULL');
                        self::$instance->exec('ALTER TABLE games ADD COLUMN seo_keywords VARCHAR(255) DEFAULT NULL');
                        self::$instance->exec('ALTER TABLE games ADD COLUMN robots_meta VARCHAR(50) DEFAULT \'default\'');
                    }
                }
            }
        }
        return self::$instance;
    }
}
