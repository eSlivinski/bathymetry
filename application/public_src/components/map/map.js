this.on('mount', () => {
  var map = window.map = L.map('map', {
    center: [60.3531, -152.9097],
    zoom: 12
  });

  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }).addTo(map);

  var colorScale = d3.scaleLinear()
    .range(['#fff7ec', '#08306b'])
    .domain([0, 100]);

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

  map.on('zoomend', () => {
    d3.selectAll('path').attr('d', path);
  });

  function contourClicked (d) {
    var latlng = map.mouseEventToLatLng(d3.event);
    var popup = L.popup()
      .setLatLng(latlng)
      .setContent('Depth: ~' + Math.abs(d.properties.Contour) + 'ft.');

    setTimeout(() => { map.openPopup(popup); }, 500);
  }

  function loadCollectedData () {
    d3.json('data/collected-data.geojson', (err, data) => {
      d3.json('data/crescent.geojson', (err, snipe) => {

        var totalSampleSize = 400;

        _.forEach(data.features, d => {
          d.properties.Depth = Math.abs(d.properties.Depth2);
        });

        var shorePts = turf.featureCollection(
          _.map(turf.coordAll(snipe), d => {
            var point = turf.point(d);
            point.properties.Depth = 0;
            return point;
          })
        );

        window.sample = turf.sample(data, totalSampleSize * 0.5);
        window.sample.features = window.sample.features.concat(turf.sample(shorePts, totalSampleSize * 0.5).features);
        window.idw = turf.idw(window.sample, 'Depth', 2, 0.15, 'kilometers');
        window.centroids = turf.featureCollection(
          _.map(window.idw.features, feature => {
            var centroid = turf.centroid(feature);
            centroid.properties.z = Math.round(feature.properties.z / 10) * 10;
            return centroid;
          })
        );
        window.depths = turf.within(window.centroids, snipe);
        // window.isolines = turf.isolines(window.centroids, 'z', 15, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]);
      // //
        g.selectAll('path')
          .data(window.depths.features)
          .enter().append('path')
            .attr('d', path)
            .attr('fill', (d) => { return colorScale(d.properties.z ); })
            .attr('stroke-width', 0)
            .on('click', d=> { console.log(d); } );
      });
    });
  }
  loadCollectedData();

  // d3.json('data/focal-10-contour-10.geojson', (err, data) => {
  //   if (err) { return console.error(err); }
  //
  //   var deepest = _.min(_.map(data.features, d => { return d.properties.Contour; }));
  //
  //   colorScale.domain([0, deepest]);
  //
  //   var contours = _.chain(data.features)
  //     .map(d => {
  //       d.properties.color = colorScale(d.properties.Contour);
  //       return turfSimplify(d, 0.0001, false);
  //     })
  //     .orderBy(['properties', 'Contour'])
  //     .reverse()
  //     .value();
  //
  //   g.selectAll('path')
  //     .data(contours)
  //     .enter().append('path')
  //       .attr('d', path)
  //       .attr('class', 'contour')
  //       .attr('stroke', d => { return d.properties.color; })
  //       .attr('fill', d => { return d.properties.color; })
  //       .attr('stroke-width', 0)
  //       .attr('fill-opacity', 0)
  //       .on('click', contourClicked)
  //     .transition().delay(500)
  //       .attr('fill-opacity', 0.5)
  //     .transition().delay(500)
  //       .attr('stroke-width', 3);
  // });

});
