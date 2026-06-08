# 🎮 KidsGameZone — Complete Technical Blueprint
> Production-Ready Kids Game Portal | HTML/CSS/JS + PHP Admin Panel | Multi-Ad Network Support

---

## 1. Executive Summary & Scope

**KidsGameZone** is a browser-based kids game portal featuring 50 HTML/CSS/JS games playable directly in the browser. Every game launch is preceded by a skippable ad. The portal supports multiple ad networks (Google AdSense, Adsterra, Media.net, PropellerAds, Direct Ads, Affiliate links) managed through a full-featured PHP Admin Panel.

**Target User Persona:** Children aged 5–14 (USA market), parents who approve the portal, and advertisers targeting the kids/family niche.

**Tech Stack:** HTML5 + CSS3 + JavaScript (frontend) + PHP 8+ (admin backend) + MySQL (settings/config DB) + JSON (game metadata)

**Monetization:** All 6 ad networks supported simultaneously — switchable per slot from admin panel. Demo ads during development; real ad codes plugged in via admin panel later.

**Hosting:** Hostinger VPS (Ubuntu 22.04) with Apache/Nginx + PHP + MySQL. SSL via Let's Encrypt. Domain pointed via Hostinger DNS.

**CI/CD:** Manual deploy via Git pull on VPS. Optional: GitHub Actions → SSH deploy hook.

---

## 2. 🎮 Complete 50 Games List

| # | Game Name | Category | Why Kids Love It |
|---|-----------|----------|-----------------|
| 1 | Super Mario Bros (Clone) | Platformer | Classic, run & jump |
| 2 | Dino Run | Endless Runner | Simple, addictive |
| 3 | Flappy Bird | Arcade | One-tap, competitive |
| 4 | Snake Classic | Arcade | Timeless, score chasing |
| 5 | Tetris | Puzzle | Strategic stacking |
| 6 | Pac-Man (Clone) | Arcade | Ghost chasing classic |
| 7 | Car Racing 2D | Racing | Speed & dodging |
| 8 | Fruit Ninja (Canvas) | Action | Slash & score |
| 9 | Whack-a-Mole | Reflex | Tap fast, funny |
| 10 | Memory Match Cards | Memory | Educational + fun |
| 11 | Balloon Pop | Casual | Satisfying pops |
| 12 | Bubble Shooter | Puzzle | Color matching |
| 13 | Angry Birds (Clone) | Physics | Slingshot + destroy |
| 14 | Minecraft 2D Craft | Sandbox | Build & explore |
| 15 | Space Invaders | Shooter | Classic arcade |
| 16 | Candy Crush (Match-3) | Puzzle | Color combos |
| 17 | Pong | Arcade | 2-player classic |
| 18 | Breakout / Arkanoid | Arcade | Ball + bricks |
| 19 | Tower Defense | Strategy | Place & defend |
| 20 | Zombie Shooter | Action | Cartoonish shooters |
| 21 | Jumping Ninja | Platformer | Hop between platforms |
| 22 | Color Switch | Reflex | Match colors fast |
| 23 | Geometry Dash (Clone) | Rhythm | Jump to music |
| 24 | Crossy Road (Clone) | Casual | Cross the road safely |
| 25 | Ice Cream Maker | Cooking | Creative, colorful |
| 26 | Pizza Maker | Cooking | Drag & drop toppings |
| 27 | Dress Up Princess | Dress-Up | Fashion + creativity |
| 28 | Puppy Care | Virtual Pet | Feed, clean, play |
| 29 | Fish Tank Builder | Casual | Design aquarium |
| 30 | Jigsaw Puzzle (Animals) | Puzzle | Drag pieces |
| 31 | Number Puzzle (2048) | Math | Merge numbers |
| 32 | Word Search | Educational | Find hidden words |
| 33 | Math Quiz Blitz | Educational | Fast arithmetic |
| 34 | Alphabet Adventure | Educational | Learn letters |
| 35 | Color Coloring Book | Creative | Paint pictures |
| 36 | Draw & Guess | Creative | Freehand drawing |
| 37 | Stickman Fighter | Action | Simple combat |
| 38 | Bike Stunt Rider | Racing | Tricks & flips |
| 39 | Underwater Adventure | Adventure | Swim & collect |
| 40 | Dragon Clicker | Idle/Clicker | Click to grow dragon |
| 41 | Castle Builder | Strategy | Stack & balance |
| 42 | Ninja Sword Slash | Action | Swipe enemies |
| 43 | Penguin Jump | Platformer | Antarctic adventure |
| 44 | Rocket Launch | Casual | Timing-based launch |
| 45 | Dinosaur Egg Hatch | Casual | Tap to hatch |
| 46 | Farm Animal Sorter | Educational | Sort by category |
| 47 | Star Collector | Casual | Tilt/move to collect |
| 48 | Monster Truck Rally | Racing | Smash & race |
| 49 | Space Explorer | Adventure | Navigate asteroids |
| 50 | Holiday Card Maker | Creative | Seasonal fun |

