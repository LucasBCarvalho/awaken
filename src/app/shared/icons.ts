import { addIcons } from 'ionicons';
import {
  add, addCircle, aperture, arrowUndo, barbell, book, calendar, checkmark, checkmarkCircle, chevronForward,
  close, create, cube, diamond, ellipse, eye, flame, flash, flask, gift, heart, hourglass, key, lockClosed,
  map, moon, people, person, planet, remove, ribbon, settings, shield, shieldCheckmark, shieldHalf, skull,
  sparkles, star, storefront, time, timer, trash, trophy, water,
} from 'ionicons/icons';

export function registerIcons(): void {
  addIcons({
    add, 'add-circle': addCircle, aperture, 'arrow-undo': arrowUndo, barbell, book, calendar, checkmark,
    'checkmark-circle': checkmarkCircle, 'chevron-forward': chevronForward, close, create, cube, diamond,
    ellipse, eye, flame, flash, flask, gift, heart, hourglass, key, 'lock-closed': lockClosed, map, moon,
    people, person, planet, remove, ribbon, settings, shield, 'shield-checkmark': shieldCheckmark,
    'shield-half': shieldHalf, skull, sparkles, star, storefront, time, timer, trash, trophy, water,
  });
}
