"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

const DrawingInterface = () => {
  const [color, setColor] = useState<string>('#D65064');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string >('/dd.png');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>({ h: 214, s: 96, v: 100 });
  const [opacity, setOpacity] = useState(0.5);
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>('color');

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorPresets = [
    ['#FFB6C1', '#FFA07A', '#FFE4B5', '#D3D3D3', '#87CEEB', '#C0C0C0', '#FFC0CB', '#FFFFFF'],
    ['#DC143C', '#FF4500', '#FFD700', '#90EE90', '#4169E1', '#696969', '#FF69B4', '#FDF5E6']
  ];

  const blendModes = [
    { value: 'color', label: '색상' },
    { value: 'multiply', label: '곱하기' },
    { value: 'overlay', label: '오버레이' },
    { value: 'screen', label: '스크린' },
    { value: 'soft-light', label: '부드러운 빛' },
    { value: 'hard-light', label: '강한 빛' },
  ] as const;

  const handleColorPickerMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleColorPick(e);
  };

  const handleColorPick = (e: React.MouseEvent) => {
    if (!colorPickerRef.current || (!isDragging && e.type !== 'mousedown')) return;

    const rect = colorPickerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);

    const saturation = (x / rect.width) * 100;
    const brightness = 100 - (y / rect.height) * 100;

    updateColor(hsv.h, saturation, brightness);
  };

  const handleSpectrumClick = (e: React.MouseEvent) => {
    if (!spectrumRef.current) return;

    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const hue = (x / rect.width) * 360;

    updateColor(hue, hsv.s, hsv.v);
  };

  const hsvToRgb = (h: number, s: number, v: number) => {
    s = s / 100;
    v = v / 100;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r: number, g: number, b: number;
    switch (i % 6) {
      case 0: [r, g, b] = [v, t, p]; break;
      case 1: [r, g, b] = [q, v, p]; break;
      case 2: [r, g, b] = [p, v, t]; break;
      case 3: [r, g, b] = [p, q, v]; break;
      case 4: [r, g, b] = [t, p, v]; break;
      case 5: [r, g, b] = [v, p, q]; break;
      default: [r, g, b] = [0, 0, 0];
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const updateColor = (h: number, s: number, v: number) => {
    setHsv({ h, s, v });
    const rgb = hsvToRgb(h, s, v);
    setColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const applyColorToCanvas = (imageUrl: string, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 브라우저 환경에서만 Image 객체 생성
    const img = new (window.Image)();
    // 또는
    // const img = document.createElement('img');
    
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = blendMode;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };
    img.src = imageUrl;
};

  useEffect(() => {
    if (imageUrl) {
      applyColorToCanvas(imageUrl, color);
    }
  }, [color, opacity, blendMode, imageUrl]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleColorPick(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleGenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setImageUrl('/api/placeholder/512/512');
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Toolbar */}
      <div className="w-64 bg-white p-4 shadow-lg">
        {/* Prompt Input */}
        <div className="mb-6">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="프롬프트 입력"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Color Section */}
        <div className="mb-6">
          <div className="text-sm mb-2">색상</div>
          
          {/* Main Color Picker */}
          <div 
            ref={colorPickerRef}
            className="relative w-full h-40 rounded-lg cursor-crosshair"
            style={{
              backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
              backgroundImage: 'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)'
            }}
            onMouseDown={handleColorPickerMouseDown}
          >
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
              }}
            />
          </div>
          
          {/* Color Spectrum */}
          <div
            ref={spectrumRef}
            className="h-4 mt-2 rounded-full cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
            }}
            onClick={handleSpectrumClick}
          >
            <div
              className="absolute w-2 h-6 -mt-1 -translate-x-1/2 border-2 border-white rounded pointer-events-none"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          {/* Blend Mode Selection */}
          <div className="mt-4">
            <div className="text-sm mb-2">블렌드 모드</div>
            <select
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)}
              className="w-full p-2 border rounded"
            >
              {blendModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Opacity Control */}
          <div className="mt-4">
            <div className="text-sm mb-2">색상 강도</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(opacity * 100)}%
            </div>
          </div>

          {/* HSV Values */}
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <div>#{color.substring(1).toUpperCase()}</div>
            <div>{Math.round(hsv.h)}</div>
            <div>{Math.round(hsv.s)}</div>
            <div>{Math.round(hsv.v)}</div>
          </div>

          {/* Color Presets */}
          <div className="mt-4">
            {colorPresets.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-8 gap-1 mb-1">
                {row.map((c, i) => (
                  <button
                    key={i}
                    className="w-6 h-6 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Current Color */}
          <div className="mt-4 flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? "생성중..." : "Generate"}
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="relative" style={{ width: '512px', height: '512px' }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse text-gray-400">이미지 로딩중...</div>
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                
                alt="Original"
                className="absolute w-full h-full object-contain opacity-0"
              />
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Image className="w-12 h-12 mx-auto mb-2" />
                <p>512 x 512</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel with Examples */}
      <div className="w-64 bg-white p-4 shadow-lg">
        <h3 className="font-medium text-lg mb-4">프롬프트 예시</h3>
        <div className="space-y-4">
          {['귀여운 고양이', '판타지 풍경', '우주 배경', '일러스트 스타일'].map((example, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => setPrompt(example)}
            >
              <p className="text-sm">{example}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawingInterface;