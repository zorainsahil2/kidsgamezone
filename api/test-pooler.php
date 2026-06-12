<?php
header('Content-Type: text/plain; charset=utf-8');

$db_url = getenv('DATABASE_URL');
if (!$db_url) {
    echo "Error: DATABASE_URL environment variable is not set on Vercel!\n";
    exit;
}

$url = parse_url($db_url);
$user = $url["user"] ?? '';
$pass = $url["pass"] ?? '';

echo "Parsed user: {$user}\n";
echo "Parsed password: " . str_repeat('*', strlen($pass)) . "\n\n";

$hosts = [
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ap-south-1.pooler.supabase.com'
];

$ports = [6543, 5432];

foreach ($hosts as $host) {
    foreach ($ports as $port) {
        echo "Testing connection to {$host}:{$port}...\n";
        try {
            $dsn = "pgsql:host={$host};port={$port};dbname=postgres;sslmode=require";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 4
            ]);
            echo "===> SUCCESS! Connected to {$host}:{$port}!\n\n";
        } catch (Exception $e) {
            echo "Failed: " . $e->getMessage() . "\n\n";
        }
    }
}
