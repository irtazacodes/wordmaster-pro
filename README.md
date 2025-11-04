# WordMaster Pro

A fast, modern word & character counter for writers and SEO specialists with 20+ advanced metrics, context-menu integration, and beautiful blue-gradient UI.

## Features

### Core Metrics
- **Word Count** - Accurate word counting with Unicode support
- **Character Count** - With and without spaces
- **Read Time** - Based on configurable reading speed
- **Speaking Time** - Based on configurable speaking speed
- **Pages Estimate** - Configurable words per page
- **Sentences & Paragraphs** - Smart detection

### Advanced Analytics
- **Average Word Length** - Character count per word
- **Average Sentence Length** - Words per sentence
- **Long Words Detection** - Words with 7+ characters
- **Flesch Reading Ease** - Readability score
- **Flesch-Kincaid Grade Level** - US education level
- **Keyword Density** - Analyze specific keywords
- **Top Keywords** - Most frequent words
- **Character Distribution** - Advanced text analysis

### User Experience
- **Context Menu Integration** - Right-click "Analyze Selected Text" anywhere
- **Beautiful UI** - Modern blue gradient design with animations
- **Keyboard Friendly** - Full keyboard navigation support
- **Responsive Design** - Works on all screen sizes
- **Offline First** - All analysis runs locally, no internet required
- **Privacy Focused** - No data leaves your computer

## Installation

### Chrome Web Store
1. Visit the Chrome Web Store
2. Search for "WordMaster Pro"
3. Click "Add to Chrome"

### Development Build
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

## Usage

### Basic Text Analysis
1. Click the WordMaster Pro icon in the toolbar
2. Paste or type text into the input area
3. View instant metrics and analysis

### Context Menu Analysis
1. Select text on any webpage
2. Right-click and choose "Analyze Selected Text — WordMaster Pro"
3. The popup will open with analysis of your selection

### Keyboard Shortcut
- Press `Ctrl+Shift+W` (Windows) or `Command+Shift+W` (Mac) to open the popup

## Building from Source

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Build Steps
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build for development with watch mode
npm run dev