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