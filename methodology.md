# Computational Methodology and Analytical Workflow

This document details the computational pipeline and quasi-experimental design used to evaluate the thermal dynamics of artisanal brick kilns and bare soil in the peri-urban area of León, Guanajuato[cite: 1]. The methodology is divided into three sequential phases to ensure reproducibility and robustness.

## Phase 1: Site Identification and Paired Spatial Design

To isolate the thermal contribution of industrial kilns from the surrounding environmental conditions, a rigorous 1:1 paired spatial design was implemented.

*   **Sample Selection:** Eight active brick kiln polygons were identified using visual satellite interpretation and documentary review.
*   **Control Pairing:** Each kiln was paired with a bare-soil control polygon located within a 1 to 3 km radius. This specific distance constraint ensures that both sites share similar macroclimatic, topographic, and baseline urban conditions.
*   **Multi-Buffer Approach:** Concentric buffer zones of 100 m, 500 m, and 1000 m were generated around each polygon to evaluate the spatial dissipation of thermal anomalies. 
*   **Validation:** Paired sites were statistically validated using the Urban Index (UI) and the Modified Normalized Difference Water Index (MNDWI) to confirm identical baseline conditions before running the main thermal analysis.

## Phase 2: Remote Sensing Pipeline (Google Earth Engine)

The extraction of environmental variables was automated using the Google Earth Engine (GEE) JavaScript API.

*   **Satellite Data:** Landsat 8 Collection 2 Level-2 imagery was utilized due to its atmospherically and radiometrically corrected Land Surface Temperature (LST) and surface reflectance products.
*   **Temporal Filtering:** To control for seasonal soil moisture variability and cloud cover, only images from the dry seasons (March–May) of 2024, 2025, and 2026 were processed.
*   **Image Compositing:** Cloud and shadow masking was applied at the pixel level using the `QA_PIXEL` band. Seasonal median composites were then generated to eliminate transient atmospheric noise.
*   **Feature Extraction:** Eight spectral and thermal indices were computed per pixel at a 30 m resolution:
    *   **LST (°C):** Land Surface Temperature
    *   **NDMI:** Normalized Difference Moisture Index (Vegetation water stress)
    *   **NDVI:** Normalized Difference Vegetation Index
    *   **BSI (or NDSI):** Bare Soil Index
    *   **IBI & NDBI:** Impervious and Built-up Indices
    *   **UI & MNDWI:** Urban and Water Indices for spatial control

## Phase 3: Statistical Analysis (Python)

The exported datasets (pixel-level matrices and summary statistics) were analyzed locally using a custom Python pipeline (`pandas`, `scipy`, `seaborn`, `matplotlib`).

*   **Normality Testing:** The Shapiro-Wilk test was applied, confirming that the environmental datasets departed from a normal distribution ($p < 0.05$). 
*   **Hypothesis Testing:** Non-parametric tests were implemented to compare the two landscape classes:
    *   **Wilcoxon signed-rank test:** Used for strict 1:1 paired comparisons at the polygon level.
    *   **Mann-Whitney U test:** Used to assess significance across the independent pixel distributions within each buffer ring.
*   **Spatial Gradients:** Spearman's rank correlation coefficient ($\rho$) was calculated to measure the strength and direction of monotonic relationships between the thermal/spectral variables and the distance from the source polygons.
*   **Temporal Baselines:** Linear regression models and aggregated means with 95% confidence intervals were generated across the three-year period to verify interannual consistency, primarily utilizing the 500 m transition zone as the baseline boundary.