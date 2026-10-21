import { getVerse } from "@/data/bible";
import { extractReferences } from "@/lib/scriptureRefs";

/**
 * Topical devotionals — short, offline studies on a single theme.
 *
 * Each devotional walks through several connected Scripture passages,
 * offers a few reflection questions, and closes with a short prayer.
 * `related` links each topic to others so a reader can keep following a
 * thread (e.g. Faith → Hope → Trust) instead of hitting a dead end.
 *
 * Only references are stored here, never verse text: the text is read from
 * whichever Bible translation the user has active, so devotionals follow
 * their translation choice and stay fully offline.
 */

export interface DevotionalPassage {
  /** e.g. "Hebrews 11:1" or "Psalm 23:1-4" */
  reference: string;
  /** A one-or-two sentence note on why this passage matters to the topic. */
  insight: string;
}

export interface Devotional {
  id: string;
  title: string;
  /** One-line summary shown on the list card. */
  summary: string;
  /** A short opening paragraph that frames the study. */
  intro: string;
  passages: DevotionalPassage[];
  reflection: string[];
  prayer: string;
  /** Ids of other devotionals on connected themes. */
  related: string[];
}

export const DEVOTIONALS: Devotional[] = [
  {
    id: "faith",
    title: "Faith",
    summary: "Trusting God for what we cannot yet see",
    intro:
      "Faith is not wishful thinking — it is confidence placed in a faithful God. Scripture shows faith as something that rests on who God is, grows as we hear His Word, and shows itself in how we live.",
    passages: [
      { reference: "Hebrews 11:1", insight: "Faith gives substance to hope and certainty about what is not yet visible." },
      { reference: "Hebrews 11:6", insight: "Faith begins with believing God exists and that He rewards those who seek Him." },
      { reference: "Romans 10:17", insight: "Faith grows as we keep listening to God's Word." },
      { reference: "Ephesians 2:8-9", insight: "Even salvation is received by faith — a gift, not an achievement." },
      { reference: "James 2:17", insight: "Living faith is never idle; it shows up in what we do." },
      { reference: "Mark 9:24", insight: "Honest faith can say, \"help my unbelief\" — God meets us there." },
    ],
    reflection: [
      "Where am I being asked to trust God without seeing the whole picture?",
      "How could I make more room to hear God's Word this week?",
      "What is one practical way my faith could show up in action today?",
    ],
    prayer:
      "Father, thank You that You are faithful even when my faith is small. Help me to trust You with what I cannot see, to keep listening to Your Word, and to live out what I believe. Strengthen my faith today. In Jesus' name, Amen.",
    related: ["hope", "trust", "prayer"],
  },
  {
    id: "hope",
    title: "Hope",
    summary: "An anchor for the soul in every season",
    intro:
      "Biblical hope is not \"maybe\" — it is confident expectation rooted in God's promises. It steadies us in trouble because it looks past the moment to what God has said He will do.",
    passages: [
      { reference: "Hebrews 6:19", insight: "Hope is an anchor — sure and steadfast when everything else moves." },
      { reference: "Romans 15:13", insight: "God is called the God of hope; He fills us with joy and peace as we believe." },
      { reference: "Lamentations 3:22-23", insight: "Even in grief, God's mercies are new every morning." },
      { reference: "Jeremiah 29:11", insight: "God's thoughts toward His people are of peace, with a future in view." },
      { reference: "Romans 5:3-5", insight: "Hard seasons can produce endurance, character, and a hope that doesn't disappoint." },
      { reference: "1 Peter 1:3", insight: "Our hope is living because Jesus is risen." },
    ],
    reflection: [
      "What am I currently placing my hope in?",
      "Which promise of God do I most need to hold onto right now?",
      "How might a present difficulty be shaping endurance or character in me?",
    ],
    prayer:
      "God of hope, anchor my heart in You. When I am discouraged, remind me that Your mercies are new every morning and that Jesus is alive. Fill me with joy and peace as I trust You. In Jesus' name, Amen.",
    related: ["faith", "peace", "suffering"],
  },
  {
    id: "peace",
    title: "Peace in Anxiety",
    summary: "Bringing our worries to the God who cares",
    intro:
      "Anxiety is a real and common struggle. God doesn't shame us for it — He invites us to bring every care to Him and promises a peace that goes deeper than our circumstances.",
    passages: [
      { reference: "Philippians 4:6-7", insight: "Prayer with thanksgiving is the path; God's peace guards our hearts and minds." },
      { reference: "1 Peter 5:7", insight: "We can cast all our cares on Him because He genuinely cares for us." },
      { reference: "John 14:27", insight: "Jesus gives a peace unlike anything the world offers." },
      { reference: "Isaiah 26:3", insight: "Perfect peace belongs to the mind that stays on God." },
      { reference: "Matthew 6:33-34", insight: "Seek God's kingdom first and take life one day at a time." },
      { reference: "Psalm 46:10", insight: "Be still, and know that He is God." },
    ],
    reflection: [
      "What worries am I carrying that I haven't brought to God in prayer?",
      "What could I thank God for, even in the middle of this situation?",
      "What does it look like for me to \"be still\" today?",
    ],
    prayer:
      "Lord Jesus, I bring You every worry I am carrying. Thank You that You care for me. Guard my heart and mind with Your peace, and help me to take today one step at a time with You. In Your name, Amen.",
    related: ["trust", "prayer", "hope"],
  },
  {
    id: "trust",
    title: "Trusting God",
    summary: "Leaning on Him instead of our own understanding",
    intro:
      "Trust is faith lived out day by day. It means choosing to rely on God's character and wisdom, especially when life doesn't make sense to us.",
    passages: [
      { reference: "Proverbs 3:5-6", insight: "Trust with all your heart, and He will direct your paths." },
      { reference: "Psalm 56:3", insight: "Fear and trust can meet — \"What time I am afraid, I will trust in thee.\"" },
      { reference: "Isaiah 41:10", insight: "God promises His presence, strength, and help." },
      { reference: "Psalm 37:5", insight: "Commit your way to the Lord; trust Him, and He will act." },
      { reference: "Romans 8:28", insight: "God works all things together for good for those who love Him." },
      { reference: "Psalm 23:1-4", insight: "The Shepherd leads, restores, and walks with us through the darkest valley." },
    ],
    reflection: [
      "In what area am I leaning on my own understanding?",
      "What would it look like to commit this decision or situation to God?",
      "How has God proven trustworthy in my past?",
    ],
    prayer:
      "Faithful Shepherd, I choose to trust You with all my heart. Where I don't understand, lead me. Where I am afraid, be my strength. I commit my way to You today. In Jesus' name, Amen.",
    related: ["faith", "peace", "guidance"],
  },
  {
    id: "prayer",
    title: "Prayer",
    summary: "Talking with God as a loving Father",
    intro:
      "Prayer is simply conversation with God. Jesus taught us to come to Him as Father — honestly, persistently, and with confidence that He hears.",
    passages: [
      { reference: "Matthew 6:9-13", insight: "Jesus gives us a pattern: worship, surrender, provision, forgiveness, and protection." },
      { reference: "1 Thessalonians 5:16-18", insight: "Rejoice, pray without ceasing, and give thanks in everything." },
      { reference: "Jeremiah 33:3", insight: "God invites us to call, and promises to answer." },
      { reference: "Luke 18:1", insight: "Keep praying and don't lose heart." },
      { reference: "James 5:16", insight: "The prayer of a righteous person is powerful and effective." },
      { reference: "1 John 5:14-15", insight: "We can pray with confidence when we ask according to His will." },
    ],
    reflection: [
      "What does my prayer life honestly look like right now?",
      "Which part of the Lord's Prayer do I most need to pray today?",
      "Who could I commit to praying for this week?",
    ],
    prayer:
      "Our Father in heaven, thank You that I can come to You at any time. Teach me to pray — to worship You, to surrender to Your will, and to bring my needs and the needs of others to You with confidence. In Jesus' name, Amen.",
    related: ["faith", "peace", "worship"],
  },
  {
    id: "forgiveness",
    title: "Forgiveness",
    summary: "Receiving God's mercy and extending it to others",
    intro:
      "We are invited to receive complete forgiveness from God, and then to let that mercy flow through us toward others — even when it is hard.",
    passages: [
      { reference: "1 John 1:9", insight: "When we confess, God is faithful and just to forgive and cleanse." },
      { reference: "Psalm 103:10-12", insight: "He removes our sins as far as the east is from the west." },
      { reference: "Ephesians 4:32", insight: "Be kind and tender-hearted, forgiving as God in Christ forgave you." },
      { reference: "Colossians 3:13", insight: "Bear with one another and forgive as the Lord forgave you." },
      { reference: "Matthew 18:21-22", insight: "Forgiveness isn't counted out — it keeps going." },
      { reference: "Luke 23:34", insight: "Jesus forgave even those who crucified Him." },
    ],
    reflection: [
      "Is there anything I need to confess and receive forgiveness for?",
      "Who might I need to forgive, even if feelings take time to follow?",
      "How does remembering God's mercy to me change how I see others?",
    ],
    prayer:
      "Merciful God, thank You for forgiving me completely through Jesus. Help me to receive Your mercy fully, and give me grace to forgive those who have hurt me, just as You have forgiven me. In Jesus' name, Amen.",
    related: ["love", "grace", "prayer"],
  },
  {
    id: "love",
    title: "God's Love",
    summary: "Known, loved, and sent to love others",
    intro:
      "Everything in the Christian life flows from God's love — a love shown most clearly at the cross, and one that nothing can separate us from.",
    passages: [
      { reference: "John 3:16", insight: "God's love is so great that He gave His only Son." },
      { reference: "Romans 5:8", insight: "God showed His love while we were still sinners." },
      { reference: "Romans 8:38-39", insight: "Nothing in all creation can separate us from God's love in Christ." },
      { reference: "1 John 4:19", insight: "We love because He first loved us." },
      { reference: "1 Corinthians 13:4-7", insight: "A portrait of what real love looks like in action." },
      { reference: "John 13:34-35", insight: "Love for one another is how the world recognises Jesus' followers." },
    ],
    reflection: [
      "Do I truly believe God loves me, not just people in general?",
      "Which line of 1 Corinthians 13 is hardest for me to live out?",
      "Who could I show Christ's love to in a practical way this week?",
    ],
    prayer:
      "Loving Father, thank You that nothing can separate me from Your love in Christ Jesus. Let Your love settle deep in my heart, and let it overflow into kindness, patience, and care for the people around me. In Jesus' name, Amen.",
    related: ["forgiveness", "grace", "worship"],
  },
  {
    id: "grace",
    title: "Grace",
    summary: "Undeserved kindness that changes everything",
    intro:
      "Grace is God giving us what we could never earn. It saves us, strengthens us in weakness, and teaches us how to live.",
    passages: [
      { reference: "Ephesians 2:8-9", insight: "We are saved by grace through faith — it is God's gift." },
      { reference: "2 Corinthians 12:9", insight: "His grace is sufficient; His strength is made perfect in weakness." },
      { reference: "Titus 2:11-12", insight: "Grace doesn't only save — it trains us to live well." },
      { reference: "Hebrews 4:16", insight: "We can come boldly to the throne of grace for help in time of need." },
      { reference: "John 1:16", insight: "From His fullness we have received grace upon grace." },
    ],
    reflection: [
      "Where am I still trying to earn God's approval?",
      "What weakness might God want to display His strength through?",
      "How can I show grace to someone who doesn't \"deserve\" it?",
    ],
    prayer:
      "Gracious God, thank You for the gift I could never earn. When I feel weak, remind me that Your grace is enough. Teach me to live by Your grace and to extend it freely to others. In Jesus' name, Amen.",
    related: ["love", "forgiveness", "faith"],
  },
  {
    id: "guidance",
    title: "Guidance & Wisdom",
    summary: "Seeking God's direction for decisions",
    intro:
      "God has not left us to figure life out alone. He gives wisdom generously, lights our path through His Word, and leads those who seek Him.",
    passages: [
      { reference: "James 1:5", insight: "Ask God for wisdom — He gives generously and without reproach." },
      { reference: "Psalm 119:105", insight: "God's Word is a lamp to our feet and a light to our path." },
      { reference: "Psalm 32:8", insight: "God promises to instruct and guide us." },
      { reference: "Proverbs 16:9", insight: "We make plans, but the Lord directs our steps." },
      { reference: "Isaiah 30:21", insight: "A word behind you: \"This is the way, walk ye in it.\"" },
      { reference: "Romans 12:2", insight: "A renewed mind is able to discern God's good will." },
    ],
    reflection: [
      "What decision am I currently facing?",
      "Have I actually asked God for wisdom about it?",
      "What does Scripture already say that applies to my situation?",
    ],
    prayer:
      "Lord, I need Your wisdom. Light my path with Your Word, renew my mind, and direct my steps. Help me to hear Your voice and to follow where You lead. In Jesus' name, Amen.",
    related: ["trust", "prayer", "faith"],
  },
  {
    id: "suffering",
    title: "Strength in Suffering",
    summary: "God's presence in pain and hard seasons",
    intro:
      "The Bible never pretends life is easy. It speaks honestly about pain — and points us to a God who draws near to the broken-hearted and promises that suffering is not the end of the story.",
    passages: [
      { reference: "Psalm 34:18", insight: "The Lord is near to the broken-hearted." },
      { reference: "2 Corinthians 4:16-18", insight: "Present troubles are light and momentary compared to eternal glory." },
      { reference: "Isaiah 40:31", insight: "Those who wait on the Lord will renew their strength." },
      { reference: "Matthew 11:28-30", insight: "Jesus invites the weary to come to Him and find rest." },
      { reference: "Revelation 21:4", insight: "One day God will wipe away every tear." },
      { reference: "Romans 8:18", insight: "Present sufferings aren't worth comparing to the glory to come." },
    ],
    reflection: [
      "Where do I need God to be near me right now?",
      "What would it mean to bring my weariness to Jesus and rest?",
      "How does the hope of Revelation 21:4 change how I face today?",
    ],
    prayer:
      "Lord, You are near to the broken-hearted. Meet me in my pain. Renew my strength as I wait on You, give me rest for my soul, and hold me in the hope that one day every tear will be wiped away. In Jesus' name, Amen.",
    related: ["hope", "peace", "trust"],
  },
  {
    id: "worship",
    title: "Worship & Gratitude",
    summary: "A thankful heart turned toward God",
    intro:
      "Worship is more than singing — it is offering our whole lives to God in gratitude for who He is and what He has done.",
    passages: [
      { reference: "Psalm 100:4-5", insight: "Enter His gates with thanksgiving; His mercy is everlasting." },
      { reference: "Romans 12:1", insight: "Offering our whole selves is our reasonable worship." },
      { reference: "John 4:24", insight: "God seeks those who worship in spirit and in truth." },
      { reference: "Psalm 103:1-5", insight: "Bless the Lord, and forget not all His benefits." },
      { reference: "Colossians 3:16-17", insight: "Let the Word dwell richly in you, and do everything with thanks." },
    ],
    reflection: [
      "What are three things I can thank God for right now?",
      "What would it look like to offer my work and relationships as worship?",
      "Which of God's \"benefits\" in Psalm 103 have I forgotten lately?",
    ],
    prayer:
      "Lord, I bless Your name. Thank You for Your mercy, Your forgiveness, and Your goodness to me. I offer my whole life to You as worship today. Let everything I do be done with a thankful heart. In Jesus' name, Amen.",
    related: ["prayer", "love", "grace"],
  },
];

export function getDevotional(id: string | undefined): Devotional | undefined {
  return DEVOTIONALS.find((d) => d.id === id);
}

/** A devotional chosen by date, so Home can suggest a fresh one each day. */
export function devotionalOfTheDay(date = new Date()): Devotional {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const day = Math.floor((date.getTime() - start) / 86_400_000);
  return DEVOTIONALS[day % DEVOTIONALS.length];
}

export interface ResolvedPassage {
  reference: string;
  insight: string;
  /** Joined verse text from the active translation, or "" if not found. */
  text: string;
  book?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
}

/** Looks up a passage's text (including verse ranges) in the active Bible. */
export function resolvePassage(p: DevotionalPassage): ResolvedPassage {
  const [ref] = extractReferences(p.reference);
  if (!ref) return { ...p, text: "" };
  const end = ref.endVerse ?? ref.verse;
  const parts: string[] = [];
  for (let v = ref.verse; v <= end; v++) {
    const t = getVerse(ref.book, ref.chapter, v);
    if (t) parts.push(t);
  }
  return {
    reference: ref.label,
    insight: p.insight,
    text: parts.join(" "),
    book: ref.book,
    chapter: ref.chapter,
    verse: ref.verse,
    endVerse: ref.endVerse,
  };
}

