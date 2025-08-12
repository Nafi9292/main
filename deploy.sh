#!/bin/bash

echo "🚀 MATH POWER - Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo "Please follow the prompts:"
echo "1. Login to Vercel (if not already logged in)"
echo "2. Choose to link to existing project or create new"
echo "3. Confirm deployment settings"
echo ""

vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo "Your website should now be live at the URL provided above."
echo ""
echo "📝 Next steps:"
echo "1. Update admin password after first login"
echo "2. Add your custom domain (optional)"
echo "3. Configure environment variables if needed"
echo ""
echo "🔐 Default admin credentials:"
echo "Username: admin"
echo "Password: admin123" 