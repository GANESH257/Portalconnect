import { Button } from "@/components/ui/button";
import { ArrowLeft, Palette, Image, Sparkles, Star, Upload, Download, RefreshCw, X, Plus, Grid3X3, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";

export default function ImageArtistAgent() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(1);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [style, setStyle] = useState('photorealistic');
  const [quality, setQuality] = useState('high');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your image");
      return;
    }

    setIsGenerating(true);
    setError(null);
    const newImages: string[] = [];

    try {
      // Generate images using the nanobanana API
      const response = await fetch('/api/nanobanana/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          referenceImages: referenceImage ? [referenceImage] : [],
          style,
          quality
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      // The API returns 4 images, take the number requested by the user
      if (data.images && data.images.length > 0) {
        const imagesToAdd = data.images.slice(0, imageCount);
        newImages.push(...imagesToAdd);
      } else {
        throw new Error('No images received from API');
      }

      setGeneratedImages(prev => [...prev, ...newImages]);
      setShowGallery(true); // Automatically show gallery when images are generated
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error('Image generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearGallery = () => {
    setGeneratedImages([]);
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 50%, #3498DB 50%, #2980B9 100%)'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-white/15 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <img
              src="/client/agents/Icons/Agent_IA.png"
              alt="Image Artist Agent"
              className="w-full h-full object-contain"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-theme-yellow-primary rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-theme-blue-primary rounded-full animate-pulse delay-150"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4 drop-shadow-lg">
            Image Artist Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Your creative visual companion, generating stunning images and artistic content with AI-powered creativity.
          </p>
        </div>

        {/* Image Generation Interface */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl mb-8">
            <div className="flex flex-col gap-6">
              {/* Reference Image Upload */}
              <div className="flex flex-col gap-4">
                <label className="text-theme-dark-blue font-lato text-lg font-semibold">
                  Reference Image (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="px-6 py-2 border-theme-blue-primary text-theme-blue-primary hover:bg-theme-blue-primary hover:text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Reference
                  </Button>
                  {referenceImage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-16 h-16 object-cover rounded-lg border-2 border-theme-blue-primary"
                      />
                      <Button
                        onClick={removeReferenceImage}
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex flex-col gap-4">
                <label className="text-theme-dark-blue font-lato text-lg font-semibold">
                  Describe your image
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A beautiful sunset over mountains with a lake reflection..."
                  className="w-full p-4 border border-theme-blue-primary/30 rounded-xl bg-white/80 backdrop-blur-sm text-theme-dark-blue placeholder:text-theme-dark-blue/60 font-lato text-base resize-none h-24 focus:outline-none focus:ring-2 focus:ring-theme-blue-primary/50"
                />
              </div>

              {/* Image Count Selection */}
              <div className="flex flex-col gap-4">
                <label className="text-theme-dark-blue font-lato text-lg font-semibold">
                  Number of Images to Generate
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setImageCount(Math.max(1, imageCount - 1))}
                    disabled={imageCount <= 1}
                    size="sm"
                    variant="outline"
                    className="w-10 h-10 p-0"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-theme-dark-blue min-w-[3rem] text-center">
                    {imageCount}
                  </span>
                  <Button
                    onClick={() => setImageCount(Math.min(10, imageCount + 1))}
                    disabled={imageCount >= 10}
                    size="sm"
                    variant="outline"
                    className="w-10 h-10 p-0"
                  >
                    +
                  </Button>
                  <span className="text-theme-dark-blue/70 text-sm">
                    (Max 10 images)
                  </span>
                </div>
              </div>

              {/* Style Selection */}
              <div className="flex flex-col gap-4">
                <label className="text-theme-dark-blue font-lato text-lg font-semibold">
                  Art Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-4 border border-theme-blue-primary/30 rounded-xl bg-white/80 backdrop-blur-sm text-theme-dark-blue focus:outline-none focus:ring-2 focus:ring-theme-blue-primary/50"
                >
                  <option value="photorealistic">Photorealistic</option>
                  <option value="artistic">Artistic</option>
                  <option value="digital_art">Digital Art</option>
                  <option value="anime">Anime/Manga</option>
                  <option value="oil_painting">Oil Painting</option>
                  <option value="watercolor">Watercolor</option>
                </select>
              </div>

              {/* Quality Selection */}
              <div className="flex flex-col gap-4">
                <label className="text-theme-dark-blue font-lato text-lg font-semibold">
                  Image Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full p-4 border border-theme-blue-primary/30 rounded-xl bg-white/80 backdrop-blur-sm text-theme-dark-blue focus:outline-none focus:ring-2 focus:ring-theme-blue-primary/50"
                >
                  <option value="high">High (8K, Ultra Detailed)</option>
                  <option value="medium">Medium (HD, Detailed)</option>
                  <option value="low">Low (Standard)</option>
                </select>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={generateImage}
                  disabled={isGenerating || !prompt.trim()}
                  size="lg"
                  className="px-8 py-4 bg-theme-blue-primary text-white hover:bg-theme-blue-secondary font-lato text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Creating {imageCount} Image{imageCount > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <Palette className="w-5 h-5 mr-2" />
                      Generate {imageCount} Image{imageCount > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Gallery Toggle */}
              {generatedImages.length > 0 && (
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setShowGallery(!showGallery)}
                    variant="outline"
                    className="px-6 py-2 border-theme-blue-primary text-theme-blue-primary hover:bg-theme-blue-primary hover:text-white"
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    {showGallery ? 'Hide Gallery' : 'Show Gallery'} ({generatedImages.length})
                  </Button>
                  <Button
                    onClick={clearGallery}
                    variant="outline"
                    className="px-6 py-2 border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              )}

              {/* Generated Images Gallery */}
              {showGallery && generatedImages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {generatedImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Generated artwork ${index + 1}`}
                        className="w-full h-64 object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center gap-2">
                        <Button
                          onClick={() => downloadImage(imageUrl, index)}
                          size="sm"
                          className="bg-white/90 hover:bg-white text-theme-dark-blue shadow-lg"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          onClick={() => window.open(imageUrl, '_blank')}
                          size="sm"
                          className="bg-white/90 hover:bg-white text-theme-dark-blue shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Palette className="w-12 h-12 text-theme-blue-primary mb-4" />
              <h3 className="text-xl font-alata text-theme-dark-blue mb-2">AI Art Generation</h3>
              <p className="text-theme-dark-blue/80 font-lato text-sm">Create unique artwork and images from text descriptions using advanced AI.</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Image className="w-12 h-12 text-theme-yellow-primary mb-4" />
              <h3 className="text-xl font-alata text-theme-dark-blue mb-2">Visual Content</h3>
              <p className="text-theme-dark-blue/80 font-lato text-sm">Generate marketing visuals, social media graphics, and brand assets.</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Sparkles className="w-12 h-12 text-theme-blue-primary mb-4" />
              <h3 className="text-xl font-alata text-theme-dark-blue mb-2">Creative Styles</h3>
              <p className="text-theme-dark-blue/80 font-lato text-sm">Apply various artistic styles and effects to match your brand aesthetic.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
