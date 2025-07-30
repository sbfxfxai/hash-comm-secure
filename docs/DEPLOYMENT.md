# BitComm Deployment Guide

## Overview
This guide covers deployment strategies for the BitComm application across development, staging, and production environments.

## Prerequisites
- Node.js 18+ 
- npm or pnpm package manager
- Modern web browser
- SSL certificate (for production)
- Domain name (for production)

## Environment Configuration

### Development Environment
```bash
# Clone repository
git clone https://github.com/bitcomm/bitcomm.git
cd bitcomm

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Configure environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development

# Start development server
npm run dev
```

### Staging Environment
```bash
# Build for staging
npm run build

# Test build locally
npm run preview

# Deploy to staging server
# (Using your preferred deployment method)
```

### Production Environment
```bash
# Install dependencies (production only)
npm ci --only=production

# Build optimized version
npm run build

# Configure production environment
VITE_SUPABASE_URL=production_supabase_url
VITE_SUPABASE_ANON_KEY=production_supabase_anon_key
VITE_APP_ENV=production

# Deploy to production server
```

## Deployment Options

### 1. Static Site Hosting (Recommended)
BitComm can be deployed as a static site to services like:
- **Vercel** (Recommended)
- **Netlify** 
- **AWS S3 + CloudFront**
- **GitHub Pages**

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### 2. Container Deployment

#### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run container
docker build -t bitcomm .
docker run -p 80:80 bitcomm
```

### 3. Traditional Server Deployment
For traditional web servers:
1. Build the application: `npm run build`
2. Copy `dist/` folder to web server
3. Configure server for single-page application routing
4. Set up SSL certificate
5. Configure domain DNS

## Configuration Files

### nginx.conf (for Docker/Nginx)
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### vercel.json
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Security Considerations

### SSL/TLS Configuration
- Always use HTTPS in production
- Implement HTTP Strict Transport Security (HSTS)
- Use strong cipher suites
- Regularly update SSL certificates

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';
               connect-src 'self' wss:;">
```

### Environment Variables
- Never commit sensitive data to version control
- Use environment-specific configuration files
- Implement secret rotation strategies
- Monitor environment variable usage

## Performance Optimization

### Build Optimization
- Enable tree shaking and minification
- Use code splitting for large bundles
- Implement service worker for caching
- Optimize images and assets

### CDN Configuration
- Configure CDN for static assets
- Set appropriate cache headers
- Use compression (gzip/brotli)
- Implement geographic distribution

## Monitoring and Logging

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor performance metrics
- Track user analytics
- Set up health checks

### Server Monitoring
- Monitor server resources (CPU, memory, disk)
- Set up alerts for downtime
- Track response times
- Monitor security events

## Backup and Recovery

### Data Backup
- Regular backup of user data
- Test restore procedures
- Implement versioned backups
- Geographic backup distribution

### Disaster Recovery
- Document recovery procedures
- Test failover scenarios
- Maintain backup infrastructure
- Plan for different failure types

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Build
      run: npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version and dependencies
2. **Routing Issues**: Configure server for SPA routing
3. **Environment Variables**: Verify all required variables are set
4. **SSL Errors**: Check certificate validity and configuration
5. **Performance Issues**: Review bundle size and optimization

### Debug Commands
```bash
# Check build output
npm run build -- --debug

# Analyze bundle size
npm run build-analyze

# Test production build locally
npm run preview

# Check environment variables
env | grep VITE_
```

## Support

For deployment assistance:
- Check the [GitHub Issues](https://github.com/bitcomm/bitcomm/issues)
- Join our [Discord Community](https://discord.gg/bitcomm)
- Email support: support@bitcomm.io

---

**Security Note**: Always review security best practices before deploying to production. Keep dependencies updated and monitor for security vulnerabilities.
