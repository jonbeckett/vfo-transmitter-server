# Air Traffic Services Sectors Overlay — Implementation Plan

## Overview

Add an optional translucent overlay of ATS (Air Traffic Services) sector boundaries to the Leaflet radar map. The feature follows the existing pattern used by the weather radar overlay: a toolbar toggle button, a dedicated Leaflet layer group, and viewport-aware data loading with aggressive caching.

---

## 1. Data Sources

### 1.1 Primary — FAA Aeronautical Data Delivery Service (US airspace)

The FAA publishes current airspace boundaries as ArcGIS Feature Services with free GeoJSON output. No API key is required.

| Dataset               | Content                                | URL                                                                                                          |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Class_Airspace**    | Class B, C, D, E surface areas         | `https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/arcgis/rest/services/Class_Airspace/FeatureServer/0/query`    |
| **Airspace_Boundary** | ARTCC (Center) / FIR / ADIZ boundaries | `https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/arcgis/rest/services/Airspace_Boundary/FeatureServer/0/query` |

Query parameters for viewport-bounded requests:

```
?where=1=1
&geometry=<minLon>,<minLat>,<maxLon>,<maxLat>
&geometryType=esriGeometryEnvelope
&inSR=4326
&spatialRel=esriSpatialRelIntersects
&outFields=*
&f=geojson
&outSR=4326
```

These endpoints return GeoJSON `FeatureCollection` objects directly, compatible with `L.geoJSON()`.

### 1.2 Secondary — OpenAIP (worldwide airspace)

OpenAIP provides worldwide airspace data (CC BY-NC 4.0) via a REST API. Requires a free account and API key.

- Endpoint: `https://api.core.openaip.net/api/airspaces`
- Supports bounding-box queries: `?pos=<lat>,<lon>&dist=<nm>`
- Returns JSON with polygon geometry
- Rate-limited; caching is essential

### 1.3 Recommended Phased Approach

| Phase   | Source   | Coverage                          |
| ------- | -------- | --------------------------------- |
| Phase 1 | FAA ADDS | US (Class B/C/D/E + ARTCC)        |
| Phase 2 | OpenAIP  | Worldwide (requires free API key) |

Phase 1 is fully free, keyless, and sufficient for the majority of VFO users. Phase 2 adds global coverage later.

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────┐
│  radar.js — RadarDisplay                            │
│                                                     │
│  ┌──────────────┐   ┌───────────────────────────┐   │
│  │ Toolbar      │   │ AirspaceSectorManager     │   │
│  │ Toggle Btn   │──▶│                           │   │
│  └──────────────┘   │  • enabled flag           │   │
│                     │  • L.layerGroup           │   │
│  ┌──────────────┐   │  • cache (Map)            │   │
│  │ map moveend  │──▶│  • loadForBounds()        │   │
│  │ map zoomend  │   │  • clearLayers()          │   │
│  └──────────────┘   │  • toggle()               │   │
│                     └───────────┬───────────────┘   │
│                                 │                    │
│                     ┌───────────▼───────────────┐   │
│                     │ Server-side proxy/cache    │   │
│                     │ airspace_data.php          │   │
│                     │  • APCu cache (24h TTL)   │   │
│                     │  • Fetches from FAA ADDS  │   │
│                     └───────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 New Files

| File                       | Purpose                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `airspace_data.php`        | Server-side proxy that fetches from FAA ADDS, caches in APCu, and returns GeoJSON to the client |
| *(modified)* `js/radar.js` | New `AirspaceSectorManager` class or methods integrated into `RadarDisplay`                     |

### 2.3 No New Dependencies

The implementation uses only Leaflet's built-in `L.geoJSON()` layer — no additional libraries needed.

---

## 3. Caching Strategy

Airspace sectors change infrequently (AIRAC cycle is 28 days). Aggressive caching is appropriate.

### 3.1 Server-Side (APCu) — Primary Cache

The project already uses APCu extensively (`radar_data.php`, `apcu_manager.php`).

```
Cache key:    vfo_airspace_{dataset}_{bbox_hash}
TTL:          86400 seconds (24 hours)
Invalidation: Automatic expiry; no manual purge needed
```

- The bounding box is snapped to a coarse grid (e.g., 5° increments) so that nearby/overlapping viewport requests share cache entries.
- The PHP proxy fetches from FAA only on cache miss.

### 3.2 Client-Side (JavaScript) — Session Cache

```javascript
// In-memory Map keyed by grid-snapped bbox string
this.airspaceCache = new Map();
// e.g. key: "35,-100,40,-95" → value: GeoJSON FeatureCollection
```

- Prevents redundant fetch calls when panning back to a previously viewed area.
- Cleared only on page reload.

### 3.3 Browser Cache (HTTP headers)

The PHP proxy sets `Cache-Control: public, max-age=86400` so the browser's native HTTP cache also participates.

