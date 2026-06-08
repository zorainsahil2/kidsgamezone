<?php
require_once __DIR__ . '/includes/auth.php';

// Enforce authentication middleware
requireLogin();

$adminUsername = isset($_SESSION['admin_username']) ? sanitizeInput($_SESSION['admin_username']) : 'Admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ad Slots Manager - KidsGameZone</title>
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
            margin-bottom: 40px;
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

        /* Grid Layout for Cards */
        .ads-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
        }

        @media (min-width: 1024px) {
            .ads-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Card Styles */
        .ad-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            padding: 30px;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .ad-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .ad-card-title {
            font-family: 'Fredoka', cursive;
            font-size: 1.4rem;
            color: var(--text);
        }

        .ad-card-size {
            font-size: 0.85rem;
            font-weight: 700;
            background: #E2E8F0;
            padding: 4px 10px;
            border-radius: 8px;
            color: var(--text-light);
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

        .form-group textarea {
            width: 100%;
            height: 150px;
            padding: 12px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
            border: 2px solid var(--text);
            border-radius: 8px;
            outline: none;
            background: #F7FAFC;
            resize: vertical;
        }

        .form-group textarea:focus {
            border-color: var(--primary);
            background: #FFFFFF;
        }

        /* Custom Toggle Switch */
        .toggle-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 54px;
            height: 28px;
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
            height: 18px;
            width: 18px;
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
            transform: translateX(26px);
            background-color: #FFFFFF;
        }

        .card-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 10px;
        }

        .btn-save {
            padding: 10px 25px;
            font-family: 'Fredoka', cursive;
            font-size: 1.1rem;
            color: #FFFFFF;
            background: var(--primary);
            border: 2px solid var(--text);
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .btn-save:hover {
            background: #FF8552;
        }

        .btn-save:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        .alert-box {
            margin-top: 15px;
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9rem;
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

    <!-- Sidebar Menu -->
    <div class="sidebar">
        <div class="sidebar-logo">🎮 KidsGameZone</div>
        <div class="sidebar-profile">
            <span class="username">👤 <?php echo $adminUsername; ?></span>
        </div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.php">Dashboard</a></li>
            <li class="active"><a href="ads-manager.php">Ad Slots</a></li>
            <li><a href="games-manager.php">Games Manager</a></li>
            <li><a href="analytics.php">Analytics</a></li>
            <li><a href="settings.php">Settings</a></li>
        </ul>
        <button id="logoutBtn" class="btn-logout-sidebar">LOGOUT</button>
    </div>

    <!-- Main Workspace -->
    <div class="main-content">
        <div class="header">
            <h1>📢 Ad Slots Manager</h1>
            <p>Select ad networks, toggle active states, and update ad tags for each page position.</p>
        </div>

        <div id="adsContainer" class="ads-grid">
            <!-- Loaded dynamically via AJAX -->
        </div>
    </div>

    <script>
        // Mapping of key positions to readable titles and sizing templates
        const slotMetadata = {
            pre_roll: { title: "Pre-Roll Ad", size: "Fullscreen Overlay (Countdown)" },
            header_banner: { title: "Header Banner Ad", size: "Standard Leaderboard (728x90)" },
            sidebar_left: { title: "Left Sidebar Ad", size: "Skyscraper (160x600)" },
            sidebar_right: { title: "Right Sidebar Ad", size: "Medium Rectangle (300x250)" },
            footer_banner: { title: "Footer Banner Ad", size: "Standard Leaderboard (728x90)" }
        };

        const adNetworks = [
            { value: "demo", text: "Built-In Demo Ad" },
            { value: "adsense", text: "Google AdSense" },
            { value: "adsterra", text: "Adsterra" },
            { value: "medianet", text: "Media.net" },
            { value: "propellerads", text: "PropellerAds" },
            { value: "direct", text: "Direct Ad Campaign" },
            { value: "affiliate", text: "Affiliate Link Banner" }
        ];

        document.addEventListener('DOMContentLoaded', function() {
            loadAdSlots();
            
            // Sidebar logout handler
            document.getElementById('logoutBtn').addEventListener('click', function() {
                fetch('api/logout.php', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = 'index.php';
                    }
                });
            });
        });

        // Fetch ad slot data
        function loadAdSlots() {
            const container = document.getElementById('adsContainer');
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-weight: 700; font-size: 1.2rem;">Loading ad slots...</p>';
            
            fetch('api/get-ads.php', {
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
                if (!Array.isArray(data)) {
                    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-weight: 700; color: #C53030;">Failed to load ad slot data.</p>';
                    return;
                }
                
                container.innerHTML = '';
                data.forEach(slot => {
                    const card = createAdCard(slot);
                    container.appendChild(card);
                });
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-weight: 700; color: #C53030;">An error occurred while loading.</p>';
            });
        }

        // Generate DOM node for an ad card
        function createAdCard(slot) {
            const meta = slotMetadata[slot.slot_name] || { title: slot.slot_name, size: "Unknown" };
            const card = document.createElement('div');
            card.className = 'ad-card';
            card.id = `card-${slot.slot_name}`;

            // Build Options Dropdown HTML
            let optionsHtml = '';
            adNetworks.forEach(net => {
                optionsHtml += `<option value="${net.value}" ${slot.network === net.value ? 'selected' : ''}>${net.text}</option>`;
            });

            // Timer display condition (Only pre_roll shows timer configuration)
            const showTimer = slot.slot_name === 'pre_roll';

            card.innerHTML = `
                <div class="ad-card-header">
                    <h3 class="ad-card-title">${meta.title}</h3>
                    <span class="ad-card-size">${meta.size}</span>
                </div>
                
                <div class="form-group">
                    <label>Ad Network Source</label>
                    <select class="ad-network-select" data-slot="${slot.slot_name}">
                        ${optionsHtml}
                    </select>
                </div>

                ${showTimer ? `
                <div class="form-group">
                    <label>Pre-Roll Skip Duration (Seconds)</label>
                    <input type="number" class="ad-skip-input" min="0" max="60" value="${slot.skip_after_seconds}">
                </div>
                ` : ''}

                <div class="form-group">
                    <label>HTML Embed Script / Code</label>
                    <textarea class="ad-code-area" placeholder="Paste ad tag/script code here">${slot.ad_code || ''}</textarea>
                </div>

                <div class="card-actions">
                    <div class="toggle-container">
                        <label class="switch">
                            <input type="checkbox" class="ad-active-toggle" ${slot.is_active ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span style="font-weight: 700; font-size: 0.95rem;">Active Status</span>
                    </div>
                    <button class="btn-save">💾 SAVE</button>
                </div>
                
                <div class="alert-box"></div>
            `;

            // Setup card save submit handler
            const saveBtn = card.querySelector('.btn-save');
            saveBtn.addEventListener('click', () => {
                saveAdSlot(slot.slot_name, card);
            });

            // Setup quick toggle status handler
            const toggle = card.querySelector('.ad-active-toggle');
            toggle.addEventListener('change', () => {
                toggleAdStatus(slot.slot_name, toggle.checked, card);
            });

            return card;
        }

        // Save entire card contents
        function saveAdSlot(slot_name, cardEl) {
            const network = cardEl.querySelector('.ad-network-select').value;
            const ad_code = cardEl.querySelector('.ad-code-area').value;
            const is_active = cardEl.querySelector('.ad-active-toggle').checked ? 1 : 0;
            
            // Skip timer defaults to 0 for non-pre_roll slots
            const timerEl = cardEl.querySelector('.ad-skip-input');
            const skip_after_seconds = timerEl ? parseInt(timerEl.value) || 0 : 0;
            
            const alertBox = cardEl.querySelector('.alert-box');
            alertBox.style.display = 'none';

            fetch('api/save-ad.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    slot_name: slot_name,
                    network: network,
                    ad_code: ad_code,
                    is_active: is_active,
                    skip_after_seconds: skip_after_seconds
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
                if (data.success) {
                    showAlert(alertBox, 'success', '✅ ' + (data.message || 'Updated successfully!'));
                } else {
                    showAlert(alertBox, 'error', '❌ Error: ' + (data.message || 'Failed to save settings.'));
                }
            })
            .catch(err => {
                console.error(err);
                showAlert(alertBox, 'error', '❌ A network connection error occurred.');
            });
        }

        // Toggle Active status API callback
        function toggleAdStatus(slot_name, isChecked, cardEl) {
            const alertBox = cardEl.querySelector('.alert-box');
            alertBox.style.display = 'none';

            fetch('api/toggle-ad.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    slot_name: slot_name,
                    is_active: isChecked ? 1 : 0
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
                if (data.success) {
                    // Slight visual flash or quick notification
                    showAlert(alertBox, 'success', isChecked ? '🟢 Ad slot is now Active!' : '⚪ Ad slot is now Inactive!');
                    // Fade out message after 3 seconds
                    setTimeout(() => {
                        alertBox.style.display = 'none';
                    }, 3000);
                } else {
                    showAlert(alertBox, 'error', '❌ Failed to toggle active status.');
                    // Revert UI toggle on error
                    cardEl.querySelector('.ad-active-toggle').checked = !isChecked;
                }
            })
            .catch(err => {
                console.error(err);
                showAlert(alertBox, 'error', '❌ Network error.');
                cardEl.querySelector('.ad-active-toggle').checked = !isChecked;
            });
        }

        function showAlert(el, type, msg) {
            el.innerText = msg;
            el.className = `alert-box alert-${type}`;
            el.style.display = 'block';
        }
    </script>
</body>
</html>
