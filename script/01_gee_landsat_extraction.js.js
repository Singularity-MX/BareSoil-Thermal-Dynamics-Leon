// -----------------------------------------------------------------------------
// Spectral variables extraction - Brick Kilns Project (Leon, Gto.)
// Design: Paired (8 kilns vs 8 controls, buffers: 100m, 500m, 1000m)
// Collection: Landsat 8 C2 L2 | Dry season (Mar-May) 2024-2026
// -----------------------------------------------------------------------------

// Asset imports
var leon = ee.FeatureCollection("projects/singularity-500215/assets/Leon");
var brick_kilns = ee.FeatureCollection("projects/singularity-500215/assets/ladrilleras");
var bare_soils = ee.FeatureCollection("projects/singularity-500215/assets/suelos_desnudos");

// Environment setup
Map.centerObject(leon, 11);
var emptyOutline = ee.Image().byte().paint({featureCollection: leon, color: 1, width: 2});
Map.addLayer(emptyOutline, {palette: ['red']}, 'Leon Municipal Boundary', true);

var years = [2024, 2025, 2026];

// -----------------------------------------------------------------------------
// Index processing and masking functions
// -----------------------------------------------------------------------------

function maskClouds(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0).and(qa.bitwiseAnd(1 << 4).eq(0));
  return image.updateMask(mask);
}

function addLST(image) {
  return image.addBands(
    image.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15).rename('LST_Celsius')
  );
}

