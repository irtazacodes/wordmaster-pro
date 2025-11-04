// Content script for keyword highlighting and text selection
class ContentScript {
    constructor() {
        this.highlightedElements = [];
        this.init();
    }

    init() {
        // Listen for messages from popup or service worker
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "highlightKeywords") {
                if (request.remove) {
                    this.removeHighlights();
                } else if (request.keywords && request.keywords.length > 0) {
                    this.highlightKeywords(request.keywords);
                }
                sendResponse({ success: true });
            }
            
            if (request.action === "getSelectedText") {
                sendResponse({ text: this.getSelectedText() });
            }
        });
    }

    getSelectedText() {
        return window.getSelection().toString().trim();
    }

    highlightKeywords(keywords) {
        this.removeHighlights(); // Clear existing highlights first

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.nodeValue;
            let newHTML = text;
            
            keywords.forEach(keyword => {
                if (keyword.trim()) {
                    const regex = new RegExp(this.escapeRegex(keyword.trim()), 'gi');
                    newHTML = newHTML.replace(regex, match => 
                        `<mark class="wordmaster-highlight" data-keyword="${keyword}">${match}</mark>`
                    );
                }
            });

            if (newHTML !== text) {
                const span = document.createElement('span');
                span.innerHTML = newHTML;
                node.parentNode.replaceChild(span, node);
                this.highlightedElements.push(span);
            }
        }

        // Add styles for highlights
        this.addHighlightStyles();
    }

    removeHighlights() {
        this.highlightedElements.forEach(element => {
            const parent = element.parentNode;
            if (parent) {
                parent.replaceChild(
                    document.createTextNode(element.textContent),
                    element
                );
            }
        });
        this.highlightedElements = [];
        
        // Remove highlight styles
        const existingStyle = document.getElementById('wordmaster-highlight-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
    }

    addHighlightStyles() {
        if (document.getElementById('wordmaster-highlight-styles')) return;

        const styles = `
            .wordmaster-highlight {
                background: linear-gradient(120deg, #0ea5ff, #3b82f6);
                color: white;
                padding: 2px 4px;
                border-radius: 4px;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(14, 165, 255, 0.3);
                animation: wordmaster-pulse 2s infinite;
            }
            
            @keyframes wordmaster-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .wordmaster-highlight:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(14, 165, 255, 0.4);
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = 'wordmaster-highlight-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize content script
new ContentScript();