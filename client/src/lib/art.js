// Which 3D object (client/public/art) stands for each category icon. The
// categories keep their line-icon names in the database, so this is the one
// place that turns them into pictures - a new category icon only needs a line
// here.
const CATEGORY_ART = {
  utensils: 'hamburger',
  bus: 'bus',
  home: 'house',
  book: 'books',
  repeat: 'mobile_phone',
  film: 'popcorn',
  tag: 'package',
  wallet: 'dollar_banknote',
  briefcase: 'briefcase',
  award: 'graduation_cap',
  gift: 'wrapped_gift',
  'plus-circle': 'coin',
  target: 'bullseye',
  coin: 'coin',
  chart: 'bar_chart',
  spark: 'sparkles',
  bulb: 'light_bulb',
};

export const categoryArt = (icon) => CATEGORY_ART[icon] || 'coin';