---

## 3. 🏗️ Project Folder Architecture

```
kidsgamezone/
├── index.html                  # Main portal homepage
├── game.html                   # Game player page (dynamic, loads any game)
├── assets/
│   ├── css/
│   │   ├── main.css            # Portal styles
│   │   └── game-page.css       # Game player styles
│   ├── js/
│   │   ├── main.js             # Homepage logic, game cards, search
│   │   ├── ads.js              # Ad injection system (pre-roll, banner, sidebar)
│   │   └── game-loader.js      # Loads game iframe + handles ad skip
│   ├── images/
│   │   ├── thumbnails/         # 50 game thumbnails (300x200px)
│   │   └── ui/                 # Logo, icons, backgrounds
│   └── fonts/                  # Custom cartoon fonts
├── games/
│   ├── super-mario/
│   │   ├── index.html
│   │   ├── game.js
│   │   └── assets/
│   ├── dino-run/
│   │   └── index.html
│   ├── flappy-bird/
│   └── ... (50 game folders)
├── data/
│   └── games.json              # Game metadata (title, thumbnail, category, path)
├── admin/
│   ├── index.php               # Admin login page
│   ├── dashboard.php           # Admin dashboard
│   ├── ads-manager.php         # Ad slots management
│   ├── games-manager.php       # Enable/disable games, edit metadata
│   ├── analytics.php           # Page views, ad impressions, clicks
│   ├── settings.php            # Site settings, logo, SEO
│   ├── includes/
│   │   ├── auth.php            # Session auth
│   │   ├── db.php              # MySQL connection
│   │   └── functions.php       # Helper functions
│   └── api/
│       ├── save-ad.php         # Save ad code via AJAX
│       ├── toggle-game.php     # Enable/disable game
│       └── get-stats.php       # Return analytics JSON
├── api/
│   ├── games.php               # Returns games.json (or DB) to frontend
│   └── track.php               # Track impressions/clicks
└── config/
    └── config.php              # DB credentials, site URL, secret key
```

---

## 4. 🗄️ Database Schema

### Table: `admin_users`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | INT AUTO_INCREMENT | Primary key | PK, NOT NULL |
| username | VARCHAR(50) | Admin username | UNIQUE, NOT NULL |
| password | VARCHAR(255) | Bcrypt hash | NOT NULL |
| created_at | TIMESTAMP | Created date | DEFAULT NOW() |

### Table: `ad_slots`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | INT AUTO_INCREMENT | Primary key | PK |
| slot_name | VARCHAR(100) | e.g. "pre_roll", "header_banner", "sidebar_left" | UNIQUE |
| network | ENUM | 'adsense','adsterra','medianet','propellerads','direct','affiliate','demo' | NOT NULL |
| ad_code | LONGTEXT | Full ad HTML/JS code | NULLABLE |
| is_active | TINYINT(1) | 1=active, 0=disabled | DEFAULT 1 |
| skip_after_seconds | INT | Pre-roll skip timer (0=no skip) | DEFAULT 5 |
| updated_at | TIMESTAMP | Last updated | ON UPDATE NOW() |

### Table: `games`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | INT AUTO_INCREMENT | Primary key | PK |
| slug | VARCHAR(100) | URL-friendly name e.g. "super-mario" | UNIQUE |
| title | VARCHAR(150) | Display name | NOT NULL |
| category | VARCHAR(50) | platformer, puzzle, racing, etc. | NOT NULL |
| thumbnail | VARCHAR(255) | Path to thumbnail image | NOT NULL |
| game_path | VARCHAR(255) | Path to game folder index.html | NOT NULL |
| is_active | TINYINT(1) | Show/hide on portal | DEFAULT 1 |
| is_featured | TINYINT(1) | Show in featured section | DEFAULT 0 |
| play_count | INT | Total plays tracked | DEFAULT 0 |
| created_at | TIMESTAMP | Added date | DEFAULT NOW() |

