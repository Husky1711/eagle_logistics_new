<?php
/**
 * Banner image upload (admin only).
 *
 * POST multipart/form-data: file=<image>   (X-CSRF-Token header required)
 * -> { ok, url, width, height }
 *
 * Accepts real JPG / PNG / WebP images up to 2 MB, at least 600 px wide.
 * Files get random names, and /uploads has PHP execution disabled.
 */
require __DIR__ . '/_bootstrap.php';

require_method('POST');
require_admin();

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MIN_WIDTH = 600;

$file = $_FILES['file'] ?? null;
if (!is_array($file) || is_array($file['error'] ?? null)) {
    fail('No image received');
}
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $tooBig = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
    fail($tooBig ? 'Image is too large (max 2 MB)' : 'Upload failed - please try again');
}
if ($file['size'] > MAX_UPLOAD_BYTES) {
    fail('Image is too large (max 2 MB)');
}
if (!is_uploaded_file($file['tmp_name'])) {
    fail('Upload failed - please try again');
}

$info = @getimagesize($file['tmp_name']);
$types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
if (!$info || !isset($types[$info[2]])) {
    fail('Please upload a JPG, PNG or WebP image');
}
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        fail('Please upload a JPG, PNG or WebP image');
    }
}
[$width, $height] = $info;
if ($width < MIN_WIDTH) {
    fail("Image is too small ({$width} px wide) - use at least " . MIN_WIDTH . ' px');
}

ensure_dir(EAGLE_UPLOAD_DIR);
$guard = dirname(EAGLE_UPLOAD_DIR) . '/.htaccess';
if (!is_file($guard)) {
    // Never run scripts from the uploads folder, even if one slipped through
    file_put_contents($guard, "Options -Indexes -ExecCGI\n<FilesMatch \"\\.(php\\d?|phtml|phar|pl|py|cgi|sh|htaccess)$\">\n  Require all denied\n</FilesMatch>\n");
}
$name = date('Ymd') . '-' . bin2hex(random_bytes(6)) . '.' . $types[$info[2]];
if (!move_uploaded_file($file['tmp_name'], EAGLE_UPLOAD_DIR . '/' . $name)) {
    fail('Could not save the image', 500);
}
@chmod(EAGLE_UPLOAD_DIR . '/' . $name, 0644);

json_out(['ok' => true, 'url' => EAGLE_UPLOAD_URL . '/' . $name, 'width' => $width, 'height' => $height]);
