<?php
$dir = 'f:/50 games/kidsgamezone/games/super-mario/assets/';
$files = glob($dir . '*.png');
foreach ($files as $file) {
    $info = getimagesize($file);
    echo basename($file) . ': ' . $info[0] . 'x' . $info[1] . "\n";
}