### Table: `analytics`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | INT AUTO_INCREMENT | Primary key | PK |
| event_type | ENUM | 'game_view','ad_impression','ad_skip','ad_click' | NOT NULL |
| game_id | INT | FK to games.id | NULLABLE |
| ad_slot | VARCHAR(100) | Which ad slot | NULLABLE |
| ip_hash | VARCHAR(64) | Hashed visitor IP | NULLABLE |
| user_agent | TEXT | Browser info | NULLABLE |
| created_at | TIMESTAMP | Event time | DEFAULT NOW() |

### Table: `site_settings`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| setting_key | VARCHAR(100) | Unique key | PK |
| setting_value | LONGTEXT | Value | NULLABLE |
| updated_at | TIMESTAMP | Last updated | ON UPDATE NOW() |

---

## 5. 🔌 Ad Slots System

### 5 Ad Slot Positions:
| Slot Name | Position | Size | Type |
|-----------|----------|------|------|
| `pre_roll` | Before game loads | Fullscreen overlay | Video/Banner, skippable |
| `header_banner` | Top of every page | 728x90 (leaderboard) | Display |
| `sidebar_left` | Left sidebar (desktop) | 160x600 (wide skyscraper) | Display |
| `sidebar_right` | Right sidebar (desktop) | 300x250 (medium rectangle) | Display |
| `footer_banner` | Bottom of page | 728x90 | Display |

### Ad Network Code Slots (Admin sets these):
Each slot stores raw HTML/JS from any network:
- **Google AdSense**: `<script>` + `<ins>` tags
- **Adsterra**: Their provided JS embed
- **Media.net**: Their `<script>` tag
- **PropellerAds**: Push notification / banner code
- **Direct Ad**: Custom HTML banner with client's image + link
- **Affiliate**: HTML with affiliate link + image
- **Demo**: Built-in colorful placeholder (default until real code added)

---

## 6. 🖥️ Frontend UI Architecture

### Page: `index.html` — Homepage
- **Components:** Logo header, search bar, category filter tabs, featured games row (3-4 games), all games grid (50 cards), footer
- **Game Card:** Thumbnail, title, category badge, "Play Now" button
- **On Play Click:** Redirect to `game.html?slug=super-mario`
- **API:** Fetches `data/games.json` or `api/games.php`
- **Ads:** Header banner auto-loads on page load, sidebars load after 1s

### Page: `game.html` — Game Player
- **Flow:** Page loads → Pre-roll ad overlay appears → countdown timer (5s) → "Skip Ad" button appears → user clicks skip → game iframe loads
- **Components:** Breadcrumb nav, ad overlay (fullscreen), skip button, game iframe (100% width), related games row, sidebar ads
- **State:** `adShown`, `adSkipped`, `gameLoaded` flags in JS

### Admin Pages:
| Page | Purpose |
|------|---------|
| `admin/index.php` | Login form |
| `admin/dashboard.php` | Stats overview: total plays, ad impressions, top games |
| `admin/ads-manager.php` | Per-slot: select network, paste code, set skip timer, toggle on/off |
| `admin/games-manager.php` | Table of 50 games: enable/disable, set featured, edit title/thumbnail |
| `admin/analytics.php` | Charts: daily plays, ad clicks, top games bar chart |
| `admin/settings.php` | Site name, logo upload, SEO meta, Google Analytics ID, maintenance mode |

---

## 7. 🔒 Backend API Endpoints (PHP)

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/api/login.php` | Admin login, returns session | No |
| POST | `/admin/api/logout.php` | Destroy session | Yes |

### Ad Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/api/get-ads.php` | Get all ad slot configs | Yes |
| POST | `/admin/api/save-ad.php` | Save ad code + network + settings for a slot | Yes |
| POST | `/admin/api/toggle-ad.php` | Enable/disable a slot | Yes |

### Games Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/games.php` | Public: return active games list (JSON) | No |
| POST | `/admin/api/toggle-game.php` | Enable/disable game | Yes |
| POST | `/admin/api/update-game.php` | Update title, thumbnail, featured status | Yes |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/track.php` | Track event (game_view, ad_impression, etc.) | No |
| GET | `/admin/api/get-stats.php` | Return analytics data for charts | Yes |

### Settings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/api/get-settings.php` | Get all site settings | Yes |
| POST | `/admin/api/save-settings.php` | Save site settings | Yes |

