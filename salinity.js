@author: baoannguyen

Map.setCenter(106.8517, 10.533, 13);

var image_2020 = ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_124053_20200115');
var image_2015 = ee.Image('LANDSAT/LC08/C01/T1_SR/LC08_124053_20150218');



// Visualize image
var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(image_2015.clip(region), visParams,'Image 2015');
Map.addLayer(image_2020.clip(region), visParams,'Image 2020');




//define threshold 
var waterThreshold = -1;
var vegetationThreshold = 0.4
var soilThreshold = 0.085
// classification

// Calculate NDVI and mNDWI. (normalized difference vegetation index and water index )
// 2020
var ndvi_2020 = image_2020.normalizedDifference(['B5', 'B4']).rename('NDVI');
var ndwi_2020 = image_2020.normalizedDifference(['B3', 'B6']).rename('NDWI');
// 2015
var ndvi_2015 = image_2015.normalizedDifference(['B5', 'B4']).rename('NDVI');
var ndwi_2015 = image_2015.normalizedDifference(['B3', 'B6']).rename('NDWI');

// Get pixels above the threshold.
// 2020
var water_2020 = ndwi_2020.gte(0.15) //.and(ndvi.gte(waterThreshold)).and(ndvi.lte(soilThreshold));
var soil_2020 = ndvi_2020.gte(soilThreshold).and(ndvi_2020.lte(vegetationThreshold));
var vegetation_2020 = ndvi_2020.gte(vegetationThreshold);
// 2015
var water_2015 = ndwi_2015.gte(0.15) //.and(ndvi.gte(waterThreshold)).and(ndvi.lte(soilThreshold));
var soil_2015 = ndvi_2015.gte(soilThreshold).and(ndvi_2015.lte(vegetationThreshold));
var vegetation_2015 = ndvi_2015.gte(vegetationThreshold);

// Updates mask
// 2020
var CGwater_2020 = water_2020.updateMask(water_2020);
var CGvegetation_2020 = vegetation_2020.updateMask(vegetation_2020);
var CGsoil_2020 = soil_2020.updateMask(soil_2020);
// 2015
var CGwater_2015 = water_2015.updateMask(water_2015);
var CGvegetation_2015 = vegetation_2015.updateMask(vegetation_2015);
var CGsoil_2015 = soil_2015.updateMask(soil_2015);

