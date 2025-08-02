#!/bin/bash

echo "🚀 Deploying server to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Starting deployment..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set up MongoDB Atlas"
echo "   2. Configure environment variables in Vercel dashboard"
echo "   3. Update frontend URLs"
echo "   4. Test all endpoints"
