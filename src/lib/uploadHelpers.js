/**
 * Legacy file-upload helpers kept for optional future Storage use.
 * The admin panel now uses external media URLs (see UrlMediaList) — Firebase Storage is not required.
 */
export { createBlurDataUrl, slugify } from './utils';
