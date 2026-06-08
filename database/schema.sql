CREATE DATABASE IF NOT EXISTS kidsgamezone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kidsgamezone;

-- 1. Table: admin_users
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS ad_slots;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS site_settings;

CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Admin User: 'admin' / 'admin123'
INSERT INTO admin_users (username, password) VALUES 
('admin', '$2y$10$hGVLfeSY0HJMjV7Nogxrwerlh4h0NYGKGGYw0TBXzwCFZUsVi5bvG');

-- 2. Table: ad_slots
CREATE TABLE ad_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(100) NOT NULL UNIQUE,
    network ENUM('adsense', 'adsterra', 'medianet', 'propellerads', 'direct', 'affiliate', 'demo') NOT NULL,
    ad_code LONGTEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    skip_after_seconds INT DEFAULT 5,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Ad Slots
INSERT INTO ad_slots (slot_name, network, ad_code, is_active, skip_after_seconds) VALUES
('pre_roll', 'demo', '<div id="demo-pre-roll" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #FF6B35; color: #FFFFFF; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 2.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; z-index: 999999;">🎮 Advertisement – Skip in 5s</div>', 1, 5),
('header_banner', 'demo', '<div style="width: 728px; height: 90px; background-color: #4ECDC4; color: #FFFFFF; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; margin: 10px auto;">📢 Header Banner Ad – 728x90</div>', 1, 5),
('sidebar_left', 'demo', '<div style="width: 160px; height: 600px; background-color: #A855F7; color: #FFFFFF; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 1.2rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; padding: 10px; box-sizing: border-box;">📢 Left Sidebar Ad – 160x600</div>', 1, 5),
('sidebar_right', 'demo', '<div style="width: 300px; height: 250px; background-color: #FFE66D; color: #2D3748; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 1.3rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; padding: 15px; box-sizing: border-box; border: 3px dashed #2D3748;">📢 Right Sidebar Ad – 300x250</div>', 1, 5),
('footer_banner', 'demo', '<div style="width: 728px; height: 90px; background-color: #EC4899; color: #FFFFFF; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold; font-family: \'Nunito\', sans-serif; border-radius: 8px; margin: 10px auto;">📢 Footer Banner Ad – 728x90</div>', 1, 5);

