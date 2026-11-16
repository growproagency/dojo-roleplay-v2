import { Link } from 'react-router-dom';

export function TermsLink({ className = '' }) {
  return <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer"
    className={`underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${className}`}>
    Terms of Service<span className="sr-only"> (opens in a new tab)</span>
  </Link>;
}
