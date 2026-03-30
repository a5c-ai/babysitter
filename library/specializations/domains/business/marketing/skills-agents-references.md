# Marketing and Brand Management - Skills and Agents References

This document provides references to GitHub repositories, MCP servers, community resources, and implementation guides for the skills and agents identified in the Marketing and Brand Management specialization backlog.

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Servers and Integrations](#mcp-servers-and-integrations)
3. [Skills References](#skills-references)
4. [Agents References](#agents-references)
5. [Community Resources](#community-resources)
6. [SDK and API Documentation](#sdk-and-api-documentation)
7. [Implementation Templates](#implementation-templates)

---

## Overview

This reference document maps each skill and agent identified in the backlog to:
- **MCP Servers**: Model Context Protocol servers that provide specialized capabilities
- **GitHub Repositories**: Open-source implementations and tools
- **Official APIs**: Vendor documentation and SDKs
- **Community Resources**: Guides, tutorials, and best practices
- **Related Projects**: Complementary tools and integrations

---

## MCP Servers and Integrations

### Marketing Automation & Analytics MCP Servers

| MCP Server | Repository | Description | Relevant Skills |
|------------|------------|-------------|-----------------|
| Google Analytics MCP | [mcp-server-google-analytics](https://github.com/modelcontextprotocol/servers/tree/main/src/google-analytics) | GA4 data access and reporting | SK-005 |
| HubSpot MCP | [mcp-server-hubspot](https://github.com/Breven-Marketing-Technologies/hubspot-mcp-server) | HubSpot CRM and marketing automation | SK-006, SK-018 |
| Brave Search MCP | [mcp-server-brave-search](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) | Web search for market research | SK-002, SK-010 |
| Puppeteer MCP | [mcp-server-puppeteer](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) | Web scraping for competitive analysis | SK-002 |
| PostgreSQL MCP | [mcp-server-postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) | Customer data queries | SK-015, SK-018 |
| Slack MCP | [mcp-server-slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) | Marketing team communications | SK-017 |
| Google Drive MCP | [mcp-server-gdrive](https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive) | Brand asset access and management | SK-003 |

### Community MCP Servers

| MCP Server | Repository | Description | Relevant Skills |
|------------|------------|-------------|-----------------|
| Airtable MCP | [airtable-mcp-server](https://github.com/rashidazarang/airtable-mcp-server) | Campaign tracking and editorial calendars | SK-017 |
| Notion MCP | [notion-mcp-server](https://github.com/v-3/notion-server) | Content planning and documentation | SK-011, SK-017 |
| Asana MCP | [asana-mcp-server](https://github.com/roychri/mcp-server-asana) | Marketing project management | SK-017 |
| Linear MCP | [linear-mcp-server](https://github.com/jerhadf/linear-mcp-server) | Campaign task management | SK-017 |
| Jira MCP | [jira-mcp-server](https://github.com/cosmix/jira-mcp-server) | Marketing workflow management | SK-017 |
| Mailchimp MCP | [mailchimp-mcp-server](https://github.com/hannesrudolph/mcp-server-mailchimp) | Email marketing automation | SK-013 |
| WordPress MCP | [wordpress-mcp-server](https://github.com/jmagar/wp-mcp-server) | CMS content management | SK-011 |
| Twitter/X MCP | [twitter-mcp-server](https://github.com/EnesCinr/twitter-mcp) | Social media management | SK-009 |

---

## Skills References

### SK-001: Market Research Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [qualtrics-api-python](https://github.com/Jaseibert/QualtricsAPI) | Python wrapper for Qualtrics API | 100+ | Python |
| [surveymonkey-python](https://github.com/surveymonkey/surveymonkey-api-client) | SurveyMonkey API client | 50+ | Python |
| [prolific-api](https://github.com/prolific-co/prolific-api-client) | Prolific panel integration | Community | Python |
| [mturk-boto3](https://github.com/aws/aws-sdk-python) | AWS MTurk via boto3 | Official | Python |

**API Documentation**:
- [Qualtrics API Reference](https://api.qualtrics.com/)
- [SurveyMonkey API Docs](https://developer.surveymonkey.com/api/v3/)
- [Prolific API Docs](https://docs.prolific.co/docs/api-docs/)
- [Amazon MTurk API](https://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/Welcome.html)

**Community Resources**:
- [r/SurveyResearch](https://www.reddit.com/r/SurveyResearch/) - Survey methodology community
- [Quirk's Research Community](https://www.quirks.com/) - Market research resources
- [GreenBook Research](https://www.greenbook.org/) - Industry insights and tools

---

### SK-002: Competitive Intelligence Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [semrush-api](https://github.com/benhesketh21/semrush) | Python Semrush API client | 50+ | Python |
| [similarweb-scraper](https://github.com/similarweb/similarweb-data-api-sdk) | SimilarWeb data SDK | Official | Multiple |
| [competitor-tracker](https://github.com/topics/competitor-analysis) | Various CI tools | Varied | Multiple |
| [brand-monitoring](https://github.com/topics/brand-monitoring) | Brand tracking solutions | Varied | Multiple |

**API Documentation**:
- [Semrush API](https://www.semrush.com/api-analytics/)
- [SimilarWeb API](https://api.similarweb.com/documentation)
- [Crayon API](https://www.crayon.co/api-documentation)
- [Klue API](https://support.klue.com/hc/en-us/articles/360059186231-Klue-API)

**Community Resources**:
- [SCIP (Strategic & Competitive Intelligence Professionals)](https://www.scip.org/)
- [r/competitiveintelligence](https://www.reddit.com/r/competitiveintelligence/)
- [Competitive Intelligence Alliance](https://competitiveintelligencealliance.io/)

---

### SK-003: Brand Asset Management Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [brandfolder-api](https://developer.brandfolder.com/) | Brandfolder integration | Official | REST |
| [bynder-sdk](https://github.com/Bynder/bynder-js-sdk) | Bynder JavaScript SDK | Official | JavaScript |
| [dam-connectors](https://github.com/topics/digital-asset-management) | DAM integrations | Varied | Multiple |

**API Documentation**:
- [Brandfolder API](https://developer.brandfolder.com/docs/)
- [Bynder API](https://developer-docs.bynder.com/api/)
- [Adobe Experience Manager Assets API](https://developer.adobe.com/experience-manager/docs/)

**Community Resources**:
- [DAM Foundation](https://damfoundation.org/)
- [Brand Management Best Practices](https://www.ama.org/topics/brand-management/)

---

### SK-004: Brand Tracking Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [brand24-api](https://brand24.com/api) | Brand monitoring API | Official | REST |
| [nps-tools](https://github.com/topics/net-promoter-score) | NPS measurement tools | Varied | Multiple |
| [sentiment-analysis](https://github.com/topics/sentiment-analysis) | Brand sentiment tools | Varied | Multiple |

**API Documentation**:
- [Brand24 API](https://brand24.com/api-documentation/)
- [Qualtrics Brand XM](https://www.qualtrics.com/support/brand-experience/)
- [Latana API](https://latana.com/api/)

**Frameworks and Models**:
- [Keller CBBE Model](https://www.mindtools.com/pages/article/keller-brand-equity-model.htm)
- [Aaker Brand Equity Model](https://www.brandingstrategyinsider.com/tag/david-aaker/)

---

### SK-005: Marketing Analytics Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [google-analytics-api](https://github.com/googleapis/google-api-python-client) | GA4 Python client | 7k+ | Python |
| [mixpanel-python](https://github.com/mixpanel/mixpanel-python) | Mixpanel Python SDK | 300+ | Python |
| [amplitude-python](https://github.com/amplitude/Amplitude-Python) | Amplitude Python SDK | 100+ | Python |
| [attribution-models](https://github.com/topics/attribution-modeling) | Attribution tools | Varied | Multiple |
| [marketing-mix-modeling](https://github.com/google/lightweight_mmm) | Google LightweightMMM | 1k+ | Python |

**API Documentation**:
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Adobe Analytics API](https://developer.adobe.com/analytics-apis/docs/2.0/)
- [Mixpanel API](https://developer.mixpanel.com/reference/overview)
- [Amplitude API](https://www.docs.developers.amplitude.com/)

**Community Resources**:
- [Measure Slack Community](https://www.measure.chat/)
- [Analytics Academy (Google)](https://analytics.google.com/analytics/academy/)
- [r/analytics](https://www.reddit.com/r/analytics/)

---

### SK-006: Marketing Automation Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [hubspot-api-python](https://github.com/HubSpot/hubspot-api-python) | HubSpot Python SDK | Official | Python |
| [marketo-rest-python](https://github.com/jepcastelern/marketo-rest-python) | Marketo REST API client | 50+ | Python |
| [pardot-api](https://github.com/pardot/api-v5-python) | Pardot API integration | Official | Python |
| [salesforce-marketing-cloud](https://github.com/salesforce-marketingcloud/FuelSDK-Python) | SFMC Fuel SDK | Official | Python |

**API Documentation**:
- [HubSpot API](https://developers.hubspot.com/docs/api/overview)
- [Marketo REST API](https://developers.marketo.com/rest-api/)
- [Pardot API](https://developer.salesforce.com/docs/marketing/pardot/overview)
- [Salesforce Marketing Cloud API](https://developer.salesforce.com/docs/marketing/marketing-cloud/overview)

**Community Resources**:
- [HubSpot Community](https://community.hubspot.com/)
- [Marketo Nation](https://nation.marketo.com/)
- [Salesforce Trailblazer Community](https://trailhead.salesforce.com/trailblazer-community)

---

### SK-007: SEO Tools Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [python-ahrefs-api](https://github.com/ahrefs/ahrefs-api-python) | Ahrefs API client | Official | Python |
| [semrush-api](https://github.com/benhesketh21/semrush) | Semrush integration | 50+ | Python |
| [moz-api-python](https://github.com/seomoz/SEOmozAPISamples) | Moz API samples | Official | Multiple |
| [searchconsole](https://github.com/joshcarty/google-searchconsole) | GSC Python wrapper | 200+ | Python |
| [screaming-frog-seo](https://github.com/topics/screaming-frog) | SF integrations | Varied | Multiple |

**API Documentation**:
- [Semrush API](https://www.semrush.com/api-analytics/)
- [Ahrefs API](https://ahrefs.com/api/documentation)
- [Moz API](https://moz.com/help/links-api)
- [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)

**Community Resources**:
- [Moz Community](https://moz.com/community)
- [Search Engine Land](https://searchengineland.com/)
- [r/SEO](https://www.reddit.com/r/SEO/)
- [r/TechSEO](https://www.reddit.com/r/TechSEO/)

---

### SK-008: Paid Media Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [google-ads-python](https://github.com/googleads/google-ads-python) | Google Ads API client | Official | Python |
| [facebook-python-business-sdk](https://github.com/facebook/facebook-python-business-sdk) | Meta Marketing API | Official | Python |
| [linkedin-marketing-api](https://github.com/linkedin-developers/linkedin-api-python-client) | LinkedIn Marketing API | Official | Python |
| [twitter-ads-api](https://github.com/twitterdev/twitter-python-ads-sdk) | Twitter Ads SDK | Official | Python |

**API Documentation**:
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
- [LinkedIn Marketing API](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Twitter Ads API](https://developer.twitter.com/en/docs/twitter-ads-api)

**Community Resources**:
- [Google Ads Community](https://support.google.com/google-ads/community)
- [Meta for Business Community](https://www.facebook.com/business/community)
- [PPC Hero](https://www.ppchero.com/)
- [r/PPC](https://www.reddit.com/r/PPC/)

---

### SK-009: Social Media Management Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [python-twitter](https://github.com/bear/python-twitter) | Twitter API wrapper | 3k+ | Python |
| [instagram-private-api](https://github.com/ping/instagram_private_api) | Instagram API | 2.5k+ | Python |
| [linkedin-api](https://github.com/tomquirk/linkedin-api) | LinkedIn integration | 1k+ | Python |
| [buffer-api](https://github.com/buffer/buffer-python) | Buffer API client | 100+ | Python |

**API Documentation**:
- [Sprout Social API](https://developers.sproutsocial.com/)
- [Hootsuite API](https://developer.hootsuite.com/)
- [Buffer API](https://buffer.com/developers/api)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

**Community Resources**:
- [Social Media Examiner](https://www.socialmediaexaminer.com/)
- [Social Media Today](https://www.socialmediatoday.com/)
- [r/socialmedia](https://www.reddit.com/r/socialmedia/)

---

### SK-010: Social Listening Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [brandwatch-api](https://github.com/topics/brandwatch) | Brandwatch integrations | Varied | Multiple |
| [mention-api](https://github.com/topics/social-listening) | Mention API tools | Varied | Multiple |
| [tweepy](https://github.com/tweepy/tweepy) | Twitter streaming | 10k+ | Python |
| [vaderSentiment](https://github.com/cjhutto/vaderSentiment) | Sentiment analysis | 4k+ | Python |

**API Documentation**:
- [Brandwatch API](https://developers.brandwatch.com/)
- [Sprinklr API](https://developer.sprinklr.com/)
- [Mention API](https://mention.com/en/api/)
- [Brand24 API](https://brand24.com/api-documentation/)

**Community Resources**:
- [Social Intelligence Lab](https://www.socialintellab.com/)
- [Converseon Social Listening Resources](https://converseon.com/)

---

### SK-011: Content Management Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [wordpress-python](https://github.com/d3v-null/python-wordpress-xmlrpc) | WordPress XML-RPC | 200+ | Python |
| [contentful-python](https://github.com/contentful/contentful.py) | Contentful SDK | Official | Python |
| [hubspot-cms-js](https://github.com/HubSpot/hubspot-cms-tools) | HubSpot CMS tools | Official | JavaScript |
| [strapi](https://github.com/strapi/strapi) | Headless CMS | 60k+ | JavaScript |

**API Documentation**:
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Contentful Content Management API](https://www.contentful.com/developers/docs/references/content-management-api/)
- [HubSpot CMS API](https://developers.hubspot.com/docs/api/cms/content)
- [Sanity API](https://www.sanity.io/docs/api-reference)

**Community Resources**:
- [WordPress Developer Resources](https://developer.wordpress.org/)
- [Contentful Community](https://www.contentful.com/community/)
- [Jamstack Community](https://jamstack.org/community/)

---

### SK-012: Content Optimization Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [clearscope-api](https://github.com/topics/content-optimization) | Content optimization tools | Varied | Multiple |
| [textstat](https://github.com/shivam5992/textstat) | Readability scoring | 1k+ | Python |
| [yoast-seo](https://github.com/Yoast/wordpress-seo) | SEO plugin | 3k+ | PHP |
| [natural](https://github.com/NaturalNode/natural) | NLP tools | 10k+ | JavaScript |

**API Documentation**:
- [Clearscope API](https://www.clearscope.io/api)
- [Surfer SEO API](https://surferseo.com/api/)
- [MarketMuse API](https://www.marketmuse.com/api/)
- [Frase API](https://www.frase.io/api/)

**Community Resources**:
- [Content Marketing Institute](https://contentmarketinginstitute.com/)
- [Copyblogger](https://copyblogger.com/)
- [r/content_marketing](https://www.reddit.com/r/content_marketing/)

---

### SK-013: Email Marketing Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [mailchimp-marketing-python](https://github.com/mailchimp/mailchimp-marketing-python) | Mailchimp SDK | Official | Python |
| [klaviyo-python](https://github.com/klaviyo/klaviyo-python-sdk) | Klaviyo SDK | Official | Python |
| [sendgrid-python](https://github.com/sendgrid/sendgrid-python) | SendGrid SDK | Official | Python |
| [mjml](https://github.com/mjmlio/mjml) | Email templating | 16k+ | JavaScript |
| [react-email](https://github.com/resendlabs/react-email) | React email components | 10k+ | TypeScript |

**API Documentation**:
- [Mailchimp Marketing API](https://mailchimp.com/developer/marketing/api/)
- [Klaviyo API](https://developers.klaviyo.com/)
- [SendGrid API](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api)
- [Brevo (Sendinblue) API](https://developers.brevo.com/)

**Community Resources**:
- [Email on Acid](https://www.emailonacid.com/blog/)
- [Litmus Community](https://litmus.com/community)
- [Really Good Emails](https://reallygoodemails.com/)
- [r/emailmarketing](https://www.reddit.com/r/emailmarketing/)

---

### SK-014: BI and Dashboard Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [tableau-api-lib](https://github.com/divinorum-webb/tableau-api-lib) | Tableau Server API | 200+ | Python |
| [powerbi-python](https://github.com/microsoft/powerbi-client-python) | Power BI client | Official | Python |
| [looker-sdk](https://github.com/looker-open-source/sdk-codegen) | Looker SDK | Official | Multiple |
| [superset](https://github.com/apache/superset) | Open source BI | 55k+ | Python |
| [metabase](https://github.com/metabase/metabase) | Open source analytics | 35k+ | Clojure |

**API Documentation**:
- [Tableau REST API](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api.htm)
- [Power BI REST API](https://learn.microsoft.com/en-us/rest/api/power-bi/)
- [Looker API](https://cloud.google.com/looker/docs/api-getting-started)
- [Domo API](https://developer.domo.com/)

**Community Resources**:
- [Tableau Community](https://community.tableau.com/)
- [Power BI Community](https://community.powerbi.com/)
- [r/tableau](https://www.reddit.com/r/tableau/)
- [r/PowerBI](https://www.reddit.com/r/PowerBI/)

---

### SK-015: Customer Data Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [analytics-python](https://github.com/segmentio/analytics-python) | Segment Python SDK | Official | Python |
| [mparticle-python-sdk](https://github.com/mParticle/mparticle-python-sdk) | mParticle SDK | Official | Python |
| [rudder-sdk-python](https://github.com/rudderlabs/rudder-sdk-python) | RudderStack SDK | Official | Python |
| [rudderstack](https://github.com/rudderlabs/rudder-server) | Open source CDP | 4k+ | Go |

**API Documentation**:
- [Segment APIs](https://segment.com/docs/connections/sources/catalog/libraries/server/python/)
- [mParticle API](https://docs.mparticle.com/developers/)
- [Adobe Real-Time CDP API](https://developer.adobe.com/experience-platform-apis/)
- [RudderStack API](https://www.rudderstack.com/docs/api/)

**Community Resources**:
- [CDP Institute](https://www.cdpinstitute.org/)
- [Segment Recipes](https://segment.com/recipes/)
- [mParticle Blog](https://www.mparticle.com/blog)

---

### SK-016: Creative Testing Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [creative-testing](https://github.com/topics/ab-testing) | A/B testing tools | Varied | Multiple |
| [optimizely-python-sdk](https://github.com/optimizely/python-sdk) | Optimizely SDK | Official | Python |
| [growthbook](https://github.com/growthbook/growthbook) | Open source feature flagging | 5k+ | TypeScript |

**API Documentation**:
- [Optimizely API](https://docs.developers.optimizely.com/)
- [VWO API](https://developers.vwo.com/)
- [Adobe Target API](https://developer.adobe.com/target/before-implement/)

**Community Resources**:
- [CXL Institute](https://cxl.com/)
- [ConversionXL Blog](https://cxl.com/blog/)
- [r/CRO](https://www.reddit.com/r/CRO/)

---

### SK-017: Project Management Platform Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [asana-python](https://github.com/Asana/python-asana) | Asana Python client | Official | Python |
| [monday-sdk-python](https://github.com/mondaycom/monday-sdk-python) | Monday.com SDK | Official | Python |
| [jira-python](https://github.com/pycontribs/jira) | Jira client | 2k+ | Python |
| [linear-sdk](https://github.com/linear/linear) | Linear API | Official | TypeScript |

**API Documentation**:
- [Asana API](https://developers.asana.com/docs/)
- [Monday.com API](https://developer.monday.com/api-reference)
- [Workfront API](https://experienceleague.adobe.com/docs/workfront/using/adobe-workfront-api/api-general-information/api-basics.html)
- [Wrike API](https://developers.wrike.com/)

**Community Resources**:
- [Asana Community](https://forum.asana.com/)
- [Monday.com Community](https://community.monday.com/)
- [r/projectmanagement](https://www.reddit.com/r/projectmanagement/)

---

### SK-018: CRM Integration Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [simple-salesforce](https://github.com/simple-salesforce/simple-salesforce) | Salesforce Python | 1.5k+ | Python |
| [hubspot-api-python](https://github.com/HubSpot/hubspot-api-python) | HubSpot CRM SDK | Official | Python |
| [dynamics365-python](https://github.com/MicrosoftDocs/dynamics365-docs) | Dynamics 365 docs | Official | Multiple |
| [pipedrive-api](https://github.com/pipedrive/client-nodejs) | Pipedrive client | Official | Node.js |

**API Documentation**:
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [HubSpot CRM API](https://developers.hubspot.com/docs/api/crm/understanding-the-crm)
- [Dynamics 365 Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Pipedrive API](https://developers.pipedrive.com/docs/api/v1)

**Community Resources**:
- [Salesforce Developer Community](https://developer.salesforce.com/community)
- [HubSpot Academy](https://academy.hubspot.com/)
- [r/salesforce](https://www.reddit.com/r/salesforce/)

---

### SK-019: Media Mix Modeling Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [lightweight_mmm](https://github.com/google/lightweight_mmm) | Google LightweightMMM | 1k+ | Python |
| [pymc-marketing](https://github.com/pymc-labs/pymc-marketing) | Bayesian MMM | 500+ | Python |
| [robyn](https://github.com/facebookexperimental/Robyn) | Meta Robyn MMM | 1k+ | R |
| [orbit](https://github.com/uber/orbit) | Uber time series | 1.5k+ | Python |
| [causalimpact](https://github.com/google/CausalImpact) | Google Causal Impact | 1.5k+ | R |

**API Documentation**:
- [LightweightMMM Documentation](https://lightweight-mmm.readthedocs.io/)
- [Robyn Documentation](https://facebookexperimental.github.io/Robyn/)
- [PyMC-Marketing Docs](https://www.pymc-marketing.io/)

**Community Resources**:
- [Marketing Science Partners](https://marketingsciencepartners.com/)
- [Analytic Partners Blog](https://analyticpartners.com/blog/)
- [r/datascience](https://www.reddit.com/r/datascience/)

---

### SK-020: Customer Journey Mapping Skill

**GitHub Repositories**:
| Repository | Description | Stars | Language |
|------------|-------------|-------|----------|
| [miro-api](https://github.com/miroapp/api-clients) | Miro API clients | Official | Multiple |
| [lucidchart-api](https://github.com/lucidchart) | Lucidchart integrations | Official | Multiple |
| [customer-journey](https://github.com/topics/customer-journey) | Journey mapping tools | Varied | Multiple |
| [diagrams](https://github.com/mingrammer/diagrams) | Diagram as code | 30k+ | Python |

**API Documentation**:
- [Miro REST API](https://developers.miro.com/docs/rest-api)
- [Lucidchart API](https://developer.lucid.co/)
- [Figma API](https://www.figma.com/developers/api) (for journey mapping)

**Community Resources**:
- [UX Collective](https://uxdesign.cc/)
- [Nielsen Norman Group Journey Mapping](https://www.nngroup.com/articles/customer-journey-mapping/)
- [Service Design Network](https://www.service-design-network.org/)

---

## Agents References

### AG-001: Brand Strategist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| April Dunford - Obviously Awesome | Positioning methodology | [obviouslyawesome.com](https://www.aprildunford.com/) |
| Keller's Brand Equity Model | CBBE framework | [Academic papers](https://www.journals.uchicago.edu/doi/abs/10.1086/208520) |
| Marty Neumeier - The Brand Gap | Brand building | [martyneumeier.com](https://martyneumeier.com/) |
| David Aaker - Brand Relevance | Brand strategy | [davidaaker.com](https://www.davidaaker.com/) |

**Community Resources**:
- [ANA (Association of National Advertisers)](https://www.ana.net/)
- [Branding Strategy Insider](https://www.brandingstrategyinsider.com/)
- [Brand New (Under Consideration)](https://www.underconsideration.com/brandnew/)

**Training & Certification**:
- [ANA Brand Management Certificate](https://www.ana.net/content/show/id/certified-brand-manager)
- [Cornell Brand Management Certificate](https://ecornell.cornell.edu/certificates/leadership-and-strategic-management/brand-management/)

---

### AG-002: Market Research Director Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Qualtrics XM Institute | Research methodology | [xminstitute.com](https://www.qualtrics.com/xm-institute/) |
| ESOMAR Guidelines | Research standards | [esomar.org](https://www.esomar.org/) |
| Jobs-to-be-Done Framework | JTBD methodology | [jtbd.info](https://jtbd.info/) |
| Strategyzer Resources | Persona development | [strategyzer.com](https://www.strategyzer.com/) |

**Community Resources**:
- [Insights Association](https://www.insightsassociation.org/)
- [MRS (Market Research Society)](https://www.mrs.org.uk/)
- [Quirk's Media](https://www.quirks.com/)
- [GreenBook Blog](https://www.greenbook.org/mr/market-research/)

**Training & Certification**:
- [MRA Research Certification](https://www.mra-net.org/certification)
- [Burke Institute Training](https://www.burkeinstitute.com/)

---

### AG-003: Campaign Strategist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| PESO Model | Integrated marketing | [Spin Sucks PESO](https://spinsucks.com/communication/peso-model/) |
| IPA Effectiveness Awards | Campaign effectiveness | [ipa.co.uk](https://ipa.co.uk/awards-events/effectiveness) |
| Effie Awards Case Studies | Award-winning campaigns | [effie.org](https://www.effie.org/) |
| WARC Best Practice | Campaign planning | [warc.com](https://www.warc.com/) |

**Community Resources**:
- [Campaign Magazine](https://www.campaignlive.co.uk/)
- [Marketing Week](https://www.marketingweek.com/)
- [The Drum](https://www.thedrum.com/)

---

### AG-004: Creative Director Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Cannes Lions Archive | Creative excellence | [canneslions.com](https://www.canneslions.com/) |
| D&AD Archive | Design awards | [dandad.org](https://www.dandad.org/) |
| One Club Portfolio | Creative work | [oneclub.org](https://www.oneclub.org/) |
| Communication Arts | Creative inspiration | [commarts.com](https://www.commarts.com/) |

**Community Resources**:
- [AIGA](https://www.aiga.org/)
- [The One Club](https://www.oneclub.org/)
- [Creative Review](https://www.creativereview.co.uk/)

---

### AG-005: Content Marketing Strategist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Content Marketing Institute | Strategy guides | [contentmarketinginstitute.com](https://contentmarketinginstitute.com/) |
| Ann Handley - Everybody Writes | Content creation | [annhandley.com](https://annhandley.com/) |
| HubSpot Content Strategy | Topic clusters | [hubspot.com/blog](https://blog.hubspot.com/marketing/topic-clusters) |
| Contently Resources | Content strategy | [contently.com](https://contently.com/) |

**Community Resources**:
- [Content Marketing World](https://www.contentmarketingworld.com/)
- [r/content_marketing](https://www.reddit.com/r/content_marketing/)
- [Superpath Community](https://superpath.co/)

---

### AG-006: SEO Expert Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Google Search Central | Official guidelines | [developers.google.com/search](https://developers.google.com/search) |
| Moz Beginner's Guide | SEO fundamentals | [moz.com/beginners-guide-to-seo](https://moz.com/beginners-guide-to-seo) |
| Ahrefs Blog | Advanced SEO | [ahrefs.com/blog](https://ahrefs.com/blog/) |
| Search Engine Journal | Industry news | [searchenginejournal.com](https://www.searchenginejournal.com/) |

**Community Resources**:
- [r/SEO](https://www.reddit.com/r/SEO/)
- [r/TechSEO](https://www.reddit.com/r/TechSEO/)
- [Traffic Think Tank](https://trafficthinktank.com/)
- [Women in Tech SEO](https://www.womenintechseo.com/)

---

### AG-007: Digital Marketing Manager Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Google Skillshop | Google Ads certification | [skillshop.withgoogle.com](https://skillshop.withgoogle.com/) |
| Meta Blueprint | Meta ads certification | [facebook.com/business/learn](https://www.facebook.com/business/learn) |
| HubSpot Academy | Inbound marketing | [academy.hubspot.com](https://academy.hubspot.com/) |
| LinkedIn Learning | Marketing courses | [linkedin.com/learning](https://www.linkedin.com/learning/) |

**Community Resources**:
- [r/PPC](https://www.reddit.com/r/PPC/)
- [r/digital_marketing](https://www.reddit.com/r/digital_marketing/)
- [GrowthHackers Community](https://growthhackers.com/)

---

### AG-008: Marketing Analytics Director Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Google Analytics Academy | GA certification | [analytics.google.com/analytics/academy](https://analytics.google.com/analytics/academy/) |
| Occam's Razor (Avinash Kaushik) | Analytics philosophy | [kaushik.net](https://www.kaushik.net/avinash/) |
| Marketing Analytics Book | Statistical methods | [marketinganalytics.co](https://www.marketinganalytics.co/) |
| Measure Slack Community | Analytics community | [measure.chat](https://www.measure.chat/) |

**Community Resources**:
- [Digital Analytics Association](https://www.digitalanalyticsassociation.org/)
- [Superweek Conference](https://superweek.hu/)
- [MeasureCamp](https://www.measurecamp.org/)

---

### AG-009: Competitive Intelligence Analyst Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| SCIP Resources | CI methodology | [scip.org](https://www.scip.org/) |
| Porter's Five Forces | Competitive analysis | [HBR articles](https://hbr.org/1979/03/how-competitive-forces-shape-strategy) |
| Competitive Intelligence Advantage | CI book | [amazon.com](https://www.amazon.com/) |
| Klue Academy | CI training | [klue.com/academy](https://klue.com/academy) |

**Community Resources**:
- [SCIP Conferences](https://www.scip.org/)
- [Competitive Intelligence Alliance](https://competitiveintelligencealliance.io/)
- [r/competitiveintelligence](https://www.reddit.com/r/competitiveintelligence/)

---

### AG-010: Consumer Insights Specialist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| IDEO Human-Centered Design | Design thinking | [ideo.com](https://www.ideo.com/) |
| Christensen JTBD | Jobs theory | [jtbd.info](https://jtbd.info/) |
| Empathy Mapping | User research | [nngroup.com](https://www.nngroup.com/articles/empathy-mapping/) |
| User Interviews | Research guides | [userinterviews.com](https://www.userinterviews.com/) |

**Community Resources**:
- [UX Research Collective](https://uxresearch.study/)
- [People Nerds (dscout)](https://dscout.com/people-nerds)
- [r/UXResearch](https://www.reddit.com/r/UXResearch/)

---

### AG-011: Marketing Operations Manager Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| MOps Manifesto | MarTech operations | [mopsmanifesto.com](https://www.mopsmanifesto.com/) |
| Scott Brinker - ChiefMartec | MarTech landscape | [chiefmartec.com](https://chiefmartec.com/) |
| Marketo Champion Resources | Marketing automation | [nation.marketo.com](https://nation.marketo.com/) |
| MarTech.org | Industry resources | [martech.org](https://martech.org/) |

**Community Resources**:
- [MO Pros Community](https://www.mopros.org/)
- [MarTech Conference](https://martech.org/conference/)
- [Revenue Marketing Alliance](https://www.revenuemarketing.com/)

---

### AG-012: Media Planning Expert Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| IAB Resources | Digital advertising standards | [iab.com](https://www.iab.com/) |
| Nielsen Media Research | Audience measurement | [nielsen.com](https://www.nielsen.com/) |
| WARC Media | Media planning insights | [warc.com](https://www.warc.com/) |
| MediaPost | Industry news | [mediapost.com](https://www.mediapost.com/) |

**Community Resources**:
- [4A's (American Association of Advertising Agencies)](https://www.aaaa.org/)
- [AdExchanger](https://www.adexchanger.com/)
- [Digiday](https://digiday.com/)

---

### AG-013: A/B Testing Specialist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Ronny Kohavi - Trustworthy A/B Testing | Experimentation book | [exp-platform.com](https://exp-platform.com/) |
| Optimizely Academy | Testing certification | [academy.optimizely.com](https://www.optimizely.com/academy/) |
| CXL Institute | CRO courses | [cxl.com/institute](https://cxl.com/institute/) |
| VWO Knowledge Base | Testing guides | [vwo.com/knowledge](https://vwo.com/blog/) |

**Community Resources**:
- [CXL Community](https://cxl.com/)
- [r/CRO](https://www.reddit.com/r/CRO/)
- [Experimentation Hub](https://experimentationhub.com/)

---

### AG-014: Email Marketing Specialist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Litmus Resources | Email best practices | [litmus.com/resources](https://www.litmus.com/resources/) |
| Email on Acid Blog | Email testing | [emailonacid.com/blog](https://www.emailonacid.com/blog/) |
| Klaviyo Academy | Email automation | [klaviyo.com/academy](https://academy.klaviyo.com/) |
| Really Good Emails | Email inspiration | [reallygoodemails.com](https://reallygoodemails.com/) |

**Community Resources**:
- [Email Geeks Slack](https://email.geeks.chat/)
- [Litmus Community](https://litmus.com/community)
- [r/emailmarketing](https://www.reddit.com/r/emailmarketing/)

---

### AG-015: Social Media Strategist Agent

**Knowledge Resources**:
| Resource | Description | Link |
|----------|-------------|------|
| Sprout Social Insights | Social strategy | [sproutsocial.com/insights](https://sproutsocial.com/insights/) |
| Hootsuite Blog | Social best practices | [blog.hootsuite.com](https://blog.hootsuite.com/) |
| Social Media Examiner | Industry news | [socialmediaexaminer.com](https://www.socialmediaexaminer.com/) |
| Buffer Resources | Social content | [buffer.com/resources](https://buffer.com/resources/) |

**Community Resources**:
- [Social Media Marketing World](https://www.socialmediaexaminer.com/smmworld/)
- [r/socialmedia](https://www.reddit.com/r/socialmedia/)
- [Social Fresh](https://socialfresh.com/)

---

## SDK and API Documentation

### Primary SDK Collections

| Platform | SDK Repository | Documentation |
|----------|---------------|---------------|
| Google APIs | [googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client) | [developers.google.com](https://developers.google.com/) |
| Meta Business | [facebook/facebook-python-business-sdk](https://github.com/facebook/facebook-python-business-sdk) | [developers.facebook.com](https://developers.facebook.com/) |
| HubSpot | [HubSpot/hubspot-api-python](https://github.com/HubSpot/hubspot-api-python) | [developers.hubspot.com](https://developers.hubspot.com/) |
| Salesforce | [simple-salesforce/simple-salesforce](https://github.com/simple-salesforce/simple-salesforce) | [developer.salesforce.com](https://developer.salesforce.com/) |
| Segment | [segmentio/analytics-python](https://github.com/segmentio/analytics-python) | [segment.com/docs](https://segment.com/docs/) |

### MCP Server Reference

| Server | Source | Install |
|--------|--------|---------|
| Official MCP Servers | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | See individual README |
| MCP Hub | [MCP Hub](https://mcp.run/) | Various |
| Claude MCP Docs | [Anthropic Docs](https://docs.anthropic.com/en/docs/mcp) | Official guide |

---

## Implementation Templates

### Skill Implementation Template

```javascript
// Template for marketing skill implementation
module.exports = {
  metadata: {
    id: 'sk-xxx',
    name: 'Skill Name',
    category: 'Marketing Category',
    version: '1.0.0'
  },

  capabilities: [
    'capability-1',
    'capability-2'
  ],

  dependencies: {
    apis: ['api-1', 'api-2'],
    mcpServers: ['mcp-server-1'],
    packages: ['package-1@version']
  },

  async initialize(config) {
    // Setup connections
  },

  async execute(action, params) {
    // Execute skill action
  }
};
```

### Agent Implementation Template

```javascript
// Template for marketing agent implementation
module.exports = {
  metadata: {
    id: 'ag-xxx',
    name: 'Agent Name',
    role: 'Professional Role',
    expertise: ['area-1', 'area-2']
  },

  persona: {
    background: 'Professional background',
    experience: 'X+ years',
    certifications: ['cert-1', 'cert-2']
  },

  skills: ['sk-001', 'sk-002'],

  async analyze(context) {
    // Domain-specific analysis
  },

  async recommend(situation) {
    // Expert recommendations
  }
};
```

---

## Summary

| Category | Resources Listed |
|----------|-----------------|
| MCP Servers | 15+ |
| Skills with References | 20 |
| Agents with References | 15 |
| GitHub Repositories | 100+ |
| API Documentation Links | 50+ |
| Community Resources | 60+ |
| Training & Certification | 20+ |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Begin implementation of priority skills and agents
