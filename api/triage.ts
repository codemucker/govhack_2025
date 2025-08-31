import { api } from "encore.dev/api";

// Request and response interfaces for the AI triage service
interface TriageRequest {
  query: string;
  address?: string;
  context?: {
    location?: string;
    userPreferences?: {
      jurisdiction?: string;
      urgency?: 'low' | 'medium' | 'high';
      detailLevel?: 'basic' | 'detailed' | 'comprehensive';
    };
  };
}

interface LocationInfo {
  address: string;
  council?: string;
  state?: string;
  country?: string;
}

interface JurisdictionInfo {
  name: string;
  level: 'local' | 'state' | 'federal' | 'international';
  confidence: number;
  authority?: string;
}

interface RequirementAction {
  step: number;
  desc: string;
  link?: string;
  timeframe?: string;
  cost?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface Requirement {
  title: string;
  authority: string;
  actions: RequirementAction[];
  notes: string[];
  estimatedCost?: string;
  estimatedTimeframe?: string;
  mandatory: boolean;
}

interface ContactInfo {
  authority: string;
  type: string;
  phone?: string;
  email?: string;
  url: string;
  operatingHours?: string;
}

interface TriageQuery {
  raw: string;
  location?: LocationInfo;
  assumptions: string[];
  processedKeywords: string[];
}

interface TriageResponse {
  success: boolean;
  query: TriageQuery;
  jurisdictions: JurisdictionInfo[];
  requirements: Requirement[];
  contacts: ContactInfo[];
  confidence: number;
  disclaimer: string;
  estimatedComplexity: 'low' | 'medium' | 'high' | 'very-high';
  totalEstimatedCost?: string;
  totalEstimatedTimeframe?: string;
  nextSteps: string[];
  warningsAndRisks: string[];
}

interface QueryValidationRequest {
  query: string;
  address?: string;
}

interface ValidationResponse {
  valid: boolean;
  errors: string[];
  suggestions: string[];
}

// Validation endpoint for query inputs
export const validateQuery = api(
  { method: "POST", path: "/api/v1/triage/validate" },
  async (req: QueryValidationRequest): Promise<ValidationResponse> => {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate query
    if (!req.query || req.query.trim().length === 0) {
      errors.push("Query is required and cannot be empty");
    } else if (req.query.length < 10) {
      errors.push("Query is too short. Please provide more details about your legal question");
      suggestions.push("Try describing your situation in more detail, including what you want to do and where");
    } else if (req.query.length > 1000) {
      errors.push("Query is too long. Please keep it under 1000 characters");
      suggestions.push("Focus on the main legal question and key details");
    }

    // Validate address if provided
    if (req.address) {
      if (req.address.length < 3) {
        errors.push("Address is too short. Please provide a valid Australian location");
        suggestions.push("Include city and state (e.g., 'Sydney, NSW' or 'Melbourne, VIC')");
      }
      
      // Check for Australian context
      const australianIndicators = ['australia', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'nt', 'act', 
                                   'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'darwin', 'canberra'];
      const hasAustralianContext = australianIndicators.some(indicator => 
        req.address!.toLowerCase().includes(indicator) || req.query.toLowerCase().includes(indicator)
      );
      
      if (!hasAustralianContext) {
        suggestions.push("LegalEase specializes in Australian law. Please specify an Australian location");
      }
    } else {
      suggestions.push("Providing a location helps us give more accurate jurisdiction-specific advice");
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions
    };
  }
);

// Main AI triage service endpoint
export const triage = api(
  { method: "POST", path: "/api/v1/triage" },
  async (req: TriageRequest): Promise<TriageResponse> => {
    // Validate input first  
    const validationRequest: QueryValidationRequest = { query: req.query, address: req.address };
    const validation = await validateQuery(validationRequest);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Process the query using our intelligent triage system
      const triageResult = await processLegalTriage(req);
      return triageResult;
    } catch (error) {
      console.error('Triage processing error:', error);
      throw new Error(`Triage service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

interface DemoTriageRequest {
  query: string;
  address?: string;
}

// Demo/public endpoint with simplified interface for frontend testing
export const triageDemo = api(
  { method: "POST", path: "/api/v1/triage/demo-public" },
  async (req: DemoTriageRequest): Promise<TriageResponse> => {
    // Convert simplified request to full triage request
    const fullRequest: TriageRequest = {
      query: req.query,
      address: req.address,
      context: {
        location: req.address,
        userPreferences: {
          detailLevel: 'detailed'
        }
      }
    };

    return await triage(fullRequest);
  }
);

// Health check for triage service
export const triageHealth = api(
  { method: "GET", path: "/api/v1/triage/health" },
  async (): Promise<{ status: string; timestamp: string; version: string }> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
  }
);

// Main triage processing logic
async function processLegalTriage(req: TriageRequest): Promise<TriageResponse> {
  const startTime = Date.now();
  
  // Extract and process location information
  const locationInfo = await extractLocationInfo(req.query, req.address);
  
  // Identify relevant jurisdictions
  const jurisdictions = await identifyJurisdictions(req.query, locationInfo);
  
  // Generate legal requirements based on query and jurisdictions
  const requirements = await generateRequirements(req.query, jurisdictions, locationInfo);
  
  // Find relevant contact information
  const contacts = await findRelevantContacts(jurisdictions, requirements);
  
  // Calculate overall confidence and complexity
  const confidence = calculateConfidence(jurisdictions, requirements);
  const complexity = assessComplexity(requirements);
  
  // Generate next steps and warnings
  const nextSteps = generateNextSteps(requirements);
  const warningsAndRisks = generateWarningsAndRisks(requirements, complexity);
  
  // Extract assumptions made during processing
  const assumptions = generateAssumptions(req.query, locationInfo, requirements);
  
  const processingTime = Date.now() - startTime;
  console.log(`Triage completed in ${processingTime}ms`);

  return {
    success: true,
    query: {
      raw: req.query,
      location: locationInfo,
      assumptions,
      processedKeywords: extractKeywords(req.query)
    },
    jurisdictions,
    requirements,
    contacts,
    confidence,
    disclaimer: generateDisclaimer(),
    estimatedComplexity: complexity,
    totalEstimatedCost: calculateTotalCost(requirements),
    totalEstimatedTimeframe: calculateTotalTimeframe(requirements),
    nextSteps,
    warningsAndRisks
  };
}

// Helper functions for triage processing

async function extractLocationInfo(query: string, address?: string): Promise<LocationInfo | undefined> {
  const location = address || query;
  if (!location) return undefined;

  // Basic location extraction logic
  const locationLower = location.toLowerCase();
  
  // Australian state detection
  const stateMap: Record<string, string> = {
    'nsw': 'New South Wales',
    'vic': 'Victoria', 
    'qld': 'Queensland',
    'wa': 'Western Australia',
    'sa': 'South Australia',
    'tas': 'Tasmania',
    'nt': 'Northern Territory',
    'act': 'Australian Capital Territory'
  };
  
  let detectedState: string | undefined;
  for (const [abbrev, fullName] of Object.entries(stateMap)) {
    if (locationLower.includes(abbrev) || locationLower.includes(fullName.toLowerCase())) {
      detectedState = fullName;
      break;
    }
  }

  // Council/city detection (simplified)
  const cityCouncilMap: Record<string, string> = {
    'sydney': 'Sydney City Council',
    'melbourne': 'Melbourne City Council',
    'brisbane': 'Brisbane City Council',
    'perth': 'Perth City Council',
    'adelaide': 'Adelaide City Council',
    'darwin': 'Darwin City Council',
    'canberra': 'Australian Capital Territory'
  };

  let detectedCouncil: string | undefined;
  for (const [city, council] of Object.entries(cityCouncilMap)) {
    if (locationLower.includes(city)) {
      detectedCouncil = council;
      break;
    }
  }

  return {
    address: address || 'Australia',
    state: detectedState,
    council: detectedCouncil,
    country: 'Australia'
  };
}

async function identifyJurisdictions(query: string, location?: LocationInfo): Promise<JurisdictionInfo[]> {
  const jurisdictions: JurisdictionInfo[] = [];
  
  // Always include federal jurisdiction for Australian legal matters
  jurisdictions.push({
    name: 'Australian Government',
    level: 'federal',
    confidence: 0.85,
    authority: 'Commonwealth of Australia'
  });

  // Add state jurisdiction if location is identified
  if (location?.state) {
    jurisdictions.push({
      name: `${location.state} Government`,
      level: 'state',
      confidence: 0.90,
      authority: location.state
    });
  }

  // Add local jurisdiction if council is identified
  if (location?.council) {
    jurisdictions.push({
      name: location.council,
      level: 'local',
      confidence: 0.95,
      authority: location.council
    });
  }

  return jurisdictions.sort((a, b) => b.confidence - a.confidence);
}

async function generateRequirements(query: string, jurisdictions: JurisdictionInfo[], location?: LocationInfo, referenceDataService?: any): Promise<Requirement[]> {
  const requirements: Requirement[] = [];
  const queryLower = query.toLowerCase();

  // Business registration requirements
  if (queryLower.includes('business') || queryLower.includes('company') || queryLower.includes('cafe') || queryLower.includes('restaurant')) {
    requirements.push({
      title: 'Business Registration & ABN',
      authority: 'Australian Business Register',
      mandatory: true,
      estimatedCost: '$40-$500',
      estimatedTimeframe: '1-3 weeks',
      actions: [
        {
          step: 1,
          desc: 'Register business name with ASIC (if applicable)',
          link: 'https://asic.gov.au/for-business/registering-a-business-name',
          timeframe: '1-2 days',
          cost: '$40-$100',
          priority: 'high'
        },
        {
          step: 2,
          desc: 'Apply for Australian Business Number (ABN)',
          link: 'https://abr.business.gov.au',
          timeframe: '1-3 days',
          cost: 'Free',
          priority: 'high'
        }
      ],
      notes: ['Required before applying for other permits and licenses']
    });
  }

  // Food business requirements
  if (queryLower.includes('food') || queryLower.includes('cafe') || queryLower.includes('restaurant')) {
    const council = location?.council || 'Local Council';
    requirements.push({
      title: 'Food Business Licence',
      authority: council,
      mandatory: true,
      estimatedCost: '$200-$800',
      estimatedTimeframe: '2-6 weeks',
      actions: [
        {
          step: 1,
          desc: 'Submit food business notification',
          timeframe: '1 week',
          cost: '$200-$400',
          priority: 'high'
        },
        {
          step: 2,
          desc: 'Arrange pre-opening inspection',
          timeframe: '1-2 weeks',
          priority: 'high'
        },
        {
          step: 3,
          desc: 'Obtain food safety supervisor certification',
          timeframe: '1 day',
          cost: '$200-$400',
          priority: 'medium'
        }
      ],
      notes: ['Must be completed before serving food to public', 'Regular inspections required']
    });
  }

  // Building/development requirements
  if (queryLower.includes('build') || queryLower.includes('extend') || queryLower.includes('renovate') || queryLower.includes('shed')) {
    const council = location?.council || 'Local Council';
    requirements.push({
      title: 'Development Approval',
      authority: council,
      mandatory: true,
      estimatedCost: '$500-$5,000',
      estimatedTimeframe: '4-12 weeks',
      actions: [
        {
          step: 1,
          desc: 'Check planning requirements and zoning',
          timeframe: '1 week',
          priority: 'high'
        },
        {
          step: 2,
          desc: 'Submit development application if required',
          timeframe: '6-10 weeks',
          cost: '$500-$3,000',
          priority: 'high'
        },
        {
          step: 3,
          desc: 'Obtain building permit if required',
          timeframe: '2-4 weeks',
          cost: '$200-$2,000',
          priority: 'high'
        }
      ],
      notes: ['Requirements vary significantly by location and development type', 'Consult council before starting work']
    });
  }

  return requirements;
}

async function findRelevantContacts(jurisdictions: JurisdictionInfo[], requirements: Requirement[], referenceDataService?: any): Promise<ContactInfo[]> {
  let contacts: ContactInfo[] = [];
  
  if (referenceDataService) {
    try {
      // Use dynamic contact lookup from database
      const jurisdictionNames = jurisdictions.map(j => j.name);
      const dynamicContacts = await referenceDataService.findRelevantContacts(jurisdictionNames);
      contacts = dynamicContacts;
      
      if (contacts.length === 0) {
        console.warn('No dynamic contacts found, falling back to static contacts');
        contacts = getStaticContacts(jurisdictions);
      }
    } catch (error) {
      console.warn('Failed to get dynamic contacts, using static fallback:', error);
      contacts = getStaticContacts(jurisdictions);
    }
  } else {
    contacts = getStaticContacts(jurisdictions);
  }
  
  return contacts;
}

// Fallback static contact method
function getStaticContacts(jurisdictions: JurisdictionInfo[]): ContactInfo[] {
  const contacts: ContactInfo[] = [];
  
  // Add federal contacts
  contacts.push({
    authority: 'Australian Business Register',
    type: 'Business Registration Support',
    phone: '13 72 26',
    url: 'https://abr.business.gov.au',
    operatingHours: 'Monday to Friday, 8:00am to 6:00pm AEST'
  });

  // Add state-specific contacts based on identified jurisdictions
  for (const jurisdiction of jurisdictions) {
    if (jurisdiction.level === 'state') {
      if (jurisdiction.name.includes('Queensland')) {
        contacts.push({
          authority: 'Business Queensland',
          type: 'State Government Support',
          phone: '13 QGOV (13 74 68)',
          url: 'https://www.business.qld.gov.au',
          operatingHours: 'Monday to Friday, 8:30am to 4:30pm AEST'
        });
      } else if (jurisdiction.name.includes('New South Wales')) {
        contacts.push({
          authority: 'Service NSW Business',
          type: 'State Government Support', 
          phone: '13 77 88',
          url: 'https://www.service.nsw.gov.au',
          operatingHours: 'Monday to Friday, 7:00am to 7:00pm AEST'
        });
      }
      // Add other states as needed...
    }
  }

  return contacts;
}

function calculateConfidence(jurisdictions: JurisdictionInfo[], requirements: Requirement[]): number {
  if (jurisdictions.length === 0 || requirements.length === 0) return 0.3;
  
  const avgJurisdictionConfidence = jurisdictions.reduce((sum, j) => sum + j.confidence, 0) / jurisdictions.length;
  const requirementScore = Math.min(1.0, requirements.length / 5); // Up to 5 requirements for full score
  
  return Math.round((avgJurisdictionConfidence * 0.6 + requirementScore * 0.4) * 100) / 100;
}

function assessComplexity(requirements: Requirement[]): 'low' | 'medium' | 'high' | 'very-high' {
  const totalSteps = requirements.reduce((sum, req) => sum + req.actions.length, 0);
  const mandatoryCount = requirements.filter(req => req.mandatory).length;
  
  if (totalSteps <= 3 && mandatoryCount <= 1) return 'low';
  if (totalSteps <= 6 && mandatoryCount <= 2) return 'medium';
  if (totalSteps <= 12 && mandatoryCount <= 4) return 'high';
  return 'very-high';
}

function generateNextSteps(requirements: Requirement[]): string[] {
  const nextSteps: string[] = [];
  
  // Sort requirements by priority (mandatory first)
  const sortedRequirements = requirements.sort((a, b) => {
    if (a.mandatory && !b.mandatory) return -1;
    if (!a.mandatory && b.mandatory) return 1;
    return 0;
  });
  
  // Take first few steps from highest priority requirements
  for (const requirement of sortedRequirements.slice(0, 3)) {
    const firstAction = requirement.actions[0];
    if (firstAction) {
      nextSteps.push(`${firstAction.desc} (${requirement.authority})`);
    }
  }
  
  if (nextSteps.length === 0) {
    nextSteps.push('Consult with relevant authorities to confirm requirements');
  }
  
  return nextSteps;
}

function generateWarningsAndRisks(requirements: Requirement[], complexity: string): string[] {
  const warnings: string[] = [];
  
  if (complexity === 'high' || complexity === 'very-high') {
    warnings.push('This is a complex legal matter that may require professional assistance');
  }
  
  const mandatoryRequirements = requirements.filter(req => req.mandatory);
  if (mandatoryRequirements.length > 2) {
    warnings.push('Multiple mandatory approvals required - ensure proper sequencing');
  }
  
  warnings.push('Requirements may vary by location and circumstances');
  warnings.push('Always verify current requirements with relevant authorities before proceeding');
  
  return warnings;
}

function generateAssumptions(query: string, location?: LocationInfo, requirements?: Requirement[]): string[] {
  const assumptions: string[] = [];
  
  if (!location) {
    assumptions.push('Location assumed to be general Australia (specify location for more accurate advice)');
  }
  
  if (query.toLowerCase().includes('business') || query.toLowerCase().includes('cafe')) {
    assumptions.push('Assumed to be a new business (not transferring existing registration)');
  }
  
  if (query.toLowerCase().includes('build') || query.toLowerCase().includes('extend')) {
    assumptions.push('Assumed to be significant structural work requiring permits');
  }
  
  assumptions.push('Current regulations and fees assumed (subject to change)');
  
  return assumptions;
}

function extractKeywords(query: string): string[] {
  // Simple keyword extraction
  const stopWords = ['i', 'want', 'to', 'do', 'need', 'how', 'what', 'where', 'when', 'the', 'a', 'an', 'and', 'or', 'but'];
  return query.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
}

function calculateTotalCost(requirements: Requirement[]): string {
  // Simple cost calculation (would be more sophisticated in production)
  const costs = requirements
    .map(req => req.estimatedCost)
    .filter(cost => cost && cost !== 'Free')
    .map(cost => cost!.match(/\$(\d+)/)?.[1])
    .filter(cost => cost)
    .map(cost => parseInt(cost!));
  
  if (costs.length === 0) return 'Varies';
  
  const minTotal = Math.min(...costs);
  const maxTotal = costs.reduce((sum, cost) => sum + cost, 0);
  
  return `$${minTotal} - $${maxTotal}`;
}

function calculateTotalTimeframe(requirements: Requirement[]): string {
  // Simplified timeframe calculation
  const hasWeeks = requirements.some(req => req.estimatedTimeframe?.includes('week'));
  const hasMonths = requirements.some(req => req.estimatedTimeframe?.includes('month'));
  
  if (hasMonths) return '2-6 months';
  if (hasWeeks) return '2-12 weeks';
  return '1-4 weeks';
}

function generateDisclaimer(): string {
  return "⚠️ IMPORTANT: This information is general in nature and should not be considered legal advice. Australian laws can be complex and may vary by jurisdiction. For specific legal matters, please consult with a qualified legal professional or contact the relevant government department.";
}