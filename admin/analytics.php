<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

// Enforce login
requireLogin();

$adminUsername = isset($_SESSION['admin_username']) ? sanitizeInput($_SESSION['admin_username']) : 'Admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard - KidsGameZone</title>
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
            position: relative;
        }

        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 20px;
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

        .toolbar {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .select-range, .btn-refresh {
            padding: 10px 18px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            border: 3px solid var(--text);
            border-radius: 12px;
            outline: none;
            background: var(--card-bg);
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: var(--transition);
        }

        .btn-refresh {
            background: var(--accent);
            font-family: 'Fredoka', cursive;
        }

        .select-range:active, .btn-refresh:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        /* Stats Cards Row */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: 0 6px 0px var(--text);
            padding: 20px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 120px;
            overflow: hidden;
        }

        .stat-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .stat-label {
            font-weight: 700;
            color: var(--text-light);
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }

        .stat-icon {
            font-size: 1.8rem;
        }

        .stat-num {
            font-family: 'Fredoka', cursive;
            font-size: 2.2rem;
            color: var(--text);
        }

        /* Charts Layout Grid */
        .charts-row-full {
            margin-bottom: 35px;
        }

        .charts-grid-split {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
            margin-bottom: 35px;
        }

        @media (min-width: 1024px) {
            .charts-grid-split {
                grid-template-columns: 3fr 2fr;
            }
        }

        /* Chart Card Containers */
        .chart-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            padding: 25px;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .chart-title {
            font-family: 'Fredoka', cursive;
            font-size: 1.4rem;
            color: var(--text);
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* Tooltip style */
        #chart-tooltip {
            position: absolute;
            display: none;
            background: rgba(45, 55, 72, 0.95);
            backdrop-filter: blur(2px);
            color: #FFFFFF;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            border: 2px solid #FFFFFF;
            font-family: 'Nunito', sans-serif;
            text-align: center;
        }

        /* Ad performance table styling */
        .ad-table-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin-bottom: 40px;
            padding: 25px;
        }

        .table-responsive {
            overflow-x: auto;
            width: 100%;
            margin-top: 15px;
        }

        .ad-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .ad-table th, .ad-table td {
            padding: 14px 18px;
            border-bottom: 2px solid #E2E8F0;
            font-size: 0.95rem;
            vertical-align: middle;
        }

        .ad-table th {
            background: #FFFBF4;
            font-family: 'Fredoka', cursive;
            font-size: 1.1rem;
            color: var(--text);
            border-bottom: var(--border-style);
            cursor: pointer;
            user-select: none;
            position: relative;
        }

        .ad-table th.sortable:hover {
            background: #FFF4DF;
        }

        .sort-icon {
            display: inline-block;
            margin-left: 5px;
            font-size: 0.85rem;
            color: var(--primary);
        }

        .ad-table tbody tr:last-child td {
            border-bottom: none;
        }

        .ad-table tbody tr:hover {
            background: #FFFDF9;
        }

        .ctr-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
            border: 2px solid transparent;
            text-align: center;
        }

        .ctr-green {
            background: #DEF7EC;
            color: #03543F;
            border-color: #03543F;
        }

        .ctr-yellow {
            background: #FEF3C7;
            color: #92400E;
            border-color: #92400E;
        }

        .ctr-red {
            background: #FDE8E8;
            color: #9B1C1C;
            border-color: #9B1C1C;
        }

        /* Loading Spinner Overlay */
        .loader-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 249, 240, 0.85);
            backdrop-filter: blur(4px);
            z-index: 150;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Fredoka', cursive;
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            border-radius: var(--border-radius);
        }

        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #E2E8F0;
            border-top: 5px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Legend container for category chart */
        .category-legend {
            margin-top: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.85rem;
            font-weight: 700;
        }

        .legend-color-box {
            width: 14px;
            height: 14px;
            border-radius: 4px;
            margin-right: 8px;
            border: 1px solid var(--text);
            flex-shrink: 0;
        }

        .legend-label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .legend-val {
            color: var(--text-light);
            margin-left: 5px;
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
            <li><a href="games-manager.php">Games Manager</a></li>
            <li class="active"><a href="analytics.php">Analytics</a></li>
            <li><a href="settings.php">Settings</a></li>
        </ul>
        <button id="logoutBtn" class="btn-logout-sidebar">LOGOUT</button>
    </div>

    <!-- Main Workspace -->
    <div class="main-content">
        <div class="header-container">
            <div class="header">
                <h1>📊 Analytics Dashboard</h1>
                <p>Track player engagement metrics, game visual counts, and monitor ad revenue configurations.</p>
            </div>
            
            <div class="toolbar">
                <select id="daysSelector" class="select-range">
                    <option value="7">Last 7 Days</option>
                    <option value="30" selected>Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                </select>
                <button id="btnRefresh" class="btn-refresh">🔄 Refresh</button>
            </div>
        </div>

        <!-- Global Spinner Overlay -->
        <div id="loadingOverlay" class="loader-overlay" style="display: none;">
            <div class="spinner"></div>
            <div>Processing Report...</div>
        </div>

        <!-- Overview Stat Cards -->
        <div class="stats-grid">
            <div class="stat-card" style="background-color: #FFF9F0;">
                <div class="stat-card-header">
                    <span class="stat-label">Total Plays</span>
                    <span class="stat-icon">🎮</span>
                </div>
                <div class="stat-num" id="cardTotalPlays">0</div>
            </div>
            <div class="stat-card" style="background-color: #FFFBF4;">
                <div class="stat-card-header">
                    <span class="stat-label">Today's Plays</span>
                    <span class="stat-icon">📅</span>
                </div>
                <div class="stat-num" id="cardTodayPlays">0</div>
            </div>
            <div class="stat-card" style="background-color: #F7FAFC;">
                <div class="stat-card-header">
                    <span class="stat-label">Ad Impressions</span>
                    <span class="stat-icon">👁️</span>
                </div>
                <div class="stat-num" id="cardAdImpressions">0</div>
            </div>
            <div class="stat-card" style="background-color: #DEF7EC;">
                <div class="stat-card-header">
                    <span class="stat-label">Ad Clicks</span>
                    <span class="stat-icon">👆</span>
                </div>
                <div class="stat-num" id="cardAdClicks">0</div>
            </div>
            <div class="stat-card" style="background-color: #FDE8E8;">
                <div class="stat-card-header">
                    <span class="stat-label">Ad Skips</span>
                    <span class="stat-icon">⏭️</span>
                </div>
                <div class="stat-num" id="cardAdSkips">0</div>
            </div>
            <div class="stat-card" style="background-color: #EBF8FF;">
                <div class="stat-card-header">
                    <span class="stat-label">Active Games</span>
                    <span class="stat-icon">✅</span>
                </div>
                <div class="stat-num" id="cardActiveGames">0</div>
            </div>
        </div>

        <!-- Chart 1: Line Chart -->
        <div class="charts-row-full">
            <div class="chart-card">
                <h3 class="chart-title">Daily Game Plays – <span id="lineChartSub">Last 30 Days</span></h3>
                <div style="position: relative; width: 100%;">
                    <canvas id="canvasDailyPlays" style="display: block; width: 100%; height: 250px;"></canvas>
                </div>
            </div>
        </div>

        <!-- Charts Grid (Split Bar Chart / Donut Chart) -->
        <div class="charts-grid-split">
            <!-- Chart 2: Top 10 Games -->
            <div class="chart-card">
                <h3 class="chart-title">🏆 Top 10 Most Played Games</h3>
                <div style="position: relative; width: 100%;">
                    <canvas id="canvasTopGames" style="display: block; width: 100%; height: 350px;"></canvas>
                </div>
            </div>

            <!-- Chart 4: Categories Donut Chart -->
            <div class="chart-card" style="align-items: center;">
                <h3 class="chart-title" style="width: 100%;">🎯 Plays by Category</h3>
                <div style="position: relative; width: 300px; height: 300px; display: flex; justify-content: center; align-items: center;">
                    <canvas id="canvasCategoryPlays" width="300" height="300" style="display: block; width: 300px; height: 300px;"></canvas>
                </div>
                <div id="categoryLegend" class="category-legend" style="width: 100%;"></div>
            </div>
        </div>

        <!-- Chart 3: Ad Performance Table -->
        <div class="ad-table-card">
            <h3 class="chart-title">📢 Ad Slot Performance</h3>
            <div class="table-responsive">
                <table class="ad-table" id="adPerformanceTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="slot">Slot Name <span class="sort-icon"></span></th>
                            <th class="sortable" data-sort="impressions">Impressions <span class="sort-icon"></span></th>
                            <th class="sortable" data-sort="clicks">Clicks <span class="sort-icon"></span></th>
                            <th class="sortable" data-sort="skips">Skips <span class="sort-icon"></span></th>
                            <th class="sortable" data-sort="ctr">CTR% <span class="sort-icon"></span></th>
                            <th class="sortable" data-sort="skip_rate">Skip Rate% <span class="sort-icon"></span></th>
                        </tr>
                    </thead>
                    <tbody id="adPerformanceBody">
                        <tr>
                            <td colspan="6" style="text-align: center; font-weight: 700; padding: 25px;">Loading metrics...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Chart hover tooltip overlay -->
    <div id="chart-tooltip"></div>

    <script>
        // Design System Colors Palette
        const palette = ['#FF6B35', '#4ECDC4', '#FFE66D', '#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#84CC16'];
        
        // State variables
        let rawStatsData = null;
        let adStatsData = [];
        let currentSort = { column: 'impressions', direction: 'desc' };

        document.addEventListener('DOMContentLoaded', function() {
            // Initial data fetch
            fetchReportData();

            // Refetch trigger hooks
            document.getElementById('daysSelector').addEventListener('change', fetchReportData);
            document.getElementById('btnRefresh').addEventListener('click', fetchReportData);

            // Side bar Logout trigger
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

            // Set up sortable table header callbacks
            document.querySelectorAll('#adPerformanceTable th.sortable').forEach(th => {
                th.addEventListener('click', function() {
                    const columnKey = this.dataset.sort;
                    if (currentSort.column === columnKey) {
                        currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
                    } else {
                        currentSort.column = columnKey;
                        currentSort.direction = 'desc';
                    }
                    sortAndRenderAdTable();
                });
            });

            // Crisp canvas scaling on resize
            window.addEventListener('resize', function() {
                if (rawStatsData) {
                    renderAllVisualizations();
                }
            });
        });

        // Pull analytics from endpoint
        function fetchReportData() {
            const overlay = document.getElementById('loadingOverlay');
            overlay.style.display = 'flex';

            const days = document.getElementById('daysSelector').value;
            
            // Adjust subtitle of line chart
            document.getElementById('lineChartSub').innerText = `Last ${days} Days`;

            fetch(`api/get-stats.php?days=${days}`, {
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
                overlay.style.display = 'none';
                
                if (data && data.overview) {
                    rawStatsData = data;
                    adStatsData = data.ad_stats || [];
                    
                    // Render Cards and Charts
                    populateOverviewCards(data.overview);
                    renderAllVisualizations();
                } else {
                    alert('Failed to load analytics data. Please refresh.');
                }
            })
            .catch(err => {
                overlay.style.display = 'none';
                console.error(err);
                alert('An error occurred while loading analytics. Please check connection and try again.');
            });
        }

        // Render card numbers
        function populateOverviewCards(overview) {
            document.getElementById('cardTotalPlays').innerText = overview.total_plays.toLocaleString();
            document.getElementById('cardTodayPlays').innerText = overview.today_plays.toLocaleString();
            document.getElementById('cardAdImpressions').innerText = overview.total_ad_impressions.toLocaleString();
            document.getElementById('cardAdClicks').innerText = overview.total_ad_clicks.toLocaleString();
            document.getElementById('cardAdSkips').innerText = overview.total_ad_skips.toLocaleString();
            document.getElementById('cardActiveGames').innerText = overview.active_games.toLocaleString();
        }

        // Re-scale and re-render visual charts
        function renderAllVisualizations() {
            if (!rawStatsData) return;

            // Render Chart 1: Line Chart
            initPlaysLineChart(rawStatsData.daily_plays || []);

            // Render Chart 2: Top Games Horizontal Bar Chart
            initTopGamesBarChart(rawStatsData.top_games || []);

            // Render Chart 4: Category Donut Chart
            initCategoryPieChart(rawStatsData.category_plays || []);

            // Render Chart 3: Ad Performance Table
            sortAndRenderAdTable();
        }

        // High-DPI canvas correction helper
        function setupCanvasContext(canvas, width, height) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            return ctx;
        }

        // ----------------------------------------------------
        // Chart 1: Daily Plays Line Chart (Canvas)
        // ----------------------------------------------------
        function initPlaysLineChart(data) {
            const canvas = document.getElementById('canvasDailyPlays');
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = 250;
            
            const ctx = setupCanvasContext(canvas, width, height);

            const paddingLeft = 50;
            const paddingRight = 20;
            const paddingTop = 30;
            const paddingBottom = 40;

            const chartWidth = width;
            const chartHeight = height;

            // Find Maximum count
            let maxCount = 0;
            data.forEach(pt => { if (pt.count > maxCount) maxCount = pt.count; });
            if (maxCount === 0) maxCount = 10;
            
            // Clean rounding for clean Y-axis ticks
            const magnitude = Math.pow(10, Math.floor(Math.log10(maxCount)));
            const step = Math.ceil(maxCount / (4 * magnitude)) * magnitude;
            const maxVal = step * 4;

            // Draw gridlines and Y axis labels
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#718096';
            ctx.font = 'bold 11px Nunito';
            ctx.textAlign = 'right';
            
            for (let i = 0; i <= 4; i++) {
                const val = Math.round((maxVal / 4) * i);
                const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
                
                ctx.beginPath();
                ctx.moveTo(paddingLeft, y);
                ctx.lineTo(chartWidth - paddingRight, y);
                ctx.stroke();
                
                ctx.fillText(val, paddingLeft - 10, y + 4);
            }

            // Render Dates on X axis
            const days = parseInt(document.getElementById('daysSelector').value);
            const labelInterval = days === 7 ? 1 : (days === 30 ? 5 : 15);
            
            ctx.textAlign = 'center';
            ctx.fillStyle = '#718096';
            ctx.font = 'bold 10px Nunito';
            
            data.forEach((pt, index) => {
                const x = paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                if (index % labelInterval === 0 || index === data.length - 1) {
                    const dateObj = new Date(pt.date + 'T00:00:00');
                    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    ctx.fillText(formatted, x, chartHeight - paddingBottom + 20);
                }
            });

            // Draw charts line logic inside separate closure to manage hover redrawing
            function drawPlaysChart(hoverIndex) {
                // Clear entire context and redraw standard structure
                ctx.clearRect(0, 0, chartWidth, chartHeight);
                
                // Redraw Y-gridlines
                ctx.strokeStyle = '#E2E8F0';
                ctx.lineWidth = 1;
                ctx.fillStyle = '#718096';
                ctx.font = 'bold 11px Nunito';
                ctx.textAlign = 'right';
                for (let i = 0; i <= 4; i++) {
                    const val = Math.round((maxVal / 4) * i);
                    const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    ctx.beginPath();
                    ctx.moveTo(paddingLeft, y);
                    ctx.lineTo(chartWidth - paddingRight, y);
                    ctx.stroke();
                    ctx.fillText(val, paddingLeft - 10, y + 4);
                }

                // Redraw X-axis date labels
                ctx.textAlign = 'center';
                ctx.fillStyle = '#718096';
                ctx.font = 'bold 10px Nunito';
                data.forEach((pt, index) => {
                    const x = paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    if (index % labelInterval === 0 || index === data.length - 1) {
                        const dateObj = new Date(pt.date + 'T00:00:00');
                        const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        ctx.fillText(formatted, x, chartHeight - paddingBottom + 20);
                    }
                });

                if (data.length === 0) return;

                // 1. Draw Tracking Dashed Vertical Line on hover
                if (hoverIndex !== -1) {
                    const xHover = paddingLeft + (hoverIndex / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(xHover, paddingTop);
                    ctx.lineTo(xHover, chartHeight - paddingBottom);
                    ctx.strokeStyle = 'rgba(78, 205, 196, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.setLineDash([]); // reset
                }

                // 2. Draw Semi-transparent gradient area under line
                ctx.beginPath();
                ctx.moveTo(paddingLeft, chartHeight - paddingBottom);
                data.forEach((pt, index) => {
                    const x = paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    const y = chartHeight - paddingBottom - (pt.count / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    ctx.lineTo(x, y);
                });
                ctx.lineTo(paddingLeft + (chartWidth - paddingLeft - paddingRight), chartHeight - paddingBottom);
                ctx.closePath();
                
                const grad = ctx.createLinearGradient(0, paddingTop, 0, chartHeight - paddingBottom);
                grad.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
                grad.addColorStop(1, 'rgba(255, 107, 53, 0.0)');
                ctx.fillStyle = grad;
                ctx.fill();

                // 3. Draw Solid Line Path
                ctx.beginPath();
                data.forEach((pt, index) => {
                    const x = paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    const y = chartHeight - paddingBottom - (pt.count / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.strokeStyle = 'var(--primary)';
                ctx.lineWidth = 3;
                ctx.stroke();

                // 4. Draw standard points dots
                data.forEach((pt, index) => {
                    const x = paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    const y = chartHeight - paddingBottom - (pt.count / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.strokeStyle = 'var(--primary)';
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();
                });

                // 5. Highlight active hover point
                if (hoverIndex !== -1) {
                    const xHover = paddingLeft + (hoverIndex / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
                    const yHover = chartHeight - paddingBottom - (data[hoverIndex].count / maxVal) * (chartHeight - paddingTop - paddingBottom);
                    
                    ctx.beginPath();
                    ctx.arc(xHover, yHover, 7, 0, 2 * Math.PI);
                    ctx.fillStyle = 'var(--secondary)';
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 3;
                    ctx.fill();
                    ctx.stroke();
                }
            }

            // Draw line chart initially
            drawPlaysChart(-1);

            // Bind Mouse Hover events
            canvas.removeEventListener('mousemove', handleLineHover);
            canvas.removeEventListener('mouseleave', handleLineLeave);
            
            function handleLineHover(e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                
                let closestDist = Infinity;
                let closestIdx = -1;
                
                data.forEach((pt, index) => {
                    const x = paddingLeft + (index / (data.length - 1)) * (width - paddingLeft - paddingRight);
                    const dist = Math.abs(x - mouseX);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = index;
                    }
                });

                if (closestIdx !== -1 && closestDist < 25 && mouseX >= paddingLeft && mouseX <= width - paddingRight) {
                    const pt = data[closestIdx];
                    const x = paddingLeft + (closestIdx / (data.length - 1)) * (width - paddingLeft - paddingRight);
                    const y = chartHeight - paddingBottom - (pt.count / maxVal) * (chartHeight - paddingTop - paddingBottom);

                    // Position tooltip
                    const tooltip = document.getElementById('chart-tooltip');
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <div style="font-size: 0.8rem; font-weight: 700; color: #CBD5E0; margin-bottom: 3px;">
                            ${new Date(pt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style="font-size: 1.1rem;">🎮 plays: <strong>${pt.count}</strong></div>
                    `;
                    
                    // Center and place tooltip
                    tooltip.style.left = (rect.left + window.scrollX + x - tooltip.clientWidth / 2) + 'px';
                    tooltip.style.top = (rect.top + window.scrollY + y - tooltip.clientHeight - 15) + 'px';
                    
                    drawPlaysChart(closestIdx);
                } else {
                    document.getElementById('chart-tooltip').style.display = 'none';
                    drawPlaysChart(-1);
                }
            }

            function handleLineLeave() {
                document.getElementById('chart-tooltip').style.display = 'none';
                drawPlaysChart(-1);
            }

            canvas.addEventListener('mousemove', handleLineHover);
            canvas.addEventListener('mouseleave', handleLineLeave);
        }

        // ----------------------------------------------------
        // Chart 2: Top 10 Games Horizontal Bar Chart
        // ----------------------------------------------------
        function initTopGamesBarChart(games) {
            const canvas = document.getElementById('canvasTopGames');
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = 350;
            
            const ctx = setupCanvasContext(canvas, width, height);

            const paddingLeft = 160;
            const paddingRight = 45;
            const paddingTop = 20;
            const paddingBottom = 30;

            const chartWidth = width;
            const chartHeight = height;

            ctx.clearRect(0, 0, chartWidth, chartHeight);

            if (games.length === 0) {
                ctx.fillStyle = 'var(--text-light)';
                ctx.font = 'bold 16px Nunito';
                ctx.textAlign = 'center';
                ctx.fillText('No play counts recorded in this period.', chartWidth / 2, chartHeight / 2);
                return;
            }

            let maxCount = 0;
            games.forEach(g => { if (g.play_count > maxCount) maxCount = g.play_count; });
            if (maxCount === 0) maxCount = 10;

            const rowHeight = (chartHeight - paddingTop - paddingBottom) / 10;
            const barHeight = rowHeight * 0.65;

            // Draw Y Grid vertical background markers
            ctx.strokeStyle = '#EDF2F7';
            ctx.lineWidth = 1.5;
            ctx.fillStyle = '#718096';
            ctx.font = 'bold 10px Nunito';
            ctx.textAlign = 'center';
            
            for (let i = 0; i <= 4; i++) {
                const ratio = i / 4;
                const x = paddingLeft + ratio * (chartWidth - paddingLeft - paddingRight);
                const value = Math.round(ratio * maxCount);
                
                ctx.beginPath();
                ctx.moveTo(x, paddingTop);
                ctx.lineTo(x, chartHeight - paddingBottom);
                ctx.stroke();
                
                ctx.fillText(value, x, chartHeight - paddingBottom + 18);
            }

            // Draw horizontal bars
            games.forEach((game, index) => {
                const y = paddingTop + index * rowHeight + (rowHeight - barHeight) / 2;
                const barWidth = (game.play_count / maxCount) * (chartWidth - paddingLeft - paddingRight);
                const color = palette[index % palette.length];

                // Rounded bar outline helper
                drawRoundRect(ctx, paddingLeft, y, barWidth, barHeight, 6, color);
                
                // Draw bold thick border around bars
                ctx.strokeStyle = 'var(--text)';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Draw game titles on left
                ctx.fillStyle = 'var(--text)';
                ctx.font = 'bold 12px Nunito';
                ctx.textAlign = 'right';
                
                let title = game.title;
                if (title.length > 20) title = title.substring(0, 18) + '...';
                ctx.fillText(title, paddingLeft - 12, y + barHeight / 2 + 4);

                // Draw total plays values on right
                ctx.textAlign = 'left';
                ctx.font = 'bold 12px Fredoka';
                ctx.fillText(game.play_count.toLocaleString(), paddingLeft + barWidth + 8, y + barHeight / 2 + 4);
            });
        }

        // Rounded Rect Draw Method
        function drawRoundRect(ctx, x, y, width, height, radius, fillStyle) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + width, y, x + width, y + height, radius);
            ctx.arcTo(x + width, y + height, x, y + height, radius);
            ctx.arcTo(x, y + height, x, y, radius);
            ctx.arcTo(x, y, x + width, y, radius);
            ctx.closePath();
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        // ----------------------------------------------------
        // Chart 4: Category Pie/Donut Chart (Canvas)
        // ----------------------------------------------------
        function initCategoryPieChart(categories) {
            const canvas = document.getElementById('canvasCategoryPlays');
            const width = 300;
            const height = 300;
            
            const ctx = setupCanvasContext(canvas, width, height);
            ctx.clearRect(0, 0, width, height);

            const legendEl = document.getElementById('categoryLegend');
            legendEl.innerHTML = '';

            if (categories.length === 0) {
                // Draw empty circle
                ctx.beginPath();
                ctx.arc(width/2, height/2, 90, 0, 2*Math.PI);
                ctx.fillStyle = '#E2E8F0';
                ctx.fill();
                ctx.strokeStyle = '#A0AEC0';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = 'var(--text-light)';
                ctx.font = 'bold 14px Nunito';
                ctx.textAlign = 'center';
                ctx.fillText('No data available', width/2, height/2 + 5);
                return;
            }

            const total = categories.reduce((sum, c) => sum + c.count, 0);
            let startAngle = -0.5 * Math.PI;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 95;

            // Draw donut slices
            categories.forEach((cat, index) => {
                const percentage = cat.count / total;
                const sliceAngle = percentage * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;
                const color = palette[index % palette.length];

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                
                // Segment outline border
                ctx.strokeStyle = 'var(--text)';
                ctx.lineWidth = 3;
                ctx.stroke();

                startAngle = endAngle;

                // Render legend item details
                const percentText = (percentage * 100).toFixed(1);
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                legendItem.innerHTML = `
                    <span class="legend-color-box" style="background-color: ${color};"></span>
                    <span class="legend-label" title="${cat.category}">${cat.category}</span>
                    <span class="legend-val">(${cat.count} / ${percentText}%)</span>
                `;
                legendEl.appendChild(legendItem);
            });

            // Draw white center hole to create the Donut Chart visual
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.5, 0, 2*Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = 'var(--text)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // ----------------------------------------------------
        // Chart 3: Ad Performance Table (HTML / Sorting)
        // ----------------------------------------------------
        function sortAndRenderAdTable() {
            const col = currentSort.column;
            const isDesc = currentSort.direction === 'desc';
            const dir = isDesc ? -1 : 1;

            adStatsData.forEach(item => {
                item.ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
                item.skip_rate = item.impressions > 0 ? (item.skips / item.impressions) * 100 : 0;
            });

            adStatsData.sort((a, b) => {
                let valA = a[col];
                let valB = b[col];

                if (typeof valA === 'string') {
                    return valA.localeCompare(valB) * dir;
                }
                return (valA - valB) * dir;
            });

            renderAdTableBody();
            updateSortHeaders();
        }

        function renderAdTableBody() {
            const tbody = document.getElementById('adPerformanceBody');
            tbody.innerHTML = '';

            if (adStatsData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; font-weight:700; padding:25px;">No ad slot metrics available in this period.</td></tr>';
                return;
            }

            // Display mapping for ad slot names
            const slotMap = {
                pre_roll: 'Pre-Roll Slot Overlay',
                header_banner: 'Header Leaderboard (728x90)',
                sidebar_left: 'Left Sidebar Sky (160x600)',
                sidebar_right: 'Right Sidebar Box (300x250)',
                footer_banner: 'Footer Leaderboard (728x90)'
            };

            adStatsData.forEach(row => {
                const tr = document.createElement('tr');
                
                const slotTitle = slotMap[row.slot] || row.slot;
                const ctr = row.ctr;
                const skipRate = row.skip_rate;

                // CTR Badge styles
                let ctrClass = 'ctr-red';
                if (ctr > 2.0) ctrClass = 'ctr-green';
                else if (ctr >= 1.0) ctrClass = 'ctr-yellow';

                tr.innerHTML = `
                    <td style="font-weight: 700; color: var(--text);">${slotTitle}</td>
                    <td style="font-weight: 700;">${row.impressions.toLocaleString()}</td>
                    <td>${row.clicks.toLocaleString()}</td>
                    <td>${row.skips.toLocaleString()}</td>
                    <td>
                        <span class="ctr-badge ${ctrClass}">
                            ${ctr.toFixed(1)}%
                        </span>
                    </td>
                    <td style="font-weight: 700; color: var(--text-light);">${skipRate.toFixed(1)}%</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function updateSortHeaders() {
            document.querySelectorAll('#adPerformanceTable th.sortable').forEach(th => {
                const iconSpan = th.querySelector('.sort-icon');
                if (th.dataset.sort === currentSort.column) {
                    iconSpan.innerText = currentSort.direction === 'desc' ? ' ▼' : ' ▲';
                    th.style.background = '#FFF4DF';
                } else {
                    iconSpan.innerText = '';
                    th.style.background = '';
                }
            });
        }
    </script>
</body>
</html>
