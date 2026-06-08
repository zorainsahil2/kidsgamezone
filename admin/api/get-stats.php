<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce login
requireLogin();

// Accept and validate date range (days)
$days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
if (!in_array($days, [7, 30, 90], true)) {
    $days = 30;
}

// Calculate standard date threshold in PHP for database-independent binding
$dateThreshold = date('Y-m-d H:i:s', strtotime("-$days days"));

try {
    $db = DB::get();
    
    // ----------------------------------------------------
    // Section 1: Overview Cards
    // ----------------------------------------------------
    
    // Total Plays in date range
    $stmt = $db->prepare("SELECT COUNT(*) FROM analytics WHERE event_type = 'game_view' AND created_at >= :threshold");
    $stmt->execute([':threshold' => $dateThreshold]);
    $totalPlays = (int)$stmt->fetchColumn();
    
    // Total Impressions in date range
    $stmt = $db->prepare("SELECT COUNT(*) FROM analytics WHERE event_type = 'ad_impression' AND created_at >= :threshold");
    $stmt->execute([':threshold' => $dateThreshold]);
    $totalAdImpressions = (int)$stmt->fetchColumn();
    
    // Total Clicks in date range
    $stmt = $db->prepare("SELECT COUNT(*) FROM analytics WHERE event_type = 'ad_click' AND created_at >= :threshold");
    $stmt->execute([':threshold' => $dateThreshold]);
    $totalAdClicks = (int)$stmt->fetchColumn();
    
    // Total Skips in date range
    $stmt = $db->prepare("SELECT COUNT(*) FROM analytics WHERE event_type = 'ad_skip' AND created_at >= :threshold");
    $stmt->execute([':threshold' => $dateThreshold]);
    $totalAdSkips = (int)$stmt->fetchColumn();
    
    // Active Games (Absolute)
    $activeGames = (int)$db->query('SELECT COUNT(*) FROM games WHERE is_active = 1')->fetchColumn();
    
    // Today's Plays (Absolute today)
    $todayPlays = (int)$db->query("SELECT COUNT(*) FROM analytics WHERE event_type = 'game_view' AND CAST(created_at AS DATE) = CURRENT_DATE")->fetchColumn();
    
    $overview = [
        'total_plays' => $totalPlays,
        'total_ad_impressions' => $totalAdImpressions,
        'total_ad_clicks' => $totalAdClicks,
        'total_ad_skips' => $totalAdSkips,
        'active_games' => $activeGames,
        'today_plays' => $todayPlays
    ];

    // ----------------------------------------------------
    // Section 2: Daily Plays (last N days)
    // ----------------------------------------------------
    
    $stmt = $db->prepare("
        SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count 
        FROM analytics 
        WHERE event_type = 'game_view' AND created_at >= :threshold 
        GROUP BY CAST(created_at AS DATE) 
        ORDER BY date ASC
    ");
    $stmt->execute([':threshold' => $dateThreshold]);
    $dbDaily = $stmt->fetchAll();
    
    // Populate all dates in the range with 0 initially to fill gaps
    $dailyPlays = [];
    for ($i = $days - 1; $i >= 0; $i--) {
        $dateStr = date('Y-m-d', strtotime("-$i days"));
        $dailyPlays[$dateStr] = 0;
    }
    
    // Merge database results
    foreach ($dbDaily as $row) {
        $dateStr = $row['date'];
        if (isset($dailyPlays[$dateStr])) {
            $dailyPlays[$dateStr] = (int)$row['count'];
        }
    }
    
    // Format response list
    $formattedDaily = [];
    foreach ($dailyPlays as $date => $count) {
        $formattedDaily[] = [
            'date' => $date,
            'count' => $count
        ];
    }

    // ----------------------------------------------------
    // Section 3: Top 10 Games
    // ----------------------------------------------------
    
    $stmt = $db->prepare("
        SELECT g.title, g.slug, COUNT(a.id) AS play_count
        FROM analytics a
        JOIN games g ON a.game_id = g.id
        WHERE a.event_type = 'game_view' AND a.created_at >= :threshold
        GROUP BY a.game_id, g.title, g.slug
        ORDER BY play_count DESC
        LIMIT 10
    ");
    $stmt->execute([':threshold' => $dateThreshold]);
    $topGames = $stmt->fetchAll();
    foreach ($topGames as &$game) {
        $game['play_count'] = (int)$game['play_count'];
    }

    // ----------------------------------------------------
    // Section 4: Ad Performance per slot
    // ----------------------------------------------------
    
    $stmt = $db->prepare('
        SELECT ad_slot, event_type, COUNT(*) AS count
        FROM analytics
        WHERE ad_slot IS NOT NULL AND ad_slot != "" AND created_at >= :threshold
        GROUP BY ad_slot, event_type
    ');
    $stmt->execute([':threshold' => $dateThreshold]);
    $dbAds = $stmt->fetchAll();
    
    // Initialize standard ad slots list
    $slots = ['pre_roll', 'header_banner', 'sidebar_left', 'sidebar_right', 'footer_banner'];
    $adStats = [];
    foreach ($slots as $slot) {
        $adStats[$slot] = [
            'slot' => $slot,
            'impressions' => 0,
            'clicks' => 0,
            'skips' => 0
        ];
    }
    
    // Aggregate counts
    foreach ($dbAds as $row) {
        $slot = $row['ad_slot'];
        $type = $row['event_type'];
        $count = (int)$row['count'];
        
        if (!isset($adStats[$slot])) {
            $adStats[$slot] = [
                'slot' => $slot,
                'impressions' => 0,
                'clicks' => 0,
                'skips' => 0
            ];
        }
        
        if ($type === 'ad_impression') {
            $adStats[$slot]['impressions'] += $count;
        } elseif ($type === 'ad_click') {
            $adStats[$slot]['clicks'] += $count;
        } elseif ($type === 'ad_skip') {
            $adStats[$slot]['skips'] += $count;
        }
    }
    $formattedAds = array_values($adStats);

    // ----------------------------------------------------
    // Section 5: Category Popularity
    // ----------------------------------------------------
    
    $stmt = $db->prepare("
        SELECT g.category, COUNT(a.id) AS count
        FROM analytics a
        JOIN games g ON a.game_id = g.id
        WHERE a.event_type = 'game_view' AND a.created_at >= :threshold
        GROUP BY g.category
        ORDER BY count DESC
    ");
    $stmt->execute([':threshold' => $dateThreshold]);
    $dbCats = $stmt->fetchAll();
    
    $categoryPlays = [];
    foreach ($dbCats as $row) {
        $categoryPlays[] = [
            'category' => $row['category'],
            'count' => (int)$row['count']
        ];
    }

    // ----------------------------------------------------
    // Compile and Return JSON Response
    // ----------------------------------------------------
    
    jsonResponse([
        'overview' => $overview,
        'daily_plays' => $formattedDaily,
        'top_games' => $topGames,
        'ad_stats' => $formattedAds,
        'category_plays' => $categoryPlays
    ]);

} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], 500);
}
