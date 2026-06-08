// Shared data for WinUCard Drop

window.WUC = {
  brand: {
    name: "WinUCard",
    tagline: "The UK's premium skill-based card competition platform."
  },
  nav: [
    { label: "Competitions", route: "/competitions" },
    { label: "How It Works", route: "/how-it-works" },
    { label: "FAQ", route: "/faq" },
    { label: "About", route: "/about" },
    { label: "Contact", route: "/contact" }
  ],
  competitions: [
    {
      slug: "charizard-psa-10-base-set-1st-edition",
      game: "POKEMON",
      title: "Charizard PSA 10 Base Set 1st Edition",
      short: "Charizard 1st Ed",
      value: "£150,000",
      ticket: "£9.99",
      sold: 150,
      total: "5,000",
      left: "4,850",
      status: "Open",
      img: "assets/charizard.webp",
      endIso: "2026-05-02T20:00:00Z",
      description: "A sealed-to-grade 1st Edition Shadowless Charizard holo, graded PSA 10 GEM MINT. One of the most iconic trading cards ever printed — pop count 121.",
      question: { q: "How many Pokémon are in the original Base Set?", options: ["102", "151", "121", "100"], answer: 0 },
      details: [
        { k: "Year", v: "1999" },
        { k: "Set", v: "Base Set — 1st Edition Shadowless" },
        { k: "Grade", v: "PSA 10 GEM MINT" },
        { k: "Population", v: "121 at this grade" },
        { k: "Cert", v: "50120100" }
      ]
    },
    {
      slug: "luffy-gear-5-alt-art-op05",
      game: "ONE PIECE",
      title: "Luffy Gear 5 Alt Art OP05",
      short: "Luffy Alt Art",
      value: "£500",
      ticket: "£2.99",
      sold: 101,
      total: "500",
      left: "399",
      status: "Open",
      img: "assets/luffy.webp",
      endIso: "2026-04-25T20:00:00Z",
      description: "Red Manga Alternate Art Monkey D. Luffy, OP13 English print, PSA 10 GEM MINT. The most hunted alt-art of the modern One Piece TCG era.",
      question: { q: "What is Luffy's dream in One Piece?", options: ["Become Pirate King", "Defeat Kaido", "Find the One Piece", "Free all slaves"], answer: 0 },
      details: [
        { k: "Year", v: "2025" },
        { k: "Set", v: "One Piece OP13 EN — Red Manga Alt Art" },
        { k: "Grade", v: "PSA 10 GEM MINT" },
        { k: "Number", v: "#118" },
        { k: "Cert", v: "148012943" }
      ]
    },
    {
      slug: "lionel-messi-signed-argentina-jersey",
      game: "FOOTBALL",
      title: "Lionel Messi Signed Argentina Jersey",
      short: "Messi Signed Jersey",
      value: "£5,000",
      ticket: "£4.99",
      sold: 230,
      total: "1,000",
      left: "770",
      status: "Open",
      img: "assets/messi.webp",
      endIso: "2026-04-30T20:00:00Z",
      description: "Match-ready Argentina home jersey, signed by Lionel Messi, authenticated with official COA. Includes original frame and provenance certificate.",
      question: { q: "How many FIFA World Cups has Lionel Messi won?", options: ["0", "1", "2", "3"], answer: 1 },
      details: [
        { k: "Item", v: "Argentina home jersey" },
        { k: "Signed by", v: "Lionel Messi" },
        { k: "Authenticator", v: "Beckett Authentication" },
        { k: "COA", v: "Included" }
      ]
    },
    {
      slug: "signed-one-piece-volume-1",
      game: "MEMORABILIA",
      title: "Signed One Piece Volume 1",
      short: "Signed OP Vol. 1",
      value: "£8,000",
      ticket: "£5.99",
      sold: 45,
      total: "800",
      left: "755",
      status: "Open",
      img: "assets/luffy.webp",
      endIso: "2026-05-15T20:00:00Z",
      description: "An original signed copy of One Piece Volume 1 by Eiichiro Oda, near-mint condition, professionally authenticated.",
      question: { q: "Who created the One Piece manga?", options: ["Akira Toriyama", "Eiichiro Oda", "Masashi Kishimoto", "Tite Kubo"], answer: 1 },
      details: [
        { k: "Year", v: "1997 first print" },
        { k: "Signed by", v: "Eiichiro Oda" },
        { k: "Condition", v: "Near Mint" }
      ]
    },
    {
      slug: "pikachu-illustrator-promo",
      game: "POKEMON",
      title: "Pikachu Illustrator Promo",
      short: "Pikachu Illustrator",
      value: "£500,000",
      ticket: "£24.99",
      sold: 0,
      total: "10,000",
      left: "10,000",
      status: "Coming Soon",
      img: "assets/charizard.webp",
      endIso: "2026-06-01T20:00:00Z",
      description: "The holy grail of trading cards. One of fewer than 40 copies ever authenticated worldwide. Drops on June 1st.",
      question: { q: "What is the rarest Pokémon card in the world?", options: ["Charizard 1st Ed", "Pikachu Illustrator", "Shining Magikarp", "Blastoise Galaxy Star"], answer: 1 },
      details: [
        { k: "Year", v: "1998" },
        { k: "Awarded by", v: "CoroCoro Illustration Contest" },
        { k: "Population", v: "< 40 worldwide" }
      ]
    },
    {
      slug: "michael-jordan-natural-born-thrillers",
      game: "BASKETBALL",
      title: "Michael Jordan Natural Born Thrillers",
      short: "MJ Skybox PSA 10",
      value: "£14,500",
      ticket: "£3.99",
      sold: 462,
      total: "600",
      left: "138",
      status: "Open",
      img: "assets/jordan.webp",
      endIso: "2026-04-22T20:00:00Z",
      description: "1995 Skybox E-XL Natural Born Thrillers Michael Jordan — PSA 10 GEM MINT. Iconic mid-90s Bulls era insert card, only 34 known at this grade.",
      question: { q: "How many NBA championships did Michael Jordan win?", options: ["3", "5", "6", "7"], answer: 2 },
      details: [
        { k: "Year", v: "1995" },
        { k: "Set", v: "Skybox E-XL Natural Born Thrillers" },
        { k: "Grade", v: "PSA 10 GEM MINT" },
        { k: "Population", v: "34 at this grade" },
        { k: "Cert", v: "64309596" }
      ]
    }
  ],
  winners: [
    { date: "Apr 15, 2026", name: "Thomas D.", city: "London", card: "Charizard Base Set Shadowless", value: "£12,000", ticket: "#2847" },
    { date: "Apr 12, 2026", name: "Sofia R.", city: "Manchester", card: "Luffy Red Manga Alt Art", value: "£2,400", ticket: "#0491" },
    { date: "Apr 08, 2026", name: "Marco V.", city: "Birmingham", card: "Messi Rookie PSA 10", value: "£38,000", ticket: "#1203" },
    { date: "Apr 03, 2026", name: "Lina K.", city: "Glasgow", card: "Michael Jordan Skybox PSA 10", value: "£14,500", ticket: "#0088" },
    { date: "Mar 28, 2026", name: "Yann L.", city: "Bristol", card: "Blastoise Base Set Holo", value: "£3,200", ticket: "#3311" },
    { date: "Mar 21, 2026", name: "Ayumi T.", city: "Leeds", card: "Pikachu VMAX Rainbow", value: "£1,800", ticket: "#0907" },
    { date: "Mar 15, 2026", name: "James P.", city: "Cardiff", card: "Ronaldo Panini Rookie", value: "£9,500", ticket: "#2201" },
    { date: "Mar 08, 2026", name: "Chloe M.", city: "Edinburgh", card: "Zoro OP01 Parallel", value: "£650", ticket: "#1155" }
  ],
  faqs: [
    {
      cat: "General",
      icon: "⚖️",
      items: [
        { q: "Is WinUCard legal in the UK?", a: "Yes. WinUCard operates as a skill-based prize competition in full compliance with UK law. Every competition requires a skill question and offers a free postal entry route, as required by the Gambling Act 2005." },
        { q: "What is the minimum age to participate?", a: "You must be 18 years or older to enter any competition on WinUCard. Age verification may be required for larger prize draws." }
      ]
    },
    {
      cat: "Entering Competitions",
      icon: "🎟",
      items: [
        { q: "How do I buy tickets?", a: "Choose a live competition, select how many tickets you want, answer the skill question, and complete checkout. You can pay by card or Apple Pay." },
        { q: "What are bonus tickets?", a: "When you buy larger ticket bundles, we add free bonus tickets to your entry — for example, buy 10 tickets and receive 2 extra." },
        { q: "Is there a free entry route?", a: "Yes. UK law requires every competition to offer a free postal entry route. Send a handwritten entry to our registered address — full details on the Competition Rules page." }
      ]
    },
    {
      cat: "Draws & Winners",
      icon: "🏆",
      items: [
        { q: "How is the winner selected?", a: "Every competition uses certified Random Number Generation (RNG). Draws are streamed live on our socials, and the winning ticket number is published publicly on the competition page." },
        { q: "When does the draw take place?", a: "Either when all tickets sell out, or at the scheduled end date — whichever comes first. You'll see the countdown on every competition card." }
      ]
    },
    {
      cat: "Account & Payments",
      icon: "👤",
      items: [
        { q: "How do I create an account?", a: "Click Sign Up, fill in your details, verify your email. It takes about 60 seconds." },
        { q: "I forgot my password. How can I reset it?", a: "On the login page, click Forgot password and enter your email. We'll send you a reset link." },
        { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, Apple Pay and Google Pay. All payments are processed securely through Stripe." }
      ]
    }
  ],
  footer: {
    platform: [
      { label: "Competitions", route: "/competitions" },
      { label: "How It Works", route: "/how-it-works" },
      { label: "FAQ", route: "/faq" }
    ],
    support: [
      { label: "Contact Us", route: "/contact" },
      { label: "Delivery Info", route: "/how-it-works" },
      { label: "Responsible Play", route: "/competition-rules" }
    ],
    legal: [
      { label: "Terms & Conditions", route: "/terms" },
      { label: "Privacy Policy", route: "/privacy" },
      { label: "Cookie Policy", route: "/cookies" }
    ],
    socials: ["TikTok", "Instagram", "YouTube", "Discord"]
  }
};
