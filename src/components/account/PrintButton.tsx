"use client";

/** Opens the browser's print dialog — customers can print or "Save as PDF". */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-outline btn-caps">
      ⤓ Download / Print
    </button>
  );
}
