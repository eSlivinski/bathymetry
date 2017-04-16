this.on('mount', function () {
  var map = L.map('map', {
    center: [60.3764, -152.9311],
    zoom: 13
  }).on('zoomend', function() {
    d3.selectAll('path')
      .attr('d', path);
  });

  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);

  var colorScale = d3.scaleLinear()
    .range(['#fff7ec', '#08306b']);

  L.svg({ clickable: true }).addTo(map);

  var svg = d3.select('#map').select('svg')
    .attr('pointer-events', 'auto');

  var g = svg.select('g');

  var transform = d3.geoTransform({
        point: function (x, y) {
          var point = map.latLngToLayerPoint(new L.LatLng(y, x));
          this.stream.point(point.x, point.y);
        }
      }),
      path = d3.geoPath().projection(transform);


  d3.json('data/focal-10-contour-10.geojson', function (err, data) {
    if (err) { return console.error(err); }

    var deepest = _.min(_.map(data.features, function (d) { return d.properties.Contour; }));

    colorScale.domain([0, deepest]);

    var contours = _.chain(data.features)
      .map(function(d) { return turfSimplify(d, 0.0001, false); })
      .orderBy(['properties', 'Contour'])
      .reverse()
      .value();

    g.selectAll('path')
      .data(contours)
      .enter().append('path')
      .attr('d', path)
      .attr('stroke-width', 0)
      .attr('stroke', function (feature) { return colorScale(feature.properties.Contour); })
      .attr('fill', function (feature) { return colorScale(feature.properties.Contour); })
      .attr('fill-opacity', 0)
      .attr('stroke-linejoin', 'round')
      .transition().delay(500)
      .attr('fill-opacity', 0.5)
      .transition().delay(500)
      .attr('stroke-width', 3);

  });
});
