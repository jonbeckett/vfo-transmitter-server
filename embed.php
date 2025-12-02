<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Virtual Flight Online - Radar Embed</title>
    <link rel="shortcut icon" type="image/jpg" href="img/vfo_logo_300x300.jpg"/>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" crossorigin="anonymous"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossorigin="anonymous" />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-U1DAWAznBHeqEIlVSCgzq+c9gqGAJn5c/t99JyeKa9xxaYpSvHU5awsuZVVFIhvj" crossorigin="anonymous"></script>
    <link href="css/style.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.1/dist/leaflet.css" integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14=" crossorigin="anonymous"/>
    <script src="https://unpkg.com/leaflet@1.9.1/dist/leaflet.js" integrity="sha256-NDI0K41gVbWqfkkaHj15IzU7PtMoelkzyKp8TOaFQ3s=" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdn.jsdelivr.net/npm/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.min.js"></script>
    <link rel="stylesheet" href="css/radar.css?t=<?php echo(time());?>" />
    <link rel="stylesheet" href="css/embed.css?t=<?php echo(time());?>" />
    <script src="js/radar.js?t=<?php echo(time());?>" crossorigin="anonymous"></script>
    <link rel="icon" href="img/vfo_logo_300x300.jpg" />
</head>
<body>
    <div class="radar-container">
        <div class="embed-controls">
            <button class="embed-btn" id="embed-zoom-in" title="Zoom In">
                <i class="fas fa-plus"></i>
            </button>
            <button class="embed-btn" id="embed-zoom-out" title="Zoom Out">
                <i class="fas fa-minus"></i>
            </button>
            <button class="embed-btn" id="embed-open-full" title="Open Full Radar">
                <i class="fas fa-external-link-alt"></i>
            </button>
        </div>
        
        <div id="radar-map"></div>
    </div>
    
    <script>
        // Initialize radar display
        const radar = new RadarDisplay();
        
        // Zoom controls
        document.getElementById('embed-zoom-in').addEventListener('click', function() {
            radar.map.zoomIn();
        });
        
        document.getElementById('embed-zoom-out').addEventListener('click', function() {
            radar.map.zoomOut();
        });
        
        // Open full radar in new tab
        document.getElementById('embed-open-full').addEventListener('click', function() {
            window.open('radar.php', '_blank');
        });
    </script>
</body>
</html>
