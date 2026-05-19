<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Cache-Control: public, max-age=86400');

define('APCU_PREFIX', 'vfo_');
define('AIRSPACE_TTL', 86400);   // 24 hours — AIRAC cycle is 28 days
define('RATE_LIMIT_WINDOW', 60); // seconds
define('RATE_LIMIT_MAX', 60);    // requests per window per IP

// --- APCu availability ---
if (!extension_loaded('apcu') || !apcu_enabled()) {
    http_response_code(500);
    echo json_encode(['error' => 'APCu not available']);
    exit;
}

// --- Rate limiting ---
$client_ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rate_key   = APCU_PREFIX . 'airspace_rate_' . md5($client_ip);
$req_count  = apcu_fetch($rate_key);
if ($req_count === false) {
    apcu_store($rate_key, 1, RATE_LIMIT_WINDOW);
} else {
    apcu_inc($rate_key);
    if ($req_count >= RATE_LIMIT_MAX) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded']);
        exit;
    }
}

// --- Input validation ---
$source  = $_GET['source']  ?? 'faa';
$dataset = $_GET['dataset'] ?? 'class';

$valid_sources  = ['faa', 'openaip'];
$valid_datasets = ['class', 'boundary'];

if (!in_array($source, $valid_sources, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid source']);
    exit;
}

if ($source === 'faa' && !in_array($dataset, $valid_datasets, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid dataset']);
    exit;
}

// Bounding box — all four values required
$keys = ['minLat', 'minLon', 'maxLat', 'maxLon'];
foreach ($keys as $k) {
    if (!isset($_GET[$k]) || !is_numeric($_GET[$k])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing or non-numeric parameter: {$k}"]);
        exit;
    }
}

$min_lat = (float)$_GET['minLat'];
$min_lon = (float)$_GET['minLon'];
$max_lat = (float)$_GET['maxLat'];
$max_lon = (float)$_GET['maxLon'];

if ($min_lat < -90 || $max_lat > 90 || $min_lon < -180 || $max_lon > 180) {
    http_response_code(400);
    echo json_encode(['error' => 'Bounding box out of range']);
    exit;
}

if (($max_lat - $min_lat) > 90 || ($max_lon - $min_lon) > 90) {
    http_response_code(400);
    echo json_encode(['error' => 'Bounding box too large (max 90 degrees per side)']);
    exit;
}

// --- Cache key ---
$bbox_hash = md5("{$min_lat},{$min_lon},{$max_lat},{$max_lon}");
$cache_key = ($source === 'faa')
    ? APCU_PREFIX . "airspace_faa_{$dataset}_{$bbox_hash}"
    : APCU_PREFIX . "airspace_openaip_{$bbox_hash}";

// --- Cache hit? ---
$cached = apcu_fetch($cache_key);
if ($cached !== false) {
    header('X-Cache: HIT');
    echo $cached;
    exit;
}

// --- Fetch from upstream ---
if ($source === 'faa') {
    $result = fetch_faa($dataset, $min_lat, $min_lon, $max_lat, $max_lon);
} else {
    // Validate OpenAIP key format before using it
    $api_key = $_GET['key'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9]{24,64}$/', $api_key)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing OpenAIP API key']);
        exit;
    }
    $result = fetch_openaip($api_key, $min_lat, $min_lon, $max_lat, $max_lon);
}

if ($result === null) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch airspace data from upstream']);
    exit;
}

apcu_store($cache_key, $result, AIRSPACE_TTL);
header('X-Cache: MISS');
echo $result;


// ---------------------------------------------------------------------------

function fetch_faa(string $dataset, float $min_lat, float $min_lon, float $max_lat, float $max_lon): ?string
{
    $endpoints = [
        'class'    => 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/arcgis/rest/services/Class_Airspace/FeatureServer/0/query',
        'boundary' => 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/arcgis/rest/services/Boundary_Airspace/FeatureServer/0/query',
    ];

    $params = http_build_query([
        'where'        => '1=1',
        'geometry'     => "{$min_lon},{$min_lat},{$max_lon},{$max_lat}",
        'geometryType' => 'esriGeometryEnvelope',
        'inSR'         => '4326',
        'spatialRel'   => 'esriSpatialRelIntersects',
        'outFields'    => '*',
        'f'            => 'geojson',
        'outSR'        => '4326',
    ]);

    return http_get($endpoints[$dataset] . '?' . $params);
}

function fetch_openaip(string $api_key, float $min_lat, float $min_lon, float $max_lat, float $max_lon): ?string
{
    $center_lat = ($min_lat + $max_lat) / 2;
    $center_lon = ($min_lon + $max_lon) / 2;
    // Approximate radius in NM — 1 degree ≈ 60 NM; add margin
    $dist_nm    = (int)(max($max_lat - $min_lat, $max_lon - $min_lon) * 60 / 2) + 10;

    $params = http_build_query([
        'pos'  => "{$center_lat},{$center_lon}",
        'dist' => $dist_nm,
    ]);

    $ctx = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => 10,
            // Key goes in a request header — never stored in cache or logged
            'header'  => "x-openaip-api-key: {$api_key}\r\nAccept: application/json\r\n",
        ],
    ]);

    $raw = @file_get_contents('https://api.core.openaip.net/api/airspaces?' . $params, false, $ctx);
    if ($raw === false) {
        return null;
    }

    $data = json_decode($raw, true);
    if (!$data || !isset($data['items'])) {
        return null;
    }

    // Normalise to the same GeoJSON FeatureCollection schema as FAA data
    $features = [];
    foreach ($data['items'] as $item) {
        if (empty($item['geometry'])) continue;
        $features[] = [
            'type'       => 'Feature',
            'geometry'   => $item['geometry'],
            'properties' => [
                'NAME'      => $item['name']                   ?? '',
                'CLASS'     => $item['icaoClass']              ?? ($item['type'] ?? ''),
                'TYPE_CODE' => $item['type']                   ?? '',
                'UPPER_VAL' => $item['upperLimit']['value']    ?? null,
                'UPPER_UOM' => $item['upperLimit']['unit']     ?? '',
                'LOWER_VAL' => $item['lowerLimit']['value']    ?? null,
                'LOWER_UOM' => $item['lowerLimit']['unit']     ?? '',
                '_source'   => 'openaip',
            ],
        ];
    }

    return json_encode([
        'type'     => 'FeatureCollection',
        'features' => $features,
    ]);
}

function http_get(string $url): ?string
{
    $ctx = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => 10,
            'header'  => "Accept: application/json\r\n",
        ],
    ]);

    $result = @file_get_contents($url, false, $ctx);
    return ($result !== false) ? $result : null;
}
