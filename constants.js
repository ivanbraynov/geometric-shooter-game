// Game Constants

const ENEMY_TYPES = {
    DRONE: 0,
    SCOUT: 1,
    HEAVY: 2
};

const POWERUP_TYPES = {
    RAPID_FIRE: 'rapid_fire',
    EXTRA_LIFE: 'extra_life',
    NUKE: 'nuke'
    // Add other types here later, e.g., SHIELD: 'shield'
};

const GAME_SETTINGS = {
    FPS: 60, // Target frame rate
    POWERUP_DURATION_S: 10, // Default power-up duration in seconds
    RAPID_FIRE_MULTIPLIER: 0.7, // Multiplier for fire rate during rapid fire
    RAPID_FIRE_SPREAD_ANGLE: Math.PI / 18, // Angle for spread shot (radians)
};

const BOSS_SETTINGS = {
    HEALTH: 50,
    ENTRY_Y: 160, // Y position where boss stops
    SPAWN_WAVE: 15, // First boss wave
    SPAWN_INTERVAL: 20, // Boss appears every 20 waves after first (increased)
    INVULNERABLE_TIME: 120 // Frames boss is invulnerable after entering (e.g. 2 seconds at 60fps)
};