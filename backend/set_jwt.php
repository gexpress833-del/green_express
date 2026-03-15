<?php
$s = bin2hex(random_bytes(32));
$path = __DIR__ . DIRECTORY_SEPARATOR . '.env';
$env = file_get_contents($path);
$env = preg_replace('/^JWT_SECRET=.*$/m', 'JWT_SECRET=' . $s, $env);
file_put_contents($path, $env);
echo $s . PHP_EOL;