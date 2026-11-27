/** Shared between the PDF route, the headless browser, and the /render page. */

/** Global holding the resume JSON, set by the headless browser before the page loads. */
export const PDF_DATA_GLOBAL = "__CV_PDF_DATA__";
/** Set on <body> once fonts and images are ready to print. */
export const PDF_READY_ATTRIBUTE = "data-pdf-ready";
export const MAX_PDF_REQUEST_BYTES = 5 * 1024 * 1024;
