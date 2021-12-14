/*eslint-disable*/
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2xpbCIsImEiOiJja3d4aDM4YTkwZHRqMm9tbno4bGM1NzN1In0.bCOJXx0e40eSF3FZhxeRHg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/clil/ckwxrbe4100vw14pcglcw59sr',
    scrollZoom: false,

    //   center: [-118.113491, 34.111745],
    //   zoom: 4,
    //   interactive
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker to the map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extend map bounds to include current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
