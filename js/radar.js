class RadarDisplay {
    constructor() {
        this.map = null;
        this.aircraftMarkers = new Map();
        this.headingLines = new Map();
        this.labelLayers = new Map(); // New: for aircraft labels
        this.labelLines = new Map(); // New: for label connecting lines
        this.labelPixelPositions = new Map(); // Store pixel offsets instead of geo offsets
        this.updateInterval = 5000; // 5 seconds
        this.radarDataUrl = 'radar_data.php';
        this.defaultPixelOffset = [60, 80]; // Fixed pixel offset for new labels
        this.isInitialLoad = true; // Track if this is the first load for auto-positioning
        
        // Aircraft list management
        this.aircraftListVisible = false;
        this.aircraftListTable = null;
        this.hiddenAircraft = new Set(); // Track which aircraft are hidden from radar
        
        // Position history trail
        this.aircraftTrails = new Map(); // Store position history for each aircraft
        this.trailLayers = new Map(); // Store trail circle markers
        this.maxTrailLength = 10; // Keep last 10 positions
        this.trailLayer = null; // Separate layer for trails to keep them below everything
        this.trailsEnabled = false; // Trails off by default
        
        // Grid management
        this.gridVisible = false;
        this.gridLayer = null;
        
        // Smooth movement system
        this.aircraftPositions = new Map(); // Store aircraft movement data
        this.smoothMovementEnabled = false; // Start disabled
        this.interpolationInterval = 100; // Update positions every 100ms
        this.interpolationTimer = null;
        this.lastDataUpdateTime = null;
        this.lastKnownAircraftPositions = new Map(); // Track positions to avoid unnecessary updates
        this.lastLabelContentUpdate = new Map(); // Track when label content was last updated
        
        // Measurement tool
        this.measurementActive = false;
        this.measurementStartPoint = null;
        this.measurementLine = null;
        this.measurementLabel = null;
        
        // Persistent measurements system
        this.persistentMeasurements = [];
        
        // Range ring tool
        this.rangeRingActive = false;
        this.rangeRingCenter = null;
        this.rangeRingCircle = null;
        this.rangeRingCenterMarker = null;
        this.rangeRingLabel = null;
        
        // Persistent range rings system
        this.persistentRangeRings = [];
        
        // Aircraft tracking
        this.trackedCallsign = null; // Callsign to track from URL parameter
        this.isTrackingEnabled = false; // Whether tracking is currently active
        
        // Group filtering
        this.filterGroup = null; // Group name to filter from URL parameter
        this.selectedGroups = new Set(['__ALL__']); // Interactive group filter - __ALL__ means show all groups
        this.groupFilterVisible = false; // Track if group filter panel is visible
        this.groupFilterPanel = null; // Reference to the filter panel
        
        // Toolbar section collapse state
        this.collapsedToolbarSections = new Set(); // Track which toolbar sections are collapsed
        
        // Weather radar
        this.weatherRadarEnabled = false;
        this.weatherRadarLayer = null;
        this.weatherRadarUpdateTimer = null;
        
        // MapBox integration
        this.mapboxToken = '';
        this.mapboxStyleId = 'streets-v12';
        this.mapboxDialogOpen = false;
        
        // Color scheme configuration
        this.currentColorScheme = 'green'; // default
        this.colorSchemes = {
            'green': {
                name: 'Radar Green',
                foreground: '#00ff00',
                background: 'rgba(0, 20, 40, 0.95)',
                highlight: '#00ffff',
                // Derived colors
                aircraftColor: '#00ff00',
                labelBackground: 'rgba(0, 20, 40, 0.95)',
                labelTextColor: '#00ff00',
                labelBorderColor: '#00ff00',
                labelLineColor: '#00ff00',
                primaryColor: '#00ff00',
                secondaryColor: '#88ff88',
                accentColor: '#00ffff',
                backgroundColor: 'rgba(0, 20, 40, 0.95)',
                secondaryBackground: 'rgba(0, 40, 80, 0.8)',
                borderColor: '#00ff00',
                hoverColor: 'rgba(0, 60, 120, 0.9)',
                textColor: '#00ff00',
                shadowColor: 'rgba(0, 255, 0, 0.3)',
                gridColor: '#00ff00',
                gridMajorColor: '#00ff00',
                gridMinorColor: 'rgba(0, 255, 0, 0.3)',
                popupBackground: 'rgba(0, 20, 40, 0.95)',
                popupTextColor: '#00ff00',
                popupBorderColor: '#00ff00',
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)'
            },
            'white': {
                name: 'White',
                foreground: '#ffffff',
                background: 'rgba(0, 0, 0, 0.9)',
                highlight: '#ffff00',
                // Derived colors
                aircraftColor: '#ffffff',
                labelBackground: 'rgba(0, 0, 0, 0.9)',
                labelTextColor: '#ffffff',
                labelBorderColor: '#ffffff',
                labelLineColor: '#ffffff',
                primaryColor: '#ffffff',
                secondaryColor: '#dddddd',
                accentColor: '#ffff00',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                secondaryBackground: 'rgba(40, 40, 40, 0.8)',
                borderColor: '#ffffff',
                hoverColor: 'rgba(80, 80, 80, 0.9)',
                textColor: '#ffffff',
                shadowColor: 'rgba(255, 255, 255, 0.3)',
                gridColor: '#ffffff',
                gridMajorColor: '#ffffff',
                gridMinorColor: 'rgba(255, 255, 255, 0.3)',
                popupBackground: 'rgba(0, 0, 0, 0.9)',
                popupTextColor: '#ffffff',
                popupBorderColor: '#ffffff',
                trackingHighlightColor: '#ffff00',
                trackingHighlightBackground: 'rgb(255, 255, 0)'
            },
            'black': {
                name: 'Black',
                foreground: '#000000',
                background: 'rgba(255, 255, 255, 0.95)',
                highlight: '#ff0000',
                // Derived colors
                aircraftColor: '#000000',
                labelBackground: 'rgba(255, 255, 255, 0.95)',
                labelTextColor: '#000000',
                labelBorderColor: '#000000',
                labelLineColor: '#000000',
                primaryColor: '#000000',
                secondaryColor: '#333333',
                accentColor: '#ff0000',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                secondaryBackground: 'rgba(240, 240, 240, 0.9)',
                borderColor: '#000000',
                hoverColor: 'rgba(200, 200, 200, 0.9)',
                textColor: '#000000',
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                gridColor: '#000000',
                gridMajorColor: '#000000',
                gridMinorColor: 'rgba(0, 0, 0, 0.3)',
                popupBackground: 'rgba(255, 255, 255, 0.95)',
                popupTextColor: '#000000',
                popupBorderColor: '#000000',
                trackingHighlightColor: '#ff0000',
                trackingHighlightBackground: 'rgb(255, 0, 0)'
            },
            'blue': {
                name: 'Blue',
                foreground: '#2563eb',
                background: 'rgba(255, 255, 255, 0.95)',
                highlight: '#60a5fa',
                // Derived colors
                aircraftColor: '#2563eb',
                labelBackground: 'rgba(255, 255, 255, 0.95)',
                labelTextColor: '#1e40af',
                labelBorderColor: '#2563eb',
                labelLineColor: '#2563eb',
                primaryColor: '#2563eb',
                secondaryColor: '#3b82f6',
                accentColor: '#60a5fa',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                secondaryBackground: 'rgba(248, 250, 252, 0.9)',
                borderColor: '#2563eb',
                hoverColor: 'rgba(59, 130, 246, 0.9)',
                textColor: '#1e40af',
                shadowColor: 'rgba(37, 99, 235, 0.3)',
                gridColor: '#2563eb',
                gridMajorColor: '#2563eb',
                gridMinorColor: 'rgba(37, 99, 235, 0.3)',
                popupBackground: 'rgba(255, 255, 255, 0.95)',
                popupTextColor: '#1e40af',
                popupBorderColor: '#2563eb',
                trackingHighlightColor: '#60a5fa',
                trackingHighlightBackground: 'rgb(96, 165, 250)'
            },
            'red': {
                name: 'Red',
                foreground: '#dc2626',
                background: 'rgba(0, 0, 0, 0.9)',
                highlight: '#fca5a5',
                // Derived colors
                aircraftColor: '#dc2626',
                labelBackground: 'rgba(0, 0, 0, 0.9)',
                labelTextColor: '#dc2626',
                labelBorderColor: '#dc2626',
                labelLineColor: '#dc2626',
                primaryColor: '#dc2626',
                secondaryColor: '#ef4444',
                accentColor: '#fca5a5',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                secondaryBackground: 'rgba(40, 0, 0, 0.8)',
                borderColor: '#dc2626',
                hoverColor: 'rgba(80, 0, 0, 0.9)',
                textColor: '#dc2626',
                shadowColor: 'rgba(220, 38, 38, 0.3)',
                gridColor: '#dc2626',
                gridMajorColor: '#dc2626',
                gridMinorColor: 'rgba(220, 38, 38, 0.3)',
                popupBackground: 'rgba(0, 0, 0, 0.9)',
                popupTextColor: '#dc2626',
                popupBorderColor: '#dc2626',
                trackingHighlightColor: '#fca5a5',
                trackingHighlightBackground: 'rgb(252, 165, 165)'
            }
        };
        
        // Tile layer configuration
        this.currentTileLayerIndex = 0;
        this.currentTileLayer = null;
        this.tileLayers = [
            {
                name: 'OpenStreetMap',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                className: 'map-tiles',
                opacity: 0.8,
                // Aircraft and label colors
                aircraftColor: '#00ff00',
                labelBackground: 'rgb(0, 32, 0)',
                labelTextColor: '#00ff00',
                labelBorderColor: '#00ff00',
                labelLineColor: '#00ff00',
                // Interface colors
                primaryColor: '#00ff00',
                secondaryColor: '#88ff88',
                accentColor: '#00ffff',
                backgroundColor: 'rgba(0, 20, 40, 0.95)',
                secondaryBackground: 'rgba(0, 40, 80, 0.8)',
                borderColor: '#00ff00',
                hoverColor: 'rgba(0, 60, 120, 0.9)',
                textColor: '#00ff00',
                shadowColor: 'rgba(0, 255, 0, 0.3)',
                // Grid colors
                gridColor: '#00ff00',
                gridMajorColor: '#00ff00',
                gridMinorColor: 'rgba(0, 255, 0, 0.3)',
                // Popup colors
                popupBackground: 'rgba(0, 20, 40, 0.95)',
                popupTextColor: '#00ff00',
                popupBorderColor: '#00ff00',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#ff6600'
            },
            {
                name: 'Satellite',
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '© Esri, Maxar, Earthstar Geographics',
                className: '',
                opacity: 0.8,
                // Aircraft and label colors
                aircraftColor: '#fff',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#fff',
                labelBorderColor: '#fff',
                labelLineColor: '#fff',
                // Interface colors
                primaryColor: '#fff',
                secondaryColor: '#ddd',
                accentColor: '#ffff00',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                secondaryBackground: 'rgba(40, 40, 40, 0.8)',
                borderColor: '#fff',
                hoverColor: 'rgba(80, 80, 80, 0.9)',
                textColor: '#fff',
                shadowColor: 'rgba(255, 255, 255, 0.3)',
                // Grid colors
                gridColor: '#fff',
                gridMajorColor: '#fff',
                gridMinorColor: 'rgba(255, 255, 255, 0.3)',
                // Popup colors
                popupBackground: 'rgba(0, 0, 0, 0.9)',
                popupTextColor: '#fff',
                popupBorderColor: '#fff',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#ff0000'
            },
            {
                name: 'Dark Mode',
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap contributors © CARTO',
                className: '',
                opacity: 0.8,
                // Aircraft and label colors
                aircraftColor: '#40e0d0',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#40e0d0',
                labelBorderColor: '#40e0d0',
                labelLineColor: '#40e0d0',
                // Interface colors
                primaryColor: '#40e0d0',
                secondaryColor: '#66ffff',
                accentColor: '#00ffff',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                secondaryBackground: 'rgba(20, 40, 40, 0.8)',
                borderColor: '#40e0d0',
                hoverColor: 'rgba(40, 80, 80, 0.9)',
                textColor: '#40e0d0',
                shadowColor: 'rgba(64, 224, 208, 0.3)',
                // Grid colors
                gridColor: '#40e0d0',
                gridMajorColor: '#40e0d0',
                gridMinorColor: 'rgba(64, 224, 208, 0.3)',
                // Popup colors
                popupBackground: 'rgba(0, 0, 0, 0.9)',
                popupTextColor: '#40e0d0',
                popupBorderColor: '#40e0d0',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#00ffff'
            },
            {
                name: 'Aviation Chart',
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap contributors © CARTO',
                className: '',
                opacity: 0.8,
                // Aircraft and label colors
                aircraftColor: '#0066cc',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#0066cc',
                labelBorderColor: '#0066cc',
                labelLineColor: '#0066cc',
                // Interface colors
                primaryColor: '#0066cc',
                secondaryColor: '#3388dd',
                accentColor: '#0088ff',
                backgroundColor: 'rgba(240, 248, 255, 0.95)',
                secondaryBackground: 'rgba(200, 220, 240, 0.8)',
                borderColor: '#0066cc',
                hoverColor: 'rgba(100, 150, 200, 0.9)',
                textColor: '#0066cc',
                shadowColor: 'rgba(0, 102, 204, 0.3)',
                // Grid colors
                gridColor: '#0066cc',
                gridMajorColor: '#0066cc',
                gridMinorColor: 'rgba(0, 102, 204, 0.3)',
                // Popup colors
                popupBackground: 'rgba(240, 248, 255, 0.95)',
                popupTextColor: '#0066cc',
                popupBorderColor: '#0066cc',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#ff9900'
            },
            {
                name: 'Topographic',
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '© OpenTopoMap (CC-BY-SA)',
                className: '',
                opacity: 0.8,
                // Aircraft and label colors
                aircraftColor: 'rgb(0, 0, 0)',
                labelBackground: 'rgb(220, 220, 220)',
                labelTextColor: 'rgb(0, 0, 0)',
                labelBorderColor: 'rgb(50, 50, 50)',
                labelLineColor: 'rgb(50, 50, 50)',
                // Interface colors
                primaryColor: '#000',
                secondaryColor: '#555',
                accentColor: 'rgb(150, 200, 255)',
                backgroundColor: 'rgb(255, 255, 255)',
                secondaryBackground: 'rgb(200, 200, 200)',
                borderColor: '#8B4513',
                hoverColor: 'rgb(255, 255, 255)',
                textColor: 'rgb(0, 0, 0)',
                shadowColor: 'rgb(255, 255, 255)',
                // Grid colors
                gridColor: 'rgb(50, 50, 50)',
                gridMajorColor: 'rgb(50, 50, 50)',
                gridMinorColor: 'rgb(150, 150, 150)',
                // Popup colors
                popupBackground: 'rgb(255, 255, 255)',
                popupTextColor: 'rgb(0, 0, 0)',
                popupBorderColor: 'rgb(0, 0, 0)',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#cc0000'
            },
            {
                name: 'CartoDB Light',
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap contributors © CARTO',
                className: '',
                opacity: 1.0,
                subdomains: ['a', 'b', 'c', 'd'],
                // Aircraft and label colors - clean light theme
                aircraftColor: '#2563eb',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#1e40af',
                labelBorderColor: '#2563eb',
                labelLineColor: '#2563eb',
                // Interface colors - clean blue theme
                primaryColor: '#2563eb',
                secondaryColor: '#3b82f6',
                accentColor: '#60a5fa',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                secondaryBackground: 'rgba(248, 250, 252, 0.9)',
                borderColor: '#2563eb',
                hoverColor: 'rgba(59, 130, 246, 0.9)',
                textColor: '#1e40af',
                shadowColor: 'rgba(37, 99, 235, 0.3)',
                // Grid colors
                gridColor: '#2563eb',
                gridMajorColor: '#2563eb',
                gridMinorColor: 'rgba(37, 99, 235, 0.3)',
                // Popup colors
                popupBackground: 'rgba(255, 255, 255, 0.95)',
                popupTextColor: '#1e40af',
                popupBorderColor: '#2563eb',
                // Tracking highlight colors
                trackingHighlightColor: '#dc2626',
                trackingHighlightBackground: 'rgb(220, 38, 38)',
                // Measurement colors
                measurementColor: '#ff3366'
            },
            {
                name: 'CartoDB Dark',
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap contributors © CARTO',
                className: '',
                opacity: 1.0,
                subdomains: ['a', 'b', 'c', 'd'],
                // Aircraft and label colors - dark theme
                aircraftColor: '#fbbf24',
                labelBackground: 'rgb(31, 41, 55)',
                labelTextColor: '#fbbf24',
                labelBorderColor: '#fbbf24',
                labelLineColor: '#fbbf24',
                // Interface colors - dark theme
                primaryColor: '#fbbf24',
                secondaryColor: '#f59e0b',
                accentColor: '#f97316',
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                secondaryBackground: 'rgba(31, 41, 55, 0.9)',
                borderColor: '#fbbf24',
                hoverColor: 'rgba(245, 158, 11, 0.9)',
                textColor: '#fbbf24',
                shadowColor: 'rgba(251, 191, 36, 0.3)',
                // Grid colors
                gridColor: '#fbbf24',
                gridMajorColor: '#fbbf24',
                gridMinorColor: 'rgba(251, 191, 36, 0.3)',
                // Popup colors
                popupBackground: 'rgba(17, 24, 39, 0.95)',
                popupTextColor: '#fbbf24',
                popupBorderColor: '#fbbf24',
                // Tracking highlight colors
                trackingHighlightColor: '#ef4444',
                trackingHighlightBackground: 'rgb(239, 68, 68)',
                // Measurement colors
                measurementColor: '#ffaa00'
            },
            {
                name: 'Terrain Relief',
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '© OpenTopoMap (CC-BY-SA)',
                className: '',
                opacity: 0.9,
                // Aircraft and label colors - terrain aviation style
                aircraftColor: '#8b4513',
                labelBackground: 'rgb(245, 245, 220)',
                labelTextColor: '#654321',
                labelBorderColor: '#8b4513',
                labelLineColor: '#8b4513',
                // Interface colors - terrain theme
                primaryColor: '#8b4513',
                secondaryColor: '#a0522d',
                accentColor: '#cd853f',
                backgroundColor: 'rgba(245, 245, 220, 0.95)',
                secondaryBackground: 'rgba(250, 235, 215, 0.9)',
                borderColor: '#8b4513',
                hoverColor: 'rgba(160, 82, 45, 0.9)',
                textColor: '#654321',
                shadowColor: 'rgba(139, 69, 19, 0.3)',
                // Grid colors
                gridColor: '#8b4513',
                gridMajorColor: '#8b4513',
                gridMinorColor: 'rgba(139, 69, 19, 0.3)',
                // Popup colors
                popupBackground: 'rgba(245, 245, 220, 0.95)',
                popupTextColor: '#654321',
                popupBorderColor: '#8b4513',
                // Tracking highlight colors
                trackingHighlightColor: '#ff6600',
                trackingHighlightBackground: 'rgb(255, 102, 0)',
                // Measurement colors
                measurementColor: '#996633'
            }
        ];
        
        this.init();
    }
    
    init() {
        // Load MapBox settings from cookies
        const savedToken = this.getCookie('mapboxToken');
        const savedStyleId = this.getCookie('mapboxStyleId');
        if (savedToken) {
            this.mapboxToken = savedToken;
        }
        if (savedStyleId) {
            this.mapboxStyleId = savedStyleId;
        }
        
        // Load color scheme from cookie
        const savedColorScheme = this.getCookie('colorScheme');
        if (savedColorScheme && this.colorSchemes[savedColorScheme]) {
            this.currentColorScheme = savedColorScheme;
        }
        
        // Check if there's a group parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasGroupParam = urlParams.has('group');
        
        // Parse URL parameters (sets filter if ?group= is present)
        this.parseUrlParameters();
        
        // If no group parameter was provided, default to showing all aircraft
        if (!hasGroupParam) {
            this.selectedGroups.clear();
            this.selectedGroups.add('__ALL__');
        }
        
        this.initMap();
        this.startRadarUpdates();
    }
    
    initMap() {
        // Initialize the map
        this.map = L.map('radar-map', {
            preferCanvas: true,
            attributionControl: false,
            zoomControl: false // Disable default zoom controls
        }).setView([39.8283, -98.5795], 4); // Center on USA
        
        // Create a separate pane for trails so they appear below everything else
        this.map.createPane('trailPane');
        this.map.getPane('trailPane').style.zIndex = 350; // Below markers (400) and labels
        
        // Create trail layer group
        this.trailLayer = L.layerGroup().addTo(this.map);
        
        // Add initial tile layer
        this.loadTileLayer(this.currentTileLayerIndex);
        
        // Add custom attribution
        L.control.attribution({
            prefix: false,
            position: 'bottomright'
        }).addAttribution('Virtual Flight Online Radar').addTo(this.map);
        
        // Add zoom event listener for label visibility
        this.map.on('zoomend', () => {
            this.handleZoomChange();
        });
        
        // Add move event listener for grid updates
        this.map.on('moveend', () => {
            this.handleMapMove();
        });
        
        // Initialize measurement tool
        this.initMeasurementTool();
        
        // Initialize custom draggable toolbar
        this.initCustomToolbar();
        
        // Add keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Initialize interface colors for the default tile layer
        this.updateInterfaceColors();
        
        console.log('Radar map initialized');
    }
    
    loadTileLayer(index) {
        // Remove current tile layer if it exists
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }
        
        const layerConfig = this.tileLayers[index];
        
        // Update attribution
        const attributionControl = this.map.attributionControl;
        if (attributionControl) {
            // Clear existing attributions and add the new one
            attributionControl._attributions = {};
            attributionControl.addAttribution('Virtual Flight Online Radar');
            if (layerConfig.attribution) {
                attributionControl.addAttribution(layerConfig.attribution);
            }
        }
        
        // Add new tile layer if URL is provided
        if (layerConfig.url) {
            const tileLayerOptions = {
                attribution: layerConfig.attribution,
                className: layerConfig.className,
                opacity: layerConfig.opacity,
                maxZoom: 18,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            };
            
            // Add subdomains if specified
            if (layerConfig.subdomains) {
                tileLayerOptions.subdomains = layerConfig.subdomains;
            }
            
            console.log(`Loading tile layer: ${layerConfig.name} with URL: ${layerConfig.url}`);
            
            this.currentTileLayer = L.tileLayer(layerConfig.url, tileLayerOptions);
            
            // Add error event listener
            this.currentTileLayer.on('tileerror', (e) => {
                console.error(`Tile loading error for ${layerConfig.name}:`, e.error, 'URL:', e.url);
            });
            
            // Add load event listener
            this.currentTileLayer.on('tileload', (e) => {
                console.log(`Tile loaded successfully for ${layerConfig.name}`);
            });
            
            this.currentTileLayer.addTo(this.map);
        } else {
            this.currentTileLayer = null;
        }
        
        // Update the layers button to show current layer
        this.updateLayersButton();
        
        // Update aircraft colors for the new tile layer
        this.updateAircraftColors();
        
        // Apply the current color scheme instead of tile layer colors
        this.applyColorScheme();
    }
    
    updateLayersButton() {
        const layersBtn = document.getElementById('layers-btn');
        if (layersBtn) {
            const currentLayer = this.tileLayers[this.currentTileLayerIndex];
            layersBtn.title = `Map Layer: ${currentLayer.name} (L)`;
            
            // Get tile layer colors for consistent theming
            const buttonBackground = currentLayer.backgroundColor || 'rgba(0, 40, 80, 0.8)';
            const buttonAccent = currentLayer.accentColor || currentLayer.primaryColor || '#00ff00';
            
            // Update button appearance based on layer type
            switch (currentLayer.name) {
                case 'No Map':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    break;
                case 'Satellite':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-satellite"></i>';
                    break;
                case 'Dark Mode':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-moon"></i>';
                    break;
                case 'Aviation Chart':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-plane"></i>';
                    break;
                case 'Topographic':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-mountain"></i>';
                    break;
                case 'CartoDB Light':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-sun"></i>';
                    break;
                case 'CartoDB Dark':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-moon"></i>';
                    break;
                case 'Terrain Relief':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-mountain"></i>';
                    break;
                case 'Terrain':
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-globe-americas"></i>';
                    break;
                default:
                    layersBtn.style.background = buttonBackground;
                    layersBtn.style.borderColor = buttonAccent;
                    layersBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
                    break;
            }
            
            // Ensure text color matches tile layer
            layersBtn.style.color = currentLayer.primaryColor || currentLayer.aircraftColor || '#00ff00';
        }
    }
    
    async fetchRadarData() {
        try {
            const response = await fetch(this.radarDataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check for cache information
            const cacheInfo = response.headers.get('X-Cache-Info');
            if (cacheInfo) {
                console.log('Cache Info:', cacheInfo);
                this.updateCacheInfo(cacheInfo);
            }
            
            let data = await response.json();
            
            // Don't filter by URL parameter - let the UI filter handle it
            
            return data;
        } catch (error) {
            console.error('Error fetching radar data:', error);
            return [];
        }
    }
    
    updateCacheInfo(cacheInfo) {
        // Cache info display removed
    }
    
    updateRefreshIndicator(status) {
        // Refresh indicator removed
    }
    
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const element = document.getElementById('last-update');
        if (element) {
            element.textContent = timeString;
        }
    }
    
    updateAircraftCount(count) {
        const element = document.getElementById('aircraft-count');
        if (element) {
            element.textContent = count;
        }
    }
    
    createAircraftIcon(aircraft) {
        // Always show aircraft as plane icon
        const iconHtml = '<i class="fas fa-plane aircraft-icon"></i>';
        
        // Get aircraft color from current color scheme
        const colors = this.colorSchemes[this.currentColorScheme];
        const aircraftColor = colors.aircraftColor;
        
        // Calculate rotation angle (heading - 90 degrees to align with north)
        let rotationAngle = aircraft.heading - 90;
        if (rotationAngle < 0) rotationAngle += 360;
        
        return L.divIcon({
            className: 'aircraft-marker',
            html: `<div style="transform: rotate(${rotationAngle}deg); color: ${aircraftColor};">${iconHtml}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }
    
    createPopupContent(aircraft) {
        const isTracked = this.trackedCallsign === aircraft.callsign.toUpperCase();
        const trackingIcon = isTracked ? '🎯' : '📍';
        const trackingText = isTracked ? 'Stop Tracking' : 'Track Aircraft';
        
        // Get colors from current color scheme
        const colors = this.colorSchemes[this.currentColorScheme];
        const primaryColor = colors.primaryColor;
        const secondaryColor = colors.secondaryColor;
        const accentColor = colors.accentColor;
        const trackingColor = isTracked ? '#ff6b6b' : accentColor;
        
        return `
            <div style="min-width: 200px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: ${primaryColor}; display: flex; align-items: center; justify-content: space-between;">
                    <span>${aircraft.callsign}</span>
                    <span 
                        id="track-btn-${aircraft.callsign.replace(/[^a-zA-Z0-9]/g, '_')}" 
                        style="cursor: pointer; font-size: 14px; padding: 2px 6px; background-color: ${trackingColor}; color: white; border-radius: 3px; margin-left: 10px; user-select: none;"
                        title="${trackingText}"
                        onclick="window.radar.toggleTrackingFromPopup('${aircraft.callsign}')"
                    >
                        ${trackingIcon} ${isTracked ? 'Stop' : 'Track'}
                    </span>
                </div>
                <div style="color: ${secondaryColor}; margin-bottom: 8px;">
                    ${aircraft.pilot_name} - ${aircraft.group_name}
                </div>
                <table style="width: 100%; font-size: 12px;">
                    <tr><td>Aircraft:</td><td>${aircraft.aircraft_type}</td></tr>
                    <tr><td>Altitude:</td><td>${Math.round(aircraft.altitude)} ft</td></tr>
                    <tr><td>Heading:</td><td>${Math.round(aircraft.heading)}°</td></tr>
                    <tr><td>Speed:</td><td>${Math.round(aircraft.groundspeed)} kts</td></tr>
                    <tr><td>Server:</td><td>${aircraft.msfs_server}</td></tr>
                    <tr><td>Online:</td><td>${aircraft.time_online}</td></tr>
                </table>
                ${aircraft.notes ? `<div style="margin-top: 8px; font-style: italic;">${aircraft.notes}</div>` : ''}
            </div>
        `;
    }
    
    drawHeadingLine(aircraft) {
        const callsign = aircraft.callsign;
        
        // Remove existing heading line
        if (this.headingLines.has(callsign)) {
            this.map.removeLayer(this.headingLines.get(callsign));
        }
        
        // Only draw heading line for moving aircraft
        if (aircraft.groundspeed < 10) {
            return;
        }
        
        // Calculate end point of heading line - adjust distance based on zoom level
        const startLat = aircraft.latitude;
        const startLng = aircraft.longitude;
        const zoom = this.map.getZoom();
        
        // Scale distance inversely with zoom to maintain consistent visual size
        const baseDistance = 0.1; // Base distance at zoom level 1
        const distance = baseDistance / Math.pow(2, zoom - 4); // Adjust for zoom level
        const heading = aircraft.heading * Math.PI / 180; // Convert to radians
        
        const endLat = startLat + (distance * Math.cos(heading));
        const endLng = startLng + (distance * Math.sin(heading));
        
        // Get aircraft color for current color scheme and make heading line slightly different
        const colors = this.colorSchemes[this.currentColorScheme];
        const baseColor = colors.aircraftColor;
        const headingLineColor = this.getHeadingLineColor(baseColor);
        
        const headingLine = L.polyline([
            [startLat, startLng],
            [endLat, endLng]
        ], {
            color: headingLineColor,
            weight: 1, // Thinner line (was 2)
            opacity: 0.8
        });
        
        headingLine.addTo(this.map);
        this.headingLines.set(callsign, headingLine);
        
        // Apply hidden state if aircraft is hidden
        if (this.hiddenAircraft.has(callsign)) {
            this.applyAircraftVisibility(callsign);
        }
    }
    
    createAircraftLabel(aircraft) {
        const callsign = aircraft.callsign;
        const position = [aircraft.latitude, aircraft.longitude];
        
        // Get label colors from current color scheme
        const colors = this.colorSchemes[this.currentColorScheme];
        const labelTextColor = colors.labelTextColor;
        const labelBackground = colors.labelBackground;
        const labelBorderColor = colors.labelBorderColor;
        const labelLineColor = colors.labelLineColor;
        
        // Get pixel offset for this aircraft (either saved or default)
        let pixelOffset;
        if (this.labelPixelPositions.has(callsign)) {
            pixelOffset = this.labelPixelPositions.get(callsign);
        } else {
            // Use default pixel offset for new aircraft
            pixelOffset = [...this.defaultPixelOffset]; // Copy the array
            this.labelPixelPositions.set(callsign, pixelOffset);
        }
        
        // Convert pixel offset to geographic position based on current zoom
        const labelPosition = this.pixelOffsetToLatLng(position, pixelOffset);
        
        // Create label content with tile layer-specific styling
        const labelText = `
            <div style="
                background: ${labelBackground};
                color: ${labelTextColor};
                padding: 3px 6px;
                border: 1px solid ${labelBorderColor};
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                white-space: nowrap;
                box-shadow: 0 0 8px ${labelBorderColor}40;
                cursor: move;
            ">
                <div style="font-weight: bold; font-size: 11px;">${aircraft.callsign}</div>
                <div style="font-size: 9px; opacity: 0.8; margin-top: 1px;">
                    ${Math.round(aircraft.altitude)}ft • ${Math.round(aircraft.groundspeed)}kts
                </div>
            </div>
        `;
        
        // Create label marker with center anchor so line connects to middle
        const labelMarker = L.marker(labelPosition, {
            icon: L.divIcon({
                className: 'aircraft-label draggable-label',
                html: labelText,
                iconSize: [100, 35],
                iconAnchor: [50, 17.5] // Center of the label
            }),
            draggable: true
        });
        
        // Create connecting line from aircraft to center of label with dynamic color
        const labelLine = L.polyline([position, labelPosition], {
            color: labelLineColor,
            weight: 1,
            opacity: 0.7,
            dashArray: '1, 2'
        });
        
        // Group line and label - LINE FIRST so label draws over it
        const labelGroup = L.layerGroup([labelLine, labelMarker]);
        
        // Add drag event handlers to update line and save position
        labelMarker.on('drag', (e) => {
            const newLabelPos = e.target.getLatLng();
            const newLabelPosArray = [newLabelPos.lat, newLabelPos.lng];
            
            // Get current aircraft position from the aircraft marker
            const aircraftMarker = this.aircraftMarkers.get(callsign);
            let currentAircraftPos = position; // fallback to original position
            
            if (aircraftMarker) {
                const currentLatLng = aircraftMarker.getLatLng();
                currentAircraftPos = [currentLatLng.lat, currentLatLng.lng];
            }
            
            // Update the connecting line from current aircraft position to new label position
            labelLine.setLatLngs([currentAircraftPos, newLabelPosArray]);
            
            // Convert the new position to pixel offset and save it
            const newPixelOffset = this.latLngToPixelOffset(currentAircraftPos, newLabelPosArray);
            this.labelPixelPositions.set(callsign, newPixelOffset);
        });
        
        labelMarker.on('dragend', (e) => {
            console.log(`Label position saved for ${callsign}`);
        });
        
        return labelGroup;
    }

    drawAircraftLabel(aircraft) {
        const callsign = aircraft.callsign;
        const zoom = this.map.getZoom();
        
        // Remove existing label
        if (this.labelLayers.has(callsign)) {
            this.map.removeLayer(this.labelLayers.get(callsign));
        }
        
        // Only create labels at zoom level 6 and above
        if (zoom >= 6) {
            const labelGroup = this.createAircraftLabel(aircraft);
            labelGroup.addTo(this.map);
            this.labelLayers.set(callsign, labelGroup);
            
            // Apply hidden state if aircraft is hidden
            if (this.hiddenAircraft.has(callsign)) {
                this.applyAircraftVisibility(callsign);
            }
        }
    }
    
    // Update label position when aircraft moves (for dragged labels)
    updateLabelPosition(aircraft) {
        const callsign = aircraft.callsign;
        
        // Don't update if aircraft is hidden
        if (this.hiddenAircraft.has(callsign)) {
            return;
        }
        
        if (!this.labelLayers.has(callsign) || !this.labelPixelPositions.has(callsign)) {
            return;
        }
        
        const position = [aircraft.latitude, aircraft.longitude];
        const savedPixelOffset = this.labelPixelPositions.get(callsign);
        
        // Convert pixel offset to current geographic position
        const newLabelPosition = this.pixelOffsetToLatLng(position, savedPixelOffset);
        
        // Get the label group and update both line and marker
        const labelGroup = this.labelLayers.get(callsign);
        const layers = labelGroup.getLayers();
        
        if (layers.length >= 2) {
            const labelLine = layers[0]; // Line is first
            const labelMarker = layers[1]; // Marker is second
            
            // Update line coordinates
            labelLine.setLatLngs([position, newLabelPosition]);
            
            // Update marker position
            labelMarker.setLatLng(newLabelPosition);
        }
    }

    // Aircraft Trail System
    
    updateAircraftTrail(callsign, position) {
        // Don't create trails for hidden aircraft
        if (this.hiddenAircraft.has(callsign)) {
            return;
        }
        
        // Initialize trail array for new aircraft
        if (!this.aircraftTrails.has(callsign)) {
            this.aircraftTrails.set(callsign, []);
        }
        
        const trail = this.aircraftTrails.get(callsign);
        
        // Check if position has changed significantly (more than ~50 meters)
        if (trail.length > 0) {
            const lastPos = trail[trail.length - 1];
            const distance = this.calculateDistance(lastPos[0], lastPos[1], position[0], position[1]);
            if (distance < 0.0005) {
                return; // Position hasn't changed enough, don't add
            }
        }
        
        // Add new position to trail - but this becomes a historical position
        // We want to show where the aircraft WAS, not where it is now
        // So we add the position BEFORE moving to the new one
        if (trail.length > 0 || this.aircraftMarkers.has(callsign)) {
            // Only add to trail if this isn't the very first position
            // For first position, just initialize but don't draw
            trail.push([position[0], position[1]]);
            
            // Keep only last 10 positions
            if (trail.length > this.maxTrailLength) {
                trail.shift();
            }
            
            // Redraw trail markers
            this.drawAircraftTrail(callsign);
        }
    }
    
    drawAircraftTrail(callsign) {
        // Don't draw trails if disabled
        if (!this.trailsEnabled) {
            return;
        }
        
        // Remove existing trail markers
        if (this.trailLayers.has(callsign)) {
            const existingTrails = this.trailLayers.get(callsign);
            existingTrails.forEach(marker => {
                this.trailLayer.removeLayer(marker);
            });
        }
        
        const trail = this.aircraftTrails.get(callsign);
        if (!trail || trail.length <= 1) {
            // Need at least 2 positions to show a trail (don't show current position)
            return;
        }
        
        // Get aircraft color for current color scheme
        const colors = this.colorSchemes[this.currentColorScheme];
        const aircraftColor = colors.aircraftColor;
        
        const trailMarkers = [];
        
        // Create markers for trail positions, excluding the most recent one (that's where aircraft is now)
        // Show positions from oldest to second-most-recent
        const historicalTrail = trail.slice(0, -1);
        
        historicalTrail.forEach((position, index) => {
            // Calculate opacity: older positions are more transparent
            // Oldest position gets lowest opacity, newest historical position gets highest
            const opacity = ((index + 1) / historicalTrail.length) * 0.8; // 0.08 to 0.8
            
            const marker = L.circleMarker(position, {
                radius: 1.5,
                fillColor: aircraftColor,
                color: aircraftColor,
                weight: 0.5,
                opacity: opacity,
                fillOpacity: opacity,
                pane: 'trailPane'
            });
            
            marker.addTo(this.trailLayer);
            trailMarkers.push(marker);
        });
        
        this.trailLayers.set(callsign, trailMarkers);
    }
    
    clearAircraftTrail(callsign) {
        // Remove trail markers from map
        if (this.trailLayers.has(callsign)) {
            const trailMarkers = this.trailLayers.get(callsign);
            trailMarkers.forEach(marker => {
                this.trailLayer.removeLayer(marker);
            });
            this.trailLayers.delete(callsign);
        }
        
        // Remove trail data
        if (this.aircraftTrails.has(callsign)) {
            this.aircraftTrails.delete(callsign);
        }
    }

    // Smooth Movement System Methods
    
    setupAircraftMovement(aircraft, currentTime) {
        const callsign = aircraft.callsign;
        const targetLat = aircraft.latitude;
        const targetLng = aircraft.longitude;
        const heading = aircraft.heading || 0;
        const groundspeed = aircraft.groundspeed || 0;
        
        if (!this.aircraftPositions.has(callsign)) {
            // New aircraft - start at target position
            this.aircraftPositions.set(callsign, {
                currentLat: targetLat,
                currentLng: targetLng,
                targetLat: targetLat,
                targetLng: targetLng,
                heading: heading,
                groundspeed: groundspeed,
                lastUpdateTime: currentTime,
                interpolationStartTime: currentTime,
                interpolationDuration: this.updateInterval // Time to reach target
            });
        } else {
            // Existing aircraft - update target and movement data
            const positionData = this.aircraftPositions.get(callsign);
            
            // Check if target position has changed significantly (more than ~100 meters)
            const distance = this.calculateDistance(
                positionData.targetLat, positionData.targetLng,
                targetLat, targetLng
            );
            
            if (distance > 0.001 || Math.abs(positionData.groundspeed - groundspeed) > 5) {
                // Update target position and movement parameters
                positionData.targetLat = targetLat;
                positionData.targetLng = targetLng;
                positionData.heading = heading;
                positionData.groundspeed = groundspeed;
                positionData.lastUpdateTime = currentTime;
                positionData.interpolationStartTime = currentTime;
                positionData.interpolationDuration = this.updateInterval;
            }
        }
    }
    
    startSmoothMovement() {
        if (this.interpolationTimer) {
            clearInterval(this.interpolationTimer);
        }
        
        this.interpolationTimer = setInterval(() => {
            this.updateSmoothMovement();
        }, this.interpolationInterval);
        
        console.log('Smooth aircraft movement started - aircraft and labels will move realistically based on heading and speed');
    }
    
    stopSmoothMovement() {
        if (this.interpolationTimer) {
            clearInterval(this.interpolationTimer);
            this.interpolationTimer = null;
        }
    }
    
    updateSmoothMovement() {
        const currentTime = Date.now();
        let hasMovingAircraft = false;
        
        for (const [callsign, positionData] of this.aircraftPositions) {
            const marker = this.aircraftMarkers.get(callsign);
            if (!marker) continue;
            
            // Calculate time since last update
            const deltaTime = currentTime - (positionData.lastMovementUpdate || currentTime);
            positionData.lastMovementUpdate = currentTime;
            
            // Choose interpolation method based on aircraft speed
            let newPosition;
            if (positionData.groundspeed > 10) {
                // Use physics-based movement for moving aircraft
                newPosition = this.interpolatePositionWithPhysics(positionData, 0, deltaTime);
                positionData.currentLat = newPosition.lat;
                positionData.currentLng = newPosition.lng;
            } else {
                // Use simple interpolation for stationary aircraft
                const elapsed = currentTime - positionData.interpolationStartTime;
                const progress = Math.min(elapsed / positionData.interpolationDuration, 1.0);
                newPosition = this.interpolatePosition(positionData, progress);
                positionData.currentLat = newPosition.lat;
                positionData.currentLng = newPosition.lng;
            }
            
            // Update marker position
            marker.setLatLng([newPosition.lat, newPosition.lng]);
            
            // Update aircraft label and connecting line position during smooth movement
            this.updateLabelForSmoothMovement(callsign, [newPosition.lat, newPosition.lng]);
            
            // Check if aircraft is still moving
            if (positionData.groundspeed > 10) {
                hasMovingAircraft = true;
            }
        }
        
        // If no aircraft are moving, we can reduce update frequency slightly
        if (!hasMovingAircraft && this.aircraftPositions.size === 0) {
            // No aircraft at all, stop smooth movement timer
            this.stopSmoothMovement();
        }
    }
    
    interpolatePosition(positionData, progress) {
        // Use easing function for smoother movement
        const easedProgress = this.easeInOutQuad(progress);
        
        // Simple linear interpolation between current and target positions
        const lat = positionData.currentLat + (positionData.targetLat - positionData.currentLat) * easedProgress;
        const lng = positionData.currentLng + (positionData.targetLng - positionData.currentLng) * easedProgress;
        
        return { lat, lng };
    }
    
    // Advanced interpolation using heading and speed for more realistic movement
    interpolatePositionWithPhysics(positionData, progress, deltaTime) {
        if (positionData.groundspeed < 10) {
            // Aircraft is stationary or moving very slowly, use simple interpolation
            return this.interpolatePosition(positionData, progress);
        }
        
        // Calculate movement based on heading and speed
        const speedKnots = positionData.groundspeed;
        const speedMetersPerSecond = speedKnots * 0.514444; // Convert knots to m/s
        const deltaTimeSeconds = deltaTime / 1000;
        
        // Convert heading to radians (heading 0 = North, clockwise)
        const headingRad = positionData.heading * Math.PI / 180;
        
        // Calculate movement in meters
        const distanceMeters = speedMetersPerSecond * deltaTimeSeconds;
        
        // Convert to latitude/longitude changes
        // 1 degree latitude ≈ 111,320 meters
        // 1 degree longitude ≈ 111,320 * cos(latitude) meters
        const deltaLat = (distanceMeters * Math.cos(headingRad)) / 111320;
        const avgLat = positionData.currentLat * Math.PI / 180;
        const deltaLng = (distanceMeters * Math.sin(headingRad)) / (111320 * Math.cos(avgLat));
        
        // Calculate new position
        let newLat = positionData.currentLat + deltaLat;
        let newLng = positionData.currentLng + deltaLng;
        
        // Ensure we don't overshoot the target position
        const distanceToTarget = this.calculateDistance(
            newLat, newLng,
            positionData.targetLat, positionData.targetLng
        );
        
        const originalDistance = this.calculateDistance(
            positionData.currentLat, positionData.currentLng,
            positionData.targetLat, positionData.targetLng
        );
        
        // If we're very close to target or would overshoot, snap to target
        if (distanceToTarget < 0.0001 || distanceToTarget > originalDistance) {
            newLat = positionData.targetLat;
            newLng = positionData.targetLng;
        }
        
        return { lat: newLat, lng: newLng };
    }
    
    updateLabelForSmoothMovement(callsign, aircraftPosition) {
        // Don't update if aircraft is hidden
        if (this.hiddenAircraft.has(callsign)) {
            return;
        }
        
        // Only update labels if they should be visible at current zoom level
        const zoom = this.map.getZoom();
        if (zoom < 6) {
            return; // Labels are not shown at zoom levels below 6
        }
        
        if (!this.labelLayers.has(callsign)) return;
        
        const labelGroup = this.labelLayers.get(callsign);
        const layers = labelGroup.getLayers();
        
        if (layers.length >= 2) {
            const labelLine = layers[0]; // Line is first
            const labelMarker = layers[1]; // Marker is second
            
            try {
                // Store the current aircraft position for this aircraft
                if (!this.lastKnownAircraftPositions) {
                    this.lastKnownAircraftPositions = new Map();
                }
                
                const lastPos = this.lastKnownAircraftPositions.get(callsign);
                const currentPos = aircraftPosition;
                
                // Only update if position has actually changed significantly to avoid unnecessary updates
                if (!lastPos || 
                    Math.abs(lastPos[0] - currentPos[0]) > 0.00005 || 
                    Math.abs(lastPos[1] - currentPos[1]) > 0.00005) {
                    
                    this.lastKnownAircraftPositions.set(callsign, [...currentPos]);
                    
                    // Check if this label has a saved pixel offset (user has dragged it)
                    if (this.labelPixelPositions.has(callsign)) {
                        // Label has been manually positioned - update label position based on pixel offset
                        const pixelOffset = this.labelPixelPositions.get(callsign);
                        const newLabelPosition = this.pixelOffsetToLatLng(aircraftPosition, pixelOffset);
                        
                        // Update label marker position
                        labelMarker.setLatLng(newLabelPosition);
                        
                        // Update connecting line to new positions
                        labelLine.setLatLngs([aircraftPosition, newLabelPosition]);
                    } else {
                        // Label is using default offset - recalculate position
                        const defaultLabelPosition = this.pixelOffsetToLatLng(aircraftPosition, this.defaultPixelOffset);
                        
                        // Update label marker position
                        labelMarker.setLatLng(defaultLabelPosition);
                        
                        // Update connecting line to new positions
                        labelLine.setLatLngs([aircraftPosition, defaultLabelPosition]);
                    }
                }
            } catch (error) {
                console.warn(`Error updating label for ${callsign}:`, error);
            }
        }
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        // Simple distance calculation for small distances
        const deltaLat = lat2 - lat1;
        const deltaLng = lng2 - lng1;
        return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
    }
    
    updateAircraftDisplay(aircraftData) {
        const currentCallsigns = new Set(aircraftData.map(ac => ac.callsign));
        const currentTime = Date.now();
        
        // Store the time of this data update
        this.lastDataUpdateTime = currentTime;
        
        // Remove aircraft that are no longer online
        for (const [callsign, marker] of this.aircraftMarkers) {
            if (!currentCallsigns.has(callsign)) {
                // Remove aircraft marker
                if (this.map.hasLayer(marker)) {
                    this.map.removeLayer(marker);
                }
                this.aircraftMarkers.delete(callsign);
                
                // Remove associated heading line (clean up any existing heading lines)
                if (this.headingLines.has(callsign)) {
                    const headingLine = this.headingLines.get(callsign);
                    if (this.map.hasLayer(headingLine)) {
                        this.map.removeLayer(headingLine);
                    }
                    this.headingLines.delete(callsign);
                }
                
                // Remove associated label
                if (this.labelLayers.has(callsign)) {
                    const labelLayer = this.labelLayers.get(callsign);
                    if (this.map.hasLayer(labelLayer)) {
                        this.map.removeLayer(labelLayer);
                    }
                    this.labelLayers.delete(callsign);
                }
                
                // Remove saved label position
                if (this.labelPixelPositions.has(callsign)) {
                    this.labelPixelPositions.delete(callsign);
                }
                
                // Remove aircraft position data for smooth movement
                if (this.aircraftPositions.has(callsign)) {
                    this.aircraftPositions.delete(callsign);
                }
                
                // Remove last known position data
                if (this.lastKnownAircraftPositions.has(callsign)) {
                    this.lastKnownAircraftPositions.delete(callsign);
                }
                
                // Remove aircraft trail
                this.clearAircraftTrail(callsign);
            }
        }
        
        // Update or create aircraft markers with smooth movement
        aircraftData.forEach(aircraft => {
            const callsign = aircraft.callsign;
            const targetPosition = [aircraft.latitude, aircraft.longitude];
            
            // Update position trail
            this.updateAircraftTrail(callsign, targetPosition);
            
            // Always setup aircraft movement data (needed for both smooth and non-smooth modes)
            this.setupAircraftMovement(aircraft, currentTime);
            
            // Update or create aircraft marker
            if (this.aircraftMarkers.has(callsign)) {
                // Update existing marker
                const marker = this.aircraftMarkers.get(callsign);
                
                if (this.smoothMovementEnabled) {
                    // Use current interpolated position for smooth movement
                    const positionData = this.aircraftPositions.get(callsign);
                    marker.setLatLng([positionData.currentLat, positionData.currentLng]);
                } else {
                    // Jump directly to target position when smooth movement is disabled
                    marker.setLatLng(targetPosition);
                    
                    // Also update the position data to match the target
                    const positionData = this.aircraftPositions.get(callsign);
                    if (positionData) {
                        positionData.currentLat = positionData.targetLat;
                        positionData.currentLng = positionData.targetLng;
                    }
                }
                
                // Only update icon if heading has changed significantly (more than 5 degrees)
                const oldData = marker.aircraftData;
                if (!oldData || Math.abs(oldData.heading - aircraft.heading) > 5) {
                    marker.setIcon(this.createAircraftIcon(aircraft));
                }
                
                // Update popup content
                marker.getPopup().setContent(this.createPopupContent(aircraft));
                
                // Store updated aircraft data on the marker
                marker.aircraftData = aircraft;
                marker.options.aircraftData = aircraft;
                
                // Update label position if it was manually positioned
                this.updateLabelPosition(aircraft);
            } else {
                // Create new marker at target position
                const marker = L.marker(targetPosition, {
                    icon: this.createAircraftIcon(aircraft),
                    aircraftData: aircraft  // Store aircraft data in options
                });
                
                marker.bindPopup(this.createPopupContent(aircraft));
                
                marker.on('click', () => {
                    // Show popup at aircraft's current position without centering map
                    marker.openPopup();
                });
                
                marker.addTo(this.map);
                this.aircraftMarkers.set(callsign, marker);
                
                // Apply hidden state if aircraft is hidden
                if (this.hiddenAircraft.has(callsign)) {
                    this.applyAircraftVisibility(callsign);
                }
                
                // Apply group filter
                const shouldShow = this.selectedGroups.size === 0 || this.selectedGroups.has(aircraft.group_name);
                if (!shouldShow) {
                    this.hideAircraftElement(callsign);
                }
            }
            
            // Handle aircraft labels - avoid recreating during smooth movement to prevent stuttering
            if (this.smoothMovementEnabled && this.labelLayers.has(callsign)) {
                // During smooth movement, only update label content, don't recreate the label
                this.updateLabelContent(callsign, aircraft);
            } else if (!this.labelLayers.has(callsign)) {
                // Label doesn't exist yet - create it
                this.drawAircraftLabel(aircraft);
            } else if (!this.smoothMovementEnabled) {
                // Not in smooth movement - safe to update/recreate labels normally
                this.drawAircraftLabel(aircraft);
                this.updateLabelContent(callsign, aircraft);
            }
        });
        
        // Start smooth movement if not already running
        if (this.smoothMovementEnabled && !this.interpolationTimer) {
            this.startSmoothMovement();
        }
        
        // Update aircraft count
        this.updateAircraftCount(aircraftData.length);
        
        // Update aircraft list if visible
        if (this.aircraftListVisible) {
            this.updateAircraftListData();
        }
        
        // Update group filter if visible
        if (this.groupFilterVisible) {
            this.updateGroupFilterData();
        }
        
        // Apply saved group filter to all aircraft (needs to happen every update)
        if (this.selectedGroups.size > 0) {
            this.applyGroupFilter();
        }
        
        // Update group filter button to reflect active filters
        this.updateGroupFilterButton();
        
        // Auto-position map on initial load if aircraft are present
        if (this.isInitialLoad && aircraftData.length > 0) {
            this.autoFitAircraft(aircraftData);
            this.isInitialLoad = false;
        }
        
        // Track specific aircraft if tracking is enabled
        if (this.isTrackingEnabled && this.trackedCallsign) {
            this.trackAircraft(aircraftData);
        }
        
        console.log(`Updated ${aircraftData.length} aircraft on radar`);
    }
    
    async updateRadar() {
        this.updateRefreshIndicator('Updating...');
        
        try {
            const aircraftData = await this.fetchRadarData();
            this.updateAircraftDisplay(aircraftData);
            
            // Perform periodic cleanup to remove any orphaned layers
            this.performPeriodicCleanup();
            
            this.updateLastUpdateTime();
            this.updateRefreshIndicator('Connected');
        } catch (error) {
            console.error('Radar update failed:', error);
            this.updateRefreshIndicator('Error');
        }
    }
    
    startRadarUpdates() {
        // Initial update
        this.updateRadar();
        
        // Set up periodic updates
        setInterval(() => {
            this.updateRadar();
        }, this.updateInterval);
        
        console.log(`Radar updates started (${this.updateInterval/1000}s interval)`);
    }

    handleZoomChange() {
        // Update label visibility based on zoom level
        const zoom = this.map.getZoom();
        const showLabels = zoom >= 6; // Only show labels at zoom level 6 and above
        
        for (const [callsign, labelGroup] of this.labelLayers) {
            if (showLabels) {
                if (!this.map.hasLayer(labelGroup)) {
                    labelGroup.addTo(this.map);
                }
            } else {
                if (this.map.hasLayer(labelGroup)) {
                    this.map.removeLayer(labelGroup);
                }
            }
        }
        
        // Recalculate all label positions to maintain pixel-based distances
        this.recalculateAllLabelPositions();
        
        // Update grid if visible
        if (this.gridVisible) {
            this.createGrid();
        }
        
        // Heading lines disabled
        // this.updateHeadingLinesForZoom();
    }
    
    handleMapMove() {
        // Update grid when map is panned
        if (this.gridVisible) {
            this.createGrid();
        }
    }
    
    // Recalculate all label positions after zoom change to maintain pixel distances
    recalculateAllLabelPositions() {
        for (const [callsign, marker] of this.aircraftMarkers) {
            // Skip hidden aircraft
            if (this.hiddenAircraft.has(callsign)) {
                continue;
            }
            
            if (this.labelPixelPositions.has(callsign) && this.labelLayers.has(callsign)) {
                const aircraftPos = marker.getLatLng();
                const aircraftPosArray = [aircraftPos.lat, aircraftPos.lng];
                const pixelOffset = this.labelPixelPositions.get(callsign);
                
                // Recalculate geographic position based on pixel offset
                const newLabelPosition = this.pixelOffsetToLatLng(aircraftPosArray, pixelOffset);
                
                // Update the actual label position
                const labelGroup = this.labelLayers.get(callsign);
                const layers = labelGroup.getLayers();
                
                if (layers.length >= 2) {
                    const labelLine = layers[0];
                    const labelMarker = layers[1];
                    
                    labelLine.setLatLngs([aircraftPosArray, newLabelPosition]);
                    labelMarker.setLatLng(newLabelPosition);
                }
            }
        }
    }
    
    updateHeadingLinesForZoom() {
        // Get current aircraft data to redraw heading lines with zoom-adjusted size
        this.fetchRadarData().then(aircraftData => {
            aircraftData.forEach(aircraft => {
                if (aircraft.groundspeed >= 10) { // Only for moving aircraft
                    this.drawHeadingLine(aircraft);
                }
            });
        }).catch(error => {
            console.error('Error updating heading lines for zoom:', error);
        });
    }

    performPeriodicCleanup() {
        // Clean up any orphaned layers that might not have been properly removed
        const activeCallsigns = new Set(this.aircraftMarkers.keys());
        
        // Clean up all heading lines (heading lines are now disabled)
        for (const [callsign, headingLine] of this.headingLines) {
            if (this.map.hasLayer(headingLine)) {
                this.map.removeLayer(headingLine);
            }
            this.headingLines.delete(callsign);
        }
        
        // Clean up labels for inactive aircraft
        for (const [callsign, labelLayer] of this.labelLayers) {
            if (!activeCallsigns.has(callsign)) {
                if (this.map.hasLayer(labelLayer)) {
                    this.map.removeLayer(labelLayer);
                }
                this.labelLayers.delete(callsign);
                // Also remove saved position
                this.labelPixelPositions.delete(callsign);
            }
        }
    }

    // Auto-fit map view to show all aircraft on initial load
    autoFitAircraft(aircraftData) {
        if (aircraftData.length === 0) {
            return;
        }
        
        if (aircraftData.length === 1) {
            // Single aircraft - center on it with a reasonable zoom
            const aircraft = aircraftData[0];
            this.map.setView([aircraft.latitude, aircraft.longitude], 8);
            console.log(`Centered map on single aircraft: ${aircraft.callsign}`);
        } else {
            // Multiple aircraft - fit bounds to show all
            const latitudes = aircraftData.map(ac => ac.latitude);
            const longitudes = aircraftData.map(ac => ac.longitude);
            
            const minLat = Math.min(...latitudes);
            const maxLat = Math.max(...latitudes);
            const minLng = Math.min(...longitudes);
            const maxLng = Math.max(...longitudes);
            
            // Create bounds with some padding
            const bounds = L.latLngBounds(
                [minLat, minLng],
                [maxLat, maxLng]
            );
            
            // Fit the map to bounds with padding
            this.map.fitBounds(bounds, {
                padding: [50, 50], // 50px padding on all sides
                maxZoom: 10 // Don't zoom in too far
            });
            
            console.log(`Auto-fitted map to ${aircraftData.length} aircraft`);
        }
    }

    // Helper function to convert pixel offset to geographic coordinates based on current zoom
    pixelOffsetToLatLng(centerPos, pixelOffset) {
        // Get the center point in pixels
        const centerPoint = this.map.latLngToContainerPoint(centerPos);
        
        // Calculate the offset point in pixels
        const offsetPoint = L.point(
            centerPoint.x + pixelOffset[0], 
            centerPoint.y + pixelOffset[1]
        );
        
        // Convert back to geographic coordinates
        const offsetLatLng = this.map.containerPointToLatLng(offsetPoint);
        
        // Return as array
        return [offsetLatLng.lat, offsetLatLng.lng];
    }

    // Helper function to convert geographic position back to pixel offset
    latLngToPixelOffset(centerPos, labelPos) {
        const centerPoint = this.map.latLngToContainerPoint(centerPos);
        const labelPoint = this.map.latLngToContainerPoint(labelPos);
        
        return [
            labelPoint.x - centerPoint.x,
            labelPoint.y - centerPoint.y
        ];
    }
    
    createGrid() {
        if (this.gridLayer) {
            this.map.removeLayer(this.gridLayer);
        }
        
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        
        // Calculate grid spacing based on zoom level - finer resolution for more squares
        let latSpacing, lngSpacing;
        
        if (zoom <= 3) {
            latSpacing = lngSpacing = 10; // 10 degree grid
        } else if (zoom <= 5) {
            latSpacing = lngSpacing = 5; // 5 degree grid
        } else if (zoom <= 7) {
            latSpacing = lngSpacing = 1; // 1 degree grid
        } else if (zoom <= 9) {
            latSpacing = lngSpacing = 0.25; // 15 minute grid
        } else if (zoom <= 11) {
            latSpacing = lngSpacing = 0.1; // 6 minute grid
        } else {
            latSpacing = lngSpacing = 0.05; // 3 minute grid
        }
        
        const gridLines = [];
        const gridLabels = [];
        
        // Calculate bounds with some padding
        const minLat = Math.floor(bounds.getSouth() / latSpacing) * latSpacing;
        const maxLat = Math.ceil(bounds.getNorth() / latSpacing) * latSpacing;
        const minLng = Math.floor(bounds.getWest() / lngSpacing) * lngSpacing;
        const maxLng = Math.ceil(bounds.getEast() / lngSpacing) * lngSpacing;
        
        // Get grid colors from current color scheme
        const colors = this.colorSchemes[this.currentColorScheme];
        const gridMajorColor = colors.gridMajorColor;
        const gridMinorColor = colors.gridMinorColor;
        const gridTextColor = colors.textColor;
        
        // Create latitude lines (horizontal)
        for (let lat = minLat; lat <= maxLat; lat += latSpacing) {
            if (lat >= -90 && lat <= 90) {
                const isMajorLine = lat % (latSpacing * 5) === 0;
                const line = L.polyline([
                    [lat, bounds.getWest()],
                    [lat, bounds.getEast()]
                ], {
                    color: isMajorLine ? gridMajorColor : gridMinorColor,
                    weight: isMajorLine ? 1.5 : 0.8,
                    opacity: isMajorLine ? 0.6 : 0.5,
                    dashArray: isMajorLine ? null : '2, 4'
                });
                gridLines.push(line);
                
                // Add labels for major grid lines
                if (isMajorLine || latSpacing >= 5) {
                    const latLabel = this.formatLatitude(lat);
                    const label = L.marker([lat, bounds.getWest()], {
                        icon: L.divIcon({
                            className: 'grid-label',
                            html: `<div style="color: ${gridTextColor}; font-size: 10px; font-family: monospace; background: rgba(0,0,0,0.5); padding: 2px 4px; border-radius: 2px; white-space: nowrap;">${latLabel}</div>`,
                            iconSize: [50, 20],
                            iconAnchor: [0, 10]
                        })
                    });
                    gridLabels.push(label);
                }
            }
        }
        
        // Create longitude lines (vertical)
        for (let lng = minLng; lng <= maxLng; lng += lngSpacing) {
            if (lng >= -180 && lng <= 180) {
                const isMajorLine = lng % (lngSpacing * 5) === 0;
                const line = L.polyline([
                    [bounds.getSouth(), lng],
                    [bounds.getNorth(), lng]
                ], {
                    color: isMajorLine ? gridMajorColor : gridMinorColor,
                    weight: isMajorLine ? 1.5 : 0.8,
                    opacity: isMajorLine ? 0.6 : 0.5,
                    dashArray: isMajorLine ? null : '2, 4'
                });
                gridLines.push(line);
                
                // Add labels for major grid lines
                if (isMajorLine || lngSpacing >= 5) {
                    const lngLabel = this.formatLongitude(lng);
                    
                    // Place longitude labels at the very top edge of the viewport
                    const labelLat = bounds.getNorth();
                    
                    const label = L.marker([labelLat, lng], {
                        icon: L.divIcon({
                            className: 'grid-label',
                            html: `<div style="color: ${gridTextColor}; font-size: 10px; font-family: monospace; background: rgba(0,0,0,0.5); padding: 2px 4px; border-radius: 2px; white-space: nowrap;">${lngLabel}</div>`,
                            iconSize: [50, 20],
                            iconAnchor: [25, 0]
                        })
                    });
                    gridLabels.push(label);
                }
            }
        }
        
        // Combine all grid elements into a layer group
        this.gridLayer = L.layerGroup([...gridLines, ...gridLabels]);
        
        if (this.gridVisible) {
            this.gridLayer.addTo(this.map);
        }
    }
    
    formatLatitude(lat) {
        const absLat = Math.abs(lat);
        const degrees = Math.floor(absLat);
        const minutes = Math.floor((absLat - degrees) * 60);
        const hemisphere = lat >= 0 ? 'N' : 'S';
        
        if (minutes === 0) {
            return `${degrees}°${hemisphere}`;
        } else {
            return `${degrees}°${minutes.toString().padStart(2, '0')}'${hemisphere}`;
        }
    }
    
    formatLongitude(lng) {
        const absLng = Math.abs(lng);
        const degrees = Math.floor(absLng);
        const minutes = Math.floor((absLng - degrees) * 60);
        const hemisphere = lng >= 0 ? 'E' : 'W';
        
        if (minutes === 0) {
            return `${degrees}°${hemisphere}`;
        } else {
            return `${degrees}°${minutes.toString().padStart(2, '0')}'${hemisphere}`;
        }
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        
        if (this.gridVisible) {
            this.createGrid();
        } else {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }
        }
        
        this.updateGridButton();
    }
    
    updateGridButton() {
        const btn = document.getElementById('grid-btn');
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledBackground = colors.accentColor;
            const disabledBackground = colors.backgroundColor;
            const textColor = colors.primaryColor;
            
            if (this.gridVisible) {
                btn.style.background = enabledBackground;
                btn.style.color = '#ffffff'; // White text on colored background
                btn.style.borderColor = enabledBackground;
                btn.innerHTML = '<i class="fas fa-border-all"></i>';
                btn.title = 'Hide Coordinate Grid (G)';
            } else {
                btn.style.background = disabledBackground;
                btn.style.color = textColor;
                btn.style.borderColor = textColor;
                btn.innerHTML = '<i class="fas fa-border-none"></i>';
                btn.title = 'Show Coordinate Grid (G)';
            }
        }
    }
    
    initCustomToolbar() {
        // Create toolbar container
        const toolbar = document.createElement('div');
        toolbar.className = 'radar-toolbar';
        toolbar.id = 'radar-toolbar';
        
        // Create toolbar buttons
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'toolbar-btn';
        zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
        zoomInBtn.title = 'Zoom In (+)';
        zoomInBtn.addEventListener('click', () => {
            this.map.zoomIn();
        });
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'toolbar-btn';
        zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
        zoomOutBtn.title = 'Zoom Out (-)';
        zoomOutBtn.addEventListener('click', () => {
            this.map.zoomOut();
        });
        
        const homeBtn = document.createElement('button');
        homeBtn.className = 'toolbar-btn';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        homeBtn.title = 'Reset View (H)';
        homeBtn.addEventListener('click', () => {
            this.map.setView([20, 0], 3);
        });
        
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'toolbar-btn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Toggle Fullscreen (Shift+F)';
        fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        const layersBtn = document.createElement('button');
        layersBtn.className = 'toolbar-btn';
        layersBtn.innerHTML = '<i class="fas fa-layer-group"></i>';
        layersBtn.title = 'Cycle Map Layers (L)';
        layersBtn.id = 'layers-btn';
        layersBtn.addEventListener('click', () => {
            this.cycleTileLayer();
        });
        
        const centerBtn = document.createElement('button');
        centerBtn.className = 'toolbar-btn';
        centerBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
        centerBtn.title = 'Center on Aircraft (C)';
        centerBtn.addEventListener('click', () => {
            this.centerOnAircraft();
        });
        
        const aircraftListBtn = document.createElement('button');
        aircraftListBtn.className = 'toolbar-btn';
        aircraftListBtn.innerHTML = '<i class="fas fa-list"></i>';
        aircraftListBtn.title = 'Toggle Aircraft List (A)';
        aircraftListBtn.id = 'aircraft-list-btn';
        aircraftListBtn.addEventListener('click', () => {
            this.toggleAircraftList();
        });
        
        const groupFilterBtn = document.createElement('button');
        groupFilterBtn.className = 'toolbar-btn';
        groupFilterBtn.innerHTML = '<i class="fas fa-filter"></i>';
        groupFilterBtn.title = 'Filter by Group (F)';
        groupFilterBtn.id = 'group-filter-btn';
        
        // Store direct reference to the button
        this.groupFilterButton = groupFilterBtn;
        
        groupFilterBtn.addEventListener('click', () => {
            this.toggleGroupFilter();
        });
        
        const gridBtn = document.createElement('button');
        gridBtn.className = 'toolbar-btn';
        gridBtn.innerHTML = '<i class="fas fa-border-none"></i>';
        gridBtn.title = 'Toggle Coordinate Grid (G)';
        gridBtn.id = 'grid-btn';
        gridBtn.addEventListener('click', () => {
            this.toggleGrid();
        });
        
        const smoothBtn = document.createElement('button');
        smoothBtn.className = 'toolbar-btn';
        smoothBtn.innerHTML = '<i class="fas fa-running"></i>';
        smoothBtn.title = 'Toggle Smooth Movement (S)';
        smoothBtn.id = 'smooth-btn';
        
        // Store direct reference to the button
        this.smoothButton = smoothBtn;
        
        smoothBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSmoothMovement();
        });
        
        const trailsBtn = document.createElement('button');
        trailsBtn.className = 'toolbar-btn';
        trailsBtn.innerHTML = '<i class="fas fa-route"></i>';
        trailsBtn.title = 'Toggle Aircraft Trails (T)';
        trailsBtn.id = 'trails-btn';
        trailsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTrails();
        });
        
        const weatherBtn = document.createElement('button');
        weatherBtn.className = 'toolbar-btn';
        weatherBtn.innerHTML = '<i class="fas fa-cloud-rain"></i>';
        weatherBtn.title = 'Toggle Weather Radar (W)';
        weatherBtn.id = 'weather-btn';
        weatherBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleWeatherRadar();
        });
        
        const mapboxBtn = document.createElement('button');
        mapboxBtn.className = 'toolbar-btn';
        mapboxBtn.innerHTML = '<i class="fas fa-map-marked-alt"></i>';
        mapboxBtn.title = 'MapBox Layers (M)';
        mapboxBtn.id = 'mapbox-btn';
        mapboxBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openMapBoxDialog();
        });
        
        const clearMeasurementsBtn = document.createElement('button');
        clearMeasurementsBtn.className = 'toolbar-btn';
        clearMeasurementsBtn.innerHTML = '<i class="fas fa-eraser"></i>';
        clearMeasurementsBtn.title = 'Clear All Persistent Measurements & Range Rings (X)';
        clearMeasurementsBtn.id = 'clear-measurements-btn';
        clearMeasurementsBtn.addEventListener('click', () => {
            this.clearAllMeasurements();
        });
        
        const paletteBtn = document.createElement('button');
        paletteBtn.className = 'toolbar-btn';
        paletteBtn.innerHTML = '<i class="fas fa-palette"></i>';
        paletteBtn.title = 'Color Scheme (P)';
        paletteBtn.id = 'palette-btn';
        paletteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openColorSchemeDialog();
        });
        
        // Add drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'toolbar-drag-handle';
        dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
        dragHandle.title = 'Drag to move toolbar';
        
        // Append elements to toolbar
        toolbar.appendChild(dragHandle);
        toolbar.appendChild(zoomInBtn);
        toolbar.appendChild(zoomOutBtn);
        
        // Add separator - Zoom controls
        const separator1 = document.createElement('div');
        separator1.className = 'toolbar-separator';
        toolbar.appendChild(separator1);
        
        // Navigation & View group
        const navGroup = this.createToolbarGroup('nav', 'compass', 'Navigation', [homeBtn, centerBtn, fullscreenBtn]);
        toolbar.appendChild(navGroup);
        
        // Data & Filters group
        const dataGroup = this.createToolbarGroup('data', 'database', 'Data & Filters', [aircraftListBtn, groupFilterBtn]);
        toolbar.appendChild(dataGroup);
        
        // Display Options group
        const displayGroup = this.createToolbarGroup('display', 'eye', 'Display', [gridBtn, trailsBtn, weatherBtn]);
        toolbar.appendChild(displayGroup);
        
        // Movement & Tools group
        const toolsGroup = this.createToolbarGroup('tools', 'wrench', 'Tools', [smoothBtn, clearMeasurementsBtn]);
        toolbar.appendChild(toolsGroup);
        
        // Map Layers & Appearance group
        const layersGroup = this.createToolbarGroup('layers', 'map', 'Layers', [layersBtn, mapboxBtn, paletteBtn]);
        toolbar.appendChild(layersGroup);
        
        // Add toolbar to the radar container
        document.querySelector('.radar-container').appendChild(toolbar);
        
        // Make toolbar draggable
        this.makeDraggable(toolbar, dragHandle);
        
        // Initialize button appearances
        this.updateLayersButton();
        this.updateGridButton();
        this.updateSmoothButton();
        this.updateTrailsButton();
        this.updateWeatherButton();
        this.updateGroupFilterButton(); // Update filter button based on URL params/saved state
        
        // Load expanded groups state
        this.loadToolbarGroupsState();
    }
    
    createToolbarGroup(groupId, iconName, title, childButtons) {
        const group = document.createElement('div');
        group.className = 'toolbar-group';
        group.dataset.group = groupId;
        
        // Create parent button
        const parentBtn = document.createElement('button');
        parentBtn.className = 'toolbar-btn toolbar-group-parent';
        parentBtn.innerHTML = `<i class="fas fa-${iconName}"></i>`;
        parentBtn.title = title;
        parentBtn.addEventListener('click', (e) => {
            this.toggleToolbarGroup(groupId, parentBtn);
            e.stopPropagation();
        });
        
        group.appendChild(parentBtn);
        
        // Store child buttons data on the group
        group.childButtonsData = childButtons;
        
        return group;
    }
    
    toggleToolbarGroup(groupId, parentBtn) {
        const group = document.querySelector(`.toolbar-group[data-group="${groupId}"]`);
        if (!group) return;
        
        // Check if already expanded - if so, collapse it
        const existingContainer = document.getElementById(`toolbar-group-popup-${groupId}`);
        if (existingContainer) {
            existingContainer.remove();
            parentBtn.classList.remove('active');
            this.collapsedToolbarSections.delete(groupId);
            this.saveToolbarGroupsState();
            return;
        }
        
        // Close any other open group popups
        document.querySelectorAll('.toolbar-group-popup').forEach(popup => popup.remove());
        document.querySelectorAll('.toolbar-group-parent.active').forEach(btn => btn.classList.remove('active'));
        
        // Create floating container
        const popup = document.createElement('div');
        popup.className = 'toolbar-group-popup';
        popup.id = `toolbar-group-popup-${groupId}`;
        
        // Get child buttons from stored data and append the actual buttons (not clones)
        const childButtons = group.childButtonsData;
        childButtons.forEach(btn => {
            popup.appendChild(btn);
        });
        
        // Add to body
        document.body.appendChild(popup);
        
        // Position the popup based on toolbar location
        this.positionGroupPopup(popup, parentBtn);
        
        // Mark parent as active
        parentBtn.classList.add('active');
        
        // Save state
        this.collapsedToolbarSections.add(groupId);
        this.saveToolbarGroupsState();
        
        // Close popup when clicking outside
        const closeHandler = (e) => {
            if (!popup.contains(e.target) && !parentBtn.contains(e.target)) {
                popup.remove();
                parentBtn.classList.remove('active');
                this.collapsedToolbarSections.delete(groupId);
                this.saveToolbarGroupsState();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 100);
    }
    
    positionGroupPopup(popup, parentBtn) {
        // Get parent button position
        const btnRect = parentBtn.getBoundingClientRect();
        const toolbar = document.querySelector('.radar-toolbar');
        const toolbarRect = toolbar.getBoundingClientRect();
        
        // Determine if toolbar is on left or right side of screen
        const screenWidth = window.innerWidth;
        const toolbarOnRight = toolbarRect.left > screenWidth / 2;
        
        // Position popup next to the toolbar
        if (toolbarOnRight) {
            // Toolbar on right - show popup to the left
            popup.style.right = `${screenWidth - toolbarRect.left + 10}px`;
            popup.style.left = 'auto';
        } else {
            // Toolbar on left - show popup to the right
            popup.style.left = `${toolbarRect.right + 10}px`;
            popup.style.right = 'auto';
        }
        
        // Vertically align with the parent button (accounting for popup padding)
        const popupStyles = getComputedStyle(popup);
        const popupPadding = parseInt(popupStyles.paddingTop) || 0;
        popup.style.top = `${btnRect.top - popupPadding}px`;
    }
    
    saveToolbarGroupsState() {
        try {
            localStorage.setItem('toolbarExpandedGroups', JSON.stringify(Array.from(this.collapsedToolbarSections)));
        } catch (e) {
            console.error('Failed to save toolbar groups state:', e);
        }
    }
    
    loadToolbarGroupsState() {
        try {
            const saved = localStorage.getItem('toolbarExpandedGroups');
            if (saved) {
                const expanded = JSON.parse(saved);
                if (Array.isArray(expanded)) {
                    expanded.forEach(groupId => {
                        this.collapsedToolbarSections.add(groupId);
                        // Apply expanded state
                        const group = document.querySelector(`.toolbar-group[data-group="${groupId}"]`);
                        if (group) {
                            const childContainer = group.querySelector('.toolbar-group-children');
                            const parentBtn = group.querySelector('.toolbar-group-parent');
                            childContainer.classList.add('expanded');
                            group.classList.add('expanded');
                            parentBtn.classList.add('active');
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load toolbar groups state:', e);
        }
    }
    
    makeDraggable(element, handle) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;
        
        const startDrag = (event) => {
            isDragging = true;
            startX = event.clientX;
            startY = event.clientY;
            
            // Get the current computed position
            const rect = element.getBoundingClientRect();
            
            // Convert from right/transform positioning to left/top positioning
            element.style.right = 'auto';
            element.style.transform = 'none';
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';
            element.style.position = 'absolute';
            
            // Store the current position as initial for dragging calculations
            initialX = rect.left;
            initialY = rect.top;
            
            element.classList.add('dragging');
            element.style.cursor = 'grabbing';
            handle.style.cursor = 'grabbing';
            
            // Prevent default to avoid text selection
            event.preventDefault();
        };
        
        const handleDrag = (event) => {
            if (!isDragging) return;
            
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            
            const newX = initialX + deltaX;
            const newY = initialY + deltaY;
            
            // Keep toolbar within viewport bounds
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(maxX, newX));
            const constrainedY = Math.max(0, Math.min(maxY, newY));
            
            element.style.left = constrainedX + 'px';
            element.style.top = constrainedY + 'px';
        };
        
        const endDrag = () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                element.style.cursor = 'default';
                handle.style.cursor = 'grab';
            }
        };
        
        // Mouse events
        handle.addEventListener('mousedown', startDrag);
        
        // Touch events for mobile
        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startDrag(touch);
        });
        
        document.addEventListener('mousemove', handleDrag);
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleDrag(touch);
            }
        });
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if not typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case '+':
                case '=':
                    this.map.zoomIn();
                    e.preventDefault();
                    break;
                case '-':
                    this.map.zoomOut();
                    e.preventDefault();
                    break;
                case 'h':
                case 'H':
                    this.map.setView([39.8283, -98.5795], 4);
                    e.preventDefault();
                    break;
                case 'c':
                case 'C':
                    this.centerOnAircraft();
                    e.preventDefault();
                    break;
                case 'l':
                case 'L':
                    this.cycleTileLayer();
                    e.preventDefault();
                    break;
                case 'a':
                case 'A':
                    this.toggleAircraftList();
                    e.preventDefault();
                    break;
                case 'g':
                case 'G':
                    this.toggleGrid();
                    e.preventDefault();
                    break;
                case 's':
                case 'S':
                    this.toggleSmoothMovement();
                    e.preventDefault();
                    break;
                case 't':
                case 'T':
                    this.toggleTrails();
                    e.preventDefault();
                    break;
                case 'w':
                case 'W':
                    this.toggleWeatherRadar();
                    e.preventDefault();
                    break;
                case 'm':
                case 'M':
                    this.openMapBoxDialog();
                    e.preventDefault();
                    break;
                case 'p':
                case 'P':
                    this.openColorSchemeDialog();
                    e.preventDefault();
                    break;
                case 'x':
                case 'X':
                    this.clearAllMeasurements();
                    e.preventDefault();
                    break;
                case 'f':
                case 'F':
                    if (e.shiftKey) {
                        this.toggleFullscreen();
                        e.preventDefault();
                    } else {
                        this.toggleGroupFilter();
                        e.preventDefault();
                    }
                    break;
            }
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.log('Error attempting to exit fullscreen:', err);
            });
        }
    }
    
    cycleTileLayer() {
        // Open tile layer selection dialog instead of cycling
        this.openTileLayerDialog();
    }
    
    // Add method to jump directly to a layer by index (for testing)
    setTileLayer(index) {
        if (index >= 0 && index < this.tileLayers.length) {
            this.currentTileLayerIndex = index;
            this.loadTileLayer(this.currentTileLayerIndex);
            this.showLayerNotification();
            console.log(`Jumped to layer ${this.currentTileLayerIndex + 1}/${this.tileLayers.length}: ${this.tileLayers[this.currentTileLayerIndex].name}`);
        } else {
            console.log(`Invalid layer index. Valid range: 0-${this.tileLayers.length - 1}`);
        }
    }
    
    showLayerNotification() {
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        
        // Create or update notification
        let notification = document.getElementById('layer-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'layer-notification';
            notification.className = 'layer-notification';
            document.querySelector('.radar-container').appendChild(notification);
        }
        
        notification.innerHTML = `
            <div style="font-weight: bold;">Map Layer ${this.currentTileLayerIndex + 1}/${this.tileLayers.length}: ${currentLayer.name}</div>
            <div style="font-size: 12px; margin-top: 2px;">
                Aircraft Color: <span style="color: ${currentLayer.aircraftColor};">●</span> ${currentLayer.aircraftColor}
            </div>
            <div style="font-size: 12px; margin-top: 1px;">
                Label Background: <span style="background: ${currentLayer.labelBackground}; padding: 2px 4px; border-radius: 2px; color: ${currentLayer.aircraftColor};">ABC</span> 
            </div>
            <div style="font-size: 12px; margin-top: 1px;">
                URL: ${currentLayer.url ? 'Loading tiles...' : 'No tiles (No Map mode)'}
            </div>
        `;
        notification.style.opacity = '1';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 2000);
    }
    
    centerOnAircraft() {
        // Center map on the first aircraft found, or all aircraft if multiple
        if (this.aircraftMarkers.size === 0) {
            console.log('No aircraft to center on');
            return;
        }
        
        if (this.aircraftMarkers.size === 1) {
            // Single aircraft - center on it
            const marker = this.aircraftMarkers.values().next().value;
            this.map.setView(marker.getLatLng(), Math.max(this.map.getZoom(), 8));
        } else {
            // Multiple aircraft - fit all in view
            const group = new L.featureGroup(Array.from(this.aircraftMarkers.values()));
            this.map.fitBounds(group.getBounds(), {padding: [20, 20]});
        }
    }
    
    toggleAircraftList() {
        this.aircraftListVisible = !this.aircraftListVisible;
        
        if (this.aircraftListVisible) {
            this.showAircraftList();
        } else {
            this.hideAircraftList();
        }
        
        // Update button appearance
        this.updateAircraftListButton();
    }
    
    showAircraftList() {
        if (!this.aircraftListTable) {
            this.createAircraftListTable();
        }
        
        this.aircraftListTable.style.display = 'block';
        this.updateAircraftListData();
    }
    
    hideAircraftList() {
        if (this.aircraftListTable) {
            this.aircraftListTable.style.display = 'none';
        }
    }
    
    createAircraftListTable() {
        // Create the main container
        const container = document.createElement('div');
        container.className = 'aircraft-list-container';
        container.id = 'aircraft-list-container';
        
        // Create header with drag handle
        const header = document.createElement('div');
        header.className = 'aircraft-list-header';
        
        const dragHandle = document.createElement('div');
        dragHandle.className = 'aircraft-list-drag-handle';
        dragHandle.innerHTML = '<i class="fas fa-grip-horizontal"></i>';
        
        const title = document.createElement('div');
        title.className = 'aircraft-list-title';
        title.textContent = 'Aircraft List';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'aircraft-list-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => {
            this.toggleAircraftList();
        });
        
        header.appendChild(dragHandle);
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'aircraft-list-table-container';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'aircraft-list-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['', '', 'Callsign', 'Pilot', 'Aircraft', 'Altitude', 'Speed'];
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            if (index === 0) {
                // Visibility column header with icon
                const visIcon = document.createElement('i');
                visIcon.className = 'fas fa-plane';
                visIcon.title = 'Toggle Visibility';
                th.appendChild(visIcon);
                th.className = 'visibility-column-header';
            } else if (index === 1) {
                // Track column header with icon
                const trackIcon = document.createElement('i');
                trackIcon.className = 'fas fa-crosshairs';
                trackIcon.title = 'Track Aircraft';
                th.appendChild(trackIcon);
                th.className = 'track-column-header';
            } else {
                th.textContent = headerText;
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        tbody.id = 'aircraft-list-tbody';
        table.appendChild(tbody);
        
        tableContainer.appendChild(table);
        container.appendChild(header);
        container.appendChild(tableContainer);
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'aircraft-list-resize-handle';
        resizeHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
        container.appendChild(resizeHandle);
        
        // Add to radar container
        document.querySelector('.radar-container').appendChild(container);
        
        // Make draggable
        this.makeDraggable(container, dragHandle);
        
        // Make resizable
        this.makeResizable(container, resizeHandle);
        
        this.aircraftListTable = container;
    }
    
    makeResizable(element, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            e.preventDefault();
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(400, startWidth + deltaX);
            const newHeight = Math.max(200, startHeight + deltaY);
            
            element.style.width = newWidth + 'px';
            element.style.minWidth = newWidth + 'px';
            element.style.maxWidth = newWidth + 'px';
            
            const tableContainer = element.querySelector('.aircraft-list-table-container');
            if (tableContainer) {
                tableContainer.style.maxHeight = (newHeight - 60) + 'px';
            }
        };
        
        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    updateAircraftListData() {
        if (!this.aircraftListTable || !this.aircraftListVisible) return;
        
        const tbody = document.getElementById('aircraft-list-tbody');
        if (!tbody) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Use existing aircraft markers data
        if (this.aircraftMarkers.size > 0) {
            // Convert markers to array and sort by callsign
            const aircraftArray = Array.from(this.aircraftMarkers.entries()).map(([callsign, marker]) => {
                return marker.aircraftData; // Get the stored aircraft data from the marker
            }).filter(data => data) // Filter out any undefined data
              .sort((a, b) => a.callsign.localeCompare(b.callsign));
            
            aircraftArray.forEach(aircraft => {
                const row = document.createElement('tr');
                row.className = 'aircraft-row';
                row.setAttribute('data-callsign', aircraft.callsign);
                
                // Check if aircraft is hidden
                const isHidden = this.hiddenAircraft.has(aircraft.callsign);
                if (isHidden) {
                    row.classList.add('aircraft-hidden');
                }
                
                // Add click handler to zoom to aircraft (excluding icons)
                row.addEventListener('click', (e) => {
                    // Don't zoom if clicking on the visibility or track icons
                    if (!e.target.closest('.visibility-icon') && !e.target.closest('.track-icon')) {
                        this.zoomToAircraft(aircraft.callsign);
                    }
                });
                
                // Visibility toggle icon
                const visibilityCell = document.createElement('td');
                visibilityCell.className = 'visibility-cell';
                const visibilityIcon = document.createElement('i');
                visibilityIcon.className = isHidden ? 'fas fa-plane-slash visibility-icon' : 'fas fa-plane visibility-icon';
                visibilityIcon.setAttribute('data-callsign', aircraft.callsign);
                visibilityIcon.title = isHidden ? `Show ${aircraft.callsign} on radar` : `Hide ${aircraft.callsign} from radar`;
                
                visibilityIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row click
                    this.toggleAircraftVisibility(aircraft.callsign);
                });
                visibilityCell.appendChild(visibilityIcon);
                row.appendChild(visibilityCell);
                
                // Track icon
                const trackCell = document.createElement('td');
                trackCell.className = 'track-cell';
                const trackIcon = document.createElement('i');
                trackIcon.className = 'fas fa-crosshairs track-icon';
                trackIcon.setAttribute('data-callsign', aircraft.callsign);
                
                // Check if this aircraft is currently being tracked
                const isTracked = this.isTrackingEnabled && this.trackedCallsign === aircraft.callsign.toUpperCase();
                if (isTracked) {
                    trackIcon.classList.add('tracking');
                    trackIcon.title = `Stop tracking ${aircraft.callsign}`;
                } else {
                    trackIcon.title = `Track ${aircraft.callsign}`;
                }
                
                trackIcon.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent row click
                    
                    // If this aircraft is currently being tracked, stop tracking
                    if (this.isTrackingEnabled && this.trackedCallsign === aircraft.callsign.toUpperCase()) {
                        this.stopTracking();
                    } else {
                        // Start tracking this aircraft
                        this.startTrackingAircraft(aircraft.callsign);
                    }
                });
                trackCell.appendChild(trackIcon);
                row.appendChild(trackCell);
                
                // Callsign
                const callsignCell = document.createElement('td');
                callsignCell.textContent = aircraft.callsign;
                callsignCell.className = 'callsign-cell';
                row.appendChild(callsignCell);
                
                // Pilot Name
                const pilotCell = document.createElement('td');
                pilotCell.textContent = aircraft.pilot_name;
                row.appendChild(pilotCell);
                
                // Aircraft Type
                const aircraftCell = document.createElement('td');
                aircraftCell.textContent = aircraft.aircraft_type;
                row.appendChild(aircraftCell);
                
                // Altitude
                const altitudeCell = document.createElement('td');
                altitudeCell.textContent = Math.round(aircraft.altitude).toLocaleString() + ' ft';
                altitudeCell.className = 'number-cell';
                row.appendChild(altitudeCell);
                
                // Speed
                const speedCell = document.createElement('td');
                speedCell.textContent = Math.round(aircraft.groundspeed) + ' kts';
                speedCell.className = 'number-cell';
                row.appendChild(speedCell);
                
                tbody.appendChild(row);
            });
        } else {
            // No aircraft found
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7; // Updated to 7 columns (visibility + track columns)
            cell.textContent = 'No aircraft online';
            cell.className = 'no-aircraft-cell';
            row.appendChild(cell);
            tbody.appendChild(row);
        }
        
        // Update tracking icon highlights after table is populated
        this.updateTrackingIconHighlights();
    }
    
    toggleAircraftVisibility(callsign) {
        const isCurrentlyHidden = this.hiddenAircraft.has(callsign);
        
        if (isCurrentlyHidden) {
            // Show the aircraft
            this.hiddenAircraft.delete(callsign);
        } else {
            // Hide the aircraft
            this.hiddenAircraft.add(callsign);
        }
        
        // Apply the visibility state
        this.applyAircraftVisibility(callsign);
        
        // Update the aircraft list row immediately
        const row = document.querySelector(`.aircraft-row[data-callsign="${callsign}"]`);
        if (row) {
            const visibilityIcon = row.querySelector('.visibility-icon');
            
            if (isCurrentlyHidden) {
                // Aircraft is now visible
                row.classList.remove('aircraft-hidden');
                if (visibilityIcon) {
                    visibilityIcon.className = 'fas fa-plane visibility-icon';
                    visibilityIcon.title = `Hide ${callsign} from radar`;
                }
            } else {
                // Aircraft is now hidden
                row.classList.add('aircraft-hidden');
                if (visibilityIcon) {
                    visibilityIcon.className = 'fas fa-plane-slash visibility-icon';
                    visibilityIcon.title = `Show ${callsign} on radar`;
                }
            }
        }
    }
    
    applyAircraftVisibility(callsign) {
        // Centralized function to apply visibility state to all aircraft elements
        const isHidden = this.hiddenAircraft.has(callsign);
        const marker = this.aircraftMarkers.get(callsign);
        const labelGroup = this.labelLayers.get(callsign);
        const headingLine = this.headingLines.get(callsign);
        
        console.log(`Applying visibility for ${callsign}: hidden=${isHidden}`);
        
        // Apply to marker
        if (marker) {
            if (isHidden) {
                if (this.map.hasLayer(marker)) {
                    this.map.removeLayer(marker);
                }
            } else {
                if (!this.map.hasLayer(marker)) {
                    marker.addTo(this.map);
                }
            }
        }
        
        // Apply to label and connecting line
        if (labelGroup) {
            if (isHidden) {
                if (this.map.hasLayer(labelGroup)) {
                    this.map.removeLayer(labelGroup);
                }
            } else {
                if (!this.map.hasLayer(labelGroup)) {
                    labelGroup.addTo(this.map);
                }
            }
        }
        
        // Apply to heading line
        if (headingLine) {
            if (isHidden) {
                if (this.map.hasLayer(headingLine)) {
                    this.map.removeLayer(headingLine);
                }
            } else {
                if (!this.map.hasLayer(headingLine)) {
                    headingLine.addTo(this.map);
                }
            }
        }
        
        // Apply to trail
        if (isHidden) {
            // Hide trail by removing it
            if (this.trailLayers.has(callsign)) {
                const trailMarkers = this.trailLayers.get(callsign);
                trailMarkers.forEach(marker => {
                    this.trailLayer.removeLayer(marker);
                });
            }
        } else {
            // Show trail by redrawing it
            this.drawAircraftTrail(callsign);
        }
    }
    
    zoomToAircraft(callsign) {
        const marker = this.aircraftMarkers.get(callsign);
        if (marker) {
            const position = marker.getLatLng();
            this.map.flyTo(position, Math.max(this.map.getZoom(), 10), {
                animate: true,
                duration: 1.5
            });
            
            // Highlight the aircraft temporarily
            marker.getElement().style.animation = 'aircraftHighlight 2s ease-in-out';
            setTimeout(() => {
                if (marker.getElement()) {
                    marker.getElement().style.animation = '';
                }
            }, 2000);
        }
    }
    
    updateAircraftListButton() {
        const btn = document.getElementById('aircraft-list-btn');
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledBackground = colors.accentColor;
            const disabledBackground = colors.backgroundColor;
            const textColor = colors.primaryColor;
            
            if (this.aircraftListVisible) {
                btn.style.background = enabledBackground;
                btn.style.color = '#ffffff'; // White text on colored background
                btn.style.borderColor = enabledBackground;
                btn.innerHTML = '<i class="fas fa-list-check"></i>';
                btn.title = 'Hide Aircraft List (A)';
            } else {
                btn.style.background = disabledBackground;
                btn.style.color = textColor;
                btn.style.borderColor = textColor;
                btn.innerHTML = '<i class="fas fa-list"></i>';
                btn.title = 'Show Aircraft List (A)';
            }
        }
    }
    
    toggleGroupFilter() {
        this.groupFilterVisible = !this.groupFilterVisible;
        
        if (this.groupFilterVisible) {
            this.showGroupFilter();
        } else {
            this.hideGroupFilter();
        }
        
        // Update button appearance
        this.updateGroupFilterButton();
    }
    
    showGroupFilter() {
        if (!this.groupFilterPanel) {
            this.createGroupFilterPanel();
        }
        
        this.groupFilterPanel.style.display = 'block';
        this.updateGroupFilterData();
    }
    
    hideGroupFilter() {
        if (this.groupFilterPanel) {
            this.groupFilterPanel.style.display = 'none';
        }
    }
    
    createGroupFilterPanel() {
        // Create the main container
        const container = document.createElement('div');
        container.className = 'group-filter-container';
        container.id = 'group-filter-container';
        
        // Create header with drag handle
        const header = document.createElement('div');
        header.className = 'group-filter-header';
        
        const dragHandle = document.createElement('div');
        dragHandle.className = 'group-filter-drag-handle';
        dragHandle.innerHTML = '<i class="fas fa-grip-horizontal"></i>';
        
        const title = document.createElement('div');
        title.className = 'group-filter-title';
        title.textContent = 'Filter by Group';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'group-filter-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => {
            this.toggleGroupFilter();
        });
        
        header.appendChild(dragHandle);
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'group-filter-content';
        content.id = 'group-filter-content';
        
        // Create controls row
        const controls = document.createElement('div');
        controls.className = 'group-filter-controls';
        
        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'group-filter-control-btn';
        selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i> All';
        selectAllBtn.title = 'Select all groups';
        selectAllBtn.addEventListener('click', () => {
            this.selectAllGroups();
        });
        
        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'group-filter-control-btn';
        clearAllBtn.innerHTML = '<i class="fas fa-times-circle"></i> None';
        clearAllBtn.title = 'Clear all filters';
        clearAllBtn.addEventListener('click', () => {
            this.clearAllGroups();
        });
        
        controls.appendChild(selectAllBtn);
        controls.appendChild(clearAllBtn);
        
        // Create groups list
        const groupsList = document.createElement('div');
        groupsList.className = 'group-filter-list';
        groupsList.id = 'group-filter-list';
        
        content.appendChild(controls);
        content.appendChild(groupsList);
        
        container.appendChild(header);
        container.appendChild(content);
        
        // Add to document
        document.body.appendChild(container);
        
        // Make draggable
        this.makeDraggable(container, dragHandle);
        
        this.groupFilterPanel = container;
    }
    
    updateGroupFilterData() {
        const groupsList = document.getElementById('group-filter-list');
        if (!groupsList) return;
        
        // Get all unique groups from current aircraft
        const groups = this.getAllGroups();
        
        // Clear existing list
        groupsList.innerHTML = '';
        
        if (groups.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'group-filter-empty';
            emptyMsg.textContent = 'No aircraft groups available';
            groupsList.appendChild(emptyMsg);
            return;
        }
        
        // Create checkbox for each group
        groups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'group-filter-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `group-filter-${group}`;
            checkbox.value = group;
            checkbox.className = 'group-filter-checkbox';
            
            // Check if this group is selected
            // __ALL__ marker means all selected, empty set means none selected
            const showAll = this.selectedGroups.has('__ALL__');
            checkbox.checked = showAll || this.selectedGroups.has(group);
            
            checkbox.addEventListener('change', (e) => {
                this.toggleGroupSelection(group, e.target.checked);
            });
            
            const label = document.createElement('label');
            label.htmlFor = `group-filter-${group}`;
            label.className = 'group-filter-label';
            label.textContent = group || '(No Group)';
            
            item.appendChild(checkbox);
            item.appendChild(label);
            groupsList.appendChild(item);
        });
    }
    
    getAllGroups() {
        // Get unique groups from all aircraft markers
        const groups = new Set();
        
        for (const [callsign, marker] of this.aircraftMarkers) {
            // Get aircraft data from the marker's options or fetch current data
            const aircraft = marker.options.aircraftData;
            if (aircraft && aircraft.group_name) {
                groups.add(aircraft.group_name);
            }
        }
        
        return Array.from(groups).sort();
    }
    
    toggleGroupSelection(group, isSelected) {
        const allGroups = this.getAllGroups();
        
        // If currently showing all (__ALL__ marker), expand to actual group list first
        if (this.selectedGroups.has('__ALL__')) {
            this.selectedGroups.clear();
            allGroups.forEach(g => this.selectedGroups.add(g));
        }
        
        if (isSelected) {
            this.selectedGroups.add(group);
            // If all groups are now selected, use __ALL__ marker
            if (this.selectedGroups.size === allGroups.length) {
                this.selectedGroups.clear();
                this.selectedGroups.add('__ALL__');
            }
        } else {
            this.selectedGroups.delete(group);
            // Empty set means no groups selected (hide all)
        }
        
        // Save the selection
        this.saveGroupFilterSelections();
        
        // Apply the filter immediately
        this.applyGroupFilter();
        this.updateGroupFilterButton();
    }
    
    selectAllGroups() {
        // __ALL__ marker means show all groups
        this.selectedGroups.clear();
        this.selectedGroups.add('__ALL__');
        
        // Update all checkboxes
        const checkboxes = document.querySelectorAll('.group-filter-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        
        // Save the selection
        this.saveGroupFilterSelections();
        
        // Apply filter immediately
        this.applyGroupFilter();
        this.updateGroupFilterButton();
    }
    
    clearAllGroups() {
        // Empty set means no groups selected (hide all)
        this.selectedGroups.clear();
        
        // Update all checkboxes
        const checkboxes = document.querySelectorAll('.group-filter-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        
        // Save the selection
        this.saveGroupFilterSelections();
        
        // Apply filter immediately (will hide all aircraft)
        this.applyGroupFilter();
        this.updateGroupFilterButton();
    }
    
    applyGroupFilter() {
        // Apply group filter to all aircraft
        // __ALL__ marker = show all, empty set = hide all, specific groups = filter
        const showAll = this.selectedGroups.has('__ALL__');
        const hideAll = this.selectedGroups.size === 0;
        
        for (const [callsign, marker] of this.aircraftMarkers) {
            const aircraft = marker.options.aircraftData;
            if (aircraft) {
                let shouldShow;
                
                if (showAll) {
                    // Show all aircraft
                    shouldShow = true;
                } else if (hideAll) {
                    // Hide all aircraft (no groups selected)
                    shouldShow = false;
                } else {
                    // Check if this aircraft's group is selected
                    shouldShow = this.selectedGroups.has(aircraft.group_name);
                }
                
                if (shouldShow) {
                    // Don't override manual hiding
                    if (!this.hiddenAircraft.has(callsign)) {
                        this.showAircraftElement(callsign);
                    }
                } else {
                    // Hide due to group filter
                    this.hideAircraftElement(callsign);
                }
            }
        }
        
        console.log(`Group filter applied: ${showAll ? 'showing all groups' : (hideAll ? 'hiding all' : `showing ${this.selectedGroups.size} groups`)}`);
        
        // Update button state after applying filter
        this.updateGroupFilterButton();
    }
    
    showAircraftElement(callsign) {
        const marker = this.aircraftMarkers.get(callsign);
        const labelGroup = this.labelLayers.get(callsign);
        const headingLine = this.headingLines.get(callsign);
        
        if (marker && !this.map.hasLayer(marker)) {
            marker.addTo(this.map);
        }
        
        if (labelGroup && !this.map.hasLayer(labelGroup)) {
            const zoom = this.map.getZoom();
            if (zoom >= 6) { // Respect zoom level for labels
                labelGroup.addTo(this.map);
            }
        }
        
        if (headingLine && !this.map.hasLayer(headingLine)) {
            headingLine.addTo(this.map);
        }
    }
    
    hideAircraftElement(callsign) {
        const marker = this.aircraftMarkers.get(callsign);
        const labelGroup = this.labelLayers.get(callsign);
        const headingLine = this.headingLines.get(callsign);
        
        if (marker && this.map.hasLayer(marker)) {
            this.map.removeLayer(marker);
        }
        
        if (labelGroup && this.map.hasLayer(labelGroup)) {
            this.map.removeLayer(labelGroup);
        }
        
        if (headingLine && this.map.hasLayer(headingLine)) {
            this.map.removeLayer(headingLine);
        }
    }
    
    updateGroupFilterButton() {
        const btn = this.groupFilterButton;
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const showAll = this.selectedGroups.has('__ALL__');
            const hideAll = this.selectedGroups.size === 0;
            const allGroups = this.getAllGroups();
            const totalGroups = allGroups.length;
            
            // Count selected groups (excluding __ALL__ marker)
            let selectedCount = this.selectedGroups.size;
            if (showAll) selectedCount = totalGroups;
            
            // Active filters = some groups selected but not all
            const activeFilters = !showAll && !hideAll && selectedCount > 0;
            
            if (this.groupFilterVisible) {
                btn.style.background = colors.accentColor;
                btn.style.color = '#ffffff';
                btn.style.borderColor = colors.accentColor;
                btn.title = 'Hide Group Filter (F)';
            } else if (hideAll) {
                // Show red when hiding all (no groups selected)
                btn.style.background = 'rgba(255, 0, 0, 0.8)';
                btn.style.color = '#ffffff';
                btn.style.borderColor = '#ff0000';
                btn.title = 'Hiding all aircraft (F)';
            } else if (activeFilters) {
                // Show orange when filters are active but panel is closed
                btn.style.background = 'rgba(255, 165, 0, 0.8)';
                btn.style.color = '#ffffff';
                btn.style.borderColor = '#ff8c00';
                btn.title = `Filtering ${selectedCount} of ${totalGroups} groups (F)`;
            } else {
                btn.style.background = colors.backgroundColor;
                btn.style.color = colors.primaryColor;
                btn.style.borderColor = colors.primaryColor;
                btn.title = 'Filter by Group (F)';
            }
        }
    }
    
    toggleSmoothMovement() {
        this.smoothMovementEnabled = !this.smoothMovementEnabled;
        
        // Update the button appearance
        this.updateSmoothButton();
        
        if (this.smoothMovementEnabled) {
            // Start smooth movement if there are aircraft
            if (this.aircraftMarkers.size > 0 && !this.interpolationTimer) {
                this.startSmoothMovement();
            }
        } else {
            // Stop smooth movement
            this.stopSmoothMovement();
            
            // Snap all aircraft to their target positions and ensure they update correctly
            for (const [callsign, positionData] of this.aircraftPositions) {
                const marker = this.aircraftMarkers.get(callsign);
                if (marker && positionData) {
                    // Move marker to target position
                    marker.setLatLng([positionData.targetLat, positionData.targetLng]);
                    // Update current position to match target
                    positionData.currentLat = positionData.targetLat;
                    positionData.currentLng = positionData.targetLng;
                    
                    // Update label position to match new aircraft position
                    this.updateLabelPositionForMovement(callsign, [positionData.targetLat, positionData.targetLng]);
                }
            }
        }
        
        console.log(`Smooth movement ${this.smoothMovementEnabled ? 'enabled' : 'disabled'}`);
    }
    
    toggleTrails() {
        this.trailsEnabled = !this.trailsEnabled;
        
        // Update the button appearance
        this.updateTrailsButton();
        
        if (this.trailsEnabled) {
            // Redraw all existing trails
            for (const callsign of this.aircraftTrails.keys()) {
                this.drawAircraftTrail(callsign);
            }
        } else {
            // Clear all trail markers from display
            for (const [callsign, markers] of this.trailLayers) {
                markers.forEach(marker => {
                    this.trailLayer.removeLayer(marker);
                });
            }
            this.trailLayers.clear();
        }
        
        console.log(`Aircraft trails ${this.trailsEnabled ? 'enabled' : 'disabled'}`);
    }
    
    updateTrailsButton() {
        const btn = document.getElementById('trails-btn');
        
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledBackground = colors.accentColor;
            const disabledBackground = colors.backgroundColor;
            const textColor = colors.primaryColor;
            
            if (this.trailsEnabled) {
                btn.style.background = enabledBackground;
                btn.style.color = '#ffffff'; // White text on colored background
                btn.style.borderColor = enabledBackground;
                btn.innerHTML = '<i class="fas fa-route"></i>';
                btn.title = 'Disable Aircraft Trails (T)';
            } else {
                btn.style.background = disabledBackground;
                btn.style.color = textColor;
                btn.style.borderColor = textColor;
                btn.innerHTML = '<i class="fas fa-route"></i>';
                btn.title = 'Enable Aircraft Trails (T)';
            }
        }
    }
    
    toggleWeatherRadar() {
        this.weatherRadarEnabled = !this.weatherRadarEnabled;
        
        if (this.weatherRadarEnabled) {
            this.loadWeatherRadar();
        } else {
            this.clearWeatherRadar();
        }
        
        this.updateWeatherButton();
        console.log(`Weather radar ${this.weatherRadarEnabled ? 'enabled' : 'disabled'}`);
    }
    
    updateWeatherButton() {
        const btn = document.getElementById('weather-btn');
        
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledBackground = colors.accentColor;
            const disabledBackground = colors.backgroundColor;
            const textColor = colors.primaryColor;
            
            if (this.weatherRadarEnabled) {
                btn.style.background = enabledBackground;
                btn.style.color = '#ffffff';
                btn.style.borderColor = enabledBackground;
                btn.innerHTML = '<i class="fas fa-cloud-rain"></i>';
                btn.title = 'Disable Weather Radar (W)';
            } else {
                btn.style.background = disabledBackground;
                btn.style.color = textColor;
                btn.style.borderColor = textColor;
                btn.innerHTML = '<i class="fas fa-cloud-rain"></i>';
                btn.title = 'Enable Weather Radar (W)';
            }
        }
    }
    
    async loadWeatherRadar() {
        try {
            // Use RainViewer API for weather radar data
            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();
            
            if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
                const latestRadar = data.radar.past[data.radar.past.length - 1];
                const tileUrl = `https://tilecache.rainviewer.com${latestRadar.path}/256/{z}/{x}/{y}/2/1_1.png`;
                
                // Remove existing weather layer if any
                this.clearWeatherRadar();
                
                // Create new weather radar layer
                this.weatherRadarLayer = L.tileLayer(tileUrl, {
                    opacity: 0.6,
                    attribution: 'Weather data © <a href="https://rainviewer.com">RainViewer</a>',
                    zIndex: 200,
                    tileSize: 256
                });
                
                this.weatherRadarLayer.addTo(this.map);
                
                // Auto-update every 10 minutes
                if (this.weatherRadarUpdateTimer) {
                    clearInterval(this.weatherRadarUpdateTimer);
                }
                this.weatherRadarUpdateTimer = setInterval(() => {
                    if (this.weatherRadarEnabled) {
                        this.loadWeatherRadar();
                    }
                }, 600000); // 10 minutes
                
                console.log('Weather radar loaded');
            }
        } catch (error) {
            console.error('Error loading weather radar:', error);
        }
    }
    
    clearWeatherRadar() {
        if (this.weatherRadarLayer) {
            this.map.removeLayer(this.weatherRadarLayer);
            this.weatherRadarLayer = null;
        }
        
        if (this.weatherRadarUpdateTimer) {
            clearInterval(this.weatherRadarUpdateTimer);
            this.weatherRadarUpdateTimer = null;
        }
    }
    
    updateSmoothButton() {
        const btn = document.getElementById('smooth-btn');
        const status = document.getElementById('smooth-status');
        
        if (btn) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledBackground = colors.accentColor;
            const disabledBackground = colors.backgroundColor;
            const textColor = colors.primaryColor;
            
            if (this.smoothMovementEnabled) {
                btn.style.background = enabledBackground;
                btn.style.color = '#ffffff'; // White text on colored background
                btn.style.borderColor = enabledBackground;
                btn.innerHTML = '<i class="fas fa-running"></i>';
                btn.title = 'Disable Smooth Movement (S)';
            } else {
                btn.style.background = disabledBackground;
                btn.style.color = textColor;
                btn.style.borderColor = textColor;
                btn.innerHTML = '<i class="fas fa-walking"></i>';
                btn.title = 'Enable Smooth Movement (S)';
            }
        }
        
        if (status) {
            status.textContent = this.smoothMovementEnabled ? 'Enabled' : 'Disabled';
            const colors = this.colorSchemes[this.currentColorScheme];
            const enabledColor = colors.primaryColor;
            const disabledColor = colors.accentColor;
            status.style.color = this.smoothMovementEnabled ? enabledColor : disabledColor;
        }
    }
    
    updateLabelContent(callsign, aircraft) {
        // During smooth movement, throttle label content updates to prevent stuttering
        if (this.smoothMovementEnabled) {
            const lastUpdate = this.lastLabelContentUpdate.get(callsign) || 0;
            const now = Date.now();
            
            // Only update label content every 2 seconds during smooth movement to prevent stuttering
            if (now - lastUpdate < 2000) {
                return;
            }
            this.lastLabelContentUpdate.set(callsign, now);
        }
        
        // Update label content with current aircraft data
        if (!this.labelLayers.has(callsign)) return;
        
        const labelGroup = this.labelLayers.get(callsign);
        const layers = labelGroup.getLayers();
        
        if (layers.length >= 2) {
            const labelMarker = layers[1]; // Marker is second
            
            try {
                // Get current color scheme colors
                const colors = this.colorSchemes[this.currentColorScheme];
                const labelTextColor = colors.labelTextColor;
                const labelBackground = colors.labelBackground;
                const labelBorderColor = colors.labelBorderColor;
                const labelLineColor = colors.labelLineColor;
                
                // Create updated label content with dynamic colors
                const updatedLabelText = `
                    <div style="
                        background: ${labelBackground};
                        color: ${labelTextColor};
                        padding: 3px 6px;
                        border: 1px solid ${labelBorderColor};
                        border-radius: 3px;
                        font-family: 'Courier New', monospace;
                        font-size: 10px;
                        white-space: nowrap;
                        box-shadow: 0 0 8px ${labelBorderColor}40;
                        cursor: move;
                    ">
                        <div style="font-weight: bold; font-size: 11px;">${aircraft.callsign}</div>
                        <div style="font-size: 9px; opacity: 0.8; margin-top: 1px;">
                            ${Math.round(aircraft.altitude)}ft • ${Math.round(aircraft.groundspeed)}kts
                        </div>
                    </div>
                `;
                
                // Update the label marker's icon with new content
                const updatedIcon = L.divIcon({
                    className: 'aircraft-label draggable-label',
                    html: updatedLabelText,
                    iconSize: [100, 35],
                    iconAnchor: [50, 17.5] // Center of the label
                });
                
                labelMarker.setIcon(updatedIcon);
                
                // Also update the connecting line color to match the current tile layer
                const labelLine = layers[0]; // Line is first
                if (labelLine instanceof L.Polyline) {
                    labelLine.setStyle({
                        color: labelLineColor,
                        opacity: 0.7,
                        weight: 1
                    });
                }
            } catch (error) {
                console.warn(`Error updating label content for ${callsign}:`, error);
            }
        }
    }
    
    // Measurement Tool Implementation
    
    initMeasurementTool() {
        // Add mouse event listeners for measurement tool and range rings
        this.map.on('mousedown', (e) => {
            if (e.originalEvent.button === 2) { // Right mouse button
                console.log('Right click detected, Shift key:', e.originalEvent.shiftKey, 'CTRL key:', e.originalEvent.ctrlKey);
                if (e.originalEvent.shiftKey) {
                    // Shift + right click = range ring
                    console.log('Starting range ring');
                    this.startRangeRing(e.latlng);
                } else {
                    // Right click = measurement line
                    console.log('Starting measurement');
                    this.startMeasurement(e.latlng);
                }
                e.originalEvent.preventDefault();
            }
        });
        
        this.map.on('mousemove', (e) => {
            if (this.measurementActive) {
                this.updateMeasurement(e.latlng);
            } else if (this.rangeRingActive) {
                this.updateRangeRing(e.latlng);
            }
        });
        
        this.map.on('mouseup', (e) => {
            if (e.originalEvent.button === 2) { // Right mouse button
                if (this.measurementActive) {
                    // Check if CTRL key is held - if so, make measurement persistent
                    if (e.originalEvent.ctrlKey) {
                        this.endMeasurementPersistent();
                    } else {
                        this.endMeasurement();
                    }
                } else if (this.rangeRingActive) {
                    // Check if CTRL key is held - if so, make range ring persistent
                    if (e.originalEvent.ctrlKey) {
                        this.endRangeRingPersistent();
                    } else {
                        this.endRangeRing();
                    }
                }
            }
        });
        
        // Disable context menu on right click
        this.map.getContainer().addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startMeasurement(startLatLng) {
        this.measurementActive = true;
        this.measurementStartPoint = startLatLng;
        
        // Get current tile layer colors
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        const measurementColor = currentLayer.measurementColor || '#ff0000';
               
        // Create measurement line
        this.measurementLine = L.polyline([startLatLng, startLatLng], {
            color: measurementColor,
            weight: 2,
            opacity: 0.8,
            dashArray: '5, 5'
        }).addTo(this.map);
        
        // Create measurement label
        this.measurementLabel = L.marker(startLatLng, {
            icon: L.divIcon({
                className: 'measurement-label',
                html: `<div style="background: rgba(255, 0, 0, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">0.0 NM<br>000°</div>`,
                iconSize: [80, 40],
                iconAnchor: [40, 20]
            })
        }).addTo(this.map);
        
        console.log('Measurement started');
    }
    
    updateMeasurement(currentLatLng) {
        if (!this.measurementActive || !this.measurementStartPoint) return;
        
        // Update line
        this.measurementLine.setLatLngs([this.measurementStartPoint, currentLatLng]);
        
        // Calculate distance and bearing
        const distance = this.calculateDistanceNauticalMiles(
            this.measurementStartPoint.lat, this.measurementStartPoint.lng,
            currentLatLng.lat, currentLatLng.lng
        );
        
        const bearing = this.calculateBearing(
            this.measurementStartPoint.lat, this.measurementStartPoint.lng,
            currentLatLng.lat, currentLatLng.lng
        );
        
        // Update label position and content
        const midpoint = L.latLng(
            (this.measurementStartPoint.lat + currentLatLng.lat) / 2,
            (this.measurementStartPoint.lng + currentLatLng.lng) / 2
        );
        
        this.measurementLabel.setLatLng(midpoint);
        
        // Get current tile layer colors for label
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        const measurementColor = currentLayer.measurementColor || '#ff0000';
        
        this.measurementLabel.setIcon(L.divIcon({
            className: 'measurement-label',
            html: `<div style="background: rgba(255, 0, 0, 0.9); color: white; padding: 4px 8px; border-radius:  4px; font-family: monospace; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${distance.toFixed(1)} NM<br>${bearing.toFixed(0).padStart(3, '0')}°</div>`,
            iconSize: [80, 40],
            iconAnchor: [40, 20]
        }));
    }
    
    endMeasurement() {
        this.measurementActive = false;
        
        
        // Remove measurement elements
        if (this.measurementLine) {
            this.map.removeLayer(this.measurementLine);
            this.measurementLine = null;
        }
        
        if (this.measurementLabel) {
            this.map.removeLayer(this.measurementLabel);
            this.measurementLabel = null;
        }
        
        this.measurementStartPoint = null;
        console.log('Measurement ended');
    }
    
    endMeasurementPersistent() {
        // Store the measurement as persistent before clearing
        if (this.measurementLine && this.measurementLabel) {
            const persistentMeasurement = {
                line: this.measurementLine,
                label: this.measurementLabel,
                id: 'measurement-' + Date.now()
            };
            
            // Add to persistent measurements array
            this.persistentMeasurements.push(persistentMeasurement);
            
            console.log('Measurement made persistent:', persistentMeasurement.id);
        }
        
        // Reset active measurement state
        this.measurementActive = false;
        this.measurementLine = null;
        this.measurementLabel = null;
        this.measurementStartPoint = null;
        
        console.log('Persistent measurement created');
    }
    
    clearAllMeasurements() {
        // Remove all persistent measurements from map
        this.persistentMeasurements.forEach(measurement => {
            if (measurement.line) {
                this.map.removeLayer(measurement.line);
            }
            if (measurement.label) {
                this.map.removeLayer(measurement.label);
            }
        });
        
        // Remove all persistent range rings from map
        this.persistentRangeRings.forEach(rangeRing => {
            if (rangeRing.circle) {
                this.map.removeLayer(rangeRing.circle);
            }
            if (rangeRing.centerMarker) {
                this.map.removeLayer(rangeRing.centerMarker);
            }
            if (rangeRing.label) {
                this.map.removeLayer(rangeRing.label);
            }
        });
        
        // Clear the arrays
        this.persistentMeasurements = [];
        this.persistentRangeRings = [];
        
        console.log('All persistent measurements and range rings cleared');
    }
    
    updatePersistentMeasurementsColors() {
        // Update colors of all persistent measurements to match current tile layer
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        const measurementColor = currentLayer.measurementColor || '#ff0000';
        
        this.persistentMeasurements.forEach(measurement => {
            // Update line color
            if (measurement.line) {
                measurement.line.setStyle({
                    color: measurementColor
                });
            }
            
            // Note: Label colors are handled by the original HTML content,
            // we could optionally recreate labels with new colors here
        });
        
        console.log('Updated persistent measurements colors to:', measurementColor);
    }
    
    updatePersistentRangeRingsColors() {
        // Update colors of all persistent range rings to match current tile layer
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        const measurementColor = currentLayer.measurementColor || '#ff0000';
        
        this.persistentRangeRings.forEach(rangeRing => {
            // Update circle color
            if (rangeRing.circle) {
                rangeRing.circle.setStyle({
                    color: measurementColor
                });
            }
            
            // Update center marker color
            if (rangeRing.centerMarker) {
                rangeRing.centerMarker.setStyle({
                    color: measurementColor,
                    fillColor: measurementColor
                });
            }
            
            // Note: Label colors are handled by the original HTML content,
            // we could optionally recreate labels with new colors here
        });
        
        console.log('Updated persistent range rings colors to:', measurementColor);
    }
    
    calculateDistanceNauticalMiles(lat1, lng1, lat2, lng2) {
        // Haversine formula for accurate distance calculation
        const R = 3440.065; // Earth's radius in nautical miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    calculateBearing(lat1, lng1, lat2, lng2) {
        // Calculate bearing (direction) from point 1 to point  2
        const dLng = this.toRadians(lng2 - lng1);
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        
        const y = Math.sin(dLng) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
        
        let bearing = this.toDegrees(Math.atan2(y, x));
        
        // Normalize to 0-360 degrees
        bearing = (bearing + 360) % 360;
        
        return bearing;
    }
    
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    // Range Ring Tool Implementation
    
    startRangeRing(centerLatLng) {
        this.rangeRingActive = true;
        this.rangeRingCenter = centerLatLng;
        
        console.log('Starting range ring at:', centerLatLng);
        
        // Get current tile layer colors
        const currentLayer = this.tileLayers[this.currentTileLayerIndex];
        const rangeRingColor = currentLayer.measurementColor || '#ff0000';
        
        // Create center marker (small red circle)
        this.rangeRingCenterMarker = L.circleMarker(centerLatLng, {
            color: rangeRingColor,
            fillColor: rangeRingColor,
            fillOpacity: 0.8,
            radius: 3,
            weight: 1
        }).addTo(this.map);
        
        // Create initial range ring circle (will be updated on mouse move)
        this.rangeRingCircle = L.circle(centerLatLng, {
            color: rangeRingColor,
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.7,
            radius: 1852 // Start with 1 NM radius in meters
        }).addTo(this.map);
        
        // Create range label
        this.rangeRingLabel = L.marker(centerLatLng, {
            icon: L.divIcon({
                className: 'range-ring-label',
                html: `<div style="background: rgba(255, 0, 0, 0.9); color: white; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">0.0 NM</div>`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            })
        }).addTo(this.map);
        
        console.log('Range ring elements created');
    }
    
    updateRangeRing(currentLatLng) {
        if (!this.rangeRingActive || !this.rangeRingCenter) return;
        
        // Calculate distance from center to current position
        const radiusNM = this.calculateDistanceNauticalMiles(
            this.rangeRingCenter.lat, this.rangeRingCenter.lng,
            currentLatLng.lat, currentLatLng.lng
        );
        
        // Convert nautical miles to meters for Leaflet circle
        const radiusMeters = radiusNM * 1852;
        
        // Update circle radius
        this.rangeRingCircle.setRadius(radiusMeters);
        
        // Position label on the edge of the circle at 45 degrees (northeast)
        const labelBearing = 45; // Fixed at northeast for consistency
        const labelDistance = radiusNM;
        const labelPosition = this.calculateDestinationPoint(
            this.rangeRingCenter.lat, this.rangeRingCenter.lng,
            labelBearing, labelDistance
        );
        
        // Update label position and content
        this.rangeRingLabel.setLatLng([labelPosition.lat, labelPosition.lng]);
        this.rangeRingLabel.setIcon(L.divIcon({
            className: 'range-ring-label',
            html: `<div style="background: rgba(255, 0, 0, 0.9); color: white; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${radiusNM.toFixed(1)} NM</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
        }));
    }
    
    endRangeRing() {
        this.rangeRingActive = false;
        
        console.log('Ending range ring');
        
        // Remove range ring elements
        if (this.rangeRingCircle) {
            this.map.removeLayer(this.rangeRingCircle);
            this.rangeRingCircle = null;
        }
        
        if (this.rangeRingCenterMarker) {
            this.map.removeLayer(this.rangeRingCenterMarker);
            this.rangeRingCenterMarker = null;
        }
        
        if (this.rangeRingLabel) {
            this.map.removeLayer(this.rangeRingLabel);
            this.rangeRingLabel = null;
        }
        
        this.rangeRingCenter = null;
        console.log('Range ring ended');
    }
    
    endRangeRingPersistent() {
        // Store the range ring as persistent before clearing
        if (this.rangeRingCircle && this.rangeRingCenterMarker && this.rangeRingLabel) {
            const persistentRangeRing = {
                circle: this.rangeRingCircle,
                centerMarker: this.rangeRingCenterMarker,
                label: this.rangeRingLabel,
                id: 'rangering-' + Date.now()
            };
            
            // Add to persistent range rings array
            this.persistentRangeRings.push(persistentRangeRing);
            
            console.log('Range ring made persistent:', persistentRangeRing.id);
        }
        
        // Reset active range ring state
        this.rangeRingActive = false;
        this.rangeRingCircle = null;
        this.rangeRingCenterMarker = null;
        this.rangeRingLabel = null;
        this.rangeRingCenter = null;
        
        console.log('Persistent range ring created');
    }
    
    calculateDestinationPoint(lat, lng, bearing, distanceNM) {
        // Calculate a destination point given a starting point, bearing, and distance
        const R = 3440.065; // Earth radius in nautical miles
        const bearingRad = this.toRadians(bearing);
        const latRad = this.toRadians(lat);
        const distanceRatio = distanceNM / R;
        
        const destLatRad = Math.asin(
            Math.sin(latRad) * Math.cos(distanceRatio) +
            Math.cos(latRad) * Math.sin(distanceRatio) * Math.cos(bearingRad)
        );
        
        const destLngRad = this.toRadians(lng) + Math.atan2(
            Math.sin(bearingRad) * Math.sin(distanceRatio) * Math.cos(latRad),
            Math.cos(distanceRatio) - Math.sin(latRad) * Math.sin(destLatRad)
        );
        
        return {
            lat: this.toDegrees(destLatRad),
            lng: this.toDegrees(destLngRad)
        };
    }
    
    parseUrlParameters() {
        // Parse URL parameters for aircraft tracking and filtering
        const urlParams = new URLSearchParams(window.location.search);
        const callsign = urlParams.get('callsign');
        const group = urlParams.get('group');
        
        if (callsign) {
            // Use the startTrackingAircraft method to ensure proper tracking setup
            // Note: We delay this slightly to ensure the map is fully initialized
            setTimeout(() => {
                this.startTrackingAircraft(callsign);
            }, 100);
        }
        
        if (group) {
            // Add to selectedGroups for UI filter display only
            this.selectedGroups.clear();
            this.selectedGroups.add(group);
            
            // Save this selection so it persists
            this.saveGroupFilterSelections();
            
            console.log(`URL parameter set filter to group: ${group}`);
        }
    }
    
    showTrackingIndicator() {
        // Create a tracking indicator in the UI
        const indicator = document.createElement('div');
        indicator.id = 'tracking-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 165, 0, 0.95);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: monospace;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            border: 2px solid #ff8c00;
        `;
        indicator.innerHTML = `
            <i class="fas fa-crosshairs"></i> 
            Tracking: ${this.trackedCallsign}
            <button onclick="window.radar.stopTracking()" style="background: none; border: none; color: white; margin-left: 10px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(indicator);
    }
    
    stopTracking() {
        this.isTrackingEnabled = false;
        this.trackedCallsign = null;
        
        // Remove tracking indicator
        const indicator = document.getElementById('tracking-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Update tracking icon highlights in the aircraft table
        this.updateTrackingIconHighlights();
        
        // Update all open popups to reflect the new tracking state
        this.updateAllPopups();
        
        console.log('Aircraft tracking stopped');
    }

    toggleTrackingFromPopup(callsign) {
        if (this.trackedCallsign === callsign.toUpperCase()) {
            // Currently tracking this aircraft, so stop tracking
            this.stopTracking();
        } else {
            // Start tracking this aircraft
            this.startTrackingAircraft(callsign);
        }
        
        // Update all open popups to reflect the new tracking state
        this.updateAllPopups();
    }

    updateAllPopups() {
        // Update all open popups to reflect current tracking state
        this.aircraftMarkers.forEach((marker, callsign) => {
            if (marker.isPopupOpen() && marker.aircraftData) {
                marker.getPopup().setContent(this.createPopupContent(marker.aircraftData));
            }
        });
    }

    trackAircraft(aircraftData) {
        // Find the tracked aircraft in the current data
        const trackedAircraft = aircraftData.find(aircraft => 
            aircraft.callsign.toUpperCase() === this.trackedCallsign
        );
        
        if (trackedAircraft) {
            // Get the aircraft's current position
            let aircraftPosition;
            
            if (this.smoothMovementEnabled && this.aircraftPositions.has(this.trackedCallsign)) {
                // Use smooth movement position if available
                const positionData = this.aircraftPositions.get(this.trackedCallsign);
                aircraftPosition = [positionData.currentLat, positionData.currentLng];
            } else {
                // Use actual position
                aircraftPosition = [trackedAircraft.latitude, trackedAircraft.longitude];
            }
            
            // Center map on the tracked aircraft with appropriate zoom
            const currentZoom = this.map.getZoom();
            const targetZoom = Math.max(currentZoom, 8); // Ensure minimum zoom level for tracking
            
            this.map.setView(aircraftPosition, targetZoom, {
                animate: true,
                duration: 1.0 // Smooth animation
            });
            
            // Highlight the tracked aircraft
            this.highlightTrackedAircraft(this.trackedCallsign);
            
        } else {
            // Aircraft not found, show warning but keep tracking enabled
            console.warn(`Tracked aircraft ${this.trackedCallsign} not found in current data`);
            this.updateTrackingIndicator(false);
        }
    }
    
    highlightTrackedAircraft(callsign) {
        // Remove previous highlighting from all aircraft and their labels
        this.aircraftMarkers.forEach((marker, markerCallsign) => {
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.classList.remove('tracked-aircraft');
                // Reset to normal color for this color scheme
                const iconElement = markerElement.querySelector('.aircraft-icon');
                if (iconElement && marker.aircraftData) {
                    const colors = this.colorSchemes[this.currentColorScheme];
                    const normalColor = colors.aircraftColor;
                    iconElement.style.color = normalColor;
                    iconElement.style.filter = `drop-shadow(0 0 3px ${normalColor})`;
                }
            }
            
            // Also reset label colors to normal
            const labelGroup = this.labelLayers.get(markerCallsign);
            if (labelGroup && marker.aircraftData) {
                const colors = this.colorSchemes[this.currentColorScheme];
                const normalColor = colors.aircraftColor;
                const normalBackground = colors.labelBackground;
                const labelLineColor = normalColor; // Use same color as aircraft
                
                labelGroup.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        // This is the label marker
                        const labelElement = layer.getElement();
                        if (labelElement) {
                            const labelDiv = labelElement.querySelector('div');
                            if (labelDiv) {
                                // Reset to normal tile layer colors including background
                                labelDiv.style.color = normalColor;
                                labelDiv.style.backgroundColor = normalBackground;
                                labelDiv.style.borderColor = normalColor;
                                labelDiv.style.boxShadow = `0 0 8px ${normalColor}40`;
                            }
                        }
                    } else if (layer instanceof L.Polyline) {
                        // This is the connecting line
                        layer.setStyle({
                            color: labelLineColor,
                            opacity: 0.7,
                            weight: 1
                        });
                    }
                });
            }
        });
        
        // Add highlighting to tracked aircraft
        const trackedMarker = this.aircraftMarkers.get(callsign);
        if (trackedMarker) {
            const markerElement = trackedMarker.getElement();
            if (markerElement) {
                markerElement.classList.add('tracked-aircraft');
                const iconElement = markerElement.querySelector('.aircraft-icon');
                if (iconElement) {
                    // Use tracking highlight color from color scheme
                    const colors = this.colorSchemes[this.currentColorScheme];
                    const highlightColor = colors.trackingHighlightColor;
                    iconElement.style.color = highlightColor;
                    iconElement.style.filter = `drop-shadow(0 0 8px ${highlightColor}) drop-shadow(0 0 12px ${highlightColor})`;
                }
            }
        }
        
        // Also highlight the tracked aircraft's label if it exists
        const trackedLabelGroup = this.labelLayers.get(callsign);
        if (trackedLabelGroup) {
            trackedLabelGroup.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    // This is the label marker
                    const labelElement = layer.getElement();
                    if (labelElement) {
                        const labelDiv = labelElement.querySelector('div');
                        if (labelDiv) {
                            // Highlight the label with tracking colors from color scheme
                            const colors = this.colorSchemes[this.currentColorScheme];
                            const highlightColor = colors.trackingHighlightColor;
                            const highlightBackground = colors.trackingHighlightBackground;
                            labelDiv.style.color = '#ffffff';
                            labelDiv.style.backgroundColor = highlightBackground;
                            labelDiv.style.borderColor = highlightColor;
                            labelDiv.style.boxShadow = `0 0 8px ${highlightColor}80`;
                        }
                    }
                } else if (layer instanceof L.Polyline) {
                    // This is the connecting line
                    const colors = this.colorSchemes[this.currentColorScheme];
                    const highlightColor = colors.trackingHighlightColor;
                    layer.setStyle({
                        color: highlightColor,
                        opacity: 0.9,
                        weight: 2
                    });
                }
            });
        }
        
        // Update tracking indicator to show aircraft is found
        this.updateTrackingIndicator(true);
    }
    
    updateTrackingIndicator(found) {
        const indicator = document.getElementById('tracking-indicator');
        if (indicator) {
            const colors = this.colorSchemes[this.currentColorScheme];
            const textColor = colors.primaryColor;
            
            if (found) {
                const successBackground = colors.accentColor;
                indicator.style.background = successBackground;
                indicator.style.borderColor = successBackground;
                indicator.style.color = '#ffffff';
                indicator.innerHTML = `
                    <i class="fas fa-crosshairs"></i> 
                    Tracking: ${this.trackedCallsign} ✓
                    <button onclick="window.radar.stopTracking()" style="background: none; border: none; color: white; margin-left: 10px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                const errorBackground = colors.trackingHighlightColor;
                indicator.style.background = errorBackground;
                indicator.style.borderColor = errorBackground;
                indicator.style.color = '#ffffff';
                indicator.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i> 
                    Tracking: ${this.trackedCallsign} (Not Found)
                    <button onclick="window.radar.stopTracking()" style="background: none; border: none; color: white; margin-left: 10px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
        }
    }
    
    updateTrackingIconHighlights() {
        // Update all tracking icons in the aircraft table to reflect current tracking status
        const allTrackIcons = document.querySelectorAll('.track-icon');
        allTrackIcons.forEach(icon => {
            const callsign = icon.getAttribute('data-callsign');
            const isTracked = this.isTrackingEnabled && this.trackedCallsign === callsign.toUpperCase();
            
            if (isTracked) {
                icon.classList.add('tracking');
                icon.title = `Stop tracking ${callsign}`;
            } else {
                icon.classList.remove('tracking');
                icon.title = `Track ${callsign}`;
            }
        });
    }
    
    startTrackingAircraft(callsign) {
        // Stop any existing tracking first
        if (this.isTrackingEnabled && this.trackedCallsign) {
            console.log(`Stopping tracking for ${this.trackedCallsign} to start tracking ${callsign}`);
            this.stopTracking();
        }
        
        // Set tracking parameters for new aircraft
        this.trackedCallsign = callsign.toUpperCase().trim();
        this.isTrackingEnabled = true;
        
        console.log(`Aircraft tracking started for callsign: ${this.trackedCallsign}`);
        
        // Show tracking indicator
        this.showTrackingIndicator();
        
        // Immediately track if aircraft is currently visible
        const marker = this.aircraftMarkers.get(this.trackedCallsign);
        if (marker && marker.aircraftData) {
            // Get the aircraft's current position
            let aircraftPosition;
            
            if (this.smoothMovementEnabled && this.aircraftPositions.has(this.trackedCallsign)) {
                // Use smooth movement position if available
                const positionData = this.aircraftPositions.get(this.trackedCallsign);
                aircraftPosition = [positionData.currentLat, positionData.currentLng];
            } else {
                // Use actual position
                aircraftPosition = [marker.aircraftData.latitude, marker.aircraftData.longitude];
            }
            
            // Center map on the aircraft with appropriate zoom
            const currentZoom = this.map.getZoom();
            const targetZoom = Math.max(currentZoom, 8); // Ensure minimum zoom level for tracking
            
            this.map.setView(aircraftPosition, targetZoom, {
                animate: true,
                duration: 1.5 // Smooth animation
            });
            
            // Highlight the tracked aircraft (this will remove previous highlighting)
            this.highlightTrackedAircraft(this.trackedCallsign);
            
            // Update the tracking indicator to show found status
            this.updateTrackingIndicator(true);
        }
        
        // Update tracking icon highlights in the aircraft table
        this.updateTrackingIconHighlights();
        
        // Update all open popups to reflect the new tracking state
        this.updateAllPopups();
    }
    
    updateAircraftColors() {
        // Update all existing aircraft markers to use the new tile layer's color
        this.aircraftMarkers.forEach((marker, callsign) => {
            if (marker.aircraftData) {
                // Recreate the icon with the new color
                const newIcon = this.createAircraftIcon(marker.aircraftData);
                marker.setIcon(newIcon);
            }
        });
        
        // Update aircraft labels and their connecting lines
        this.updateLabelColors();
        
        // Reapply tracking highlighting if there's a tracked aircraft
        if (this.isTrackingEnabled && this.trackedCallsign) {
            this.highlightTrackedAircraft(this.trackedCallsign);
        }
        
        // Also update heading lines
        this.updateHeadingLineColors();
        
        console.log(`Aircraft colors updated for tile layer: ${this.tileLayers[this.currentTileLayerIndex].name}`);
    }
    
    getHeadingLineColor(aircraftColor) {
        // Create a slightly different color for heading lines based on aircraft color
        // This ensures good visibility while maintaining color coordination
        const colorMap = {
            '#ff6b35': '#ffaa00', // Orange aircraft -> Golden heading
            '#00ff41': '#66ff66', // Green aircraft -> Light green heading  
            '#40e0d0': '#00ffff', // Turquoise aircraft -> Cyan heading
            '#8a2be2': '#dda0dd', // Blue violet aircraft -> Plum heading
            '#dc143c': '#ff69b4', // Crimson aircraft -> Hot pink heading
            '#1e90ff': '#87ceeb'  // Dodger blue aircraft -> Sky blue heading
        };
        
        return colorMap[aircraftColor] || '#ffff00'; // Default to yellow if color not found
    }
    
    updateHeadingLineColors() {
        // Update all existing heading lines to use the new tile layer's colors
        this.headingLines.forEach((line, callsign) => {
            const marker = this.aircraftMarkers.get(callsign);
            if (marker && marker.aircraftData) {
                // Remove old line and redraw with new color
                this.map.removeLayer(line);
                this.drawHeadingLine(marker.aircraftData);
            }
        });
    }

    updateLabelColors() {
        // Update all existing aircraft labels and their connecting lines to use new tile layer colors
        this.labelLayers.forEach((labelGroup, callsign) => {
            const marker = this.aircraftMarkers.get(callsign);
            if (marker && marker.aircraftData) {
                // Remove old label group and recreate with new colors
                this.map.removeLayer(labelGroup);
                
                // Create new label with updated colors
                const newLabelGroup = this.createAircraftLabel(marker.aircraftData);
                newLabelGroup.addTo(this.map);
                
                // Update the stored reference
                this.labelLayers.set(callsign, newLabelGroup);
            }
        });
    }

    updateInterfaceColors(colorMapping) {
        // If color mapping is provided, use it; otherwise read from current tile layer
        let colors;
        
        if (colorMapping) {
            // Use provided color mapping
            colors = {
                primary: colorMapping.primaryColor,
                secondary: colorMapping.secondaryColor,
                accent: colorMapping.accentColor,
                background: colorMapping.backgroundColor,
                secondaryBg: colorMapping.secondaryBg,
                border: colorMapping.borderColor,
                hover: colorMapping.hoverColor,
                text: colorMapping.textColor,
                shadow: colorMapping.shadowColor,
                grid: colorMapping.gridColor,
                gridMajor: colorMapping.gridMajorColor,
                gridMinor: colorMapping.gridMinorColor,
                popupBg: colorMapping.popupBg,
                popupText: colorMapping.popupText,
                popupBorder: colorMapping.popupBorder,
                trackingHighlight: '#ff6600',
                trackingHighlightBg: 'rgb(255, 102, 0)',
                aircraftColor: colorMapping.aircraftColor,
                labelBg: colorMapping.labelBg,
                labelText: colorMapping.labelText,
                labelBorder: colorMapping.labelBorder,
                labelLine: colorMapping.labelLine
            };
        } else {
            // Fall back to tile layer colors (for backward compatibility)
            const currentTileLayer = this.tileLayers[this.currentTileLayerIndex];
            colors = {
                primary: currentTileLayer.primaryColor || currentTileLayer.aircraftColor || '#00ff00',
                secondary: currentTileLayer.secondaryColor || '#88ff88',
                accent: currentTileLayer.accentColor || '#00ffff',
                background: currentTileLayer.backgroundColor || 'rgba(0, 20, 40, 0.95)',
                secondaryBg: currentTileLayer.secondaryBackground || 'rgba(0, 40, 80, 0.8)',
                border: currentTileLayer.borderColor || currentTileLayer.primaryColor || '#00ff00',
                hover: currentTileLayer.hoverColor || 'rgba(0, 60, 120, 0.9)',
                text: currentTileLayer.textColor || currentTileLayer.primaryColor || '#00ff00',
                shadow: currentTileLayer.shadowColor || 'rgba(0, 255, 0, 0.3)',
                grid: currentTileLayer.gridColor || currentTileLayer.primaryColor || '#00ff00',
                gridMajor: currentTileLayer.gridMajorColor || currentTileLayer.primaryColor || '#00ff00',
                gridMinor: currentTileLayer.gridMinorColor || 'rgba(0, 255, 0, 0.3)',
                popupBg: currentTileLayer.popupBackground || currentTileLayer.backgroundColor || 'rgba(0, 20, 40, 0.95)',
                popupText: currentTileLayer.popupTextColor || currentTileLayer.primaryColor || '#00ff00',
                popupBorder: currentTileLayer.popupBorderColor || currentTileLayer.borderColor || '#00ff00',
                trackingHighlight: currentTileLayer.trackingHighlightColor || '#ff6600',
                trackingHighlightBg: currentTileLayer.trackingHighlightBackground || 'rgb(255, 102, 0)'
            };
        }
        
        // Update CSS custom properties for dynamic theming
        document.documentElement.style.setProperty('--primary-color', colors.primary);
        document.documentElement.style.setProperty('--secondary-color', colors.secondary);
        document.documentElement.style.setProperty('--accent-color', colors.accent);
        document.documentElement.style.setProperty('--background-color', colors.background);
        document.documentElement.style.setProperty('--secondary-bg', colors.secondaryBg);
        document.documentElement.style.setProperty('--border-color', colors.border);
        document.documentElement.style.setProperty('--hover-color', colors.hover);
        document.documentElement.style.setProperty('--text-color', colors.text);
        document.documentElement.style.setProperty('--shadow-color', colors.shadow);
        document.documentElement.style.setProperty('--grid-color', colors.grid);
        document.documentElement.style.setProperty('--grid-major-color', colors.gridMajor);
        document.documentElement.style.setProperty('--grid-minor-color', colors.gridMinor);
        document.documentElement.style.setProperty('--tracking-highlight-color', colors.trackingHighlight);
        document.documentElement.style.setProperty('--tracking-highlight-bg', colors.trackingHighlightBg);
        
        // Update radar info panel
        this.updateRadarInfoColors(colors);
        
        // Update toolbar colors
        this.updateToolbarColors(colors);
        
        // Update individual toolbar buttons to respect their toggle states and tile layer colors
        this.updateLayersButton();
        this.updateGridButton();
        this.updateAircraftListButton();
        this.updateSmoothButton();
        this.updateTrailsButton();
        this.updateWeatherButton();
        
        // Update tracking indicator if tracking is active
        if (this.isTrackingEnabled && this.trackedCallsign) {
            this.updateTrackingIndicator(true);
        }
        
        // Update aircraft list colors
        this.updateAircraftListColors(colors);
        
        // Update grid colors
        this.updateGridColors(colors);
        
        // Update persistent measurements colors
        this.updatePersistentMeasurementsColors();
        
        // Update persistent range rings colors
        this.updatePersistentRangeRingsColors();
        
        // Update other UI elements
        this.updateMiscUIColors(colors);
        
        console.log('Interface colors updated');
    }
    
    generateInterfaceColors(primaryColor) {
        // Generate a cohesive color palette based on the primary color
        const rgb = this.hexToRgb(primaryColor);
        
        if (!rgb) {
            // Fallback colors if hex parsing fails
            return {
                hover: 'rgba(0, 60, 120, 0.9)',
                accent: '#00ffff',
                secondaryBg: 'rgba(0, 40, 80, 0.8)',
                shadow: 'rgba(0, 255, 0, 0.3)'
            };
        }
        
        // Create variations of the primary color
        const hoverRgb = {
            r: Math.min(255, rgb.r + 40),
            g: Math.min(255, rgb.g + 40),
            b: Math.min(255, rgb.b + 40)
        };
        
        // Create accent color (slightly shifted hue)
        const accentRgb = {
            r: Math.min(255, Math.max(0, rgb.r + 30)),
            g: Math.min(255, Math.max(0, rgb.g - 20)),
            b: Math.min(255, Math.max(0, rgb.b + 50))
        };
        
        return {
            hover: `rgba(${hoverRgb.r}, ${hoverRgb.g}, ${hoverRgb.b}, 0.9)`,
            accent: `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`,
            secondaryBg: `rgba(${Math.floor(rgb.r * 0.3)}, ${Math.floor(rgb.g * 0.3)}, ${Math.floor(rgb.b * 0.3)}, 0.8)`,
            shadow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
        };
    }
    
    hexToRgb(hex) {
        // Convert hex color to RGB object
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    updateRadarInfoColors(colors) {
        const radarInfo = document.querySelector('.radar-info');
        if (radarInfo) {
            radarInfo.style.backgroundColor = colors.background;
            radarInfo.style.borderColor = colors.border;
            radarInfo.style.color = colors.text;
            radarInfo.style.boxShadow = `0 6px 20px ${colors.shadow}`;
        }
        
        // Update refresh indicator
        const refreshIndicator = document.getElementById('refresh-indicator');
        if (refreshIndicator) {
            refreshIndicator.style.backgroundColor = colors.background;
            refreshIndicator.style.borderColor = colors.border;
            refreshIndicator.style.color = colors.text;
        }
    }
    
    updateToolbarColors(colors) {
        const toolbar = document.querySelector('.radar-toolbar');
        if (toolbar) {
            toolbar.style.backgroundColor = colors.background;
            toolbar.style.borderColor = colors.border;
            toolbar.style.boxShadow = `0 4px 12px ${colors.shadow}`;
        }
        
        // Don't update individual toolbar buttons here - let their specific update methods handle styling
        // This prevents conflicts with toggle state styling in updateGridButton, updateAircraftListButton, etc.
        
        // Update drag handle
        const dragHandle = document.querySelector('.toolbar-drag-handle');
        if (dragHandle) {
            dragHandle.style.backgroundColor = colors.secondaryBg;
            dragHandle.style.borderColor = colors.border;
            dragHandle.style.color = colors.text;
        }
        
        // Update separators
        const separators = document.querySelectorAll('.toolbar-separator');
        separators.forEach(sep => {
            sep.style.backgroundColor = colors.gridMinor;
        });
    }
    
    updateAircraftListColors(colors) {
        const aircraftList = document.querySelector('.aircraft-list-container');
        if (aircraftList) {
            aircraftList.style.backgroundColor = colors.background;
            aircraftList.style.borderColor = colors.border;
            aircraftList.style.boxShadow = `0 6px 20px ${colors.shadow}`;
        }
        
        // Update aircraft list header
        const listHeader = document.querySelector('.aircraft-list-header');
        if (listHeader) {
            listHeader.style.backgroundColor = colors.secondaryBg;
            listHeader.style.borderBottomColor = colors.border;
        }
        
        // Update aircraft list title and controls
        const listTitle = document.querySelector('.aircraft-list-title');
        if (listTitle) {
            listTitle.style.color = colors.text;
        }
        
        const listClose = document.querySelector('.aircraft-list-close');
        if (listClose) {
            listClose.style.color = colors.text;
        }
        
        const listDragHandle = document.querySelector('.aircraft-list-drag-handle');
        if (listDragHandle) {
            listDragHandle.style.color = colors.text;
        }
        
        // Update table styling
        const table = document.querySelector('.aircraft-list-table');
        if (table) {
            table.style.color = colors.text;
            
            // Update table headers
            const headers = table.querySelectorAll('th');
            headers.forEach(th => {
                th.style.backgroundColor = colors.secondaryBg;
                th.style.borderColor = colors.border;
            });
            
            // Update table cells
            const cells = table.querySelectorAll('td');
            cells.forEach(td => {
                td.style.borderColor = colors.gridMinor;
            });
        }
    }
    
    updateGridColors(colors) {
        // Update grid if it's currently visible
        if (this.gridVisible && this.gridLayer) {
            this.createGrid(); // Recreate grid with new colors
        }
    }
    
    updateMiscUIColors(colors) {
        // Update popup colors
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-popup-content-wrapper {
                background: ${colors.popupBg} !important;
                color: ${colors.popupText} !important;
                border: 1px solid ${colors.popupBorder} !important;
            }
            .leaflet-popup-content {
                color: ${colors.popupText} !important;
            }
            .leaflet-popup-tip {
                background: ${colors.popupBg} !important;
                border: 1px solid ${colors.popupBorder} !important;
            }
        `;
        
        // Remove old dynamic styles
        const oldStyle = document.getElementById('dynamic-theme-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        style.id = 'dynamic-theme-styles';
        document.head.appendChild(style);
    }
    
    // Color Scheme Selection Dialog
    openColorSchemeDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'mapbox-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'mapbox-dialog-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Select Color Scheme';
        dialogContent.appendChild(title);
        
        const info = document.createElement('p');
        info.className = 'mapbox-info';
        info.textContent = 'Choose a color scheme for the radar interface:';
        dialogContent.appendChild(info);
        
        const schemeGrid = document.createElement('div');
        schemeGrid.className = 'mapbox-style-grid';
        
        Object.keys(this.colorSchemes).forEach(schemeId => {
            const scheme = this.colorSchemes[schemeId];
            const label = document.createElement('label');
            label.className = 'mapbox-style-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'color-scheme';
            radio.value = schemeId;
            if (this.currentColorScheme === schemeId) {
                radio.checked = true;
            }
            label.appendChild(radio);
            
            const span = document.createElement('span');
            span.textContent = scheme.name;
            span.style.color = scheme.primaryColor;
            label.appendChild(span);
            
            schemeGrid.appendChild(label);
        });
        
        dialogContent.appendChild(schemeGrid);
        
        const applyBtn = document.createElement('button');
        applyBtn.className = 'mapbox-btn mapbox-btn-primary';
        applyBtn.textContent = 'Apply Color Scheme';
        dialogContent.appendChild(applyBtn);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mapbox-btn mapbox-btn-close';
        closeBtn.textContent = 'Close';
        dialogContent.appendChild(closeBtn);
        
        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);
        
        applyBtn.addEventListener('click', () => {
            const selectedRadio = document.querySelector('input[name="color-scheme"]:checked');
            if (selectedRadio) {
                this.currentColorScheme = selectedRadio.value;
                this.setCookie('colorScheme', this.currentColorScheme);
                this.applyColorScheme();
                console.log('Color scheme applied: ' + this.colorSchemes[this.currentColorScheme].name);
            }
            dialog.remove();
        });
        
        closeBtn.addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }
    
    applyColorScheme() {
        const colors = this.colorSchemes[this.currentColorScheme];
        
        // Update interface colors
        const colorMapping = {
            aircraftColor: colors.aircraftColor,
            labelBg: colors.labelBackground,
            labelText: colors.labelTextColor,
            labelBorder: colors.labelBorderColor,
            labelLine: colors.labelLineColor,
            primaryColor: colors.primaryColor,
            secondaryColor: colors.secondaryColor,
            accentColor: colors.accentColor,
            backgroundColor: colors.backgroundColor,
            secondaryBg: colors.secondaryBackground,
            borderColor: colors.borderColor,
            hoverColor: colors.hoverColor,
            textColor: colors.textColor,
            shadowColor: colors.shadowColor,
            gridColor: colors.gridColor,
            gridMajorColor: colors.gridMajorColor,
            gridMinorColor: colors.gridMinorColor,
            popupBg: colors.popupBackground,
            popupText: colors.popupTextColor,
            popupBorder: colors.popupBorderColor
        };
        
        this.updateInterfaceColors(colorMapping);
        
        // Update aircraft markers and labels
        this.updateAircraftColors();
        this.updateLabelColors();
    }
    
    // Tile Layer Selection Dialog
    openTileLayerDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'mapbox-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'mapbox-dialog-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Select Map Layer';
        dialogContent.appendChild(title);
        
        const info = document.createElement('p');
        info.className = 'mapbox-info';
        info.textContent = 'Choose a base map layer for the radar display:';
        dialogContent.appendChild(info);
        
        const layerGrid = document.createElement('div');
        layerGrid.className = 'mapbox-style-grid';
        
        this.tileLayers.forEach((layer, index) => {
            const label = document.createElement('label');
            label.className = 'mapbox-style-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'tile-layer';
            radio.value = index;
            if (this.currentTileLayerIndex === index) {
                radio.checked = true;
            }
            label.appendChild(radio);
            
            const span = document.createElement('span');
            span.textContent = layer.name;
            label.appendChild(span);
            
            layerGrid.appendChild(label);
        });
        
        dialogContent.appendChild(layerGrid);
        
        const applyBtn = document.createElement('button');
        applyBtn.className = 'mapbox-btn mapbox-btn-primary';
        applyBtn.textContent = 'Apply Layer';
        dialogContent.appendChild(applyBtn);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mapbox-btn mapbox-btn-close';
        closeBtn.textContent = 'Close';
        dialogContent.appendChild(closeBtn);
        
        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);
        
        applyBtn.addEventListener('click', () => {
            const selectedRadio = document.querySelector('input[name="tile-layer"]:checked');
            if (selectedRadio) {
                const layerIndex = parseInt(selectedRadio.value);
                this.currentTileLayerIndex = layerIndex;
                this.loadTileLayer(layerIndex);
                this.showLayerNotification();
                console.log('Switched to layer: ' + this.tileLayers[layerIndex].name);
            }
            dialog.remove();
        });
        
        closeBtn.addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }
    
    // Cookie management functions
    setCookie(name, value, days) {
        if (days === undefined) {
            days = 365;
        }
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
    }
    
    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }
    
    // Group filter persistence functions
    saveGroupFilterSelections() {
        try {
            if (this.selectedGroups.size === 0) {
                // Empty set means show all - save as empty array
                localStorage.setItem('groupFilterSelections', JSON.stringify([]));
            } else {
                // Save the selected groups
                localStorage.setItem('groupFilterSelections', JSON.stringify(Array.from(this.selectedGroups)));
            }
            console.log(`Saved group filter: ${this.selectedGroups.size === 0 ? 'all groups' : this.selectedGroups.size + ' groups'}`);
        } catch (e) {
            console.error('Failed to save group filter selections:', e);
        }
    }
    
    loadGroupFilterSelections() {
        try {
            const saved = localStorage.getItem('groupFilterSelections');
            if (saved) {
                const selections = JSON.parse(saved);
                if (Array.isArray(selections)) {
                    if (selections.length === 0) {
                        // Empty array means show all
                        this.selectedGroups.clear();
                    } else {
                        // Load the selected groups
                        this.selectedGroups = new Set(selections);
                    }
                    console.log(`Loaded group filter: ${this.selectedGroups.size === 0 ? 'all groups' : this.selectedGroups.size + ' groups'}`);
                }
            }
        } catch (e) {
            console.error('Failed to load group filter selections:', e);
        }
    }
    
    // MapBox integration functions
    openMapBoxDialog() {
        if (this.mapboxDialogOpen) {
            return;
        }
        this.mapboxDialogOpen = true;
        
        const dialog = document.createElement('div');
        dialog.className = 'mapbox-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'mapbox-dialog-content';
        
        const title = document.createElement('h2');
        title.textContent = 'MapBox Layers';
        dialogContent.appendChild(title);
        
        const info = document.createElement('p');
        info.className = 'mapbox-info';
        info.innerHTML = 'Enter your MapBox API token to access MapBox map styles. Get your free token at <a href="https://www.mapbox.com" target="_blank">mapbox.com</a>';
        dialogContent.appendChild(info);
        
        // Token section
        const tokenSection = document.createElement('div');
        tokenSection.className = 'mapbox-token-section';
        
        const tokenLabel = document.createElement('label');
        tokenLabel.setAttribute('for', 'mapbox-token-input');
        tokenLabel.textContent = 'MapBox API Token:';
        tokenSection.appendChild(tokenLabel);
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'text';
        tokenInput.id = 'mapbox-token-input';
        tokenInput.value = this.mapboxToken;
        tokenInput.placeholder = 'pk.eyJ1...';
        tokenSection.appendChild(tokenInput);
        
        const saveTokenBtn = document.createElement('button');
        saveTokenBtn.id = 'mapbox-save-token';
        saveTokenBtn.className = 'mapbox-btn';
        saveTokenBtn.textContent = 'Save Token';
        tokenSection.appendChild(saveTokenBtn);
        
        const clearTokenBtn = document.createElement('button');
        clearTokenBtn.id = 'mapbox-clear-token';
        clearTokenBtn.className = 'mapbox-btn mapbox-btn-secondary';
        clearTokenBtn.textContent = 'Clear Token';
        tokenSection.appendChild(clearTokenBtn);
        
        dialogContent.appendChild(tokenSection);
        
        // Styles section
        const stylesSection = document.createElement('div');
        stylesSection.className = 'mapbox-styles-section';
        if (!this.mapboxToken) {
            stylesSection.style.opacity = '0.5';
            stylesSection.style.pointerEvents = 'none';
        }
        
        const stylesTitle = document.createElement('h3');
        stylesTitle.textContent = 'Select Map Style:';
        stylesSection.appendChild(stylesTitle);
        
        const styleGrid = document.createElement('div');
        styleGrid.className = 'mapbox-style-grid';
        
        const styles = [
            { id: 'streets-v12', name: 'Streets' },
            { id: 'outdoors-v12', name: 'Outdoors' },
            { id: 'light-v11', name: 'Light' },
            { id: 'dark-v11', name: 'Dark' },
            { id: 'satellite-v9', name: 'Satellite' },
            { id: 'satellite-streets-v12', name: 'Satellite Streets' },
            { id: 'navigation-day-v1', name: 'Navigation Day' },
            { id: 'navigation-night-v1', name: 'Navigation Night' }
        ];
        
        styles.forEach(style => {
            const label = document.createElement('label');
            label.className = 'mapbox-style-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'mapbox-style';
            radio.value = style.id;
            if (this.mapboxStyleId === style.id) {
                radio.checked = true;
            }
            label.appendChild(radio);
            
            const span = document.createElement('span');
            span.textContent = style.name;
            label.appendChild(span);
            
            styleGrid.appendChild(label);
        });
        
        stylesSection.appendChild(styleGrid);
        
        const applyStyleBtn = document.createElement('button');
        applyStyleBtn.id = 'mapbox-apply-style';
        applyStyleBtn.className = 'mapbox-btn mapbox-btn-primary';
        applyStyleBtn.textContent = 'Apply Style';
        stylesSection.appendChild(applyStyleBtn);
        
        dialogContent.appendChild(stylesSection);
        
        const closeBtn = document.createElement('button');
        closeBtn.id = 'mapbox-close';
        closeBtn.className = 'mapbox-btn mapbox-btn-close';
        closeBtn.textContent = 'Close';
        dialogContent.appendChild(closeBtn);
        
        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);
        
        // Add event listeners
        saveTokenBtn.addEventListener('click', () => {
            const token = tokenInput.value.trim();
            if (token) {
                this.mapboxToken = token;
                this.setCookie('mapboxToken', token);
                stylesSection.style.opacity = '1';
                stylesSection.style.pointerEvents = 'auto';
                alert('MapBox token saved! You can now select a map style.');
            }
        });
        
        clearTokenBtn.addEventListener('click', () => {
            this.mapboxToken = '';
            this.setCookie('mapboxToken', '', -1);
            tokenInput.value = '';
            stylesSection.style.opacity = '0.5';
            stylesSection.style.pointerEvents = 'none';
            alert('MapBox token cleared.');
        });
        
        applyStyleBtn.addEventListener('click', () => {
            if (!this.mapboxToken) {
                alert('Please save your MapBox token first.');
                return;
            }
            const selectedRadio = document.querySelector('input[name="mapbox-style"]:checked');
            if (selectedRadio) {
                this.mapboxStyleId = selectedRadio.value;
                this.setCookie('mapboxStyleId', this.mapboxStyleId);
                this.applyMapBoxStyle();
                this.closeMapBoxDialog();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            this.closeMapBoxDialog();
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.closeMapBoxDialog();
            }
        });
    }
    
    closeMapBoxDialog() {
        const dialog = document.querySelector('.mapbox-dialog');
        if (dialog) {
            dialog.remove();
        }
        this.mapboxDialogOpen = false;
    }
    
    applyMapBoxStyle() {
        if (!this.mapboxToken) {
            alert('MapBox token is required. Please enter your token in the MapBox dialog.');
            return;
        }
        
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }
        
        const url = 'https://api.mapbox.com/styles/v1/mapbox/' + this.mapboxStyleId + '/tiles/{z}/{x}/{y}?access_token=' + this.mapboxToken;
        
        this.currentTileLayer = L.tileLayer(url, {
            attribution: '© Mapbox © OpenStreetMap',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 22
        });
        
        this.currentTileLayer.addTo(this.map);
        
        this.updateMapBoxUIColors();
        
        console.log('MapBox style applied: ' + this.mapboxStyleId);
    }
    
    updateMapBoxUIColors() {
        const colorSchemes = {
            'streets-v12': {
                aircraftColor: '#1a73e8',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#1a73e8',
                primaryColor: '#1a73e8'
            },
            'outdoors-v12': {
                aircraftColor: '#4a7c59',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#2d5a3a',
                primaryColor: '#4a7c59'
            },
            'light-v11': {
                aircraftColor: '#2563eb',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#1e40af',
                primaryColor: '#2563eb'
            },
            'dark-v11': {
                aircraftColor: '#40e0d0',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#40e0d0',
                primaryColor: '#40e0d0'
            },
            'satellite-v9': {
                aircraftColor: '#fff',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#fff',
                primaryColor: '#fff'
            },
            'satellite-streets-v12': {
                aircraftColor: '#fff',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#fff',
                primaryColor: '#fff'
            },
            'navigation-day-v1': {
                aircraftColor: '#1a73e8',
                labelBackground: 'rgb(255, 255, 255)',
                labelTextColor: '#1a73e8',
                primaryColor: '#1a73e8'
            },
            'navigation-night-v1': {
                aircraftColor: '#60a5fa',
                labelBackground: 'rgb(0, 0, 0)',
                labelTextColor: '#60a5fa',
                primaryColor: '#60a5fa'
            }
        };
        
        const colors = colorSchemes[this.mapboxStyleId] || colorSchemes['streets-v12'];
        
        this.aircraftMarkers.forEach((marker, callsign) => {
            const icon = marker.options.icon;
            if (icon && icon.options.html) {
                const newHtml = icon.options.html.replace(/fill="[^"]*"/, 'fill="' + colors.aircraftColor + '"');
                marker.setIcon(L.divIcon({
                    className: icon.options.className,
                    html: newHtml,
                    iconSize: icon.options.iconSize,
                    iconAnchor: icon.options.iconAnchor
                }));
            }
        });
        
        this.labelLayers.forEach((labelGroup, callsign) => {
            const label = labelGroup.label;
            if (label && label._icon) {
                label._icon.style.background = colors.labelBackground;
                label._icon.style.color = colors.labelTextColor;
                label._icon.style.borderColor = colors.primaryColor;
            }
        });
    }
}


// Initialize the radar display when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Virtual Flight Online Radar Display');
    window.radar = new RadarDisplay();
    window.radarDisplay = window.radar; // Backwards compatibility alias
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.radar && window.radar.map) {
        window.radar.map.invalidateSize();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.radar) {
        window.radar.stopSmoothMovement();
    }
});
