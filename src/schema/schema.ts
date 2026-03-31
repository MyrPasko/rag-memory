import { z } from 'zod';
import { ARTIFACT_KINDS } from './kinds.js';

export const ARTIFACT_STATUS_VALUES = [
  'draft',
  'validated',
  'canonical',
  'deprecated',
] as const;

export const ARTIFACT_SCOPE_VALUES = [
  'global',
  'repo',
  'ticket',
  'experiment',
] as const;

export const INCIDENT_SEVERITY_VALUES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const ArtifactKindSchema = z.enum(ARTIFACT_KINDS);
export const ArtifactStatusSchema = z.enum(ARTIFACT_STATUS_VALUES);
export const ArtifactScopeSchema = z.enum(ARTIFACT_SCOPE_VALUES);
export const IncidentSeveritySchema = z.enum(INCIDENT_SEVERITY_VALUES);

export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;
export type ArtifactScope = z.infer<typeof ArtifactScopeSchema>;
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

const BaseArtifactSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: ArtifactStatusSchema,
  scope: ArtifactScopeSchema,
  tags: z.array(z.string()).default([]),
  summary: z.string().min(1),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  sources: z.array(z.string()).default([]),
  supersedes: z.array(z.string()).default([]),
  body: z.string(),
  repo: z.string().optional(),
});

const PatternSchema = BaseArtifactSchema.extend({ type: z.literal('pattern') });
const ConventionSchema = BaseArtifactSchema.extend({ type: z.literal('convention') });
const DecisionSchema = BaseArtifactSchema.extend({ type: z.literal('decision') });
const SessionSchema = BaseArtifactSchema.extend({
  type: z.literal('session'),
  session_id: z.string().min(1),
});
const IncidentSchema = BaseArtifactSchema.extend({
  type: z.literal('incident'),
  severity: IncidentSeveritySchema,
});
const SnippetSchema = BaseArtifactSchema.extend({
  type: z.literal('snippet'),
  language: z.string().min(1),
});

export const ArtifactSchema = z
  .discriminatedUnion('type', [
    PatternSchema,
    ConventionSchema,
    DecisionSchema,
    SessionSchema,
    IncidentSchema,
    SnippetSchema,
  ])
  .superRefine((val, ctx) => {
    if (val.scope === 'repo' && !val.repo) {
      ctx.addIssue({
        code: 'custom',
        message: 'repo is required when scope is "repo"',
      });
    }
  });

export type Artifact = z.infer<typeof ArtifactSchema>;
export type PatternArtifact = z.infer<typeof PatternSchema>;
export type ConventionArtifact = z.infer<typeof ConventionSchema>;
export type DecisionArtifact = z.infer<typeof DecisionSchema>;
export type SessionArtifact = z.infer<typeof SessionSchema>;
export type IncidentArtifact = z.infer<typeof IncidentSchema>;
export type SnippetArtifact = z.infer<typeof SnippetSchema>;
