// components/NavBar.tsx
'use client';
import dynamic from 'next/dynamic';

const NavBarAuth = dynamic(() => import('./NavBarAuth'), {
  ssr: false,
  loading: () => <div className="nav-inner" />,
});

export default function NavBar() {
  return (
    <nav>
      <NavBarAuth />
    </nav>
  );
}
