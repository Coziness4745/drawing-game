// Array of words for the drawing game
const words = [
    "apple", "banana", "cat", "dog", "elephant", "flower", "guitar", "house", "island", "jacket",
    "kite", "lion", "mountain", "notebook", "ocean", "penguin", "queen", "rainbow", "sun", "tree",
    "umbrella", "volcano", "waterfall", "xylophone", "yacht", "zebra", "airplane", "beach", "castle",
    "dragon", "eagle", "forest", "giraffe", "helicopter", "igloo", "jellyfish", "kangaroo", "lighthouse",
    "moon", "ninja", "octopus", "pirate", "robot", "spaceship", "tiger", "unicorn", "vampire", "wizard",
    "anchor", "balloon", "cactus", "dinosaur", "elephant", "fireplace", "globe", "hat", "ice cream",
    "juggler", "key", "ladder", "map", "nest", "owl", "piano", "quilt", "rocket", "snowman", "telescope",
    "UFO", "vase", "whale", "X-ray", "yo-yo", "zipper", "backpack", "camera", "drums", "easel", "fence",
    "glasses", "hammer", "iguana", "jeans", "kettle", "lamp", "mask", "necklace", "oven", "puzzle",
    "queen", "ring", "scissors", "train", "umbrella", "violin", "wallet", "xylophone", "yogurt", "zoo"
  ];
  
  // Get a random word from the array
  export const getRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  };
  
  // Get multiple random words with no duplicates
  export const getRandomWords = (count) => {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };