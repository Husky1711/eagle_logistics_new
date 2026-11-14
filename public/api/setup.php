<?php
/**
 * One-time admin account setup.
 *
 * Safety: only works when (1) no admin exists yet AND (2) a file named
 * ALLOW_SETUP exists in ~/eagle-data/ (create it in cPanel File Manager).
 * The file is deleted after a successful setup, so this endpoint locks itself.
 *
 * GET  -> { ok, configured, allowed }
 * POST { username, password, feedbackTo } -> creates config.php
 */
require __DIR__ . '/_bootstrap.php';

$method = require_method('GET', 'POST');
$flag = EAGLE_DATA_DIR . '/ALLOW_SETUP';
$allowed = !is_configured() && is_file($flag);

if ($method === 'GET') {
    json_out(['ok' => true, 'configured' => is_configured(), 'allowed' => $allowed]);
}

if (!$allowed) {
    fail('Setup is locked', 403);
}

$body = read_json_body();
$username = clean_text($body['username'] ?? '', 60);
$password = is_string($body['password'] ?? null) ? $body['password'] : '';
$feedbackTo = clean_text($body['feedbackTo'] ?? '', 200);

if (!preg_match('/^[A-Za-z0-9._@-]{3,60}$/', $username)) {
    fail('Username: 3-60 letters, numbers or . _ @ -');
}
if (strlen($password) < 10) {
    fail('Password must be at least 10 characters');
}
if ($feedbackTo !== '' && !filter_var($feedbackTo, FILTER_VALIDATE_EMAIL)) {
    fail('Feedback email address is not valid');
}

save_config([
    'admin_username' => $username,
    'admin_password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'feedback_to' => $feedbackTo,
    'mail_from' => 'no-reply@eaglelogistics.in',
    'created_at' => date('c'),
]);
@unlink($flag);

json_out(['ok' => true, 'configured' => true]);
