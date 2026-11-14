<?php
/**
 * Pricing admin (logged in; POSTs need X-CSRF-Token).
 *
 * GET                     -> { ok, pricing }                  full rate cards, margins, zones
 * POST ?action=save       { pricing }                         validate + save (backup kept)
 * POST ?action=preview    { pricing?, destination, weight, length?, width?, height? }
 *                         -> full cost/commission/profit breakdown per courier, WITHOUT saving
 *                            (uses the unsaved draft if 'pricing' is sent)
 * POST ?action=reset      restores the demo data (backup kept)
 */
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_pricing.php';

$method = require_method('GET', 'POST');

if ($method === 'GET') {
    if (!current_admin()) {
        fail('Please log in again', 401);
    }
    json_out(['ok' => true, 'pricing' => load_pricing()]);
}

require_admin();
$action = $_GET['action'] ?? '';
$body = read_json_body();

function save_pricing(array $pricing): void
{
    $backups = EAGLE_DATA_DIR . '/backups';
    ensure_dir($backups);
    if (is_file(EAGLE_PRICING_FILE)) {
        @copy(EAGLE_PRICING_FILE, $backups . '/pricing-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json');
        $old = glob($backups . '/pricing-*.json') ?: [];
        sort($old);
        foreach (array_slice($old, 0, max(0, count($old) - 30)) as $f) {
            @unlink($f);
        }
    }
    write_json_file(EAGLE_PRICING_FILE, $pricing);
}

if ($action === 'save') {
    $pricing = clean_pricing(is_array($body['pricing'] ?? null) ? $body['pricing'] : []);
    save_pricing($pricing);
    json_out(['ok' => true, 'pricing' => $pricing]);
}

if ($action === 'preview') {
    $pricing = is_array($body['pricing'] ?? null) ? clean_pricing($body['pricing']) : load_pricing();
    $num = function ($k) use ($body) {
        $v = $body[$k] ?? 0;
        return is_numeric($v) ? (float) $v : 0.0;
    };
    $q = build_quote($pricing, clean_text($body['destination'] ?? '', 60), $num('weight'), $num('length'), $num('width'), $num('height'));
    json_out(['ok' => true] + $q + ['settings' => $pricing['settings']]);
}

if ($action === 'reset') {
    $pricing = default_pricing();
    save_pricing($pricing);
    json_out(['ok' => true, 'pricing' => $pricing]);
}

fail('Unknown action', 404);
