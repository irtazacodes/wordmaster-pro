class OptionsManager {
    constructor() {
        this.defaultSettings = {
            readingSpeed: 200,
            speakingSpeed: 130,
            wordsPerPage: 500,
            theme: 'light',
            includeStopwords: true,
            keywordDensityThreshold: 3
        };
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(this.defaultSettings);
            
            // Safely populate form fields only if elements exist
            const readingSpeedEl = document.getElementById('readingSpeed');
            const speakingSpeedEl = document.getElementById('speakingSpeed');
            const wordsPerPageEl = document.getElementById('wordsPerPage');
            const themeEl = document.getElementById('theme');
            const includeStopwordsEl = document.getElementById('includeStopwords');
            const keywordDensityThresholdEl = document.getElementById('keywordDensityThreshold');
            
            if (readingSpeedEl) readingSpeedEl.value = settings.readingSpeed;
            if (speakingSpeedEl) speakingSpeedEl.value = settings.speakingSpeed;
            if (wordsPerPageEl) wordsPerPageEl.value = settings.wordsPerPage;
            if (themeEl) themeEl.value = settings.theme;
            if (includeStopwordsEl) includeStopwordsEl.checked = settings.includeStopwords;
            if (keywordDensityThresholdEl) keywordDensityThresholdEl.value = settings.keywordDensityThreshold;
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    setupEventListeners() {
        const optionsForm = document.getElementById('optionsForm');
        const resetButton = document.getElementById('resetButton');
        
        if (optionsForm) {
            optionsForm.addEventListener('submit', (e) => this.saveSettings(e));
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetToDefaults());
        }
    }

    async saveSettings(event) {
        event.preventDefault();
        
        const readingSpeedEl = document.getElementById('readingSpeed');
        const speakingSpeedEl = document.getElementById('speakingSpeed');
        const wordsPerPageEl = document.getElementById('wordsPerPage');
        const themeEl = document.getElementById('theme');
        const includeStopwordsEl = document.getElementById('includeStopwords');
        const keywordDensityThresholdEl = document.getElementById('keywordDensityThreshold');

        // Check if all required elements exist
        if (!readingSpeedEl || !speakingSpeedEl || !wordsPerPageEl || !themeEl || !includeStopwordsEl || !keywordDensityThresholdEl) {
            this.showStatus('Error: Form elements not found', 'error');
            return;
        }

        const settings = {
            readingSpeed: parseInt(readingSpeedEl.value) || this.defaultSettings.readingSpeed,
            speakingSpeed: parseInt(speakingSpeedEl.value) || this.defaultSettings.speakingSpeed,
            wordsPerPage: parseInt(wordsPerPageEl.value) || this.defaultSettings.wordsPerPage,
            theme: themeEl.value,
            includeStopwords: includeStopwordsEl.checked,
            keywordDensityThreshold: parseFloat(keywordDensityThresholdEl.value) || this.defaultSettings.keywordDensityThreshold
        };

        // Validate settings
        if (settings.readingSpeed < 100 || settings.readingSpeed > 400) {
            this.showStatus('Reading speed must be between 100 and 400 WPM', 'error');
            return;
        }

        if (settings.speakingSpeed < 100 || settings.speakingSpeed > 200) {
            this.showStatus('Speaking speed must be between 100 and 200 WPM', 'error');
            return;
        }

        if (settings.wordsPerPage < 250 || settings.wordsPerPage > 1000) {
            this.showStatus('Words per page must be between 250 and 1000', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set(settings);
            this.showStatus('Settings saved successfully!', 'success');
            
            // Update theme immediately if changed
            if (settings.theme === 'auto') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.body.setAttribute('data-theme', systemTheme);
            } else {
                document.body.setAttribute('data-theme', settings.theme);
            }
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    async resetToDefaults() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            await chrome.storage.sync.set(this.defaultSettings);
            await this.loadSettings();
            this.showStatus('Settings reset to defaults!', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showStatus('Error resetting settings', 'error');
        }
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';
            
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize options manager when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager().init();
});

// Handle system theme changes for auto theme
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        chrome.storage.sync.get(['theme']).then(settings => {
            if (settings.theme === 'auto') {
                const systemTheme = e.matches ? 'dark' : 'light';
                document.body.setAttribute('data-theme', systemTheme);
            }
        });
    });
}