// EVI
var evi = function (image) // convert function
{
  var evi_cal = image.expression(
    '(2.5 * ((NIR * 0.0001 - RED * 0.0001) / (NIR * 0.0001 + 6 * RED * 0.0001 - 7.5 * BLUE * 0.0001 + 1)))', {
      'NIR': image.select('B5'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2')
});
  return  ee.Image(evi_cal.copyProperties(image)).set('system:time_start', image.get('system:time_start')); 
// using expression will lost image properties => coppy original image properties 
};

// GCI
var gci = function (image) // convert function
{
  var gci_cal = image.expression(
    '((NIR * 0.0001) / (GREEN * 0.0001)) - 1', {
      'NIR': image.select('B5'),
      'GREEN': image.select('B3')
});
  return  ee.Image(gci_cal.copyProperties(image)).set('system:time_start', image.get('system:time_start')); 
// using expression will lost image properties => coppy original image properties 
};

// Calculation EVI and GCI
// 2020
var GCI_2020 = gci(image_2020)
var EVI_2020 = evi(image_2020)

// 2015
var GCI_2015 = gci(image_2015)
var EVI_2015 = evi(image_2015)

//Threshold for weak tree
var threshold_weak_tree = 0.457

// Pixel around threshold for EVI
//2020
var weak_tree_2020 = EVI_2020.lte(threshold_weak_tree)
var strong_tree_2020 = EVI_2020.gt(threshold_weak_tree)
var EVI_weak_tree_2020 = EVI_2020.updateMask(weak_tree_2020).updateMask(vegetation_2020)
var EVI_strong_tree_2020 = EVI_2020.updateMask(strong_tree_2020).updateMask(vegetation_2020)
Map.addLayer(EVI_weak_tree_2020.clip(region),{palette:'orange'},'Weak tree 2020')
Map.addLayer(EVI_strong_tree_2020.clip(region),{palette:'red'},'Strong tree 2020')


// 2015
var weak_tree_2015 = EVI_2015.lte(threshold_weak_tree)
var strong_tree_2015 = EVI_2015.gt(threshold_weak_tree)
var EVI_weak_tree_2015 = EVI_2015.updateMask(weak_tree_2015).updateMask(vegetation_2015)
var EVI_strong_tree_2015 = EVI_2015.updateMask(strong_tree_2015).updateMask(vegetation_2015)
Map.addLayer(EVI_weak_tree_2015.clip(region),{palette:'orange'},'Weak tree 2015')
Map.addLayer(EVI_strong_tree_2015.clip(region),{palette:'red'},'Strong tree 2015')

// Pre-define some customization options.
var options = {
  title: 'EVI histogram',
  fontSize: 20,
  hAxis: {title: 'EVI'},
  vAxis: {title: 'count of pixel'},
};

var histogram = ui.Chart.image.histogram(EVI_2020.updateMask(vegetation_2020).clip(region),region)
    .setOptions(options);

print(histogram)

// Salinity
// NDTI (Normalized difference salinity index)
var NDSI_2020 = image_2020.normalizedDifference(['B3','B4']).clip(region);
var NDSI_2015 = image_2015.normalizedDifference(['B3','B4']).clip(region);


var options = {
  title: 'NDSI histogram',
  fontSize: 20,
  hAxis: {title: 'NDSI'},
  vAxis: {title: 'count of pixel'},
};

var histogram = ui.Chart.image.histogram(NDSI_2020.updateMask(vegetation_2020).clip(region),region)
    .setOptions(options);

print(histogram)

var threshold_salt = 0.176
//2020
var sal_less_2020 = NDSI_2020.lt(threshold_salt)
var sal_more_2020 = NDSI_2020.gte(threshold_salt)
var NDSI_sal_less_2020 = NDSI_2020.updateMask(sal_less_2020).updateMask(vegetation_2020)
var NDSI_sal_more_2020 = NDSI_2020.updateMask(sal_more_2020).updateMask(vegetation_2020)
Map.addLayer(NDSI_sal_less_2020.clip(region),{palette:'cyan'},'NDTI less than 0.176 (2020)')
Map.addLayer(NDSI_sal_more_2020.clip(region),{palette:'blue'},'NDTI more than 0.176 (2020)')

// 2015
var sal_less_2015 = NDSI_2015.lt(threshold_salt)
var sal_more_2015 = NDSI_2015.gte(threshold_salt)
var NDSI_sal_less_2015 = NDSI_2015.updateMask(sal_less_2015).updateMask(vegetation_2015)
var NDSI_sal_more_2015 = NDSI_2015.updateMask(sal_more_2015).updateMask(vegetation_2015)
Map.addLayer(NDSI_sal_less_2015.clip(region),{palette:'cyan'},'NDTI less than 0.176 (2015)')
Map.addLayer(NDSI_sal_more_2015.clip(region),{palette:'blue'},'NDTI more than 0.176 (2015)')

//Results
var results_sal_vege_2020 = NDSI_2020.gt(threshold_salt).and(EVI_2020.lte(threshold_weak_tree))
var results_sal_vege_2015 = NDSI_2015.gt(threshold_salt).and(EVI_2015.lte(threshold_weak_tree))

var results_2020 = results_sal_vege_2020.updateMask(results_sal_vege_2020)
Map.addLayer(results_2020.clip(region),{palette:'yellow'},'result 2020')

var results_2015 = results_sal_vege_2015.updateMask(results_sal_vege_2015)
Map.addLayer(results_2015.clip(region),{palette:'yellow'},'result 2015')

Export.image.toDrive({
  
  image: results_2020,
  description: 'Final result (2020)',
  scale: 30,
  fileFormat: 'PNG', 
  region: region //tên shapefile khi add vào code 
});