---

## 4. Viewport-Aware Loading

### 4.1 Bounding Box Snapping

To avoid making a unique request for every pixel of panning, snap the viewport bounds to a grid:

```javascript
function snapToGrid(bounds, gridSize = 5) {
    return {
        minLat: Math.floor(bounds.getSouth() / gridSize) * gridSize,
        minLon: Math.floor(bounds.getWest() / gridSize) * gridSize,
        maxLat: Math.ceil(bounds.getNorth() / gridSize) * gridSize,
        maxLon: Math.ceil(bounds.getEast() / gridSize) * gridSize
    };
}
```

This means the world is divided into 5°×5° tiles. A viewport spanning 38°N–42°N, 85°W–78°W becomes the tile `35,-85,45,-75`. Previously loaded tiles are skipped.

### 4.2 Debounced Loading

Attach to `moveend` / `zoomend` with a 500ms debounce so rapid panning doesn't fire many requests:

```javascript
this.map.on('moveend', () => {
    if (this.airspaceSectorsEnabled) {
        clearTimeout(this._airspaceDebounce);
        this._airspaceDebounce = setTimeout(() => this.loadAirspaceSectors(), 500);
    }
});
```

### 4.3 Zoom-Level Gating

Different airspace types are relevant at different zoom levels:

| Zoom Level | Show                        |
| ---------- | --------------------------- |
| 3–5        | ARTCC / FIR boundaries only |
| 6–8        | + Class B                   |
| 9–11       | + Class C, Class D          |
| 12+        | + Class E surface           |

This keeps the display uncluttered and reduces data transfer at low zoom.

---

## 5. Rendering

### 5.1 Styling

Each airspace class gets a distinct translucent fill and border:

| Class       | Fill Color | Fill Opacity | Border           |
| ----------- | ---------- | ------------ | ---------------- |
| ARTCC / FIR | `#888888`  | 0.08         | 1px dashed grey  |
| Class B     | `#0066cc`  | 0.12         | 2px solid blue   |
| Class C     | `#cc6600`  | 0.12         | 2px solid orange |
| Class D     | `#0099cc`  | 0.10         | 1px solid cyan   |
| Class E     | `#009900`  | 0.08         | 1px dashed green |

