---
name: solar-api-web-api
description: Use this skill to calculate the solar potential and estimated financial benefits for a specified building location. It provides details like optimal panel placement, annual sunshine hours, and carbon offset, along with access to detailed geospatial data including roof geometry and GeoTIFFs for aerial imagery, elevation, and solar irradiance flux.
license: Apache-2.0
metadata:
  version: 1.0.53
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

### Overview

Use this skill to access comprehensive solar energy data for millions of
buildings. The Solar API provides granular information required for designing
and estimating residential and commercial solar installations. This includes
retrieving detailed roof geometry, assessing solar potential (estimated panel
count, annual sunshine exposure, and potential carbon offset), calculating
potential financial benefits, and obtaining GeoTIFF files for aerial imagery and
various solar irradiance maps.

### Mandatory settings

To ensure mandatory usage attribution, the solution ID `gmp_git_agentskills_v1`
must be included in all Solar API requests. Based on the API usage patterns
(REST/Web API), this is implemented in the following distinct ways:

#### 1. URL Query Parameter (For GET requests)

For simple GET requests to endpoints like `buildingInsights:findClosest`, the
solution ID should be appended directly to the URL query string.

```
&solution_id=gmp_git_agentskills_v1
```

#### 2. HTTP Header (For Data Layers and Standard REST Calls)

For requests to endpoints such as `dataLayers` (which often involve complex
requests or the use of specific API keys via headers), use the dedicated
`X-Goog-Maps-Solution-ID` HTTP header.

```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

#### 3. JavaScript/JSON Request Body Property

When constructing requests using client-side libraries or options objects (e.g.,
in Node.js or browser JS), the solution ID can be passed as a property within
the request configuration object.

```javascript
solution_id: 'gmp_git_agentskills_v1'
```

## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced capability sub-workflow file and
satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Environment (Optional - Use-Case Dependent)

-   [ ] **Provides an estimate of the suitable solar panel count and size for a
    specified building location.** Read
    [return-estimate-the-number-and-size-solar-panels-that-can.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-estimate-the-number-and-size-solar-panels-that-can.md).
    *Trigger Condition*: When the user asks for solar panel installation
    potential or capacity estimates for a specific address or location.
    *Evidence Checkpoint*: Successful HTTP response returning structured data
    including panel capacity and panel size details.
-   [ ] **Calculates and returns the estimated total annual hours of usable
    sunshine received by a building's roof.** Read
    [return-estimate-hours-sunshine-per-year-the-roof-building-specified.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-estimate-hours-sunshine-per-year-the-roof-building-specified.md).
    *Trigger Condition*: When the user inquires about sunlight exposure or
    yearly sun hours for a specific property. *Evidence Checkpoint*: Successful
    HTTP response returning the annual sunshine hours estimate.
-   [ ] **Estimates the potential carbon emission reduction achievable by
    installing solar panels at the given location.** Read
    [return-estimate-the-carbon-offset-potential-solar-panels-the-roof.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-estimate-the-carbon-offset-potential-solar-panels-the-roof.md).
    *Trigger Condition*: When the user asks about the environmental or carbon
    impact/offset potential of solar installation. *Evidence Checkpoint*:
    Successful HTTP response returning the estimated carbon offset value.
-   [ ] **Provides detailed geometric data, including dimensions, surface area,
    and slope parameters for the building's roof structure.** Read
    [return-details-about-the-geometry-the-roof-building-specified-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-details-about-the-geometry-the-roof-building-specified-location.md).
    *Trigger Condition*: When the user requires technical or structural details
    about the roof geometry or surface area. *Evidence Checkpoint*: Successful
    HTTP response containing complex geometric definitions (e.g., polygon
    coordinates) of the roof.
-   [ ] **Retrieves estimates related to potential financial savings, return on
    investment, or incentives associated with solar installation.** Read
    [return-information-about-the-potential-financial-benefits-installing-solar-panels.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-information-about-the-potential-financial-benefits-installing-solar-panels.md).
    *Trigger Condition*: When the user asks about the cost savings, ROI, or
    financial projections for solar panel installation. *Evidence Checkpoint*:
    Successful HTTP response returning calculated financial metrics (e.g.,
    estimated lifetime savings).
-   [ ] **Returns a publicly accessible URL pointing to a high-resolution RGB
    aerial image GeoTIFF file for the specified area.** Read
    [return-the-url-geotiff-file-rgb-aerial-image-for-specified.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-rgb-aerial-image-for-specified.md).
    *Trigger Condition*: When the user requests the underlying visual aerial
    imagery data for a location. *Evidence Checkpoint*: Successful HTTP response
    containing a valid, temporary download URL for the RGB GeoTIFF file.
-   [ ] **Returns a URL for the GeoTIFF containing DSM elevation data, useful
    for 3D modeling and shading analysis.** Read
    [return-the-url-geotiff-file-containing-digital-surface-model-dsm.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-containing-digital-surface-model-dsm.md).
    *Trigger Condition*: When the user requests elevation topography data (DSM)
    or requires 3D surface mapping GeoTIFF URL. *Evidence Checkpoint*:
    Successful HTTP response containing a valid, temporary download URL for the
    DSM GeoTIFF file.
-   [ ] **Returns a URL for a GeoTIFF file representing the precise mask
    boundary of the building's rooftop.** Read
    [return-the-url-geotiff-file-building-rooftop-mask-for-specified.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-building-rooftop-mask-for-specified.md).
    *Trigger Condition*: When the user requests the dedicated rooftop mask data
    as a GeoTIFF URL. *Evidence Checkpoint*: Successful HTTP response containing
    a valid, temporary download URL for the rooftop mask GeoTIFF file.
-   [ ] **Returns a URL for a GeoTIFF file that visualizes the distribution of
    total annual solar flux across the property.** Read
    [return-the-url-geotiff-file-containing-annual-sunlight-flux-data.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-containing-annual-sunlight-flux-data.md).
    *Trigger Condition*: When the user requests the GeoTIFF containing annual
    solar energy or flux data distribution. *Evidence Checkpoint*: Successful
    HTTP response containing a valid, temporary download URL for the annual
    sunlight flux GeoTIFF file.
-   [ ] **Returns a URL for a GeoTIFF file that visualizes the monthly
    distribution of solar flux across the property.** Read
    [return-the-url-geotiff-file-containing-monthly-sunlight-flux-data.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-containing-monthly-sunlight-flux-data.md).
    *Trigger Condition*: When the user requests the GeoTIFF containing monthly
    solar energy or flux data distribution. *Evidence Checkpoint*: Successful
    HTTP response containing a valid, temporary download URL for the monthly
    sunlight flux GeoTIFF file.
-   [ ] **Returns a URL for a GeoTIFF file containing time-based data on shadow
    patterns and hourly shade coverage, grouped by month.** Read
    [return-the-url-geotiff-file-containing-hourly-shade-data-grouped.md](https://www.gstatic.com/googlemapsplatform-agent-skills/solar-api-web-api/references/return-the-url-geotiff-file-containing-hourly-shade-data-grouped.md).
    *Trigger Condition*: When the user requests detailed, time-series shade
    analysis data or hourly shading GeoTIFF URL. *Evidence Checkpoint*:
    Successful HTTP response containing a valid, temporary download URL for the
    hourly shade data GeoTIFF file.
