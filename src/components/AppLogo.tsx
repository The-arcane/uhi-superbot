import { Stethoscope } from 'lucide-react';
import type { FC } from 'react';

interface AppLogoProps {
  appName: string;
  className?: string;
}

const AppLogo: FC<AppLogoProps> = ({ appName, className }) => {
  return (
    <div className={`flex items-center gap-2 text-primary ${className}`}>
      <Stethoscope className="h-8 w-8" />
      <span className="text-2xl font-bold">{appName}</span>
    </div>
  );
};

export default AppLogo;
