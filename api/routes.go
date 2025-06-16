package api

import (
    "github.com/gin-gonic/gin"
    "pdf-to-img-service/src/handlers"
)

func SetupRoutes(router *gin.Engine) {
    router.POST("/convert", handlers.ConvertPDFToImage)
}