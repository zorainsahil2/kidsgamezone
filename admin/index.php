<?php
require_once __DIR__ . '/includes/auth.php';

// Redirect immediately to dashboard if already authenticated
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KidsGameZone Admin Login</title>
    <!-- Bubbly & Friendly Fonts -->
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
            --shadow: 0 12px 32px rgba(255, 107, 53, 0.15);
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
            background-image: radial-gradient(var(--accent) 1.5px, transparent 1.5px), radial-gradient(var(--secondary) 1.5px, transparent 1.5px);
            background-size: 40px 40px;
            background-position: 0 0, 20px 20px;
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .login-container {
            width: 100%;
            max-width: 420px;
            background: var(--card-bg);
            border-radius: var(--border-radius);
            padding: 40px 30px;
            box-shadow: var(--shadow);
            border: 4px solid var(--text);
            text-align: center;
            transform: translateY(0);
            transition: var(--transition);
        }

        .login-container:hover {
            transform: translateY(-4px);
        }

        .logo {
            font-family: 'Fredoka', cursive;
            font-size: 2.2rem;
            color: var(--primary);
            margin-bottom: 5px;
            text-shadow: 2px 2px 0px var(--text);
            -webkit-text-stroke: 1.5px var(--text);
            letter-spacing: 1px;
        }

        .subtitle {
            font-size: 1.1rem;
            color: var(--text-light);
            margin-bottom: 30px;
            font-weight: 700;
        }

        .form-group {
            text-align: left;
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text);
            font-size: 1rem;
        }

        .form-group input {
            width: 100%;
            padding: 12px 16px;
            font-family: 'Nunito', sans-serif;
            font-size: 1rem;
            border: 3px solid var(--text);
            border-radius: 12px;
            background: var(--bg);
            color: var(--text);
            outline: none;
            transition: var(--transition);
        }

        .form-group input:focus {
            border-color: var(--secondary);
            background: #FFFFFF;
            box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.15);
        }

        .btn-login {
            width: 100%;
            padding: 14px;
            font-family: 'Fredoka', cursive;
            font-size: 1.25rem;
            color: #FFFFFF;
            background: var(--primary);
            border: 3px solid var(--text);
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 6px 0px var(--text);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
            margin-top: 10px;
            letter-spacing: 0.5px;
        }

        .btn-login:hover {
            background: #FF8552;
        }

        .btn-login:active {
            transform: translateY(4px);
            box-shadow: 0 2px 0px var(--text);
        }

        .error-message {
            display: none;
            background: #FFECEB;
            border: 3px solid #E53E3E;
            color: #C53030;
            padding: 12px;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: left;
            animation: shake 0.3s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
        }

        /* Loading spinner */
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
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

    <div class="login-container">
        <div class="logo">🎮 KidsGameZone</div>
        <div class="subtitle">Admin Dashboard Control Panel</div>

        <div id="errorBox" class="error-message"></div>

        <form id="loginForm" novalidate>
            <div class="form-group">
                <label for="username">Admin Username</label>
                <input type="text" id="username" name="username" required placeholder="Enter username" autocomplete="username">
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Enter password" autocomplete="current-password">
            </div>

            <button type="submit" id="submitBtn" class="btn-login">LOGIN</button>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const errorBox = document.getElementById('errorBox');
            const submitBtn = document.getElementById('submitBtn');

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Simple front-end validation
            if (!username || !password) {
                showError('Please fill in all fields.');
                return;
            }

            // UI feedback state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span>Logging in...';
            errorBox.style.display = 'none';

            // Post authentication request
            fetch('api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ username: username, password: password })
            })
            .then(response => {
                return response.json().then(data => {
                    if (!response.ok) {
                        throw new Error(data.message || 'Authentication failed');
                    }
                    return data;
                });
            })
            .then(data => {
                if (data.success && data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    throw new Error('Invalid server response');
                }
            })
            .catch(err => {
                showError(err.message);
                submitBtn.disabled = false;
                submitBtn.innerText = 'LOGIN';
            });
        });

        function showError(msg) {
            const errorBox = document.getElementById('errorBox');
            errorBox.innerText = '⚠️ ' + msg;
            errorBox.style.display = 'block';
            
            // Re-trigger animation
            errorBox.style.animation = 'none';
            errorBox.offsetHeight; /* trigger reflow */
            errorBox.style.animation = null;
        }
    </script>
</body>
</html>