All colours will adapt to the active colour scheme where appropriate (e.g., use the scheme's `accentColor` for borders in monochrome modes).

### 5.2 Popup on Click

Clicking a sector polygon shows a Leaflet popup with:
- Sector name / designator
- Airspace class
- Altitude limits (lower / upper)

### 5.3 Layer Ordering

Create a dedicated Leaflet pane `airspacePane` at zIndex 300 (below trail pane at 350 and aircraft markers at 400+):

```javascript
this.map.createPane('airspacePane');
this.map.getPane('airspacePane').style.zIndex = 300;
```

---

## 6. UI Integration

### 6.1 Toolbar Button

Add a toggle button following the existing pattern (weather button, grid button, trails button):

```javascript
const airspaceBtn = document.createElement('button');
airspaceBtn.id = 'airspace-btn';
airspaceBtn.className = 'radar-tool-btn';
airspaceBtn.innerHTML = '<i class="fas fa-vector-square"></i>';
airspaceBtn.title = 'Toggle Airspace Sectors (A)';
airspaceBtn.addEventListener('click', () => this.toggleAirspaceSectors());
```

### 6.2 Keyboard Shortcut

Bind `A` key (consistent with existing single-letter shortcuts like `W` for weather, `T` for trails, `G` for grid).

### 6.3 Button State

Follow exact pattern of `updateWeatherButton()` — highlight with `accentColor` when enabled, default `backgroundColor` when disabled.

### 6.4 Airspace Settings Button (Phase 2)

When OpenAIP (Phase 2) is active, the airspace toolbar button gains a secondary behaviour: long-press / right-click opens the **Airspace Settings** dialog where the user can enter or change their OpenAIP API key and switch data source. If no key is configured and OpenAIP is selected, a single click opens the settings dialog automatically (same pattern as the Mapbox button when no token is set). See §11 for full dialog specification.

### 6.5 Airspace Type Filter (Optional Enhancement)

Add a small sub-panel (similar to the group filter panel) that lets users toggle individual airspace classes on/off. This is a nice-to-have for Phase 3.

---

## 7. Server-Side Proxy — `airspace_data.php`

### 7.1 Responsibilities

1. Accept `bbox` and `dataset` query parameters from the client
2. Validate / sanitise inputs (numeric bounds, whitelist of dataset names)
3. Check APCu cache
4. On miss: fetch from FAA ArcGIS endpoint via `file_get_contents` or `curl`
5. Store result in APCu with 24h TTL
6. Return GeoJSON with appropriate CORS and cache headers

### 7.2 Endpoint Specification

```
GET /airspace_data.php?dataset=class&minLat=35&minLon=-100&maxLat=45&maxLon=-90
```

Response: GeoJSON `FeatureCollection`

### 7.3 Input Validation

- `dataset`: must be one of `class`, `boundary`
- `minLat`, `maxLat`: float, -90 to 90
- `minLon`, `maxLon`: float, -180 to 180
- Reject bounding boxes larger than 30° in any dimension (prevent abuse)

### 7.4 Security

- No user-supplied strings are passed to external URLs unescaped
- The PHP proxy acts as a gateway, preventing direct client-to-FAA calls (avoids CORS issues and enables caching)
- Rate limiting: return HTTP 429 if more than 60 requests per minute from a single IP (simple APCu counter)

---

## 8. Implementation Steps

### Step 1 — Server-side proxy with caching
Create `airspace_data.php`:
- Accept and validate query parameters
- Build FAA ArcGIS query URL
- Check APCu cache, fetch on miss
- Return GeoJSON with cache headers
- Add basic rate limiting

### Step 2 — Client-side airspace manager
Add to `RadarDisplay` in `radar.js`:
- New properties: `airspaceSectorsEnabled`, `airspaceLayer`, `airspaceCache`, `_airspaceDebounce`
- Create `airspacePane` in `initMap()`
- Implement `toggleAirspaceSectors()`, `loadAirspaceSectors()`, `clearAirspaceSectors()`, `updateAirspaceButton()`
- Wire up `moveend` event in `handleMapMove()`

### Step 3 — Toolbar integration
- Add button to toolbar (in `initCustomToolbar()`)
- Add keyboard shortcut `A` (in `initKeyboardShortcuts()`)
- Add button colour updates to `updateInterfaceColors()`

### Step 4 — Styling and popups
- Define per-class style function for `L.geoJSON({ style })`
- Add `onEachFeature` click handler for sector info popup
- Implement zoom-level gating to show/hide classes

### Step 5 — Testing and refinement (Phase 1)
- Test with various zoom levels and viewport positions
- Verify cache hit rates in APCu
- Confirm no redundant API calls via browser network tab
- Test across all colour schemes

### Steps 6–10 — Phase 2 (OpenAIP worldwide coverage)
See §11.5 for the full Phase 2 step breakdown. These steps are deferred until Phase 1 is stable.

---

## 9. Difficulty Assessment

| Aspect                    | Difficulty     | Notes                                                  |
| ------------------------- | -------------- | ------------------------------------------------------ |
| Data availability         | **Low**        | FAA ADDS is free, public, no key, returns GeoJSON      |
| Server-side proxy         | **Low**        | Follows existing APCu patterns in the codebase         |
| Client-side rendering     | **Low**        | Leaflet `L.geoJSON()` handles polygons natively        |
| Viewport-aware loading    | **Medium**     | Grid-snapping + debounce + deduplication logic         |
| Caching                   | **Low**        | APCu on server, `Map` on client — both straightforward |
| UI integration            | **Low**        | Exact copies of existing toggle button patterns        |
| Zoom-level gating         | **Medium**     | Needs tuning to feel right at each zoom level          |
| Colour scheme integration | **Low**        | Formulaic — same pattern as all other overlays         |
| **Overall**               | **Low–Medium** | Est. ~300–400 lines of JS + ~100 lines of PHP          |

The heaviest part is the viewport-aware loading with grid-snapping and deduplication. Everything else is a near-copy of existing patterns already proven in the codebase (weather radar, grid overlay, trail layers).

---

## 10. Risks and Mitigations

| Risk                          | Impact               | Mitigation                                                                 |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------- |
| FAA endpoint changes URL      | Sectors stop loading | Log errors; degrade gracefully (hide button)                               |
| FAA endpoint is slow          | Delayed overlay      | Show loading spinner on first load; serve from cache thereafter            |
| Large GeoJSON payloads        | Slow rendering       | Zoom-level gating limits data; simplify geometry server-side if needed     |
| Too many polygons at low zoom | Cluttered display    | Only show ARTCC/FIR at low zoom; hide small sectors                        |
| APCu not available            | No server cache      | Already a hard dependency of the project; fallback to file cache if needed |
| CORS from direct FAA calls    | Blocked requests     | Server-side proxy eliminates this entirely                                 |

---

## 11. Phase 2 — OpenAIP API Key Configuration

Phase 2 extends coverage worldwide via OpenAIP. Because OpenAIP requires a free API key, the interface must allow users to enter and persist that key — exactly as it does for the Mapbox token.

### 11.1 Key Storage

The OpenAIP API key is stored in a browser cookie (same mechanism as `mapboxToken`):

```javascript
// Property initialised alongside the Mapbox token
this.openAipApiKey = '';

// Loaded on startup alongside other cookie-persisted settings
const savedOpenAipKey = this.getCookie('openAipApiKey');
if (savedOpenAipKey) {
    this.openAipApiKey = savedOpenAipKey;
}
```

Cookie name: `openAipApiKey`  
The key is never sent directly to the OpenAIP endpoint from the browser; it is forwarded to `airspace_data.php` as a query parameter and used server-side (see §11.3), preventing exposure via browser network logs to the raw upstream API.

### 11.2 UI — Airspace Settings Dialog

A new **Airspace Settings** dialog follows the exact structure of `openMapBoxDialog()`.  
It is opened:

- Via a long-press / right-click on the airspace toolbar button `A`, **or**
- Via a dedicated settings gear icon that appears inside the airspace button when no OpenAIP key is configured (similar to the Mapbox button behaviour when no token is set).

**Dialog structure (mirrors Mapbox dialog):**

```
┌──────────────────────────────────────────┐
│  Airspace Settings                    [×] │
│                                           │
│  Data Source                              │
│  ○ FAA ADDS (US only, no key required)   │
│  ● OpenAIP (worldwide, free API key)      │
│                                           │
│  OpenAIP API Key:                         │
│  ┌────────────────────────────────────┐   │
│  │  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  │   │
│  └────────────────────────────────────┘   │
│  Get a free key at openaip.net            │
│                                           │
│  [Save Key]  [Clear Key]                  │
│                                           │
│  [Apply]  [Close]                         │
└──────────────────────────────────────────┘
```

**Behaviour rules (mirrors Mapbox):**

| State | Airspace toggle button behaviour |
|---|---|
| FAA ADDS selected (or no key) | Toggles US airspace only; no prompt |
| OpenAIP selected, key missing | Click on button opens Settings dialog instead of toggling |
| OpenAIP selected, key present | Toggles worldwide airspace normally |

The selected source and key are both persisted in cookies so the preference survives page reloads.

### 11.3 Server-Side — `airspace_data.php` Phase 2 Extension

When the client selects OpenAIP, it passes `source=openaip` and the key as a query parameter:

```
GET /airspace_data.php?source=openaip&key=<api_key>&minLat=35&minLon=-100&maxLat=45&maxLon=-90
```

The PHP proxy:

1. Validates `source` is one of `faa`, `openaip`  
2. If `source=openaip`, validates `key` is non-empty and matches the expected format (alphanumeric, 24–64 chars)  
3. Forwards the key in the `x-openaip-api-key` header to the OpenAIP endpoint — never in the cached response body  
4. Uses a separate APCu key prefix `vfo_airspace_openaip_{bbox_hash}` to avoid collisions with FAA cache entries  
5. Returns GeoJSON normalised to the same schema as FAA data so the client rendering code is source-agnostic

**Security note:** The API key is sent from the browser to the PHP proxy via HTTPS; it is used server-side only and is never stored in APCu or logged. The proxy validates the key format before using it, defending against injection.

### 11.4 Client-Side — Source-Agnostic Rendering

`loadAirspaceSectors()` selects the endpoint based on the configured source:

```javascript
loadAirspaceSectors() {
    const source = this.airspaceSource; // 'faa' | 'openaip'
    if (source === 'openaip' && !this.openAipApiKey) {
        this.openAirspaceSettingsDialog();
        return;
    }
    const params = new URLSearchParams({
        source,
        ...(source === 'openaip' ? { key: this.openAipApiKey } : {}),
        minLat: snapped.minLat,
        minLon: snapped.minLon,
        maxLat: snapped.maxLat,
        maxLon: snapped.maxLon
    });
    fetch(`airspace_data.php?${params}`)
        .then(r => r.json())
        .then(geojson => this.renderAirspaceSectors(geojson));
}
```

The `renderAirspaceSectors()` method is identical for both sources because the PHP proxy normalises the GeoJSON schema.

### 11.5 Additional Implementation Steps for Phase 2

| Step | Task |
|---|---|
| 6 | Add `openAipApiKey` and `airspaceSource` properties; load from cookies in `initMapSettings()` |
| 7 | Implement `openAirspaceSettingsDialog()` mirroring `openMapBoxDialog()` structure |
| 8 | Add `source` / `openaip` branch to `airspace_data.php`; call OpenAIP REST endpoint; normalise GeoJSON |
| 9 | Update `loadAirspaceSectors()` to branch on source and guard for missing key |
| 10 | Style OpenAIP-sourced features using the same per-class style function (schema normalisation ensures compatibility) |

---

## 12. Future Enhancements (Phase 3+)

- **Airspace type filter sub-panel** to toggle individual classes
- **3D altitude filtering** — show only sectors relevant to a selected flight level
- **VATSIM/IVAO active sector highlighting** — highlight sectors where ATC is online
- **Sector label rendering** — draw sector names/identifiers at polygon centroids
