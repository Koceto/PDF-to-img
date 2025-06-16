package config

import (
    "os"
)

type Config struct {
    Port         string
    Environment  string
    ImageQuality int
}

func LoadConfig() (*Config, error) {
    return &Config{
        Port:         getEnv("PORT", "8080"),
        Environment:  getEnv("ENV", "development"),
        ImageQuality: getEnvAsInt("IMAGE_QUALITY", 75),
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value, exists := os.LookupEnv(key); exists {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}