# GoDaddy cPanel Deployment Instructions

## 🚀 Quick Deployment Steps

1. **Upload Files**: Upload all files from this zip to your GoDaddy cPanel public_html directory
2. **Extract**: Extract the zip file in your public_html folder
3. **Done**: Your website should be live immediately!

## 📁 File Structure
- `index.html` - Main entry point (FIXED with relative paths)
- `assets/` - CSS and JavaScript files
- `img/` - Images and backgrounds
- `.htaccess` - URL rewriting for React Router
- `BG.png`, `BG2.png` - Background images
- `favicon.ico` - Website icon

## ⚠️ Important Notes
- Make sure `.htaccess` file is uploaded (it's hidden by default)
- All files should be in the root of public_html, not in a subfolder
- The website uses React Router, so the .htaccess file is essential
- **FIXED**: Image and icon paths are now relative for GoDaddy cPanel

## 🔧 Troubleshooting
- If pages show 404, check that .htaccess was uploaded
- If images don't load, verify all files were extracted properly
- Clear browser cache if you see old content
- **Images should now load correctly** - paths are fixed!

## ✨ Features Included
- AI Agents showcase
- Image generation with nanobanana API
- Responsive design
- Modern blue-yellow theme
- All agent pages working
- **FIXED**: All images and icons loading properly

Your Ensemble Digital Labs website is ready to go live! 🎉
