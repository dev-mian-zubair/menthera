import React from 'react';
import { SvgProps } from 'react-native-svg';

// Import all animal SVGs
import BearSvg from '@/assets/svgs/bear.svg';
import CatFaceSvg from '@/assets/svgs/cat-face.svg';
import DogFaceSvg from '@/assets/svgs/dog-face.svg';
import FoxSvg from '@/assets/svgs/fox.svg';
import FrogSvg from '@/assets/svgs/frog.svg';
import GorillaSvg from '@/assets/svgs/gorilla.svg';
import HamsterSvg from '@/assets/svgs/hamster.svg';
import LionSvg from '@/assets/svgs/lion.svg';
import MonkeyFaceSvg from '@/assets/svgs/monkey-face.svg';
import MouseFaceSvg from '@/assets/svgs/mouse-face.svg';
import PandaSvg from '@/assets/svgs/panda.svg';
import PigFaceSvg from '@/assets/svgs/pig-face.svg';
import RabbitFaceSvg from '@/assets/svgs/rabbit-face.svg';

// Avatar mapping
export const AVATAR_MAP: Record<string, React.FC<SvgProps>> = {
  bear: BearSvg,
  'cat-face': CatFaceSvg,
  'dog-face': DogFaceSvg,
  fox: FoxSvg,
  frog: FrogSvg,
  gorilla: GorillaSvg,
  hamster: HamsterSvg,
  lion: LionSvg,
  'monkey-face': MonkeyFaceSvg,
  'mouse-face': MouseFaceSvg,
  panda: PandaSvg,
  'pig-face': PigFaceSvg,
  'rabbit-face': RabbitFaceSvg,
};

/**
 * List of avatars that have animated versions available
 * When adding a new animated animal, add its key here
 */
export const ANIMATED_AVATARS: string[] = [
  'bear',
  'cat-face',
  'dog-face',
  'fox',
  'frog',
  'hamster',
  'lion',
  'monkey-face',
  'mouse-face',
  'panda',
  'pig-face',
  'rabbit-face',
];

/**
 * Check if an avatar has an animated version available
 */
export const hasAnimatedAvatarVersion = (avatarKey: string): boolean => {
  return ANIMATED_AVATARS.includes(avatarKey);
};

/**
 * Get SVG component for an avatar key
 */
export const getAvatarSvg = (avatarKey: string): React.FC<SvgProps> | null => {
  return AVATAR_MAP[avatarKey] || null;
};

/**
 * Check if avatar is an SVG key (not a URL)
 */
export const isSvgAvatar = (avatar: string): boolean => {
  return !avatar.startsWith('http://') && !avatar.startsWith('https://');
};

/**
 * Get avatar display - either SVG component or URL string
 */
export const getAvatarDisplay = (avatar: string): { type: 'svg' | 'url'; value: React.FC<SvgProps> | string } => {
  if (isSvgAvatar(avatar)) {
    const svg = getAvatarSvg(avatar);
    if (svg) {
      return { type: 'svg', value: svg };
    }
  }
  return { type: 'url', value: avatar };
};
