const form = document.getElementById("compress-form");
const imageInput = document.getElementById("image-input");
const scaleInput = document.getElementById("scale-percent");
const scaleValue = document.getElementById("scale-value");
const qualityInput = document.getElementById("quality");
const qualityValue = document.getElementById("quality-value");
const estimateBtn = document.getElementById("estimate-btn");
const downloadBtn = document.getElementById("download-btn");
const previewPanel = document.getElementById("preview-panel");
const statOriginalSize = document.getElementById("stat-original-size");
const statOriginalDims = document.getElementById("stat-original-dims");
const statEstimatedSize = document.getElementById("stat-estimated-size");
const statOutputDims = document.getElementById("stat-output-dims");
const statWarning = document.getElementById("stat-warning");
const previewFigure = document.getElementById("preview-figure");
const previewImage = document.getElementById("preview-image");
const previewTooLarge = document.getElementById("preview-too-large");
const statusText = document.getElementById("status");

let lastEstimate = null;

function setStatus(text) {
  statusText.textContent = text;
}

function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) {
    return "—";
  }
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function extForFormat(format) {
  if (format === "jpeg") {
    return "jpg";
  }
  if (format === "tiff") {
    return "tif";
  }
  if (format === "heif") {
    return "heic";
  }
  return format || "bin";
}

function readOptions() {
  return {
    scalePercent: scaleInput.value,
    quality: qualityInput.value,
  };
}

function buildFormData(file) {
  const opts = readOptions();
  const body = new FormData();
  body.append("image", file);
  body.append("scalePercent", String(opts.scalePercent));
  body.append("quality", String(opts.quality));
  return body;
}

async function parseErrorMessage(response) {
  const rawText = await response.text().catch(() => "");
  if (!rawText) {
    return "Request failed.";
  }
  try {
    const data = JSON.parse(rawText);
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    return rawText.slice(0, 180);
  }
  return rawText.slice(0, 180);
}

function clearVisualPreview() {
  previewImage.removeAttribute("src");
  previewFigure.classList.add("hidden");
  previewTooLarge.classList.add("hidden");
}

function invalidateEstimate() {
  lastEstimate = null;
  downloadBtn.disabled = true;
  previewPanel.classList.add("hidden");
  statWarning.classList.add("hidden");
  clearVisualPreview();
}

imageInput.addEventListener("change", invalidateEstimate);

scaleInput.addEventListener("input", () => {
  scaleValue.textContent = scaleInput.value;
  invalidateEstimate();
});

qualityInput.addEventListener("input", () => {
  qualityValue.textContent = qualityInput.value;
  invalidateEstimate();
});

estimateBtn.addEventListener("click", async () => {
  const files = imageInput.files ? Array.from(imageInput.files) : [];
  if (files.length === 0) {
    setStatus("Please choose an image.");
    return;
  }

  const file = files[0];
  estimateBtn.disabled = true;
  downloadBtn.disabled = true;
  lastEstimate = null;
  previewPanel.classList.add("hidden");
  statWarning.classList.add("hidden");
  clearVisualPreview();
  setStatus("Estimating…");

  try {
    const response = await fetch("./api/preview", {
      method: "POST",
      body: buildFormData(file),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    lastEstimate = data;

    statOriginalSize.textContent = formatBytes(data.originalBytes);
    statOriginalDims.textContent = `${data.originalWidth} × ${data.originalHeight} px`;
    statEstimatedSize.textContent = formatBytes(data.estimatedBytes);
    statOutputDims.textContent = `${data.outputWidth} × ${data.outputHeight} px · ${data.format}`;

    if (typeof data.previewDataUrl === "string" && data.previewDataUrl.length > 0) {
      previewImage.src = data.previewDataUrl;
      previewFigure.classList.remove("hidden");
      previewTooLarge.classList.add("hidden");
    } else {
      previewImage.removeAttribute("src");
      previewFigure.classList.add("hidden");
      previewTooLarge.classList.remove("hidden");
    }

    const largerOrEqual = data.estimatedBytes >= data.originalBytes;
    if (largerOrEqual) {
      statWarning.textContent =
        "Estimated output is not smaller than the original with these settings. You can still download, or lower the size % / quality.";
      statWarning.classList.remove("hidden");
    } else {
      statWarning.classList.add("hidden");
    }

    previewPanel.classList.remove("hidden");
    downloadBtn.disabled = false;
    setStatus("Estimate ready. Review numbers, then download if you agree.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Estimate failed.";
    setStatus(message);
  } finally {
    estimateBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", async () => {
  const files = imageInput.files ? Array.from(imageInput.files) : [];
  if (files.length === 0) {
    setStatus("Please choose an image.");
    return;
  }

  if (!lastEstimate) {
    setStatus("Run “Estimate size” first.");
    return;
  }

  const file = files[0];
  downloadBtn.disabled = true;
  setStatus("Preparing download…");

  try {
    const response = await fetch("./api/export", {
      method: "POST",
      body: buildFormData(file),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const blob = await response.blob();
    const dispo = response.headers.get("Content-Disposition") || "";
    const match = /filename="([^"]+)"/.exec(dispo);
    const fallbackExt = extForFormat(lastEstimate.format);
    const fileName = match ? match[1] : `optimized.${fallbackExt}`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus("Download started.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed.";
    setStatus(message);
  } finally {
    downloadBtn.disabled = false;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});
