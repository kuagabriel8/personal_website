import type { StaticImageData } from 'next/image';
import tapau1 from '@/assets/tapau/screenshot-1.png';
import tapau2 from '@/assets/tapau/screenshot-2.png';
import phs1 from '@/assets/phs/screenshot-1.png';
import datePlannerGraph from '@/assets/date-planner/agent-graph.png';

export type Project = {
  slug: string;
  name: string;
  oneLiner: string;
  problem: string;
  role: string;
  stack: string[];
  built: { label?: string; text: string }[];
  also?: string[];
  outcome?: string;
  links: { label: string; href: string; note?: string }[];
  screenshots: { src: StaticImageData; alt: string }[];
  tags: string; // short stack summary for lists
};

export const projects: Project[] = [
  {
    slug: 'tapau',
    name: 'Tapau (Friend on Campus)',
    oneLiner: 'Peer-to-peer campus errand app, running on a closed credit economy',
    problem:
      "Students need things picked up on campus while they're stuck elsewhere. Tapau lets peers fulfil errands for non-cashable credits.",
    role: 'Team of 4 (CS3219, NUS). Owned cloud architecture, infrastructure as code (Terraform), deployment and CI/CD, authentication, and the User Service.',
    stack: [
      'TypeScript', 'Node.js / Express 5', 'React', 'PostgreSQL', 'Keycloak (OAuth 2.0 / OIDC)', 'RabbitMQ', 'nginx', 'Docker',
      'AWS ECS Fargate', 'RDS', 'ALB', 'CloudFront', 'ECR', 'EFS', 'SSM', 'CloudWatch', 'Terraform', 'GitHub Actions', 'Trivy',
    ],
    built: [
      {
        label: 'System',
        text: 'Event-driven microservices (User, Order, Credit, Supplier) behind an nginx API gateway, database-per-service. Async messaging over RabbitMQ with retry and dead-letter queues, and correlation IDs for distributed tracing.',
      },
      {
        label: 'Infra as code',
        text: 'Terraform: CloudFront → ALB → ECS Fargate in private subnets, RDS Postgres, secrets in SSM, CloudWatch dashboards. Remote state, zero click-ops.',
      },
      {
        label: 'CI/CD',
        text: 'Path-filtered CI (typecheck, tests, Docker build, Trivy CVE scan, terraform validate) behind one required check, so only changed services ship on every merge. CD builds immutable SHA-tagged images and does zero-downtime rolling deploys to ECS by digest, with circuit-breaker auto-rollback, smoke tests and SNS alerting. Keyless AWS auth via OIDC.',
      },
      {
        label: 'Auth & User Service',
        text: 'Keycloak OIDC/JWT with RBAC, server-enforced sign-up rules, session-revocation checks on every service, compensating rollback on failed provisioning, and two-admin approval for role escalation.',
      },
    ],
    also: ['Choreography-based saga (order ↔ credit reservation)', 'Transactional outbox pattern', 'Idempotent event consumers'],
    links: [
      { label: 'Live demo', href: 'https://d3ttissyqdza7u.cloudfront.net', note: 'until ~10 Dec 2026' },
      { label: 'Repository', href: 'https://github.com/Y2627S1-CS3219-P19/FOC' },
    ],
    screenshots: [
      { src: tapau1, alt: 'Tapau web app screenshot' },
      { src: tapau2, alt: 'Tapau web app screenshot, second view' },
    ],
    tags: 'AWS · Terraform · RabbitMQ',
  },
  {
    slug: 'public-health-screening',
    name: 'Public Health Screening (with NUS Medicine)',
    oneLiner: 'Web app for registering patients and recording health screening results',
    problem:
      "NUS Medicine's public health screening needed one place for patient registration and screening records, so doctors weren't working from scattered paper and spreadsheets.",
    role: 'Team of 6, working with NUS Medicine students. Built Node.js backend routes and frontend improvements.',
    stack: ['React', 'Node.js / Express', 'MongoDB', 'JWT'],
    built: [
      { text: 'Node.js REST API routes for patient registration and screening records, with JWT auth and token-based session handling.' },
      { text: "Autosaving patient-intake form so data isn't lost mid-screening." },
      { text: 'Frontend improvements to the React app for the doctors and volunteers using it.' },
    ],
    outcome: 'Used to screen ~900 Singaporeans',
    links: [],
    screenshots: [{ src: phs1, alt: 'Public Health Screening web app screenshot' }],
    tags: 'React · Node · MongoDB',
  },
  {
    slug: 'ai-date-planner',
    name: 'AI Date Planner',
    oneLiner: "AI agent that plans dates in Singapore using live weather, Google Maps and web search, and remembers each user's preferences and date ideas",
    problem:
      'Planning a date means juggling the weather, venues and half-remembered ideas across different apps. The agent does it in one conversation, grounded in live Singapore data, and remembers what each person likes.',
    role: 'Built the backend: the agent, its tools, long-term memory, tests and evaluation.',
    stack: ['Python', 'LangGraph', 'LangChain', 'OpenAI GPT-4o', 'Trustcall', 'Postgres', 'Supabase', 'LangSmith', 'Docker', 'pytest'],
    built: [
      {
        label: 'Grounded agent',
        text: 'ReAct-style agent that grounds suggestions in live data instead of making them up: Singapore government (NEA) weather, haze and UV readings, Google Places for real venues, and Tavily web search. It picks the forecast that matches how far away the date is (2-hour, 24-hour or 4-day).',
      },
      {
        label: 'Long-term memory',
        text: 'Trustcall extracts a structured user profile (budget, interests, dietary restrictions, partner) and a date-idea list (idea → planned → booked → completed) from the conversation and saves both to Supabase Postgres, so the frontend can read them directly.',
      },
      {
        label: 'Durable sessions',
        text: 'Conversation state saved with LangGraph checkpointers in Postgres, so sessions survive restarts in production, plus a Docker Compose stack (Redis + Postgres) for testing in a prod-like setup.',
      },
      {
        label: 'Testing & evaluation',
        text: 'pytest suite for routing and every tool with mocked HTTP (respx). LangSmith tracing, with LLM-as-a-judge evaluation that scores tool selection and memory extraction separately from final-answer quality.',
      },
    ],
    links: [{ label: 'Repository', href: 'https://github.com/kuagabriel8/date-planner-backend' }],
    screenshots: [{ src: datePlannerGraph, alt: 'LangGraph diagram of the agent: the date_planner node routes to tools or to the update_date_ideas, update_instructions and update_profile memory nodes' }],
    tags: 'LangGraph · GPT-4o · Postgres',
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
