this.on('mount', function() {
  console.log('I am in a separate file!!!');
  var crescent;

  var map = L.map('map', {
    center: [60.3764, -152.9311],
    zoom: 13
  });

  var basemap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);


  d3.json('http://localhost:8081/data/crescent.geojson', function (err, data) {
    if (err) { return console.error(err); }
    crescent = L.geoJSON(data).addTo(map);
    map.fitBounds(crescent.getBounds());
  });
});
