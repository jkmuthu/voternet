export interface DevRoadmap {
  title: string;
  version: string;
  updatedAt: string;
  vision: string;
  architecture: string[];
  summary: {
    completion: string;
    plannedFeatures: number;
    phases: number;
    timelineMonths: string;
    estimatedBudgetINR: string;
  };
  phases: Array<{
    id: number;
    name: string;
    timeline: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    goal: string;
    deliverables: string[];
  }>;
  milestones: Array<{
    name: string;
    target: string;
    successMetric: string;
  }>;
}

export function getDevelopmentRoadmap(): DevRoadmap {
  return {
    title: 'VoterNet Development Roadmap & Milestones',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    vision:
      'Build a LinkedIn-for-Politics platform serving public users, registered voters, political parties/candidates, and super admins through one integrated civic ecosystem.',
    architecture: [
      'Public/Guest Layer: discovery pages, onboarding, feature education',
      'Voter Layer: verified profile, constituency mapping, feed, polls, participation',
      'Party/Candidate Layer: CRM, campaign planning, team workflows, analytics',
      'Super Admin Layer: verification, moderation, compliance, system governance'
    ],
    summary: {
      completion: '69% foundation complete',
      plannedFeatures: 100,
      phases: 6,
      timelineMonths: '12-18 months',
      estimatedBudgetINR: '₹22-28 Lakhs'
    },
    phases: [
      {
        id: 1,
        name: 'Professional UI/UX Redesign',
        timeline: 'Weeks 1-4',
        priority: 'Critical',
        goal: 'Deliver production-grade landing, voter, party, and super-admin interfaces.',
        deliverables: [
          'Modern landing page with complete product narrative',
          'Voter dashboard UI foundations',
          'Party/Candidate dashboard shell',
          'Super-admin navigation upgrade',
          'Mobile-first responsiveness and accessibility pass'
        ]
      },
      {
        id: 2,
        name: 'Core Voter & Community Features',
        timeline: 'Months 2-3',
        priority: 'High',
        goal: 'Activate verified civic participation and local community engagement.',
        deliverables: [
          'Voter verification workflow',
          'State/District/Constituency/Ward assignment',
          'Community groups by geography',
          'Civic feed frontend over existing backend APIs',
          'Notification center and email integration'
        ]
      },
      {
        id: 3,
        name: 'Party Management CRM Core',
        timeline: 'Months 4-6',
        priority: 'High',
        goal: 'Enable party and candidate teams to run structured field operations.',
        deliverables: [
          'Party and candidate page management',
          'Team roles and permission controls',
          'Digital voter database import/search/export',
          'Demographic and household mapping',
          'Subscription plans and payments'
        ]
      },
      {
        id: 4,
        name: 'Campaign Operations & Mapping',
        timeline: 'Months 7-9',
        priority: 'Medium',
        goal: 'Add execution tooling for booth-level planning and campaign workflows.',
        deliverables: [
          'Geographic mapping with booth overlays',
          'Cadre allocation and tracking',
          'Campaign scheduling and event tracking',
          'Beneficiary and issue-register modules',
          'Field reporting with media attachments'
        ]
      },
      {
        id: 5,
        name: 'Poll-Day & Mobile Experience',
        timeline: 'Months 10-12',
        priority: 'Medium',
        goal: 'Operationalize election-day monitoring and mobile execution.',
        deliverables: [
          'Poll-day control dashboard',
          'Turnout tracking and mobilization lists',
          'Android/iOS apps for cadre and voter personas',
          'Incident logging and escalation workflows',
          'Offline-first support for field teams'
        ]
      },
      {
        id: 6,
        name: 'AI, Intelligence & Premium Expansion',
        timeline: 'Months 13-18',
        priority: 'Low',
        goal: 'Introduce predictive intelligence and enterprise-scale product options.',
        deliverables: [
          'Sentiment and engagement intelligence',
          'Predictive voter-turnout and trend analysis',
          'AI-assisted response and campaign insights',
          'White-label deployment options',
          'Public API and partner integrations'
        ]
      }
    ],
    milestones: [
      {
        name: 'Month 1 - Admin Reference Baseline',
        target: 'Admin-only development document live',
        successMetric: 'Super admins can access roadmap at /admin/devdoc'
      },
      {
        name: 'Month 3 - Revenue Readiness',
        target: 'Party CRM MVP and subscription foundation',
        successMetric: 'First paying pilot party onboarded'
      },
      {
        name: 'Month 6 - Product-Market Validation',
        target: 'Operational CRM + community modules',
        successMetric: 'Sustained active usage across voter and party segments'
      },
      {
        name: 'Month 12 - Scale Readiness',
        target: 'Mobile-first execution and poll-day operations',
        successMetric: 'Multi-constituency operational rollout'
      }
    ]
  };
}
