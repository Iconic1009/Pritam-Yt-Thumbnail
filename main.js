import { YoutubeThumbnailDownloader } from './downloader.js';

export function initializeApp() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize the thumbnail downloader
    const downloader = new YoutubeThumbnailDownloader({
        urlInput: document.getElementById('youtube-url'),
        downloadBtn: document.getElementById('download-btn'),
        resultsSection: document.getElementById('results'),
        thumbnailsContainer: document.querySelector('.thumbnails-grid'),
        clearResultsBtn: document.getElementById('clear-results'),
        errorElement: document.getElementById('error-display')
    });
    
    downloader.init();
}
