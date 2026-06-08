<?php
require_once __DIR__ . '/../config/config.php';

try {
    echo "Connecting to MySQL server at " . DB_HOST . "...\n";
    
    // Connect without dbname first so it doesn't fail if the database does not exist yet
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => true,
    ]);

    echo "Reading database/schema.sql...\n";
    $sqlFile = __DIR__ . '/schema.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("schema.sql not found at $sqlFile");
    }
    $sql = file_get_contents($sqlFile);

    echo "Executing schema migrations and seed data...\n";
    // PDO exec is capable of running multiple statements separated by semicolons on MySQL
    $pdo->exec($sql);

    echo "Migration complete! Database 'kidsgamezone' and all tables successfully created and seeded.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
