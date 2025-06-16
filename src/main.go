package main

import (
    "log"
    "net/http"
    "pdf-to-img-service/api"
)

func main() {
    // Initialize the server
    router := api.SetupRouter()

    // Start the server
    log.Println("Starting server on :8080")
    if err := http.ListenAndServe(":8080", router); err != nil {
        log.Fatalf("Could not start server: %s\n", err)
    }
}