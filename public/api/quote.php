<?php
/**
 * Public price calculator.
 *
 * GET  -> { ok, destinations: [{ name, zone }], settings: { pricesIncludeGst, gstPercent, maxWeight, volumetricDivisor } }
 * POST { destination, weight, length?, width?, height? }   (cm / kg)
 *   -> { ok, zone, weights: { actual, volumetric, chargeable }, results: [{ courier, transit, price }], pricesIncludeGst }
 *
 * Only final customer prices leave the server - never costs, discounts or commission.
 */
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_pricing.php';

$method = require_method('GET', 'POST');
$pricing = load_pricing();
$s = $pricing['settings'];

if ($method === 'GET') {
    $destinations = [];
    foreach ($pricing['zones'] as $z) {
        foreach ($z['destinations'] as $d) {
            $destinations[] = ['name' => $d, 'zone' => $z['name']];
        }
    }
    header('Cache-Control: public, max-age=60');
    json_out([
        'ok' => true,
        'destinations' => $destinations,
        'settings' => [
            'pricesIncludeGst' => $s['pricesIncludeGst'],
            'gstPercent' => $s['gstPercent'],
            'maxWeight' => $s['maxWeight'],
            'volumetricDivisor' => $s['volumetricDivisor'],
        ],
    ]);
}

// Light rate limit so nobody scrapes the whole rate card
$ip = client_ip();
if (count(rate_hits('quote', $ip, 600)) >= 120) {
    fail('Too many price checks - please wait a few minutes or WhatsApp us.', 429);
}
rate_record('quote', $ip, 600);

$body = read_json_body();
$num = function ($k) use ($body) {
    $v = $body[$k] ?? 0;
    return is_numeric($v) ? (float) $v : 0.0;
};
$weight = $num('weight');
if ($weight <= 0 || $weight > 1000) {
    fail('Enter a weight between 0.1 and ' . $s['maxWeight'] . ' kg');
}
$q = build_quote($pricing, clean_text($body['destination'] ?? '', 60), $weight, $num('length'), $num('width'), $num('height'));

json_out([
    'ok' => true,
    'zone' => $q['zone'],
    'weights' => $q['weights'],
    'tooHeavy' => $q['tooHeavy'],
    'maxWeight' => $s['maxWeight'],
    'pricesIncludeGst' => $s['pricesIncludeGst'],
    'gstPercent' => $s['gstPercent'],
    'results' => array_map(function ($r) {
        return ['courierId' => $r['courierId'], 'courier' => $r['courier'], 'transit' => $r['transit'], 'price' => $r['customerPrice']];
    }, $q['results']),
]);
