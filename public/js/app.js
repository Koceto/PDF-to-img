document.querySelectorAll(".drop-zone").forEach((dropZone) => {
  const input = dropZone.querySelector(".drop-zone__input");

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drop-zone--over");
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropZone.addEventListener(type, (e) => {
      dropZone.classList.remove("drop-zone--over");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drop-zone--over");

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      input.files = e.dataTransfer.files;
      updateDropZone(dropZone, file);
    }
  });

  dropZone.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    if (input.files.length) {
      updateDropZone(dropZone, input.files[0]);
    }
  });
});

function updateDropZone(dropZone, file) {
  const prompt = dropZone.querySelector(".drop-zone__prompt");
  prompt.textContent = file.name;
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];
  const progressBar = document.querySelector(".progress-bar");
  const progress = document.getElementById("progress");
  const results = document.getElementById("results");

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
  progress.classList.remove("hidden");

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    results.innerHTML = data.images
      .map((img) => `<img src="${img}" alt="Converted page">`)
      .join("");
  } catch (error) {
    alert(`Error: ${error.message || "Failed to convert PDF"}`);
  } finally {
    progress.classList.add("hidden");
  }
});
