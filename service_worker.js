// Register context menu and handle background tasks
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "analyze-selected-text",
    title: "Analyze Selected Text — WordMaster Pro",
    contexts: ["selection"]
  });

  // Set default settings
  chrome.storage.sync.get({
    readingSpeed: 200,
    speakingSpeed: 130,
    wordsPerPage: 500,
    theme: 'light',
    language: 'en',
    includeStopwords: true,
    keywordDensityThreshold: 3
  }, (items) => {
    chrome.storage.sync.set(items);
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-selected-text" && info.selectionText) {
    // Store selected text for popup to read
    chrome.storage.session.set({ 
      selectedText: info.selectionText,
      analysisSource: 'context-menu'
    }).then(() => {
      // Open the popup
      chrome.action.openPopup();
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    chrome.storage.session.get(['selectedText']).then((result) => {
      sendResponse({ text: result.selectedText || '' });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === "highlightKeywords") {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      files: ['content_script.js']
    }).then(() => {
      chrome.tabs.sendMessage(request.tabId, {
        action: "highlightKeywords",
        keywords: request.keywords,
        remove: request.remove
      });
    });
  }
});