# Environmental Engineering - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Environmental Engineering skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Water and Wastewater Treatment

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [WNTR](https://github.com/USEPA/WNTR) | Water Network Tool for Resilience | SK-001: Water Treatment Design |
| [EPANET-Python](https://github.com/OpenWaterAnalytics/epanet-python) | Python wrapper for EPANET | SK-001: Water Treatment Design |
| [wntr](https://github.com/USEPA/WNTR) | Water network tool | SK-001: Water Treatment Design |
| [WaterTAP](https://github.com/watertap-org/watertap) | Water treatment process modeling | SK-002, SK-003: Wastewater/Membrane |
| [IDAES-PSE](https://github.com/IDAES/idaes-pse) | Process systems engineering | SK-002: Wastewater Optimization |
| [Biosteam](https://github.com/BioSTEAMDevelopmentGroup/biosteam) | Bioprocess simulation | SK-002: Wastewater Optimization |

### Stormwater and Hydrology

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PySWMM](https://github.com/OpenWaterAnalytics/pyswmm) | Python wrapper for EPA SWMM | SK-004: Stormwater Management |
| [SWMM](https://github.com/OpenWaterAnalytics/Stormwater-Management-Model) | EPA Storm Water Management Model | SK-004: Stormwater Management |
| [HyRiver](https://github.com/hyriver/HyRiver) | Hydrology data retrieval | SK-004: Stormwater Management |
| [whitebox-python](https://github.com/giswqs/whitebox-python) | Hydrological analysis | SK-004: Stormwater Management |
| [pysheds](https://github.com/mdbartos/pysheds) | Watershed delineation | SK-004: Stormwater Management |
| [hydrofunctions](https://github.com/mroberge/hydrofunctions) | USGS water data retrieval | SK-004: Stormwater Management |

### Air Quality

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [AERMOD View](https://www.weblakes.com/products/aermod) | Air dispersion modeling (commercial) | SK-006: Air Dispersion Modeling |
| [OpenAir](https://github.com/davidcarslaw/openair) | R package for air quality analysis | SK-006, SK-008: Air Quality |
| [py-openaq](https://github.com/dhhagan/py-openaq) | OpenAQ data access | SK-008: Emission Inventory |
| [pyaerocom](https://github.com/metno/pyaerocom) | Aerosol and air quality analysis | SK-006: Air Dispersion Modeling |
| [MOVES](https://www.epa.gov/moves) | Mobile source emissions | SK-008: Emission Inventory |
| [airbase](https://github.com/JohnPaton/airbase) | European air quality data | SK-008: Emission Inventory |

### Groundwater and Remediation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [FloPy](https://github.com/modflowpy/flopy) | Python interface to MODFLOW | SK-014: Groundwater Modeling |
| [MODFLOW](https://github.com/MODFLOW-USGS/modflow6) | USGS groundwater model | SK-014: Groundwater Modeling |
| [PyGWFlow](https://github.com/pyGWflow/pyGWflow) | Groundwater flow modeling | SK-014: Groundwater Modeling |
| [analytical-groundwater](https://github.com/Huite/analytical-groundwater) | Analytical groundwater solutions | SK-014: Groundwater Modeling |
| [BIOSCREEN](https://www.epa.gov/water-research/bioscreen-natural-attenuation-decision-support-system) | Natural attenuation modeling | SK-014: Groundwater Modeling |
| [MT3DMS](https://www.usgs.gov/software/mt3dms-modular-3-d-multi-species-transport-model) | Contaminant transport | SK-014: Groundwater Modeling |

### Life Cycle Assessment and Sustainability

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Brightway2](https://github.com/brightway-lca/brightway2) | Life cycle assessment framework | SK-020: LCA Assessment |
| [Activity Browser](https://github.com/LCA-ActivityBrowser/activity-browser) | GUI for brightway2 | SK-020: LCA Assessment |
| [lca_algebraic](https://github.com/oie-mines-paristech/lca_algebraic) | Parametric LCA | SK-020: LCA Assessment |
| [ecoinvent](https://ecoinvent.org) | LCA database (commercial) | SK-020: LCA Assessment |
| [GREET](https://greet.es.anl.gov) | Greenhouse gas emissions | SK-010, SK-022: GHG/Carbon |
| [openLCA](https://github.com/GreenDelta/olca-app) | Open source LCA software | SK-020: LCA Assessment |

### GHG and Climate

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ghgpy](https://github.com/climate-resource/ghgpy) | GHG emissions calculations | SK-010, SK-022: GHG/Carbon |
| [climada_python](https://github.com/CLIMADA-project/climada_python) | Climate adaptation modeling | SK-023: Climate Vulnerability |
| [xclim](https://github.com/Ouranosinc/xclim) | Climate indices | SK-023: Climate Vulnerability |
| [cf-xarray](https://github.com/xarray-contrib/cf-xarray) | Climate data conventions | SK-023: Climate Vulnerability |
| [pangeo-pyinterp](https://github.com/CNES/pangeo-pyinterp) | Climate data interpolation | SK-023: Climate Vulnerability |

### Environmental Data Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ProUCL](https://www.epa.gov/land-research/proucl-software) | EPA statistical software | SK-027: Monitoring Data Analysis |
| [pyenviron](https://github.com/environmental-data-science) | Environmental data science tools | SK-027: Monitoring Data Analysis |
| [geopandas](https://github.com/geopandas/geopandas) | Geospatial data analysis | SK-028: Environmental GIS |
| [rasterio](https://github.com/rasterio/rasterio) | Geospatial raster I/O | SK-028: Environmental GIS |
| [leafmap](https://github.com/opengeos/leafmap) | Interactive geospatial mapping | SK-028: Environmental GIS |
| [earthpy](https://github.com/earthlab/earthpy) | Earth science data analysis | SK-028: Environmental GIS |

### Waste Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HELP Model](https://www.epa.gov/land-research/hydrologic-evaluation-landfill-performance-help-model) | Landfill hydrologic modeling | SK-016: Landfill Design |
| [LandGEM](https://www.epa.gov/catc/clean-air-technology-center-products#702) | Landfill gas emissions | SK-016: Landfill Design |
| [RCRA Info](https://rcrainfo.epa.gov) | Hazardous waste data | SK-017, SK-019: Waste Management |

### Risk Assessment

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [EPA RSL Calculator](https://www.epa.gov/risk/regional-screening-levels-rsls) | Risk screening levels | SK-012: Health Risk Assessment |
| [IRIS](https://www.epa.gov/iris) | Integrated Risk Information System | SK-012: Health Risk Assessment |

---

## MCP Server References

### Environmental Data MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| EPA APIs MCP | Access to EPA environmental databases | SK-011, SK-012: Site Assessment/Risk |
| USGS Water Services MCP | Real-time water data | SK-004: Stormwater, SK-014: Groundwater |
| NOAA Climate Data MCP | Climate and weather data | SK-023: Climate Vulnerability |
| AirNow API MCP | Real-time air quality data | SK-006, SK-008: Air Quality |

### Modeling Tool MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| MODFLOW MCP | Groundwater model execution | SK-014: Groundwater Modeling |
| SWMM MCP | Stormwater model execution | SK-004: Stormwater Management |
| AERMOD MCP | Air dispersion model execution | SK-006: Air Dispersion Modeling |
| openLCA MCP | Life cycle assessment execution | SK-020: LCA Assessment |

### Regulatory Database MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| ECHO Database MCP | EPA enforcement and compliance | SK-026: Regulatory Compliance |
| TRI MCP | Toxics Release Inventory data | SK-008: Emission Inventory |
| SDWIS MCP | Safe Drinking Water data | SK-001: Water Treatment |
| Envirofacts MCP | Multi-media environmental data | All processes |

### GIS and Mapping MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| ESRI ArcGIS MCP | GIS analysis and mapping | SK-028: Environmental GIS |
| Google Earth Engine MCP | Satellite imagery analysis | SK-023: Climate Vulnerability |
| USGS National Map MCP | Topographic and hydrologic data | SK-004, SK-014: Hydrology |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Environmental Engineering Reddit | https://reddit.com/r/environmental_science | General discussions |
| Water Environment Federation | https://www.wef.org | Wastewater, stormwater |
| Air & Waste Management Association | https://www.awma.org | Air quality, waste |
| NGWA Community | https://www.ngwa.org | Groundwater |
| GreenBiz | https://www.greenbiz.com | Corporate sustainability |
| Environmental Science Stack Exchange | https://earthscience.stackexchange.com | Technical Q&A |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| EPA Technical Resources | https://www.epa.gov/research | All environmental media |
| USGS Water Resources | https://www.usgs.gov/mission-areas/water-resources | Hydrology, groundwater |
| ASCE Environmental Library | https://ascelibrary.org | Technical papers |
| WEF Technical Practice Guides | https://www.wef.org/resources/publications/technical-publications/ | Water/wastewater |
| ITRC Guidance Documents | https://www.itrcweb.org | Remediation technologies |
| Climate Data Guide | https://climatedataguide.ucar.edu | Climate data sources |

### Standards and Regulations

| Organization | Standards/Regulations | Topics |
|--------------|----------------------|--------|
| EPA | CWA, CAA, RCRA, CERCLA, SDWA | All environmental media |
| ASTM | E1527, E1903, D5792 | Site assessment, testing |
| ASCE | Various standards | Engineering practice |
| ASHRAE | 62.1, 90.1 | Indoor air quality, energy |
| ISO | 14001, 14040, 14044, 14064 | EMS, LCA, GHG |
| GRI | GRI Standards | Sustainability reporting |
| SASB | SASB Standards | Sustainability accounting |
| TCFD | TCFD Recommendations | Climate disclosure |

### Professional Organizations

| Organization | URL | Focus |
|--------------|-----|-------|
| AAEES | https://www.aaees.org | Environmental engineering |
| AWWA | https://www.awwa.org | Water works |
| WEF | https://www.wef.org | Water environment |
| AWMA | https://www.awma.org | Air and waste |
| NGWA | https://www.ngwa.org | Groundwater |
| SETAC | https://www.setac.org | Environmental toxicology |
| AEESP | https://www.aeesp.org | Environmental education |

---

## API Documentation

### EPA APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| EPA Envirofacts | https://www.epa.gov/enviro/envirofacts-data-service-api | Multi-media data access |
| AirNow API | https://docs.airnowapi.org | Air quality data |
| ECHO API | https://echo.epa.gov/tools/web-services | Compliance data |
| WATERS | https://www.epa.gov/waterdata/waters-web-services | Water quality data |
| TRI | https://www.epa.gov/toxics-release-inventory-tri-program | Toxics release data |
| RSL Calculator API | https://www.epa.gov/risk/regional-screening-levels-rsls | Risk screening |

### USGS APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| NWIS | https://waterservices.usgs.gov | Water data services |
| National Map | https://apps.nationalmap.gov/services | Topographic data |
| ScienceBase | https://www.sciencebase.gov/catalog/api | Scientific data catalog |

### Climate and Weather APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| NOAA Climate Data | https://www.ncdc.noaa.gov/cdo-web/webservices/v2 | Historical climate |
| OpenWeather | https://openweathermap.org/api | Weather data |
| Copernicus Climate | https://cds.climate.copernicus.eu/api | European climate data |
| CMIP6 | https://esgf-node.llnl.gov/projects/cmip6/ | Climate projections |

### LCA and Sustainability APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| ecoinvent API | https://ecoinvent.org/the-ecoinvent-database/data-access/ | LCA database |
| GHG Protocol Tools | https://ghgprotocol.org/calculation-tools | GHG calculations |
| CDP API | https://www.cdp.net/en/data | Climate disclosure data |

### GIS APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| ESRI REST API | https://developers.arcgis.com/rest/ | GIS services |
| Google Earth Engine | https://developers.google.com/earth-engine | Satellite analysis |
| Mapbox | https://docs.mapbox.com/api/ | Mapping services |
| OpenStreetMap | https://wiki.openstreetmap.org/wiki/API | Map data |

---

## Applicable Skills from Other Specializations

### From Civil Engineering

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Hydraulic Structure Design Skill | Various | Dam, weir design for water treatment |
| Flood Analysis Skill | Various | Stormwater management, flood mitigation |
| Stormwater Design Skill | Various | Green infrastructure, BMP design |
| Geotechnical Investigation Skill | Various | Landfill liner design, site characterization |
| Water Distribution Design Skill | Various | Distribution system modeling |

### From Chemical Engineering

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Process Simulation Skill | Various | Water/wastewater process modeling |
| Reaction Kinetics Skill | Various | Biological treatment processes |
| Separation Process Skill | Various | Membrane, adsorption processes |
| Heat Integration Skill | Various | Energy recovery in treatment |
| Process Control Skill | Various | Treatment plant automation |

### From Materials Science

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Corrosion Assessment Skill | SK-018 | Pipe and tank corrosion evaluation |
| Failure Analysis Skill | SK-017 | Infrastructure failure investigation |
| Spectroscopy Analysis Skill | SK-003 | Contaminant identification |

### From Industrial Engineering

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Statistical Process Control Skill | Various | Treatment process monitoring |
| Design of Experiments Skill | Various | Treatment optimization |
| Root Cause Analysis Skill | Various | Permit exceedance investigation |
| Process Optimization Skill | Various | Treatment efficiency improvement |

### From Bioinformatics

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Microbiome Analysis Skill | Various | Activated sludge microbial ecology |
| Sequencing Data Analysis Skill | Various | Pathogen detection and tracking |

### From Business - Operations

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Continuous Improvement Skill | Various | Utility operational excellence |
| Quality Management Skill | Various | ISO 14001 EMS implementation |
| Risk Management Skill | Various | Environmental risk assessment |

### From Business - Legal

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Compliance Management Skill | Various | Multi-media regulatory compliance |
| Regulatory Change Management Skill | Various | Environmental regulation tracking |
| Data Privacy Skill | Various | Environmental data governance |

### From Nanotechnology

| Skill | Original ID | Application in Environmental Engineering |
|-------|-------------|------------------------------------------|
| Nanomaterial Safety Assessment Skill | Various | Nano-pollutant risk evaluation |
| Particle Characterization Skill | Various | Particulate matter analysis |

---

## Implementation Notes

### Priority Integration Points

1. **FloPy/MODFLOW**: Critical for groundwater modeling processes
2. **PySWMM**: Foundation for stormwater management
3. **Brightway2**: Core LCA capability
4. **EPA APIs**: Essential for regulatory compliance data
5. **geopandas/rasterio**: Geospatial analysis foundation

### Cross-Specialization Synergies

- Process simulation skills from Chemical Engineering directly applicable to treatment process design
- Statistical analysis skills from Industrial Engineering enhance monitoring data analysis
- Hydraulic design skills from Civil Engineering support infrastructure design
- Risk assessment approaches applicable across environmental media

### Recommended Implementation Order

1. EPA data integration (Envirofacts, ECHO, AirNow)
2. Groundwater modeling (FloPy/MODFLOW)
3. Stormwater modeling (PySWMM)
4. GIS analysis (geopandas, rasterio)
5. LCA capabilities (Brightway2)
6. Air quality modeling (AERMOD integration)
7. Statistical analysis (ProUCL methodology)

### Data Sources Priority

1. EPA databases (ECHO, TRI, AQS, STORET)
2. USGS water and geospatial data
3. NOAA climate data
4. State environmental agency databases
5. Commercial LCA databases (ecoinvent)

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