function addNDVI(image) {
  return image.addBands(image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI'));
}

function addNDBI(image) {
  return image.addBands(image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI'));
}

function addNDMI(image) {
  return image.addBands(image.normalizedDifference(['SR_B5', 'SR_B6']).rename('NDMI'));
}

function addNDSI(image) {
  var swir1 = image.select('SR_B6');
  var red   = image.select('SR_B4');
  var nir   = image.select('SR_B5');
  var blue  = image.select('SR_B2');
  var ndsi  = swir1.add(red).subtract(nir).subtract(blue)
                   .divide(swir1.add(red).add(nir).add(blue)).rename('NDSI');
  return image.addBands(ndsi);
}

function addUI(image) {
  return image.addBands(image.normalizedDifference(['SR_B7', 'SR_B5']).rename('UI'));
}

function addMNDWI(image) {
  return image.addBands(image.normalizedDifference(['SR_B3', 'SR_B6']).rename('MNDWI'));
}

function addIBI(image) {
  var swir1 = image.select('SR_B6');
  var nir   = image.select('SR_B5');
  var red   = image.select('SR_B4');
  var green = image.select('SR_B3');

  var ndbi_comp  = swir1.multiply(2).divide(swir1.add(nir));
  var ndvi_comp  = nir.divide(nir.add(red));
  var mndwi_comp = green.divide(green.add(swir1));
  var numerator  = ndbi_comp.subtract(ndvi_comp.add(mndwi_comp));
  var denominator = ndbi_comp.add(ndvi_comp.add(mndwi_comp));
  return image.addBands(numerator.divide(denominator).rename('IBI'));
}

// -----------------------------------------------------------------------------
// Paired design structuring (pair_id)
// -----------------------------------------------------------------------------

var kilns = brick_kilns.map(function(f) { return f.set('class', 'kiln'); });
var bareSoil = bare_soils.map(function(f) { return f.set('class', 'bare_soil'); });

var kilnsList = kilns.toList(kilns.size());
var bareSoilList = bareSoil.toList(bareSoil.size());

var pairedKilns = ee.FeatureCollection(
  ee.List.sequence(0, kilns.size().subtract(1)).map(function(i) {
    return ee.Feature(kilnsList.get(i))
      .set('pair_id', ee.Number(i).add(1))
      .set('feature_id', ee.Feature(kilnsList.get(i)).id());
  })
);

var pairedBareSoil = ee.FeatureCollection(
  ee.List.sequence(0, bareSoil.size().subtract(1)).map(function(i) {
    return ee.Feature(bareSoilList.get(i))
      .set('pair_id', ee.Number(i).add(1))
      .set('feature_id', ee.Feature(bareSoilList.get(i)).id());
  })
);

var studyPoints = pairedKilns.merge(pairedBareSoil);
var distances = [100, 500, 1000];

var bufferZones = ee.FeatureCollection(
  distances.map(function(dist) {
    return studyPoints.map(function(feature) {
      return feature.buffer(dist).set('buffer_m', dist);
    });
  })
).flatten();

// -----------------------------------------------------------------------------
// Annual data processing and export
// -----------------------------------------------------------------------------

function processYear(year) {
  var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(leon)
    .filter(ee.Filter.calendarRange(year, year, 'year'))
    .filter(ee.Filter.calendarRange(3, 5, 'month'));

  var processedCol = collection.map(maskClouds).map(addLST).map(addNDVI)
                               .map(addNDBI).map(addNDMI).map(addNDSI)
                               .map(addUI).map(addMNDWI).map(addIBI);

  var composite = processedCol.median().clip(leon);
  var bands = composite.select(['LST_Celsius', 'NDVI', 'NDBI', 'NDMI', 'NDSI', 'UI', 'MNDWI', 'IBI']);

  // Export: Pixel-level data
  var pixelData = bands.sampleRegions({
    collection: bufferZones,
    properties: ['class', 'buffer_m', 'pair_id', 'feature_id'],
    scale: 30, geometries: true
  }).map(function(f) { return f.set('year', year); });

  Export.table.toDrive({
    collection: pixelData,
    description: 'pixel_data_' + year,
    folder: 'GEE_Leon_Ladrilleras_v3',
    fileNamePrefix: 'pixel_data_' + year,
    fileFormat: 'CSV'
  });

  // Export: Zonal statistics (buffers)
  var zoneStats = bands.reduceRegions({
    collection: bufferZones,
    reducer: ee.Reducer.mean().combine(ee.Reducer.stdDev(), null, true)
              .combine(ee.Reducer.count(), null, true).combine(ee.Reducer.min(), null, true)
              .combine(ee.Reducer.max(), null, true),
    scale: 30, crs: 'EPSG:4326'
  }).map(function(f) { return f.set('year', year); });

  Export.table.toDrive({
    collection: zoneStats, description: 'zone_stats_' + year,
    folder: 'GEE_Leon_Ladrilleras_v3', fileNamePrefix: 'zone_stats_' + year, fileFormat: 'CSV'
  });

  // Export: Polygon statistics (no buffer)
  var polygonStats = bands.reduceRegions({
    collection: studyPoints,
    reducer: ee.Reducer.mean().combine(ee.Reducer.stdDev(), null, true)
              .combine(ee.Reducer.count(), null, true),
    scale: 30
  }).map(function(f) { return f.set('year', year); });

  Export.table.toDrive({
    collection: polygonStats, description: 'polygon_stats_' + year,
    folder: 'GEE_Leon_Ladrilleras_v3', fileNamePrefix: 'polygon_stats_' + year, fileFormat: 'CSV'
  });

  // Reference visualization (last year only)
  if (year === 2026) {
    Map.addLayer(composite, { bands: ['LST_Celsius'], min: 25, max: 50, palette: ['blue','cyan','green','yellow','red','darkred'] }, 'LST °C — 2026', true);
  }
  return composite;
}

processYear(2024);
processYear(2025);
processYear(2026);

// -----------------------------------------------------------------------------
// Paired table generation (Wilcoxon base)
// -----------------------------------------------------------------------------

years.forEach(function(year) {
  var composite = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(leon).filter(ee.Filter.calendarRange(year, year, 'year')).filter(ee.Filter.calendarRange(3, 5, 'month'))
    .map(maskClouds).map(addLST).map(addNDVI).map(addNDBI).map(addNDMI).map(addNDSI).map(addUI).map(addMNDWI).map(addIBI)
    .median().clip(leon).select(['LST_Celsius','NDVI','NDBI','NDMI','NDSI','UI','MNDWI','IBI']);

  var pairedTable = composite.reduceRegions({
    collection: studyPoints,
    reducer: ee.Reducer.mean().combine(ee.Reducer.stdDev(), null, true).combine(ee.Reducer.count(), null, true),
    scale: 30
  }).map(function(f) { return f.set('year', year); });

  Export.table.toDrive({
    collection: pairedTable, description: 'paired_table_' + year,
    folder: 'GEE_Leon_Ladrilleras_v3', fileNamePrefix: 'paired_table_' + year, fileFormat: 'CSV'
  });
});

// -----------------------------------------------------------------------------
// Visual verification of geometric pairs
// -----------------------------------------------------------------------------

Map.addLayer(bufferZones, {color: 'purple'}, 'Buffers 100/500/1000m', false);
Map.addLayer(brick_kilns, {color: 'orange'}, 'Kiln Polygons');
Map.addLayer(bare_soils, {color: 'cyan'}, 'Control Polygons (Bare Soil)');
Map.addLayer(pairedKilns.map(function(f) { return f.centroid(); }), {color: 'orange'}, 'Kiln Centroids');
Map.addLayer(pairedBareSoil.map(function(f) { return f.centroid(); }), {color: 'cyan'}, 'Control Centroids');

print('Processing complete. Check the TASKS tab to start exports.');

// Coordinate validation test (console)
var listKilns = pairedKilns.toList(8);
var listBareSoil = pairedBareSoil.toList(8);

ee.List.sequence(0, 7).evaluate(function(indices) {
  indices.forEach(function(i) {
    var kiln = ee.Feature(listKilns.get(i));
    var control = ee.Feature(listBareSoil.get(i));
    
    kiln.geometry().centroid().evaluate(function(coordK) {
      control.geometry().centroid().evaluate(function(coordC) {
        kiln.get('pair_id').evaluate(function(pid) {
          print('PAIR ' + pid + ' | KILN: ' + coordK.coordinates[1].toFixed(4) + ',' + coordK.coordinates[0].toFixed(4) + ' | CTRL: ' + coordC.coordinates[1].toFixed(4) + ',' + coordC.coordinates[0].toFixed(4));
        });
      });
    });
  });
});