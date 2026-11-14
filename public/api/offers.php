<?php
/**
 * Offers API.
 *
 * Public:
 *   GET                       -> { ok, settings, offers }   only live offers (active + within dates), sorted
 * Admin (logged in; POSTs need the X-CSRF-Token header):
 *   GET  ?scope=all           -> { ok, settings, offers }   every offer, including drafts/expired
 *   POST ?action=save         { offer }        create (no id) or update
 *   POST ?action=delete       { id }
 *   POST ?action=reorder      { ids: [...] }   new display order
 *   POST ?action=settings     { settings }     offers-page banner etc.
 */
require __DIR__ . '/_bootstrap.php';

$method = require_method('GET', 'POST');

/** Starting content = what the site showed before the admin existed. */
function default_store(): array
{
    return [
        'settings' => [
            'heroImage' => '/assets/pages/special-offers-hero.png',
            'heroTitle' => 'Courier Offers & Student Discounts',
            'heroSubtitle' => 'Celebrate festivals with Eagle Logistics festive offers',
        ],
        'offers' => [[
            'id' => 'usa-567',
            'title' => 'Send parcels to the USA from Bangalore',
            'priceText' => '₹567* per kg',
            'description' => 'Books, clothes, homemade sweets, footwear, spices, biscuits, medicines and more - with doorstep pickup.',
            'destinations' => ['USA'],
            'image' => '/assets/pages/special-offers-promo.png',
            'startDate' => '',
            'endDate' => '',
            'promoCode' => '',
            'terms' => 'Conditions apply',
            'homeStripText' => 'Gifts & parcels abroad from ₹567*/kg · *conditions apply',
            'showOnHome' => true,
            'active' => true,
            'updatedAt' => date('c'),
        ]],
    ];
}

function load_store(): array
{
    $store = read_json_file(EAGLE_OFFERS_FILE, null);
    if (!is_array($store)) {
        $store = default_store();
    }
    $store['settings'] = is_array($store['settings'] ?? null) ? $store['settings'] : [];
    $store['offers'] = array_values(array_filter((array) ($store['offers'] ?? []), 'is_array'));
    return $store;
}

function save_store(array $store): void
{
    // Keep the last 30 versions so any mistake can be undone from cPanel
    $backups = EAGLE_DATA_DIR . '/backups';
    ensure_dir($backups);
    if (is_file(EAGLE_OFFERS_FILE)) {
        // Unique per save (several saves can happen within one second)
        @copy(EAGLE_OFFERS_FILE, $backups . '/offers-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json');
        $old = glob($backups . '/offers-*.json') ?: [];
        sort($old);
        foreach (array_slice($old, 0, max(0, count($old) - 30)) as $f) {
            @unlink($f);
        }
    }
    write_json_file(EAGLE_OFFERS_FILE, $store);
}

function is_live(array $offer, string $today): bool
{
    if (empty($offer['active'])) {
        return false;
    }
    if (!empty($offer['startDate']) && $offer['startDate'] > $today) {
        return false;
    }
    if (!empty($offer['endDate']) && $offer['endDate'] < $today) {
        return false;
    }
    return true;
}

/** Only our own uploads or bundled site assets may be used as images. */
function clean_image($value): string
{
    $s = clean_text($value, 300);
    if ($s === '') {
        return '';
    }
    $ok = preg_match('#^/(uploads/offers|assets)/[A-Za-z0-9._/-]+\.(jpe?g|png|webp)$#i', $s) && strpos($s, '..') === false;
    if (!$ok) {
        fail('Image must be uploaded through the admin');
    }
    return $s;
}

