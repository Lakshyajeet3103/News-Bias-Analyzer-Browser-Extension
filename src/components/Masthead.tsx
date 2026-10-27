interface Props { publisher?: string | undefined; date?: string | undefined; }
export function Masthead({ publisher = 'Independent view', date }: Props) {
  const displayDate = date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
  return <header className="masthead"><div className="wordmark">Parallax</div><div className="edition">{publisher}<br />{displayDate}</div></header>;
}
