# Execution Instructions: Google Earth Engine (GEE)

This document outlines the steps required to execute the spatial data extraction script (`01_gee_landsat_extraction.js`) using the Google Earth Engine Code Editor.

## Prerequisites

Before running the script, ensure you have the following configured:
1. A **Google Cloud Account**.
2. A registered **Google Cloud Project** with the **Google Earth Engine API** enabled.
3. Access to the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).

## Step 1: Upload Shapefile Assets

The script relies on three vector layers (shapefiles) to define the study area and the experimental design polygons. These are located in the repository at `script/assets/`.

1. Open the [GEE Code Editor](https://code.earthengine.google.com/).
2. Navigate to the **Assets** tab in the left panel.
3. Click on the **New** button and select **Shape files (.shp, .shx, .dbf, .prj, or .zip)**.
4. Upload the following zipped shapefiles from your local repository (`BareSoil-Thermal-Dynamics-Leon/script/assets/`):
   * `Leon.zip`
   * `ladrilleras_p.zip` (Ensure the asset is named `ladrilleras` once uploaded)
   * `suelos_desnudos.zip`
5. Wait for the ingestion tasks to complete (you can monitor this in the **Tasks** tab). 

*Note: Once uploaded, verify that the asset paths in `01_gee_landsat_extraction.js` match your Google Cloud project ID.*

## Step 2: Load and Execute the Script

1. In the left panel of the GEE Code Editor, go to the **Scripts** tab.
2. Click **New** -> **File** to create a new script file.
3. Name the file `01_gee_landsat_extraction` and open it.
4. Copy the entire content of `01_gee_landsat_extraction.js` from this repository and paste it into the editor.
5. Click the **Run** button at the top of the editor.
6. The map will load the study area, the polygons, and validate the geographic pairs in the **Console** tab.

## Step 3: Export Data to Google Drive

Executing the script prepares the data for extraction, but you must manually start the export tasks to generate the CSV files.

1. Navigate to the **Tasks** tab in the right panel.
2. You will see multiple pending export tasks (e.g., `pixel_data_2024`, `zone_stats_2025`, `paired_table_2026`).
3. Click **Run** on each task. A dialog box will appear; confirm the settings and click **Run** again.
4. Wait for the tasks to finish processing (the task bar will turn blue and then checkmark when complete).
5. Open your Google Drive and locate the folder named `GEE_Leon_Ladrilleras_v3`. 
6. Download the resulting `.csv` files and move them to the `data/` folder in this repository to proceed with the Colab statistical analysis.