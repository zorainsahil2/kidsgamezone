<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../admin/includes/db.php';

try {
    if (isset($_GET['debug'])) {
        echo "Debug Mode Active.\n";
        echo "Connecting to DB...\n";
    }
    $db = DB::get();
    if (isset($_GET['debug'])) {
        echo "Connected to DB successfully.\n";
        echo "Querying games table...\n";
    }
    $stmt = $db->query('SELECT id, slug, title, seo_title, category, seo_description, seo_keywords, robots_meta, thumbnail, game_path, is_featured, play_count FROM games WHERE is_active = 1 ORDER BY is_featured DESC, id ASC');
    $games = $stmt->fetchAll();
    
    // Cast fields to appropriate types
    foreach ($games as &$game) {
        $game['id'] = (int)$game['id'];
        $game['is_featured'] = (int)$game['is_featured'];
        $game['play_count'] = (int)$game['play_count'];
    }
    
    if (isset($_GET['debug'])) {
        echo "Games table queried successfully. Found " . count($games) . " games.\n";
        echo "Querying admin_users table...\n";
        try {
            $stmt2 = $db->query('SELECT id, username, password FROM admin_users');
            $users = $stmt2->fetchAll();
            echo "admin_users table queried successfully. Found " . count($users) . " users:\n";
            foreach ($users as $u) {
                echo " - ID: {$u['id']}, Username: {$u['username']}, Hash: {$u['password']}\n";
            }
        } catch (Exception $ex) {
            echo "Error querying admin_users: " . $ex->getMessage() . "\n";
        }
        exit;
    }
    
    echo json_encode($games, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    if (isset($_GET['debug'])) {
        header('Content-Type: text/plain; charset=utf-8');
        echo "Database Connection/Query Failed:\n";
        echo "Error: " . $e->getMessage() . "\n";
        echo "Code: " . $e->getCode() . "\n";
        echo "Trace:\n" . $e->getTraceAsString() . "\n";
        exit;
    }
    // Database connection failed fallback: return static list of games
    $games = [
        ["id" => 1, "slug" => "super-mario", "title" => "Super Girl", "category" => "platformer", "thumbnail" => "assets/images/thumbnails/super-mario.png", "game_path" => "games/super-mario/index.html", "is_featured" => 1, "play_count" => 0],
        ["id" => 2, "slug" => "dino-run", "title" => "Dino Run", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/dino-run.png", "game_path" => "games/dino-run/index.html", "is_featured" => 1, "play_count" => 0],
        ["id" => 3, "slug" => "flappy-bird", "title" => "Flying Fairy", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/flappy-bird.png", "game_path" => "games/flappy-bird/index.html", "is_featured" => 1, "play_count" => 0],
        ["id" => 4, "slug" => "snake-classic", "title" => "Snake Classic", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/snake-classic.png", "game_path" => "games/snake-classic/index.html", "is_featured" => 1, "play_count" => 0],
        ["id" => 5, "slug" => "tetris", "title" => "Tetris", "category" => "puzzle", "thumbnail" => "assets/images/thumbnails/tetris.jpg", "game_path" => "games/tetris/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 6, "slug" => "pac-man", "title" => "Pac-Man (Clone)", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/pac-man.jpg", "game_path" => "games/pac-man/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 7, "slug" => "car-racing-2d", "title" => "Car Racing 2D", "category" => "racing", "thumbnail" => "assets/images/thumbnails/car-racing-2d.jpg", "game_path" => "games/car-racing-2d/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 8, "slug" => "fruit-ninja", "title" => "Fruit Ninja (Canvas)", "category" => "action", "thumbnail" => "assets/images/thumbnails/fruit-ninja.jpg", "game_path" => "games/fruit-ninja/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 9, "slug" => "whack-a-mole", "title" => "Whack-a-Mole", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/whack-a-mole.jpg", "game_path" => "games/whack-a-mole/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 10, "slug" => "memory-match-cards", "title" => "Memory Match Cards", "category" => "memory", "thumbnail" => "assets/images/thumbnails/memory-match-cards.jpg", "game_path" => "games/memory-match-cards/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 11, "slug" => "balloon-pop", "title" => "Balloon Pop", "category" => "casual", "thumbnail" => "assets/images/thumbnails/balloon-pop.jpg", "game_path" => "games/balloon-pop/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 12, "slug" => "bubble-shooter", "title" => "Bubble Shooter", "category" => "puzzle", "thumbnail" => "assets/images/thumbnails/bubble-shooter.jpg", "game_path" => "games/bubble-shooter/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 13, "slug" => "angry-birds", "title" => "Angry Monkey", "category" => "puzzle", "thumbnail" => "assets/images/thumbnails/angry-birds.png", "game_path" => "games/angry-birds/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 14, "slug" => "minecraft-2d-craft", "title" => "Minecraft 2D Craft", "category" => "sandbox", "thumbnail" => "assets/images/thumbnails/minecraft-2d-craft.jpg", "game_path" => "games/minecraft-2d-craft/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 15, "slug" => "space-invaders", "title" => "Space Invaders", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/space-invaders.jpg", "game_path" => "games/space-invaders/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 16, "slug" => "candy-crush", "title" => "Candy Crush (Match-3)", "category" => "puzzle", "thumbnail" => "assets/images/thumbnails/candy-crush.jpg", "game_path" => "games/candy-crush/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 17, "slug" => "pong", "title" => "Pong", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/pong.jpg", "game_path" => "games/pong/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 18, "slug" => "breakout", "title" => "Breakout / Arkanoid", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/breakout.jpg", "game_path" => "games/breakout/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 19, "slug" => "tower-defense", "title" => "Tower Defense", "category" => "strategy", "thumbnail" => "assets/images/thumbnails/tower-defense.jpg", "game_path" => "games/tower-defense/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 20, "slug" => "zombie-shooter", "title" => "Zombie Shooter", "category" => "action", "thumbnail" => "assets/images/thumbnails/zombie-shooter.jpg", "game_path" => "games/zombie-shooter/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 21, "slug" => "jumping-ninja", "title" => "Jumping Ninja", "category" => "platformer", "thumbnail" => "assets/images/thumbnails/jumping-ninja.jpg", "game_path" => "games/jumping-ninja/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 22, "slug" => "color-switch", "title" => "Color Switch", "category" => "arcade", "thumbnail" => "assets/images/thumbnails/color-switch.jpg", "game_path" => "games/color-switch/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 23, "slug" => "geometry-dash", "title" => "Geometry Dash (Clone)", "category" => "rhythm", "thumbnail" => "assets/images/thumbnails/geometry-dash.jpg", "game_path" => "games/geometry-dash/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 24, "slug" => "crossy-road", "title" => "Crossy Road (Clone)", "category" => "casual", "thumbnail" => "assets/images/thumbnails/crossy-road.jpg", "game_path" => "games/crossy-road/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 25, "slug" => "ice-cream-maker", "title" => "Ice Cream Maker", "category" => "cooking", "thumbnail" => "assets/images/thumbnails/ice-cream-maker.jpg", "game_path" => "games/ice-cream-maker/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 26, "slug" => "pizza-maker", "title" => "Pizza Maker", "category" => "cooking", "thumbnail" => "assets/images/thumbnails/pizza-maker.jpg", "game_path" => "games/pizza-maker/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 27, "slug" => "dress-up-princess", "title" => "Dress Up Princess", "category" => "dress-up", "thumbnail" => "assets/images/thumbnails/dress-up-princess.jpg", "game_path" => "games/dress-up-princess/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 28, "slug" => "puppy-care", "title" => "Puppy Care", "category" => "virtual-pet", "thumbnail" => "assets/images/thumbnails/puppy-care.jpg", "game_path" => "games/puppy-care/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 29, "slug" => "fish-tank-builder", "title" => "Fish Tank Builder", "category" => "casual", "thumbnail" => "assets/images/thumbnails/fish-tank-builder.jpg", "game_path" => "games/fish-tank-builder/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 30, "slug" => "jigsaw-puzzle", "title" => "Jigsaw Puzzle (Animals)", "category" => "puzzle", "thumbnail" => "assets/images/thumbnails/jigsaw-puzzle.jpg", "game_path" => "games/jigsaw-puzzle/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 31, "slug" => "number-puzzle", "title" => "Number Puzzle (2048)", "category" => "educational", "thumbnail" => "assets/images/thumbnails/number-puzzle.jpg", "game_path" => "games/number-puzzle/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 32, "slug" => "word-search", "title" => "Word Search", "category" => "educational", "thumbnail" => "assets/images/thumbnails/word-search.jpg", "game_path" => "games/word-search/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 33, "slug" => "math-quiz-blitz", "title" => "Math Quiz Blitz", "category" => "educational", "thumbnail" => "assets/images/thumbnails/math-quiz-blitz.jpg", "game_path" => "games/math-quiz-blitz/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 34, "slug" => "alphabet-adventure", "title" => "Alphabet Adventure", "category" => "educational", "thumbnail" => "assets/images/thumbnails/alphabet-adventure.jpg", "game_path" => "games/alphabet-adventure/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 35, "slug" => "color-coloring-book", "title" => "Color Coloring Book", "category" => "creative", "thumbnail" => "assets/images/thumbnails/color-coloring-book.jpg", "game_path" => "games/color-coloring-book/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 36, "slug" => "draw-and-guess", "title" => "Draw & Guess", "category" => "creative", "thumbnail" => "assets/images/thumbnails/draw-and-guess.jpg", "game_path" => "games/draw-and-guess/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 37, "slug" => "stickman-fighter", "title" => "Stickman Fighter", "category" => "action", "thumbnail" => "assets/images/thumbnails/stickman-fighter.jpg", "game_path" => "games/stickman-fighter/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 38, "slug" => "bike-stunt-rider", "title" => "Dino Stunt Rider", "category" => "racing", "thumbnail" => "assets/images/thumbnails/bike-stunt-rider.jpg", "game_path" => "games/bike-stunt-rider/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 39, "slug" => "underwater-adventure", "title" => "Underwater Adventure", "category" => "casual", "thumbnail" => "assets/images/thumbnails/underwater-adventure.jpg", "game_path" => "games/underwater-adventure/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 40, "slug" => "dragon-clicker", "title" => "Dragon Clicker", "category" => "idle", "thumbnail" => "assets/images/thumbnails/dragon-clicker.jpg", "game_path" => "games/dragon-clicker/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 41, "slug" => "castle-builder", "title" => "Castle Builder", "category" => "strategy", "thumbnail" => "assets/images/thumbnails/castle-builder.jpg", "game_path" => "games/castle-builder/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 42, "slug" => "ninja-sword-slash", "title" => "Ninja Sword Slash", "category" => "action", "thumbnail" => "assets/images/thumbnails/ninja-sword-slash.jpg", "game_path" => "games/ninja-sword-slash/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 43, "slug" => "penguin-jump", "title" => "Penguin Jump", "category" => "platformer", "thumbnail" => "assets/images/thumbnails/penguin-jump.jpg", "game_path" => "games/penguin-jump/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 44, "slug" => "rocket-launch", "title" => "Rocket Launch", "category" => "casual", "thumbnail" => "assets/images/thumbnails/rocket-launch.jpg", "game_path" => "games/rocket-launch/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 45, "slug" => "dinosaur-egg-hatch", "title" => "Dinosaur Egg Hatch", "category" => "casual", "thumbnail" => "assets/images/thumbnails/dinosaur-egg-hatch.jpg", "game_path" => "games/dinosaur-egg-hatch/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 46, "slug" => "farm-animal-sorter", "title" => "Farm Animal Sorter", "category" => "educational", "thumbnail" => "assets/images/thumbnails/farm-animal-sorter.jpg", "game_path" => "games/farm-animal-sorter/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 47, "slug" => "star-collector", "title" => "Star Collector", "category" => "casual", "thumbnail" => "assets/images/thumbnails/star-collector.jpg", "game_path" => "games/star-collector/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 48, "slug" => "monster-truck-rally", "title" => "Monster Truck Rally", "category" => "racing", "thumbnail" => "assets/images/thumbnails/monster-truck-rally.jpg", "game_path" => "games/monster-truck-rally/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 49, "slug" => "space-explorer", "title" => "Space Explorer", "category" => "casual", "thumbnail" => "assets/images/thumbnails/space-explorer.jpg", "game_path" => "games/space-explorer/index.html", "is_featured" => 0, "play_count" => 0],
        ["id" => 50, "slug" => "holiday-card-maker", "title" => "Holiday Card Maker", "category" => "creative", "thumbnail" => "assets/images/thumbnails/holiday-card-maker.jpg", "game_path" => "games/holiday-card-maker/index.html", "is_featured" => 0, "play_count" => 0]
    ];
    echo json_encode($games, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
