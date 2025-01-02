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
        // Add timeout to fetch request
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }
  
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF');
      }
  
      return blob;
    } catch (e) {
      console.error("PDF download failsed: ", e);
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

export default function add () {
    return 5;
}