---

## 8. 📋 AGENTS.md (Antigravity/Cursor Rules)

```markdown
# AGENTS.md — KidsGameZone

## Project Type
Static HTML/CSS/JS frontend + PHP Admin Backend + MySQL

## File Structure Rules
- All games live in /games/{slug}/index.html
- Never modify /config/config.php directly — use environment variables
- Admin files only in /admin/ directory
- Public API only in /api/ directory

## Coding Conventions
- PHP: PSR-12 standard, always use prepared statements (PDO)
- JS: ES6+, no frameworks (vanilla only), use const/let never var
- CSS: BEM naming, CSS variables for all colors/fonts
- HTML: Semantic tags, ARIA labels on interactive elements

## Build Order (STRICT — do not skip steps)
1. Database schema + config.php
2. Admin login/auth system
3. Ad slots table + ads-manager.php
4. games.json + homepage game grid
5. game.html + ad overlay + skip logic
6. All 50 game folders (batch, one category at a time)
7. Admin dashboard + analytics
8. SEO + performance optimization
9. VPS deployment + SSL

## Agent Permissions
- AUTONOMOUS: Create/edit HTML, CSS, JS, PHP files
- AUTONOMOUS: Write SQL migrations
- HUMAN REVIEW REQUIRED: Any changes to auth.php or config.php
- HUMAN REVIEW REQUIRED: Before deployment to VPS
- NEVER: Hard-code passwords, API keys, or ad codes in source files

## Security Rules
- All admin routes MUST check session auth at top of file
- All DB queries MUST use PDO prepared statements
- User inputs MUST be sanitized before DB insert
- Ad codes stored in DB, never in flat files
```

---

## 9. ✅ DOs and DON'Ts

