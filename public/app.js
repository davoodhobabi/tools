const form = document.getElementById("convert-form");
const input = document.getElementById("image-input");
const formatSelect = document.getElementById("format-select");
const statusText = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");
const appBasePath = "/image-type-convert";

function setStatus(text) {
  statusText.textContent = text;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const files = input.files ? Array.from(input.files) : [];
  const outputFormat = formatSelect.value;
  if (files.length === 0) {
    setStatus("Please select at least one image.");
    return;
  }
  if (!outputFormat) {
    setStatus("Please select output format.");
    return;
  }

  submitBtn.disabled = true;
  setStatus(`Converting ${files.length} image(s)...`);

  try {
    const body = new FormData();
    for (const file of files) {
      body.append("images", file);
    }
    body.append("outputFormat", outputFormat);

    const response = await fetch(`${appBasePath}/api/convert`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const rawText = await response.text().catch(() => "");
      let message = "Conversion failed.";
      if (rawText) {
        try {
          const errorData = JSON.parse(rawText);
          if (typeof errorData?.message === "string" && errorData.message.trim()) {
            message = errorData.message;
          } else {
            message = rawText.slice(0, 180);
          }
        } catch {
          message = rawText.slice(0, 180);
        }
      }
      throw new Error(message);
    }

    const zipBlob = await response.blob();
    const fileName = `converted-${outputFormat}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`Done. ${outputFormat} zip downloaded.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    setStatus(message);
  } finally {
    submitBtn.disabled = false;
  }
});
