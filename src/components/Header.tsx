
import type { FC } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import { APP_NAME } from '@/config/constants';
import { Button } from '@/components/ui/button';
import { PhoneCall, Users } from 'lucide-react';

interface HeaderProps {
  onEmergencyClick: () => void;
}

const Header: FC<HeaderProps> = ({ onEmergencyClick }) => {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <AppLogo appName={APP_NAME} />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/doctors">
              <Users className="mr-2 h-4 w-4" /> View Doctors
            </Link>
          </Button>
          <Button variant="destructive" onClick={onEmergencyClick}>
            <PhoneCall className="mr-2 h-4 w-4" /> Emergency
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