### ✅ DOs
- DO build DB schema and admin auth FIRST before any frontend work
- DO use a single `ads.js` file to manage all ad injection — never scatter ad logic
- DO test the pre-roll skip flow on mobile AND desktop before building more games
- DO keep each game in its own isolated folder with its own assets
- DO use `games.json` as the single source of truth for game metadata
- DO enable HTTPS before going live (Let's Encrypt on Hostinger VPS)
- DO add `robots.txt` and sitemap for SEO before launch
- DO implement rate limiting on `/api/track.php` to prevent fake click inflation

### ❌ DON'Ts
- DON'T paste real AdSense/ad network code until site is live and approved
- DON'T build all 50 games at once — do 10 at a time in milestones
- DON'T use iframes from external game sites — all games must be local files
- DON'T skip input sanitization on admin ad-code save (XSS risk)
- DON'T use localStorage for ad configs — always fetch from PHP API
- DON'T forget to add age-appropriate content warnings / COPPA compliance note
- DON'T use autoplay video ads — kids portals get penalized by AdSense
- DON'T mix admin session logic with public pages

---

## 10. 🚀 Step-by-Step Execution Milestones

| # | Milestone | Tasks | Dependencies | Mode |
|---|-----------|-------|--------------|------|
| M1 | Project Scaffold | Folder structure, config.php, db.php, .htaccess, MySQL DB creation | None | Editor View |
| M2 | Database Setup | Run SQL migrations for all 5 tables, seed 50 games data, seed demo ad slots | M1 | Agent Manager |
| M3 | Admin Auth | Login page, session handling, logout, protected route middleware | M2 | Agent Manager |
| M4 | Ad Slots Manager | ads-manager.php UI, save-ad.php API, demo ad codes for all 5 slots | M3 | Agent Manager |
| M5 | Public Ads JS | ads.js — loads ad codes from API, injects into page slots, demo banners | M4 | Agent Manager |
| M6 | Homepage | index.html — game grid, search, category filter, header banner ad, sidebar ads | M5 | Agent Manager |
| M7 | Game Player Page | game.html — pre-roll overlay, countdown, skip button, game iframe, track play | M6 | Agent Manager |
| M8 | Games Batch 1 (1-10) | Super Mario, Dino Run, Flappy Bird, Snake, Tetris, Pac-Man, Car Racing, Fruit Ninja, Whack-a-Mole, Memory Match | M7 | Agent Manager |
| M9 | Games Batch 2 (11-20) | Balloon Pop, Bubble Shooter, Angry Birds, Minecraft 2D, Space Invaders, Candy Crush, Pong, Breakout, Tower Defense, Zombie Shooter | M8 | Agent Manager |
| M10 | Games Batch 3 (21-30) | Jumping Ninja, Color Switch, Geometry Dash, Crossy Road, Ice Cream Maker, Pizza Maker, Dress Up, Puppy Care, Fish Tank, Jigsaw Puzzle | M9 | Agent Manager |
| M11 | Games Batch 4 (31-40) | 2048, Word Search, Math Quiz, Alphabet Adventure, Coloring Book, Draw & Guess, Stickman Fighter, Bike Stunt, Underwater Adventure, Dragon Clicker | M10 | Agent Manager |
| M12 | Games Batch 5 (41-50) | Castle Builder, Ninja Slash, Penguin Jump, Rocket Launch, Dino Egg, Farm Sorter, Star Collector, Monster Truck, Space Explorer, Holiday Card Maker | M11 | Agent Manager |
| M13 | Admin Games Manager | games-manager.php — toggle active/featured, edit metadata, thumbnail upload | M12 | Agent Manager |
| M14 | Admin Analytics | analytics.php — daily plays chart, top games, ad impressions, click tracking | M13 | Agent Manager |
| M15 | Admin Settings | settings.php — site name, logo, SEO meta, Google Analytics ID, maintenance mode | M14 | Agent Manager |
| M16 | SEO + Performance | Meta tags, sitemap.xml, robots.txt, image compression, lazy loading, PWA manifest | M15 | Editor View |
| M17 | VPS Deployment | Hostinger VPS setup, Apache config, PHP+MySQL install, Git deploy, SSL cert | M16 | Editor View |
| M18 | Ad Networks Setup | Apply for AdSense/Adsterra, paste real codes in admin panel, test all ad slots | M17 | Manual |

---

## 11. 🎨 Design System

### Color Palette (Cartoonish)
```css
:root {
  --primary: #FF6B35;      /* Bright orange */
  --secondary: #4ECDC4;    /* Turquoise */
  --accent: #FFE66D;       /* Yellow */
  --purple: #A855F7;       /* Purple */
  --bg: #FFF9F0;           /* Warm white */
  --card-bg: #FFFFFF;
  --text: #2D3748;
  --text-light: #718096;
  --border-radius: 16px;
  --shadow: 0 8px 24px rgba(0,0,0,0.12);
}
```

### Typography
- **Display/Logo:** "Fredoka One" (Google Fonts) — bubbly, cartoonish
- **Headings:** "Nunito" Bold — friendly, rounded
- **Body:** "Nunito" Regular

### Game Card Design
- Rounded corners (16px)
- Colorful category badge
- Hover: slight scale up (1.05) + shadow
- "PLAY" button: bright orange, bold

---

## 12. 📱 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Mobile (<768px) | 2-column game grid, no sidebars, stacked ads |
| Tablet (768-1024px) | 3-column grid, one sidebar |
| Desktop (>1024px) | 4-column grid, both sidebars, header banner |

---

## 13. 🔐 Security Checklist

- [ ] Admin login: bcrypt password hashing
- [ ] All DB queries: PDO prepared statements
- [ ] Ad code input: strip_tags + htmlspecialchars on display, raw stored in DB
- [ ] .htaccess: block direct access to /config/ and /admin/includes/
- [ ] Session: regenerate session ID on login
- [ ] HTTPS: enforce redirect HTTP → HTTPS
- [ ] Rate limiting: /api/track.php max 10 req/min per IP
- [ ] COPPA: Add privacy policy page, no data collection from children

---

## 14. 🌐 Live Hosting Setup (Hostinger VPS)

```bash
# 1. Connect to VPS
ssh root@YOUR_VPS_IP

# 2. Install stack
apt update && apt install apache2 php8.2 php8.2-mysql mysql-server git -y

# 3. Clone project
cd /var/www/html
git clone https://github.com/yourusername/kidsgamezone.git .

# 4. Set permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 5. SSL (Let's Encrypt)
apt install certbot python3-certbot-apache -y
certbot --apache -d yourdomain.com

# 6. Import database
mysql -u root -p < database/schema.sql
```

---

*Blueprint Version 1.0 | KidsGameZone | Ready for Antigravity 2.0 / Cursor IDE execution*
