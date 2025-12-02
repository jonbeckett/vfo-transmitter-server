# Virtual Flight Online Transmitter - Server

A real-time aircraft tracking server for Microsoft Flight Simulator that receives position data from transmitter clients and displays live flight data on an interactive web-based radar display with professional aviation controls.

## 🎯 Overview

The Virtual Flight Online Transmitter Server is the backend component of the VFO Transmitter system. It receives aircraft position data from the [VFO Transmitter Client](https://github.com/jonbeckett/virtualflightonlinetransmitter) running on pilots' computers and provides:

- **Real-time position tracking** - Receives and stores aircraft telemetry via HTTP POST
- **Interactive radar display** - Professional aviation-style radar with multiple map layers
- **Status dashboard** - Sortable table view with comprehensive flight data
- **Embeddable widgets** - Minimal radar display for embedding in websites
- **IVAO-compatible feed** - Standard format for integration with other systems
- **Zero database required** - Uses PHP APCu for fast in-memory caching

### How It Works

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│  MSFS 2020/2024 │ ──────────────────▶│  Transmitter    │
│  Flight Data    │                    │  Server         │
└─────────────────┘                    │                 │
         │                             │  ┌───────────┐  │
         ▼                             │  │  APCu     │  │
┌─────────────────┐                    │  │  Cache    │  │
│  VFO Transmitter│                    │  └───────────┘  │
│  Client (Windows)│                   │                 │
└─────────────────┘                    │  ┌───────────┐  │
                                       │  │  Radar    │◀─┼─── Web Browsers
                                       │  │  Display  │  │
                                       │  └───────────┘  │
                                       └─────────────────┘
```

1. **Transmitter Client** reads flight data from Microsoft Flight Simulator via SimConnect
2. **Client transmits** position data to the server every few seconds via HTTP POST
3. **Server stores** aircraft positions in APCu memory cache (30-minute TTL)
4. **Web interfaces** query the server and display aircraft on interactive maps

## 📁 Project Structure

```
vfo-transmitter-server/
├── index.html             # Landing page with links to features
├── transmit.php           # Data submission endpoint (receives POST from clients)
├── radar.php              # Main interactive radar display
├── embed.php              # Minimal radar for embedding in iframes
├── status.php             # Aircraft status table dashboard
├── radar_data.php         # JSON API for radar data
├── status_json.php        # JSON API for status data
├── ivao.php               # IVAO Whazzup-compatible text feed
├── apcu_manager.php       # Cache administration interface
├── test_aircraft.php      # Test aircraft data generator
├── debug_aircraft.php     # Aircraft debugging tool
├── system_test.php        # System diagnostics and health check
├── common.php             # Shared utility functions and page templates
├── js/
│   ├── radar.js           # Advanced radar functionality (5000+ lines)
│   ├── status.js          # Status page functionality
│   └── status_improved.js # Enhanced status page with sorting/filtering
├── css/
│   ├── index.css          # Landing page styles
│   ├── radar.css          # Radar display styling
│   ├── embed.css          # Embed-specific styling
│   ├── status.css         # Status dashboard styling
│   └── style.css          # Shared styles
└── img/
    └── vfo_logo_300x300.jpg # Site favicon and logo
```

## 🚀 Quick Start

### Server Requirements

- **PHP 7.4+** with APCu extension enabled
- **Web server** (Apache with mod_php, Nginx with PHP-FPM, or similar)
- **No database required** - All data stored in memory via APCu

### Installation

1. **Clone or download** the repository to your web server:
   ```bash
   git clone https://github.com/jonbeckett/vfo-transmitter-server.git
   cd vfo-transmitter-server
   ```

2. **Install and enable APCu extension**:
   ```bash
   # Ubuntu/Debian
   sudo apt install php-apcu
   sudo systemctl restart apache2
   
   # CentOS/RHEL
   sudo yum install php-pecl-apcu
   sudo systemctl restart httpd
   
   # Windows (XAMPP/WAMP)
   # Download php_apcu.dll and add to php.ini
   ```

3. **Configure php.ini** for APCu:
   ```ini
   extension=apcu
   apc.enabled=1
   apc.shm_size=128M      ; Adjust based on expected number of aircraft
   apc.enable_cli=1       ; Enable for CLI testing
   ```

4. **Configure web server** to serve PHP files from the project directory

5. **(Optional) Set server PIN** in `transmit.php` for authentication:
   ```php
   $server_pin = "your_secure_pin"; // Leave empty to disable
   ```

6. **Verify installation** by visiting:
   - `https://yourserver.com/system_test.php` - System diagnostics
   - `https://yourserver.com/apcu_manager.php` - Cache status

### Testing the Installation

1. Visit `test_aircraft.php` to generate test aircraft
2. Open `radar.php` to view the radar display
3. Verify aircraft appear on the map

## 📡 Transmit API

### Endpoint

```
POST /transmit.php
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `Callsign` | string | Aircraft callsign (e.g., "N123AB", "BAW123") |
| `PilotName` | string | Pilot's display name |
| `GroupName` | string | Organization/group name (e.g., "VirtualFlight.Online") |
| `AircraftType` | string | Aircraft type (e.g., "Boeing 737-800") |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Pin` | string | "" | Server authentication PIN (if configured) |
| `Latitude` | float | 0 | Aircraft latitude in decimal degrees |
| `Longitude` | float | 0 | Aircraft longitude in decimal degrees |
| `Altitude` | float | 0 | Altitude in feet |
| `Heading` | float | 0 | Magnetic heading in degrees (0-359) |
| `Airspeed` | float | 0 | Indicated airspeed in knots |
| `Groundspeed` | float | 0 | Ground speed in knots (defaults to airspeed if not provided) |
| `TransponderCode` | string | "" | Transponder squawk code |
| `TouchdownVelocity` | float | 0 | Last landing rate in ft/sec |
| `MSFSServer` | string | "" | MSFS multiplayer server name |
| `Notes` | string | "" | Flight notes or remarks |
| `Version` | string | "1.0.0.n" | Transmitter client version |

### Example Request

```bash
curl -X POST https://transmitter.virtualflight.online/transmit.php \
  -d "Callsign=N123AB" \
  -d "PilotName=John Pilot" \
  -d "GroupName=VirtualFlight.Online" \
  -d "AircraftType=Boeing 737-800" \
  -d "Latitude=40.7128" \
  -d "Longitude=-74.0060" \
  -d "Altitude=35000" \
  -d "Heading=90" \
  -d "Airspeed=450" \
  -d "Groundspeed=485" \
  -d "TransponderCode=1200" \
  -d "Notes=Test flight"
```

### Response Codes

| Response | Meaning |
|----------|---------|
| `updated` | Position successfully stored |
| `rate limited` | Too many requests (max 1/second per callsign) |
| `invalid pin` | Server PIN required but not provided/incorrect |
| `Insufficient data received` | Missing required fields |
| `error storing data` | APCu storage failure |

### Rate Limiting

The server implements rate limiting of **1 update per second per callsign** to prevent abuse. This is enforced per IP address.

## 🌐 Data APIs

### radar_data.php

Returns all active aircraft positions as JSON.

```bash
GET /radar_data.php
```

**Response:**
```json
[
  {
    "callsign": "N123AB",
    "pilot_name": "John Pilot",
    "group_name": "VirtualFlight.Online",
    "msfs_server": "West Europe",
    "transponder_code": "1200",
    "aircraft_type": "Boeing 737-800",
    "version": "2.0.0.0",
    "notes": "Test flight",
    "longitude": -74.006,
    "latitude": 40.7128,
    "altitude": 35000,
    "heading": 90,
    "airspeed": 450,
    "groundspeed": 485,
    "touchdown_velocity": 120,
    "time_online": "01:23:45",
    "seconds_since_last_update": 3,
    "modified": "2025-12-02 14:30:00"
  }
]
```

**Notes:**
- Only aircraft updated within the last **60 seconds** are included
- Results sorted by most recently updated
- CORS enabled for cross-origin requests

### status_json.php

Identical to `radar_data.php` - provides JSON aircraft data for the status dashboard.

### ivao.php

Returns aircraft data in **IVAO Whazzup format** for compatibility with third-party tools.

```bash
GET /ivao.php
```

**Response:**
```
!GENERAL
VERSION = 1
RELOAD = 1
UPDATE = 20251202143000
CONNECTED CLIENTS = 5
CONNECTED SERVERS = 0
!CLIENTS
N123AB:N123AB:John Pilot:PILOT::40.7128:-74.0060:35000:485:Boeing 737-800:::::West Europe:B:6:1200:0:50:0:I:::::::::VFR:::::::20251202143000:VirtualFlight.Online:1 :1:1::S:0:90:0:40:
```

## 🎮 Radar Display Features

### Main Interface (`radar.php`)

The radar display provides a professional aviation-style interface built with Leaflet.js.

#### Toolbar Controls

The toolbar is organized into collapsible groups:

| Group | Parent Icon | Child Tools |
|-------|-------------|-------------|
| **Navigation** | 🧭 Compass | Home (reset view), Center on aircraft, Fullscreen |
| **Data & Filters** | 💾 Database | Aircraft list, Group filter |
| **Display** | 👁️ Eye | Coordinate grid, Aircraft trails, Weather radar |
| **Tools** | 🔧 Wrench | Smooth movement, Clear measurements |
| **Layers** | 🗺️ Map | Cycle map layers, MapBox settings, Color scheme |

#### Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `+` or `=` | Zoom In |
| `-` | Zoom Out |
| `H` | Home (reset to world view) |
| `C` | Center on all visible aircraft |
| `A` | Toggle Aircraft List panel |
| `F` | Toggle Group Filter panel |
| `G` | Toggle Coordinate Grid |
| `S` | Toggle Smooth Movement interpolation |
| `T` | Toggle Aircraft Trails |
| `W` | Toggle Weather Radar overlay |
| `L` | Cycle Map Layers |
| `P` | Color Scheme selector |
| `M` | MapBox settings dialog |
| `X` | Clear all measurements & range rings |
| `Shift+F` | Toggle Fullscreen mode |

#### URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `callsign` | `?callsign=N123AB` | Track and auto-follow a specific aircraft |
| `group` | `?group=VirtualFlight.Online` | Pre-filter to show only aircraft from a group |

**Examples:**
- `radar.php?callsign=AAL123` - Track airline flight AAL123
- `radar.php?group=MyGroup` - Show only aircraft from "MyGroup"
- `radar.php?callsign=N123AB&group=MyGroup` - Both filters combined

### Group Filtering

Filter aircraft by their group/organization:

- Click the **Filter** icon (funnel) to open the group filter panel
- Check/uncheck groups to show/hide their aircraft
- Use **All** to show all groups, **None** to hide all
- Filter selections are **saved to localStorage** and persist across sessions
- The filter icon shows **orange** when a subset of groups is selected
- The filter icon shows **red** when all aircraft are hidden
- URL parameter `?group=` takes precedence over saved selections

### Aircraft Tracking

Follow specific aircraft automatically:

- **Via URL**: `radar.php?callsign=AIRCRAFT_CALLSIGN`
- **Via Aircraft List**: Click the crosshairs icon (🎯) next to any aircraft
- **Visual Highlighting**: Tracked aircraft glow with pulsing animation
- **Auto-centering**: Map continuously follows the tracked aircraft
- **Status Banner**: Shows tracking status at top of screen
- **Exit Tracking**: Click the X button in the banner

### Measurement Tools

| Tool | Activation | Function |
|------|------------|----------|
| **Distance/Bearing** | Right-click + Drag | Measures distance (NM) and bearing (degrees) |
| **Range Ring** | Shift + Right-click + Drag | Creates circular range indicator |

- Measurements update in real-time as you drag
- Release mouse to create persistent measurement
- Press `X` or use toolbar to clear all measurements

### Map Layers

Cycle through different map views with `L` key or layers button:

1. **OpenStreetMap** - Standard street and terrain view
2. **Satellite** - High-resolution satellite imagery  
3. **Dark Mode** - Professional dark theme for night operations
4. **Aviation Chart** - Aeronautical navigation charts (OpenAIP)
5. **Topographic** - Detailed topographic terrain view
6. **No Map** - Aircraft-only view with transparent background
7. **MapBox Custom** - Your own MapBox style (requires API token)

### Color Schemes

Press `P` or use the palette button to switch between:

- **Green** (default) - Classic radar green
- **White** - High contrast white
- **Black** - Black on white background
- **Blue** - Professional blue
- **Red** - Red theme
- **Amber** - Warm amber tones
- **Cyan** - Cool cyan/blue

### Weather Radar

Toggle weather radar overlay with `W` key:
- Shows precipitation radar from RainViewer API
- Updates automatically
- Overlay opacity optimized for visibility with aircraft markers

### Aircraft Trails

Toggle aircraft trails with `T` key:
- Shows historical path of each aircraft (last 10 positions)
- Trail color matches current color scheme
- Trails persist until aircraft data expires

### Smooth Movement

Toggle with `S` key for physics-based aircraft animation:
- Aircraft positions interpolate between updates
- Movement based on heading and groundspeed
- Labels and connecting lines follow smoothly
- 100ms update interval for fluid animation

## 📱 Status Dashboard (`status.php`)

The status dashboard provides a comprehensive table view of all online aircraft:

- **Sortable columns** - Click column headers to sort
- **Live map** - Integrated mini-map showing aircraft positions
- **Real-time updates** - Auto-refreshes every 30 seconds
- **Flight data** - Shows callsign, pilot, aircraft type, group, server, altitude, heading, airspeed, groundspeed, landing rate, time online, and client version
- **Statistics** - Aircraft count, moving aircraft count, server count

## 📺 Embed Mode (`embed.php`)

A minimal radar display designed for embedding in iframes:

- **Minimal UI** - No info panel or toolbar
- **Basic controls** - Zoom in/out buttons and "open full radar" button
- **URL parameters** - Supports same `callsign` and `group` parameters

**Embed Example:**
```html
<iframe 
  src="https://transmitter.virtualflight.online/embed.php?group=MyGroup" 
  width="800" 
  height="600" 
  frameborder="0">
</iframe>
```

## 🛠️ Administration Tools

### APCu Cache Manager (`apcu_manager.php`)

Web-based interface for cache administration:

- **Cache Statistics** - Hit rate, entries, uptime
- **Memory Usage** - Total, used, available memory
- **Cache Operations** - Clear aircraft data, VFO cache, or all cache
- **Entry Listing** - View all cached keys with metadata

### System Test (`system_test.php`)

Diagnostic tool to verify installation:

- APCu extension availability
- Read/write/delete test
- Aircraft data count
- Endpoint accessibility check
- Quick links to all tools

### Test Aircraft Generator (`test_aircraft.php`)

Generate test aircraft for development and testing:

- Configure number of aircraft (1-50)
- Set center coordinates and spread radius
- Define altitude range
- Realistic aircraft types and callsigns
- Auto-opens radar after generation

### Debug Aircraft (`debug_aircraft.php`)

Debug tool for troubleshooting aircraft data issues.

## 🔧 Configuration

### Server Settings (`transmit.php`)

```php
// Authentication
$server_pin = "";           // Set to require PIN for transmissions

// Data retention
define('POSITION_TTL', 1800);  // 30 minutes TTL for position data

// Rate limiting
// Built-in: 1 update per second per callsign
```

### Radar Settings (`radar.js`)

```javascript
// Refresh rate
this.updateInterval = 5000;        // 5 seconds between data fetches

// Smooth movement
this.interpolationInterval = 100;  // 100ms position updates

// Trails
this.maxTrailLength = 10;          // Keep last 10 positions

// Labels
this.defaultPixelOffset = [60, 80]; // Label offset from aircraft
```

### Aircraft Timeout (`radar_data.php`)

```php
// Only include aircraft updated in the last 60 seconds
if ($seconds_since_last_update <= 60) {
    // Include in response
}
```

## 🔍 Troubleshooting

### APCu Not Available

**Symptoms:** 500 error, "APCu extension not available"

**Solutions:**
1. Install APCu extension for your PHP version
2. Verify enabled in `php.ini`: `extension=apcu`
3. Set `apc.enabled=1` in `php.ini`
4. Restart web server
5. Check `phpinfo()` for APCu section

### No Aircraft Showing

**Symptoms:** Radar loads but no aircraft appear

**Solutions:**
1. Visit `apcu_manager.php` - verify aircraft entries exist
2. Check aircraft are sending data within 60-second timeout
3. Use `test_aircraft.php` to generate test data
4. Check browser console for JavaScript errors
5. Verify `radar_data.php` returns JSON data

### Group Filter Not Working

**Symptoms:** Filter selections don't persist or apply

**Solutions:**
1. Clear localStorage: `localStorage.removeItem('groupFilterSelections')`
2. Check browser console for errors
3. Verify group names match exactly (case-sensitive)

### Map Layers Not Loading

**Symptoms:** Grey/empty map background

**Solutions:**
1. Check network connectivity
2. Some tile providers may be blocked by firewalls
3. MapBox requires valid API token
4. Try different map layer with `L` key

### High Memory Usage

**Symptoms:** APCu running out of memory

**Solutions:**
1. Increase `apc.shm_size` in `php.ini` (e.g., 256M)
2. Reduce `POSITION_TTL` to expire data faster
3. Restart web server to clear cache

## 🌐 Deployment

### Production Checklist

- [ ] Enable HTTPS for secure transmissions
- [ ] Set `$server_pin` if authentication required
- [ ] Configure appropriate `apc.shm_size` for expected traffic
- [ ] Set up monitoring for APCu memory usage
- [ ] Consider CDN for static assets
- [ ] Enable gzip compression for JSON responses

### Recommended Server Specs

| Traffic Level | RAM | APCu Size | Notes |
|---------------|-----|-----------|-------|
| < 50 aircraft | 512MB | 64MB | Shared hosting OK |
| 50-200 aircraft | 1GB | 128MB | VPS recommended |
| 200+ aircraft | 2GB+ | 256MB+ | Dedicated server |

## 📜 Related Projects

- **[VFO Transmitter Client](https://github.com/jonbeckett/virtualflightonlinetransmitter)** - Windows application that reads MSFS data and transmits to this server
- **[Virtual Flight Online](https://virtualflight.online)** - Community homepage

## 📄 License

Open source project for educational and simulation use.

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests to the GitHub repository.

## 📞 Support

- **Discord**: [VirtualFlight.Online Discord](https://bit.ly/virtualflightonlinediscord)
- **Facebook**: [VirtualFlight.Online Group](https://facebook.com/groups/virtualflightonline)
- **Newsletter**: [Substack](https://virtualflightonline.substack.com)

---

**Virtual Flight Online Transmitter Server** - Bringing pilots together in virtual airspace.

Built with ❤️ for the flight simulation community by [Jonathan Beckett](https://jonbeckett.online)
