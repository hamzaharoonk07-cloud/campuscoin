// The default categories every student starts with, taken from the SRS
// (section 1.6, "Category Management"). The keywords are what lets the
// categorisation assistant make a sensible guess on a brand new account,
// before it has learned anything about that particular student.

export const DEFAULT_CATEGORIES = [
  // Income
  { name: 'Allowance', type: 'income', icon: 'wallet', slot: 1, keywords: ['allowance', 'pocket', 'money', 'parents', 'home', 'monthly'] },
  { name: 'Part-time Job', type: 'income', icon: 'briefcase', slot: 2, keywords: ['salary', 'wage', 'shift', 'job', 'work', 'freelance', 'gig', 'tutoring', 'tuition'] },
  { name: 'Scholarship', type: 'income', icon: 'award', slot: 3, keywords: ['scholarship', 'stipend', 'grant', 'bursary', 'merit', 'aid'] },
  { name: 'Gift', type: 'income', icon: 'gift', slot: 4, keywords: ['gift', 'eidi', 'birthday', 'present', 'bonus'] },
  { name: 'Other Income', type: 'income', icon: 'plus-circle', slot: 5, keywords: ['refund', 'cashback', 'sold', 'return', 'misc'] },

  // Expenses
  { name: 'Food', type: 'expense', icon: 'utensils', slot: 1, keywords: ['food', 'lunch', 'dinner', 'breakfast', 'canteen', 'cafe', 'cafeteria', 'mess', 'snack', 'tea', 'coffee', 'biryani', 'burger', 'pizza', 'restaurant', 'foodpanda', 'delivery', 'groceries', 'grocery', 'chai', 'paratha', 'samosa', 'roti', 'naan', 'dhaba', 'shawarma', 'sandwich', 'fries', 'juice', 'kebab', 'bakery', 'nashta', 'khana'] },
  { name: 'Transport', type: 'expense', icon: 'bus', slot: 3, keywords: ['bus', 'rickshaw', 'uber', 'careem', 'indrive', 'fuel', 'petrol', 'metro', 'train', 'fare', 'taxi', 'bike', 'ride', 'bykea', 'qingqi', 'chingchi', 'van', 'auto', 'parking', 'toll'] },
  { name: 'Hostel/Rent', type: 'expense', icon: 'home', slot: 2, keywords: ['rent', 'hostel', 'room', 'deposit', 'electricity', 'utility', 'gas', 'water', 'wifi', 'internet', 'bill'] },
  { name: 'Academics', type: 'expense', icon: 'book', slot: 4, keywords: ['book', 'books', 'stationery', 'notebook', 'printing', 'photocopy', 'lab', 'semester', 'fee', 'course', 'exam', 'library', 'pen'] },
  { name: 'Subscriptions', type: 'expense', icon: 'repeat', slot: 6, keywords: ['netflix', 'spotify', 'youtube', 'subscription', 'premium', 'plan', 'package', 'cloud', 'chatgpt', 'canva', 'gym', 'membership'] },
  { name: 'Entertainment', type: 'expense', icon: 'film', slot: 5, keywords: ['movie', 'cinema', 'game', 'gaming', 'concert', 'outing', 'trip', 'hangout', 'party', 'match', 'ticket'] },
  { name: 'Miscellaneous', type: 'expense', icon: 'tag', slot: 7, keywords: ['misc', 'other', 'random', 'gift', 'charity', 'haircut', 'medicine', 'clothes', 'laundry'] },
];
