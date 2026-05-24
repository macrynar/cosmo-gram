"use client";

export type ShareInput = {
  pngBlob: Blob;
  filename: string;
  caption: string;
};

export type ShareResult = {
  method: "web_share" | "download" | "copy_link";
  success: boolean;
};

export function useShare() {
  function download({ pngBlob, filename }: ShareInput): void {
    const url = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share(input: ShareInput): Promise<ShareResult> {
    const file = new File([input.pngBlob], input.filename, { type: "image/png" });
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: "Cosmogram",
          text: input.caption,
        });
        return { method: "web_share", success: true };
      } catch {
        // User cancelled or share failed — fall back to download
      }
    }
    download(input);
    return { method: "download", success: true };
  }

  async function copyLink(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  return { share, download, copyLink };
}
