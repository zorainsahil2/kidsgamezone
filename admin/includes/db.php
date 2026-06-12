<?php
require_once __DIR__ . '/../../config/config.php';

class DB {
    private static $instance = null;

    public static function get(): PDO {
        if (self::$instance === null) {
            $db_type = getenv('DB_TYPE') ?: 'mysql';
            $db_host = getenv('DB_HOST') ?: (defined('DB_HOST') ? DB_HOST : 'localhost');
            $db_name = getenv('DB_NAME') ?: (defined('DB_NAME') ? DB_NAME : 'kidsgamezone');
            $db_user = getenv('DB_USER') ?: (defined('DB_USER') ? DB_USER : 'root');
            $db_pass = getenv('DB_PASS') ?: (defined('DB_PASS') ? DB_PASS : '');
            $db_port = getenv('DB_PORT') ?: (defined('DB_PORT') ? DB_PORT : ($db_type === 'pgsql' ? '5432' : '3306'));
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

            // Auto-seed/update user's actual Adsterra ad codes if they are empty or demo
            try {
                // Check site_settings for global_custom_scripts
                $checkSettings = self::$instance->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'global_custom_scripts' LIMIT 1");
                $checkSettings->execute();
                $scriptsVal = $checkSettings->fetchColumn();
                
                // If global_custom_scripts is empty, update it with Adsterra Popunder & Social Bar
                if (empty($scriptsVal)) {
                    $adsterraGlobal = '<script src="https://pl29724608.effectivecpmnetwork.com/b0/6c/e4/b06ce4e7c54652a4e92ed61b8ebfe5ad.js"></script>' . "\n" .
                                      '<script src="https://pl29724609.effectivecpmnetwork.com/d4/f1/83/d4f1839cdd1a80fbe888a9efb184da05.js"></script>';
                    $driver = self::$instance->getAttribute(PDO::ATTR_DRIVER_NAME);
                    if ($driver === 'pgsql') {
                        $upSettings = self::$instance->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('global_custom_scripts', :value) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value");
                    } else {
                        $upSettings = self::$instance->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('global_custom_scripts', :value) ON DUPLICATE KEY UPDATE setting_value = :value");
                    }
                    $upSettings->execute([':value' => $adsterraGlobal]);
                }

                // Update standard banner ad slots with user's actual Adsterra scripts if they are set to 'demo'
                $adsterraCodes = [
                    'header_banner' => [
                        'network' => 'adsterra',
                        'code' => '<script>
  atOptions = {
    \'key\' : \'e0f1e5c0dcb9089af6400c2561a5d3c1\',
    \'format\' : \'iframe\',
    \'height\' : 90,
    \'width\' : 728,
    \'params\' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/e0f1e5c0dcb9089af6400c2561a5d3c1/invoke.js"></script>'
                    ],
                    'footer_banner' => [
                        'network' => 'adsterra',
                        'code' => '<script>
  atOptions = {
    \'key\' : \'e0f1e5c0dcb9089af6400c2561a5d3c1\',
    \'format\' : \'iframe\',
    \'height\' : 90,
    \'width\' : 728,
    \'params\' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/e0f1e5c0dcb9089af6400c2561a5d3c1/invoke.js"></script>'
                    ],
                    'sidebar_left' => [
                        'network' => 'adsterra',
                        'code' => '<script>
  atOptions = {
    \'key\' : \'baa5952a332a6d71d202a3d92478783b\',
    \'format\' : \'iframe\',
    \'height\' : 600,
    \'width\' : 160,
    \'params\' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/baa5952a332a6d71d202a3d92478783b/invoke.js"></script>'
                    ],
                    'sidebar_right' => [
                        'network' => 'adsterra',
                        'code' => '<script>
  atOptions = {
    \'key\' : \'442ce4e6e93cd0af4a10a89a90cade64\',
    \'format\' : \'iframe\',
    \'height\' : 250,
    \'width\' : 300,
    \'params\' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/442ce4e6e93cd0af4a10a89a90cade64/invoke.js"></script>'
                    ],
                    'pre_roll' => [
                        'network' => 'direct',
                        'code' => '<div style="text-align: center; font-family: \'Fredoka\', sans-serif; background: #282c34; border: 4px solid #fff; border-radius: 16px; padding: 25px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 0px #2D3748;">
  <h2 style="color: #FFE66D; margin-bottom: 20px; font-size: 2rem; -webkit-text-stroke: 1px #000; text-shadow: 2px 2px 0px #000;">🎁 CLICK HERE TO GET FREE GAME REWARDS! 🎁</h2>
  <p style="color: #ffffff; font-size: 1.1rem; margin-bottom: 20px;">Get coins, exclusive skins, and power-ups for your games instantly!</p>
  <a href="https://www.effectivecpmnetwork.com/qtd5zgf4su?key=c9ad0dd24dd5a96c6ad2bbf0a05714bb" target="_blank" style="display: inline-block; background-color: #FF6B35; color: #FFFFFF; font-size: 1.5rem; font-weight: bold; padding: 12px 30px; text-decoration: none; border: 3px solid #2D3748; border-radius: 12px; box-shadow: 0 6px 0px #2D3748; transition: all 0.1s; text-transform: uppercase;">👉 Claim Free Gift 👈</a>
</div>'
                    ]
                ];

                foreach ($adsterraCodes as $slot => $data) {
                    $checkSlot = self::$instance->prepare("SELECT network, ad_code FROM ad_slots WHERE slot_name = :slot LIMIT 1");
                    $checkSlot->execute([':slot' => $slot]);
                    $row = $checkSlot->fetch();
                    if ($row) {
                        // If it's empty, set to demo, or if network is 'demo', overwrite with user's actual Adsterra values
                        if (empty($row['ad_code']) || $row['network'] === 'demo' || strpos($row['ad_code'], '📢') !== false || strpos($row['ad_code'], 'demo-pre-roll') !== false) {
                            $upSlot = self::$instance->prepare("UPDATE ad_slots SET network = :network, ad_code = :code, is_active = 1 WHERE slot_name = :slot");
                            $upSlot->execute([
                                ':network' => $data['network'],
                                ':code' => $data['code'],
                                ':slot' => $slot
                            ]);
                        }
                    }
                }
            } catch (Exception $e) {
                // Fail silently to avoid breaking connection if ad_slots table doesn't exist yet
            }
        }
        return self::$instance;
    }
}
