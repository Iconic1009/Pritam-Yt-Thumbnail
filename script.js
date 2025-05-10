document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Toggle FAQ answers
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            question.classList.toggle('active');
            const answer = question.nextElementSibling;
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // YouTube thumbnail downloader functionality
    const downloadBtn = document.getElementById('download-btn');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const resultsSection = document.getElementById('results');

    downloadBtn.addEventListener('click', getThumbnail);
    youtubeUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getThumbnail();
        }
    });

    function getThumbnail() {
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            alert('Please enter a YouTube video URL');
            return;
        }

        // Check if it's a valid YouTube URL
        const videoId = extractVideoId(youtubeUrl);
        if (!videoId) {
            alert('Invalid YouTube URL. Please check and try again.');
            return;
        }

        // Generate thumbnail URLs
        const thumbnails = {
            maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
        };

        // Display thumbnails
        for (const [quality, url] of Object.entries(thumbnails)) {
            const img = document.getElementById(quality);
            img.src = url;
            img.onerror = function() {
                // If maxres doesn't exist, fall back to hq
                if (quality === 'maxres') {
                    img.src = thumbnails.hq;
                }
            };
        }

        // Set up download buttons
        document.querySelectorAll('.download-thumbnail').forEach(btn => {
            btn.onclick = function() {
                const quality = this.getAttribute('data-quality');
                const thumbnailUrl = thumbnails[quality];
                downloadImage(thumbnailUrl, `youtube-thumbnail-${videoId}-${quality}.jpg`);
            };
        });

        // Show results section
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function extractVideoId(url) {
        // Regular YouTube URL patterns
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        if (match && match[2].length === 11) {
            return match[2];
        }
        
        // YouTube Shorts pattern
        const shortsRegex = /youtube\.com\/shorts\/([^#&?\/]*)/;
        const shortsMatch = url.match(shortsRegex);
        
        if (shortsMatch && shortsMatch[1].length === 11) {
            return shortsMatch[1];
        }
        
        return null;
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
});
