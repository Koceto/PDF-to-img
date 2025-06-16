# pdf-to-img-service

This project is a Docker-based application that converts PDF files to image formats. It provides a simple API for users to upload PDF files and receive the converted images.

## Project Structure

```
pdf-to-img-service
├── src
│   ├── main.go          # Entry point of the application
│   ├── handlers
│   │   └── convert.go   # Handles PDF to image conversion
│   ├── services
│   │   └── pdf_service.go # Contains PDF conversion logic
│   └── utils
│       └── image_utils.go # Utility functions for image manipulation
├── api
│   └── routes.go        # API route definitions
├── config
│   └── config.go        # Configuration settings
├── Dockerfile            # Docker image build instructions
├── docker-compose.yml    # Docker services configuration
├── go.mod                # Module dependencies
└── go.sum                # Module dependency checksums
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pdf-to-img-service
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t pdf-to-img-service .
   ```

3. **Run the application using Docker Compose:**
   ```bash
   docker-compose up
   ```

## Usage

- Send a POST request to the API endpoint with the PDF file to convert it to an image.
- The converted image will be returned in the response.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.