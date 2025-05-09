document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('theme') || 
                         (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the current theme
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Theme toggle button click handler
    themeToggle.addEventListener('click', function() {
        if (document.body.hasAttribute('data-theme')) {
            document.body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    });

    // YouTube thumbnail downloader functionality
    const downloadBtn = document.getElementById('download-btn');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const resultsSection = document.getElementById('results');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const clearResultsBtn = document.getElementById('clear-results');

    // Clear results button
    clearResultsBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        document.querySelector('.thumbnails-container').innerHTML = '';
    });

    // Handle form submission
    downloadBtn.addEventListener('click', getThumbnail);
    youtubeUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') getThumbnail();
    });

    async function getThumbnail() {
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            showError('Please enter a YouTube URL');
            return;
        }

        // Show loading state
        youtubeUrlInput.disabled = true;
        btnText.textContent = 'Processing...';
        btnLoader.classList.remove('hidden');
        downloadBtn.disabled = true;

        try {
            const videoId = extractVideoId(youtubeUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            const thumbnails = await generateThumbnailUrls(videoId);
            displayThumbnails(videoId, thumbnails);
            
            // Clear input after successful fetch
            youtubeUrlInput.value = '';
        } catch (error) {
            showError(error.message);
        } finally {
            // Reset button state
            youtubeUrlInput.disabled = false;
            btnText.textContent = 'Get Thumbnail';
            btnLoader.classList.add('hidden');
            downloadBtn.disabled = false;
            youtubeUrlInput.focus();
        }
    }

    function extractVideoId(url) {
        // Standard YouTube URLs
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        
        // YouTube Shorts
        const shortsRegex = /youtube\.com\/shorts\/([^#&?\/]*)/;
        const shortsMatch = url.match(shortsRegex);
        
        // YouTube Music
        const musicRegex = /music\.youtube\.com\/watch\?v=([^#&?]*)/;
        const musicMatch = url.match(musicRegex);

        // Mobile URLs
        const mobileRegex = /m\.youtube\.com\/watch\?v=([^#&?]*)/;
        const mobileMatch = url.match(mobileRegex);

        // Embed URLs
        const embedRegex = /youtube\.com\/embed\/([^#&?]*)/;
        const embedMatch = url.match(embedRegex);

        return (match && match[2].length === 11) ? match[2] :
               (shortsMatch && shortsMatch[1].length === 11) ? shortsMatch[1] :
               musicMatch ? musicMatch[1] :
               mobileMatch ? mobileMatch[1] :
               embedMatch ? embedMatch[1] : null;
    }

    async function generateThumbnailUrls(videoId) {
        // All possible thumbnail variations
        const thumbnails = {
            maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
            default: `https://img.youtube.com/vi/${videoId}/0.jpg`
        };

        // Return with fallback URLs in case some thumbnails don't exist
        return {
            'Maximum Resolution (HD)': thumbnails.maxres,
            'High Quality (480p)': thumbnails.hq,
            'Medium Quality (360p)': thumbnails.mq,
            'Standard Quality': thumbnails.sd || thumbnails.default
        };
    }

    function displayThumbnails(videoId, thumbnails) {
        const container = document.querySelector('.thumbnails-container');
        container.innerHTML = '';

        for (const [quality, url] of Object.entries(thumbnails)) {
            const thumbnailBox = document.createElement('div');
            thumbnailBox.className = 'thumbnail-box';
            
            thumbnailBox.innerHTML = `
                <img src="${url}" alt="${quality} thumbnail" onerror="this.onerror=null;this.src='${thumbnails['High Quality (480p)']}'">
                <div class="quality-info">
                    <h3>${quality}</h3>
                    <button class="download-thumbnail" data-url="${url}" data-filename="thumbnail-${videoId}-${quality.toLowerCase().replace(/\s+/g, '-')}.jpg">
                        Download
                    </button>
                </div>
            `;
            
            container.appendChild(thumbnailBox);
        }

        // Set up download buttons
        document.querySelectorAll('.download-thumbnail').forEach(btn => {
            btn.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                const filename = this.getAttribute('data-filename');
                downloadImage(url, filename);
            });
        });

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function downloadImage(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
            })
            .catch(() => {
                // Fallback method for CORS issues
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
    }

    function showError(message) {
        alert(message);
    }
});
    
