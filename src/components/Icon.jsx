export default function Icon({ name }) {
  const paths = {
    download: 'M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
    plus: 'M12 5v14M5 12h14',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 3',
    trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    up: 'm6 15 6-6 6 6',
    down: 'm6 9 6 6 6-6',
    close: 'M6 6l12 12M18 6 6 18',
    open: 'M14 4h6v6m0-6-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4',
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
