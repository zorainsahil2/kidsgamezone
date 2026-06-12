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
    <title>Site Settings - KidsGameZone</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
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

        /* Maintenance Alert Banner */
        .maintenance-banner {
            background: #FDE8E8;
            border: 3px solid #9B1C1C;
            color: #9B1C1C;
            padding: 15px;
            border-radius: 12px;
            font-weight: 800;
            margin-bottom: 25px;
            display: none;
            text-align: center;
            font-size: 1.1rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.01); }
            100% { transform: scale(1); }
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

        /* Card Section Layout */
        .settings-card {
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            padding: 30px;
            margin-bottom: 30px;
        }

        .settings-card h3 {
            font-family: 'Fredoka', cursive;
            font-size: 1.4rem;
            color: var(--text);
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 12px;
            margin-bottom: 25px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        @media (min-width: 768px) {
            .form-row-split {
                grid-template-columns: 1fr 1fr;
            }
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group label {
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 0.95rem;
            color: var(--text);
        }

        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 11px 14px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.95rem;
            border: 2px solid var(--text);
            border-radius: 8px;
            outline: none;
            background: var(--bg);
        }

        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
            border-color: var(--primary);
            background: #FFFFFF;
        }

        .form-group textarea {
            resize: vertical;
            height: 100px;
        }

        .form-help {
            display: block;
            color: var(--text-light);
            margin-top: 6px;
            font-weight: 700;
            font-size: 0.8rem;
        }

        .counter-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 5px;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-light);
        }

        .counter-container.over-limit {
            color: #C53030;
        }

        /* Logo Preview Elements */
        .logo-upload-container {
            display: flex;
            align-items: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .logo-preview-box {
            width: 160px;
            height: 80px;
            border: 3px solid var(--text);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #EDF2F7;
            overflow: hidden;
        }

        .logo-preview-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 5px;
        }

        .logo-placeholder {
            font-family: 'Fredoka', cursive;
            color: var(--text-light);
            font-size: 1.2rem;
        }

        .logo-upload-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex-grow: 1;
        }

        .btn-upload-logo {
            padding: 10px 20px;
            font-family: 'Fredoka', cursive;
            background: var(--secondary);
            border: 2px solid var(--text);
            border-radius: 10px;
            color: var(--text);
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: var(--transition);
            align-self: flex-start;
        }

        .btn-upload-logo:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        /* Readonly preview area */
        .code-preview-area {
            background: #2D3748 !important;
            color: #A0AEC0 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 0.85rem !important;
            height: 130px !important;
        }

        /* Switch toggler styling */
        .maintenance-toggle-container {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
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
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background-color: var(--text);
            transition: .3s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: #F56565;
        }

        input:checked + .slider:before {
            transform: translateX(30px);
            background-color: #FFFFFF;
        }

        .maintenance-warning {
            border-left: 4px solid #E53E3E;
            padding: 8px 12px;
            background: #FFF5F5;
            color: #C53030;
            font-weight: 700;
            font-size: 0.85rem;
            margin-top: 15px;
            border-radius: 4px;
        }

        /* Danger Zone Style */
        .danger-card {
            border-color: #E53E3E;
            background: #FFF5F5;
        }

        .danger-card h3 {
            color: #C53030;
            border-bottom-color: #FEB2B2;
        }

        .btn-danger-action {
            padding: 12px 25px;
            font-family: 'Fredoka', cursive;
            background: #E53E3E;
            border: 2px solid var(--text);
            border-radius: 10px;
            color: #FFFFFF;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 0px var(--text);
            transition: var(--transition);
            margin-top: 15px;
        }

        .btn-danger-action:disabled {
            background: #FEB2B2;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
        }

        .btn-danger-action:active:not(:disabled) {
            transform: translateY(2px);
            box-shadow: 0 2px 0px var(--text);
        }

        /* Main Save Layout */
        .save-bar {
            margin-bottom: 60px;
            display: flex;
            justify-content: flex-end;
        }

        .btn-save-all {
            padding: 14px 40px;
            font-family: 'Fredoka', cursive;
            font-size: 1.2rem;
            background: var(--primary);
            border: 3px solid var(--text);
            border-radius: 12px;
            color: #FFFFFF;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 6px 0px var(--text);
            transition: var(--transition);
        }

        .btn-save-all:active {
            transform: translateY(3px);
            box-shadow: 0 3px 0px var(--text);
        }

        /* Toast notifications */
        .toast-box {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--card-bg);
            border: var(--border-style);
            border-radius: 12px;
            box-shadow: 0 5px 0px var(--text);
            padding: 15px 25px;
            font-weight: 700;
            z-index: 500;
            display: none;
            animation: toastSlide 0.3s ease;
        }

        @keyframes toastSlide {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .toast-success {
            background: #DEF7EC;
            color: #03543F;
            border-color: #03543F;
        }

        .toast-error {
            background: #FDE8E8;
            color: #9B1C1C;
            border-color: #9B1C1C;
        }

        /* Spinner overlays */
        .loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 249, 240, 0.75);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Fredoka', cursive;
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
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

        /* Mobile responsive header settings */
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

    <!-- Sidebar Menu Drawer -->
    <div class="sidebar">
        <div class="sidebar-logo">🎮 KidsGameZone</div>
        <div class="sidebar-profile">
            <span class="username">👤 <?php echo $adminUsername; ?></span>
        </div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.php">Dashboard</a></li>
            <li><a href="ads-manager.php">Ad Slots</a></li>
            <li><a href="games-manager.php">Games Manager</a></li>
            <li><a href="analytics.php">Analytics</a></li>
            <li class="active"><a href="settings.php">Settings</a></li>
        </ul>
        <button id="logoutBtn" class="btn-logout-sidebar">LOGOUT</button>
    </div>

    <!-- Main Workspace -->
    <div class="main-content">
        <!-- Active Maintenance warning banner -->
        <div id="activeMaintenanceBanner" class="maintenance-banner">
            🔴 MAINTENANCE MODE IS ACTIVE — PORTAL IS HIDDEN FROM PUBLIC VISITORS
        </div>

        <div class="header">
            <h1>⚙️ Site Settings</h1>
            <p>Modify portal configurations, upload branding logo assets, configure analytics tracking IDs, and toggle public accessibility.</p>
        </div>

        <form id="siteSettingsForm">
            
            <!-- Section 1: General Settings -->
            <div class="settings-card">
                <h3>General Settings</h3>
                <div class="form-row form-row-split">
                    <div class="form-group">
                        <label for="siteNameInput">Site Name</label>
                        <input type="text" id="siteNameInput" required placeholder="Enter site name">
                        <small class="form-help">Appears in site title and header brand name.</small>
                    </div>
                    <div class="form-group">
                        <label for="siteTaglineInput">Site Tagline</label>
                        <input type="text" id="siteTaglineInput" required placeholder="Enter brand tagline">
                        <small class="form-help">Tagline shown below the logo text on homepage.</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="seoDescInput">SEO Meta Description</label>
                        <textarea id="seoDescInput" maxlength="250" placeholder="Enter SEO page description..." required></textarea>
                        <div id="seoCounter" class="counter-container">0 / 160 characters</div>
                        <small class="form-help">Search engine snippet page description. Recommended length: under 160 characters.</small>
                    </div>
                </div>
                <div class="form-row form-row-split">
                    <div class="form-group">
                        <label for="seoKeywordsInput">Site SEO Keywords</label>
                        <input type="text" id="seoKeywordsInput" placeholder="kids games, free online games, browser games">
                        <small class="form-help">Comma-separated keywords for search engines.</small>
                    </div>
                    <div class="form-group">
                        <label for="robotsPolicySelect">Robots Crawling Policy</label>
                        <select id="robotsPolicySelect">
                            <option value="index, follow">index, follow (Allow Search Engines)</option>
                            <option value="noindex, nofollow">noindex, nofollow (Block Everything)</option>
                            <option value="noindex, follow">noindex, follow (Allow links but block pages)</option>
                        </select>
                        <small class="form-help">Control how search engine crawlers index your site.</small>
                    </div>
                </div>
            </div>

            <!-- Section 2: Logo Upload -->
            <div class="settings-card">
                <h3>Logo Artwork</h3>
                <div class="logo-upload-container">
                    <div class="logo-preview-box" id="logoPreviewBox">
                        <div class="logo-placeholder" id="logoFallback">No Logo</div>
                        <img id="logoPreview" src="" alt="Preview" style="display:none;">
                    </div>
                    <div class="logo-upload-actions">
                        <label for="logoFileInput" style="font-weight:700; margin-bottom: 5px;">Upload New Logo</label>
                        <input type="file" id="logoFileInput" accept="image/*" style="border:none; background:none; padding:5px 0;">
                        <small class="form-help">Allowed formats: JPG, PNG, GIF, WEBP, SVG. Maximum file size: 1MB.</small>
                        <button type="button" id="btnUploadLogo" class="btn-upload-logo" style="margin-top: 10px;">📤 Upload Logo</button>
                    </div>
                </div>
            </div>

            <!-- Section 3: Analytics ID -->
            <div class="settings-card">
                <h3>Analytics & Tracking</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="gaIdInput">Google Analytics Measurement ID (GA4)</label>
                        <input type="text" id="gaIdInput" placeholder="G-XXXXXXXXXX">
                        <small class="form-help">Enter your GA4 Measurement ID. Leave blank to disable.</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="gaScriptPreview">Injected Tag Preview</label>
                        <textarea id="gaScriptPreview" class="code-preview-area" readonly></textarea>
                    </div>
                </div>
                <div class="form-row" style="margin-top: 20px;">
                    <div class="form-group">
                        <label for="globalScriptsInput">Global Integration Scripts (e.g. Adsterra Popunder / Social Bar)</label>
                        <textarea id="globalScriptsInput" style="height: 120px;" placeholder="Paste custom global scripts here (e.g., Popunder, Social Bar, global headers/footers)..."></textarea>
                        <small class="form-help">Any scripts added here will be executed globally across the portal home and play pages. Wrap script code in &lt;script&gt; tags.</small>
                    </div>
                </div>
            </div>

            <!-- Section 4: Maintenance Mode -->
            <div class="settings-card">
                <h3>Maintenance Mode</h3>
                <div class="maintenance-toggle-container">
                    <label class="switch">
                        <input type="checkbox" id="maintenanceToggle">
                        <span class="slider"></span>
                    </label>
                    <div style="font-weight: 700;">Enable Maintenance Mode</div>
                </div>
                <div id="maintenanceAlertText" class="maintenance-warning" style="display: none;">
                     ⚠️ Turning on maintenance mode will hide the portal from all visitors and redirect them to a maintenance page!
                </div>
            </div>

            <!-- Section 5: XML Sitemap Manager -->
            <div class="settings-card">
                <h3>XML Sitemap Manager</h3>
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 0.95rem; margin-bottom: 12px; font-weight: 700;">
                        Manage search engine sitemaps for KidsGameZone. Sitemaps tell Google, Bing, and other search engines which pages to index.
                    </p>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
                        <a href="../sitemap.php" target="_blank" class="btn-upload-logo" style="text-decoration: none; text-align: center; background-color: var(--accent); color: var(--text);">
                            🌐 View Live Sitemap (Dynamic)
                        </a>
                        <a href="../sitemap.xml" target="_blank" id="viewStaticSitemapBtn" class="btn-upload-logo" style="text-decoration: none; text-align: center; display: none;">
                            📄 View Static sitemap.xml
                        </a>
                    </div>
                    <button type="button" id="btnGenerateSitemap" class="btn-save-all" style="font-size: 1rem; padding: 10px 25px; box-shadow: 0 4px 0px var(--text);">
                        ⚡ Generate Static sitemap.xml
                    </button>
                    <small class="form-help" style="margin-top: 10px;">
                        Generating the static sitemap will create/overwrite the <code>sitemap.xml</code> file in the portal's root directory.
                    </small>
                </div>
            </div>

            <!-- Section: Admin Security Settings -->
            <div class="settings-card">
                <h3>Admin Profile Settings</h3>
                <div class="form-row form-row-split">
                    <div class="form-group">
                        <label for="newUsernameInput">New Username</label>
                        <input type="text" id="newUsernameInput" value="<?php echo $adminUsername; ?>" placeholder="Enter new username" required>
                        <small class="form-help">Current username is: <span id="currentUsernameDisplay"><?php echo $adminUsername; ?></span></small>
                    </div>
                </div>
                <div class="form-row form-row-split">
                    <div class="form-group">
                        <label for="newPasswordInput">New Password</label>
                        <input type="password" id="newPasswordInput" placeholder="Enter new password (optional)">
                        <small class="form-help">Leave blank if you do not want to change password.</small>
                    </div>
                    <div class="form-group">
                        <label for="confirmPasswordInput">Confirm New Password</label>
                        <input type="password" id="confirmPasswordInput" placeholder="Confirm new password">
                        <small class="form-help">Must match new password.</small>
                    </div>
                </div>
                <div class="form-row form-row-split">
                    <div class="form-group">
                        <label for="currentPasswordInput">Current Password (Required)</label>
                        <input type="password" id="currentPasswordInput" placeholder="Enter current password to save changes" required>
                        <small class="form-help">Enter your current password to authorize this profile update.</small>
                    </div>
                </div>
                <button type="button" id="btnUpdateProfile" class="btn-save-all" style="font-size: 1rem; padding: 10px 25px; box-shadow: 0 4px 0px var(--text);">
                    🔒 Update Profile Info
                </button>
            </div>

            <!-- Section 5: Danger Zone -->
            <div class="settings-card danger-card">
                <h3>Danger Zone</h3>
                <div class="form-row">
                    <div class="form-group">
                        <p style="color: #C53030; font-weight:700; font-size: 0.95rem; margin-bottom: 12px;">
                            Permanently clear all historical play metrics, ad impression records, click logs, and skips data from the database. This action is irreversible!
                        </p>
                        <label for="confirmDeleteInput" style="color:#C53030;">Type <strong>DELETE</strong> below to confirm:</label>
                        <input type="text" id="confirmDeleteInput" placeholder="Type DELETE here" style="max-width: 300px; border-color: #FEB2B2; background-color: #FFFDFD;">
                        <button type="button" id="btnClearAnalytics" class="btn-danger-action" disabled>🗑️ Clear All Analytics Data</button>
                    </div>
                </div>
            </div>

            <!-- Submit action bar -->
            <div class="save-bar">
                <button type="submit" class="btn-save-all">💾 Save All Settings</button>
            </div>

        </form>
    </div>

    <!-- Toast Success/Error message box -->
    <div id="toastNotification" class="toast-box"></div>

    <!-- Spinner loading page overlay -->
    <div id="loadingOverlay" class="loader-overlay">
        <div class="spinner"></div>
        <div id="loaderText">Loading Settings...</div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Fetch initial configuration values
            loadSettings();

            // Setup character counter listener on SEO input
            const seoInput = document.getElementById('seoDescInput');
            seoInput.addEventListener('input', updateSeoCounter);

            // Setup Real-time Google Analytics tag preview listener
            const gaInput = document.getElementById('gaIdInput');
            gaInput.addEventListener('input', updateGaPreview);

            // Setup direct Logo File Preview logic
            const logoInput = document.getElementById('logoFileInput');
            logoInput.addEventListener('change', previewLogoFile);

            // Upload Logo Button Trigger
            document.getElementById('btnUploadLogo').addEventListener('click', handleLogoUpload);

            // Handle danger zone confirmation input
            const deleteInput = document.getElementById('confirmDeleteInput');
            const clearBtn = document.getElementById('btnClearAnalytics');
            deleteInput.addEventListener('input', function() {
                clearBtn.disabled = (this.value !== 'DELETE');
            });

            // Trigger clear analytics request
            clearBtn.addEventListener('click', handleClearAnalytics);

            // Maintenance Mode toggle popup check
            const maintToggle = document.getElementById('maintenanceToggle');
            maintToggle.addEventListener('change', function(e) {
                const isChecked = this.checked;
                const warningBox = document.getElementById('maintenanceAlertText');
                
                if (isChecked) {
                    warningBox.style.display = 'block';
                    const confirmRes = confirm('Are you sure you want to enable Maintenance Mode? This will redirect all public users immediately!');
                    if (!confirmRes) {
                        this.checked = false;
                        warningBox.style.display = 'none';
                    }
                } else {
                    warningBox.style.display = 'none';
                }
            });

            // Generate sitemap trigger listener
            document.getElementById('btnGenerateSitemap').addEventListener('click', handleGenerateSitemap);

            // Handle main form submission
            document.getElementById('siteSettingsForm').addEventListener('submit', handleSettingsSave);

            // Handle Profile Update trigger
            document.getElementById('btnUpdateProfile').addEventListener('click', handleProfileUpdate);

            // Handle sidebar logout
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
        });

        // Pull settings configs
        function loadSettings() {
            showLoader(true, 'Loading Settings...');
            
            fetch('api/get-settings.php', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(settings => {
                showLoader(false);
                if (settings) {
                    document.getElementById('siteNameInput').value = settings.site_name || '';
                    document.getElementById('siteTaglineInput').value = settings.site_tagline || '';
                    
                    const seoDesc = settings.seo_description || '';
                    document.getElementById('seoDescInput').value = seoDesc;
                    updateSeoCounter();

                    document.getElementById('seoKeywordsInput').value = settings.seo_keywords || '';
                    document.getElementById('robotsPolicySelect').value = settings.robots_meta || 'index, follow';

                    // Check if sitemap.xml exists in root
                    fetch('../sitemap.xml', { method: 'HEAD' })
                        .then(res => {
                            if (res.status === 200) {
                                document.getElementById('viewStaticSitemapBtn').style.display = 'inline-block';
                            } else {
                                document.getElementById('viewStaticSitemapBtn').style.display = 'none';
                            }
                        })
                        .catch(() => {
                            document.getElementById('viewStaticSitemapBtn').style.display = 'none';
                        });

                    document.getElementById('gaIdInput').value = settings.google_analytics_id || '';
                    updateGaPreview();

                    document.getElementById('globalScriptsInput').value = settings.global_custom_scripts || '';

                    const isMaint = (settings.maintenance_mode === '1');
                    document.getElementById('maintenanceToggle').checked = isMaint;
                    
                    const banner = document.getElementById('activeMaintenanceBanner');
                    banner.style.display = isMaint ? 'block' : 'none';
                    
                    // Render logo preview
                    const logoImg = document.getElementById('logoPreview');
                    const fallback = document.getElementById('logoFallback');
                    
                    if (settings.logo_path && settings.logo_path.trim() !== '') {
                        let logoSrc = settings.logo_path;
                        if (!logoSrc.startsWith('data:')) {
                            logoSrc = '../' + logoSrc + '?t=' + new Date().getTime();
                        }
                        logoImg.src = logoSrc;
                        logoImg.style.display = 'block';
                        fallback.style.display = 'none';
                    } else {
                        logoImg.style.display = 'none';
                        fallback.style.display = 'block';
                    }
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Failed to load configurations.');
            });
        }

        // Count SEO chars
        function updateSeoCounter() {
            const el = document.getElementById('seoDescInput');
            const counter = document.getElementById('seoCounter');
            const len = el.value.length;
            
            counter.innerText = `${len} / 160 characters`;
            if (len > 160) {
                counter.classList.add('over-limit');
            } else {
                counter.classList.remove('over-limit');
            }
        }

        // Update GA Tag Code preview area
        function updateGaPreview() {
            const id = document.getElementById('gaIdInput').value.trim();
            const preview = document.getElementById('gaScriptPreview');
            
            if (id) {
                preview.value = `<!-- Google Analytics (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"><\/script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '${id}');\n<\/script>`;
            } else {
                preview.value = '<!-- Google Analytics is Disabled -->';
            }
        }

        // Preview logo locally
        function previewLogoFile(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1 * 1024 * 1024) {
                    alert('File size exceeds maximum limit of 1MB');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.getElementById('logoPreview');
                    const fallback = document.getElementById('logoFallback');
                    img.src = e.target.result;
                    img.style.display = 'block';
                    fallback.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        }

        // Upload logo file
        function handleLogoUpload() {
            const fileInput = document.getElementById('logoFileInput');
            if (fileInput.files.length === 0) {
                alert('Please choose an image file first.');
                return;
            }

            const formData = new FormData();
            formData.append('logo', fileInput.files[0]);

            showLoader(true, 'Uploading Logo...');

            fetch('api/upload-logo.php', {
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
                showLoader(false);
                if (data && data.success) {
                    showToast('success', '✅ Logo uploaded successfully!');
                    fileInput.value = '';
                    
                    // Reload settings to get correct cache-busted path
                    loadSettings();
                } else {
                    showToast('error', '❌ Upload failed: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Network error uploading logo.');
            });
        }

        // Form save handler
        function handleSettingsSave(e) {
            e.preventDefault();

            const site_name = document.getElementById('siteNameInput').value.trim();
            const site_tagline = document.getElementById('siteTaglineInput').value.trim();
            const seo_description = document.getElementById('seoDescInput').value.trim();
            const google_analytics_id = document.getElementById('gaIdInput').value.trim();
            const maintenance_mode = document.getElementById('maintenanceToggle').checked ? '1' : '0';
            const seo_keywords = document.getElementById('seoKeywordsInput').value.trim();
            const robots_meta = document.getElementById('robotsPolicySelect').value;
            const global_custom_scripts = document.getElementById('globalScriptsInput').value;

            showLoader(true, 'Saving Settings...');

            fetch('api/save-settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    site_name,
                    site_tagline,
                    seo_description,
                    google_analytics_id,
                    maintenance_mode,
                    seo_keywords,
                    robots_meta,
                    global_custom_scripts
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
                showLoader(false);
                if (data && data.success) {
                    showToast('success', '✅ Settings saved successfully!');
                    
                    // Toggle the visual warning banner
                    const banner = document.getElementById('activeMaintenanceBanner');
                    banner.style.display = (maintenance_mode === '1') ? 'block' : 'none';
                    
                    // Reload to reflect settings changes in sidebar logo or settings
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showToast('error', '❌ Error saving: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Network error saving settings.');
            });
        }

        // Clear analytics data
        function handleClearAnalytics() {
            const confirmVal = document.getElementById('confirmDeleteInput').value;
            if (confirmVal !== 'DELETE') return;

            const confirmDb = confirm('⚠️ WARNING: This will permanently purge ALL play numbers, ad impressions, and click analytics from the database. Are you absolutely sure?');
            if (!confirmDb) return;

            showLoader(true, 'Purging Database tables...');

            fetch('api/clear-analytics.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ confirm: 'DELETE' })
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                showLoader(false);
                if (data && data.success) {
                    showToast('success', `✅ Purge complete! Deleted ${data.deleted_rows} logs.`);
                    document.getElementById('confirmDeleteInput').value = '';
                    document.getElementById('btnClearAnalytics').disabled = true;
                } else {
                    showToast('error', '❌ Failed to clear analytics: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Network error purging analytics.');
            });
        }

        // Show/hide screen overlays
        function showLoader(show, text = 'Loading...') {
            const overlay = document.getElementById('loadingOverlay');
            document.getElementById('loaderText').innerText = text;
            overlay.style.display = show ? 'flex' : 'none';
        }

        // Show Toast Notifications
        function showToast(type, message) {
            const toast = document.getElementById('toastNotification');
            toast.className = `toast-box toast-${type}`;
            toast.innerText = message;
            toast.style.display = 'block';

            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }

        // Generate static sitemap XML
        function handleGenerateSitemap() {
            showLoader(true, 'Generating sitemap.xml...');
            fetch('api/generate-sitemap.php', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'index.php';
                    return;
                }
                return res.json();
            })
            .then(data => {
                showLoader(false);
                if (data && data.success) {
                    showToast('success', '✅ Sitemap generated successfully!');
                    document.getElementById('viewStaticSitemapBtn').style.display = 'inline-block';
                } else {
                    showToast('error', '❌ Error: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Network error during sitemap generation.');
            });
        }

        // Profile update handler
        function handleProfileUpdate() {
            const new_username = document.getElementById('newUsernameInput').value.trim();
            const new_password = document.getElementById('newPasswordInput').value;
            const confirm_password = document.getElementById('confirmPasswordInput').value;
            const current_password = document.getElementById('currentPasswordInput').value;

            if (!new_username) {
                alert('Please enter a username.');
                return;
            }
            if (!current_password) {
                alert('Please enter your current password to authorize changes.');
                return;
            }
            if (new_password && new_password !== confirm_password) {
                alert('New passwords do not match.');
                return;
            }

            showLoader(true, 'Updating Profile Info...');

            fetch('api/update-profile.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    new_username,
                    new_password,
                    confirm_password,
                    current_password
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
                showLoader(false);
                if (data && data.success) {
                    showToast('success', '✅ Profile updated successfully!');
                    document.getElementById('newPasswordInput').value = '';
                    document.getElementById('confirmPasswordInput').value = '';
                    document.getElementById('currentPasswordInput').value = '';
                    document.getElementById('currentUsernameDisplay').innerText = new_username;
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showToast('error', '❌ Error updating: ' + (data ? data.message : 'Unknown error'));
                }
            })
            .catch(err => {
                showLoader(false);
                console.error(err);
                showToast('error', '❌ Network error updating profile info.');
            });
        }
    </script>
</body>
</html>
