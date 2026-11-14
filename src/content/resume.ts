import type { StaticImageData } from 'next/image';
import badgeSaa from '@/assets/certs/aws-solutions-architect-associate.png';
import badgeAif from '@/assets/certs/aws-ai-practitioner.png';
import badgeClf from '@/assets/certs/aws-cloud-practitioner.png';
import googleLogo from '@/assets/certs/google-g-logo.svg';

// ---- experience (newest first). LiteLLM work intentionally excluded. ----
export type Role = { company: string; title: string; dates: string; location: string; spine: string; bullets: string[]; tech: string[] };

export const experience: Role[] = [
  {
    company: 'Synapxe',
    title: 'Cloud Application Engineer Intern',
    dates: 'Jun 2026 – Dec 2026',
    location: 'Singapore',
    spine: 'SYNAPXE',
    bullets: [
      'Implemented the React frontend and AWS Bedrock backend for a RAG-powered AI chatbot that helps NHG nurses triage workplace issues and raise tickets to support teams; ran requirement gathering and user testing with nurses.',
      "Built a serverless REST API (Azure Functions) for an AI observability dashboard aggregating token usage and user activity across 20+ GenAI apps serving 50k+ users, replacing the ops team's weekly manual log pulls.",
      'Audited Azure RBAC across 6 resource groups, revoking ~60 stale role assignments to enforce least-privilege access.',
    ],
    tech: ['React', 'AWS Bedrock', 'RAG', 'Azure Functions', 'Azure RBAC'],
  },
  {
    company: 'Monee',
    title: 'Business Intelligence Analyst Intern',
    dates: 'Mar 2026 – May 2026',
    location: 'Singapore',
    spine: 'MONEE',
    bullets: [
      'Built an LLM-powered Seatalk bot (prompt engineering) that assigns Jira tasks for 70+ staff, replacing a Google Sheets workflow and automating ~80% of task delegation.',
      'Built a Spark SQL pipeline automating A/B test analysis and dashboard generation, cutting turnaround from 1 day to under 1 hour.',
    ],
    tech: ['LLMs / prompt engineering', 'Seatalk bot API', 'Jira API', 'Spark SQL'],
  },
  {
    company: 'Quantos Capital',
    title: 'Software Engineer Intern',
    dates: 'Jun 2025 – Nov 2025',
    location: 'Singapore',
    spine: 'QUANTOS',
    bullets: [
      'Prototyped an automated trading system integrating live market data from Databento with order execution through Bloomberg, using asyncio for concurrent processing.',
      'Built an ETL pipeline ingesting 1-second OHLCV bars for S&P 500 E-mini futures into MySQL with deduplication and anomaly-detection checks; indexed tables to keep month-long backtest range scans under 800 ms.',
    ],
    tech: ['Python', 'asyncio', 'Databento', 'Bloomberg API', 'MySQL'],
  },
];

// ---- education ----
export const education = {
  degree: 'Bachelor of Computing in Computer Science',
  school: 'National University of Singapore (NUS)',
  dates: 'Aug 2024 – May 2028',
  notes: ['NUS Merit Scholarship', 'ConSheares chair, Sheares Hall'],
  coursework: [
    'Data Structures & Algorithms', 'Computer Networks', 'Operating Systems', 'AI & Machine Learning', 'Databases',
    'Software Engineering & Architecture',
  ],
};

// ---- cloud (floating cloud): by provider, then which service was used where ----
export type CloudProvider = { provider: string; prefix?: string; services: { name: string; where: string }[] };

