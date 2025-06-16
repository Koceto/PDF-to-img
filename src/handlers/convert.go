package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "pdf-to-img-service/services"
)

func ConvertPDFToImage(c *gin.Context) {
    file, err := c.FormFile("pdf")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No PDF file provided"})
        return
    }

    pdfService := services.PDFService{}
    image, err := pdfService.Convert(file)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert PDF to image"})
        return
    }

    c.Header("Content-Type", "image/png")
    c.JSON(http.StatusOK, gin.H{"image": image})
}