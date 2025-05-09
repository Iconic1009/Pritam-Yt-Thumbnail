document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('theme') || 
                         (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the initial theme
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

    // Thumbnail downloader functionality
    const downloadBtn = document.getElementById('download-btn');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const resultsSection = document.getElementById('results');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const clearResultsBtn = document.getElementById('clear-results');
    const thumbnailsContainer = document.querySelector('.thumbnails-container');

    // Clear results button
    clearResultsBtn.addEventListener('click', function() {
        resultsSection.classList.add('hidden');
        thumbnailsContainer.innerHTML = '';
        youtubeUrlInput.value = '';
        youtubeUrlInput.focus();
    });

    // Handle thumbnail download
    downloadBtn.addEventListener('click', getThumbnails);
    youtubeUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getThumbnails();
        }
    });

    async function getThumbnails() {
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            alert('Please enter a YouTube video URL');
            return;
        }

        // Show loading state
        youtubeUrlInput.disabled = true;
        downloadBtn.disabled = true;
        btnText.textContent = 'Processing...';
        btnLoader.classList.remove('hidden');

        try {
            const videoId = extractVideoId(youtubeUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL. Please try again with a valid URL.');
            }

            const thumbnails = {
                'Max Resolution': `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                'High Quality': `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                'Medium Quality': `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                'Standard Quality': `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
                'Default': `https://img.youtube.com/vi/${videoId}/0.jpg`
            };

            displayThumbnails(videoId, thumbnails);
            youtubeUrlInput.value = '';
        } catch (error) {
            alert(error.message);
        } finally {
            // Reset button state
            youtubeUrlInput.disabled = false;
            downloadBtn.disabled = false;
            btnText.textContent = 'Get Thumbnails';
            btnLoader.classList.add('hidden');
            youtubeUrlInput.focus();
        }
    }

    function extractVideoId(url) {
        // Regular YouTube patterns
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        
        // YouTube Shorts pattern
        const shortsRegex = /youtube\.com\/shorts\/([^#&?]*)/;
        const shortsMatch = url.match(shortsRegex);
        
        return (match && match[2].length === 11) ? match[2] :
               (shortsMatch && shortsMatch[1].length === 11) ? shortsMatch[1] :
               null;
    }

    function displayThumbnails(videoId, thumbnails) {
        thumbnailsContainer.innerHTML = '';
        
        for (const [quality, url] of Object.entries(thumbnails)) {
            const thumbnailBox = document.createElement('div');
            thumbnailBox.className = 'thumbnail-box';
            
            thumbnailBox.innerHTML = `
                <img src="${url}" alt="${quality} thumbnail" onerror="this.onerror=null;this.src='${thumbnails['High Quality']}'">
                <div class="thumbnail-info">
                    <h3>${quality}</h3>
                    <button class="download-btn" 
                            data-url="${url}" 
                            data-filename="youtube-thumbnail-${videoId}-${quality.toLowerCase().replace(/\s+/g, '-')}.jpg">
                        Download
                    </button>
                </div>
            `;
            
            thumbnailsContainer.appendChild(thumbnailBox);
        }
        
        // Set up download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
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
        // Try fetching first for better error handling
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
                // Fallback for CORS issues
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
    }
});
