document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const elements = {
        tabButtons: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        imageUpload: document.getElementById('image-upload'),
        imageUrl: document.getElementById('image-url'),
        loadUrlBtn: document.getElementById('load-url'),
        pixelSizeSlider: document.getElementById('pixel-size'),
        pixelSizeValue: document.getElementById('pixel-size-value'),
        colorReductionSlider: document.getElementById('color-reduction'),
        colorReductionValue: document.getElementById('color-reduction-value'),
        processBtn: document.getElementById('process-btn'),
        downloadBtn: document.getElementById('download-btn'),
        resetBtn: document.getElementById('reset-btn'),
        previewPlaceholder: document.getElementById('preview-placeholder'),
        originalPreview: document.getElementById('original-preview'),
        pixelatedPreview: document.getElementById('pixelated-preview'),
        loading: document.getElementById('loading'),
        colorPalette: document.getElementById('color-palette'),
        colorCount: document.getElementById('color-count')
    };
    
    // State management
    const state = {
        originalImage: null,
        pixelatedImageData: null,
        isProcessing: false
    };
    
    // Constants
    const MAX_IMAGE_SIZE = 800;
    const DEBOUNCE_DELAY = 300;
    
    // Initialize UI
    initUI();
    
    // Event listeners setup
    function initUI() {
        // Tab navigation
        elements.tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
        
        // Sliders
        elements.pixelSizeSlider.addEventListener('input', () => updateSliderValue(elements.pixelSizeValue, elements.pixelSizeSlider.value));
        elements.colorReductionSlider.addEventListener('input', () => updateSliderValue(elements.colorReductionValue, elements.colorReductionSlider.value));
        
        // Image loading
        elements.imageUpload.addEventListener('change', handleImageUpload);
        elements.loadUrlBtn.addEventListener('click', handleUrlLoad);
        
        // Preview area - drag and drop
        setupDragAndDrop();
        
        // Action buttons
        elements.processBtn.addEventListener('click', () => {
            if (state.originalImage && !state.isProcessing) {
                processImage();
            }
        });
        
        elements.downloadBtn.addEventListener('click', downloadProcessedImage);
        elements.resetBtn.addEventListener('click', resetApp);
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // Handle tab switching
    function handleTabClick() {
        const tabId = this.getAttribute('data-tab');
        
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        elements.tabContents.forEach(content => content.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }
    
    // Update slider values with visual feedback
    function updateSliderValue(element, value) {
        element.textContent = value;
        element.classList.add('highlight');
        setTimeout(() => element.classList.remove('highlight'), 300);
    }
    
    // Handle file upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (!isValidImageFile(file)) {
                showNotification('Please select a valid image file (JPG, PNG, GIF, etc.)', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = event => loadImage(event.target.result);
            reader.onerror = () => showNotification('Error reading the file', 'error');
            reader.readAsDataURL(file);
        }
    }
    
    // Validate image files
    function isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        return validTypes.includes(file.type);
    }
    
    // Handle URL loading
    function handleUrlLoad() {
        const url = elements.imageUrl.value.trim();
        if (!url) {
            showNotification('Please enter an image URL', 'warning');
            return;
        }
        
        // Validate URL format
        try {
            new URL(url);
            loadImage(url);
        } catch (e) {
            showNotification('Please enter a valid URL', 'error');
        }
    }
    
    // Setup drag and drop functionality
    function setupDragAndDrop() {
        const previewArea = document.querySelector('.preview-area');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            previewArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            previewArea.addEventListener(eventName, () => {
                previewArea.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            previewArea.addEventListener(eventName, () => {
                previewArea.classList.remove('drag-over');
            }, false);
        });
        
        previewArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            
            if (file && isValidImageFile(file)) {
                elements.imageUpload.files = dt.files;
                const reader = new FileReader();
                reader.onload = event => loadImage(event.target.result);
                reader.readAsDataURL(file);
            } else if (file) {
                showNotification('Please drop a valid image file', 'error');
            }
        }
    }
    
    // Load image with error handling and CORS support
    function loadImage(src) {
        showLoading(true);
        elements.previewPlaceholder.style.display = 'none';
        
        // Clear previous image if there was one
        if (state.originalImage) {
            state.originalImage = null;
        }
        
        state.originalImage = new Image();
        state.originalImage.crossOrigin = 'Anonymous';
        
        state.originalImage.onload = function() {
            elements.originalPreview.src = src;
            elements.originalPreview.style.display = 'block';
            elements.pixelatedPreview.style.display = 'none';
            elements.downloadBtn.disabled = true;
            showLoading(false);
            
            // Enable the process button
            elements.processBtn.disabled = false;
            elements.processBtn.classList.add('wobble');
            setTimeout(() => elements.processBtn.classList.remove('wobble'), 1000);
        };
        
        state.originalImage.onerror = function() {
            showNotification('Failed to load image. Check the URL or try a different image.', 'error');
            elements.previewPlaceholder.style.display = 'block';
            showLoading(false);
            state.originalImage = null;
        };
        
        // Add a timeout for loading
        const loadingTimeout = setTimeout(() => {
            if (!state.originalImage.complete) {
                state.originalImage.src = '';
                showNotification('Image loading timed out. Try a different image or check your connection.', 'error');
                elements.previewPlaceholder.style.display = 'block';
                showLoading(false);
            }
        }, 20000); // 20 seconds timeout
        
        state.originalImage.onload = function() {
            clearTimeout(loadingTimeout);
            elements.originalPreview.src = src;
            elements.originalPreview.style.display = 'block';
            elements.pixelatedPreview.style.display = 'none';
            elements.downloadBtn.disabled = true;
            showLoading(false);
            
            // Enable the process button
            elements.processBtn.disabled = false;
        };
        
        state.originalImage.src = src;
    }
    
    // Process image with optimization
    function processImage() {
        if (!state.originalImage || state.isProcessing) return;
        
        state.isProcessing = true;
        showLoading(true);
        
        // Use requestAnimationFrame to not block the UI
        requestAnimationFrame(() => {
            try {
                const pixelSize = parseInt(elements.pixelSizeSlider.value);
                const colorLimit = parseInt(elements.colorReductionSlider.value);
                
                // Get optimized dimensions
                const dimensions = getOptimizedDimensions(state.originalImage.width, state.originalImage.height);
                
                // Create small canvas for pixelation
                const smallCanvas = createDownsampledCanvas(dimensions, pixelSize);
                
                // Apply color reduction with optimized algorithm
                const { processedCanvas, colorPalette } = reduceColors(smallCanvas, colorLimit);
                
                // Upscale and display pixelated result
                const finalCanvas = upscalePixelArt(processedCanvas, pixelSize);
                
                // Update the display
                updatePixelatedPreview(finalCanvas);
                updateColorPalette(colorPalette);
                
                // Hide original and show pixelated
                elements.originalPreview.style.display = 'none';
                elements.pixelatedPreview.style.display = 'block';
                elements.downloadBtn.disabled = false;
                
                // Add animation to download button
                elements.downloadBtn.classList.add('heartbeat');
                setTimeout(() => elements.downloadBtn.classList.remove('heartbeat'), 1500);
            } catch (error) {
                console.error('Error processing image:', error);
                showNotification('Error processing image. Please try again.', 'error');
            } finally {
                showLoading(false);
                state.isProcessing = false;
            }
        });
    }
    
    // Calculate optimal dimensions while preserving aspect ratio
    function getOptimizedDimensions(originalWidth, originalHeight) {
        const aspectRatio = originalWidth / originalHeight;
        let width = originalWidth;
        let height = originalHeight;
        
        if (width > height && width > MAX_IMAGE_SIZE) {
            width = MAX_IMAGE_SIZE;
            height = Math.round(width / aspectRatio);
        } else if (height > MAX_IMAGE_SIZE) {
            height = MAX_IMAGE_SIZE;
            width = Math.round(height * aspectRatio);
        }
        
        return { width, height };
    }
    
    // Create downsampled canvas for pixelation
    function createDownsampledCanvas(dimensions, pixelSize) {
        const smallCanvas = document.createElement('canvas');
        const smallCtx = smallCanvas.getContext('2d', { alpha: true });
        
        // Calculate small canvas dimensions
        const smallWidth = Math.max(1, Math.floor(dimensions.width / pixelSize));
        const smallHeight = Math.max(1, Math.floor(dimensions.height / pixelSize));
        
        smallCanvas.width = smallWidth;
        smallCanvas.height = smallHeight;
        
        // Use better quality downsampling
        smallCtx.imageSmoothingEnabled = true;
        smallCtx.imageSmoothingQuality = 'high';
        smallCtx.drawImage(state.originalImage, 0, 0, smallWidth, smallHeight);
        
        return smallCanvas;
    }
    
    // Reduce colors using optimized algorithm
    function reduceColors(canvas, colorLimit) {
        const ctx = canvas.getContext('2d', { alpha: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        
        // Use a more efficient color quantization algorithm
        const colorMap = {};
        
        // Step 1: Count color frequencies (use a string key for efficiency)
        for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            const a = pixelData[i + 3];
            
            // Skip fully transparent pixels
            if (a === 0) continue;
            
            const key = `${r},${g},${b}`;
            
            if (!colorMap[key]) {
                colorMap[key] = { r, g, b, count: 0 };
            }
            
            colorMap[key].count++;
        }
        
        // Step 2: Convert to array and sort by frequency
        const colors = Object.values(colorMap);
        colors.sort((a, b) => b.count - a.count);
        
        // Step 3: Limit to the specified number of colors
        const limitedColors = colors.slice(0, colorLimit);
        
        // Step 4: Map each pixel to the closest color in our palette
        for (let i = 0; i < pixelData.length; i += 4) {
            // Skip fully transparent pixels
            if (pixelData[i + 3] === 0) continue;
            
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            
            // Find closest color using perceptual distance (weighted euclidean)
            let closestColor = limitedColors[0];
            let minDistance = colorDistance(r, g, b, closestColor.r, closestColor.g, closestColor.b);
            
            for (let j = 1; j < limitedColors.length; j++) {
                const color = limitedColors[j];
                const distance = colorDistance(r, g, b, color.r, color.g, color.b);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = color;
                }
            }
            
            pixelData[i] = closestColor.r;
            pixelData[i + 1] = closestColor.g;
            pixelData[i + 2] = closestColor.b;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return {
            processedCanvas: canvas,
            colorPalette: limitedColors
        };
    }
    
    // Use weighted euclidean distance for better color matching perception
    function colorDistance(r1, g1, b1, r2, g2, b2) {
        // Weighted RGB - human eye is more sensitive to green
        const rMean = (r1 + r2) / 2;
        const r = r1 - r2;
        const g = g1 - g2;
        const b = b1 - b2;
        
        // Weights based on human perception
        return Math.sqrt(
            (2 + rMean/256) * r*r + 
            4 * g*g + 
            (2 + (255-rMean)/256) * b*b
        );
    }
    
    // Upscale the pixel art with nearest neighbor
    function upscalePixelArt(smallCanvas, pixelSize) {
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d', { alpha: true });
        
        finalCanvas.width = smallCanvas.width * pixelSize;
        finalCanvas.height = smallCanvas.height * pixelSize;
        
        // Use nearest-neighbor for pixelated look
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.drawImage(smallCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
        
        return finalCanvas;
    }
    
    // Update the preview canvas with the processed image
    function updatePixelatedPreview(canvas) {
        elements.pixelatedPreview.width = canvas.width;
        elements.pixelatedPreview.height = canvas.height;
        const pixelCtx = elements.pixelatedPreview.getContext('2d', { alpha: true });
        pixelCtx.clearRect(0, 0, canvas.width, canvas.height);
        pixelCtx.drawImage(canvas, 0, 0);
        
        // Store pixelated image data for download
        state.pixelatedImageData = canvas.toDataURL('image/png');
    }
    
    // Create and display color palette UI
    function updateColorPalette(colors) {
        elements.colorPalette.innerHTML = '';
        
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch fade-scale-in';
            swatch.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
            
            // Add color data for tooltip and copy feature
            const hexColor = rgbToHex(color.r, color.g, color.b);
            swatch.setAttribute('data-color', hexColor);
            swatch.title = `${hexColor} (${color.count} pixels)`;
            
            // Add click to copy color code
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(hexColor)
                    .then(() => showNotification(`Copied ${hexColor} to clipboard`, 'info'))
                    .catch(() => showNotification('Failed to copy to clipboard', 'error'));
            });
            
            elements.colorPalette.appendChild(swatch);
        });
        
        elements.colorCount.textContent = colors.length;
    }
    
    // Convert RGB to HEX
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    // Download the processed image
    function downloadProcessedImage() {
        if (!state.pixelatedImageData) return;
        
        const link = document.createElement('a');
        link.download = 'pixelg-image-' + new Date().getTime() + '.png';
        link.href = state.pixelatedImageData;
        link.click();
        
        showNotification('Image downloaded successfully!', 'success');
    }
    
    // Reset the app
    function resetApp() {
        elements.imageUpload.value = '';
        elements.imageUrl.value = '';
        elements.previewPlaceholder.style.display = 'block';
        elements.originalPreview.style.display = 'none';
        elements.pixelatedPreview.style.display = 'none';
        elements.downloadBtn.disabled = true;
        elements.colorPalette.innerHTML = '';
        elements.colorCount.textContent = '0';
        
        state.originalImage = null;
        state.pixelatedImageData = null;
        
        showNotification('Reset complete', 'info');
    }
    
    // Handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + P to process
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (state.originalImage && !state.isProcessing) {
                processImage();
            }
        }
        
        // Ctrl/Cmd + S to save/download
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (state.pixelatedImageData) {
                downloadProcessedImage();
            }
        }
        
        // Escape key to reset
        if (e.key === 'Escape') {
            resetApp();
        }
    }
    
    // Show/hide loading indicator
    function showLoading(isLoading) {
        elements.loading.style.display = isLoading ? 'block' : 'none';
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Different icons based on notification type
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});
