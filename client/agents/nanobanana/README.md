# AI Image Generation Agent

## Overview
The AI Image Generation Agent is an intelligent image creation tool that uses Google's Gemini API to generate high-quality images from text prompts. This agent is specifically designed for healthcare marketing applications and is part of the Ensemble Digital Labs AI ecosystem.

## Features
- **Text-to-Image Generation**: Create images from descriptive text prompts
- **Reference Image Upload**: Upload reference images to guide AI generation
- **Image Compression**: Automatic compression of uploaded images for optimal performance
- **File Size Management**: 10MB limit per image with automatic compression to 800px width
- **Batch Generation**: Generate 4 unique images per request
- **Download Functionality**: Download generated images directly
- **Healthcare Focus**: Optimized for medical and healthcare marketing visuals
- **Real-time Generation**: Fast image creation with detailed progress tracking
- **Progress Visualization**: Step-by-step generation progress with visual indicators
- **Success Feedback**: Clear completion notifications and status updates
- **Image Editing**: Use reference images to modify or enhance existing visuals

## API Integration
- **Provider**: Google Gemini API
- **Model**: `gemini-2.5-flash-image-preview`
- **Endpoint**: `/api/nanobanana/generate`
- **Method**: POST

## Usage

### Request Format
```json
{
  "prompt": "A professional medical illustration of a heart with detailed anatomy",
  "referenceImages": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."]
}
```

### Response Format
```json
{
  "success": true,
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  ]
}
```

## Best Practices for Healthcare Marketing

### Effective Prompts
- **Medical Illustrations**: "Professional medical illustration of [anatomy/condition] with clean, scientific styling"
- **Healthcare Facilities**: "Modern hospital interior with natural lighting and patient-friendly design"
- **Medical Devices**: "High-tech medical equipment in clinical setting with professional lighting"
- **Patient Care**: "Compassionate healthcare professional with patient in modern medical facility"
- **Reference-Based**: "Create a medical illustration in the style of [reference image] showing [specific anatomy]"

### Prompt Engineering Tips
1. **Be Specific**: Include details about style, colors, and composition
2. **Use Medical Terminology**: Include relevant medical terms for accuracy
3. **Specify Context**: Mention healthcare setting, patient demographics, or medical specialty
4. **Style Guidelines**: Request professional, clean, and trustworthy visual style
5. **Reference Images**: Upload similar images to guide the AI in creating consistent styles
6. **Iterative Refinement**: Use reference images to refine and improve generated results

## Technical Implementation

### File Size Management
- **Upload Limit**: 10MB per image file
- **Compression**: Automatic compression to 800px width with 80% quality
- **Format**: All images converted to JPEG for consistency
- **Server Limit**: 50MB body parser limit for handling multiple compressed images

### Frontend Components
- `index.tsx`: Main agent interface with image generation and display
- Uses React hooks for state management
- Implements download functionality for generated images
- Responsive design with mobile-first approach
- Custom background image with overlay for visual appeal
- Glass-morphism design with backdrop blur effects

### Backend API
- `nanobanana.ts`: Express route handler for image generation
- Integrates with Google Gemini API
- Handles batch generation of 4 images per request
- Error handling and response formatting

### API Configuration
- **API Key**: Configured in server route
- **Rate Limiting**: Respects Google API limits
- **Error Handling**: Comprehensive error responses
- **Security**: API key stored server-side

## Healthcare Marketing Applications

### Content Creation
- Medical illustrations for patient education
- Healthcare facility photography
- Medical device visualization
- Treatment process diagrams

### Marketing Materials
- Social media visuals
- Website hero images
- Brochure and flyer graphics
- Presentation slides

### Compliance Considerations
- HIPAA-compliant image generation
- Professional medical accuracy
- Patient privacy protection
- Regulatory compliance

## Development Notes

### Dependencies
- Google Gemini API
- Express.js for backend routing
- React for frontend interface
- Lucide React for icons

### Environment Variables
```env
GEMINI_API_KEY=your_api_key_here
```

### Error Handling
- Network error handling
- API rate limit management
- Invalid prompt validation
- Image generation failure recovery

## Future Enhancements
- Image editing capabilities
- Style transfer features
- Batch processing optimization
- Custom model fine-tuning
- Integration with other AI agents

## References
- [Google AI Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini API Reference](https://ai.google.dev/gemini-api/docs)
- [Healthcare Marketing Best Practices](https://www.ama.org/topics/healthcare-marketing/)
