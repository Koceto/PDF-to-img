# PDF to Image Converter Service

A dockerized TypeScript service for converting PDF files to PNG/JPG images with a modern web interface.

## Features

- 🚀 **Fast PDF Conversion** - Convert PDF pages to high-quality images
- 🎨 **Multiple Formats** - Support for PNG and JPG output
- ⚙️ **Configurable Quality** - Adjust DPI and scaling
- 📦 **Batch Download** - Download all images as ZIP
- 🔒 **Secure** - Rate limiting, file validation, and security headers
- 🐳 **Docker Ready** - Full containerization with docker-compose
- 📊 **Portainer Compatible** - Easy deployment and management
- 🧹 **Auto Cleanup** - Automatic cleanup of old files

## Quick Start

### Using Docker Compose

1. **Clone and setup:**
```bash
git clone <your-repo>
cd pdf-converter
```

2. **Start the services:**
```bash
docker-compose up -d
```

3. **Access the application:**
- Web Interface: http://localhost:3000
- With Nginx: http://localhost

### Portainer Deployment

1. **In Portainer, go to Stacks**
2. **Create a new stack**
3. **Paste the docker-compose.yml content**
4. **Add these environment variables:**
   ```
   MAX_FILE_SIZE=50mb
   NODE_ENV=production
   ```
5. **Deploy the stack**

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Application port |
| `MAX_FILE_SIZE` | `50mb` | Maximum upload size |
| `UPLOAD_DIR` | `./uploads` | Upload directory |
| `OUTPUT_DIR` | `./output` | Output directory |

### Docker Compose Override

Create `docker-compose.override.yml` for custom settings:

```yaml
version: '3.8'
services:
  pdf-converter:
    environment:
      - MAX_FILE_SIZE=100mb
      - NODE_ENV=production
    volumes:
      - /custom/path:/app/output
```

## API Endpoints

### Convert PDF
```
POST /api/convert
Content-Type: multipart/form-data

Body:
- pdf: PDF file
- format: 'png' | 'jpg' (optional, default: 'png')
- quality: 72-300 (optional, default: 150)
- scale: 0.5-3.0 (optional, default: 1.0)
```

### Download Results
```
GET /api/download/:jobId
Returns: ZIP file with all converted images
```

### Check Status
```
GET /api/status/:jobId
Returns: Job status and file list
```

### Health Check
```
GET /health
Returns: Service health status
```

## Development

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
npm start
```

### Project Structure

```
├── src/
│   ├── server.ts              # Main server file
│   └── services/
│       ├── PDFConverter.ts    # PDF conversion logic
│       └── FileManager.ts     # File management utilities
├── public/
│   └── index.html            # Web interface
├── docker-compose.yml        # Docker composition
├── Dockerfile               # Container definition
├── nginx.conf              # Nginx configuration
└── package.json           # Dependencies
```

## Security Features

- **Rate Limiting**: API and upload endpoints are rate-limited
- **File Validation**: Only PDF files are accepted
- **Size Limits**: Configurable file size limits
- **Auto Cleanup**: Old files are automatically removed
- **Security Headers**: Standard security headers applied
- **Input Sanitization**: All inputs are validated

## Monitoring with Portainer

The service includes labels for Traefik integration and health checks that work well with Portainer:

1. **View Logs**: Check container logs in Portainer
2. **Monitor Resources**: CPU/Memory usage tracking
3. **Health Status**: Built-in health check endpoint
4. **Volume Management**: Easy access to uploaded/converted files

## Troubleshooting

### Common Issues

**Large PDF files fail to convert:**
- Increase `MAX_FILE_SIZE` environment variable
- Check available disk space
- Adjust Docker memory limits

**Conversion takes too long:**
- Reduce quality/DPI settings
- Scale down large PDFs
- Consider horizontal scaling

**Out of disk space:**
- Check cleanup settings (24-hour default)
- Monitor `/uploads` and `/output` directories
- Set up log rotation

### Logs

View logs using Docker Compose:
```bash
docker-compose logs -f pdf-converter
```

Or in Portainer through the container logs section.

## Performance Tuning

### For High Volume

1. **Increase worker processes** in nginx.conf
2. **Add Redis** for job queuing
3. **Scale horizontally** with multiple containers
4. **Use external storage** for uploads/outputs

### Memory Optimization

```yaml
services:
  pdf-converter:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```

## License

MIT License - see LICENSE file for details.