function clean_offer(array $in, ?array $existing): array
{
    $title = clean_text($in['title'] ?? '', 120);
    if ($title === '') {
        fail('Offer title is required');
    }
    $start = clean_date($in['startDate'] ?? '');
    $end = clean_date($in['endDate'] ?? '');
    if (($in['startDate'] ?? '') !== '' && $start === '') {
        fail('Start date is not valid');
    }
    if (($in['endDate'] ?? '') !== '' && $end === '') {
        fail('End date is not valid');
    }
    if ($start && $end && $end < $start) {
        fail('End date must be on or after the start date');
    }

    $destinations = [];
    foreach ((array) ($in['destinations'] ?? []) as $d) {
        $d = clean_text($d, 40);
        if ($d !== '' && count($destinations) < 20) {
            $destinations[] = $d;
        }
    }

    return [
        'id' => $existing['id'] ?? (preg_replace('/[^a-z0-9]+/', '-', strtolower(substr($title, 0, 30))) . '-' . bin2hex(random_bytes(3))),
        'title' => $title,
        'priceText' => clean_text($in['priceText'] ?? '', 60),
        'description' => clean_text($in['description'] ?? '', 600),
        'destinations' => $destinations,
        'image' => clean_image($in['image'] ?? ''),
        'startDate' => $start,
        'endDate' => $end,
        'promoCode' => strtoupper(clean_text($in['promoCode'] ?? '', 30)),
        'terms' => clean_text($in['terms'] ?? '', 300),
        'homeStripText' => clean_text($in['homeStripText'] ?? '', 120),
        'showOnHome' => !empty($in['showOnHome']),
        'active' => !empty($in['active']),
        'updatedAt' => date('c'),
    ];
}

$store = load_store();

if ($method === 'GET') {
    if (($_GET['scope'] ?? '') === 'all') {
        if (!current_admin()) {
            fail('Please log in again', 401);
        }
        json_out(['ok' => true, 'today' => today(), 'settings' => $store['settings'], 'offers' => $store['offers']]);
    }
    $today = today();
    $live = array_values(array_filter($store['offers'], function ($o) use ($today) {
        return is_live($o, $today);
    }));
    header('Cache-Control: public, max-age=60');
    json_out(['ok' => true, 'settings' => $store['settings'], 'offers' => $live]);
}

require_admin();
$action = $_GET['action'] ?? '';
$body = read_json_body();

if ($action === 'save') {
    $in = is_array($body['offer'] ?? null) ? $body['offer'] : fail('Missing offer');
    $id = clean_text($in['id'] ?? '', 80);
    $index = null;
    foreach ($store['offers'] as $i => $o) {
        if ($id !== '' && ($o['id'] ?? '') === $id) {
            $index = $i;
        }
    }
    if ($id !== '' && $index === null) {
        fail('Offer not found - it may have been deleted', 404);
    }
    if ($index === null && count($store['offers']) >= 50) {
        fail('Maximum 50 offers - delete old ones first');
    }
    $offer = clean_offer($in, $index === null ? null : $store['offers'][$index]);
    if ($index === null) {
        array_unshift($store['offers'], $offer);
    } else {
        $store['offers'][$index] = $offer;
    }
    save_store($store);
    json_out(['ok' => true, 'offer' => $offer, 'offers' => $store['offers']]);
}

if ($action === 'delete') {
    $id = clean_text($body['id'] ?? '', 80);
    $before = count($store['offers']);
    $store['offers'] = array_values(array_filter($store['offers'], function ($o) use ($id) {
        return ($o['id'] ?? '') !== $id;
    }));
    if (count($store['offers']) === $before) {
        fail('Offer not found', 404);
    }
    save_store($store);
    json_out(['ok' => true, 'offers' => $store['offers']]);
}

if ($action === 'reorder') {
    $ids = array_map(function ($v) {
        return clean_text($v, 80);
    }, (array) ($body['ids'] ?? []));
    $byId = [];
    foreach ($store['offers'] as $o) {
        $byId[$o['id']] = $o;
    }
    $sorted = [];
    foreach ($ids as $id) {
        if (isset($byId[$id])) {
            $sorted[] = $byId[$id];
            unset($byId[$id]);
        }
    }
    $store['offers'] = array_merge($sorted, array_values($byId));
    save_store($store);
    json_out(['ok' => true, 'offers' => $store['offers']]);
}

if ($action === 'settings') {
    $in = is_array($body['settings'] ?? null) ? $body['settings'] : [];
    $store['settings'] = [
        'heroImage' => clean_image($in['heroImage'] ?? ''),
        'heroTitle' => clean_text($in['heroTitle'] ?? '', 120),
        'heroSubtitle' => clean_text($in['heroSubtitle'] ?? '', 200),
    ];
    save_store($store);
    json_out(['ok' => true, 'settings' => $store['settings']]);
}

fail('Unknown action', 404);
