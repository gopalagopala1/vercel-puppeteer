import { useMutation } from "@tanstack/react-query";

export const generateDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.style.display = "none";
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

const downloadPdf = async (url: string) => {
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
  
      if (!response.ok) {
        // Get error details from response if available
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }
  
      return response.blob();
    } catch (e) {
      // Re-throw the error instead of just logging it
      console.error("PDF download failed:", e);
      throw e;
    }
  };

export const useDownloadPdf = () => {
  return useMutation({
    mutationFn: downloadPdf,
    onSuccess: (blob) => {
      generateDownload(blob, "shelter-details.pdf");
    },
    onError: (error) => {
      console.error("Wrong pdf url", error);
    },
  });
};
