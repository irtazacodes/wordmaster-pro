class TextAnalyzer {
    constructor() {
        this.settings = {
            readingSpeed: 200,
            speakingSpeed: 130,
            wordsPerPage: 500,
            includeStopwords: true,
            keywordDensityThreshold: 3
        };
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.checkForSelectedText();
    }

    async loadSettings() {
        const result = await chrome.storage.sync.get([
            'readingSpeed',
            'speakingSpeed', 
            'wordsPerPage',
            'includeStopwords',
            'keywordDensityThreshold',
            'theme'
        ]);
        
        this.settings = { ...this.settings, ...result };
        
        if (this.settings.theme) {
            document.body.setAttribute('data-theme', this.settings.theme);
        }
    }

    setupEventListeners() {
        // Safely add event listeners only if elements exist
        const analyzeBtn = document.getElementById('analyzeText');
        const clearBtn = document.getElementById('clearText');
        const toggleAdvanced = document.getElementById('toggleAdvanced');
        const analyzeKeywordsBtn = document.getElementById('analyzeKeywords');
        const keywordInput = document.getElementById('keywordInput');
        const copyReportBtn = document.getElementById('copyReport');
        const exportCSVBtn = document.getElementById('exportCSV');
        const openOptionsBtn = document.getElementById('openOptions');
        const textInput = document.getElementById('textInput');
        
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.analyzeText());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearText());
        
        if (toggleAdvanced) {
            toggleAdvanced.addEventListener('click', (e) => {
                const content = document.getElementById('advancedContent');
                if (content) {
                    const isHidden = content.classList.contains('hidden');
                    const button = e.currentTarget;
                    
                    content.classList.toggle('hidden');
                    button.setAttribute('aria-expanded', !isHidden);
                }
            });
        }

        if (analyzeKeywordsBtn) analyzeKeywordsBtn.addEventListener('click', () => this.analyzeKeywords());
        
        if (keywordInput) {
            keywordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.analyzeKeywords();
            });
        }

        if (copyReportBtn) copyReportBtn.addEventListener('click', () => this.copyReport());
        if (exportCSVBtn) exportCSVBtn.addEventListener('click', () => this.exportCSV());
        if (openOptionsBtn) openOptionsBtn.addEventListener('click', () => this.openOptions());

        // Auto-analyze when text changes (with debounce)
        if (textInput) {
            let timeout;
            textInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (e.target.value.trim().length > 0) {
                        this.analyzeText();
                    }
                }, 500);
            });
        }
    }

    async checkForSelectedText() {
        const result = await chrome.storage.session.get(['selectedText', 'analysisSource']);
        if (result.selectedText && result.analysisSource === 'context-menu') {
            document.getElementById('textInput').value = result.selectedText;
            this.analyzeText();
            // Clear the session storage after use
            chrome.storage.session.remove(['selectedText', 'analysisSource']);
        }
    }

    analyzeText() {
        const text = document.getElementById('textInput').value.trim();
        if (!text) return;

        const metrics = this.calculateAllMetrics(text);
        this.updateUI(metrics);
    }

    calculateAllMetrics(text) {
        const words = this.getWords(text);
        const sentences = this.getSentences(text);
        const paragraphs = this.getParagraphs(text);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        
        return {
            wordCount: words.length,
            charCount: characters,
            charNoSpacesCount: charactersNoSpaces,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            readTime: this.calculateReadTime(words.length),
            speakingTime: this.calculateSpeakingTime(words.length),
            pages: this.calculatePages(words.length),
            avgWordLength: this.calculateAvgWordLength(words),
            avgSentenceLength: this.calculateAvgSentenceLength(words, sentences.length),
            longWords: this.getLongWords(words),
            fleschReadingEase: this.calculateFleschReadingEase(words, sentences.length),
            fleschKincaidGrade: this.calculateFleschKincaidGrade(words, sentences.length),
            topKeywords: this.getTopKeywords(words),
            words: words,
            text: text
        };
    }

    getWords(text) {
        // Use Unicode-aware word splitting
        return text.match(/\p{L}+/gu) || [];
    }

    getSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    getParagraphs(text) {
        return text.split(/\n+/).filter(p => p.trim().length > 0);
    }

    calculateReadTime(wordCount) {
        const minutes = wordCount / this.settings.readingSpeed;
        return this.formatTime(minutes);
    }

    calculateSpeakingTime(wordCount) {
        const minutes = wordCount / this.settings.speakingSpeed;
        return this.formatTime(minutes);
    }

    calculatePages(wordCount) {
        return (wordCount / this.settings.wordsPerPage).toFixed(2);
    }

    calculateAvgWordLength(words) {
        if (words.length === 0) return 0;
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        return (totalLength / words.length).toFixed(1);
    }

    calculateAvgSentenceLength(words, sentenceCount) {
        if (sentenceCount === 0) return 0;
        return (words.length / sentenceCount).toFixed(1);
    }

    getLongWords(words) {
        return words.filter(word => word.length >= 7);
    }

    calculateFleschReadingEase(words, sentenceCount) {
        if (words.length === 0 || sentenceCount === 0) return 0;
        
        const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        const avgSentenceLength = words.length / sentenceCount;
        const avgSyllablesPerWord = totalSyllables / words.length;
        
        return (206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)).toFixed(1);
    }

    calculateFleschKincaidGrade(words, sentenceCount) {
        if (words.length === 0 || sentenceCount === 0) return 0;
        
        const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        const avgSentenceLength = words.length / sentenceCount;
        const avgSyllablesPerWord = totalSyllables / words.length;
        
        return (0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1);
    }

    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? Math.max(1, syllables.length) : 1;
    }

    getTopKeywords(words, limit = 10) {
        const frequency = {};
        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            frequency[lowerWord] = (frequency[lowerWord] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    }

    formatTime(minutes) {
        if (minutes < 1) {
            const seconds = Math.round(minutes * 60);
            return `${seconds}s`;
        } else {
            const mins = Math.floor(minutes);
            const secs = Math.round((minutes - mins) * 60);
            return `${mins}m ${secs}s`;
        }
    }

    updateUI(metrics) {
        // Update basic metrics with animation
        this.animateValue('wordCount', metrics.wordCount);
        this.animateValue('charCount', metrics.charCount);
        this.animateValue('charNoSpacesCount', metrics.charNoSpacesCount);
        this.setTextContent('readTime', metrics.readTime);
        this.setTextContent('speakingTime', metrics.speakingTime);
        this.setTextContent('pagesCount', metrics.pages);
        this.animateValue('sentenceCount', metrics.sentenceCount);
        this.animateValue('paragraphCount', metrics.paragraphCount);

        // Update advanced metrics
        this.setTextContent('avgWordLength', metrics.avgWordLength);
        this.setTextContent('avgSentenceLength', metrics.avgSentenceLength);
        this.animateValue('longWordsCount', metrics.longWords.length);
        this.setTextContent('fleschReadingEase', metrics.fleschReadingEase);
        this.setTextContent('fleschKincaidGrade', metrics.fleschKincaidGrade);

        // Store metrics for later use
        this.currentMetrics = metrics;

        // Update top keywords
        this.updateTopKeywords(metrics.topKeywords);
        
        // Update long words list
        this.updateLongWordsList(metrics.longWords);
    }

    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const duration = 800;
        const startTime = performance.now();

        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(currentValue + (targetValue - currentValue) * easeOut);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };

        requestAnimationFrame(updateValue);
    }

    setTextContent(elementId, value) {
        document.getElementById(elementId).textContent = value;
    }

    updateTopKeywords(keywords) {
        const container = document.getElementById('topKeywords');
        container.innerHTML = keywords.map(item => `
            <div class="top-keyword-item">
                <span>${item.word}</span>
                <span>${item.count}</span>
            </div>
        `).join('');
    }

    updateLongWordsList(longWords) {
        const container = document.getElementById('longWordsList');
        const uniqueWords = [...new Set(longWords)].slice(0, 20); // Show top 20 unique long words
        container.innerHTML = uniqueWords.map(word => `
            <div class="keyword-item">
                <span>${word}</span>
            </div>
        `).join('');
    }

    analyzeKeywords() {
        if (!this.currentMetrics) return;

        const keywordInput = document.getElementById('keywordInput').value.trim();
        if (!keywordInput) return;

        const keywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
        const resultsContainer = document.getElementById('keywordResults');
        
        const results = keywords.map(keyword => {
            const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
            const matches = this.currentMetrics.text.match(regex);
            const count = matches ? matches.length : 0;
            const density = ((count / this.currentMetrics.wordCount) * 100).toFixed(2);
            
            return { keyword, count, density };
        });

        resultsContainer.innerHTML = results.map(result => `
            <div class="keyword-item ${parseFloat(result.density) > this.settings.keywordDensityThreshold ? 'overuse-warning' : ''}">
                <span><strong>${result.keyword}</strong></span>
                <span>${result.count} (${result.density}%)</span>
            </div>
        `).join('');

        // Add warning tooltip for overused keywords
        document.querySelectorAll('.overuse-warning').forEach(element => {
            element.title = `Keyword density exceeds ${this.settings.keywordDensityThreshold}% - consider reducing usage`;
        });
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async copyReport() {
        if (!this.currentMetrics) return;

        const report = this.generateReport();
        try {
            await navigator.clipboard.writeText(report);
            this.showNotification('Report copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy report:', err);
        }
    }

    async exportCSV() {
        if (!this.currentMetrics) return;

        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wordmaster-pro-analysis.csv';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    generateReport() {
        const m = this.currentMetrics;
        return `WordMaster Pro Analysis Report
===============================

Basic Metrics:
- Words: ${m.wordCount}
- Characters: ${m.charCount}
- Characters (no spaces): ${m.charNoSpacesCount}
- Sentences: ${m.sentenceCount}
- Paragraphs: ${m.paragraphCount}
- Read Time: ${m.readTime}
- Speaking Time: ${m.speakingTime}
- Pages: ${m.pages}

Advanced Metrics:
- Average Word Length: ${m.avgWordLength}
- Average Sentence Length: ${m.avgSentenceLength}
- Long Words (≥7 chars): ${m.longWords.length}
- Flesch Reading Ease: ${m.fleschReadingEase}
- Flesch-Kincaid Grade: ${m.fleschKincaidGrade}

Generated by WordMaster Pro
`;
    }

    generateCSV() {
        const m = this.currentMetrics;
        return `Metric,Value
Words,${m.wordCount}
Characters,${m.charCount}
Characters (no spaces),${m.charNoSpacesCount}
Sentences,${m.sentenceCount}
Paragraphs,${m.paragraphCount}
Read Time,${m.readTime}
Speaking Time,${m.speakingTime}
Pages,${m.pages}
Average Word Length,${m.avgWordLength}
Average Sentence Length,${m.avgSentenceLength}
Long Words,${m.longWords.length}
Flesch Reading Ease,${m.fleschReadingEase}
Flesch-Kincaid Grade,${m.fleschKincaidGrade}`;
    }

    openOptions() {
        chrome.runtime.openOptionsPage();
    }

    clearText() {
        document.getElementById('textInput').value = '';
        // Reset all metrics to 0
        const metrics = this.calculateAllMetrics('');
        this.updateUI(metrics);
    }

    showNotification(message) {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            color: var(--text-primary);
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the analyzer when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextAnalyzer().init();
});