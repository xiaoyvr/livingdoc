// Domain failures. A kind exists for each distinct domain error, carrying data
// rather than a display string; the CLI renders the message.
export type DomainError =
  | { kind: 'invalid-config'; file: string; issues: string[] }
  | { kind: 'unknown-backend'; name: string }
  | { kind: 'backend-file-missing'; path: string }
  | { kind: 'document-missing'; path: string }

export function formatError(error: DomainError): string {
  switch (error.kind) {
    case 'invalid-config':
      return `${error.file}: ${error.issues.join('; ')}`
    case 'unknown-backend':
      return `unknown backend: ${error.name}`
    case 'backend-file-missing':
      return `backend file not found: ${error.path}`
    case 'document-missing':
      return `document not found: ${error.path}`
  }
}
