<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Enforce authentication middleware
requireLogin();

$adminUsername = isset($_SESSION['admin_username']) ? sanitizeInput($_SESSION['admin_username']) : 'Admin';

try {
    $db = DB::get();
    $totalGames = (int)$db->query('SELECT COUNT(*) FROM games')->fetchColumn();
    $activeGames = (int)$db->query('SELECT COUNT(*) FROM games WHERE is_active = 1')->fetchColumn();
    $featuredGames = (int)$db->query('SELECT COUNT(*) FROM games WHERE is_featured = 1')->fetchColumn();
    $totalPlays = (int)$db->query('SELECT COALESCE(SUM(play_count), 0) FROM games')->fetchColumn();
} catch (PDOException $e) {
    $totalGames = 0;
    $activeGames = 0;
    $featuredGames = 0;
    $totalPlays = 0;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - KidsGameZone</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #FF6B35;
            --secondary: #4ECDC4;
            --accent: #FFE66D;
            --purple: #A855F7;
            --bg: #FFF9F0;
            --card-bg: #FFFFFF;
            --text: #2D3748;
            --text-light: #718096;
            --sidebar-width: 260px;
            --border-radius: 16px;
            --border-style: 3px solid #2D3748;
            --shadow: 0 8px 0px #2D3748;
            --shadow-hover: 0 14px 0px #2D3748;
            --transition: all 0.3s ease;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Nunito', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
        }

        /* Sidebar Navigation Drawer */
        .sidebar {
            width: var(--sidebar-width);
            background: var(--card-bg);
            border-right: var(--border-style);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 100;
        }

        .sidebar-logo {
            padding: 30px 20px;
            font-family: 'Fredoka', cursive;
            font-size: 1.8rem;
            color: var(--primary);
            text-align: center;
            border-bottom: var(--border-style);
            text-shadow: 1px 1px 0px var(--text);
            -webkit-text-stroke: 1px var(--text);
        }

        .sidebar-profile {
            padding: 20px;
            text-align: center;
            border-bottom: var(--border-style);
            background: #FFFBF4;
        }

        .sidebar-profile .username {
            font-weight: 700;
            color: var(--text);
        }

        .sidebar-menu {
            list-style: none;
            padding: 20px 10px;
            flex-grow: 1;
        }

        .sidebar-menu li {
            margin-bottom: 10px;
        }

        .sidebar-menu a {
            display: block;
            padding: 12px 15px;
            text-decoration: none;
            color: var(--text);
            font-weight: 700;
            border-radius: 12px;
            border: 2px solid transparent;
            transition: var(--transition);
        }

        .sidebar-menu a:hover {
            background: var(--bg);
            border-color: var(--text);
        }

        .sidebar-menu li.active a {
            background: var(--accent);
            border-color: var(--text);
            box-shadow: 3px 3px 0px var(--text);
        }

        .btn-logout-sidebar {
            margin: 20px;
            padding: 12px;
            font-family: 'Fredoka', cursive;
            background: #FFECEB;
            border: var(--border-style);
            border-radius: 12px;
            color: #C53030;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            box-shadow: 0 4px 0px var(--text);
            transition: var(--transition);
        }

        .btn-logout-sidebar:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        /* Main Content Panel */
        .main-content {
            margin-left: var(--sidebar-width);
            padding: 40px;
            flex-grow: 1;
            width: calc(100% - var(--sidebar-width));
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            font-family: 'Fredoka', cursive;
            font-size: 2.5rem;
            color: var(--primary);
            text-shadow: 2px 2px 0px rgba(0,0,0,0.05);
        }

        .header p {
            color: var(--text-light);
            font-weight: 700;
            margin-top: 5px;
        }

        /* Welcome Banner */
        .welcome-banner {
            background: #EBF8FF;
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: 0 6px 0px var(--text);
            padding: 25px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .welcome-avatar {
            font-size: 3rem;
        }

        .welcome-text h2 {
            font-family: 'Fredoka', cursive;
            color: #2B6CB0;
            font-size: 1.6rem;
            margin-bottom: 5px;
        }

        .welcome-text p {
            font-weight: 700;
            color: #4A5568;
        }

        /* Stats Grid Styles */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: 0 6px 0px var(--text);
            padding: 20px;
            text-align: center;
            transition: var(--transition);
        }

        .stat-num {
            font-family: 'Fredoka', cursive;
            font-size: 2.2rem;
            color: var(--primary);
            margin-bottom: 5px;
        }

        .stat-label {
            font-weight: 700;
            color: var(--text-light);
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }

        /* Actions Grid */
        .actions-section {
            margin-bottom: 30px;
        }

        .section-title {
            font-family: 'Fredoka', cursive;
            font-size: 1.8rem;
            color: var(--text);
            margin-bottom: 20px;
            text-shadow: 1.5px 1.5px 0px rgba(0,0,0,0.05);
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 25px;
        }

        .action-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            padding: 25px;
            text-decoration: none;
            color: var(--text);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .action-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-hover);
        }

        .action-icon-box {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            border: 2px solid var(--text);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            box-shadow: 2px 2px 0 var(--text);
        }

        .icon-games { background: #FEF3C7; }
        .icon-ads { background: #E0F2FE; }
        .icon-analytics { background: #DEF7EC; }
        .icon-settings { background: #FCE7F3; }

        .action-card h3 {
            font-family: 'Fredoka', cursive;
            font-size: 1.3rem;
            color: var(--text);
        }

        .action-card p {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--text-light);
            line-height: 1.5;
        }

        .action-arrow {
            margin-top: auto;
            align-self: flex-end;
            font-weight: 800;
            color: var(--primary);
            font-size: 1.1rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            body {
                flex-direction: column;
            }
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
                border-right: none;
                border-bottom: var(--border-style);
            }
            .sidebar-logo {
                padding: 15px;
            }
            .sidebar-profile {
                display: none;
            }
            .sidebar-menu {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                padding: 10px;
            }
            .sidebar-menu li {
                margin: 5px;
            }
            .btn-logout-sidebar {
                margin: 10px auto;
                width: 90%;
            }
            .main-content {
                margin-left: 0;
                width: 100%;
                padding: 20px;
            }
        }
    </style>
</head>
<body>

    <!-- Sidebar Navigation Drawer -->
    <div class="sidebar">
        <div class="sidebar-logo">🎮 KidsGameZone</div>
        <div class="sidebar-profile">
            <span class="username">👤 <?php echo $adminUsername; ?></span>
        </div>
        <ul class="sidebar-menu">
            <li class="active"><a href="dashboard.php">Dashboard</a></li>
            <li><a href="ads-manager.php">Ad Slots</a></li>
            <li><a href="games-manager.php">Games Manager</a></li>
            <li><a href="analytics.php">Analytics</a></li>
            <li><a href="settings.php">Settings</a></li>
        </ul>
        <button id="logoutBtn" class="btn-logout-sidebar">LOGOUT</button>
    </div>

    <!-- Main Workspace -->
    <div class="main-content">
        <div class="header">
            <h1>🎮 Admin Dashboard</h1>
            <p>Welcome back to the KidsGameZone manager portal.</p>
        </div>

        <!-- Welcome Banner -->
        <div class="welcome-banner">
            <span class="welcome-avatar">👋</span>
            <div class="welcome-text">
                <h2>Hello, <?php echo $adminUsername; ?>!</h2>
                <p>Use the shortcuts below to manage games, monitor visitor traffic, configure advertising channels, and update site configurations.</p>
            </div>
        </div>

        <!-- Stats Panel -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-num"><?php echo $totalGames; ?></div>
                <div class="stat-label">Total Games</div>
            </div>
            <div class="stat-card">
                <div class="stat-num"><?php echo $activeGames; ?></div>
                <div class="stat-label">Active Games</div>
            </div>
            <div class="stat-card">
                <div class="stat-num"><?php echo $featuredGames; ?></div>
                <div class="stat-label">Featured Games</div>
            </div>
            <div class="stat-card">
                <div class="stat-num"><?php echo $totalPlays; ?></div>
                <div class="stat-label">Total Plays</div>
            </div>
        </div>

        <!-- Quick Actions Grid -->
        <div class="actions-section">
            <h2 class="section-title">⚡ Quick Management Actions</h2>
            <div class="actions-grid">
                
                <a href="games-manager.php" class="action-card">
                    <div class="action-icon-box icon-games">🕹️</div>
                    <h3>Games Manager</h3>
                    <p>Edit game configurations, change status, toggle featured placement, and upload custom thumbnails.</p>
                    <span class="action-arrow">Manage →</span>
                </a>

                <a href="ads-manager.php" class="action-card">
                    <div class="action-icon-box icon-ads">📢</div>
                    <h3>Ad Placements</h3>
                    <p>Control header banners, sidebar skyscraper ads, pre-roll video skip timers, and direct campaigns.</p>
                    <span class="action-arrow">Configure →</span>
                </a>

                <a href="analytics.php" class="action-card">
                    <div class="action-icon-box icon-analytics">📊</div>
                    <h3>Portal Analytics</h3>
                    <p>Track dynamic daily plays, top-performing games, categories, ad skips, CTR%, and CTR logs.</p>
                    <span class="action-arrow">View Reports →</span>
                </a>

                <a href="settings.php" class="action-card">
                    <div class="action-icon-box icon-settings">⚙️</div>
                    <h3>Site Settings</h3>
                    <p>Manage brand details, SEO meta descriptions, keywords, logo uploads, maintenance mode, and sitemaps.</p>
                    <span class="action-arrow">Settings →</span>
                </a>

            </div>
        </div>
    </div>

    <script>
        document.getElementById('logoutBtn').addEventListener('click', function() {
            fetch('api/logout.php', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'index.php';
                }
            });
        });
    </script>
</body>
</html>
