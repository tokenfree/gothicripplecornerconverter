import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RotateCw, Waves, Sparkles } from 'lucide-react';

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

    for (let i = 0; i < newData.length; i += 4) {
      newData[i + 3] = 0;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distFromLeft = x;
        const distFromRight = width - x;
        const distFromTop = y;
        const distFromBottom = height - y;
        const minDistFromEdge = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom);

        let rippleOffset = 0;
        let shouldInclude = true;

        if (minDistFromEdge < intensity * 2) {
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

          const cutoffThreshold = minDistFromEdge + rippleOffset;
          if (cutoffThreshold < intensity * 0.8) {
            shouldInclude = false;
          }
        }

        if (shouldInclude) {
          const sourceIndex = (y * width + x) * 4;
          const targetIndex = (y * width + x) * 4;

          if (sourceIndex >= 0 && sourceIndex < data.length) {
            newData[targetIndex] = data[sourceIndex];
            newData[targetIndex + 1] = data[sourceIndex + 1];
            newData[targetIndex + 2] = data[sourceIndex + 2];
            newData[targetIndex + 3] = data[sourceIndex + 3];
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

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    const processedImageData = createRippleEffect(
      ctx,
      canvas.width,
      canvas.height,
      rippleIntensity,
      rippleFrequency,
      wavePattern
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(processedImageData, 0, 0);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b10] via-[#11131a] to-[#0d1016] text-white">
      <header className="border-b border-white/10 bg-[#16181f]/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-[#7dc4ff]">Gothic Ripple Converter</h1>
          <p className="mt-2 text-white/70">Transform your images with refined ripple effects</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <Upload className="mr-2 h-5 w-5 text-[#0A84FF]" />
                Upload Image
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="cursor-pointer rounded-lg border-2 border-dashed border-white/15 p-8 text-center transition-colors hover:border-[#0A84FF]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-4 h-12 w-12 text-white/40" />
                <p className="mb-2 text-white/75">Drag & drop an image here, or click to select</p>
                <p className="text-sm text-white/45">Supports JPG, PNG, GIF formats</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="mb-4 flex items-center text-xl font-semibold">
                <Waves className="mr-2 h-5 w-5 text-[#0A84FF]" />
                Ripple Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Wave Pattern
                  </label>
                  <select
                    value={wavePattern}
                    onChange={(e) => setWavePattern(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#171a22] px-3 py-2 text-white focus:border-[#0A84FF] focus:outline-none"
                  >
                    <option value="gothic">Gothic Waves</option>
                    <option value="organic">Organic Flow</option>
                    <option value="flame">Flame Pattern</option>
                    <option value="thorns">Thorny Edges</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Ripple Intensity: {rippleIntensity}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={rippleIntensity}
                    onChange={(e) => setRippleIntensity(Number(e.target.value))}
                    className="slider w-full cursor-pointer appearance-none rounded-lg bg-white/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Wave Frequency: {(rippleFrequency * 1000).toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={rippleFrequency}
                    onChange={(e) => setRippleFrequency(Number(e.target.value))}
                    className="slider w-full cursor-pointer appearance-none rounded-lg bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center text-xl font-semibold">
                  <Sparkles className="mr-2 h-5 w-5 text-[#0A84FF]" />
                  Preview
                </h2>
                {processedImage && (
                  <button
                    onClick={downloadImage}
                    className="flex items-center space-x-2 rounded-lg bg-[#0A84FF] px-4 py-2 transition-colors hover:bg-[#0077ED]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>

              <div className="relative flex min-h-96 items-center justify-center rounded-lg bg-[#0b0d13] p-4">
                {isProcessing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#0b0d13]/80 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <RotateCw className="h-6 w-6 animate-spin text-[#0A84FF]" />
                      <span className="text-white/70">Processing...</span>
                    </div>
                  </div>
                )}

                {processedImage ? (
                  <div className="max-h-96 max-w-full overflow-hidden rounded-lg">
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="max-h-96 max-w-full rounded-lg object-contain shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="text-center text-white/40">
                    <Sparkles className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p>Your gothic ripple effect will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-white/85">Pattern Effects</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <h4 className="mb-1 font-medium text-[#7dc4ff]">Gothic Waves</h4>
                  <p className="text-white/70">Mysterious flowing edges</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <h4 className="mb-1 font-medium text-[#7dc4ff]">Organic Flow</h4>
                  <p className="text-white/70">Natural, smooth curves</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <h4 className="mb-1 font-medium text-[#7dc4ff]">Flame Pattern</h4>
                  <p className="text-white/70">Fiery, dynamic edges</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <h4 className="mb-1 font-medium text-[#7dc4ff]">Thorny Edges</h4>
                  <p className="text-white/70">Sharp, angular distortions</p>
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
          background: linear-gradient(180deg, #8fd0ff, #0a84ff);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(10, 132, 255, 0.35);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(180deg, #8fd0ff, #0a84ff);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(10, 132, 255, 0.35);
        }
      `}</style>
    </div>
  );
}

export default App;
