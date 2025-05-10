import { setupThemeToggle } from './theme.js';
import { initializeApp } from './main.js';

// Initialize theme first to prevent flash of incorrect theme
setupThemeToggle();

// Then initialize the rest of the app
initializeApp();
