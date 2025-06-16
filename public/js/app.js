(() => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('pdfFile');

  // Handle drag and drop events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  ["dragleave", "dragend", "drop"].forEach((type) => {
    dropZone.addEventListener(type, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      fileInput.files = e.dataTransfer.files;
      updateDropZone(file);
    }
  });

  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      updateDropZone(fileInput.files[0]);
    }
  });

  function updateDropZone(file) {
    const uploadText = dropZone.querySelector(".upload-text");
    uploadText.textContent = `Selected: ${file.name}`;
  }

  // Helper function to handle downloads
  function downloadImage(blobUrl, fileName) {
    return new Promise((resolve, reject) => {
      try {
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';

        // Add to DOM temporarily
        document.body.appendChild(downloadLink);

        // Trigger download
        downloadLink.click();

        // Clean up immediately after click
        document.body.removeChild(downloadLink);

        // Give some time for download to initiate
        setTimeout(() => resolve(), 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper function to convert base64 to blob
  function base64ToBlob(base64Data, contentType = 'image/png') {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      return null;
    }
  }

  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("pdfFile");
    if (!fileInput.files.length) {
      alert('Please select a PDF file first');
      return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const uploadProgress = document.getElementById("uploadProgress");
    const convertProgress = document.getElementById("convertProgress");
    const results = document.getElementById("results");
    const progressContainer = document.querySelector(".progress-container");

    // Reset and show progress bars
    progressContainer.classList.add("active");
    uploadProgress.style.width = "0%";
    convertProgress.style.width = "0%";
    document.getElementById('uploadPercentage').textContent = "0%";
    document.getElementById('convertPercentage').textContent = "0%";

    // Disable submit button and update text
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-sync-alt"></i> Converting...';

    // Add file validation
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please upload only PDF files");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    // Array to store blob URLs for cleanup
    const blobUrls = [];

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      results.innerHTML = "";

      // Get the base filename without extension
      const baseName = file.name.replace(/\.pdf$/i, '');
      let buffer = '';
      const decoder = new TextDecoder();

      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Add delay to reduce CPU usage
        await sleep(250);

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        const updates = lines.map(str => {
          try {
            return str.trim() ? JSON.parse(str) : null;
          } catch (e) {
            console.error('Failed to parse JSON:', str);
            return null;
          }
        }).filter(Boolean);

        console.log("updates", updates);
        for (const update of updates) {
          if (update.type === 'upload') {
            uploadProgress.style.width = update.progress + '%';
            document.getElementById('uploadPercentage').textContent = update.progress + '%';
          } else if (update.type === 'conversion') {
            convertProgress.style.width = update.progress + '%';
            document.getElementById('convertPercentage').textContent = update.progress + '%';
          } else if (update.url) {
            // Create container and image display
            const container = document.createElement("div");
            container.className = "image-container";

            const imgWrapper = document.createElement("div");
            imgWrapper.className = "image-wrapper";

            const img = document.createElement("img");
            img.src = update.url;
            img.alt = "Converted page";

            // Convert base64 to blob and create download URL
            const pageNumber = results.children.length + 1;
            const base64Data = update.url.replace('data:image/png;base64,', '');
            const blob = base64ToBlob(base64Data);

            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              blobUrls.push(blobUrl); // Store for cleanup
              const fileName = `${baseName}-page${pageNumber}.png`;

              // Create download button
              const downloadBtn = document.createElement("button");
              downloadBtn.className = "download-btn";
              downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
              downloadBtn.onclick = () => {
                downloadImage(blobUrl, fileName)
                  .catch(error => console.error('Download failed:', error));
              };

              // Attempt automatic download (may be blocked by browser)
              try {
                await downloadImage(blobUrl, fileName);
              } catch (error) {
                console.log('Auto-download blocked, manual download available');
              }

              // Add elements to the container
              imgWrapper.appendChild(img);
              container.appendChild(imgWrapper);
              container.appendChild(downloadBtn);
              results.appendChild(container);
            } else {
              console.error('Failed to create blob from base64 data');
            }
          }
        }
      }
    } catch (error) {
      alert(`Error: ${error.message || "Failed to convert PDF"}`);
      // Reset progress bars on error
      uploadProgress.style.width = "0%";
      convertProgress.style.width = "0%";
      document.getElementById('uploadPercentage').textContent = "0%";
      document.getElementById('convertPercentage').textContent = "0%";
    } finally {
      // Re-enable submit button and reset text
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-sync-alt"></i> Convert to Images';

      // Hide progress bars after a delay
      setTimeout(() => {
        progressContainer.classList.remove("active");
      }, 1000);

      // Clean up blob URLs after a longer delay to ensure downloads complete
      setTimeout(() => {
        blobUrls.forEach(url => URL.revokeObjectURL(url));
      }, 30000); // 10 seconds should be enough for downloads to complete
    }
  });

})();