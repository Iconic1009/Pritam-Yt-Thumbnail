export class YoutubeThumbnailDownloader {
    constructor({
        urlInput,
        downloadBtn,
        resultsSection,
        thumbnailsContainer,
        clearResultsBtn,
        errorElement
    }) {
        this.urlInput = urlInput;
        this.downloadBtn = downloadBtn;
        this.resultsSection = resultsSection;
        this.thumbnailsContainer = thumbnailsContainer;
        this.clearResultsBtn = clearResultsBtn;
        this.errorElement = errorElement;
        this.isLoading = false;
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.downloadBtn.addEventListener('click', () => this.handleFetchThumbnails());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleFetchThumbnails();
        });
        this.clearResultsBtn.addEventListener('click', () => this.clearResults());
    }

    async handleFetchThumbnails() {
        if (this.isLoading) return;
        
        const youtubeUrl = this.urlInput.value.trim();
        
        if (!youtubeUrl) {
            this.showError('Please enter a YouTube URL');
            return;
        }
        
        const videoId = this.extractVideoId(youtubeUrl);
        
        if (!videoId) {
            this.showError('Invalid YouTube URL. Please check and try again.');
            return;
        }
        
        try {
            this.setLoading(true);
            this.clearResults();
            this.hideError();
            
            const availableThumbnails = await this.getAvailableThumbnails(videoId);
            
            if (availableThumbnails.length === 0) {
                this.showError('No thumbnails available for this video. It may be private or deleted.');
                return;
            }
            
            this.displayThumbnails(availableThumbnails, videoId);
        } catch (error) {
            console.error('Error fetching thumbnails:', error);
            this.showError('Error fetching thumbnails. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    extractVideoId(url) {
        // Regular expressions to match various YouTube URL formats
        const patterns = [
            // Standard URLs
            /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/,
            // YouTube Shorts
            /^.*(?:youtube\.com\/shorts\/)([^#&?]{11}).*/,
            // YouTube Live
            /^.*(?:youtube\.com\/live\/)([^#&?]{11}).*/,
            // Shortened youtu.be URLs
            /^.*(?:youtu\.be\/)([^#&?]{11}).*/,
            // Playlist URLs with video ID
            /^.*(?:youtube\.com\/playlist\?list=.*&v=)([^#&?]{11}).*/,
            // Just the video ID itself
            /^([^#&?]{11})$/,
            // Attribution links
            /^.*(?:youtube\.com\/attribution_link\?.*v%3D([^#&?]{11})).*/,
            // Mobile URLs
            /^.*(?:youtube\.com\/v\/)([^#&?]{11}).*/,
            // Embedded URLs
            /^.*(?:youtube\.com\/embed\/)([^#&?]{11}).*/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    getThumbnailOptions(videoId) {
        return [
            { resolution: 'Max Resolution', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` },
            { resolution: 'High Quality', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
            { resolution: 'Medium Quality', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
            { resolution: 'Standard Quality', url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg` },
            { resolution: 'Default', url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
            { resolution: 'Start (1st frame)', url: `https://img.youtube.com/vi/${videoId}/1.jpg` },
            { resolution: 'Middle (2nd frame)', url: `https://img.youtube.com/vi/${videoId}/2.jpg` },
            { resolution: 'End (3rd frame)', url: `https://img.youtube.com/vi/${videoId}/3.jpg` },
            { resolution: 'Start (120x90 Small)', url: `https://img.youtube.com/vi/${videoId}/0.jpg` }
        ];
    }

    async getAvailableThumbnails(videoId) {
        const thumbnails = this.getThumbnailOptions(videoId);
        
        const thumbnailChecks = thumbnails.map(async thumbnail => {
            try {
                const exists = await this.checkImageExists(thumbnail.url);
                return exists ? thumbnail : null;
            } catch {
                return null;
            }
        });
        
        const results = await Promise.all(thumbnailChecks);
        return results.filter(thumbnail => thumbnail !== null);
    }

    checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            // Add timeout to prevent hanging on unresponsive requests
            setTimeout(() => resolve(false), 3000);
        });
    }

    displayThumbnails(thumbnails, videoId) {
        this.thumbnailsContainer.innerHTML = '';
        
        thumbnails.forEach(thumbnail => {
            const thumbnailCard = document.createElement('article');
            thumbnailCard.className = 'thumbnail-card';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'thumbnail-img-container';
            
            const img = document.createElement('img');
            img.src = thumbnail.url;
            img.alt = `YouTube thumbnail - ${thumbnail.resolution}`;
            img.loading = 'lazy';
            img.className = 'thumbnail-img';
            img.decoding = 'async';
            
            const resolution = document.createElement('p');
            resolution.className = 'thumbnail-title';
            resolution.textContent = thumbnail.resolution;
            
            const downloadBtn = document.createElement('a');
            downloadBtn.href = thumbnail.url;
            downloadBtn.download = this.generateFilename(videoId, thumbnail.resolution);
            downloadBtn.className = 'download-link';
            downloadBtn.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i> Download';
            
            thumbnailCard.appendChild(imgContainer);
            imgContainer.appendChild(img);
            
            const content = document.createElement('div');
            content.className = 'thumbnail-content';
            content.appendChild(resolution);
            content.appendChild(downloadBtn);
            thumbnailCard.appendChild(content);
            
            this.thumbnailsContainer.appendChild(thumbnailCard);
        });
        
        this.resultsSection.classList.remove('hidden');
    }

    generateFilename(videoId, resolution) {
        const cleanResolution = resolution.toLowerCase()
            .replace(/\([^)]*\)/g, '') // Remove parentheses content
            .replace(/[^\w\s-]/g, '')  // Remove special chars
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-')       // Remove consecutive hyphens
            .replace(/^-+|-+$/g, '');  // Trim hyphens from start/end
            
        return `thumbnail-${videoId}-${cleanResolution}.jpg`;
    }

    clearResults() {
        this.thumbnailsContainer.innerHTML = '';
        this.resultsSection.classList.add('hidden');
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.downloadBtn.disabled = isLoading;
        
        const btnText = document.getElementById('btn-text');
        const btnLoader = document.getElementById('btn-loader');
        
        if (isLoading) {
            btnText.textContent = 'Processing...';
            btnLoader.classList.remove('hidden');
        } else {
            btnText.textContent = 'Get Thumbnails';
            btnLoader.classList.add('hidden');
        }
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.classList.remove('hidden');
        
        // Remove error after 5 seconds if not already cleared
        this.errorTimeout = setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        this.errorElement.classList.add('hidden');
        this.errorElement.textContent = '';
    }
}
