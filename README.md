# Virtual Flight Online Transmitter - Server

A real-time aircraft tracking server for Microsoft Flight Simulator. Receives position data from transmitter clients and serves it via an interactive web-based radar display.

## Features

- **Real-time position tracking** via HTTP POST from client applications
- **Interactive radar display** with multiple map layers, colour schemes, measurement tools, and weather overlay
- **Status dashboard** — sortable table with comprehensive flight data and mini-map
- **Embeddable radar widget** for use in iframes
- **IVAO-compatible Whazzup feed** for third-party tool integration
- **No database required** — all data held in APCu shared memory (30-minute TTL)

## How It Works

```
VFO Transmitter Client (Windows, reads MSFS via SimConnect)
        │  HTTP POST /transmit.php
        ▼
transmit.php   ← validates input, stores in APCu cache
        │
     APCu cache
        ├── radar_data.php   → JSON polled by radar.js
        ├── status_json.php  → JSON polled by status_improved.js
        └── ivao.php         → Whazzup-format text feed

radar.php      ← full-featured interactive radar (Leaflet.js)
status.php     ← tabular dashboard
embed.php      ← minimal iframe-embeddable radar
```

## Requirements

- PHP 7.4+ with the **APCu extension** enabled
- Any standard web server (Apache, Nginx, etc.)

## Installation

1. Clone the repository to your web server document root:
   ```bash
   git clone https://github.com/jonbeckett/vfo-transmitter-server.git
   ```

2. Enable APCu in `php.ini`:
   ```ini
   extension=apcu
   apc.enabled=1
   apc.shm_size=128M
   ```

3. Restart your web server.

4. *(Optional)* Set a server PIN in `transmit.php` to restrict who can submit data:
   ```php
   $server_pin = "your_secure_pin";
   ```

5. Verify the installation at `/system_test.php`.

## Transmit API

```
POST /transmit.php
```

Required fields: `Callsign`, `PilotName`, `GroupName`, `AircraftType`. See the [API Endpoints wiki page](https://github.com/jonbeckett/vfo-transmitter-server/wiki/api-endpoints) for the full parameter reference and response codes.

## Documentation

Full documentation is in the [project wiki](https://github.com/jonbeckett/vfo-transmitter-server/wiki), including:

- [Architecture](https://github.com/jonbeckett/vfo-transmitter-server/wiki/architecture) — system design and file map
- [Data Flow](https://github.com/jonbeckett/vfo-transmitter-server/wiki/data-flow) — POST → APCu → browser pipeline
- [API Endpoints](https://github.com/jonbeckett/vfo-transmitter-server/wiki/api-endpoints) — all HTTP endpoints
- [Radar Display](https://github.com/jonbeckett/vfo-transmitter-server/wiki/radar-display) — `RadarDisplay` class internals
- [Security](https://github.com/jonbeckett/vfo-transmitter-server/wiki/security) — auth, rate limiting, known gaps

## Related Projects

- **[VFO Transmitter Client](https://github.com/jonbeckett/virtualflightonlinetransmitter)** — Windows app that reads MSFS data and posts to this server
- **[Virtual Flight Online](https://virtualflight.online)** — Community homepage

## Support

- **Discord**: [VirtualFlight.Online Discord](https://bit.ly/virtualflightonlinediscord)
- **Facebook**: [VirtualFlight.Online Group](https://facebook.com/groups/virtualflightonline)
- **Newsletter**: [Substack](https://virtualflightonline.substack.com)

## License

Open source — for educational and simulation use.

---

Built with ❤️ for the flight simulation community by [Jonathan Beckett](https://jonbeckett.online)
