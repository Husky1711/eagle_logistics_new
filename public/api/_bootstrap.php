<?php
/**
 * Shared setup for the Eagle Logistics PHP API (offers admin + feedback).
 *
 * Data lives OUTSIDE the web root so it can't be downloaded and isn't
 * overwritten by deploys:
 *   ~/eagle-data/config.php      admin login (hashed password), email settings
 *   ~/eagle-data/offers.json     offers + offers-page settings
 *   ~/eagle-data/backups/        copy of offers.json before every save
 *   ~/eagle-data/state/          login attempts, feedback rate limits
 *
 * Works on PHP 7.4+ (GoDaddy shared hosting) and PHP 8.x.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

date_default_timezone_set('Asia/Kolkata');
error_reporting(E_ALL);
ini_set('display_errors', '0');

// public_html/api/_bootstrap.php -> /home/<user>/eagle-data
define('EAGLE_DATA_DIR', rtrim(getenv('EAGLE_DATA_DIR') ?: dirname(__DIR__, 2) . '/eagle-data', '/\\'));
define('EAGLE_UPLOAD_DIR', dirname(__DIR__) . '/uploads/offers');
define('EAGLE_UPLOAD_URL', '/uploads/offers');
define('EAGLE_CONFIG_FILE', EAGLE_DATA_DIR . '/config.php');
define('EAGLE_OFFERS_FILE', EAGLE_DATA_DIR . '/offers.json');

const SESSION_IDLE_SECONDS = 1800;      // auto-logout after 30 min idle
const LOGIN_MAX_ATTEMPTS = 5;           // per IP ...
const LOGIN_LOCK_SECONDS = 900;         // ... locked for 15 min
const FEEDBACK_MAX_PER_HOUR = 5;        // per IP

header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

// ---------------------------------------------------------------- responses

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): void
{
    json_out(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function require_method(string ...$methods): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        fail('Method not allowed', 405);
    }
    return $method;
}

/** JSON request body as an array (max 64 KB). */
function read_json_body(): array
{
    $raw = file_get_contents('php://input', false, null, 0, 65536);
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail('Invalid JSON body');
    }
    return $data;
}

// ---------------------------------------------------------------- files

function ensure_dir(string $dir): void
{
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
        fail('Server storage is not writable', 500);
    }
}

function read_json_file(string $path, $default)
{
    if (!is_file($path)) {
        return $default;
    }
    $fh = fopen($path, 'rb');
    if (!$fh) {
        return $default;
    }
    flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : $default;
}

/** Atomic write: temp file + rename, so a crash never leaves half a file. */
function write_json_file(string $path, array $data): void
{
    ensure_dir(dirname($path));
    $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, $path)) {
        @unlink($tmp);
        fail('Could not save data', 500);
    }
}

// ---------------------------------------------------------------- config

function load_config(): array
{
    if (!is_file(EAGLE_CONFIG_FILE)) {
        return [];
    }
    $config = include EAGLE_CONFIG_FILE;
    return is_array($config) ? $config : [];
}

function save_config(array $config): void
{
    ensure_dir(EAGLE_DATA_DIR);
    $php = "<?php\n// Eagle Logistics admin config - generated, keep private.\nreturn " . var_export($config, true) . ";\n";
    $tmp = EAGLE_CONFIG_FILE . '.tmp';
    if (file_put_contents($tmp, $php, LOCK_EX) === false || !rename($tmp, EAGLE_CONFIG_FILE)) {
        fail('Could not save config', 500);
    }
    @chmod(EAGLE_CONFIG_FILE, 0600);
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(EAGLE_CONFIG_FILE, true);
    }
}

function is_configured(): bool
{
    $c = load_config();
    return !empty($c['admin_username']) && !empty($c['admin_password_hash']);
}

// ---------------------------------------------------------------- session + auth

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('eagle_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();

    $now = time();
    if (!empty($_SESSION['admin']) && ($now - ($_SESSION['last_seen'] ?? 0)) > SESSION_IDLE_SECONDS) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['last_seen'] = $now;
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function current_admin(): ?string
{
    start_session();
    return $_SESSION['admin'] ?? null;
}

/** Every state-changing admin request must send the CSRF token header. */
function require_admin(): string
{
    $user = current_admin();
    if (!$user) {
        fail('Please log in again', 401);
    }
    check_csrf();
    return $user;
}

function check_csrf(): void
{
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($sent) || !hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        fail('Security check failed - refresh the page and try again', 403);
    }
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 64);
}

// ---------------------------------------------------------------- simple per-IP counters

/** Returns the list of timestamps for $key within $window seconds (and prunes old ones). */
function rate_hits(string $bucket, string $key, int $window): array
{
    $file = EAGLE_DATA_DIR . '/state/' . $bucket . '.json';
    $all = read_json_file($file, []);
    $cut = time() - $window;
    $hits = array_values(array_filter($all[$key] ?? [], function ($t) use ($cut) {
        return $t > $cut;
    }));
    return $hits;
}

function rate_record(string $bucket, string $key, int $window, bool $reset = false): void
{
    $file = EAGLE_DATA_DIR . '/state/' . $bucket . '.json';
    $all = read_json_file($file, []);
    $cut = time() - $window;
    foreach ($all as $k => $times) {
        $all[$k] = array_values(array_filter((array) $times, function ($t) use ($cut) {
            return $t > $cut;
        }));
        if (!$all[$k]) {
            unset($all[$k]);
        }
    }
    if ($reset) {
        unset($all[$key]);
    } else {
        $all[$key][] = time();
    }
    write_json_file($file, $all);
}

// ---------------------------------------------------------------- input cleaning

function clean_text($value, int $max): string
{
    $s = is_scalar($value) ? (string) $value : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    $s = trim($s);
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

function clean_date($value): string
{
    $s = is_string($value) ? trim($value) : '';
    if ($s === '') {
        return '';
    }
    $d = DateTime::createFromFormat('!Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : '';
}

function today(): string
{
    return date('Y-m-d');
}
