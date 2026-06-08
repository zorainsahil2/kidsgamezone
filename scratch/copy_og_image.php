<?php
$pngPath = 'C:\Users\zorai\.gemini\antigravity\brain\aecdac0f-d235-46ac-a063-6eeccedaa1cf\og_image_1780493601467.png';
$jpgPath = 'f:\50 games\kidsgamezone\assets\images\ui\og-image.jpg';

try {
    if (!file_exists($pngPath)) {
        throw new Exception("Source PNG file not found at: " . $pngPath);
    }
    
    if (copy($pngPath, $jpgPath)) {
        echo "Direct copy successful (copied PNG to og-image.jpg).\n";
    } else {
        throw new Exception("Direct copy failed.");
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
