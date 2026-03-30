# Civil Engineering - Skills and Agents References (Phase 5)

This document provides reference materials, tools, libraries, and cross-specialization resources for implementing the skills and agents defined in the skills-agents-backlog.md.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Structural Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenSees](https://github.com/OpenSees/OpenSees) | Earthquake engineering simulation | fea-structural-engine, seismic-hazard-analyzer |
| [CalculiX](https://github.com/calculix/CalculiX) | 3D FEA solver | fea-structural-engine |
| [CALFEM](https://github.com/CALFEM/calfem-python) | FEA teaching tool | fea-structural-engine |
| [pyNastran](https://github.com/SteveDoyle2/pyNastran) | NASTRAN interface | fea-structural-engine |
| [Sfepy](https://github.com/sfepy/sfepy) | Simple Finite Elements in Python | fea-structural-engine |
| [FEniCS](https://github.com/FEniCS/dolfinx) | FEA computing platform | fea-structural-engine |

### Structural Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [sectionproperties](https://github.com/robbievanleeuwen/section-properties) | Section property calculator | section-property-calculator |
| [PySteel](https://github.com/pySteel/PySteel) | Steel design | structural-steel-design |
| [concreteproperties](https://github.com/robbievanleeuwen/concrete-properties) | Concrete section analysis | concrete-design-calculator |
| [structuralcodes](https://github.com/structuralcodes/structuralcodes) | Design code implementations | building-code-checker |
| [steelpy](https://github.com/svortega/steelpy) | Steel structures library | structural-steel-design |

### Geotechnical Engineering

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenGeoSys](https://github.com/ufz/ogs) | Geotechnical simulations | bearing-capacity-calculator |
| [PySlope](https://github.com/JesseBonanno/PySlope) | Slope stability analysis | slope-stability-analyzer |
| [GeoLib](https://github.com/viktor-platform/GeoLib) | Geotechnical calculations | bearing-capacity-calculator, settlement-calculator |
| [pySW4](https://github.com/shaharkadmiel/pySW4) | Seismic wave modeling | seismic-hazard-analyzer |
| [liquepy](https://github.com/eng-tools/liquepy) | Liquefaction assessment | geotechnical analysis |

### Water Resources

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HEC-HMS](https://github.com/HydrologicEngineeringCenter) | Hydrologic modeling | hydrologic-modeling-engine |
| [HEC-RAS](https://github.com/HydrologicEngineeringCenter) | Hydraulic modeling | hydraulic-analysis-engine |
| [PySwmm](https://github.com/OpenWaterAnalytics/pyswmm) | SWMM interface | stormwater-management-design |
| [WNTR](https://github.com/USEPA/WNTR) | Water network modeling | water-distribution-modeler |
| [hydrofunctions](https://github.com/mroberge/hydrofunctions) | USGS water data | hydrologic-modeling-engine |
| [Whitebox Tools](https://github.com/jblindsay/whitebox-tools) | GIS and hydrology | gis-spatial-analyzer |

### Transportation Engineering

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [SUMO](https://github.com/eclipse/sumo) | Traffic simulation | traffic-simulation-engine |
| [OpenTrafficSim](https://github.com/opentrafficmodeler) | Traffic modeling | traffic-simulation-engine |
| [PyQGIS](https://github.com/qgis/QGIS) | GIS platform | gis-spatial-analyzer |
| [OSMnx](https://github.com/gboeing/osmnx) | Street network analysis | highway-alignment-designer |
| [MovingPandas](https://github.com/movingpandas/movingpandas) | Movement data | traffic analysis |

### BIM and CAD

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) | IFC manipulation | ifc-model-analyzer, bim-clash-detection |
| [xBIM](https://github.com/xBimTeam/XbimEssentials) | BIM toolkit | ifc-model-analyzer |
| [FreeCAD](https://github.com/FreeCAD/FreeCAD) | CAD platform | civil3d-surface-analyzer |
| [BIMserver](https://github.com/opensourceBIM/BIMserver) | BIM collaboration | bim-clash-detection |
| [pyRevit](https://github.com/eirannejad/pyRevit) | Revit automation | revit-api-interface |
| [Speckle](https://github.com/specklesystems/speckle-server) | Data interoperability | bim-clash-detection |

### Construction Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [P6](https://www.oracle.com/construction-engineering/primavera-p6/) | Primavera P6 | cpm-schedule-generator |
| [python-gantt](https://github.com/xmarduel/python-gantt) | Gantt chart generation | cpm-schedule-generator |
| [pyairtable](https://github.com/gtalarico/pyairtable) | Data management | submittal-tracker |

### Survey and GIS

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [QGIS](https://github.com/qgis/QGIS) | GIS platform | gis-spatial-analyzer |
| [GDAL](https://github.com/OSGeo/gdal) | Geospatial data | gis-spatial-analyzer, survey-data-processor |
| [Shapely](https://github.com/shapely/shapely) | Geometric operations | gis-spatial-analyzer |
| [Fiona](https://github.com/Toblerity/Fiona) | Vector data I/O | gis-spatial-analyzer |
| [Rasterio](https://github.com/rasterio/rasterio) | Raster data I/O | gis-spatial-analyzer |
| [PyProj](https://github.com/pyproj4/pyproj) | Coordinate transformations | survey-data-processor |
| [PDAL](https://github.com/PDAL/PDAL) | Point cloud processing | survey-data-processor |

---

## MCP Server References

### Analysis Tool MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access CAD, BIM, and analysis files | All skills |
| **github** | Version control for models | All skills |
| **postgres/sqlite** | Store project data and calculations | All skills |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **opensees-mcp** | OpenSees simulation control | fea-structural-engine, seismic-hazard-analyzer |
| **hec-ras-mcp** | HEC-RAS model control | hydraulic-analysis-engine |
| **swmm-mcp** | SWMM simulation interface | detention-pond-designer |
| **sumo-mcp** | SUMO traffic simulation | traffic-simulation-engine |
| **ifc-mcp** | IFC model operations | ifc-model-analyzer, bim-clash-detection |
| **gis-mcp** | GIS analysis operations | gis-spatial-analyzer |
| **revit-mcp** | Revit API operations | revit-api-interface |

### Data Source MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **usgs-mcp** | USGS seismic and water data | seismic-hazard-analyzer, hydrologic-modeling-engine |
| **noaa-mcp** | Weather and precipitation data | hydrologic-modeling-engine |
| **rsmeans-mcp** | Cost database queries | cost-database-interface |
| **asce-mcp** | Code and standards data | building-code-checker, load-combination-generator |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [ASCE](https://www.asce.org/) | Standards, publications | All civil engineering |
| [ACI](https://www.concrete.org/) | Concrete standards | concrete-design-calculator |
| [AISC](https://www.aisc.org/) | Steel design standards | steel-connection-designer |
| [AASHTO](https://www.transportation.org/) | Transportation standards | highway-alignment-designer, bridge-design-lrfd |
| [ICC](https://www.iccsafe.org/) | Building codes | building-code-checker |
| [TRB](https://www.trb.org/) | Transportation research | traffic-simulation-engine |
| [USACE](https://www.usace.army.mil/) | Army Corps resources | hydraulic-analysis-engine |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| Eng-Tips Structural | Structural engineering | https://www.eng-tips.com/threadarea.cfm?lev2=33 |
| Eng-Tips Geotechnical | Geotechnical engineering | https://www.eng-tips.com/threadarea.cfm?lev2=50 |
| r/civilengineering | Reddit community | https://www.reddit.com/r/civilengineering/ |
| r/StructuralEngineering | Structural discussions | https://www.reddit.com/r/StructuralEngineering/ |
| BuildingSmart | BIM community | https://www.buildingsmart.org/community/ |
| SEAOC | Structural engineers | https://www.seaoc.org/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| [FEMA P-751](https://www.fema.gov/node/seismic-design-maps-and-tools) | Seismic design examples | seismic-hazard-analyzer |
| [HEC Training](https://www.hec.usace.army.mil/software/) | HEC software tutorials | hydraulic-analysis-engine |
| [AISC Education](https://www.aisc.org/education/) | Steel design resources | steel-connection-designer |
| [ACI Education](https://www.concrete.org/education.aspx) | Concrete design | concrete-design-calculator |
| [OpenSees Wiki](https://opensees.berkeley.edu/wiki/index.php/Main_Page) | FEA tutorials | fea-structural-engine |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [ASCE 7 Commentary](https://www.asce.org/) | Load standard explanation | load-combination-generator, wind-load-calculator |
| [HEC-RAS User Manual](https://www.hec.usace.army.mil/software/hec-ras/documentation.aspx) | Hydraulic modeling | hydraulic-analysis-engine |
| [SWMM User Manual](https://www.epa.gov/water-research/storm-water-management-model-swmm) | Stormwater modeling | detention-pond-designer |
| [IfcOpenShell Documentation](https://ifcopenshell.org/documentation/) | IFC manipulation | ifc-model-analyzer |
| [QGIS Documentation](https://docs.qgis.org/) | GIS tutorials | gis-spatial-analyzer |

---

## API Documentation

### Analysis Software APIs

| Software | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| OpenSees | [OpenSees Python](https://openseespydoc.readthedocs.io/) | fea-structural-engine |
| SAP2000/ETABS | [CSI API](https://wiki.csiamerica.com/display/kb/API) | fea-structural-engine |
| STAAD.Pro | [OpenSTAAD API](https://www.bentley.com/software/staad-pro/) | fea-structural-engine |
| RISA-3D | [RISA API](https://risa.com/risaconnection) | fea-structural-engine |
| HEC-RAS | [HEC-RAS Controller](https://www.hec.usace.army.mil/software/hec-ras/) | hydraulic-analysis-engine |
| EPANET | [EPANET Toolkit](https://www.epa.gov/water-research/epanet) | water-distribution-modeler |
| SWMM | [SWMM Python](https://pyswmm.readthedocs.io/) | detention-pond-designer |

### BIM Software APIs

| Software | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| Revit | [Revit API](https://www.revitapidocs.com/) | revit-api-interface |
| Civil 3D | [Civil 3D API](https://help.autodesk.com/view/CIV3D/) | civil3d-surface-analyzer |
| Tekla | [Tekla Open API](https://developer.tekla.com/) | structural-steel-design |
| Navisworks | [Navisworks API](https://help.autodesk.com/view/NAV/) | bim-clash-detection |
| Bentley | [Bentley iTwin](https://developer.bentley.com/) | ifc-model-analyzer |

### GIS and Survey APIs

| Service | API Documentation | Integration Skills |
|---------|-------------------|-------------------|
| USGS | [USGS API](https://www.usgs.gov/products/web-tools/apis) | seismic-hazard-analyzer, hydrologic-modeling-engine |
| NOAA | [NOAA APIs](https://www.ncei.noaa.gov/support/access-data-service-api) | hydrologic-modeling-engine |
| FEMA | [FEMA Flood Maps](https://hazards.fema.gov/gis/nfhl/services) | flood-analysis-mitigation |
| Google Earth Engine | [EE API](https://developers.google.com/earth-engine) | gis-spatial-analyzer |
| OpenStreetMap | [OSM API](https://wiki.openstreetmap.org/wiki/API) | highway-alignment-designer |

### Standards and Codes

| Standard | Documentation | Skills |
|----------|---------------|--------|
| ASCE 7 | Minimum Design Loads | load-combination-generator, wind-load-calculator, seismic-hazard-analyzer |
| ACI 318 | Concrete Building Code | concrete-design-calculator |
| AISC 360 | Steel Building Specification | steel-connection-designer |
| AISC 341 | Seismic Steel Design | steel-connection-designer |
| AASHTO LRFD | Bridge Design | bridge-design-lrfd |
| IBC | International Building Code | building-code-checker |
| HCM | Highway Capacity Manual | traffic-simulation-engine |
| MUTCD | Traffic Control Devices | signal-timing-optimizer |

---

## Applicable Skills from Other Specializations

### From Aerospace Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| SK-007: FEA Structural | Finite element analysis | Direct application |
| SK-018: Requirements Verification | Traceability | Project requirements tracking |
| SK-020: Trade Study Methodology | Decision analysis | Design alternatives evaluation |

### From Automotive Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| SK-001: Vehicle Dynamics Sim | Simulation | Traffic microsimulation |
| SK-013: Requirements Engineering | Requirements management | Project specifications |

### From Biomedical Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| fea-mesh-generator | FEA meshing | Complex geometry meshing |
| requirements-traceability-manager | Design control | Project documentation |

### From Chemical Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| hazop-facilitator | Hazard analysis | Construction safety analysis |
| process-economics-estimator | Cost estimation | Project cost estimation |
| control-strategy-designer | Control design | Traffic signal control |

### From Environmental Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| stormwater-management | Stormwater design | Direct application |
| environmental-impact-assessment | EIA | Project environmental review |
| permit-application | Permitting | Construction permits |

### From Mechanical Engineering

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| stress-analysis | Structural analysis | Component stress analysis |
| fatigue-analysis | Fatigue assessment | Bridge fatigue analysis |
| vibration-analysis | Dynamic analysis | Seismic/vibration analysis |

### From Project Management

| Skill | Description | Application in Civil Engineering |
|-------|-------------|----------------------------------|
| schedule-management | CPM scheduling | Construction scheduling |
| cost-management | Cost control | Project cost management |
| risk-management | Risk analysis | Project risk assessment |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Civil Engineering Application |
|--------------|-------|------------------------------|
| Aerospace | structures-specialist | Complex structural analysis |
| Aerospace | systems-engineering-specialist | Large project integration |
| Chemical | risk-analyst | Construction safety analysis |
| Environmental | compliance-specialist | Environmental compliance |
| Project Mgmt | project-manager | Construction project management |

---

## Integration Recommendations

### Priority Tool Integrations

1. **OpenSees** - Structural and seismic analysis
2. **IfcOpenShell** - BIM and IFC manipulation
3. **HEC-RAS/PySwmm** - Hydraulic and stormwater modeling
4. **QGIS/GDAL** - GIS and spatial analysis
5. **sectionproperties** - Section property calculations

### Recommended MCP Server Development

1. **structural-analysis-mcp** - OpenSees/FEA automation
2. **hydraulic-mcp** - HEC-RAS/SWMM control
3. **bim-mcp** - IFC and Revit operations
4. **gis-mcp** - Spatial analysis operations
5. **code-compliance-mcp** - Building code checking

### Data Standards to Support

- **IFC** - Industry Foundation Classes (BIM)
- **LandXML** - Survey and civil data
- **GML** - Geography Markup Language
- **GeoJSON** - Geographic JSON
- **Shapefile** - ESRI vector format
- **GeoTIFF** - Geospatial raster
- **HEC-DSS** - Hydrologic data storage
- **MicroStation DGN** - CAD format
- **DXF/DWG** - AutoCAD formats

---

## Summary

This reference document provides the foundational resources for implementing civil engineering skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 35+ |
| MCP Server References | 15+ |
| Community Resources | 20+ |
| API Documentation Sources | 25+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
