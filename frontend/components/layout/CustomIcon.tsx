import React from 'react';
import { IconType } from 'react-icons';

interface CustomIconProps {
  icon: IconType;
  size?: number;
  color?: string;
}

const CustomIcon: React.FC<CustomIconProps> = ({ icon: Icon, size = 24, color = 'black' }) => {
  return <Icon size={size} color={color} />;
};

export default CustomIcon;