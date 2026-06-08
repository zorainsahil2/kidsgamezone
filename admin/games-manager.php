<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Enforce authentication middleware
requireLogin();

$adminUsername = isset($_SESSION['admin_username']) ? sanitizeInput($_SESSION['admin_username']) : 'Admin';

try {
    $db = DB::get();
    // Fetch count stats directly on page load
    $totalGames = (int)$db->query('SELECT COUNT(*) FROM games')->fetchColumn();
    $activeGames = (int)$db->query('SELECT COUNT(*) FROM games WHERE is_active = 1')->fetchColumn();
    $featuredGames = (int)$db->query('SELECT COUNT(*) FROM games WHERE is_featured = 1')->fetchColumn();
    $totalPlays = (int)$db->query('SELECT COALESCE(SUM(play_count), 0) FROM games')->fetchColumn();
    
    // Fetch unique categories for dropdown filters
    $catStmt = $db->query('SELECT DISTINCT category FROM games WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
    $categories = $catStmt->fetchAll(PDO::FETCH_COLUMN);
} catch (PDOException $e) {
    $totalGames = 0;
    $activeGames = 0;
    $featuredGames = 0;
    $totalPlays = 0;
    $categories = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Games Manager - KidsGameZone</title>
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

        /* Stats Grid Styles */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
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

        /* Toolbar Container (Filters & Bulk Actions) */
        .toolbar-container {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: 0 6px 0px var(--text);
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        @media (min-width: 1024px) {
            .toolbar-container {
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
            }
        }

        .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            flex-grow: 1;
        }

        .filter-bar input, .filter-bar select {
            padding: 10px 15px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            border: 2px solid var(--text);
            border-radius: 10px;
            outline: none;
            background: var(--bg);
            min-width: 180px;
        }

        .filter-bar input {
            flex-grow: 1;
            max-width: 350px;
        }

        .filter-bar input:focus, .filter-bar select:focus {
            border-color: var(--primary);
            background: #FFFFFF;
        }

        .bulk-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .btn-bulk {
            padding: 10px 16px;
            font-family: 'Fredoka', cursive;
            font-size: 0.95rem;
            border: 2px solid var(--text);
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
            color: var(--text);
            font-weight: bold;
        }

        .btn-bulk:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        .btn-bulk-activate { background: #DEF7EC; color: #03543F; }
        .btn-bulk-activate:hover { background: #C6F6D5; }
        .btn-bulk-deactivate { background: #FDE8E8; color: #9B1C1C; }
        .btn-bulk-deactivate:hover { background: #FED7D7; }
        .btn-bulk-feature { background: #FEF3C7; color: #92400E; }
        .btn-bulk-feature:hover { background: #FDE68A; }

        /* Games Table Styling */
        .table-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            overflow: hidden;
            margin-bottom: 40px;
        }

        .table-responsive {
            overflow-x: auto;
            width: 100%;
        }

        .games-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .games-table th, .games-table td {
            padding: 15px 20px;
            border-bottom: 2px solid #E2E8F0;
            font-size: 0.95rem;
            vertical-align: middle;
        }

        .games-table th {
            background: #FFFBF4;
            font-family: 'Fredoka', cursive;
            font-size: 1.1rem;
            color: var(--text);
            border-bottom: var(--border-style);
        }

        .games-table tbody tr:last-child td {
            border-bottom: none;
        }

        .games-table tbody tr:hover {
            background: #FFFDF9;
        }

        .game-thumb-container {
            width: 60px;
            height: 40px;
            border-radius: 8px;
            border: 2px solid var(--text);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #EDF2F7;
        }

        .game-thumb-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .game-thumb-placeholder {
            font-size: 1.5rem;
        }

        .editable-title {
            font-weight: 700;
            border: 2px solid transparent;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: var(--transition);
            display: inline-block;
            min-width: 150px;
        }

        .editable-title:hover {
            background: #EDF2F7;
            border-color: #CBD5E0;
        }

        .editable-title:focus {
            background: #FFFFFF;
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }

        .category-select-inline {
            padding: 6px 10px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            border: 2px solid #CBD5E0;
            border-radius: 8px;
            background: #FFFFFF;
            outline: none;
            cursor: pointer;
        }

        .category-select-inline:focus {
            border-color: var(--primary);
        }

        /* Toggles styling */
        .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #CBD5E0;
            border: 2px solid var(--text);
            transition: .3s;
            border-radius: 34px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: var(--text);
            transition: .3s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--secondary);
        }

        input:checked + .slider:before {
            transform: translateX(24px);
            background-color: #FFFFFF;
        }

        /* Star Button */
        .btn-star {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #CBD5E0;
            transition: var(--transition);
            outline: none;
        }

        .btn-star.featured {
            color: #F59E0B;
            text-shadow: 0 0 2px rgba(245,158,11,0.3);
        }

        .btn-star:hover {
            transform: scale(1.2);
        }

        /* Actions Column */
        .action-buttons {
            display: flex;
            gap: 10px;
        }

        .btn-action {
            border: 2px solid var(--text);
            border-radius: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
            background: #FFFFFF;
            font-size: 1rem;
            outline: none;
        }

        .btn-action:active {
            transform: translateY(1px);
            box-shadow: 0 1px 0px var(--text);
        }

        .btn-action-edit {
            background: #EBF8FF;
            color: #2B6CB0;
        }

        .btn-action-edit:hover {
            background: #BEE3F8;
        }

        .btn-action-upload {
            background: #EFAF8D;
            color: #7B341E;
        }

        .btn-action-upload:hover {
            background: #FFD4C0;
        }

        /* Modal Overlay and Card */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(45, 55, 72, 0.6);
            backdrop-filter: blur(4px);
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: 0 12px 0px var(--text);
            width: 100%;
            max-width: 550px;
            display: flex;
            flex-direction: column;
            animation: modalSlide 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes modalSlide {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
            padding: 20px 25px;
            border-bottom: var(--border-style);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #FFFBF4;
        }

        .modal-header h2 {
            font-family: 'Fredoka', cursive;
            font-size: 1.6rem;
            color: var(--primary);
        }

        .btn-close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text);
            transition: var(--transition);
        }

        .btn-close-modal:hover {
            color: var(--primary);
            transform: scale(1.1);
        }

        .modal-body {
            padding: 25px;
            overflow-y: auto;
            max-height: calc(100vh - 150px);
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        .form-group select, .form-group input {
            width: 100%;
            padding: 10px 12px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.95rem;
            border: 2px solid var(--text);
            border-radius: 8px;
            outline: none;
            background: var(--bg);
        }

        .form-group select:focus, .form-group input:focus {
            border-color: var(--primary);
            background: #FFFFFF;
        }

        .form-help {
            display: block;
            color: var(--text-light);
            margin-top: 5px;
            font-weight: 700;
            font-size: 0.8rem;
        }

        .modal-thumb-preview-container {
            width: 120px;
            height: 80px;
            border-radius: 12px;
            border: 3px solid var(--text);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #EDF2F7;
            margin-top: 10px;
        }

        .modal-thumb-preview-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 15px;
            margin-top: 25px;
        }

        .btn-modal {
            padding: 10px 20px;
            font-family: 'Fredoka', cursive;
            font-size: 1rem;
            border: 2px solid var(--text);
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
            font-weight: bold;
        }

        .btn-modal:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        .btn-modal-cancel {
            background: #EDF2F7;
            color: var(--text);
        }

        .btn-modal-cancel:hover {
            background: #E2E8F0;
        }

        .btn-modal-save {
            background: var(--primary);
            color: #FFFFFF;
        }

        .btn-modal-save:hover {
            background: #FF8552;
        }

        .modal-alert-box {
            margin-bottom: 20px;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 700;
            display: none;
        }

        .alert-success {
            background: #DEF7EC;
            border: 2px solid #03543F;
            color: #03543F;
        }

        .alert-error {
            background: #FDE8E8;
            border: 2px solid #9B1C1C;
            color: #9B1C1C;
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
            <li><a href="dashboard.php">Dashboard</a></li>
            <li><a href="ads-manager.php">Ad Slots</a></li>
            <li class="active"><a href="games-manager.php">Games Manager</a></li>
            <li><a href="analytics.php">Analytics</a></li>
            <li><a href="settings.php">Settings</a></li>
        </ul>
        <button id="logoutBtn" class="btn-logout-sidebar">LOGOUT</button>
    </div>

    <!-- Main Workspace -->
    <div class="main-content">
        <div class="header">
            <h1>🎮 Games Manager</h1>
            <p>Manage all games, configure status, featuring, inline details, and upload customized thumbnail artwork.</p>
        </div>

        <!-- Stats Panel -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-num" id="statTotal"><?php echo $totalGames; ?></div>
                <div class="stat-label">Total Games</div>
            </div>
            <div class="stat-card">
                <div class="stat-num" id="statActive"><?php echo $activeGames; ?></div>
                <div class="stat-label">Active</div>
            </div>
            <div class="stat-card">
                <div class="stat-num" id="statFeatured"><?php echo $featuredGames; ?></div>
                <div class="stat-label">Featured</div>
            </div>
            <div class="stat-card">
                <div class="stat-num" id="statPlays"><?php echo $totalPlays; ?></div>
                <div class="stat-label">Total Plays</div>
            </div>
        </div>

        <!-- Toolbar Bar (Filters & Bulk Actions) -->
        <div class="toolbar-container">
            <div class="filter-bar">
                <input type="text" id="searchInput" placeholder="🔍 Search games by title...">
                <select id="categoryFilter">
                    <option value="">All Categories</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?php echo htmlspecialchars($cat); ?>"><?php echo htmlspecialchars($cat); ?></option>
                    <?php endforeach; ?>
                </select>
                <select id="statusFilter">
                    <option value="">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>
            <div class="bulk-bar">
                <button id="btnActivateAll" class="btn-bulk btn-bulk-activate">✅ Activate All</button>
                <button id="btnDeactivateAll" class="btn-bulk btn-bulk-deactivate">❌ Deactivate All</button>
                <button id="btnFeatureTop4" class="btn-bulk btn-bulk-feature">⭐ Feature Top 4</button>
            </div>
        </div>

        <!-- Table Panel -->
        <div class="table-card">
            <div class="table-responsive">
                <table class="games-table" id="gamesTable">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 90px; text-align: center;">Thumbnail</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th style="width: 100px; text-align: center;">Status</th>
                            <th style="width: 100px; text-align: center;">Featured</th>
                            <th style="width: 100px; text-align: center;">Plays</th>
                            <th style="width: 120px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="gamesTableBody">
                        <tr>
                            <td colspan="8" style="text-align: center; font-weight: 700; padding: 30px;">Loading games...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Edit Modal Dialog -->
    <div id="editModal" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h2>✏️ Edit Game</h2>
                <button id="modalCloseBtn" class="btn-close-modal">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-alert-box" id="modalAlert"></div>
                <form id="editGameForm">
                    <input type="hidden" id="modalGameId">
                    
                    <div class="form-group">
                        <label for="modalGameTitle">Game Title</label>
                        <input type="text" id="modalGameTitle" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="modalGameCategory">Category</label>
                        <select id="modalGameCategory" required>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo htmlspecialchars($cat); ?>"><?php echo htmlspecialchars($cat); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="modalGameThumbnail">Thumbnail Path</label>
                        <input type="text" id="modalGameThumbnail" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Thumbnail Image Preview</label>
                        <div class="modal-thumb-preview-container">
                            <img id="modalThumbPreview" src="" alt="Preview" style="display:none;">
                            <div id="modalThumbFallback" class="game-thumb-placeholder">🎮</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="modalFileUpload">Upload New Thumbnail</label>
                        <input type="file" id="modalFileUpload" accept="image/*">
                        <small class="form-help">Maximum size: 2MB. Format: JPG, PNG, GIF, WEBP</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="modalGameSeoTitle">Game SEO Title (Optional)</label>
                        <input type="text" id="modalGameSeoTitle" placeholder="Custom SEO Title Tag">
                        <small class="form-help">Custom title for the game player page. Default: Playing [Game Title] — [Site Name]</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="modalGameSeoDesc">Game SEO Description (Optional)</label>
                        <textarea id="modalGameSeoDesc" maxlength="250" placeholder="Custom SEO Meta Description..."></textarea>
                        <small class="form-help">Custom meta description for the game player page. Default: site-wide SEO description</small>
                    </div>

                    <div class="form-row form-row-split" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label for="modalGameSeoKeywords">Game SEO Keywords (Optional)</label>
                            <input type="text" id="modalGameSeoKeywords" placeholder="mario clone, platformer, run game">
                            <small class="form-help">Game-specific keywords separated by commas.</small>
                        </div>
                        <div class="form-group">
                            <label for="modalGameRobotsSelect">Game Robots Meta Tag</label>
                            <select id="modalGameRobotsSelect">
                                <option value="default">Use Site Default</option>
                                <option value="index, follow">index, follow (Allow Indexing)</option>
                                <option value="noindex, nofollow">noindex, nofollow (Block Indexing)</option>
                            </select>
                            <small class="form-help">Override site-wide robots setting for this game.</small>
                        </div>
                    </div>

                    <!-- SEO Quality Health Badge -->
                    <div class="seo-health-card" style="background: #F7FAFC; border: 2px solid #E2E8F0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="font-weight: 800; font-size: 0.9rem; margin-bottom: 8px; color: var(--text);">📋 SEO Quality Indicator</div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <span id="seoHealthTitleBadge" class="game-header__category" style="font-size: 0.75rem; padding: 4px 8px; height: auto; border: 2px solid #2D3748; background-color: #4ECDC4; color: white;">Title: Good</span>
                            <span id="seoHealthDescBadge" class="game-header__category" style="font-size: 0.75rem; padding: 4px 8px; height: auto; border: 2px solid #2D3748; background-color: #4ECDC4; color: white;">Description: Good</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" id="modalCancelBtn" class="btn-modal btn-modal-cancel">✕ Close</button>
                        <button type="submit" class="btn-modal btn-modal-save">💾 Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Hidden Input for File Picker triggered directly from the table -->
    <input type="file" id="directFilePicker" accept="image/*" style="display: none;">

    <script>
        // Array of categories rendered from server-side PHP to use in JS
        const gameCategories = <?php echo json_encode($categories); ?>;
        let allGames = [];

        document.addEventListener('DOMContentLoaded', function() {
            // Load games data on launch
            loadGames();

            // Set up search and filter callbacks
            document.getElementById('searchInput').addEventListener('input', filterGames);
            document.getElementById('categoryFilter').addEventListener('change', filterGames);
            document.getElementById('statusFilter').addEventListener('change', filterGames);

            // Set up logout handler
            document.getElementById('logoutBtn').addEventListener('click', function() {
                fetch('api/logout.php', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = 'index.php';
                    }
                });
            });

            // Set up bulk action triggers
            document.getElementById('btnActivateAll').addEventListener('click', () => {
                handleBulkAction('activate_all', 'Are you sure you want to activate ALL games?');
            });
            document.getElementById('btnDeactivateAll').addEventListener('click', () => {
                handleBulkAction('deactivate_all', 'Are you sure you want to deactivate ALL games?');
            });
            document.getElementById('btnFeatureTop4').addEventListener('click', () => {
                handleBulkAction('feature_top4', 'Are you sure you want to feature the first 4 games and unfeature all others?');
            });

            // Set up Modal listeners
            document.getElementById('modalCloseBtn').addEventListener('click', closeEditModal);
            document.getElementById('modalCancelBtn').addEventListener('click', closeEditModal);
            
            // Set up SEO Real-time quality counters
            document.getElementById('modalGameSeoTitle').addEventListener('input', updateSeoHealthBadge);
            document.getElementById('modalGameSeoDesc').addEventListener('input', updateSeoHealthBadge);
            
            // Close modal when clicking outside card
            document.getElementById('editModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeEditModal();
                }
            });

            // Preview local image selection in modal
            document.getElementById('modalFileUpload').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        showModalAlert('error', 'File size exceeds maximum limit of 2MB');
                        this.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const preview = document.getElementById('modalThumbPreview');
                        const fallback = document.getElementById('modalThumbFallback');
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        fallback.style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Handle Modal Form Submission
            document.getElementById('editGameForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const gameId = document.getElementById('modalGameId').value;
                const title = document.getElementById('modalGameTitle').value.trim();
                const category = document.getElementById('modalGameCategory').value;
                let thumbnail = document.getElementById('modalGameThumbnail').value.trim();
                const seo_title = document.getElementById('modalGameSeoTitle').value.trim();
                const seo_description = document.getElementById('modalGameSeoDesc').value.trim();
                const seo_keywords = document.getElementById('modalGameSeoKeywords').value.trim();
                const robots_meta = document.getElementById('modalGameRobotsSelect').value;
                const fileInput = document.getElementById('modalFileUpload');
                
                const saveBtn = this.querySelector('.btn-modal-save');
                const originalBtnText = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = 'Saving...';
                
                if (fileInput.files.length > 0) {
                    // Upload file first
                    const formData = new FormData();
                    formData.append('game_id', gameId);
                    formData.append('thumbnail', fileInput.files[0]);
                    
                    fetch('api/upload-thumbnail.php', {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    })
                    .then(res => {
                        if (res.status === 401) {
                            window.location.href = 'index.php';
                            return;
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.success) {
                            thumbnail = data.thumbnail_path;
                            saveMetadata(gameId, title, category, thumbnail, seo_title, seo_description, seo_keywords, robots_meta, saveBtn, originalBtnText);
                        } else {
                            showModalAlert('error', 'Thumbnail upload failed: ' + (data ? data.message : 'Unknown error'));
                            saveBtn.disabled = false;
                            saveBtn.innerHTML = originalBtnText;
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        showModalAlert('error', 'Network error uploading thumbnail.');
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = originalBtnText;
                    });
                } else {
                    saveMetadata(gameId, title, category, thumbnail, seo_title, seo_description, seo_keywords, robots_meta, saveBtn, originalBtnText);
                }
            });
            
            // Set up direct file picker listener for quick action upload
            let directUploadGameId = null;
            document.getElementById('directFilePicker').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file && directUploadGameId) {
                    if (file.size > 2 * 1024 * 1024) {
                        alert('File size exceeds maximum limit of 2MB');
                        this.value = '';
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('game_id', directUploadGameId);
                    formData.append('thumbnail', file);
                    
                    fetch('api/upload-thumbnail.php', {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    })
                    .then(res => {
                        if (res.status === 401) {
                            window.location.href = 'index.php';
                            return;
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.success) {
                            alert('Thumbnail uploaded successfully!');
                            loadGames(); // Refresh table
                        } else {
                            alert('Upload failed: ' + (data ? data.message : 'Unknown error'));
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Network error uploading thumbnail.');
                    });
                }
            });
        });

        // Load all games via AJAX
        function loadGames() {
            fetch('api/get-games.php', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    allGames = data;
                    updateStatsBar();
                    filterGames();
                } else {
                    document.getElementById('gamesTableBody').innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; font-weight: 700; color: #C53030;">Failed to parse games list.</td>
                        </tr>
                    `;
                }
            })
            .catch(err => {
                console.error(err);
                document.getElementById('gamesTableBody').innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; font-weight: 700; color: #C53030;">Network error loading games.</td>
                    </tr>
                `;
            });
        }

        // Render games list into table rows
        function renderTable(games) {
            const tbody = document.getElementById('gamesTableBody');
            tbody.innerHTML = '';
            
            if (games.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; font-weight: 700; color: var(--text-light); padding: 30px;">No games match your search criteria.</td>
                    </tr>
                `;
                return;
            }

            games.forEach((game, index) => {
                const tr = document.createElement('tr');
                tr.id = `row-${game.id}`;
                
                // Thumbnail cell
                const tdThumb = document.createElement('td');
                tdThumb.style.textAlign = 'center';
                const thumbContainer = document.createElement('div');
                thumbContainer.className = 'game-thumb-container';
                thumbContainer.style.margin = '0 auto';
                
                if (game.thumbnail && game.thumbnail.trim() !== '') {
                    const img = document.createElement('img');
                    img.className = 'game-thumb-img';
                    img.src = '../' + game.thumbnail + '?t=' + new Date().getTime(); // cache buster
                    img.alt = game.title;
                    img.onerror = () => {
                        thumbContainer.innerHTML = '<span class="game-thumb-placeholder">🎮</span>';
                    };
                    thumbContainer.appendChild(img);
                } else {
                    thumbContainer.innerHTML = '<span class="game-thumb-placeholder">🎮</span>';
                }
                tdThumb.appendChild(thumbContainer);
                
                // Title cell (inline editable)
                const tdTitle = document.createElement('td');
                const titleSpan = document.createElement('span');
                titleSpan.className = 'editable-title';
                titleSpan.contentEditable = true;
                titleSpan.innerText = game.title;
                titleSpan.addEventListener('blur', () => {
                    const newTitle = titleSpan.innerText.trim();
                    if (newTitle === '') {
                        titleSpan.innerText = game.title;
                        return;
                    }
                    if (newTitle !== game.title) {
                        saveInlineField(game.id, newTitle, game.category, game.thumbnail, titleSpan, game, 'title');
                    }
                });
                titleSpan.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        titleSpan.blur();
                    }
                });
                tdTitle.appendChild(titleSpan);
                
                // Category cell (inline dropdown select)
                const tdCat = document.createElement('td');
                const catSelect = document.createElement('select');
                catSelect.className = 'category-select-inline';
                
                // Fallback option in case current category is not in list
                if (game.category && !gameCategories.includes(game.category)) {
                    const opt = document.createElement('option');
                    opt.value = game.category;
                    opt.innerText = game.category;
                    opt.selected = true;
                    catSelect.appendChild(opt);
                }
                
                gameCategories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    opt.innerText = cat;
                    if (cat === game.category) opt.selected = true;
                    catSelect.appendChild(opt);
                });
                catSelect.addEventListener('change', () => {
                    const newCat = catSelect.value;
                    if (newCat !== game.category) {
                        saveInlineField(game.id, game.title, newCat, game.thumbnail, catSelect, game, 'category');
                    }
                });
                tdCat.appendChild(catSelect);
                
                // Status cell (toggle switch)
                const tdStatus = document.createElement('td');
                tdStatus.style.textAlign = 'center';
                const statusLabel = document.createElement('label');
                statusLabel.className = 'switch';
                const statusInput = document.createElement('input');
                statusInput.type = 'checkbox';
                statusInput.checked = (game.is_active === 1);
                const sliderSpan = document.createElement('span');
                sliderSpan.className = 'slider';
                statusLabel.appendChild(statusInput);
                statusLabel.appendChild(sliderSpan);
                tdStatus.appendChild(statusLabel);
                
                statusInput.addEventListener('change', () => {
                    const isChecked = statusInput.checked ? 1 : 0;
                    fetch('api/toggle-game.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({
                            game_id: game.id,
                            field: 'is_active',
                            value: isChecked
                        })
                    })
                    .then(res => {
                        if (res.status === 401) {
                            window.location.href = 'index.php';
                            return;
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.success) {
                            game.is_active = isChecked;
                            updateStatsBar();
                        } else {
                            alert('Failed to save status: ' + (data ? data.message : 'Unknown error'));
                            statusInput.checked = !statusInput.checked;
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        statusInput.checked = !statusInput.checked;
                    });
                });
                
                // Featured cell (Star button)
                const tdFeatured = document.createElement('td');
                tdFeatured.style.textAlign = 'center';
                const starBtn = document.createElement('button');
                starBtn.className = 'btn-star' + (game.is_featured === 1 ? ' featured' : '');
                starBtn.innerHTML = game.is_featured === 1 ? '★' : '☆';
                tdFeatured.appendChild(starBtn);
                
                starBtn.addEventListener('click', () => {
                    const isFeatured = game.is_featured === 1 ? 0 : 1;
                    fetch('api/toggle-game.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({
                            game_id: game.id,
                            field: 'is_featured',
                            value: isFeatured
                        })
                    })
                    .then(res => {
                        if (res.status === 401) {
                            window.location.href = 'index.php';
                            return;
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.success) {
                            game.is_featured = isFeatured;
                            starBtn.className = 'btn-star' + (isFeatured === 1 ? ' featured' : '');
                            starBtn.innerHTML = isFeatured === 1 ? '★' : '☆';
                            updateStatsBar();
                        } else {
                            alert('Failed to toggle featured state: ' + (data ? data.message : 'Unknown error'));
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    });
                });
                
                // Plays cell
                const tdPlays = document.createElement('td');
                tdPlays.style.textAlign = 'center';
                tdPlays.innerHTML = `<span style="font-weight:700;">👁️ ${game.play_count}</span>`;
                
                // Actions cell
                const tdActions = document.createElement('td');
                const btnContainer = document.createElement('div');
                btnContainer.className = 'action-buttons';
                
                // Edit button
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn-action btn-action-edit';
                btnEdit.title = 'Edit Metadata';
                btnEdit.innerHTML = '✏️';
                btnEdit.addEventListener('click', () => openEditModal(game));
                
                // Upload button
                const btnUpload = document.createElement('button');
                btnUpload.className = 'btn-action btn-action-upload';
                btnUpload.title = 'Upload Thumbnail';
                btnUpload.innerHTML = '🖼️';
                btnUpload.addEventListener('click', () => {
                    const filePicker = document.getElementById('directFilePicker');
                    document.getElementById('directFilePicker').value = '';
                    directUploadGameId = game.id;
                    filePicker.click();
                });
                
                btnContainer.appendChild(btnEdit);
                btnContainer.appendChild(btnUpload);
                tdActions.appendChild(btnContainer);

                // Add all columns to row
                tr.appendChild(document.createRange().createContextualFragment(`<td>${index + 1}</td>`));
                tr.appendChild(tdThumb);
                tr.appendChild(tdTitle);
                tr.appendChild(tdCat);
                tr.appendChild(tdStatus);
                tr.appendChild(tdFeatured);
                tr.appendChild(tdPlays);
                tr.appendChild(tdActions);
                
                tbody.appendChild(tr);
            });
        }

        // Save inline modified inputs
        function saveInlineField(gameId, title, category, thumbnail, element, gameObj, fieldType) {
            fetch('api/update-game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    game_id: gameId,
                    title: title,
                    category: category,
                    thumbnail: thumbnail,
                    seo_title: gameObj.seo_title || '',
                    seo_description: gameObj.seo_description || ''
                })
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.success) {
                    gameObj.title = title;
                    gameObj.category = category;
                    gameObj.thumbnail = thumbnail;
                    
                    // Flash element green briefly to show saving success
                    element.style.outline = '3px solid var(--secondary)';
                    setTimeout(() => { element.style.outline = ''; }, 800);
                } else {
                    alert('Error saving game: ' + (data ? data.message : 'Unknown error'));
                    if (fieldType === 'title') {
                        element.innerText = gameObj.title;
                    } else if (fieldType === 'category') {
                        element.value = gameObj.category;
                    }
                }
            })
            .catch(err => {
                console.error(err);
                alert('Network error while saving changes.');
                if (fieldType === 'title') {
                    element.innerText = gameObj.title;
                } else if (fieldType === 'category') {
                    element.value = gameObj.category;
                }
            });
        }

        // Live filters (Search + Category + Status)
        function filterGames() {
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            const category = document.getElementById('categoryFilter').value;
            const status = document.getElementById('statusFilter').value;
            
            const filtered = allGames.filter(game => {
                const matchesSearch = game.title.toLowerCase().includes(query) || game.slug.toLowerCase().includes(query);
                const matchesCategory = category === '' || game.category === category;
                const matchesStatus = status === '' || 
                    (status === 'active' && game.is_active === 1) || 
                    (status === 'inactive' && game.is_active === 0);
                
                return matchesSearch && matchesCategory && matchesStatus;
            });
            
            renderTable(filtered);
        }

        // Recalculate and render stats panel locally
        function updateStatsBar() {
            const total = allGames.length;
            const active = allGames.filter(g => g.is_active === 1).length;
            const featured = allGames.filter(g => g.is_featured === 1).length;
            const plays = allGames.reduce((sum, g) => sum + (g.play_count || 0), 0);
            
            document.getElementById('statTotal').innerText = total;
            document.getElementById('statActive').innerText = active;
            document.getElementById('statFeatured').innerText = featured;
            document.getElementById('statPlays').innerText = plays;
        }

        // Bulk action handler
        function handleBulkAction(actionName, confirmMsg) {
            if (!confirm(confirmMsg)) return;
            
            fetch('api/bulk-games.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ action: actionName })
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.success) {
                    alert(`Bulk action successful! Affected DB operations: ${data.affected}`);
                    loadGames(); // Refresh entire list
                } else {
                    alert('Error performing bulk action: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                console.error(err);
                alert('Network error while running bulk operations.');
            });
        }

        // Edit Modal Flow
        function openEditModal(game) {
            document.getElementById('modalGameId').value = game.id;
            document.getElementById('modalGameTitle').value = game.title;
            document.getElementById('modalGameThumbnail').value = game.thumbnail;
            document.getElementById('modalGameCategory').value = game.category;
            document.getElementById('modalGameSeoTitle').value = game.seo_title || '';
            document.getElementById('modalGameSeoDesc').value = game.seo_description || '';
            document.getElementById('modalGameSeoKeywords').value = game.seo_keywords || '';
            document.getElementById('modalGameRobotsSelect').value = game.robots_meta || 'default';
            
            // Run health check initially
            updateSeoHealthBadge();
            
            // Display preview
            const preview = document.getElementById('modalThumbPreview');
            const fallback = document.getElementById('modalThumbFallback');
            if (game.thumbnail && game.thumbnail.trim() !== '') {
                preview.src = '../' + game.thumbnail + '?t=' + new Date().getTime();
                preview.style.display = 'block';
                fallback.style.display = 'none';
            } else {
                preview.style.display = 'none';
                fallback.style.display = 'block';
            }
            
            // Clean up inputs & alerts
            document.getElementById('modalFileUpload').value = '';
            document.getElementById('modalAlert').style.display = 'none';
            
            document.getElementById('editModal').classList.add('active');
        }

        function closeEditModal() {
            document.getElementById('editModal').classList.remove('active');
        }

        function showModalAlert(type, msg) {
            const box = document.getElementById('modalAlert');
            box.className = `modal-alert-box alert-${type}`;
            box.innerText = msg;
            box.style.display = 'block';
        }

        // Submits metadata changes
        function saveMetadata(gameId, title, category, thumbnail, seo_title, seo_description, seo_keywords, robots_meta, saveBtn, originalBtnText) {
            fetch('api/update-game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    game_id: gameId,
                    title: title,
                    category: category,
                    thumbnail: thumbnail,
                    seo_title: seo_title,
                    seo_description: seo_description,
                    seo_keywords: seo_keywords,
                    robots_meta: robots_meta
                })
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
                
                if (data && data.success) {
                    showModalAlert('success', '✅ Game settings saved successfully!');
                    setTimeout(() => {
                        closeEditModal();
                        loadGames();
                    }, 1000);
                } else {
                    showModalAlert('error', 'Error saving settings: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                console.error(err);
                showModalAlert('error', 'Network error occurred while saving game.');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
            });
        }

        // Live calculation and formatting of the SEO indicators
        function updateSeoHealthBadge() {
            const titleInput = document.getElementById('modalGameSeoTitle');
            const descInput = document.getElementById('modalGameSeoDesc');
            
            const titleVal = titleInput.value.trim();
            const descVal = descInput.value.trim();
            
            const titleBadge = document.getElementById('seoHealthTitleBadge');
            const descBadge = document.getElementById('seoHealthDescBadge');
            
            // Check Title Length: Recommend 40-60 characters
            if (titleVal === '') {
                titleBadge.innerText = 'Title: Default (Good)';
                titleBadge.style.backgroundColor = '#4ECDC4';
            } else if (titleVal.length >= 40 && titleVal.length <= 60) {
                titleBadge.innerText = `Title: Good (${titleVal.length} chars)`;
                titleBadge.style.backgroundColor = '#4ECDC4';
            } else {
                titleBadge.innerText = `Title: Adjust Length (${titleVal.length} chars)`;
                titleBadge.style.backgroundColor = '#FF6B35';
            }
            
            // Check Description Length: Recommend 100-160 characters
            if (descVal === '') {
                descBadge.innerText = 'Description: Default (Good)';
                descBadge.style.backgroundColor = '#4ECDC4';
            } else if (descVal.length >= 100 && descVal.length <= 160) {
                descBadge.innerText = `Desc: Ideal (${descVal.length} chars)`;
                descBadge.style.backgroundColor = '#4ECDC4';
            } else {
                descBadge.innerText = `Desc: Adjust Length (${descVal.length} chars)`;
                descBadge.style.backgroundColor = '#FF6B35';
            }
        }
    </script>
</body>
</html>
