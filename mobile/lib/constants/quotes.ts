/**
 * Inspirational Quotes for Loading Screens
 * Used throughout the app to inspire and motivate users
 */

export const loadingQuotes = [
  {
    text: "Take a deep breath. Progress is progress, no matter how small.",
    author: "Menthera",
  },
  {
    text: "You are stronger than you think. Keep going.",
    author: "Menthera",
  },
  {
    text: "Every moment is a fresh beginning.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "Wellness is a journey, not a destination.",
    author: "Menthera",
  },
  {
    text: "Your mental health matters. Take care of yourself.",
    author: "Menthera",
  },
  {
    text: "Be kind to yourself. You deserve it.",
    author: "Menthera",
  },
  {
    text: "Progress, not perfection. One step at a time.",
    author: "Menthera",
  },
  {
    text: "You've got this. Believe in yourself.",
    author: "Menthera",
  },
  {
    text: "Calm minds breed brilliant ideas.",
    author: "Menthera",
  },
  {
    text: "Self-care is not selfish. It's necessary.",
    author: "Menthera",
  },
  {
    text: "Your journey is unique. That's your strength.",
    author: "Menthera",
  },
  {
    text: "Mental clarity starts with a peaceful mind.",
    author: "Menthera",
  },
];

/**
 * Get a random quote from the collection
 */
export const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * loadingQuotes.length);
  return loadingQuotes[randomIndex];
};

/**
 * Get a quote by index (for consistent quotes during session)
 */
export const getQuoteByIndex = (index: number) => {
  return loadingQuotes[index % loadingQuotes.length];
};
