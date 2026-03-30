/**
 * @process specializations/domains/business/entrepreneurship/business-plan-document
 * @description Business Plan Document Creation Process - Process to create comprehensive business plan documents for formal contexts (grants, competitions, traditional investors).
 * @inputs { companyName: string, businessDescription: string, targetMarket: string, financialProjections?: object, team?: array, fundingRequest?: string }
 * @outputs { success: boolean, businessPlan: object, executiveSummary: string, financialAppendix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/business-plan-document', {
 *   companyName: 'NewVenture Inc',
 *   businessDescription: 'B2B marketplace for industrial equipment',
 *   targetMarket: 'Manufacturing companies',
 *   fundingRequest: '$500,000 grant'
 * });
 *
 * @references
 * - SBA Business Plan Templates: https://www.sba.gov/
 * - Disciplined Entrepreneurship: https://www.amazon.com/Disciplined-Entrepreneurship-Bill-Aulet/dp/1118692284
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, businessDescription, targetMarket, financialProjections = {}, team = [], fundingRequest = '' } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Business Plan Document for ${companyName}`);

  // Phase 1: Executive Summary
  const executiveSummary = await ctx.task(executiveSummaryTask, { companyName, businessDescription, targetMarket, fundingRequest });
  artifacts.push(...(executiveSummary.artifacts || []));

  // Phase 2: Company Description
  const companyDescription = await ctx.task(companyDescriptionTask, { companyName, businessDescription });
  artifacts.push(...(companyDescription.artifacts || []));

  // Phase 3: Market Analysis
  const marketAnalysis = await ctx.task(marketAnalysisTask, { companyName, targetMarket });
  artifacts.push(...(marketAnalysis.artifacts || []));

  // Phase 4: Organization and Management
  const orgManagement = await ctx.task(orgManagementTask, { companyName, team });
  artifacts.push(...(orgManagement.artifacts || []));

  // Phase 5: Products/Services
  const productsServices = await ctx.task(productsServicesTask, { companyName, businessDescription });
  artifacts.push(...(productsServices.artifacts || []));

  // Phase 6: Marketing and Sales
  const marketingSales = await ctx.task(marketingSalesTask, { companyName, targetMarket });
  artifacts.push(...(marketingSales.artifacts || []));

  // Phase 7: Financial Projections
  const financialSection = await ctx.task(financialSectionTask, { companyName, financialProjections, fundingRequest });
  artifacts.push(...(financialSection.artifacts || []));

  // Phase 8: Funding Request
  const fundingSection = await ctx.task(fundingSectionTask, { companyName, fundingRequest, financialProjections });
  artifacts.push(...(fundingSection.artifacts || []));

  // Phase 9: Appendix
  const appendix = await ctx.task(appendixTask, { companyName, team, financialProjections });
  artifacts.push(...(appendix.artifacts || []));

  // Phase 10: Document Assembly
  const documentAssembly = await ctx.task(documentAssemblyTask, {
    companyName, executiveSummary, companyDescription, marketAnalysis, orgManagement, productsServices, marketingSales, financialSection, fundingSection, appendix
  });
  artifacts.push(...(documentAssembly.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    businessPlan: documentAssembly.document,
    executiveSummary: executiveSummary.summary,
    financialAppendix: appendix.financials,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/business-plan-document', timestamp: startTime, version: '1.0.0' }
  };
}

export const executiveSummaryTask = defineTask('executive-summary', (args, taskCtx) => ({
  kind: 'agent', title: `Executive Summary - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Plan Writer', task: 'Write executive summary', context: args,
    instructions: ['1. Write compelling opening', '2. Describe the opportunity', '3. Summarize the solution', '4. Highlight market potential', '5. Present financial highlights', '6. Introduce team', '7. State funding request', '8. Define use of funds', '9. Project key milestones', '10. Close with call to action'],
    outputFormat: 'JSON with summary, highlights' },
    outputSchema: { type: 'object', required: ['summary', 'highlights'], properties: { summary: { type: 'string' }, highlights: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'executive-summary']
}));

export const companyDescriptionTask = defineTask('company-description', (args, taskCtx) => ({
  kind: 'agent', title: `Company Description - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Plan Writer', task: 'Write company description', context: args,
    instructions: ['1. Describe company history', '2. Define mission and vision', '3. Explain business model', '4. Describe legal structure', '5. List key milestones', '6. Define company values', '7. Describe location/facilities', '8. Explain competitive advantages', '9. Define target customers', '10. State growth objectives'],
    outputFormat: 'JSON with description, mission, vision' },
    outputSchema: { type: 'object', required: ['description', 'mission'], properties: { description: { type: 'string' }, mission: { type: 'string' }, vision: { type: 'string' }, values: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'company-description']
}));

export const marketAnalysisTask = defineTask('market-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Market Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Market Research Expert', task: 'Write market analysis section', context: args,
    instructions: ['1. Define industry overview', '2. Present market size and growth', '3. Analyze target market', '4. Conduct competitor analysis', '5. Identify market trends', '6. Assess regulatory environment', '7. Define market entry barriers', '8. Analyze customer segments', '9. Present SWOT analysis', '10. Project market share'],
    outputFormat: 'JSON with analysis, marketSize, competitors' },
    outputSchema: { type: 'object', required: ['analysis', 'marketSize'], properties: { analysis: { type: 'string' }, marketSize: { type: 'object' }, competitors: { type: 'array', items: { type: 'object' } }, swot: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'market-analysis']
}));

export const orgManagementTask = defineTask('org-management', (args, taskCtx) => ({
  kind: 'agent', title: `Organization and Management - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Plan Writer', task: 'Write organization section', context: args,
    instructions: ['1. Present organizational structure', '2. Describe management team', '3. Include team bios', '4. Present board of directors', '5. List advisors', '6. Define roles and responsibilities', '7. Present org chart', '8. Identify key hires needed', '9. Describe compensation philosophy', '10. Present ownership structure'],
    outputFormat: 'JSON with structure, team, advisors' },
    outputSchema: { type: 'object', required: ['structure', 'team'], properties: { structure: { type: 'object' }, team: { type: 'array', items: { type: 'object' } }, advisors: { type: 'array', items: { type: 'object' } }, hiringPlan: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'organization']
}));

export const productsServicesTask = defineTask('products-services', (args, taskCtx) => ({
  kind: 'agent', title: `Products/Services - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Marketing Expert', task: 'Write products/services section', context: args,
    instructions: ['1. Describe products/services', '2. Explain value proposition', '3. Present product lifecycle', '4. Describe development status', '5. Present intellectual property', '6. Explain production process', '7. Define quality control', '8. Present pricing strategy', '9. Describe future products', '10. Explain competitive differentiation'],
    outputFormat: 'JSON with products, valueProposition, roadmap' },
    outputSchema: { type: 'object', required: ['products', 'valueProposition'], properties: { products: { type: 'array', items: { type: 'object' } }, valueProposition: { type: 'string' }, roadmap: { type: 'array', items: { type: 'object' } }, ip: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'products']
}));

export const marketingSalesTask = defineTask('marketing-sales', (args, taskCtx) => ({
  kind: 'agent', title: `Marketing and Sales - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Marketing Strategy Expert', task: 'Write marketing and sales section', context: args,
    instructions: ['1. Define marketing strategy', '2. Present brand positioning', '3. Describe sales strategy', '4. Define distribution channels', '5. Present promotional plan', '6. Describe customer acquisition', '7. Present sales process', '8. Define partnerships', '9. Present marketing budget', '10. Define success metrics'],
    outputFormat: 'JSON with marketingStrategy, salesStrategy, channels' },
    outputSchema: { type: 'object', required: ['marketingStrategy', 'salesStrategy'], properties: { marketingStrategy: { type: 'string' }, salesStrategy: { type: 'string' }, channels: { type: 'array', items: { type: 'string' } }, budget: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'marketing-sales']
}));

export const financialSectionTask = defineTask('financial-section', (args, taskCtx) => ({
  kind: 'agent', title: `Financial Projections - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Financial Planning Expert', task: 'Write financial projections section', context: args,
    instructions: ['1. Present revenue projections', '2. Show expense projections', '3. Create income statement', '4. Create cash flow statement', '5. Create balance sheet', '6. Present break-even analysis', '7. Define key assumptions', '8. Show financial ratios', '9. Present scenario analysis', '10. Include supporting schedules'],
    outputFormat: 'JSON with projections, statements, assumptions' },
    outputSchema: { type: 'object', required: ['projections', 'assumptions'], properties: { projections: { type: 'object' }, incomeStatement: { type: 'object' }, cashFlow: { type: 'object' }, balanceSheet: { type: 'object' }, assumptions: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'financials']
}));

export const fundingSectionTask = defineTask('funding-section', (args, taskCtx) => ({
  kind: 'agent', title: `Funding Request - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Fundraising Expert', task: 'Write funding request section', context: args,
    instructions: ['1. State funding amount', '2. Explain funding type', '3. Detail use of funds', '4. Present milestones', '5. Explain terms offered', '6. Present exit strategy', '7. Show investor returns', '8. Detail collateral if applicable', '9. Present timeline', '10. Include investor benefits'],
    outputFormat: 'JSON with request, useOfFunds, terms' },
    outputSchema: { type: 'object', required: ['request', 'useOfFunds'], properties: { request: { type: 'string' }, useOfFunds: { type: 'array', items: { type: 'object' } }, terms: { type: 'object' }, milestones: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'funding']
}));

export const appendixTask = defineTask('appendix', (args, taskCtx) => ({
  kind: 'agent', title: `Appendix - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Plan Writer', task: 'Compile appendix materials', context: args,
    instructions: ['1. Include team resumes', '2. Add financial details', '3. Include market research', '4. Add product specifications', '5. Include customer testimonials', '6. Add letters of intent', '7. Include patents/IP docs', '8. Add legal documents', '9. Include press coverage', '10. Add supporting data'],
    outputFormat: 'JSON with appendixItems, financials' },
    outputSchema: { type: 'object', required: ['appendixItems'], properties: { appendixItems: { type: 'array', items: { type: 'object' } }, financials: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'appendix']
}));

export const documentAssemblyTask = defineTask('document-assembly', (args, taskCtx) => ({
  kind: 'agent', title: `Document Assembly - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Business Plan Editor', task: 'Assemble complete business plan', context: args,
    instructions: ['1. Create cover page', '2. Add table of contents', '3. Assemble all sections', '4. Ensure consistent formatting', '5. Add page numbers', '6. Include confidentiality notice', '7. Review for completeness', '8. Add visual elements', '9. Create PDF version', '10. Prepare presentation version'],
    outputFormat: 'JSON with document, tableOfContents, pageCount' },
    outputSchema: { type: 'object', required: ['document'], properties: { document: { type: 'object' }, tableOfContents: { type: 'array', items: { type: 'string' } }, pageCount: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'business-plan', 'assembly']
}));
