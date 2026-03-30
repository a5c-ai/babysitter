# Automotive Engineering - References and Resources

This document provides a curated collection of authoritative references, learning resources, tools, and standards for automotive engineering. All resources have been selected for their quality, practical value, and industry recognition.

## Table of Contents

- [Books](#books)
- [Standards and Regulations](#standards-and-regulations)
- [Official Documentation and Technical Resources](#official-documentation-and-technical-resources)
- [Online Courses and Training](#online-courses-and-training)
- [Open Source Projects](#open-source-projects)
- [Development Tools and Platforms](#development-tools-and-platforms)
- [Technical Blogs and Communities](#technical-blogs-and-communities)
- [Conference Proceedings and Research](#conference-proceedings-and-research)
- [Video Channels and Podcasts](#video-channels-and-podcasts)

---

## Books

### Vehicle Engineering Fundamentals

**"Fundamentals of Vehicle Dynamics" by Thomas D. Gillespie**
- Definitive textbook on vehicle dynamics
- Covers tire mechanics, suspension systems, steering, and handling
- Essential reference for chassis engineers
- URL: https://www.sae.org/publications/books/content/r-114/

**"Race Car Vehicle Dynamics" by William F. Milliken and Douglas L. Milliken**
- Comprehensive treatment of vehicle dynamics
- Applicable to both racing and production vehicles
- Industry-standard reference for dynamics engineers
- URL: https://www.sae.org/publications/books/content/r-146/

**"The Automotive Chassis: Engineering Principles" by Jornsen Reimpell**
- Complete guide to chassis design and engineering
- Covers suspension, steering, brakes, and wheels/tires
- Practical engineering focus with design guidelines
- URL: https://www.springer.com/gp/book/9780750650540

**"Automotive Engineering: Powertrain, Chassis System and Vehicle Body" by David Crolla (Editor)**
- Comprehensive overview of vehicle systems
- Written by leading automotive engineers
- Excellent reference for systems engineering perspective
- URL: https://www.elsevier.com/books/automotive-engineering/crolla/978-1-85617-577-7

### Powertrain Engineering

**"Internal Combustion Engine Fundamentals" by John B. Heywood**
- Authoritative text on IC engine principles
- Covers thermodynamics, combustion, and emissions
- Essential reference for powertrain engineers
- URL: https://www.mhprofessional.com/9780071004992-usa-internal-combustion-engine-fundamentals-2e

**"Modern Electric, Hybrid Electric, and Fuel Cell Vehicles" by Mehrdad Ehsani et al.**
- Comprehensive treatment of electrified powertrains
- Covers motors, batteries, hybrid architectures, and fuel cells
- Essential for EV development engineers
- URL: https://www.routledge.com/Modern-Electric-Hybrid-Electric-and-Fuel-Cell-Vehicles/Ehsani-Gao-Santi-Emadi/p/book/9781138330498

**"Electric Vehicle Technology Explained" by James Larminie and John Lowry**
- Accessible introduction to EV technology
- Covers batteries, motors, charging, and vehicle design
- Suitable for engineers transitioning to electrification
- URL: https://www.wiley.com/en-us/Electric+Vehicle+Technology+Explained%2C+2nd+Edition-p-9781119942733

**"Battery Systems Engineering" by Christopher D. Rahn and Chao-Yang Wang**
- In-depth treatment of battery systems for vehicles
- Covers electrochemistry, thermal management, and BMS
- Essential for battery engineers
- URL: https://www.wiley.com/en-us/Battery+Systems+Engineering-p-9781119979500

### ADAS and Autonomous Driving

**"Creating Autonomous Vehicle Systems" by Shaoshan Liu et al.**
- Practical guide to building autonomous vehicles
- Covers perception, planning, control, and implementation
- Morgan & Claypool Publishers
- URL: https://www.morganclaypool.com/doi/abs/10.2200/S00787ED1V01Y201707CSL009

**"Autonomous Driving: Technical, Legal and Social Aspects" edited by Markus Maurer et al.**
- Comprehensive overview of autonomous driving
- Covers technology, regulation, ethics, and acceptance
- Multi-disciplinary perspective from leading experts
- URL: https://www.springer.com/gp/book/9783662488454

**"Planning Algorithms" by Steven M. LaValle**
- Fundamental algorithms for robot motion planning
- Applicable to autonomous vehicle path planning
- Available free online
- URL: http://planning.cs.uiuc.edu/

**"Probabilistic Robotics" by Sebastian Thrun, Wolfram Burgard, Dieter Fox**
- Essential for understanding perception and localization
- Covers Kalman filters, particle filters, SLAM
- Foundational text for autonomous systems
- URL: https://mitpress.mit.edu/books/probabilistic-robotics

### Automotive Safety

**"Automotive Safety Handbook" by Ulrich Seiffert and Lothar Wech**
- Comprehensive guide to vehicle safety engineering
- Covers active safety, passive safety, and regulations
- SAE International publication
- URL: https://www.sae.org/publications/books/content/r-377/

**"Crash Course: The American Automobile Industry's Road to Bankruptcy and Bailout-and Beyond" by Paul Ingrassia**
- Historical perspective on automotive industry
- Lessons learned from industry challenges
- URL: https://www.penguinrandomhouse.com/books/303287/crash-course-by-paul-ingrassia/

### Functional Safety

**"Automotive Functional Safety" by David Ward and Paul Wooderson**
- Practical guide to ISO 26262 implementation
- Covers HARA, safety concepts, and testing
- Co-authored by ISO 26262 committee members
- URL: https://www.sae.org/publications/books/content/pt-175/

**"Functional Safety for Road Vehicles" by Hans-Leo Ross**
- Detailed explanation of ISO 26262
- Includes practical implementation guidance
- Springer publication
- URL: https://www.springer.com/gp/book/9783319333601

---

## Standards and Regulations

### Functional Safety Standards

**ISO 26262 - Road Vehicles Functional Safety**
- International standard for automotive functional safety
- Defines ASIL levels (A, B, C, D) and development processes
- Required for safety-critical automotive systems
- URL: https://www.iso.org/standard/68383.html

**ISO 21448 (SOTIF) - Safety of the Intended Functionality**
- Addresses limitations and misuse scenarios
- Critical for ADAS and autonomous driving safety
- Complements ISO 26262 for AI/ML systems
- URL: https://www.iso.org/standard/70939.html

**ISO/SAE 21434 - Cybersecurity Engineering**
- Automotive cybersecurity standard
- Covers threat analysis, security development, and incident response
- Joint ISO and SAE standard
- URL: https://www.iso.org/standard/70918.html

**IEC 61508 - Functional Safety of E/E/PE Systems**
- Generic functional safety standard
- Foundation for domain-specific standards
- URL: https://www.iec.ch/functionalsafety/

### Software Development Standards

**AUTOSAR (Automotive Open System Architecture)**
- Standardized automotive software architecture
- Classic Platform (CP) and Adaptive Platform (AP)
- De facto standard for automotive ECU software
- URL: https://www.autosar.org/

**ASPICE (Automotive SPICE)**
- Software process assessment and improvement
- Based on ISO/IEC 33000 and 15504
- Required by many OEMs for supplier qualification
- URL: https://www.automotivespice.com/

**MISRA C/C++**
- Coding standards for safety-critical systems
- Widely adopted in automotive industry
- Essential for safety-critical software development
- URL: https://www.misra.org.uk/

### Autonomous Driving Standards

**SAE J3016 - Levels of Driving Automation**
- Defines 6 levels of automation (L0-L5)
- Industry-standard taxonomy for autonomous driving
- Referenced by regulators worldwide
- URL: https://www.sae.org/standards/content/j3016_202104/

**ISO 22737 - Intelligent Transport Systems (ITS)**
- Low-speed automated driving systems
- Covers operational design domain, safety, and testing
- URL: https://www.iso.org/standard/73766.html

**UL 4600 - Standard for Safety for the Evaluation of Autonomous Products**
- Comprehensive safety framework for autonomous vehicles
- Covers safety case development and argument
- URL: https://www.ul.com/resources/ul-4600-autonomous-products

### Emissions and Environmental Regulations

**EPA Emissions Standards (United States)**
- Federal emissions requirements for vehicles
- Tier 3, LEV III standards
- URL: https://www.epa.gov/emission-standards-reference-guide

**CARB (California Air Resources Board)**
- California emissions standards
- Zero-emission vehicle (ZEV) mandates
- URL: https://ww2.arb.ca.gov/

**Euro 7 (European Union)**
- Latest European emissions standard
- Real driving emissions (RDE) requirements
- URL: https://ec.europa.eu/commission/presscorner/detail/en/IP_22_6495

**China 6 Emissions Standards**
- Chinese vehicle emissions requirements
- URL: https://www.theicct.org/china-vehicle-emission-standards/

### Safety Regulations

**FMVSS (Federal Motor Vehicle Safety Standards)**
- US federal safety requirements
- Covers crashworthiness, crash avoidance, post-crash survivability
- URL: https://www.nhtsa.gov/laws-regulations/fmvss

**ECE Regulations (United Nations)**
- International vehicle regulations
- Adopted by many countries worldwide
- URL: https://unece.org/transportvehicle-regulations/vehicle-regulations

**NCAP Programs**
- Euro NCAP: https://www.euroncap.com/
- NHTSA NCAP (US): https://www.nhtsa.gov/ratings
- IIHS: https://www.iihs.org/
- Global NCAP: https://www.globalncap.org/

### Communication Standards

**CAN (Controller Area Network)**
- ISO 11898 high-speed CAN
- Dominant in-vehicle network for powertrain and chassis
- URL: https://www.iso.org/standard/63648.html

**LIN (Local Interconnect Network)**
- ISO 17987 standard
- Low-cost network for body electronics
- URL: https://www.iso.org/standard/61222.html

**Automotive Ethernet**
- 100BASE-T1 (IEEE 802.3bw)
- 1000BASE-T1 (IEEE 802.3bp)
- High-bandwidth network for ADAS and infotainment
- URL: https://www.ieee802.org/3/

**FlexRay**
- ISO 17458 standard
- Deterministic network for x-by-wire applications
- URL: https://www.iso.org/standard/59804.html

---

## Official Documentation and Technical Resources

### OEM Technical Resources

**SAE International**
- Technical papers and standards
- Professional development resources
- URL: https://www.sae.org/

**SAE Mobilus**
- Digital library of automotive technical papers
- Access to standards and research
- URL: https://saemobilus.sae.org/

### Semiconductor and ECU Vendors

**NXP Automotive**
- Automotive MCUs, processors, and sensors
- S32 automotive platform documentation
- URL: https://www.nxp.com/applications/automotive:AUTOMOTIVE

**Infineon Automotive**
- AURIX microcontrollers
- Power electronics and sensors
- URL: https://www.infineon.com/cms/en/applications/automotive/

**Texas Instruments Automotive**
- Automotive analog, embedded processing
- Reference designs and technical resources
- URL: https://www.ti.com/applications/automotive/overview.html

**Renesas Automotive**
- Automotive MCUs and SoCs
- R-Car platform for ADAS
- URL: https://www.renesas.com/us/en/applications/automotive

**NVIDIA DRIVE**
- Autonomous vehicle computing platform
- DRIVE Orin, DRIVE Hyperion
- URL: https://www.nvidia.com/en-us/self-driving-cars/

**Qualcomm Automotive**
- Snapdragon automotive platforms
- Connectivity and infotainment solutions
- URL: https://www.qualcomm.com/products/automotive

### Sensor Manufacturers

**Bosch Mobility Solutions**
- Sensors, ECUs, and systems
- Technical documentation and datasheets
- URL: https://www.bosch-mobility-solutions.com/

**Continental Automotive**
- ADAS sensors and systems
- Powertrain and safety technology
- URL: https://www.continental-automotive.com/

**Valeo**
- Driving assistance systems
- Sensors and camera systems
- URL: https://www.valeo.com/en/

**Velodyne Lidar**
- Lidar sensors for autonomous vehicles
- Technical specifications and integration guides
- URL: https://velodynelidar.com/

**Luminar Technologies**
- Automotive-grade lidar
- Perception software
- URL: https://www.luminartech.com/

### Battery and EV Components

**CATL (Contemporary Amperex Technology)**
- Leading battery cell manufacturer
- Cell specifications and technology
- URL: https://www.catl.com/en/

**LG Energy Solution**
- EV battery cells and packs
- Technical documentation
- URL: https://www.lgensol.com/en

**Panasonic Automotive**
- Battery cells (Tesla partnership)
- Automotive systems
- URL: https://www.panasonic.com/global/business/automotive.html

---

## Online Courses and Training

### University Programs

**MIT OpenCourseWare - Vehicle Dynamics**
- Free course materials from MIT
- Covers vehicle dynamics fundamentals
- URL: https://ocw.mit.edu/courses/mechanical-engineering/

**Stanford Online - Introduction to Self-Driving Cars**
- Comprehensive autonomous driving curriculum
- Covers perception, planning, and control
- URL: https://online.stanford.edu/

**University of Michigan - Autonomous Vehicles Specialization (Coursera)**
- Four-course specialization
- Covers state estimation, visual perception, motion planning
- URL: https://www.coursera.org/specializations/self-driving-cars

**TU Munich - Autonomous Driving Software Engineering**
- Free online course
- Practical autonomous driving development
- URL: https://www.edx.org/course/autonomous-driving-software-engineering

### Industry Training

**SAE International Training**
- Comprehensive automotive engineering courses
- ISO 26262, ADAS, EV technology, and more
- URL: https://www.sae.org/learn/professional-development

**Vector Academy**
- AUTOSAR training
- CAN, LIN, diagnostic protocols
- URL: https://www.vector.com/int/en/services/training/

**dSPACE Academy**
- HIL testing and simulation
- Model-based development training
- URL: https://www.dspace.com/en/pub/home/academy.cfm

**ETAS Training**
- ECU development and calibration
- INCA and ASCET training
- URL: https://www.etas.com/en/services/training.php

### Online Platforms

**Udacity - Self-Driving Car Engineer Nanodegree**
- Comprehensive program developed with industry partners
- Hands-on projects with real-world data
- URL: https://www.udacity.com/course/self-driving-car-engineer-nanodegree--nd0013

**Coursera - MATLAB and Simulink for Automotive**
- MathWorks-partnered courses
- Powertrain modeling, vehicle dynamics simulation
- URL: https://www.coursera.org/mathworks

**edX - Electric Vehicles: Technology**
- Delft University of Technology
- Comprehensive EV technology course
- URL: https://www.edx.org/course/electric-vehicles-technology

**LinkedIn Learning - Automotive Engineering Courses**
- Various automotive topics
- Professional development focus
- URL: https://www.linkedin.com/learning/topics/automotive

---

## Open Source Projects

### Autonomous Driving

**Apollo (Baidu)**
- Complete autonomous driving platform
- Perception, planning, control, simulation
- URL: https://github.com/ApolloAuto/apollo

**Autoware**
- Open-source autonomous driving software
- ROS-based architecture
- URL: https://github.com/autowarefoundation/autoware

**CARLA Simulator**
- Open-source driving simulator for AD research
- Realistic urban environments and sensor models
- URL: https://carla.org/
- GitHub: https://github.com/carla-simulator/carla

**LGSVL Simulator**
- High-fidelity driving simulator
- Integration with Apollo, Autoware
- URL: https://www.lgsvlsimulator.com/
- GitHub: https://github.com/lgsvl/simulator

**OpenPilot (Comma.ai)**
- Open-source driver assistance system
- Production-ready ADAS software
- URL: https://github.com/commaai/openpilot

**AirSim**
- Microsoft's autonomous vehicle simulator
- Based on Unreal Engine
- URL: https://github.com/microsoft/AirSim

### Vehicle Software Platforms

**Automotive Grade Linux (AGL)**
- Open-source automotive software platform
- Infotainment, telematics, instrument cluster
- URL: https://www.automotivelinux.org/
- GitHub: https://github.com/AGL-Automotive

**COVESA (Connected Vehicle Systems Alliance)**
- Open standards for connected vehicles
- GENIVI successor organization
- URL: https://www.covesa.global/

**Eclipse Kuksa**
- Connected vehicle ecosystem
- Vehicle signal specification and interfaces
- URL: https://www.eclipse.org/kuksa/

**Eclipse SDV (Software Defined Vehicle)**
- Open-source vehicle software development
- Reference implementations and tools
- URL: https://sdv.eclipse.org/

### Perception and Computer Vision

**OpenCV**
- Open-source computer vision library
- Essential for camera-based perception
- URL: https://opencv.org/
- GitHub: https://github.com/opencv/opencv

**Point Cloud Library (PCL)**
- 3D point cloud processing
- Essential for lidar perception
- URL: https://pointclouds.org/
- GitHub: https://github.com/PointCloudLibrary/pcl

**Open3D**
- Modern library for 3D data processing
- Point cloud, mesh, and RGBD processing
- URL: http://www.open3d.org/
- GitHub: https://github.com/isl-org/Open3D

**MMDetection3D**
- Open-source 3D object detection toolbox
- Based on PyTorch
- GitHub: https://github.com/open-mmlab/mmdetection3d

### ROS (Robot Operating System)

**ROS 2**
- Next-generation robotics middleware
- Automotive-grade features (DDS, security)
- URL: https://docs.ros.org/en/rolling/
- GitHub: https://github.com/ros2

**ROS 2 Automotive**
- Automotive-specific ROS 2 resources
- Reference architectures and packages
- URL: https://autoware.org/ros2/

### Datasets

**KITTI Dataset**
- Benchmark for autonomous driving
- Stereo, optical flow, object detection, tracking
- URL: http://www.cvlibs.net/datasets/kitti/

**nuScenes**
- Large-scale autonomous driving dataset
- 3D object detection and tracking
- URL: https://www.nuscenes.org/

**Waymo Open Dataset**
- High-quality sensor data from Waymo
- Lidar, camera, labels
- URL: https://waymo.com/open/

**Argoverse**
- HD maps and sensor data
- Motion forecasting and 3D tracking
- URL: https://www.argoverse.org/

**BDD100K**
- Diverse driving dataset
- 100K videos with annotations
- URL: https://bdd-data.berkeley.edu/

---

## Development Tools and Platforms

### Model-Based Development

**MATLAB/Simulink (MathWorks)**
- Industry standard for automotive development
- Powertrain, dynamics, ADAS modeling
- URL: https://www.mathworks.com/solutions/automotive.html

**dSPACE**
- Hardware-in-the-loop (HIL) simulation
- Rapid prototyping, production code generation
- URL: https://www.dspace.com/

**ETAS**
- ECU development and calibration tools
- INCA calibration software
- URL: https://www.etas.com/

**AVL**
- Powertrain development tools
- CRUISE M, VSM simulation
- URL: https://www.avl.com/

### AUTOSAR Tools

**Vector DaVinci**
- AUTOSAR configuration and development
- Industry-leading AUTOSAR toolchain
- URL: https://www.vector.com/int/en/products/products-a-z/software/davinci/

**ETAS ISOLAR**
- AUTOSAR authoring and BSW configuration
- Integration with INCA calibration
- URL: https://www.etas.com/en/products/isolar.php

**EB tresos Studio (Elektrobit)**
- AUTOSAR development environment
- ECU software development platform
- URL: https://www.elektrobit.com/products/ecu/eb-tresos/studio/

### Simulation Platforms

**IPG CarMaker**
- Vehicle dynamics and ADAS simulation
- Comprehensive vehicle models
- URL: https://ipg-automotive.com/en/products-services/simulation-software/carmaker/

**ANSYS**
- Multi-physics simulation
- Structural, thermal, CFD, electromagnetic
- URL: https://www.ansys.com/industries/automotive

**Altair**
- CAE and simulation software
- OptiStruct, MotionSolve, Flux
- URL: https://www.altair.com/automotive

**Siemens Simcenter**
- Comprehensive simulation portfolio
- NX, STAR-CCM+, Amesim
- URL: https://www.plm.automation.siemens.com/global/en/products/simcenter/

### Communication and Diagnostics

**Vector CANoe/CANalyzer**
- CAN/LIN/Ethernet development and analysis
- Industry-standard diagnostic tools
- URL: https://www.vector.com/int/en/products/products-a-z/software/canoe/

**Peak Systems PCAN**
- CAN interfaces and software
- Cost-effective CAN development tools
- URL: https://www.peak-system.com/

**Intrepid Control Systems**
- Vehicle network interfaces
- neoVI hardware, Vehicle Spy software
- URL: https://www.intrepidcs.com/

### Static Analysis and Testing

**Polyspace (MathWorks)**
- Static analysis for C/C++
- MISRA compliance checking
- URL: https://www.mathworks.com/products/polyspace.html

**LDRA**
- Static and dynamic analysis
- Safety-critical software testing
- URL: https://ldra.com/

**Parasoft C/C++test**
- Static analysis and unit testing
- MISRA and CERT compliance
- URL: https://www.parasoft.com/products/ctest/

**VectorCAST**
- Automated unit and integration testing
- Coverage analysis and test automation
- URL: https://www.vector.com/int/en/products/products-a-z/software/vectorcast/

---

## Technical Blogs and Communities

### Industry Publications

**SAE International News**
- Automotive engineering news and articles
- Technical papers and research
- URL: https://www.sae.org/news/

**Automotive News**
- Industry news and analysis
- Technology and business coverage
- URL: https://www.autonews.com/

**Automotive World**
- Technology and market insights
- OEM and supplier news
- URL: https://www.automotiveworld.com/

**InsideEVs**
- Electric vehicle news and analysis
- EV technology and market coverage
- URL: https://insideevs.com/

**Charged EVs**
- EV technology magazine
- Deep technical content
- URL: https://chargedevs.com/

### Technical Blogs

**Bosch Automotive Technology Blog**
- Technical insights from Bosch
- URL: https://www.bosch.com/stories/

**Continental Engineering Stories**
- Innovation and technology stories
- URL: https://www.continental.com/en/press/stories/

**Tesla Engineering Blog**
- Technical details on Tesla systems
- URL: https://www.tesla.com/blog

**NVIDIA Automotive Blog**
- AI and autonomous driving technology
- URL: https://blogs.nvidia.com/blog/category/autonomous-vehicles/

**Waymo Blog**
- Autonomous driving development insights
- URL: https://blog.waymo.com/

### Online Communities

**Reddit - r/AutomotiveEngineering**
- Community discussions on automotive engineering
- URL: https://www.reddit.com/r/AutomotiveEngineering/

**Reddit - r/SelfDrivingCars**
- Autonomous vehicle discussions
- URL: https://www.reddit.com/r/SelfDrivingCars/

**Reddit - r/electricvehicles**
- EV technology and news
- URL: https://www.reddit.com/r/electricvehicles/

**Stack Exchange - Motor Vehicle Maintenance & Repair**
- Technical Q&A
- URL: https://mechanics.stackexchange.com/

**SAE Community**
- Professional engineering community
- URL: https://www.sae.org/participate/membership/

**AUTOSAR Community**
- AUTOSAR development discussions
- URL: https://www.autosar.org/community/

---

## Conference Proceedings and Research

### Major Conferences

**SAE World Congress**
- Premier automotive engineering conference
- Technical papers and exhibitions
- URL: https://www.sae.org/attend/wcx

**IAA Mobility (formerly Frankfurt Motor Show)**
- Major international auto show
- Technology showcase and conferences
- URL: https://www.iaa-mobility.com/

**CES (Consumer Electronics Show)**
- Automotive technology showcase
- Connected and autonomous vehicles
- URL: https://www.ces.tech/

**Automotive Testing Expo**
- Testing and validation focus
- URL: https://www.testing-expo.com/

**Electric & Hybrid Vehicle Technology Expo**
- Electrification focus
- URL: https://www.evtechexpo.com/

### Autonomous Driving Conferences

**IEEE Intelligent Vehicles Symposium (IV)**
- Academic conference on intelligent vehicles
- URL: https://ieee-iv.org/

**IEEE Intelligent Transportation Systems Conference (ITSC)**
- Transportation systems research
- URL: https://ieee-itss.org/conf/itsc/

**CVPR (Computer Vision and Pattern Recognition)**
- Computer vision research (autonomous driving track)
- URL: https://cvpr.thecvf.com/

**NeurIPS (Neural Information Processing Systems)**
- Machine learning research
- URL: https://neurips.cc/

**ICRA (International Conference on Robotics and Automation)**
- Robotics research (autonomous systems)
- URL: https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra

### Research Organizations

**SAE EDGE Research Reports**
- In-depth technical research
- URL: https://www.sae.org/publications/edge-research-reports

**MIT AgeLab**
- Human factors and autonomous vehicles
- URL: https://agelab.mit.edu/

**Stanford Automotive Research Center (CARS)**
- Automotive research programs
- URL: https://cars.stanford.edu/

**University of Michigan Mcity**
- Autonomous and connected vehicle research
- URL: https://mcity.umich.edu/

**CMU Robotics Institute**
- Autonomous systems research
- URL: https://www.ri.cmu.edu/

---

## Video Channels and Podcasts

### YouTube Channels

**Engineering Explained**
- Automotive engineering concepts explained clearly
- Powertrain, EV technology, vehicle dynamics
- URL: https://www.youtube.com/user/EngineeringExplained

**Munro Live**
- Sandy Munro's teardown analysis
- EV and vehicle engineering insights
- URL: https://www.youtube.com/c/MunroLive

**Weber Auto**
- Professor John Kelly's automotive courses
- In-depth EV technology analysis
- URL: https://www.youtube.com/c/WeberAuto

**Learn Engineering**
- Animated engineering explanations
- Automotive systems and components
- URL: https://www.youtube.com/c/Aborcheck

**The Engineering Mindset**
- Engineering concepts and systems
- Automotive and mechanical focus
- URL: https://www.youtube.com/c/Theengineeringmindset

**Bjorn Nyland**
- EV testing and reviews
- Technical depth and data analysis
- URL: https://www.youtube.com/user/bjaboransen

**Jack Rickard - EVTV**
- EV conversion and technology
- Deep technical content
- URL: https://www.youtube.com/user/EVTVDotMe

### Podcasts

**Autoline Daily / Autoline After Hours**
- Automotive industry news and discussion
- URL: https://www.autoline.tv/

**SAE Tomorrow Today**
- SAE's official podcast
- Engineering and technology discussions
- URL: https://www.sae.org/publications/sae-tomorrow-today

**Fully Charged Show Podcast**
- Electric vehicles and clean energy
- URL: https://www.fullycharged.show/

**The Autonocast**
- Autonomous vehicle technology and industry
- URL: https://www.autonocast.com/

**EV News Daily**
- Daily electric vehicle news
- URL: https://www.evnewsdaily.com/

**The Electric Car Show**
- EV technology and industry insights
- URL: https://www.instagram.com/electriccarshow/

---

## Learning Paths and Career Resources

### Skill Development

**SAE Collegiate Design Series**
- Formula SAE, Baja SAE, Clean Snowmobile
- Hands-on engineering experience
- URL: https://www.sae.org/attend/student-events

**Automotive Engineering Certificate Programs**
- University extension programs
- Professional development certificates
- Various universities offer programs

**AUTOSAR Training Path**
- Vector, ETAS, and EB training programs
- Progressive skill development
- Start with architecture, progress to implementation

### Career Guidance

**SAE Career Development**
- Resume resources and job postings
- Professional development guidance
- URL: https://www.sae.org/career/

**Automotive News Jobs**
- Industry job listings
- Career insights and trends
- URL: https://www.autonews.com/jobs

**LinkedIn Automotive Groups**
- Professional networking
- Industry connections
- Various automotive engineering groups

### Professional Certifications

**SAE Certificates**
- Various technical certificates
- Professional recognition
- URL: https://www.sae.org/learn/professional-development/certificates

**ASE Certification**
- Automotive service excellence
- Technician and engineer certifications
- URL: https://www.ase.com/

**PMP (Project Management Professional)**
- Project management certification
- Valuable for engineering managers
- URL: https://www.pmi.org/certifications/project-management-pmp

---

## Conclusion

This curated collection of references represents the most authoritative and practical resources for automotive engineering. Whether you're beginning your career in automotive development or advancing to specialized roles in electrification, autonomous driving, or functional safety, these resources provide comprehensive coverage of the field's technical foundations, current technologies, and emerging trends.

**Recommended Starting Points:**

1. **For Vehicle Dynamics**: Start with Gillespie's "Fundamentals of Vehicle Dynamics" and SAE courses
2. **For Electrification**: Study Ehsani's EV textbook and explore battery technology resources
3. **For ADAS/AD**: Begin with Udacity's Self-Driving Car program and explore open-source platforms
4. **For Functional Safety**: Study ISO 26262 through SAE courses and industry training
5. **For Software Development**: Learn AUTOSAR through vendor training and hands-on projects
6. **For Hands-On Experience**: Engage with Formula SAE, open-source simulators, and industry tools

The automotive industry's transformation toward electric, autonomous, and connected vehicles creates continuous learning opportunities. Stay current through industry publications, conferences, and professional communities as automotive engineering continues to evolve with new technologies, regulations, and business models.
