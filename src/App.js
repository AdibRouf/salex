import React, { useState } from 'react';
import { Upload, Play, CheckCircle, AlertCircle, Loader, Film, Activity, Database } from 'lucide-react';

const VideoAnalysisApp = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Page 1 State
  const [page1Video, setPage1Video] = useState(null);
  const [page1Preview, setPage1Preview] = useState(null);
  const [page1Response, setPage1Response] = useState('');
  const [page1Status, setPage1Status] = useState('Ready to upload');
  const [page1Uploading, setPage1Uploading] = useState(false);
  
  // Page 2 State
  const [page2Video, setPage2Video] = useState(null);
  const [page2Preview, setPage2Preview] = useState(null);
  const [page2SalPreview, setPage2SalPreview] = useState(null);
  const [page2Saliency, setPage2Saliency] = useState(null);
  const [page2Response, setPage2Response] = useState({ focused: '', raw: '' });
  const [page2Status, setPage2Status] = useState('Ready to upload');
  const [page2Uploading, setPage2Uploading] = useState(false);
  const [page2OverlayVideo, setPage2OverlayVideo] = useState(null);

  // Page 1 Functions
  const handlePage1VideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPage1Video(file);
      setPage1Preview(url);
      setPage1Status('Video loaded - ready to process');
    }
  };

  const handlePage1Submit = async () => {
    if (!page1Video) {
      setPage1Status('Video file is required');
      return;
    }

    setPage1Uploading(true);
    setPage1Status('Processing video...');

    const formData = new FormData();
    formData.append('file', page1Video);

    try {
      const response = await fetch('https://salex-flask-server.onrender.com/upload', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();
      
      setPage1Status('Processing complete!');
      setPage1Response(data.response || 'No response available');
    } catch (error) {
      setPage1Status('Error: ' + error.message);
      console.error('Error:', error);
    } finally {
      setPage1Uploading(false);
    }
  };

  const demovid1 = async () => {
    setPage1Status('Fetching demo video...');
  
    try {
      const response = await fetch('http://127.0.0.1:5000/demo');

      if (!response.ok) throw new Error('Demo video fetch failed');

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      const file = new File([blob], 'demo.mp4', { type: 'video/mp4' });

      setPage1Video(file);
      setPage1Preview(videoUrl);
      setPage1Status('Demo video loaded - ready to process');
    } catch (err) {
      console.error(err);
      setPage1Status('Error loading demo video: ' + err.message);
    }
  };

  // Page 2 Functions
  const handlePage2VideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPage2Video(file);
      setPage2Preview(url);
      updatePage2Status();
    }
  };

  const handlePage2SaliencyUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPage2Saliency(file);
      updatePage2Status();
    }
  };

  const updatePage2Status = () => {
    setTimeout(() => {
      const parts = [];
      if (page2Video) parts.push('Video loaded');
      if (page2Saliency) parts.push('Saliency map loaded');
      
      if (parts.length === 0) {
        setPage2Status('Ready to upload');
      } else if (parts.length === 2) {
        setPage2Status('All files loaded - ready to process');
      } else {
        setPage2Status(parts.join(', '));
      }
    }, 100);
  };

  const handlePage2Submit = async () => {
    if (!page2Video || !page2Saliency) {
      setPage2Status('Both video and saliency map are required');
      return;
    }

    setPage2Uploading(true);
    setPage2Status('Processing files...');
    setPage2OverlayVideo(null); // Reset previous video

    const formData = new FormData();
    formData.append('file', page2Video);
    formData.append('saliency', page2Saliency);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setPage2Status('Processing complete!');
        setPage2Response({
          focused: data.focused_response || 'No focused response available',
          raw: data.raw_response || 'No raw response available'
        });
        
        // Set the overlay video URL if available
        if (data.overlay_video_url) {
          setPage2OverlayVideo(data.overlay_video_url);
        }
      } else {
        setPage2Status('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setPage2Status('Error: ' + error.message);
      console.error('Error:', error);
    } finally {
      setPage2Uploading(false);
    }
  };

  const demovid2 = async () => {
    setPage2Status('Fetching demo video & Saliency...');
  
    try {
      const response = await fetch('http://127.0.0.1:5000/demoOverlay');
      if (!response.ok) throw new Error('Demo video fetch failed');

      const salresponse = await fetch('http://127.0.0.1:5000/demotwo');
      if (!salresponse.ok) throw new Error('Demo saliency fetch failed');

      const blob = await response.blob();
      const salblob = await salresponse.blob();

      const videoUrl = URL.createObjectURL(blob);
      const saliencyURL = URL.createObjectURL(salblob);

      const videoFile = new File([blob], 'demo.mp4', { type: 'video/mp4' });
      const saliencyFile = new File([salblob], 'demo.mp4', { type: 'video/mp4' });

      
      setPage2Video(videoFile);
      setPage2Saliency(saliencyFile);
      setPage2Preview(videoUrl);
      

      setPage2Status('Demo video & saliency loaded - ready to process');
    } catch (err) {
      console.error(err);
      setPage2Status('Error loading demo content: ' + err.message);
    }
  };

  const OverlayVideoPlayer = ({ videoUrl }) => {
    if (!videoUrl) return null;
  
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Generated Heatmap Overlay Video:</h3>
        <video 
          controls 
          width="100%" 
          height="auto" 
          className="rounded-lg shadow-lg"
          style={{ maxWidth: '800px' }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="mt-2">
          <a 
            href={videoUrl} 
            download 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Download Video
          </a>
        </div>
      </div>
    );
  };

  const Navigation = () => (
    <div className="flex justify-center mb-8">
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-2 border border-gray-400/30">
        <button
          onClick={() => setCurrentPage(1)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            currentPage === 1
              ? 'bg-gray-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <Database className="w-5 h-5" />
          Model Analysis
        </button>
        <button
          onClick={() => setCurrentPage(2)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ml-2 ${
            currentPage === 2
              ? 'bg-gray-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <Activity className="w-5 h-5" />
          Heatmap Analysis
        </button>
      </div>
    </div>
  );

  const IntroPage = () => (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo and Main Title */}
          <div className="mb-12">
            <img 
              src="/salex.png" 
              alt="SalEx Logo" 
              className="w-40 h-32 object-contain mx-auto mb-8 filter drop-shadow-2xl"
            />
            <h1 className="text-6xl md:text-7xl font-bold text-transparent mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SalEx
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-light mb-8 leading-relaxed">
              Artificial Intelligence made for 
              <span className="block text-gray-300 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-light mt-2">
                Autonomous Vehicles
              </span>
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="mb-16">
            <div className="animate-bounce">
              <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mt-2">Scroll to learn more</p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/20 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-500/30 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
              Revolutionizing Autonomous Vision
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Advanced Model Analysis</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Real-time video captioning and scene understanding powered by cutting-edge AI models designed specifically for autonomous vehicle environments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Intelligent Heatmap Analysis</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Visual attention mapping and saliency analysis to understand what the AI focuses on, ensuring safer decision-making in critical driving scenarios.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Real-Time Processing</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Lightning-fast video analysis capable of processing driving scenarios in real-time, providing instant insights for autonomous navigation systems.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Safety-First Design</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Built with automotive safety standards in mind, ensuring reliable performance in mission-critical autonomous driving applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Begin Button */}
            <div className="text-center">
              <button
                onClick={async () => {
                  const audio = new Audio("/sounds/click.mp3"); // path to your sound file
                  audio.currentTime = .1
                  audio.volume = 0.1; // Adjust volume if needed
                  audio.playbackRate = 1; // Adjust playback speed if needed
                  audio.play();
                  setFadeOut(true); // start fade-out

                  await new Promise(resolve => setTimeout(resolve, 500)); // wait for 1s fade

                  setCurrentPage(1); }}
                className="group px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl border border-blue-400/30"
              >
                <span className="flex items-center gap-3">
                  Begin Analysis
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              <p className="text-gray-400 text-sm mt-4">
                Experience the future of autonomous vehicle AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Page1 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Database className="w-8 h-8 text-gray-400" />
          <h2 className="text-3xl font-bold text-white">Model Analysis</h2>
        </div>
        <p className="text-gray-300">Upload a video for a live captioning!</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Video Upload Section */}
        <div className="bg-gray-800/20 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-gray-400" />
            Video Upload
          </h3>
          
          {/* Video Preview */}
          <div className="aspect-video bg-gray-900/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {page1Preview ? (
              <video
                src={page1Preview}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Film className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>No video loaded</p>
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="relative mb-4">
            <input
              type="file"
              accept="video/*"
              onChange={handlePage1VideoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center w-full h-12 bg-gray-600/20 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors">
              <Upload className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-300">
                {page1Video ? page1Video.name : 'Choose video file'}
              </span>
            </div>
          </div>
          
          {/* Demo Vid Page 1*/}
          <button
            onClick={demovid1}
            className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-gray-700/40 to-gray-600/40 text-gray-200 font-semibold rounded-lg shadow-lg hover:from-gray-700/70 hover:to-gray-600/70 hover:text-white transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 border border-gray-500/30"
          >
            <Play className="w-5 h-5 opacity-70 group-hover:opacity-100" />
            Test out a Demo!
          </button>

          {/* Submit Button */}
          <button
            onClick={handlePage1Submit}
            disabled={page1Uploading || !page1Video}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            {page1Uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Response Section */}
        <div className="bg-gray-800/20 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
          <h3 className="text-xl font-semibold text-white mb-4">Model Response</h3>
          <textarea
            value={page1Response}
            readOnly
            className="w-full h-64 bg-gray-900/40 border border-gray-500/30 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Model response will appear here..."
          />
          
          {/* Status */}
          <div className="mt-4 flex items-center gap-3 bg-gray-900/40 rounded-lg px-4 py-3">
            {page1Uploading ? (
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            ) : page1Status.includes('Error') ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span className="text-white text-sm font-medium">{page1Status}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Page2 = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
          <h2 className="text-3xl font-bold text-white">Heatmap Analysis</h2>
        </div>
        <p className="text-gray-300">Upload a video and saliency map to see a heatmap</p>
      </div>
  
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Section */}
        <div className="lg:col-span-2 bg-gray-800/20 backdrop-blur-lg rounded-2xl p-6 border border-gray-500/30">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-gray-400" />
            Video Upload
          </h3>
          
          <div className="relative aspect-video bg-gray-900/50 rounded-lg mb-4 overflow-hidden">
            {/* Show generated overlay video if available, otherwise show original video + saliency */}
            {page2OverlayVideo ? (
              <div className="relative w-full h-full">
                <video
                  src={page2OverlayVideo}
                  controls
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Generated Heatmap Overlay
                </div>
              </div>
            ) : (
              <>
                {/* Base Video */}
                {page2Preview && (
                  <video
                    src={page2Preview}
                    controls
                    className="absolute top-0 left-0 w-full h-full object-contain z-0"
                  />
                )}
  
                {/* Saliency Overlay */}
                {page2SalPreview && (
                  <video
                    src={page2SalPreview}
                    autoPlay
                    loop
                    muted
                    className="absolute top-0 left-0 w-full h-full object-contain z-10 opacity-60 pointer-events-none"
                  />
                )}
              </>
            )}
          </div>
  
          {/* File Inputs */}
          <div className="space-y-4 mb-4">
            {/* Video Input */}
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={handlePage2VideoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center w-full h-12 bg-gray-600/20 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-300">
                  {page2Video ? page2Video.name : 'Choose video file'}
                </span>
              </div>
            </div>
  
            {/* Saliency Input */}
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={handlePage2SaliencyUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center w-full h-10 bg-gray-500/20 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-300 text-sm">
                  {page2Saliency ? page2Saliency.name : 'Choose saliency map (.mp4)'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Demo Vid 2*/}
          <button
            onClick={demovid2}
            className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-gray-700/40 to-gray-600/40 text-gray-200 font-semibold rounded-lg shadow-lg hover:from-gray-700/70 hover:to-gray-600/70 hover:text-white transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 border border-gray-500/30"
          >
            <Play className="w-5 h-5 opacity-70 group-hover:opacity-100" />
            Test out a Demo!
          </button>
  
          {/* Submit Button */}
          <button
            onClick={handlePage2Submit}
            disabled={page2Uploading || !page2Video || !page2Saliency}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            {page2Uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
  
          {/* Status */}
          <div className="mt-4 flex items-center gap-3 bg-gray-900/40 rounded-lg px-4 py-3">
            {page2Uploading ? (
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            ) : page2Status.includes('Error') ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span className="text-white text-sm font-medium">{page2Status}</span>
          </div>
        </div>
  
        {/* Response Section */}
        <div className="space-y-4">
          {/* Raw Response */}
          <div className="bg-gray-800/20 backdrop-blur-lg rounded-2xl p-4 border border-gray-500/30">
            <h4 className="text-lg font-semibold text-white mb-3">Raw Analysis</h4>
            <textarea
              value={page2Response.raw}
              readOnly
              className="w-full h-64 bg-gray-900/40 border border-gray-500/30 rounded-lg p-3 text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Raw analysis...if text is long you are able to scroll within this box"
            />
          </div>
  
          {/* Focused Response */}
          <div className="bg-gray-800/20 backdrop-blur-lg rounded-2xl p-4 border border-gray-500/30">
            <h4 className="text-lg font-semibold text-white mb-3">Focused Analysis</h4>
            <textarea
              value={page2Response.focused}
              readOnly
              className="w-full h-64 bg-gray-900/40 border border-gray-500/30 rounded-lg p-3 text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Focused analysis...if text is long you are able to scroll within this box"
            />
          </div>
        </div>
      </div>
  
      {/* Don't display separate overlay video player since it's now integrated above */}
    </div>
  );


  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      {currentPage === 0 ? (
        <IntroPage />
      ) : (
        <div className="container mx-auto px-6 py-8">
          {/* Top Header with Logo */}
          <div className="flex items-center justify-between mb-8">
            {/* Logo - Top Left */}
            <div className="flex items-center gap-3">
              <img 
                src="/salex.png" 
                alt="Company Logo" 
                className="w-30 h-20 object-contain"
              />
            </div>
          </div>
        
          {/* Main Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Film className="w-8 h-8 text-gray-400" />
              <h1 className="text-4xl font-bold text-white">SalEx | AI for AVs</h1>
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <Navigation />

          {/* Page Content */}
          {currentPage === 1 ? <Page1 /> : <Page2 />}
        </div>
      )}
    </div>
  );
};

export default VideoAnalysisApp;
