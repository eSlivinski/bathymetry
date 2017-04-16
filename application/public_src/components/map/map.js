this.on('mount', () => {
  var map = L.map('map', {
    center: [60.3764, -152.9311],
    zoom: 13
  });
  map.on('zoomend', () => {
    d3.selectAll('path')
      .attr('d', path);
  });

  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);

  var colorScale = d3.scaleLinear()
    .range(['#fff7ec', '#08306b']);

  L.svg({ clickable: true }).addTo(map);

  var svg = d3.select('#map').select('svg');
  var g = svg.select('g');

  var transform = d3.geoTransform({
    point: function (x, y) {
      var point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }
  });
  var path = d3.geoPath().projection(transform);

  d3.json('data/focal-10-contour-10.geojson', (err, data) => {
    if (err) { return console.error(err); }

    var deepest = _.min(_.map(data.features, d => { return d.properties.Contour; }));

    colorScale.domain([0, deepest]);

    var contours = _.chain(data.features)
      .map(d => {
        d.properties.color = colorScale(d.properties.Contour);
        return turfSimplify(d, 0.0001, false);
      })
      .orderBy(['properties', 'Contour'])
      .reverse()
      .value();

    g.selectAll('path')
      .data(contours)
      .enter().append('path')
        .attr('d', path)
        .attr('class', 'contour')
        .attr('stroke', d => { return d.properties.color; })
        .attr('fill', d => { return d.properties.color; })
        .attr('stroke-width', 0)
        .attr('fill-opacity', 0)
        .on('click', contourClicked)
      .transition().delay(500)
        .attr('fill-opacity', 0.5)
      .transition().delay(500)
        .attr('stroke-width', 3);
  });

  function contourClicked (d) {
    var latlng = map.mouseEventToLatLng(d3.event);
    var popup = L.popup()
      .setLatLng(latlng)
      .setContent('Depth: ~' + Math.abs(d.properties.Contour) + 'ft.');

    setTimeout(() => { map.openPopup(popup); }, 200);
  }
});
