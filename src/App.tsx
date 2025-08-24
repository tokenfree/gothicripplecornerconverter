import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RotateCw, Waves, Sparkles } from 'lucide-react';

interface ImageProcessor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
}

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [rippleIntensity, setRippleIntensity] = useState(20);
  const [rippleFrequency, setRippleFrequency] = useState(0.02);
  const [wavePattern, setWavePattern] = useState('gothic');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createRippleEffect = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    frequency: number,
    pattern: string
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newImageData = ctx.createImageData(width, height);
    const newData = newImageData.data;

    // Clear the new image data
    for (let i = 0; i < newData.length; i += 4) {
      newData[i + 3] = 0; // Set alpha to 0 (transparent)
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate distance from edges
        const distFromLeft = x;
        const distFromRight = width - x;
        const distFromTop = y;
        const distFromBottom = height - y;
        const minDistFromEdge = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);

        let rippleOffset = 0;
        let shouldInclude = true;

        if (minDistFromEdge < intensity * 2) {
          // Apply different wave patterns based on selection
          let waveValue = 0;
          
          switch (pattern) {
            case 'gothic':
              waveValue = Math.sin(x * frequency) * Math.cos(y * frequency * 1.3) + 
                         Math.sin(y * frequency * 0.7) * Math.cos(x * frequency * 0.8);
              break;
            case 'organic':
              waveValue = Math.sin(x * frequency * 1.2) + Math.cos(y * frequency * 0.9) + 
                         Math.sin((x + y) * frequency * 0.5);
              break;
            case 'flame':
              waveValue = Math.sin(x * frequency) * Math.sin(y * frequency * 2) + 
                         Math.cos(x * frequency * 0.3) * Math.sin(y * frequency * 1.5);
              break;
            case 'thorns':
              waveValue = Math.abs(Math.sin(x * frequency * 3)) * Math.cos(y * frequency) + 
                         Math.abs(Math.cos(y * frequency * 2)) * Math.sin(x * frequency);
              break;
            default:
              waveValue = Math.sin(x * frequency) + Math.cos(y * frequency);
          }

          rippleOffset = waveValue * (intensity - minDistFromEdge) * 0.3;
          
          // Create more dramatic cutoff for gothic effect
          const cutoffThreshold = minDistFromEdge + rippleOffset;
          if (cutoffThreshold < intensity * 0.8) {
            shouldInclude = false;
          }
        }

        if (shouldInclude) {
          const sourceIndex = (y * width + x) * 4;
          const targetIndex = (y * width + x) * 4;

          if (sourceIndex >= 0 && sourceIndex < data.length) {
            newData[targetIndex] = data[sourceIndex];         // R
            newData[targetIndex + 1] = data[sourceIndex + 1]; // G
            newData[targetIndex + 2] = data[sourceIndex + 2]; // B
            newData[targetIndex + 3] = data[sourceIndex + 3]; // A
          }
        }
      }
    }

    return newImageData;
  }, []);

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Apply ripple effect
    const processedImageData = createRippleEffect(
      ctx, 
      canvas.width, 
      canvas.height, 
      rippleIntensity, 
      rippleFrequency, 
      wavePattern
    );

    // Clear canvas and draw processed image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(processedImageData, 0, 0);

    // Convert to data URL
    setProcessedImage(canvas.toDataURL('image/png'));
    setIsProcessing(false);
  }, [image, rippleIntensity, rippleFrequency, wavePattern, createRippleEffect]);

  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, processImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = 'gothic-ripple-image.png';
      link.href = processedImage;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Gothic Ripple Converter
            </h1>
          </div>
          <p className="text-gray-300 mt-2">Transform your images with mystical ripple effects</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-purple-400" />
                Upload Image
              </h2>
              
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-300 mb-2">Drag & drop an image here, or click to select</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG, GIF formats</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Controls */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Waves className="w-5 h-5 mr-2 text-purple-400" />
                Ripple Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Wave Pattern
                  </label>
                  <select
                    value={wavePattern}
                    onChange={(e) => setWavePattern(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="gothic">Gothic Waves</option>
                    <option value="organic">Organic Flow</option>
                    <option value="flame">Flame Pattern</option>
                    <option value="thorns">Thorny Edges</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Ripple Intensity: {rippleIntensity}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={rippleIntensity}
                    onChange={(e) => setRippleIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Wave Frequency: {(rippleFrequency * 1000).toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={rippleFrequency}
                    onChange={(e) => setRippleFrequency(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                  Preview
                </h2>
                {processedImage && (
                  <button
                    onClick={downloadImage}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>

              <div className="relative bg-gray-900 rounded-lg p-4 min-h-96 flex items-center justify-center">
                {isProcessing && (
                  <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center space-x-3">
                      <RotateCw className="w-6 h-6 animate-spin text-purple-400" />
                      <span className="text-gray-300">Processing...</span>
                    </div>
                  </div>
                )}

                {processedImage ? (
                  <div className="max-w-full max-h-96 overflow-hidden rounded-lg">
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Your gothic ripple effect will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pattern Examples */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-200">Pattern Effects</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-purple-400 mb-1">Gothic Waves</h4>
                  <p className="text-gray-300">Mysterious flowing edges</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-green-400 mb-1">Organic Flow</h4>
                  <p className="text-gray-300">Natural, smooth curves</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-red-400 mb-1">Flame Pattern</h4>
                  <p className="text-gray-300">Fiery, dynamic edges</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-400 mb-1">Thorny Edges</h4>
                  <p className="text-gray-300">Sharp, angular distortions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #9333ea, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #9333ea, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

export default App;