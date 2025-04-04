        document.addEventListener('DOMContentLoaded', function() {
            // Elementos da interface
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            const imageUpload = document.getElementById('image-upload');
            const imageUrl = document.getElementById('image-url');
            const loadUrlBtn = document.getElementById('load-url');
            const pixelSizeSlider = document.getElementById('pixel-size');
            const pixelSizeValue = document.getElementById('pixel-size-value');
            const colorReductionSlider = document.getElementById('color-reduction');
            const colorReductionValue = document.getElementById('color-reduction-value');
            const processBtn = document.getElementById('process-btn');
            const downloadBtn = document.getElementById('download-btn');
            const resetBtn = document.getElementById('reset-btn');
            const previewPlaceholder = document.getElementById('preview-placeholder');
            const originalPreview = document.getElementById('original-preview');
            const pixelatedPreview = document.getElementById('pixelated-preview');
            const loading = document.getElementById('loading');
            const colorPalette = document.getElementById('color-palette');
            const colorCount = document.getElementById('color-count');
            
            let originalImage = null;
            
            // Alternar entre abas
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabId = button.getAttribute('data-tab');
                    
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    button.classList.add('active');
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
            
            // Atualizar valores dos sliders
            pixelSizeSlider.addEventListener('input', () => {
                pixelSizeValue.textContent = pixelSizeSlider.value;
            });
            
            colorReductionSlider.addEventListener('input', () => {
                colorReductionValue.textContent = colorReductionSlider.value;
            });
            
            // Carregar imagem do upload
            imageUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        loadImage(event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // Carregar imagem da URL
            loadUrlBtn.addEventListener('click', () => {
                const url = imageUrl.value.trim();
                if (url) {
                    loadImage(url);
                }
            });
            
            // Processar imagem
            processBtn.addEventListener('click', () => {
                if (originalImage) {
                    processImage();
                }
            });
            
            // Baixar imagem processada
            downloadBtn.addEventListener('click', () => {
                if (pixelatedPreview.style.display !== 'none') {
                    const link = document.createElement('a');
                    link.download = 'pixelg-image.png';
                    link.href = pixelatedPreview.toDataURL('image/png');
                    link.click();
                }
            });
            
            // Reiniciar
            resetBtn.addEventListener('click', () => {
                imageUpload.value = '';
                imageUrl.value = '';
                previewPlaceholder.style.display = 'block';
                originalPreview.style.display = 'none';
                pixelatedPreview.style.display = 'none';
                downloadBtn.disabled = true;
                colorPalette.innerHTML = '';
                colorCount.textContent = '0';
                originalImage = null;
            });
            
            // Carregar imagem na prévia
            function loadImage(src) {
                loading.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                
                originalImage = new Image();
                originalImage.crossOrigin = 'Anonymous';
                
                originalImage.onload = function() {
                    originalPreview.src = src;
                    originalPreview.style.display = 'block';
                    loading.style.display = 'none';
                    pixelatedPreview.style.display = 'none';
                    downloadBtn.disabled = true;
                };
                
                originalImage.onerror = function() {
                    alert('Erro ao carregar a imagem. Verifique se o URL está correto ou tente outra imagem.');
                    previewPlaceholder.style.display = 'block';
                    loading.style.display = 'none';
                    originalImage = null;
                };
                
                originalImage.src = src;
            }
            
            // Processar imagem em pixel art
            function processImage() {
                if (!originalImage) return;
                
                loading.style.display = 'block';
                
                setTimeout(() => {
                    const pixelSize = parseInt(pixelSizeSlider.value);
                    const colorLimit = parseInt(colorReductionSlider.value);
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Redimensionar para evitar imagens muito grandes
                    const maxSize = 800;
                    let width = originalImage.width;
                    let height = originalImage.height;
                    
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    
                    // Criar canvas com tamanho reduzido para o pixelate
                    const smallCanvas = document.createElement('canvas');
                    const smallCtx = smallCanvas.getContext('2d');
                    
                    // Calcular tamanho do canvas reduzido
                    const smallWidth = Math.floor(width / pixelSize);
                    const smallHeight = Math.floor(height / pixelSize);
                    
                    smallCanvas.width = smallWidth;
                    smallCanvas.height = smallHeight;
                    
                    // Desenhar imagem em tamanho reduzido
                    smallCtx.drawImage(originalImage, 0, 0, smallWidth, smallHeight);
                    
                    // Aplicar redução de cores
                    const imageData = smallCtx.getImageData(0, 0, smallWidth, smallHeight);
                    const pixelData = imageData.data;
                    
                    // Coletar todas as cores
                    const colorMap = {};
                    const colors = [];
                    
                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        const key = `${r},${g},${b}`;
                        
                        if (!colorMap[key]) {
                            colorMap[key] = { r, g, b, count: 0 };
                            colors.push(colorMap[key]);
                        }
                        
                        colorMap[key].count++;
                    }
                    
                    // Ordenar cores por frequência e limitar
                    colors.sort((a, b) => b.count - a.count);
                    const limitedColors = colors.slice(0, colorLimit);
                    
                    // Criar paleta de cores para a UI
                    colorPalette.innerHTML = '';
                    limitedColors.forEach(color => {
                        const swatch = document.createElement('div');
                        swatch.className = 'color-swatch';
                        swatch.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
                        swatch.title = `RGB(${color.r}, ${color.g}, ${color.b})`;
                        colorPalette.appendChild(swatch);
                    });
                    
                    colorCount.textContent = limitedColors.length;
                    
                    // Mapear cada pixel para a cor mais próxima na paleta limitada
                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        
                        // Encontrar a cor mais próxima na paleta
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
                    
                    smallCtx.putImageData(imageData, 0, 0);
                    
                    // Configurar o canvas final
                    canvas.width = smallWidth * pixelSize;
                    canvas.height = smallHeight * pixelSize;
                    
                    // Ampliar a imagem com pixelart rendering
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(smallCanvas, 0, 0, canvas.width, canvas.height);
                    
                    // Exibir resultado
                    pixelatedPreview.width = canvas.width;
                    pixelatedPreview.height = canvas.height;
                    const pixelCtx = pixelatedPreview.getContext('2d');
                    pixelCtx.drawImage(canvas, 0, 0);
                    
                    originalPreview.style.display = 'none';
                    pixelatedPreview.style.display = 'block';
                    loading.style.display = 'none';
                    downloadBtn.disabled = false;
                }, 100); // Pequeno delay para mostrar o loading
            }
            
            // Calcular distância entre cores (Distância euclidiana no espaço RGB)
            function colorDistance(r1, g1, b1, r2, g2, b2) {
                return Math.sqrt(
                    Math.pow(r1 - r2, 2) +
                    Math.pow(g1 - g2, 2) +
                    Math.pow(b1 - b2, 2)
                );
            }
        });