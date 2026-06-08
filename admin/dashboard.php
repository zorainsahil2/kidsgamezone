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
    <title>KidsGameZone Admin Dashboard</title>
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
            --border-radius: 16px;
            --shadow: 0 8px 24px rgba(0,0,0,0.08);
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
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .dashboard-container {
            width: 100%;
            max-width: 500px;
            background: var(--card-bg);
            border-radius: var(--border-radius);
            padding: 40px;
            box-shadow: var(--shadow);
            border: 4px solid var(--text);
            text-align: center;
        }

        h1 {
            font-family: 'Fredoka', cursive;
            font-size: 2.2rem;
            color: var(--primary);
            margin-bottom: 20px;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
        }

        .status-box {
            background: #EBF8FF;
            border: 3px solid #3182CE;
            color: #2B6CB0;
            padding: 16px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 30px;
        }

        .btn-logout {
            display: inline-block;
            padding: 12px 30px;
            font-family: 'Fredoka', cursive;
            font-size: 1.1rem;
            color: #FFFFFF;
            background: var(--primary);
            border: 3px solid var(--text);
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 6px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .btn-logout:hover {
            background: #FF8552;
        }

        .btn-logout:active {
            transform: translateY(4px);
            box-shadow: 0 2px 0px var(--text);
        }

        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
            vertical-align: middle;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

    <div class="dashboard-container">
        <h1>🎮 Admin Dashboard</h1>
        
        <div class="status-box">
            ✅ Logged in as: <span style="text-decoration: underline;"><?php echo $adminUsername; ?></span>
        </div>

        <button id="logoutBtn" class="btn-logout">LOGOUT</button>
    </div>

    <script>
        document.getElementById('logoutBtn').addEventListener('click', function() {
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span>Logging out...';

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
                } else {
                    alert('Logout failed. Please try again.');
                    btn.disabled = false;
                    btn.innerText = 'LOGOUT';
                }
            })
            .catch(err => {
                console.error(err);
                alert('An error occurred during logout.');
                btn.disabled = false;
                btn.innerText = 'LOGOUT';
            });
        });
    </script>
</body>
</html>
