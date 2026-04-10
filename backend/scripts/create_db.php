<?php
$host = '127.0.0.1';
$port = 3306;
$user = 'root';
$pass = '1999';
$db = 'db_gexpress';
try {
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "DB OK" . PHP_EOL;
} catch (PDOException $e) {
    echo 'DB ERR: ' . $e->getMessage() . PHP_EOL;
    exit(1);
}
