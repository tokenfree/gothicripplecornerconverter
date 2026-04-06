import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Download, RotateCw, Sparkles, Upload, Waves } from 'lucide-react';

type WavePattern = 'gothic' | 'organic' | 'flame' | 'thorns';

type PatternOption = {
  value: WavePattern;
  label: string;
  description: string;
  tint: string;
};

const patternOptions: PatternOption[] = [
  {
    value: 'gothic',
    label: 'Gothic Waves',
    description: 'Layered cross-currents for dramatic cathedral-style contours.',
    tint: 'rgba(10, 132, 255, 0.18)',
  },
  {
    value: 'organic',
    label: 'Organic Flow',
    description: 'Softer motion with smoother transitions around the edge.',
    tint: 'rgba(48, 209, 88, 0.18)',
  },
  {
    value: 'flame',
    label: 'Flame Pattern',
    description: 'Tall, energetic peaks that feel more directional and alive.',
    tint: 'rgba(255, 159, 10, 0.2)',
  },
  {
    value: 'thorns',
    label: 'Thorny Edges',
    description: 'Sharper cuts with angular tension for aggressive silhouettes.',
    tint: 'rgba(255, 69, 58, 0.18)',
  },
];

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [rippleIntensity, setRippleIntensity] = useState(20);
  const [rippleFrequency, setRippleFrequency] = useState(0.02);
  const [wavePattern, setWavePattern] = useState<WavePattern>('gothic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<{ name: string; size: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePattern =
    patternOptions.find((pattern) => pattern.value === wavePattern) ?? patternOptions[0];

  const createRippleEffect = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      intensity: number,
      frequency: number,
      pattern: WavePattern
    ) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const newImageData = ctx.createImageData(width, height);
      const newData = newImageData.data;

      for (let index = 0; index < newData.length; index += 4) {
        newData[index + 3] = 0;
      }

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const distFromLeft = x;
          const distFromRight = width - x;
          const distFromTop = y;
          const distFromBottom = height - y;
          const minDistFromEdge = Math.min(
            distFromLeft,
            distFromRight,
            distFromTop,
            distFromBottom
          );

          let rippleOffset = 0;
          let shouldInclude = true;

          if (minDistFromEdge < intensity * 2) {
            let waveValue = 0;

            switch (pattern) {
              case 'gothic':
                waveValue =
                  Math.sin(x * frequency) * Math.cos(y * frequency * 1.3) +
                  Math.sin(y * frequency * 0.7) * Math.cos(x * frequency * 0.8);
                break;
              case 'organic':
                waveValue =
                  Math.sin(x * frequency * 1.2) +
                  Math.cos(y * frequency * 0.9) +
                  Math.sin((x + y) * frequency * 0.5);
                break;
              case 'flame':
                waveValue =
                  Math.sin(x * frequency) * Math.sin(y * frequency * 2) +
                  Math.cos(x * frequency * 0.3) * Math.sin(y * frequency * 1.5);
                break;
              case 'thorns':
                waveValue =
                  Math.abs(Math.sin(x * frequency * 3)) * Math.cos(y * frequency) +
                  Math.abs(Math.cos(y * frequency * 2)) * Math.sin(x * frequency);
                break;
            }

            rippleOffset = waveValue * (intensity - minDistFromEdge) * 0.3;

            if (minDistFromEdge + rippleOffset < intensity * 0.8) {
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
    },
    []
  );

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current) {
      return;
    }

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

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
  }, [createRippleEffect, image, rippleFrequency, rippleIntensity, wavePattern]);

  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, processImage]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setProcessedImage(null);
    setSourceInfo({ name: file.name, size: formatFileSize(file.size) });

    const reader = new FileReader();
    reader.onload = (event) => {
      const nextImage = new Image();
      nextImage.onload = () => setImage(nextImage);
      nextImage.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      loadFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file) {
      loadFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const downloadImage = () => {
    if (!processedImage) {
      return;
    }

    const link = document.createElement('a');
    link.download = 'gothic-ripple-image.png';
    link.href = processedImage;
    link.click();
  };

  const metrics = [
    { label: 'Theme', value: 'Apple-inspired' },
    { label: 'Output', value: 'Transparent PNG' },
    { label: 'Status', value: processedImage ? 'Ready to export' : 'Waiting for source' },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-14rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(10,132,255,0.28)_0%,_rgba(10,132,255,0)_72%)] blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(118,118,128,0.22)_0%,_rgba(118,118,128,0)_72%)] blur-3xl" />
        <div className="absolute left-[-10rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_0%,_rgba(255,255,255,0)_70%)] blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="glass-panel px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                Dark Mode Refresh
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Gothic Ripple Converter
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                A quieter, Apple-style workspace for shaping dramatic edges with more depth,
                clarity, and control.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
          <section className="space-y-6">
            <div className="glass-panel px-5 py-6 sm:px-6">
              <p className="section-label">Source</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Choose an image</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Drop in a PNG, JPG, or GIF. The image is reprocessed automatically whenever you
                adjust the ripple controls.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="control-surface mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center text-center transition duration-200 hover:border-[color:var(--accent-border)] hover:bg-white/[0.06]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_16px_40px_rgba(10,132,255,0.18)]">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="mt-5 text-lg font-medium tracking-[-0.02em]">Drag and drop your image</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">
                  or click to browse from your device
                </p>
                <div className="mt-5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[var(--text-tertiary)]">
                  Auto-preview with transparent edges preserved
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {(sourceInfo || image) && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                  {sourceInfo && <span className="surface-pill">{sourceInfo.name}</span>}
                  {image && <span className="surface-pill">{image.width} x {image.height}</span>}
                  {sourceInfo && <span className="surface-pill">{sourceInfo.size}</span>}
                </div>
              )}
            </div>

            <div className="glass-panel px-5 py-6 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-label">Controls</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Ripple tuning</h2>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="apple-button-secondary"
                >
                  Replace
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {patternOptions.map((pattern) => (
                  <button
                    key={pattern.value}
                    type="button"
                    aria-pressed={wavePattern === pattern.value}
                    data-active={wavePattern === pattern.value}
                    className="pattern-card text-left"
                    onClick={() => setWavePattern(pattern.value)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {pattern.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {pattern.description}
                        </p>
                      </div>
                      <span
                        className="mt-1 h-3 w-3 rounded-full border border-white/15"
                        style={{ backgroundColor: pattern.tint }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Edge intensity
                    </label>
                    <span className="value-badge">{rippleIntensity}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={rippleIntensity}
                    onChange={(event) => setRippleIntensity(Number(event.target.value))}
                    className="slider-track"
                  />
                  <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">
                    Higher values pull the ripple deeper into the image perimeter.
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Wave frequency
                    </label>
                    <span className="value-badge">
                      {(rippleFrequency * 1000).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={rippleFrequency}
                    onChange={(event) => setRippleFrequency(Number(event.target.value))}
                    className="slider-track"
                  />
                  <p className="mt-2 text-xs leading-5 text-[var(--text-tertiary)]">
                    Smaller numbers feel calmer. Larger values create tighter edge repetition.
                  </p>
                </div>
              </div>

              <div className="subtle-panel mt-6 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Waves className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Active pattern: {activePattern.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {activePattern.description}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel flex flex-col px-5 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-label">Preview</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Live output</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                  The canvas stays centered and export-ready while you refine the silhouette.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadImage}
                disabled={!processedImage}
                className="apple-button disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG</span>
              </button>
            </div>

            <div className="mt-6 flex-1">
              <div className="preview-shell relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[32px] p-4 sm:p-6 lg:min-h-[560px]">
                {isProcessing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[32px] bg-[rgba(6,7,9,0.72)] backdrop-blur-xl">
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[var(--text-secondary)]">
                      <RotateCw className="h-4 w-4 animate-spin text-[var(--accent)]" />
                      Processing image
                    </div>
                  </div>
                )}

                {processedImage ? (
                  <img
                    src={processedImage}
                    alt="Processed preview"
                    className="relative z-[1] max-h-[520px] w-auto max-w-full rounded-[26px] border border-white/10 object-contain shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <div className="relative z-[1] flex max-w-md flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-[var(--accent)]">
                      <Sparkles className="h-9 w-9" />
                    </div>
                    <p className="mt-6 text-xl font-medium tracking-[-0.02em] text-[var(--text-primary)]">
                      Your preview will appear here
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                      Upload an image to start shaping the border with your selected ripple pattern.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Pattern
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {activePattern.label}
                </p>
              </div>
              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Intensity
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {rippleIntensity}px
                </p>
              </div>
              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Frequency
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {(rippleFrequency * 1000).toFixed(1)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}

export default App;
