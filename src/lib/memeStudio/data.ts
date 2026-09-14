import type { MemeItem, MemeCategory } from "./types";

export const MEME_CATEGORIES: MemeCategory[] = [
  "All",
  "Trending",
  "Reaction",
  "Work",
  "Anime",
  "Gaming",
  "Success",
  "Funny",
  "Sad",
  "Angry",
  "Happy",
  "Confused",
  "Celebration",
  "Emoji",
];

export const CURATED_MEMES: MemeItem[] = [];

export const CURATED_GIFS: MemeItem[] = [
  {
    "id": "gif-this-is-fine",
    "title": "This Is Fine Dog",
    "url": "https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "this is fine",
      "fire",
      "dog",
      "work",
      "deadline",
      "stress",
      "coding",
      "debugging",
      "chaos"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-leonardo-cheers",
    "title": "Leo Gatsby Cheers Toast",
    "url": "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "cheers",
      "celebration",
      "gatsby",
      "leonardo",
      "success",
      "win",
      "toast"
    ],
    "animated": true,
    "aspectRatio": 1.77
  },
  {
    "id": "gif-mind-blown",
    "title": "Mind Blown Galaxy",
    "url": "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "mind blown",
      "shocked",
      "galaxy",
      "wow",
      "amazing",
      "eureka",
      "idea"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-cat-typing-fast",
    "title": "Cat Hacking & Typing Fast",
    "url": "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "cat",
      "typing",
      "coding",
      "work",
      "deadline",
      "fast",
      "hacker",
      "programmer"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-confused-travolta",
    "title": "Confused Vincent Vega",
    "url": "https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "travolta",
      "pulp fiction",
      "looking around",
      "lost",
      "where"
    ],
    "animated": true,
    "aspectRatio": 1.77
  },
  {
    "id": "gif-steve-carell-no",
    "title": "Michael Scott NO GOD PLEASE NO",
    "url": "https://media.giphy.com/media/vyTnNTrs3wqQ0UIvwE/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "no",
      "screaming",
      "angry",
      "god please no",
      "office",
      "fail",
      "bug"
    ],
    "animated": true,
    "aspectRatio": 1.77
  },
  {
    "id": "gif-clap-applause",
    "title": "Standing Ovation & Applause",
    "url": "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "applause",
      "clap",
      "great job",
      "bravo",
      "win",
      "respect",
      "crowd"
    ],
    "animated": true,
    "aspectRatio": 1.77
  },
  {
    "id": "gif-popcorn-eating",
    "title": "Eating Popcorn Watching Drama",
    "url": "https://media.giphy.com/media/hVTouq08miyGT52UKL/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "popcorn",
      "drama",
      "watching",
      "entertaining",
      "snack",
      "fun"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-excited-kermit",
    "title": "Kermit Yay Flail",
    "url": "https://media.giphy.com/media/DPznISmq0hLRRI2ERU/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "kermit",
      "excited",
      "happy",
      "yay",
      "arms",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-developer-coffee",
    "title": "Need More Coffee",
    "url": "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "coffee",
      "morning",
      "caffeine",
      "tired",
      "developer",
      "working"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-shocked-cat",
    "title": "Shocked Cat Eyes",
    "url": "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "cat",
      "shocked",
      "eyes",
      "omg",
      "unbelievable",
      "surprised"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-happy-dance-snoopy",
    "title": "Snoopy Happy Dance",
    "url": "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "dance",
      "celebrate",
      "snoopy",
      "joy",
      "cheerful",
      "fun"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-nodding-agree",
    "title": "Jeremiah Johnson Nodding",
    "url": "https://media.giphy.com/media/gOkawaguYNi539RZfl/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "nod",
      "agree",
      "yes",
      "approval",
      "respect",
      "manly nod"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-office-parkour",
    "title": "Michael Scott Parkour",
    "url": "https://media.giphy.com/media/DoCIC5RIQOcxx528v3/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "parkour",
      "office",
      "michael scott",
      "agility",
      "pivot",
      "startup"
    ],
    "animated": true,
    "aspectRatio": 1.77
  },
  {
    "id": "gif-RvMsB2IktjOLbUo6bd",
    "title": "Dance Dancing",
    "url": "https://media.giphy.com/media/RvMsB2IktjOLbUo6bd/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "dance",
      "dancing",
      "instagram",
      "insta",
      "stangram",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-wZtxnyxWTImyzpRxf1",
    "title": "Sweater Weather Snl",
    "url": "https://media.giphy.com/media/wZtxnyxWTImyzpRxf1/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "sweater",
      "weather",
      "snl",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-8ac9tQi8GtuJaW8HBJ",
    "title": "Stare Seriously",
    "url": "https://media.giphy.com/media/8ac9tQi8GtuJaW8HBJ/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "stare",
      "seriously",
      "flight",
      "flightreacts",
      "ftc",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-v46X9NuzCFGPC9RAS4",
    "title": "Oh Yeah Smiling",
    "url": "https://media.giphy.com/media/v46X9NuzCFGPC9RAS4/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "yeah",
      "smiling",
      "black",
      "guy",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Yrl3qoBXef8rorcZdE",
    "title": "Happy Molly Shannon",
    "url": "https://media.giphy.com/media/Yrl3qoBXef8rorcZdE/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "happy",
      "molly",
      "shannon",
      "laff",
      "movie",
      "superstar",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-gpXfKa9xLAR56",
    "title": "Kermit The Frog Applause",
    "url": "https://media.giphy.com/media/gpXfKa9xLAR56/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "kermit",
      "frog",
      "applause",
      "cheezburger",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-DvyLQztQwmyAM",
    "title": "Excuse Me What",
    "url": "https://media.giphy.com/media/DvyLQztQwmyAM/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "excuse",
      "what",
      "mrw",
      "bathroom",
      "nekkid",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-UqKD7TU0igaUE",
    "title": "Reaction",
    "url": "https://media.giphy.com/media/UqKD7TU0igaUE/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-mgqefqwSbToPe",
    "title": "Charlie Day Ok",
    "url": "https://media.giphy.com/media/mgqefqwSbToPe/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "charlie",
      "day",
      "mrw",
      "joke",
      "advice",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-1d7F9xyq6j7C1ojbC5",
    "title": "Dog Smile",
    "url": "https://media.giphy.com/media/1d7F9xyq6j7C1ojbC5/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "dog",
      "smile",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-111ebonMs90YLu",
    "title": "Thumbs Ok",
    "url": "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "thumbs",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-iNjfcmUM8lUPWm3fay",
    "title": "Sad Jim Carrey",
    "url": "https://media.giphy.com/media/iNjfcmUM8lUPWm3fay/giphy.gif",
    "type": "gif",
    "category": "Reaction",
    "tags": [
      "sad",
      "jim",
      "carrey",
      "dumb",
      "vomit",
      "vomiting",
      "reaction"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-l0y6gXwXCDPAQ",
    "title": "Reggie wayne week",
    "url": "https://media.giphy.com/media/l0y6gXwXCDPAQ/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "reggie",
      "wayne",
      "week",
      "recap",
      "bills",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-9SfWGhN97TIBpmdRem",
    "title": "I Love You Hearts",
    "url": "https://media.giphy.com/media/9SfWGhN97TIBpmdRem/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "love",
      "you",
      "hearts",
      "affection",
      "too",
      "much",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-WG4uYteu6J0teNVxpT",
    "title": "I Love You Hearts",
    "url": "https://media.giphy.com/media/WG4uYteu6J0teNVxpT/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "love",
      "you",
      "hearts",
      "heart",
      "ghost",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-i0pEbjXuQOz1eEmObW",
    "title": "Japan Romance",
    "url": "https://media.giphy.com/media/i0pEbjXuQOz1eEmObW/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "japan",
      "romance",
      "anime",
      "love",
      "manga",
      "vibe",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-jsHZ6OqkXlm9Wh05AJ",
    "title": "Raksha Bandhan Celebration",
    "url": "https://media.giphy.com/media/jsHZ6OqkXlm9Wh05AJ/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "raksha",
      "bandhan",
      "celebration",
      "hikeapp",
      "rakhi",
      "rakshabandhan",
      "happy",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Y8XaWrPlcraoHijs5J",
    "title": "Raksha Bandhan Love",
    "url": "https://media.giphy.com/media/Y8XaWrPlcraoHijs5J/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "raksha",
      "bandhan",
      "love",
      "roposolove",
      "rakhi",
      "rakshabandhan",
      "happy",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-gjCdY6N8pn7HnFvKhy",
    "title": "Bollywood Trending",
    "url": "https://media.giphy.com/media/gjCdY6N8pn7HnFvKhy/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "bollywood",
      "trending",
      "hikeapp",
      "salman",
      "dabang",
      "dabangg"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-E9lSPlvbjhDebT8GNf",
    "title": "Last Of Us Smiling",
    "url": "https://media.giphy.com/media/E9lSPlvbjhDebT8GNf/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "last",
      "smiling",
      "smirk",
      "ellie",
      "trending"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-D8qJlXpO3MVccXZ9mA",
    "title": "Mr Bean Wtf",
    "url": "https://media.giphy.com/media/D8qJlXpO3MVccXZ9mA/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "bean",
      "wtf",
      "trending",
      "mrbean"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-J2y6ZRvcKFQL71V7jA",
    "title": "Trending Trends",
    "url": "https://media.giphy.com/media/J2y6ZRvcKFQL71V7jA/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "trending",
      "trends",
      "youngertv"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-efCaIWXti0wIFtu5ul",
    "title": "Durga Puja Trending",
    "url": "https://media.giphy.com/media/efCaIWXti0wIFtu5ul/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "durga",
      "puja",
      "trending",
      "hikeapp",
      "hike",
      "stickers",
      "pujo"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Jk4e8K1400yTBs5QZv",
    "title": "Happy In Love",
    "url": "https://media.giphy.com/media/Jk4e8K1400yTBs5QZv/giphy.gif",
    "type": "gif",
    "category": "Trending",
    "tags": [
      "happy",
      "love",
      "trending",
      "birds",
      "jramos"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-toXKzaJP3WIgM",
    "title": "Happy Jim Carrey",
    "url": "https://media.giphy.com/media/toXKzaJP3WIgM/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "happy",
      "jim",
      "carrey",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-13rQ7rrTrvZXlm",
    "title": "Working The Incredibles",
    "url": "https://media.giphy.com/media/13rQ7rrTrvZXlm/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "working",
      "incredibles",
      "geek",
      "writing",
      "schedule",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-nCVVpakhBTwBi",
    "title": "Work Working",
    "url": "https://media.giphy.com/media/nCVVpakhBTwBi/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "work",
      "working",
      "late"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-9rJWu5pKI2Gn02ENjd",
    "title": "Office task work",
    "url": "https://media.giphy.com/media/9rJWu5pKI2Gn02ENjd/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "office",
      "task",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-GhnctUOrT8HBe",
    "title": "Homer Simpson Work",
    "url": "https://media.giphy.com/media/GhnctUOrT8HBe/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "homer",
      "simpson",
      "work",
      "money"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-YAnpMSHcurJVS",
    "title": "Peter Griffin Work",
    "url": "https://media.giphy.com/media/YAnpMSHcurJVS/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "peter",
      "griffin",
      "work",
      "day"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ZqIMaT9uzIHza",
    "title": "Working Rupauls Drag Race",
    "url": "https://media.giphy.com/media/ZqIMaT9uzIHza/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "working",
      "rupauls",
      "drag",
      "race",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-BSrfMLeT9FkUZG5fLq",
    "title": "Dog work golden retriever",
    "url": "https://media.giphy.com/media/BSrfMLeT9FkUZG5fLq/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "dog",
      "work",
      "golden",
      "retriever"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ThrM4jEi2lBxd7X2yz",
    "title": "Working Out Of Office",
    "url": "https://media.giphy.com/media/ThrM4jEi2lBxd7X2yz/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "working",
      "out",
      "office",
      "thisgifishaunted",
      "halloween",
      "happy",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-lSVL6vdhdZVPW",
    "title": "Working Office Space",
    "url": "https://media.giphy.com/media/lSVL6vdhdZVPW/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "working",
      "office",
      "space",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-60yTQLK9O7XlS",
    "title": "Working Washington Dc",
    "url": "https://media.giphy.com/media/60yTQLK9O7XlS/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "working",
      "washington",
      "story",
      "district",
      "feed",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-rljAglXNwLtOw9mkKU",
    "title": "Jeremy Scott Fashion",
    "url": "https://media.giphy.com/media/rljAglXNwLtOw9mkKU/giphy.gif",
    "type": "gif",
    "category": "Work",
    "tags": [
      "jeremy",
      "scott",
      "fashion",
      "primevideo",
      "winnie",
      "harlow",
      "making",
      "cut",
      "tim",
      "gunn",
      "work"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-a0h7sAqON67nO",
    "title": "Great Success Win",
    "url": "https://media.giphy.com/media/a0h7sAqON67nO/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "great",
      "success",
      "win",
      "borat"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-zaqclXyLz3Uoo",
    "title": "Happy Stephen Colbert",
    "url": "https://media.giphy.com/media/zaqclXyLz3Uoo/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "happy",
      "stephen",
      "colbert",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-nXxOjZrbnbRxS",
    "title": "Happy Yes It Is",
    "url": "https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "happy",
      "yes",
      "win",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-xNBcChLQt7s9a",
    "title": "Emotion Reaction",
    "url": "https://media.giphy.com/media/xNBcChLQt7s9a/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "emotion",
      "reaction",
      "win",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-KEVNWkmWm6dm8",
    "title": "Winner success",
    "url": "https://media.giphy.com/media/KEVNWkmWm6dm8/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "winner",
      "success",
      "reaction",
      "winning"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-OHZ1gSUThmEso",
    "title": "Fist Pump Success",
    "url": "https://media.giphy.com/media/OHZ1gSUThmEso/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "fist",
      "pump",
      "success",
      "college",
      "finals"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Q81NcsY6YxK7jxnr4v",
    "title": "Success Kid",
    "url": "https://media.giphy.com/media/Q81NcsY6YxK7jxnr4v/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "success",
      "kid",
      "moodman"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-uudzUtVcsLAoo",
    "title": "Tiger Woods Win",
    "url": "https://media.giphy.com/media/uudzUtVcsLAoo/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "tiger",
      "woods",
      "win",
      "golf",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Sculsk7YRnRpvMZrR3",
    "title": "We Did It Win",
    "url": "https://media.giphy.com/media/Sculsk7YRnRpvMZrR3/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "did",
      "win",
      "snl",
      "saturday",
      "night",
      "live",
      "season",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-AgrfqPt5AyiTm",
    "title": "Update success",
    "url": "https://media.giphy.com/media/AgrfqPt5AyiTm/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "update",
      "success",
      "meme"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-lnlAifQdenMxW",
    "title": "The Champions Win",
    "url": "https://media.giphy.com/media/lnlAifQdenMxW/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "champions",
      "win",
      "football",
      "night",
      "fantasy",
      "success"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-4xpB3eE00FfBm",
    "title": "Baby Success",
    "url": "https://media.giphy.com/media/4xpB3eE00FfBm/giphy.gif",
    "type": "gif",
    "category": "Success",
    "tags": [
      "baby",
      "success",
      "mrw",
      "week",
      "job"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-fHoqSTQTsgSbfUoiTw",
    "title": "Speakwithbody",
    "url": "https://media.giphy.com/media/fHoqSTQTsgSbfUoiTw/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "speakwithbody",
      "funny",
      "fat"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-okfvUCpgArv3y",
    "title": "Happy Skeleton",
    "url": "https://media.giphy.com/media/okfvUCpgArv3y/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "happy",
      "skeleton",
      "funny",
      "excited"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-SWoXEoE1lA0uSQcF1h",
    "title": "Girl Love",
    "url": "https://media.giphy.com/media/SWoXEoE1lA0uSQcF1h/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "girl",
      "love",
      "moodman",
      "flirt",
      "flirting",
      "hey",
      "there",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-nU0EccnuhJa5ofFr6v",
    "title": "Dance Fun",
    "url": "https://media.giphy.com/media/nU0EccnuhJa5ofFr6v/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "dance",
      "fun",
      "kokumiburger",
      "funny",
      "good"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-M3KKCaQKe1O412gSiK",
    "title": "Dancing Dog",
    "url": "https://media.giphy.com/media/M3KKCaQKe1O412gSiK/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "dancing",
      "dog",
      "pinebill",
      "funny",
      "pug"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-CciM7ZRcjqY6P7HHdd",
    "title": "Speed Dancing",
    "url": "https://media.giphy.com/media/CciM7ZRcjqY6P7HHdd/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "speed",
      "dancing",
      "cnstix",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-gj0QdZ9FgqGhOBNlFS",
    "title": "Cracking Up Lol",
    "url": "https://media.giphy.com/media/gj0QdZ9FgqGhOBNlFS/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "cracking",
      "lol",
      "laugh",
      "laughing",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-F0Z9Fi4eB4YXr4FURN",
    "title": "Coffee Overacting",
    "url": "https://media.giphy.com/media/F0Z9Fi4eB4YXr4FURN/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "coffee",
      "overacting",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-GOeFqBsdplHseqWctY",
    "title": "Art Dog",
    "url": "https://media.giphy.com/media/GOeFqBsdplHseqWctY/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "art",
      "dog",
      "police",
      "mrperak",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-SggILpMXO7Xt6",
    "title": "Funny Face Dog",
    "url": "https://media.giphy.com/media/SggILpMXO7Xt6/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "funny",
      "face",
      "dog",
      "sblobbery",
      "clbarrr",
      "idzz"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-X7Bckr1JaJS1opWTzO",
    "title": "Cat Flying",
    "url": "https://media.giphy.com/media/X7Bckr1JaJS1opWTzO/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "cat",
      "flying",
      "apcgifs",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-XHeLeuirRbwptHhSWd",
    "title": "Laugh Lol",
    "url": "https://media.giphy.com/media/XHeLeuirRbwptHhSWd/giphy.gif",
    "type": "gif",
    "category": "Funny",
    "tags": [
      "laugh",
      "lol",
      "allsxxingeyes",
      "laughing",
      "spit",
      "funny"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-lGBecpB2dIMwt6ohfI",
    "title": "Cute Cat Smile",
    "url": "https://media.giphy.com/media/lGBecpB2dIMwt6ohfI/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "cute",
      "cat",
      "smile",
      "9mc",
      "sad"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-Lz6971fkGSgCMOOncl",
    "title": "Iraq Sad Cat",
    "url": "https://media.giphy.com/media/Lz6971fkGSgCMOOncl/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "iraq",
      "sad",
      "cat",
      "9mc",
      "cry"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-klu2KSBQwdYA",
    "title": "Sadness Sad Cat",
    "url": "https://media.giphy.com/media/klu2KSBQwdYA/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sadness",
      "sad",
      "cat"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-3oEjI80DSa1grNPTDq",
    "title": "Sad Arrested Development",
    "url": "https://media.giphy.com/media/3oEjI80DSa1grNPTDq/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "arrested",
      "development",
      "michael",
      "cera",
      "george",
      "bluth"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-d2lcHJTG5Tscg",
    "title": "Sad Anthony Anderson",
    "url": "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "anthony",
      "anderson",
      "blackish",
      "dre",
      "johnson"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-fhLgA6nJec3Cw",
    "title": "Sad Kid",
    "url": "https://media.giphy.com/media/fhLgA6nJec3Cw/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "kid",
      "pouting"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-dJYoOVAWf2QkU",
    "title": "Sad Pikachu",
    "url": "https://media.giphy.com/media/dJYoOVAWf2QkU/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "pikachu"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-AzAa23iNkA5I6jQKmG",
    "title": "Sad The Simpsons",
    "url": "https://media.giphy.com/media/AzAa23iNkA5I6jQKmG/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "simpsons",
      "bart",
      "simpson",
      "alone",
      "aburrido"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-J1XSaMzkdlqDl89NVf",
    "title": "Sad Spongebob",
    "url": "https://media.giphy.com/media/J1XSaMzkdlqDl89NVf/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "spongebob"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ar71Hyi0ZKejXzMoNs",
    "title": "Sad Rain",
    "url": "https://media.giphy.com/media/ar71Hyi0ZKejXzMoNs/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "rain",
      "batman"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-iJJ6E58EttmFqgLo96",
    "title": "Sad Cry",
    "url": "https://media.giphy.com/media/iJJ6E58EttmFqgLo96/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "cry",
      "moodman"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-TU76e2JHkPchG",
    "title": "Sad Face",
    "url": "https://media.giphy.com/media/TU76e2JHkPchG/giphy.gif",
    "type": "gif",
    "category": "Sad",
    "tags": [
      "sad",
      "face",
      "crying",
      "omfg"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-11tTNkNy1SdXGg",
    "title": "Angry Inside Out",
    "url": "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "inside",
      "out",
      "disneypixar",
      "disney",
      "pixar"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-m8fyrgnXwXV5EHw6Lm",
    "title": "Angry red emoji",
    "url": "https://media.giphy.com/media/m8fyrgnXwXV5EHw6Lm/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "red",
      "emoji"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-RuYPi0HyBnOxy",
    "title": "Angry black snake moan",
    "url": "https://media.giphy.com/media/RuYPi0HyBnOxy/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "black",
      "snake",
      "moan",
      "samuel",
      "jackson"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-l1J9u3TZfpmeDLkD6",
    "title": "Look Whos Talking Now Omg",
    "url": "https://media.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "look",
      "whos",
      "talking",
      "now",
      "omg",
      "angry",
      "mad",
      "anger"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-TGi1zmIHpDRsrxtoPq",
    "title": "Angry sesame street bert",
    "url": "https://media.giphy.com/media/TGi1zmIHpDRsrxtoPq/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "sesame",
      "street",
      "bert"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-MLhIi4DoxeUjC",
    "title": "Angry",
    "url": "https://media.giphy.com/media/MLhIi4DoxeUjC/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-MJd3uGnPA0sh6VZMge",
    "title": "Angry Family Guy",
    "url": "https://media.giphy.com/media/MJd3uGnPA0sh6VZMge/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "family",
      "guy",
      "peter",
      "griffin"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-y1WDIwAZRSmru",
    "title": "Angry Hate",
    "url": "https://media.giphy.com/media/y1WDIwAZRSmru/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "hate",
      "frustrated"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ZebTmyvw85gnm",
    "title": "Angry Work",
    "url": "https://media.giphy.com/media/ZebTmyvw85gnm/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "work",
      "panda"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-vHcCevWbWkzwk",
    "title": "Angry Looney Tunes",
    "url": "https://media.giphy.com/media/vHcCevWbWkzwk/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "looney",
      "tunes",
      "90s",
      "mad"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-8U3YhzfeDqg8ihkkPa",
    "title": "Angry Fight",
    "url": "https://media.giphy.com/media/8U3YhzfeDqg8ihkkPa/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "fight",
      "mikeshothoney",
      "fist",
      "hot",
      "honey",
      "mikes"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-KPVJXH61g2jHkdqZES",
    "title": "Angry On Fire",
    "url": "https://media.giphy.com/media/KPVJXH61g2jHkdqZES/giphy.gif",
    "type": "gif",
    "category": "Angry",
    "tags": [
      "angry",
      "fire",
      "lazy",
      "corgi"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-qdxDab2ZKCLq3qI6kO",
    "title": "Happy dance snoopy",
    "url": "https://media.giphy.com/media/qdxDab2ZKCLq3qI6kO/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "dance",
      "snoopy"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-3o7qE2VAxuXWeyvJIY",
    "title": "Happy Dance",
    "url": "https://media.giphy.com/media/3o7qE2VAxuXWeyvJIY/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "dance"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-fUQ4rhUZJYiQsas6WD",
    "title": "Happy Sesame Street",
    "url": "https://media.giphy.com/media/fUQ4rhUZJYiQsas6WD/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "sesame",
      "street",
      "muppetwiki",
      "muppets",
      "elmo"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-B0vFTrb0ZGDf2",
    "title": "Happy Toddlers And Tiaras",
    "url": "https://media.giphy.com/media/B0vFTrb0ZGDf2/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "toddlers",
      "tiaras",
      "city",
      "bus",
      "doll"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ukmZRuEqc2Rbi",
    "title": "Happy Fresh Prince Of Bel Air",
    "url": "https://media.giphy.com/media/ukmZRuEqc2Rbi/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "fresh",
      "prince",
      "bel",
      "air",
      "home",
      "college"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-9KLPmWoiiPZvmJKQ14",
    "title": "Happy Dance",
    "url": "https://media.giphy.com/media/9KLPmWoiiPZvmJKQ14/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "dance",
      "hands",
      "paws"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-11sBLVxNs7v6WA",
    "title": "Happy So Excited",
    "url": "https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "excited",
      "cheer",
      "cheering"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-UAIg3J4OzepmYxQeAT",
    "title": "Happy Joy",
    "url": "https://media.giphy.com/media/UAIg3J4OzepmYxQeAT/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "joy",
      "dazn",
      "excited",
      "yay",
      "celebrating"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-uET9WfHEKuqsahvunC",
    "title": "Happy Phone",
    "url": "https://media.giphy.com/media/uET9WfHEKuqsahvunC/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "phone"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-BWplyaNrHRjRvweNjS",
    "title": "Happy Joy",
    "url": "https://media.giphy.com/media/BWplyaNrHRjRvweNjS/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "joy",
      "CoopPrix",
      "cute",
      "sloth"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-aQYR1p8saOQla",
    "title": "Happy So Excited",
    "url": "https://media.giphy.com/media/aQYR1p8saOQla/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "excited",
      "see",
      "heavy"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-geslvCFM31sFW",
    "title": "Happy Despicable Me",
    "url": "https://media.giphy.com/media/geslvCFM31sFW/giphy.gif",
    "type": "gif",
    "category": "Happy",
    "tags": [
      "happy",
      "despicable",
      "dancing"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ji6zzUZwNIuLS",
    "title": "Confused Little Girl",
    "url": "https://media.giphy.com/media/ji6zzUZwNIuLS/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "little",
      "girl"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-WRQBXSCnEFJIuxktnw",
    "title": "Confused Thinking",
    "url": "https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "thinking",
      "math",
      "lady",
      "meme"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ukGm72ZLZvYfS",
    "title": "Music Video Wtf",
    "url": "https://media.giphy.com/media/ukGm72ZLZvYfS/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "music",
      "video",
      "wtf",
      "what",
      "fuck",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-hv53DaYcXWe3nRbR1A",
    "title": "Confused Thinking",
    "url": "https://media.giphy.com/media/hv53DaYcXWe3nRbR1A/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "thinking",
      "moodman"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-fa1AV8UvZvfBFOIt7F",
    "title": "Thinking What",
    "url": "https://media.giphy.com/media/fa1AV8UvZvfBFOIt7F/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "thinking",
      "what",
      "meme",
      "relatable",
      "cramel",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-118p3q768COZhu",
    "title": "Confused Girl",
    "url": "https://media.giphy.com/media/118p3q768COZhu/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "girl",
      "funny",
      "fun"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-FY8c5SKwiNf1EtZKGs",
    "title": "Shocked Eyes",
    "url": "https://media.giphy.com/media/FY8c5SKwiNf1EtZKGs/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "shocked",
      "eyes",
      "moodman",
      "animals",
      "dogs",
      "doggo",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-lHfxDepSGlzom6f65K",
    "title": "Math Reaction",
    "url": "https://media.giphy.com/media/lHfxDepSGlzom6f65K/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "math",
      "reaction",
      "ifhtfilms",
      "confused",
      "numbers"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-glmRyiSI3v5E4",
    "title": "Tom Cruise What",
    "url": "https://media.giphy.com/media/glmRyiSI3v5E4/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "tom",
      "cruise",
      "what",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-3EiNpweH34XGoQcq9Q",
    "title": "Confused Steve Brule",
    "url": "https://media.giphy.com/media/3EiNpweH34XGoQcq9Q/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "confused",
      "steve",
      "brule"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-521JLj0YGzz6AEWsZ5",
    "title": "Ryan Reynolds Reaction",
    "url": "https://media.giphy.com/media/521JLj0YGzz6AEWsZ5/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "ryan",
      "reynolds",
      "reaction",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-YaXDLHHbz0t5lTM03z",
    "title": "Eddie Murphy What",
    "url": "https://media.giphy.com/media/YaXDLHHbz0t5lTM03z/giphy.gif",
    "type": "gif",
    "category": "Confused",
    "tags": [
      "eddie",
      "murphy",
      "what",
      "primevideo",
      "amazon",
      "prime",
      "amazonprime",
      "confused"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-l0MYt5jPR6QX5pnqM",
    "title": "The Office Party Hard",
    "url": "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "office",
      "party",
      "hard",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-NC5i7lgeWOladJi3Gq",
    "title": "Happy Birthday Win",
    "url": "https://media.giphy.com/media/NC5i7lgeWOladJi3Gq/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "happy",
      "birthday",
      "win",
      "trt",
      "network",
      "havai",
      "fiek",
      "havaifiek",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-1PMVNNKVIL8Ig",
    "title": "Excited New Year",
    "url": "https://media.giphy.com/media/1PMVNNKVIL8Ig/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "excited",
      "new",
      "year",
      "80s",
      "vintage",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-vmon3eAOp1WfK",
    "title": "Celebration Reaction",
    "url": "https://media.giphy.com/media/vmon3eAOp1WfK/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "celebration",
      "reaction",
      "excited",
      "loki"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ddHhhUBn25cuQ",
    "title": "Miguel Herrera Win",
    "url": "https://media.giphy.com/media/ddHhhUBn25cuQ/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "miguel",
      "herrera",
      "win",
      "ftw",
      "coachs",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-jIUe9WT7p1X5cdU3hM",
    "title": "Dance Football",
    "url": "https://media.giphy.com/media/jIUe9WT7p1X5cdU3hM/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "dance",
      "football",
      "jaxon",
      "jsn",
      "smith",
      "njigba",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-igJK985xZj8Cqq0YOW",
    "title": "Celebrate Yahoo",
    "url": "https://media.giphy.com/media/igJK985xZj8Cqq0YOW/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "celebrate",
      "yahoo",
      "kool",
      "gang",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-YTbZzCkRQCEJa",
    "title": "Excited Happy Birthday",
    "url": "https://media.giphy.com/media/YTbZzCkRQCEJa/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "excited",
      "happy",
      "birthday",
      "party",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-8j3CTd8YJtAv6",
    "title": "Dance Dancing",
    "url": "https://media.giphy.com/media/8j3CTd8YJtAv6/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "dance",
      "dancing",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-TSpM3iivfaVfH5zjAC",
    "title": "Happy Birthday Party",
    "url": "https://media.giphy.com/media/TSpM3iivfaVfH5zjAC/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "happy",
      "birthday",
      "party",
      "cumpleanos",
      "felicidades",
      "feliz",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-J4DdfWddCHgvvnhiq9",
    "title": "Celebrate Yahoo",
    "url": "https://media.giphy.com/media/J4DdfWddCHgvvnhiq9/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "celebrate",
      "yahoo",
      "kool",
      "gang",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-RDbZGZ3O0UmL6",
    "title": "Celebrate Dj Khaled",
    "url": "https://media.giphy.com/media/RDbZGZ3O0UmL6/giphy.gif",
    "type": "gif",
    "category": "Celebration",
    "tags": [
      "celebrate",
      "khaled",
      "like",
      "celebration"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-pVWuLuV1JESZJdebkI",
    "title": "Manga Smile",
    "url": "https://media.giphy.com/media/pVWuLuV1JESZJdebkI/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "manga",
      "smile",
      "anime",
      "webtoon"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-qb1eHxhUHLdsc",
    "title": "Hunter X Hunter",
    "url": "https://media.giphy.com/media/qb1eHxhUHLdsc/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "hunter",
      "hxh",
      "killua",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-4ilFRqgbzbx4c",
    "title": "Cowboy bebop smoking",
    "url": "https://media.giphy.com/media/4ilFRqgbzbx4c/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "cowboy",
      "bebop",
      "smoking",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-IKFVtPf8jP6KJH16dB",
    "title": "Chainsaw Man",
    "url": "https://media.giphy.com/media/IKFVtPf8jP6KJH16dB/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "chainsaw",
      "man",
      "anime",
      "reze"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-SnVZO1N0Wo6u4",
    "title": "Oreki houtarou",
    "url": "https://media.giphy.com/media/SnVZO1N0Wo6u4/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "oreki",
      "houtarou",
      "hyouka",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-d0JPBhiwCm6Kk",
    "title": "Screaming Sailor Moon",
    "url": "https://media.giphy.com/media/d0JPBhiwCm6Kk/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "screaming",
      "sailor",
      "moon",
      "scream",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-CSpeNUBGowX81pnnFh",
    "title": "Feet Foor",
    "url": "https://media.giphy.com/media/CSpeNUBGowX81pnnFh/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "feet",
      "foor",
      "anime",
      "roshidere",
      "alya",
      "sometimes",
      "hides",
      "her",
      "feelings",
      "russian"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-ZolyYstgSZoq3uiLmP",
    "title": "Dance Dancing",
    "url": "https://media.giphy.com/media/ZolyYstgSZoq3uiLmP/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "dance",
      "dancing",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-zkppEMFvRX5FC",
    "title": "Sora anime love",
    "url": "https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "sora",
      "anime",
      "love",
      "haru"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-yMocMAF7vTfEKGPwVB",
    "title": "Pink Love",
    "url": "https://media.giphy.com/media/yMocMAF7vTfEKGPwVB/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "pink",
      "love",
      "vtuber",
      "vshojo",
      "ironmouse",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-jh7F7XwHTywg85ekdl",
    "title": "Demonslayer Kimetsunoyaiba",
    "url": "https://media.giphy.com/media/jh7F7XwHTywg85ekdl/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "demonslayer",
      "kimetsunoyaiba",
      "KonnichiwaFestival",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-11YMFLRM0gWZ1u",
    "title": "Uzumaki naruto eyes",
    "url": "https://media.giphy.com/media/11YMFLRM0gWZ1u/giphy.gif",
    "type": "gif",
    "category": "Anime",
    "tags": [
      "uzumaki",
      "naruto",
      "eyes",
      "anime"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-efTCy9loCBqne",
    "title": "EfTCy9loCBqne",
    "url": "https://media.giphy.com/media/efTCy9loCBqne/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "eftcy9locbqne",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-y0NFayaBeiWEU",
    "title": "Video Games Gamer",
    "url": "https://media.giphy.com/media/y0NFayaBeiWEU/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "games",
      "gamer",
      "videogames",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-d2Z7NqwF3yImFNHW",
    "title": "Video Games 90S",
    "url": "https://media.giphy.com/media/d2Z7NqwF3yImFNHW/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "games",
      "90s",
      "retro",
      "commercials",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-4JP1BOaWQxXlgEjCYK",
    "title": "Poop Tom",
    "url": "https://media.giphy.com/media/4JP1BOaWQxXlgEjCYK/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "poop",
      "tom",
      "gaming",
      "pearl"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-AhhGtrpj5ZxGZER5yC",
    "title": "Gamer ps4",
    "url": "https://media.giphy.com/media/AhhGtrpj5ZxGZER5yC/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "gamer",
      "ps4",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-RtdRhc7TxBxB0YAsK6",
    "title": "Video Game Fandom",
    "url": "https://media.giphy.com/media/RtdRhc7TxBxB0YAsK6/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "game",
      "fandom",
      "among",
      "computer",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-hqTguNdEoA1ooYxeog",
    "title": "Dog Puppy",
    "url": "https://media.giphy.com/media/hqTguNdEoA1ooYxeog/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "dog",
      "puppy",
      "fazeclan",
      "faze",
      "clan",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-cHqKAAIYc6sIRsHFjW",
    "title": "Video Games Gamer",
    "url": "https://media.giphy.com/media/cHqKAAIYc6sIRsHFjW/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "games",
      "gamer",
      "gfuel",
      "gaming",
      "fuel"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-fAD9SMlNWp0k84Ra1G",
    "title": "Game On Hearts",
    "url": "https://media.giphy.com/media/fAD9SMlNWp0k84Ra1G/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "game",
      "hearts",
      "shinefest",
      "festival",
      "youthx",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-14hVsVZomE4hj2",
    "title": "Video games",
    "url": "https://media.giphy.com/media/14hVsVZomE4hj2/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "games",
      "regular",
      "show",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-cNFFHJ5Ki8KBJbS2Lt",
    "title": "Gaming gamescom asia",
    "url": "https://media.giphy.com/media/cNFFHJ5Ki8KBJbS2Lt/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "gaming",
      "gamescom",
      "asia"
    ],
    "animated": true,
    "aspectRatio": 1.33
  },
  {
    "id": "gif-jow0htwvROxzepF0UZ",
    "title": "Video Games Neon",
    "url": "https://media.giphy.com/media/jow0htwvROxzepF0UZ/giphy.gif",
    "type": "gif",
    "category": "Gaming",
    "tags": [
      "video",
      "games",
      "neon",
      "lootcrate",
      "game",
      "lights",
      "gaming"
    ],
    "animated": true,
    "aspectRatio": 1.33
  }
];

export const CURATED_STICKERS: MemeItem[] = [
  {
    "id": "stk-fire",
    "title": "Lit Flame Fire",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f525.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "fire",
      "hot",
      "lit",
      "trending",
      "hype",
      "cool"
    ]
  },
  {
    "id": "stk-rocket",
    "title": "Rocket Launch",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f680.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "rocket",
      "launch",
      "ship",
      "startup",
      "growth",
      "fast"
    ]
  },
  {
    "id": "stk-sparkles",
    "title": "Magic Sparkles",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2728.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "sparkles",
      "magic",
      "shine",
      "clean",
      "new",
      "gold"
    ]
  },
  {
    "id": "stk-hundred",
    "title": "100 Points Fact",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4af.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "100",
      "score",
      "perfect",
      "fact",
      "real",
      "win"
    ]
  },
  {
    "id": "stk-party",
    "title": "Party Popper Confetti",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f389.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "party",
      "celebration",
      "confetti",
      "birthday",
      "congrats"
    ]
  },
  {
    "id": "stk-trophy",
    "title": "Golden Trophy",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3c6.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "trophy",
      "winner",
      "champion",
      "gold",
      "number 1"
    ]
  },
  {
    "id": "stk-sunglasses",
    "title": "Cool Sunglasses Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f60e.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "cool",
      "sunglasses",
      "swag",
      "boss",
      "confident"
    ]
  },
  {
    "id": "stk-laughing",
    "title": "Rolling On Floor Laughing",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f923.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "rofl",
      "laugh",
      "funny",
      "hilarious",
      "lol"
    ]
  },
  {
    "id": "stk-mindblown",
    "title": "Exploding Head Mind Blown",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f92f.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "exploding head",
      "mind blown",
      "shocked",
      "wow"
    ]
  },
  {
    "id": "stk-gaming-controller",
    "title": "Video Game Controller",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3ae.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "game",
      "controller",
      "gaming",
      "play",
      "joystick"
    ]
  },
  {
    "id": "stk-laptop-code",
    "title": "Laptop Developer Work",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4bb.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "laptop",
      "computer",
      "code",
      "work",
      "tech",
      "software"
    ]
  },
  {
    "id": "stk-warning",
    "title": "Warning Alert",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26a0.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "warning",
      "alert",
      "danger",
      "caution",
      "bug",
      "error"
    ]
  },
  {
    "id": "stk-heart-eyes",
    "title": "Heart Eyes Love",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f60d.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "heart eyes",
      "love",
      "awesome",
      "adore",
      "crush"
    ]
  },
  {
    "id": "stk-thumbs-up",
    "title": "Thumbs Up Approval",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f44d.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "thumbs up",
      "good",
      "yes",
      "approve",
      "ok",
      "great"
    ]
  },
  {
    "id": "stk-clapping",
    "title": "Clapping Hands Applause",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f44f.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "clap",
      "applause",
      "bravo",
      "great job",
      "congrats"
    ]
  },
  {
    "id": "stk-raising-hands",
    "title": "Raising Hands Praise",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f64c.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "praise",
      "celebrate",
      "hands",
      "hooray",
      "cheer"
    ]
  },
  {
    "id": "stk-biceps",
    "title": "Strong Flexed Biceps",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4aa.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "muscle",
      "flex",
      "strong",
      "power",
      "fitness",
      "workout"
    ]
  },
  {
    "id": "stk-thinking",
    "title": "Thinking Questioning Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f914.svg",
    "type": "sticker",
    "category": "Confused",
    "tags": [
      "thinking",
      "hmm",
      "question",
      "ponder",
      "wonder"
    ]
  },
  {
    "id": "stk-crown",
    "title": "Golden Royal Crown",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f451.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "crown",
      "king",
      "queen",
      "royal",
      "winner",
      "vip",
      "gold"
    ]
  },
  {
    "id": "stk-money-bag",
    "title": "Money Dollar Bag",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4b0.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "money",
      "cash",
      "dollars",
      "wealth",
      "revenue",
      "rich"
    ]
  },
  {
    "id": "stk-cash-wings",
    "title": "Flying Cash Wings",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4b8.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "money",
      "cash",
      "spend",
      "flying",
      "loss",
      "crypto"
    ]
  },
  {
    "id": "stk-diamond",
    "title": "Sparkling Diamond Gem",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f48e.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "diamond",
      "gem",
      "rare",
      "shiny",
      "precious",
      "hands"
    ]
  },
  {
    "id": "stk-lightbulb",
    "title": "Light Bulb Bright Idea",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a1.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "idea",
      "lightbulb",
      "eureka",
      "smart",
      "solution",
      "inspiration"
    ]
  },
  {
    "id": "stk-target",
    "title": "Bullseye Direct Target",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3af.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "target",
      "bullseye",
      "goal",
      "accurate",
      "focus",
      "hit"
    ]
  },
  {
    "id": "stk-eyes",
    "title": "Sneaky Looking Eyes",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f440.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "eyes",
      "look",
      "watching",
      "sneaky",
      "curious",
      "see"
    ]
  },
  {
    "id": "stk-star-struck",
    "title": "Star Struck Grin",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f929.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "star",
      "amazed",
      "star struck",
      "wow",
      "fan",
      "excited"
    ]
  },
  {
    "id": "stk-party-face",
    "title": "Party Horn Celebration Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f973.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "party",
      "celebrate",
      "birthday",
      "festive",
      "fun",
      "cheer"
    ]
  },
  {
    "id": "stk-tears-joy",
    "title": "Tears of Joy Laughing",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f602.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "laugh",
      "tears",
      "joy",
      "funny",
      "hilarious",
      "crying laugh"
    ]
  },
  {
    "id": "stk-crying-loudly",
    "title": "Loud Crying Tears",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f62d.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "crying",
      "tears",
      "sad",
      "emotional",
      "loud",
      "drama"
    ]
  },
  {
    "id": "stk-screaming-fear",
    "title": "Shocked Screaming Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f631.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "scream",
      "shocked",
      "fear",
      "omg",
      "panic",
      "unbelievable"
    ]
  },
  {
    "id": "stk-nerd-face",
    "title": "Nerd Geek Glasses",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f913.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "nerd",
      "geek",
      "glasses",
      "smart",
      "coding",
      "technician"
    ]
  },
  {
    "id": "stk-alien-retro",
    "title": "Retro Arcade Space Invader",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f47e.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "arcade",
      "alien",
      "retro",
      "pixel",
      "gaming",
      "space invaders"
    ]
  },
  {
    "id": "stk-ghost",
    "title": "Playful Ghost",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f47b.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "ghost",
      "spooky",
      "boo",
      "cute",
      "halloween"
    ]
  },
  {
    "id": "stk-siren",
    "title": "Emergency Alert Siren",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f6a8.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "siren",
      "police",
      "alert",
      "emergency",
      "urgent",
      "breaking"
    ]
  },
  {
    "id": "stk-check-mark",
    "title": "Green Check Mark Completed",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2705.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "check",
      "done",
      "completed",
      "success",
      "verified",
      "true"
    ]
  },
  {
    "id": "stk-collision-pow",
    "title": "Comic Boom POW Collision",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a5.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "boom",
      "collision",
      "pow",
      "explosion",
      "impact",
      "drama"
    ]
  },
  {
    "id": "stk-medal-first",
    "title": "First Place 1st Gold Medal",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f947.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "medal",
      "first place",
      "gold",
      "winner",
      "champion",
      "award"
    ]
  },
  {
    "id": "stk-popcorn",
    "title": "Movie Theater Popcorn",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f37f.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "popcorn",
      "movie",
      "drama",
      "snack",
      "watching",
      "film"
    ]
  },
  {
    "id": "stk-coffee",
    "title": "Hot Steaming Coffee Mug",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2615.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "coffee",
      "tea",
      "mug",
      "caffeine",
      "morning",
      "work",
      "break"
    ]
  },
  {
    "id": "stk-shushing",
    "title": "Shushing Quiet Secret Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f92b.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "shh",
      "quiet",
      "secret",
      "silent",
      "hush",
      "whisper"
    ]
  },
  {
    "id": "stk-peace-sign",
    "title": "Victory Peace Hand Sign",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/270c.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "peace",
      "victory",
      "two",
      "cool",
      "hand",
      "chill"
    ]
  },
  {
    "id": "stk-beer-toast",
    "title": "Clinking Beer Mugs Cheers",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f37b.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "cheers",
      "beer",
      "toast",
      "drinks",
      "celebrate",
      "party"
    ]
  },
  {
    "id": "stk-squinting-laugh",
    "title": "Squinting Big Laugh",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f606.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "laugh",
      "lol",
      "haha",
      "funny",
      "hilarious"
    ]
  },
  {
    "id": "stk-kissing-heart",
    "title": "Blowing a Kiss",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f618.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "kiss",
      "love",
      "romance",
      "blow kiss",
      "affection"
    ]
  },
  {
    "id": "stk-clown-face",
    "title": "Circus Clown Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f921.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "clown",
      "fool",
      "circus",
      "silly",
      "joke"
    ]
  },
  {
    "id": "stk-raised-eyebrow",
    "title": "Suspicious Raised Eyebrow",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f928.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "suspicious",
      "doubt",
      "eyebrow",
      "the rock",
      "really"
    ]
  },
  {
    "id": "stk-winking-tongue",
    "title": "Crazy Winking Tongue",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f61c.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "crazy",
      "tongue",
      "wink",
      "party",
      "goofy",
      "silly"
    ]
  },
  {
    "id": "stk-grinning-sweat",
    "title": "Grinning Sweat Relief",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f605.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "sweat",
      "relief",
      "close call",
      "whew",
      "happy"
    ]
  },
  {
    "id": "stk-yum-tongue",
    "title": "Savoring Delicious Food",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f60b.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "yum",
      "delicious",
      "tasty",
      "food",
      "lick"
    ]
  },
  {
    "id": "stk-hearts-smiling",
    "title": "Smiling with 3 Hearts",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f970.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "love",
      "hearts",
      "adore",
      "crush",
      "sweet"
    ]
  },
  {
    "id": "stk-smiling-eyes",
    "title": "Smiling Blush",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f60a.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "blush",
      "smile",
      "warm",
      "cute",
      "kind"
    ]
  },
  {
    "id": "stk-money-face",
    "title": "Money Mouth Dollar Tongue",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f911.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "money",
      "cash",
      "rich",
      "dollars",
      "wealth",
      "profit"
    ]
  },
  {
    "id": "stk-hugging-face",
    "title": "Hugging Open Hands",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f917.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "hug",
      "warmth",
      "kind",
      "welcome",
      "care"
    ]
  },
  {
    "id": "stk-zany-face",
    "title": "Zany Wild Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f92a.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "zany",
      "wild",
      "crazy",
      "goofy",
      "party",
      "derp"
    ]
  },
  {
    "id": "stk-grinning-big",
    "title": "Grinning Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f600.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "grin",
      "smile",
      "happy",
      "joy",
      "cheerful"
    ]
  },
  {
    "id": "stk-winking-face",
    "title": "Winking Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f609.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "wink",
      "flirt",
      "playful",
      "joke",
      "secret"
    ]
  },
  {
    "id": "stk-halo-angel",
    "title": "Smiling Angel Halo",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f607.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "angel",
      "halo",
      "innocent",
      "good",
      "pure"
    ]
  },
  {
    "id": "stk-smirking-face",
    "title": "Smirking Cunning",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f60f.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "smirk",
      "cunning",
      "sneaky",
      "gotcha",
      "clever"
    ]
  },
  {
    "id": "stk-neutral-face",
    "title": "Neutral Poker Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f610.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "neutral",
      "meh",
      "expressionless",
      "whatever",
      "okay"
    ]
  },
  {
    "id": "stk-pleading-face",
    "title": "Pleading Puppy Eyes",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f97a.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "pleading",
      "puppy eyes",
      "begging",
      "sad",
      "cute",
      "please"
    ]
  },
  {
    "id": "stk-hot-face",
    "title": "Sweating Red Hot Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f975.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "hot",
      "sweat",
      "summer",
      "heat",
      "fever"
    ]
  },
  {
    "id": "stk-grimacing-awkward",
    "title": "Grimacing Awkward Oof",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f62c.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "grimace",
      "awkward",
      "oof",
      "cringe",
      "yikes"
    ]
  },
  {
    "id": "stk-rolling-eyes",
    "title": "Face with Rolling Eyes",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f644.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "eye roll",
      "annoyed",
      "whatever",
      "bored",
      "sarcastic"
    ]
  },
  {
    "id": "stk-zipper-mouth",
    "title": "Zipper Mouth Secret",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f910.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "zipper",
      "silent",
      "secret",
      "shut up",
      "confidential"
    ]
  },
  {
    "id": "stk-cold-freeze",
    "title": "Freezing Ice Cold Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f976.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "cold",
      "freeze",
      "ice",
      "winter",
      "chilly"
    ]
  },
  {
    "id": "stk-monocle-curious",
    "title": "Monocle Inspecting",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f9d0.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "monocle",
      "inspect",
      "curious",
      "fancy",
      "detective"
    ]
  },
  {
    "id": "stk-dizzy-face",
    "title": "Knocked Out Dizzy Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f635.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "dizzy",
      "knockout",
      "passed out",
      "swirl",
      "defeated"
    ]
  },
  {
    "id": "stk-woozy-dizzy",
    "title": "Woozy Intoxicated Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f974.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "woozy",
      "dizzy",
      "drunk",
      "tipsy",
      "confused"
    ]
  },
  {
    "id": "stk-sleeping-face",
    "title": "Sleeping Zzz Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f634.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "sleep",
      "tired",
      "zzz",
      "bedtime",
      "exhausted"
    ]
  },
  {
    "id": "stk-disappointed",
    "title": "Disappointed Downcast",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f61e.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "disappointed",
      "sad",
      "unhappy",
      "down",
      "bummer"
    ]
  },
  {
    "id": "stk-drooling-face",
    "title": "Drooling Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f924.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "drool",
      "craving",
      "sleep",
      "want",
      "hungry"
    ]
  },
  {
    "id": "stk-cowboy-hat",
    "title": "Cowboy Hat Yeee-haw",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f920.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "cowboy",
      "yeehaw",
      "western",
      "rodeo",
      "adventure"
    ]
  },
  {
    "id": "stk-pensive-sorrow",
    "title": "Pensive Sad Reflection",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f614.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "pensive",
      "regret",
      "depressed",
      "sorrow",
      "alone"
    ]
  },
  {
    "id": "stk-robot-vintage",
    "title": "Vintage Android Robot",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f916.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "robot",
      "bot",
      "ai",
      "tech",
      "android",
      "scifi"
    ]
  },
  {
    "id": "stk-ok-hand",
    "title": "OK Perfect Hand Sign",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f44c.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "ok",
      "perfect",
      "good",
      "deal",
      "nice"
    ]
  },
  {
    "id": "stk-skull-bone",
    "title": "Skeleton Skull Dead",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f480.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "skull",
      "dead",
      "dying laughing",
      "rip",
      "creepy"
    ]
  },
  {
    "id": "stk-pile-poo",
    "title": "Smiling Pile of Poo",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a9.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "poo",
      "shit",
      "funny",
      "crap",
      "smile"
    ]
  },
  {
    "id": "stk-symbols-cursing",
    "title": "Cursing Swearing Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f92c.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "curse",
      "swear",
      "profanity",
      "furious",
      "angry",
      "censored"
    ]
  },
  {
    "id": "stk-steam-nose",
    "title": "Face with Steam Nose",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f624.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "steam",
      "huff",
      "frustrated",
      "determined",
      "fuming"
    ]
  },
  {
    "id": "stk-angry-pout",
    "title": "Enraged Red Pouting Face",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f621.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "angry",
      "rage",
      "furious",
      "mad",
      "red"
    ]
  },
  {
    "id": "stk-tear-single",
    "title": "Smiling with Single Tear",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f972.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "tear",
      "bittersweet",
      "brave",
      "sad smile",
      "touching"
    ]
  },
  {
    "id": "stk-crossed-fingers",
    "title": "Crossed Fingers Luck",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f91e.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "luck",
      "wish",
      "hope",
      "fingers crossed",
      "pray"
    ]
  },
  {
    "id": "stk-devil-horns",
    "title": "Smiling Purple Devil",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f608.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "devil",
      "mischief",
      "evil",
      "demon",
      "horns"
    ]
  },
  {
    "id": "stk-worried-face",
    "title": "Worried Anxious",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f61f.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "worried",
      "nervous",
      "anxious",
      "scared",
      "stress"
    ]
  },
  {
    "id": "stk-love-gesture",
    "title": "I Love You Hand Sign",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f91f.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "love you",
      "hand",
      "gesture",
      "affection",
      "sign"
    ]
  },
  {
    "id": "stk-pinching-hand",
    "title": "Pinching Small Amount",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f90f.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "pinch",
      "tiny",
      "small",
      "little bit",
      "close"
    ]
  },
  {
    "id": "stk-pinched-fingers",
    "title": "Pinched Italian Fingers",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f90c.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "italian",
      "chef kiss",
      "what do you mean",
      "gesture",
      "pasta"
    ]
  },
  {
    "id": "stk-high-voltage",
    "title": "High Voltage Lightning Bolt",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26a1.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "lightning",
      "bolt",
      "electric",
      "power",
      "energy",
      "shock"
    ]
  },
  {
    "id": "stk-thumbs-down",
    "title": "Thumbs Down Dislike",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f44e.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "dislike",
      "bad",
      "boo",
      "thumbs down",
      "fail"
    ]
  },
  {
    "id": "stk-handshake",
    "title": "Partnership Handshake",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f91d.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "handshake",
      "deal",
      "agree",
      "partner",
      "business",
      "collab"
    ]
  },
  {
    "id": "stk-point-right",
    "title": "Index Pointing Right",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f449.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "point",
      "right",
      "look",
      "direction",
      "this"
    ]
  },
  {
    "id": "stk-red-heart",
    "title": "Classic Red Heart",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2764.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "heart",
      "love",
      "red",
      "like",
      "passion"
    ]
  },
  {
    "id": "stk-call-me",
    "title": "Call Me Shaka Hand",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f919.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "call me",
      "shaka",
      "chill",
      "hang loose",
      "surfer"
    ]
  },
  {
    "id": "stk-point-down",
    "title": "Index Pointing Down",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f447.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "point down",
      "below",
      "check this",
      "under"
    ]
  },
  {
    "id": "stk-point-up",
    "title": "Index Pointing Up",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f446.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "point up",
      "above",
      "this",
      "look up",
      "first"
    ]
  },
  {
    "id": "stk-sweat-drops",
    "title": "Splashing Sweat Drops",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a6.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "sweat",
      "water",
      "splash",
      "effort",
      "work"
    ]
  },
  {
    "id": "stk-sparkling-heart",
    "title": "Sparkling Glitter Heart",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f496.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "sparkle heart",
      "glitter",
      "love",
      "shine",
      "glow"
    ]
  },
  {
    "id": "stk-dizzy-stars",
    "title": "Dizzy Swirling Star",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4ab.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "dizzy",
      "stars",
      "sparkle",
      "cartoon",
      "whirl"
    ]
  },
  {
    "id": "stk-waving-hand",
    "title": "Waving Hello Hand",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f44b.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "wave",
      "hello",
      "hi",
      "bye",
      "goodbye",
      "greeting"
    ]
  },
  {
    "id": "stk-point-left",
    "title": "Index Pointing Left",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f448.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "point",
      "left",
      "look",
      "direction",
      "there"
    ]
  },
  {
    "id": "stk-rock-on",
    "title": "Sign of the Horns Rock On",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f918.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "rock",
      "metal",
      "heavy metal",
      "party",
      "horns",
      "music"
    ]
  },
  {
    "id": "stk-broken-heart",
    "title": "Broken Heart Brokenhearted",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f494.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "broken heart",
      "heartbreak",
      "sad",
      "grief",
      "breakup"
    ]
  },
  {
    "id": "stk-speech-bubble",
    "title": "Speech Bubble Talk",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4ac.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "speech",
      "bubble",
      "talk",
      "dialogue",
      "chat",
      "message"
    ]
  },
  {
    "id": "stk-rainbow-arc",
    "title": "Vibrant Rainbow Arc",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f308.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "rainbow",
      "colors",
      "pride",
      "sky",
      "hope"
    ]
  },
  {
    "id": "stk-question-mark",
    "title": "Red Question Mark Confused",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2753.svg",
    "type": "sticker",
    "category": "Confused",
    "tags": [
      "question",
      "what",
      "why",
      "confused",
      "help"
    ]
  },
  {
    "id": "stk-thought-bubble",
    "title": "Cloud Thought Bubble",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4ad.svg",
    "type": "sticker",
    "category": "Confused",
    "tags": [
      "thought",
      "bubble",
      "think",
      "idea",
      "dream"
    ]
  },
  {
    "id": "stk-desktop-computer",
    "title": "Desktop Monitor PC",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f5a5.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "pc",
      "monitor",
      "screen",
      "computer",
      "desk"
    ]
  },
  {
    "id": "stk-gold-star",
    "title": "Five Point Gold Star",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2b50.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "star",
      "gold",
      "favorite",
      "best",
      "winner"
    ]
  },
  {
    "id": "stk-red-cross",
    "title": "Red Cross Mark Rejected",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/274c.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "cross",
      "no",
      "wrong",
      "false",
      "reject",
      "fail"
    ]
  },
  {
    "id": "stk-gear-settings",
    "title": "Settings Cog Gear",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2699.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "gear",
      "settings",
      "config",
      "engine",
      "system",
      "tools"
    ]
  },
  {
    "id": "stk-anger-symbol",
    "title": "Comic Vein Anger Symbol",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a2.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "anger",
      "vein",
      "mad",
      "anime",
      "frustrated"
    ]
  },
  {
    "id": "stk-dash-run",
    "title": "Dashing Away Dust Wind",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a8.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "dash",
      "speed",
      "fast",
      "run",
      "hurry",
      "quick"
    ]
  },
  {
    "id": "stk-exclamation-mark",
    "title": "Red Exclamation Point Alert",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2757.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "exclamation",
      "alert",
      "attention",
      "urgent",
      "important"
    ]
  },
  {
    "id": "stk-stop-sign",
    "title": "Octagonal Red Stop Sign",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f6d1.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "stop",
      "halt",
      "danger",
      "pause",
      "wait"
    ]
  },
  {
    "id": "stk-zzz-sleep",
    "title": "Zzz Sleeping Sign",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a4.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "zzz",
      "sleep",
      "tired",
      "bored",
      "nap"
    ]
  },
  {
    "id": "stk-shooting-star",
    "title": "Shooting Wish Star",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f320.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "shooting star",
      "wish",
      "space",
      "magic",
      "night"
    ]
  },
  {
    "id": "stk-mobile-phone",
    "title": "Smartphone Mobile Device",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4f1.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "phone",
      "mobile",
      "call",
      "screen",
      "app"
    ]
  },
  {
    "id": "stk-calendar-date",
    "title": "Tear-off Calendar Deadline",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4c5.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "calendar",
      "date",
      "schedule",
      "deadline",
      "event"
    ]
  },
  {
    "id": "stk-chart-up",
    "title": "Chart Increasing Green Stonks",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4c8.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "chart",
      "stonks",
      "growth",
      "profit",
      "stocks",
      "gain"
    ]
  },
  {
    "id": "stk-memo-clipboard",
    "title": "Memo Document Note",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4dd.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "memo",
      "pencil",
      "write",
      "notes",
      "todo",
      "task"
    ]
  },
  {
    "id": "stk-megaphone-alert",
    "title": "Cheering Megaphone Bullhorn",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4e3.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "megaphone",
      "loud",
      "announcement",
      "shout",
      "news"
    ]
  },
  {
    "id": "stk-lock-secure",
    "title": "Locked Padlock Security",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f512.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "lock",
      "secure",
      "safe",
      "privacy",
      "password"
    ]
  },
  {
    "id": "stk-hammer-wrench",
    "title": "Hammer and Wrench Tools",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f6e0.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "tools",
      "fix",
      "repair",
      "build",
      "developer"
    ]
  },
  {
    "id": "stk-joystick-arcade",
    "title": "Classic Arcade Joystick",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f579.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "joystick",
      "arcade",
      "game",
      "retro",
      "play"
    ]
  },
  {
    "id": "stk-briefcase-work",
    "title": "Professional Briefcase",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4bc.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "briefcase",
      "business",
      "work",
      "job",
      "career"
    ]
  },
  {
    "id": "stk-crystal-ball",
    "title": "Magic Fortune Crystal Ball",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f52e.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "magic",
      "crystal ball",
      "future",
      "wizard",
      "fortune"
    ]
  },
  {
    "id": "stk-bomb-fuse",
    "title": "Ticking Fuse Bomb",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a3.svg",
    "type": "sticker",
    "category": "Angry",
    "tags": [
      "bomb",
      "explosive",
      "danger",
      "kaboom",
      "fuse"
    ]
  },
  {
    "id": "stk-chart-down",
    "title": "Chart Decreasing Loss",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4c9.svg",
    "type": "sticker",
    "category": "Sad",
    "tags": [
      "chart",
      "crash",
      "loss",
      "stocks",
      "down",
      "market"
    ]
  },
  {
    "id": "stk-bell-notification",
    "title": "Notification Golden Bell",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f514.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "bell",
      "notification",
      "ring",
      "alert",
      "subscribe"
    ]
  },
  {
    "id": "stk-magnifier-search",
    "title": "Magnifying Glass Search",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f50d.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "search",
      "detective",
      "find",
      "zoom",
      "inspect"
    ]
  },
  {
    "id": "stk-key-access",
    "title": "Golden Key Unlock",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f511.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "key",
      "unlock",
      "access",
      "solution",
      "secret"
    ]
  },
  {
    "id": "stk-game-die",
    "title": "Game Die Dice Rolling",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3b2.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "dice",
      "random",
      "board game",
      "roll",
      "rpg",
      "chance"
    ]
  },
  {
    "id": "stk-sparkler-firework",
    "title": "Glow Sparkler Wand",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f387.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "sparkler",
      "firework",
      "celebration",
      "festive",
      "glow"
    ]
  },
  {
    "id": "stk-soccer-ball",
    "title": "Classic Soccer Football",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26bd.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "soccer",
      "football",
      "goal",
      "fifa",
      "sport"
    ]
  },
  {
    "id": "stk-headphones-music",
    "title": "Studio Audio Headphones",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3a7.svg",
    "type": "sticker",
    "category": "Work",
    "tags": [
      "headphones",
      "music",
      "audio",
      "listen",
      "beats"
    ]
  },
  {
    "id": "stk-clapperboard",
    "title": "Director Film Clapperboard",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3ac.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "clapperboard",
      "movie",
      "film",
      "cinema",
      "action",
      "video"
    ]
  },
  {
    "id": "stk-artist-palette",
    "title": "Artist Color Palette",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3a8.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "paint",
      "art",
      "creative",
      "design",
      "color"
    ]
  },
  {
    "id": "stk-balloon-red",
    "title": "Floating Festive Balloon",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f388.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "balloon",
      "birthday",
      "party",
      "fly",
      "fun"
    ]
  },
  {
    "id": "stk-musical-notes",
    "title": "Multiple Musical Notes",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3b6.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "music",
      "notes",
      "melody",
      "song",
      "tune"
    ]
  },
  {
    "id": "stk-microphone-studio",
    "title": "Vocal Recording Microphone",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3a4.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "mic",
      "sing",
      "karaoke",
      "podcast",
      "audio",
      "stage"
    ]
  },
  {
    "id": "stk-boxing-glove",
    "title": "Red Boxing Glove Knockout",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f94a.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "boxing",
      "glove",
      "fight",
      "punch",
      "ko",
      "knockout"
    ]
  },
  {
    "id": "stk-confetti-ball",
    "title": "Confetti Ball Burst",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f38a.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "confetti",
      "burst",
      "party",
      "winner",
      "congrats"
    ]
  },
  {
    "id": "stk-magic-wand",
    "title": "Magic Sparkle Wand",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1fa84.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "magic",
      "wand",
      "wizard",
      "spell",
      "miracle"
    ]
  },
  {
    "id": "stk-electric-guitar",
    "title": "Red Electric Guitar",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3b8.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "guitar",
      "rock",
      "music",
      "instrument",
      "band"
    ]
  },
  {
    "id": "stk-birthday-cake",
    "title": "Frosted Birthday Cake",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f382.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "cake",
      "birthday",
      "candles",
      "celebrate",
      "sweet"
    ]
  },
  {
    "id": "stk-bronze-medal",
    "title": "Third Place 3rd Bronze Medal",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f949.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "bronze",
      "medal",
      "third",
      "podium",
      "honor"
    ]
  },
  {
    "id": "stk-silver-medal",
    "title": "Second Place 2nd Silver Medal",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f948.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "silver",
      "medal",
      "second",
      "winner",
      "runner up"
    ]
  },
  {
    "id": "stk-tasty-burger",
    "title": "Juicy Cheeseburger",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f354.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "burger",
      "food",
      "fast food",
      "snack",
      "tasty"
    ]
  },
  {
    "id": "stk-basketball-hoop",
    "title": "Orange Basketball",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3c0.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "basketball",
      "nba",
      "dunk",
      "slam",
      "sport"
    ]
  },
  {
    "id": "stk-donut-sprinkles",
    "title": "Sweet Frosted Donut",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f369.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "donut",
      "sweet",
      "treat",
      "sugar",
      "snack"
    ]
  },
  {
    "id": "stk-ice-cream",
    "title": "Swirl Soft Ice Cream",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f366.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "ice cream",
      "summer",
      "sweet",
      "cone",
      "vanilla"
    ]
  },
  {
    "id": "stk-lion-king",
    "title": "Brave Lion King",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f981.svg",
    "type": "sticker",
    "category": "Success",
    "tags": [
      "lion",
      "brave",
      "strong",
      "king",
      "beast",
      "roar"
    ]
  },
  {
    "id": "stk-taco-crunchy",
    "title": "Crunchy Fiesta Taco",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f32e.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "taco",
      "mexican",
      "fiesta",
      "food",
      "crunchy"
    ]
  },
  {
    "id": "stk-dog-face",
    "title": "Friendly Puppy Dog",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f436.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "dog",
      "puppy",
      "cute",
      "pet",
      "friend"
    ]
  },
  {
    "id": "stk-cocktail-glass",
    "title": "Chilled Cocktail Martini",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f378.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "cocktail",
      "martini",
      "drinks",
      "party",
      "lounge"
    ]
  },
  {
    "id": "stk-slice-pizza",
    "title": "Hot Cheesy Pizza Slice",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f355.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "pizza",
      "cheese",
      "food",
      "party",
      "delicious"
    ]
  },
  {
    "id": "stk-cookie-chocolate",
    "title": "Chocolate Chip Cookie",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f36a.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "cookie",
      "chocolate",
      "sweet",
      "baked",
      "snack"
    ]
  },
  {
    "id": "stk-french-fries",
    "title": "Crispy French Fries",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f35f.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "fries",
      "potato",
      "snack",
      "fast food",
      "chips"
    ]
  },
  {
    "id": "stk-champagne-cheers",
    "title": "Clinking Champagne Glasses",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f942.svg",
    "type": "sticker",
    "category": "Celebration",
    "tags": [
      "champagne",
      "cheers",
      "luxury",
      "toast",
      "congrats"
    ]
  },
  {
    "id": "stk-bubble-tea",
    "title": "Boba Milk Bubble Tea",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f9cb.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "boba",
      "tea",
      "bubble tea",
      "tapioca",
      "drink"
    ]
  },
  {
    "id": "stk-fox-clever",
    "title": "Clever Orange Fox",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f98a.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "fox",
      "clever",
      "smart",
      "sly",
      "cute"
    ]
  },
  {
    "id": "stk-cat-face",
    "title": "Cute Kitty Cat",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f431.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "cat",
      "kitty",
      "cute",
      "meow",
      "kitten"
    ]
  },
  {
    "id": "stk-airplane-fly",
    "title": "Jet Airplane Flying",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2708.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "plane",
      "travel",
      "flight",
      "trip",
      "vacation"
    ]
  },
  {
    "id": "stk-dragon-fire",
    "title": "Fierce Mythical Dragon",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f409.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "dragon",
      "fire",
      "mythical",
      "monster",
      "power"
    ]
  },
  {
    "id": "stk-monkey-hear",
    "title": "Hear-No-Evil Monkey",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f648.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "monkey",
      "hear no evil",
      "gossip",
      "funny",
      "shy"
    ]
  },
  {
    "id": "stk-sun-bright",
    "title": "Radiant Sunny Day",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2600.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "sun",
      "sunny",
      "bright",
      "warm",
      "day"
    ]
  },
  {
    "id": "stk-moon-crescent",
    "title": "Night Crescent Moon",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f319.svg",
    "type": "sticker",
    "category": "Reaction",
    "tags": [
      "moon",
      "night",
      "stars",
      "sleep",
      "dark"
    ]
  },
  {
    "id": "stk-ocean-wave",
    "title": "Surfing Ocean Wave",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f30a.svg",
    "type": "sticker",
    "category": "Trending",
    "tags": [
      "wave",
      "ocean",
      "sea",
      "tsunami",
      "surf"
    ]
  },
  {
    "id": "stk-cherry-blossom",
    "title": "Pink Cherry Blossom Sakura",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f338.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "sakura",
      "cherry blossom",
      "flower",
      "spring",
      "japan"
    ]
  },
  {
    "id": "stk-monkey-see",
    "title": "See-No-Evil Monkey",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f649.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "monkey",
      "see no evil",
      "oops",
      "hiding",
      "cute"
    ]
  },
  {
    "id": "stk-monkey-speak",
    "title": "Speak-No-Evil Monkey",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f64a.svg",
    "type": "sticker",
    "category": "Funny",
    "tags": [
      "monkey",
      "speak no evil",
      "quiet",
      "shh",
      "oops"
    ]
  },
  {
    "id": "stk-unicorn-magic",
    "title": "Magical Unicorn Horn",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f984.svg",
    "type": "sticker",
    "category": "Anime",
    "tags": [
      "unicorn",
      "magic",
      "fantasy",
      "rainbow",
      "startup"
    ]
  },
  {
    "id": "stk-panda-bear",
    "title": "Chilling Giant Panda",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f43c.svg",
    "type": "sticker",
    "category": "Happy",
    "tags": [
      "panda",
      "chill",
      "cute",
      "bear",
      "bamboo"
    ]
  },
  {
    "id": "stk-ufo-saucer",
    "title": "Extraterrestrial Alien UFO",
    "url": "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f6f8.svg",
    "type": "sticker",
    "category": "Gaming",
    "tags": [
      "ufo",
      "alien",
      "space",
      "scifi",
      "flying saucer"
    ]
  }
];
