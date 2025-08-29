import { api } from "encore.dev/api";

// Request and response types for the triage service
interface TriageRequest {
  query: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface TriageResponse {
  query: {
    raw: string;
    normalized: string;
    location?: {
      address: string;
      council: string;
      state: string;
      postcode: string;
    };
    assumptions: string[];
  };
  domains: string[];
  jurisdictions: Array<{
    level: string;
    name: string;
    confidence: number;
  }>;
  requirements: Array<{
    title: string;
    jurisdiction: string;
    authority: string;
    actions: Array<{
      step: number;
      desc: string;
      link?: string;
      form?: string;
    }>;
    notes: string[];
    confidence: number;
  }>;
  conflicts: Array<{
    description: string;
    severity: string;
    links: string[];
    disclaimer: string;
  }>;
  contacts: Array<{
    authority: string;
    type: string;
    phone?: string;
    url: string;
  }>;
  citations: Array<{
    id: string;
    title: string;
    url: string;
    last_checked: string;
  }>;
  disclaimer: string;
  version: string;
}

// Main triage endpoint  
export const triage = api(
  { method: "POST", path: "/api/v1/triage/:clientId" },
  async (req: TriageRequest & { clientId: string }): Promise<TriageResponse> => {
    // Mock response for now - will be replaced with actual AI processing
    const mockResponse: TriageResponse = {
      query: {
        raw: req.query,
        normalized: req.query.toLowerCase(),
        location: req.address ? {
          address: req.address,
          council: "Brisbane City Council",
          state: "QLD",
          postcode: "4000"
        } : undefined,
        assumptions: ["residential property", "standard construction"]
      },
      domains: ["planning", "building"],
      jurisdictions: [
        { level: "local", name: "Brisbane City Council", confidence: 0.95 },
        { level: "state", name: "Queensland", confidence: 0.9 },
        { level: "commonwealth", name: "Australia", confidence: 0.6 }
      ],
      requirements: [
        {
          title: "Development Application Review",
          jurisdiction: "local",
          authority: "Brisbane City Council",
          actions: [
            { 
              step: 1, 
              desc: "Check zoning requirements", 
              link: "https://www.brisbane.qld.gov.au/planning-and-building",
              form: "online"
            },
            { 
              step: 2, 
              desc: "Submit development application if required", 
              form: "PDF|online" 
            }
          ],
          notes: ["May require neighbour consultation"],
          confidence: 0.8
        }
      ],
      conflicts: [],
      contacts: [
        {
          authority: "Brisbane City Council",
          type: "planning",
          phone: "07 3403 8888",
          url: "https://www.brisbane.qld.gov.au/planning-and-building"
        }
      ],
      citations: [
        {
          id: "bcc_planning_2024",
          title: "Brisbane City Plan 2014",
          url: "https://www.brisbane.qld.gov.au/planning-and-building",
          last_checked: new Date().toISOString().split('T')[0]
        }
      ],
      disclaimer: "Information only; not legal advice. Always verify with the relevant authority.",
      version: "v1"
    };

    return mockResponse;
  }
);

interface CouncilSearchRequest {
  q: string;
}

// Council search endpoint
export const councilSearch = api(
  { method: "GET", path: "/api/v1/councils/search" },
  async ({ q }: CouncilSearchRequest) => {
    // Mock council data
    const councils = [
      { id: "brisbane", name: "Brisbane City Council", state: "QLD" },
      { id: "sydney", name: "City of Sydney", state: "NSW" },
      { id: "melbourne", name: "City of Melbourne", state: "VIC" },
      { id: "perth", name: "City of Perth", state: "WA" },
      { id: "adelaide", name: "City of Adelaide", state: "SA" }
    ];

    const filtered = councils.filter(council => 
      council.name.toLowerCase().includes(q.toLowerCase())
    );

    return { councils: filtered };
  }
);