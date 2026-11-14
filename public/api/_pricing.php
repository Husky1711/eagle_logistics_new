<?php
/**
 * Pricing engine - the ONLY place prices are calculated, so courier costs,
 * discounts and commission never reach the visitor's browser.
 *
 * How a quote is built (per courier):
 *   chargeable weight = max(actual, L×W×H ÷ volumetric divisor), rounded UP to the weight step
 *   published rate    = courier rate card: first weight slab ≥ chargeable weight
 *                       (above the last slab: last slab + extra kg × "per kg above")
 *   − courier discount %          (your negotiated discount off the published rate)
 *   + fuel surcharge %            (on the discounted rate, as couriers bill it)
 *   = YOUR COST
 *   + commission % + flat ₹       (your margin)
 *   → at least the minimum charge, rounded UP to "round to"
 *   = SELLING PRICE (before GST)
 *   + GST %                       = CUSTOMER TOTAL
 *
 * Data: ~/eagle-data/pricing.json (seeded with demo numbers below).
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

define('EAGLE_PRICING_FILE', EAGLE_DATA_DIR . '/pricing.json');

const DEFAULT_SLABS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/** Demo data so the page works out of the box - the client replaces these with real rate cards. */
function default_pricing(): array
{
    $zones = [
        ['id' => 'local', 'name' => 'Bangalore local', 'destinations' => ['Within Bangalore']],
        ['id' => 'india', 'name' => 'Rest of India', 'destinations' => ['Elsewhere in India']],
        ['id' => 'me-asia', 'name' => 'Middle East & Asia', 'destinations' => ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Singapore', 'Malaysia', 'Hong Kong', 'Japan']],
        ['id' => 'europe', 'name' => 'Europe', 'destinations' => ['United Kingdom', 'Ireland', 'Germany', 'France', 'Netherlands', 'Italy', 'Spain']],
        ['id' => 'americas', 'name' => 'Americas & Oceania', 'destinations' => ['United States', 'Canada', 'Australia', 'New Zealand']],
    ];
    // Published (list) rates follow the old site's rate card: base + per-kg, per courier and zone
    $base = [
        'fedex' => ['local' => [65, 16], 'india' => [165, 28], 'me-asia' => [400, 470], 'europe' => [500, 530], 'americas' => [560, 555]],
        'dhl' => ['local' => [70, 18], 'india' => [175, 30], 'me-asia' => [420, 480], 'europe' => [520, 540], 'americas' => [580, 567]],
        'ups' => ['local' => [68, 17], 'india' => [170, 29], 'me-asia' => [410, 475], 'europe' => [510, 535], 'americas' => [570, 560]],
    ];
    $transit = ['local' => '1 day', 'india' => '2-4 days', 'me-asia' => '3-5 days', 'europe' => '4-7 days', 'americas' => '5-8 days'];
    $meta = [
        'fedex' => ['FedEx', 40, 22, 18],
        'dhl' => ['DHL', 38, 24, 18],
        'ups' => ['UPS', 40, 23, 18],
    ];

    $couriers = [];
    $rateCards = [];
    foreach ($meta as $id => [$name, $discount, $fuel, $commission]) {
        $t = [];
        foreach ($zones as $z) {
            [$b, $perKg] = $base[$id][$z['id']];
            $slabs = [];
            foreach (DEFAULT_SLABS as $w) {
                $slabs[(string) $w] = (int) round($b + $perKg * $w);
            }
            $rateCards[$id][$z['id']] = ['slabs' => $slabs, 'perKgAbove' => $perKg];
            $t[$z['id']] = $transit[$z['id']];
        }
        $couriers[] = [
            'id' => $id,
            'name' => $name,
            'active' => true,
            'discountPercent' => $discount,
            'fuelPercent' => $fuel,
            'commissionPercent' => $commission,
            'commissionFlat' => 0,
            'transit' => $t,
        ];
    }

    return [
        'settings' => [
            'gstPercent' => 18,
            'pricesIncludeGst' => true,
            'roundTo' => 10,
            'minimumCharge' => 99,
            'volumetricDivisor' => 5000,
            'weightStep' => 0.5,
            'maxWeight' => 70,
            'slabWeights' => DEFAULT_SLABS,
        ],
        'zones' => $zones,
        'couriers' => $couriers,
        'rateCards' => $rateCards,
        'updatedAt' => date('c'),
    ];
}

function load_pricing(): array
{
    $p = read_json_file(EAGLE_PRICING_FILE, null);
    return is_array($p) && isset($p['couriers'], $p['zones'], $p['rateCards'], $p['settings']) ? $p : default_pricing();
}

// ---------------------------------------------------------------- validation

function num_in($value, float $min, float $max, string $label): float
{
    if (!is_numeric($value)) {
        fail("{$label} must be a number");
    }
    $n = (float) $value;
    if ($n < $min || $n > $max) {
        fail("{$label} must be between {$min} and {$max}");
    }
    return round($n, 2);
}

function slug_id($value, string $label): string
{
    $s = strtolower(clean_text($value, 40));
    if (!preg_match('/^[a-z0-9][a-z0-9-]{0,39}$/', $s)) {
        fail("{$label}: use letters, numbers and dashes");
    }
    return $s;
}

/** Validates the whole pricing document coming from the admin. */
function clean_pricing(array $in): array
{
    $s = (array) ($in['settings'] ?? []);
    $slabWeights = [];
    foreach ((array) ($s['slabWeights'] ?? []) as $w) {
        $slabWeights[] = num_in($w, 0.1, 500, 'Slab weight');
    }
    $slabWeights = array_values(array_unique($slabWeights, SORT_REGULAR));
    sort($slabWeights);
    if (!$slabWeights || count($slabWeights) > 40) {
        fail('Add between 1 and 40 weight slabs');
    }
    $settings = [
        'gstPercent' => num_in($s['gstPercent'] ?? 18, 0, 50, 'GST %'),
        'pricesIncludeGst' => !empty($s['pricesIncludeGst']),
        'roundTo' => (int) num_in($s['roundTo'] ?? 10, 1, 1000, 'Round to'),
        'minimumCharge' => num_in($s['minimumCharge'] ?? 0, 0, 100000, 'Minimum charge'),
        'volumetricDivisor' => (int) num_in($s['volumetricDivisor'] ?? 5000, 1000, 10000, 'Volumetric divisor'),
        'weightStep' => num_in($s['weightStep'] ?? 0.5, 0.1, 5, 'Weight step'),
        'maxWeight' => num_in($s['maxWeight'] ?? 70, 1, 1000, 'Maximum weight'),
        'slabWeights' => $slabWeights,
    ];

    $zones = [];
    $seenDest = [];
    foreach ((array) ($in['zones'] ?? []) as $z) {
        $id = slug_id($z['id'] ?? '', 'Zone id');
        $name = clean_text($z['name'] ?? '', 60);
        if ($name === '') {
            fail('Every zone needs a name');
        }
        $dests = [];
        foreach ((array) ($z['destinations'] ?? []) as $d) {
            $d = clean_text($d, 60);
            if ($d === '') {
                continue;
            }
            $key = strtolower($d);
            if (isset($seenDest[$key])) {
                fail("\"{$d}\" is in two zones ({$seenDest[$key]} and {$name})");
            }
            $seenDest[$key] = $name;
            $dests[] = $d;
        }
        $zones[$id] = ['id' => $id, 'name' => $name, 'destinations' => $dests];
    }
    if (!$zones || count($zones) > 30) {
        fail('Add between 1 and 30 zones');
    }

    $couriers = [];
    $rateCards = [];
    foreach ((array) ($in['couriers'] ?? []) as $c) {
        $id = slug_id($c['id'] ?? '', 'Courier id');
        $name = clean_text($c['name'] ?? '', 40);
        if ($name === '') {
            fail('Every courier needs a name');
        }
        $transit = [];
        foreach ($zones as $zid => $_) {
            $transit[$zid] = clean_text($c['transit'][$zid] ?? '', 30);
        }
        $couriers[$id] = [
            'id' => $id,
            'name' => $name,
            'active' => !empty($c['active']),
            'discountPercent' => num_in($c['discountPercent'] ?? 0, 0, 90, "{$name} discount %"),
            'fuelPercent' => num_in($c['fuelPercent'] ?? 0, 0, 100, "{$name} fuel surcharge %"),
            'commissionPercent' => num_in($c['commissionPercent'] ?? 0, 0, 300, "{$name} commission %"),
            'commissionFlat' => num_in($c['commissionFlat'] ?? 0, 0, 100000, "{$name} flat commission"),
            'transit' => $transit,
        ];
        foreach ($zones as $zid => $zone) {
            $card = $in['rateCards'][$id][$zid] ?? [];
            $slabs = [];
            foreach ($slabWeights as $w) {
                $v = $card['slabs'][(string) $w] ?? ($card['slabs'][(string) (float) $w] ?? '');
                if ($v === '' || $v === null) {
                    continue; // blank = courier doesn't offer this weight/zone
                }
                $slabs[(string) $w] = num_in($v, 0, 10000000, "{$name} {$zone['name']} {$w} kg rate");
            }
            $above = $card['perKgAbove'] ?? '';
            $rateCards[$id][$zid] = [
                'slabs' => $slabs,
                'perKgAbove' => ($above === '' || $above === null) ? null : num_in($above, 0, 1000000, "{$name} {$zone['name']} per kg above"),
            ];
        }
    }
    if (!$couriers || count($couriers) > 20) {
        fail('Add between 1 and 20 couriers');
    }

    return [
        'settings' => $settings,
        'zones' => array_values($zones),
        'couriers' => array_values($couriers),
        'rateCards' => $rateCards,
        'updatedAt' => date('c'),
    ];
}

// ---------------------------------------------------------------- calculation

function round_up_to(float $value, float $step): float
{
    return $step > 0 ? ceil(round($value / $step, 6)) * $step : $value;
}

/** Actual vs volumetric weight -> chargeable weight. Dimensions in cm (optional). */
function chargeable_weight(array $settings, float $actual, float $l = 0, float $w = 0, float $h = 0): array
{
    $step = (float) $settings['weightStep'];
    $volumetric = ($l > 0 && $w > 0 && $h > 0) ? ($l * $w * $h) / (float) $settings['volumetricDivisor'] : 0.0;
    $chargeable = round_up_to(max($actual, $volumetric), $step);
    return ['actual' => round($actual, 2), 'volumetric' => round($volumetric, 2), 'chargeable' => round($chargeable, 2)];
}

function zone_for_destination(array $pricing, string $destination): ?array
{
    $key = strtolower(trim($destination));
    foreach ($pricing['zones'] as $z) {
        foreach ($z['destinations'] as $d) {
            if (strtolower($d) === $key) {
                return $z;
            }
        }
    }
    return null;
}

/** Published rate from the slab table, or null if the courier has no rate for this weight. */
function published_rate(array $card, float $weight): ?array
{
    $slabs = [];
    foreach (($card['slabs'] ?? []) as $w => $price) {
        $slabs[(float) $w] = (float) $price;
    }
    if (!$slabs) {
        return null;
    }
    ksort($slabs);
    foreach ($slabs as $w => $price) {
        if ($weight <= $w + 1e-9) {
            return ['rate' => $price, 'slab' => $w, 'extraKg' => 0];
        }
    }
    $above = $card['perKgAbove'] ?? null;
    if ($above === null) {
        return null;
    }
    $lastW = array_key_last($slabs);
    $extraKg = (int) ceil(round($weight - $lastW, 6));
    return ['rate' => $slabs[$lastW] + $extraKg * (float) $above, 'slab' => $lastW, 'extraKg' => $extraKg];
}

/** Full breakdown for one courier (admin sees all of it; visitors only get price + transit). */
function courier_quote(array $pricing, array $courier, array $zone, float $chargeable): ?array
{
    $s = $pricing['settings'];
    $card = $pricing['rateCards'][$courier['id']][$zone['id']] ?? [];
    $pub = published_rate($card, $chargeable);
    if (!$pub) {
        return null;
    }
    $published = $pub['rate'];
    $discount = $published * $courier['discountPercent'] / 100;
    $afterDiscount = $published - $discount;
    $fuel = $afterDiscount * $courier['fuelPercent'] / 100;
    $cost = $afterDiscount + $fuel;
    $commission = $cost * $courier['commissionPercent'] / 100 + $courier['commissionFlat'];
    $beforeMin = $cost + $commission;
    $selling = round_up_to(max($beforeMin, (float) $s['minimumCharge']), (float) $s['roundTo']);
    $gst = $selling * $s['gstPercent'] / 100;
    $total = $selling + $gst;
    $profit = $selling - $cost;

    $r2 = function ($n) {
        return round($n, 2);
    };
    return [
        'courierId' => $courier['id'],
        'courier' => $courier['name'],
        'transit' => $courier['transit'][$zone['id']] ?? '',
        'slab' => $pub['slab'],
        'extraKg' => $pub['extraKg'],
        'published' => $r2($published),
        'discount' => $r2($discount),
        'fuel' => $r2($fuel),
        'cost' => $r2($cost),
        'commission' => $r2($commission),
        'minimumApplied' => $beforeMin < (float) $s['minimumCharge'],
        'selling' => $r2($selling),
        'gst' => $r2($gst),
        'total' => (float) round($total),
        'profit' => $r2($profit),
        'marginPercent' => $selling > 0 ? round($profit / $selling * 100, 1) : 0,
        'customerPrice' => $s['pricesIncludeGst'] ? (float) round($total) : $r2($selling),
    ];
}

/** Quotes for every active courier, cheapest first. */
function build_quote(array $pricing, string $destination, float $weight, float $l = 0, float $w = 0, float $h = 0): array
{
    $s = $pricing['settings'];
    if ($weight <= 0) {
        fail('Enter the parcel weight');
    }
    foreach (['length' => $l, 'width' => $w, 'height' => $h] as $k => $v) {
        if ($v < 0 || $v > 500) {
            fail("Box {$k} must be between 0 and 500 cm");
        }
    }
    $zone = zone_for_destination($pricing, $destination);
    if (!$zone) {
        fail('Please choose a destination from the list');
    }
    $weights = chargeable_weight($s, $weight, $l, $w, $h);
    if ($weights['chargeable'] > (float) $s['maxWeight']) {
        return ['zone' => $zone['name'], 'weights' => $weights, 'results' => [], 'tooHeavy' => true];
    }
    $results = [];
    foreach ($pricing['couriers'] as $c) {
        if (empty($c['active'])) {
            continue;
        }
        $q = courier_quote($pricing, $c, $zone, $weights['chargeable']);
        if ($q) {
            $results[] = $q;
        }
    }
    usort($results, function ($a, $b) {
        return $a['customerPrice'] <=> $b['customerPrice'];
    });
    return ['zone' => $zone['name'], 'weights' => $weights, 'results' => $results, 'tooHeavy' => false];
}
