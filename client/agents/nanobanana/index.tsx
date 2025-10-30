import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, RefreshCw, Bot, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
}

export default function ImageGenerationAgent() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setCurrentStep("Initializing AI agent...");

    try {
      // Simulate progress steps
      const progressSteps = [
        { step: "Analyzing prompt...", progress: 20 },
        { step: "Generating image 1 of 4...", progress: 40 },
        { step: "Generating image 2 of 4...", progress: 60 },
        { step: "Generating image 3 of 4...", progress: 80 },
        { step: "Finalizing image 4 of 4...", progress: 95 }
      ];

      // Simulate progress updates
      for (const { step, progress } of progressSteps) {
        setCurrentStep(step);
        setGenerationProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const response = await fetch('/api/nanobanana/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          referenceImages: referenceImages.map(img => img.preview)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate images');
      }

      setCurrentStep("Processing results...");
      setGenerationProgress(100);

      const data = await response.json();
      
      // Create 4 image objects (as per requirement)
      const newImages: GeneratedImage[] = data.images.map((imageUrl: string, index: number) => ({
        id: `img-${Date.now()}-${index}`,
        url: imageUrl,
        prompt: prompt,
        timestamp: new Date(),
      }));

      setGeneratedImages(prev => [...newImages, ...prev]);
      setPrompt("");
      setCurrentStep("Generation complete!");
      
      // Reset progress after a short delay
      setTimeout(() => {
        setGenerationProgress(0);
        setCurrentStep("");
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCurrentStep("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const maxImages = 5; // Maximum 5 reference images

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        // Check file size
        if (file.size > maxFileSize) {
          setError(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // Check number of images
        if (referenceImages.length >= maxImages) {
          setError(`Maximum ${maxImages} reference images allowed.`);
          break;
        }

        try {
          const compressedPreview = await compressImage(file, 800, 0.8);
          const newImage: ReferenceImage = {
            id: `ref-${Date.now()}-${Math.random()}`,
            file,
            preview: compressedPreview,
          };
          setReferenceImages(prev => [...prev, newImage]);
          setError(null); // Clear any previous errors
        } catch (error) {
          console.error('Error processing image:', error);
          setError(`Error processing ${file.name}. Please try a different image.`);
        }
      }
    }
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="min-h-screen bg-scheme-1-bg"
      style={{
        backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.50), rgba(0, 0, 0, 0.50)), url('/img/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-scheme-5-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4">
            AI Image Generation Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Generate high-quality images using AI. Enter a prompt and create 4 unique images instantly.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white/20 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="text-white">Image Generation</CardTitle>
            <CardDescription className="text-white/80">
              Describe what you want to generate. Be specific for better results. You can also upload reference images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Reference Images Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Reference Images (Optional)</h3>
                    <p className="text-xs text-white/70 mt-1">
                      Max 5 images, 10MB each. Images will be compressed automatically.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerFileUpload}
                    disabled={referenceImages.length >= 5}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Images ({referenceImages.length}/5)
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {referenceImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt="Reference"
                          className="w-full h-24 object-cover rounded-lg border border-scheme-1-fg"
                        />
                        <button
                          onClick={() => removeReferenceImage(image.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div className="flex gap-4">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your image prompt here..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && !isGenerating && generateImages()}
                />
                <Button 
                  onClick={generateImages} 
                  disabled={isGenerating || !prompt.trim()}
                  className="px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate 4 Images
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress Section */}
              {isGenerating && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{currentStep}</span>
                    <span className="text-white/60">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}
              
                  {error && (
                    <div className="text-red-200 text-sm bg-red-900/20 p-3 rounded-md">
                      {error}
                    </div>
                  )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-alata text-white">Generated Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {generatedImages.map((image) => (
                <Card key={image.id} className="overflow-hidden border border-white/30 bg-white/20 backdrop-blur-sm">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => downloadImage(image.url, `ai-generated-${image.id}.png`)}
                        className="bg-white/90 text-black hover:bg-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/70 line-clamp-2">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-white/50 mt-2">
                      {image.timestamp.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <Card className="mt-8 border border-white/30 bg-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <h4 className="font-semibold mb-2 text-white">Be Specific</h4>
                <p>Include details about style, colors, composition, and mood.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Use Descriptive Language</h4>
                <p>Describe lighting, camera angles, and artistic style.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Healthcare Focus</h4>
                <p>Perfect for medical illustrations, healthcare marketing visuals, and patient education materials.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Reference Images</h4>
                <p>Upload reference images to guide the AI in creating similar styles or compositions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {currentStep === "Generation complete!" && (
          <Card className="mt-8 border-green-200/50 bg-green-50/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Images Generated Successfully!</h3>
                  <p className="text-sm text-green-700">Your 4 unique images are ready for download.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