export const cloud: CloudProvider[] = [
  {
    provider: 'AWS',
    prefix: 'AWS',
    services: [
      { name: 'Bedrock', where: 'Synapxe: RAG chatbot for NHG nurses' },
      { name: 'ECS Fargate', where: 'Tapau: runs the microservices in private subnets' },
      { name: 'ECR', where: 'Tapau: images deployed to ECS by digest' },
      { name: 'Application Load Balancer', where: 'Tapau: CloudFront → ALB → ECS' },
      { name: 'CloudFront', where: 'Tapau: entry point in front of the app' },
      { name: 'RDS (Postgres)', where: 'Tapau: database-per-service' },
      { name: 'EFS', where: 'Tapau' },
      { name: 'SSM Parameter Store', where: 'Tapau: secrets & config' },
      { name: 'CloudWatch', where: 'Tapau: logs & dashboards' },
      { name: 'S3', where: 'Sheares Web' },
      { name: 'Route 53', where: 'Sheares Web: domain & DNS' },
    ],
  },
  {
    provider: 'Azure',
    prefix: 'Azure',
    services: [
      { name: 'Functions', where: 'Synapxe: serverless API for the AI observability dashboard' },
      { name: 'RBAC / IAM', where: 'Synapxe: least-privilege audit across 6 resource groups' },
    ],
  },
  {
    provider: 'Supabase',
    services: [
      { name: 'Postgres', where: 'Sheares Web, AI Date Planner' },
      { name: 'Auth', where: 'Sheares Web' },
    ],
  },
  {
    provider: 'Vercel',
    services: [{ name: 'Hosting & serverless functions', where: 'This site' }],
  },
  {
    provider: 'IaC & containers',
    services: [
      { name: 'Terraform', where: 'Tapau: all AWS infrastructure as code' },
      { name: 'Docker', where: 'Tapau: containerised services' },
      { name: 'GitHub Actions (OIDC deploys)', where: 'Tapau: CI/CD with keyless AWS auth' },
      { name: 'RabbitMQ', where: 'Tapau: async messaging between services' },
    ],
  },
];

// every cloud service, for the skills list (tooling like Docker/Terraform already sits under DevOps)
const cloudSkills = cloud
  .filter((p) => p.provider !== 'IaC & containers')
  .flatMap((p) => (p.prefix ? p.services.map((s) => `${p.prefix} ${s.name}`) : [p.provider]));

// ---- skills (keyboard keycaps) ----
export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['TypeScript', 'Python', 'Java', 'SQL', 'JavaScript', 'HTML', 'CSS'] },
  { group: 'Frontend', items: ['React', 'Next.js', 'UI/UX'] },
  { group: 'Backend', items: ['Node.js / Express', 'REST APIs', 'RabbitMQ', 'asyncio', 'Keycloak (OIDC/JWT)', 'nginx'] },
  { group: 'Databases / data', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Spark SQL', 'Liquibase'] },
  { group: 'Cloud', items: cloudSkills },
  { group: 'DevOps / tools', items: ['Docker', 'GitHub Actions', 'Terraform', 'Git', 'Linux', 'Vitest', 'Trivy'] },
  { group: 'AI / LLM', items: ['RAG', 'AWS Bedrock', 'LangGraph', 'Prompt engineering', 'Claude', 'GitHub Copilot'] },
  { group: 'Practices', items: ['Microservices', 'Event-driven design', 'OOP', 'Agile', 'Scrum'] },
];

// ---- certifications (binders) ----
export type Cert = { name: string; issuer: string; date: string; expires?: string; href: string; badge: StaticImageData; code: string };

export const certs: Cert[] = [
  { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: 'Jul 2026', expires: 'Jul 2029', href: 'https://www.credly.com/badges/1c6bd499-50f1-4502-a9a9-e3b95be0b9ba', badge: badgeSaa, code: 'SAA' },
  { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services', date: 'Jul 2026', expires: 'Jul 2029', href: 'https://www.credly.com/badges/ecbc1fbb-5369-4ab9-af6d-16a427b27801', badge: badgeAif, code: 'AIF' },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: 'May 2026', expires: 'Jul 2029', href: 'https://www.credly.com/badges/46ce1bfb-e8ce-4e1b-9177-6e6bfa7e8b52', badge: badgeClf, code: 'CLF' },
  { name: 'Google Cybersecurity Certificate', issuer: 'Google (Coursera)', date: 'Apr 2026', href: 'https://www.coursera.org/account/accomplishments/specialization/HE9WZOKS278T', badge: googleLogo, code: 'CYBER' },
  { name: 'Google AI Certificate', issuer: 'Google (Coursera)', date: 'Apr 2026', href: 'https://www.coursera.org/account/accomplishments/specialization/UDS7ZEFVTEL2', badge: googleLogo, code: 'G-AI' },
];
