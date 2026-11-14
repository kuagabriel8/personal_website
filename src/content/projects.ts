import type { StaticImageData } from 'next/image';
import tapau1 from '@/assets/tapau/screenshot-1.png';
import tapau2 from '@/assets/tapau/screenshot-2.png';
import phs1 from '@/assets/phs/screenshot-1.png';

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
        text: 'Path-filtered CI (typecheck, tests, Docker build, Trivy CVE scan, terraform validate) behind one required check. CD builds immutable SHA-tagged images, deploys to ECS by digest, rolls back automatically with a circuit breaker, and runs smoke tests. Keyless AWS auth via OIDC.',
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
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