-- 3. Table: games
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    game_path VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Games
INSERT INTO games (slug, title, category, thumbnail, game_path, is_active, is_featured) VALUES
('super-mario', 'Super Girl', 'platformer', 'assets/images/thumbnails/super-mario.png', 'games/super-mario/index.html', 1, 1),
('dino-run', 'Dino Run', 'arcade', 'assets/images/thumbnails/dino-run.png', 'games/dino-run/index.html', 1, 1),
('flappy-bird', 'Flying Fairy', 'arcade', 'assets/images/thumbnails/flappy-bird.png', 'games/flappy-bird/index.html', 1, 1),
('snake-classic', 'Snake Classic', 'arcade', 'assets/images/thumbnails/snake-classic.png', 'games/snake-classic/index.html', 1, 1),
('tetris', 'Tetris', 'puzzle', 'assets/images/thumbnails/tetris.jpg', 'games/tetris/index.html', 1, 0),
('pac-man', 'Pac-Man (Clone)', 'arcade', 'assets/images/thumbnails/pac-man.jpg', 'games/pac-man/index.html', 1, 0),
('car-racing-2d', 'Car Racing 2D', 'racing', 'assets/images/thumbnails/car-racing-2d.jpg', 'games/car-racing-2d/index.html', 1, 0),
('fruit-ninja', 'Fruit Ninja (Canvas)', 'action', 'assets/images/thumbnails/fruit-ninja.jpg', 'games/fruit-ninja/index.html', 1, 0),
('whack-a-mole', 'Whack-a-Mole', 'arcade', 'assets/images/thumbnails/whack-a-mole.jpg', 'games/whack-a-mole/index.html', 1, 0),
('memory-match-cards', 'Memory Match Cards', 'memory', 'assets/images/thumbnails/memory-match-cards.jpg', 'games/memory-match-cards/index.html', 1, 0),
('balloon-pop', 'Balloon Pop', 'casual', 'assets/images/thumbnails/balloon-pop.jpg', 'games/balloon-pop/index.html', 1, 0),
('bubble-shooter', 'Bubble Shooter', 'puzzle', 'assets/images/thumbnails/bubble-shooter.jpg', 'games/bubble-shooter/index.html', 1, 0),
('angry-birds', 'Angry Monkey', 'puzzle', 'assets/images/thumbnails/angry-birds.png', 'games/angry-birds/index.html', 1, 0),
('minecraft-2d-craft', 'Minecraft 2D Craft', 'sandbox', 'assets/images/thumbnails/minecraft-2d-craft.jpg', 'games/minecraft-2d-craft/index.html', 1, 0),
('space-invaders', 'Space Invaders', 'arcade', 'assets/images/thumbnails/space-invaders.jpg', 'games/space-invaders/index.html', 1, 0),
('candy-crush', 'Candy Crush (Match-3)', 'puzzle', 'assets/images/thumbnails/candy-crush.jpg', 'games/candy-crush/index.html', 1, 0),
('pong', 'Pong', 'arcade', 'assets/images/thumbnails/pong.jpg', 'games/pong/index.html', 1, 0),
('breakout', 'Breakout / Arkanoid', 'arcade', 'assets/images/thumbnails/breakout.jpg', 'games/breakout/index.html', 1, 0),
('tower-defense', 'Tower Defense', 'strategy', 'assets/images/thumbnails/tower-defense.jpg', 'games/tower-defense/index.html', 1, 0),
('zombie-shooter', 'Zombie Shooter', 'action', 'assets/images/thumbnails/zombie-shooter.jpg', 'games/zombie-shooter/index.html', 1, 0),
('jumping-ninja', 'Jumping Ninja', 'platformer', 'assets/images/thumbnails/jumping-ninja.jpg', 'games/jumping-ninja/index.html', 1, 0),
('color-switch', 'Color Switch', 'arcade', 'assets/images/thumbnails/color-switch.jpg', 'games/color-switch/index.html', 1, 0),
('geometry-dash', 'Geometry Dash (Clone)', 'rhythm', 'assets/images/thumbnails/geometry-dash.jpg', 'games/geometry-dash/index.html', 1, 0),
('crossy-road', 'Crossy Road (Clone)', 'casual', 'assets/images/thumbnails/crossy-road.jpg', 'games/crossy-road/index.html', 1, 0),
('ice-cream-maker', 'Ice Cream Maker', 'cooking', 'assets/images/thumbnails/ice-cream-maker.jpg', 'games/ice-cream-maker/index.html', 1, 0),
('pizza-maker', 'Pizza Maker', 'cooking', 'assets/images/thumbnails/pizza-maker.jpg', 'games/pizza-maker/index.html', 1, 0),
('dress-up-princess', 'Dress Up Princess', 'dress-up', 'assets/images/thumbnails/dress-up-princess.jpg', 'games/dress-up-princess/index.html', 1, 0),
('puppy-care', 'Puppy Care', 'virtual-pet', 'assets/images/thumbnails/puppy-care.jpg', 'games/puppy-care/index.html', 1, 0),
('fish-tank-builder', 'Fish Tank Builder', 'casual', 'assets/images/thumbnails/fish-tank-builder.jpg', 'games/fish-tank-builder/index.html', 1, 0),
('jigsaw-puzzle', 'Jigsaw Puzzle (Animals)', 'puzzle', 'assets/images/thumbnails/jigsaw-puzzle.jpg', 'games/jigsaw-puzzle/index.html', 1, 0),
('number-puzzle', 'Number Puzzle (2048)', 'educational', 'assets/images/thumbnails/number-puzzle.jpg', 'games/number-puzzle/index.html', 1, 0),
('word-search', 'Word Search', 'educational', 'assets/images/thumbnails/word-search.jpg', 'games/word-search/index.html', 1, 0),
('math-quiz-blitz', 'Math Quiz Blitz', 'educational', 'assets/images/thumbnails/math-quiz-blitz.jpg', 'games/math-quiz-blitz/index.html', 1, 0),
('alphabet-adventure', 'Alphabet Adventure', 'educational', 'assets/images/thumbnails/alphabet-adventure.jpg', 'games/alphabet-adventure/index.html', 1, 0),
('color-coloring-book', 'Color Coloring Book', 'creative', 'assets/images/thumbnails/color-coloring-book.jpg', 'games/color-coloring-book/index.html', 1, 0),
('draw-and-guess', 'Draw & Guess', 'creative', 'assets/images/thumbnails/draw-and-guess.jpg', 'games/draw-and-guess/index.html', 1, 0),
('stickman-fighter', 'Stickman Fighter', 'action', 'assets/images/thumbnails/stickman-fighter.jpg', 'games/stickman-fighter/index.html', 1, 0),
('bike-stunt-rider', 'Dino Stunt Rider', 'racing', 'assets/images/thumbnails/bike-stunt-rider.jpg', 'games/bike-stunt-rider/index.html', 1, 0),
('underwater-adventure', 'Underwater Adventure', 'casual', 'assets/images/thumbnails/underwater-adventure.jpg', 'games/underwater-adventure/index.html', 1, 0),
('dragon-clicker', 'Dragon Clicker', 'idle', 'assets/images/thumbnails/dragon-clicker.jpg', 'games/dragon-clicker/index.html', 1, 0),
('castle-builder', 'Castle Builder', 'strategy', 'assets/images/thumbnails/castle-builder.jpg', 'games/castle-builder/index.html', 1, 0),
('ninja-sword-slash', 'Ninja Sword Slash', 'action', 'assets/images/thumbnails/ninja-sword-slash.jpg', 'games/ninja-sword-slash/index.html', 1, 0),
('penguin-jump', 'Penguin Jump', 'platformer', 'assets/images/thumbnails/penguin-jump.jpg', 'games/penguin-jump/index.html', 1, 0),
('rocket-launch', 'Rocket Launch', 'casual', 'assets/images/thumbnails/rocket-launch.jpg', 'games/rocket-launch/index.html', 1, 0),
('dinosaur-egg-hatch', 'Dinosaur Egg Hatch', 'casual', 'assets/images/thumbnails/dinosaur-egg-hatch.jpg', 'games/dinosaur-egg-hatch/index.html', 1, 0),
('farm-animal-sorter', 'Farm Animal Sorter', 'educational', 'assets/images/thumbnails/farm-animal-sorter.jpg', 'games/farm-animal-sorter/index.html', 1, 0),
('star-collector', 'Star Collector', 'casual', 'assets/images/thumbnails/star-collector.jpg', 'games/star-collector/index.html', 1, 0),
('monster-truck-rally', 'Monster Truck Rally', 'racing', 'assets/images/thumbnails/monster-truck-rally.jpg', 'games/monster-truck-rally/index.html', 1, 0),
('space-explorer', 'Space Explorer', 'casual', 'assets/images/thumbnails/space-explorer.jpg', 'games/space-explorer/index.html', 1, 0),
('holiday-card-maker', 'Holiday Card Maker', 'creative', 'assets/images/thumbnails/holiday-card-maker.jpg', 'games/holiday-card-maker/index.html', 1, 0);

-- 4. Table: analytics
CREATE TABLE analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('game_view', 'ad_impression', 'ad_skip', 'ad_click') NOT NULL,
    game_id INT NULL,
    ad_slot VARCHAR(100) NULL,
    ip_hash VARCHAR(64) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Table: site_settings
CREATE TABLE site_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Site Settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_name', 'KidsGameZone'),
('site_tagline', 'Play 50 Free Kids Games Online!'),
('seo_description', 'Free browser games for kids aged 5-14. Play puzzle, racing, arcade and educational games instantly!'),
('maintenance_mode', '0'),
('google_analytics_id', '');
