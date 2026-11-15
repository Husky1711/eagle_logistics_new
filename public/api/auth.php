<?php
/**
 * Admin login.
 *
 * GET                               -> { ok, authenticated, username?, csrf, configured }
 * POST ?action=login    { username, password }
 * POST ?action=logout   (CSRF header)
 * POST ?action=password { current, new } (CSRF header)
 */
require __DIR__ . '/_bootstrap.php';

$method = require_method('GET', 'POST');
start_session();

if ($method === 'GET') {
    json_out([
        'ok' => true,
        'configured' => is_configured(),
        'authenticated' => !empty($_SESSION['admin']),
        'username' => $_SESSION['admin'] ?? null,
        'csrf' => $_SESSION['csrf'],
        'secure' => is_https(),
    ]);
}

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    require_secure_connection();
    $config = load_config();
    if (empty($config['admin_password_hash'])) {
        fail('Admin account is not set up yet', 503);
    }

    $ip = client_ip();
    $recent = rate_hits('login', $ip, LOGIN_LOCK_SECONDS);
    if (count($recent) >= LOGIN_MAX_ATTEMPTS) {
        $wait = max(1, (int) ceil((min($recent) + LOGIN_LOCK_SECONDS - time()) / 60));
        fail("Too many attempts. Try again in {$wait} minute(s).", 429);
    }

    $body = read_json_body();
    $username = clean_text($body['username'] ?? '', 60);
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';

    // Always run password_verify so wrong usernames take the same time
    $userOk = hash_equals((string) $config['admin_username'], $username);
    $passOk = password_verify($password, (string) $config['admin_password_hash']);

    if (!$userOk || !$passOk) {
        rate_record('login', $ip, LOGIN_LOCK_SECONDS);
        usleep(400000);
        $left = LOGIN_MAX_ATTEMPTS - count($recent) - 1;
        fail($left > 0 ? "Wrong username or password ({$left} tries left)" : 'Wrong username or password', 401);
    }

    rate_record('login', $ip, LOGIN_LOCK_SECONDS, true);
    if (password_needs_rehash($config['admin_password_hash'], PASSWORD_DEFAULT)) {
        $config['admin_password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        save_config($config);
    }

    session_regenerate_id(true);
    $_SESSION['admin'] = $config['admin_username'];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $_SESSION['last_seen'] = time();

    json_out(['ok' => true, 'authenticated' => true, 'username' => $_SESSION['admin'], 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'logout') {
    check_csrf();
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    json_out(['ok' => true, 'authenticated' => false, 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'password') {
    require_secure_connection();
    require_admin();
    $config = load_config();
    $body = read_json_body();
    $current = is_string($body['current'] ?? null) ? $body['current'] : '';
    $new = is_string($body['new'] ?? null) ? $body['new'] : '';

    if (!password_verify($current, (string) ($config['admin_password_hash'] ?? ''))) {
        fail('Current password is wrong', 400);
    }
    if (strlen($new) < 10) {
        fail('New password must be at least 10 characters');
    }
    $config['admin_password_hash'] = password_hash($new, PASSWORD_DEFAULT);
    save_config($config);
    session_regenerate_id(true);
    json_out(['ok' => true]);
}

fail('Unknown action', 404);
