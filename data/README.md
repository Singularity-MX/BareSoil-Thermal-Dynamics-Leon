# Data Directory

This directory contains the raw and processed spatial datasets, tabular data, and experimental design polygons used for the statistical analysis of the thermal influence of brick kilns in León, Guanajuato. 

The data is divided into three main subdirectories based on their format and role in the methodology.

## Directory Structure

### 📁 `datasets/`
Contains the tabular data (`.csv`) exported directly from the Google Earth Engine (GEE) extraction script. These files serve as the primary input for the statistical analysis and hypothesis testing in the Jupyter notebook.

*   **`datos_pixeles_[year].csv`**: Pixel-level data (30m resolution) for all 8 spectral variables and thermal bands within the 100m, 500m, and 1000m buffer zones.
*   **`stats_poligono_[year].csv`**: Summary statistics (mean, std, count) calculated directly over the base study polygons (no buffers applied).
*   **`stats_zonas_[year].csv`**: Summary statistics aggregated by buffer zone distance for each specific feature.
*   **`tabla_pareada_[year].csv`**: The paired dataset containing 16 rows (8 kilns + 8 bare soil controls), explicitly structured with the `par_id` key for the Wilcoxon signed-rank test.

### 📁 `maps_lst/`
Contains the geospatial raster data (GeoTIFFs) and boundary vectors generated from the Landsat 8 C2 L2 collection. 

*   **`LST_Leon_[year].tif`**: Annual Land Surface Temperature (LST) median composites for the dry season (March - May) of 2024, 2025, and 2026.
*   **`LST_Promedio_24_26.tif`**: The 3-year aggregated average LST raster for the study area.
*   **`NDMI_Promedio_24_26.tif`**: The 3-year aggregated average Normalized Difference Moisture Index (NDMI) raster, used to evaluate canopy moisture and hydric stress.
*   **`Poligonos_Estudio.geojson`**: A consolidated vector file containing all the final study areas used during the GEE extraction.

### 📁 `polygons/`
Contains the original vector files (KML) defining the experimental paired design of the study.

*   **`Preliminary_Map_Paired_Brick_Kilns.kml`**: The 8 active peri-urban brick kiln polygons selected for the study.
*   **`Map_Paired_Bare_Soils.kml`**: The 8 control polygons representing bare soil, geographically paired (1-3 km radius) with the brick kilns to maintain similar topographic and urban conditions.

---

## Usage Note
If you are reproducing the analysis, ensure that the `.csv` files inside `datasets/` remain unaltered, as the scripts inside the `notebook/` directory rely on these exact filenames and data structures to execute the non-parametric tests and generate the final figures.