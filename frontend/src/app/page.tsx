'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'remove' | 'color' | 'image'>('remove');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [cropHeadshot, setCropHeadshot] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setOriginalImage(reader.result as string);
    reader.readAsDataURL(file);

    setOriginalFile(file);
    setShowBackgroundOptions(true);
    setProcessedImage(null);
    setError(null);
  }, []);

  const processImage = async () => {
    if (!originalFile) return;

    setLoading(true);
    setError(null);
    setProcessedImage(null);

    try {
      const formData = new FormData();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      let endpoint = '/remove-background';

      if (backgroundType === 'remove') {
        formData.append('file', originalFile);
        formData.append('crop_headshot', cropHeadshot.toString());
      } else {
        endpoint = '/replace-background';
        formData.append('file', originalFile);
        formData.append('background_type', backgroundType);
        formData.append('crop_headshot', cropHeadshot.toString());
        
        if (backgroundType === 'color') {
          formData.append('background_color', backgroundColor);
        } else if (backgroundType === 'image' && backgroundImage) {
          formData.append('background_image', backgroundImage);
        }
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setProcessedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'removed-background.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    maxSize: 10485760
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PF</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PureFrame
              </h1>
            </div>
            <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>AI-Powered</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free to Use</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No Signup Required</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Remove & Replace Backgrounds
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Instantly with AI
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload any image and watch our AI automatically remove the background or replace it with solid colors or custom images. 
            Perfect for e-commerce, social media, and professional photos.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Lightning Fast</span>
            </span>
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>High Quality</span>
            </span>
            <span className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>100% Private</span>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {!originalImage ? (
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50/50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50 hover:scale-[1.02]'
              } bg-white/50 backdrop-blur-sm shadow-xl`}
            >
              <input {...getInputProps()} />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 rounded-2xl"></div>
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {isDragActive ? 'Drop your image here' : 'Upload your image'}
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  {isDragActive
                    ? 'Release to start processing...'
                    : 'Drag & drop an image here, or click to browse'}
                </p>
                <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Choose Image</span>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Supports PNG, JPG, JPEG • Max size: 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Original Image</h3>
                  </div>
                  <div className="relative aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    <Image
                      src={originalImage}
                      alt="Original"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : processedImage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {loading ? 'Processing...' : 'Background Removed'}
                    </h3>
                  </div>
                  <div className="relative aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 font-medium">AI is working its magic</p>
                          <p className="text-sm text-gray-500">This may take a few seconds...</p>
                        </div>
                      </div>
                    ) : processedImage ? (
                      <div className="relative h-full" style={{ background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                        <Image
                          src={processedImage}
                          alt="Processed"
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 text-red-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-center">
                          <p className="font-medium">Processing failed</p>
                          <p className="text-sm">{error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Preparing to process...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Background Options */}
              {showBackgroundOptions && !loading && (
                <div className="mt-8 p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Background Option</h3>
                  
                  {/* Headshot Cropping Toggle */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-blue-900 mb-1">Smart Headshot Cropping</h4>
                        <p className="text-sm text-blue-700">Automatically detect face and crop to perfect headshot proportions (1:1 ratio)</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cropHeadshot}
                          onChange={(e) => setCropHeadshot(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full p-1 duration-300 ease-in-out ${
                          cropHeadshot 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300'
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                            cropHeadshot ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setBackgroundType('remove')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        backgroundType === 'remove'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <p className="font-medium">Remove Only</p>
                        <p className="text-sm text-gray-500">Transparent background</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setBackgroundType('color')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        backgroundType === 'color'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                          </svg>
                        </div>
                        <p className="font-medium">Solid Color</p>
                        <p className="text-sm text-gray-500">Choose any color</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setBackgroundType('image')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        backgroundType === 'image'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="font-medium">Custom Image</p>
                        <p className="text-sm text-gray-500">Upload background</p>
                      </div>
                    </button>
                  </div>

                  {/* Color Picker */}
                  {backgroundType === 'color' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#ffffff"
                        />
                        <div className="flex space-x-2">
                          {['#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setBackgroundColor(color)}
                              className={`w-8 h-8 rounded-lg border-2 ${
                                backgroundColor === color ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Image Upload */}
                  {backgroundType === 'image' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setBackgroundImage(file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {backgroundImage && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {backgroundImage.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={processImage}
                    disabled={backgroundType === 'image' && !backgroundImage}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {backgroundType === 'remove' ? 'Remove Background' : 'Replace Background'}
                  </button>
                </div>
              )}

              {processedImage && (
                <div className="flex justify-center space-x-4 pt-8">
                  <button
                    onClick={downloadImage}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={() => {
                      setOriginalImage(null);
                      setOriginalFile(null);
                      setProcessedImage(null);
                      setError(null);
                      setShowBackgroundOptions(false);
                      setBackgroundType('remove');
                      setBackgroundImage(null);
                      setCropHeadshot(false);
                    }}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload Another</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-red-800 font-semibold mb-1">Processing Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Advanced AI processes images in seconds, not minutes.</p>
          </div>
          <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Premium Quality</h3>
            <p className="text-gray-600">Professional-grade results with precise edge detection.</p>
          </div>
          <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">100% Private</h3>
            <p className="text-gray-600">Your images are processed securely and never stored.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
