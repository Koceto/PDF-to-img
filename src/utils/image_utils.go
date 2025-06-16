package utils

import (
	"image"
	"image/jpeg"
	"image/png"
	"os"
)

// ResizeImage resizes the given image to the specified width and height.
func ResizeImage(img image.Image, width, height int) image.Image {
	// Implement resizing logic here
	return img
}

// FormatImage saves the given image to the specified file path in the desired format.
func FormatImage(img image.Image, filePath string, format string) error {
	var out *os.File
	var err error

	if format == "jpeg" || format == "jpg" {
		out, err = os.Create(filePath + ".jpg")
		if err != nil {
			return err
		}
		defer out.Close()
		return jpeg.Encode(out, img, nil)
	} else if format == "png" {
		out, err = os.Create(filePath + ".png")
		if err != nil {
			return err
		}
		defer out.Close()
		return png.Encode(out, img)
	}

	return nil
}