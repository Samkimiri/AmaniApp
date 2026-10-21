import { getVerse } from "@/data/bible";
import { extractReferences } from "@/lib/scriptureRefs";

/**
 * Topical devotionals — short, offline studies on biblical themes.
 *
 * Each devotional walks through several connected Scripture passages,
 * offers reflection questions, and closes with a short prayer.
 * `related` links each topic to others so a reader can keep following a
 * thread (e.g. Faith → Hope → Trust) instead of hitting a dead end.
 *
 * Only references are stored here, never verse text: the text is read from
 * whichever Bible translation the user has active, so devotionals follow
 * their translation choice and stay 100% offline.
 */

export type DevotionalCategory =
  | "Peace & Comfort"
  | "Faith & Trust"
  | "Grace & Redemption"
  | "Prayer & Worship"
  | "Wisdom & Guidance"
  | "Love & Community"
  | "Strength & Victory";

export const DEVOTIONAL_CATEGORIES: DevotionalCategory[] = [
  "Peace & Comfort",
  "Faith & Trust",
  "Grace & Redemption",
  "Prayer & Worship",
  "Wisdom & Guidance",
  "Love & Community",
  "Strength & Victory",
];

export interface DevotionalPassage {
  /** e.g. "Hebrews 11:1" or "Psalm 23:1-4" */
  reference: string;
  /** A one-or-two sentence note on why this passage matters to the topic. */
  insight: string;
}

export interface Devotional {
  id: string;
  title: string;
  category?: DevotionalCategory;
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
  // --- Faith & Trust ---
  {
    id: "faith",
    title: "Faith",
    category: "Faith & Trust",
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
    related: ["hope", "trust", "promises"],
  },
  {
    id: "hope",
    title: "Hope",
    category: "Faith & Trust",
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
    related: ["faith", "peace", "joy"],
  },
  {
    id: "trust",
    title: "Trusting God",
    category: "Faith & Trust",
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
    related: ["faith", "guidance", "timing"],
  },
  {
    id: "timing",
    title: "Trusting God's Timing",
    category: "Faith & Trust",
    summary: "Waiting patiently for God to fulfill His purpose",
    intro:
      "Waiting is often one of the hardest disciplines of faith. God rarely works on our timetable, yet Scripture assures us that He makes all things beautiful in His time.",
    passages: [
      { reference: "Ecclesiastes 3:11", insight: "He has made everything beautiful in its time." },
      { reference: "Psalm 27:14", insight: "Wait on the Lord; be of good courage, and He will strengthen your heart." },
      { reference: "Galatians 6:9", insight: "In due season we will reap if we do not lose heart." },
      { reference: "Habakkuk 2:3", insight: "The vision awaits its appointed time; though it tarry, wait for it." },
      { reference: "2 Peter 3:9", insight: "The Lord is not slow concerning His promise, but patient toward us." },
    ],
    reflection: [
      "Where am I feeling tempted to rush ahead of God's timing?",
      "What is God teaching me in this waiting season?",
      "How can I actively trust Him while I wait?",
    ],
    prayer:
      "Lord, Your timing is perfect even when I feel impatient. Quiet my restless heart, strengthen my faith while I wait, and help me stay faithful in today's small duties. In Jesus' name, Amen.",
    related: ["trust", "waiting", "hope"],
  },
  {
    id: "promises",
    title: "The Promises of God",
    category: "Faith & Trust",
    summary: "Standing firm on the unshakeable word of God",
    intro:
      "Every promise God makes is guaranteed by His holy character. In Christ, all of God's promises find their definitive 'Yes' and 'Amen.'",
    passages: [
      { reference: "2 Corinthians 1:20", insight: "All the promises of God in Christ are Yes and Amen." },
      { reference: "Numbers 23:19", insight: "God is not a man that He should lie; has He said, and will He not do it?" },
      { reference: "Joshua 21:45", insight: "Not one word of all God's good promises failed; all came to pass." },
      { reference: "2 Peter 1:4", insight: "He has granted to us His precious and very great promises." },
      { reference: "Titus 1:2", insight: "God, who cannot lie, promised eternal life before time began." },
    ],
    reflection: [
      "Which specific promise of God do I need to stand on today?",
      "How does knowing God cannot lie change my perspective on fear?",
      "Have I thanked God for the promises He has already fulfilled in my life?",
    ],
    prayer:
      "Heavenly Father, Your Word is truth. When circumstances shake, remind me of Your unchanging promises. I choose to anchor my soul in what You have spoken. In Jesus' name, Amen.",
    related: ["faith", "hope", "trust"],
  },
  {
    id: "courage",
    title: "Courage to Obey",
    category: "Faith & Trust",
    summary: "Stepping out in obedience even when afraid",
    intro:
      "Courage is not the absence of fear; it is the conviction that God's presence is greater than any obstacle. When God calls us to step out, He always goes before us.",
    passages: [
      { reference: "Joshua 1:9", insight: "Be strong and courageous; do not be afraid, for the Lord is with you wherever you go." },
      { reference: "Deuteronomy 31:6", insight: "Be strong and of a good courage; He will not fail you nor forsake you." },
      { reference: "Psalm 27:1", insight: "The Lord is my light and my salvation; whom shall I fear?" },
      { reference: "1 Corinthians 16:13", insight: "Watch, stand fast in the faith, be brave, be strong." },
      { reference: "Acts 4:29", insight: "Grant to Your servants that with all boldness they may speak Your word." },
    ],
    reflection: [
      "What step of obedience has fear been keeping me from taking?",
      "How does God's promise never to leave me give me courage?",
      "Where in my life do I need to stand firm in faith today?",
    ],
    prayer:
      "Almighty God, You are my light and my shield. Take away my timid spirit and give me the holy courage to obey Your voice without hesitation. I step forward in Your strength today. In Jesus' name, Amen.",
    related: ["faith", "fear", "strength"],
  },

  // --- Peace & Comfort ---
  {
    id: "peace",
    title: "Peace in Anxiety",
    category: "Peace & Comfort",
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
    related: ["rest", "stillness", "fear"],
  },
  {
    id: "grief",
    title: "Grief and Loss",
    category: "Peace & Comfort",
    summary: "Finding comfort in the presence of the Man of Sorrows",
    intro:
      "Grief can feel disorienting and lonely. Scripture shows us that God does not turn away from our tears — He collects them, walks with us through grief, and holds our fragile hearts.",
    passages: [
      { reference: "Psalm 34:18", insight: "The Lord is near to those who have a broken heart." },
      { reference: "Psalm 56:8", insight: "You keep track of all my sorrows; You have collected all my tears." },
      { reference: "Matthew 5:4", insight: "Blessed are those who mourn, for they shall be comforted." },
      { reference: "John 11:35", insight: "Jesus wept — God enters into the pain of human loss." },
      { reference: "2 Corinthians 1:3-4", insight: "God comforts us in all our tribulations so we can comfort others." },
      { reference: "Revelation 21:4", insight: "A day is coming when death, sorrow, and crying will be no more." },
    ],
    reflection: [
      "Am I allowing myself to grieve honestly before God?",
      "How does seeing Jesus weep at Lazarus' tomb help me understand His heart for me?",
      "Who around me might need gentle comfort today?",
    ],
    prayer:
      "Father of mercies, You see every tear and know every sorrow. Wrap Your comforting arms around my broken heart. When words fail, let Your Holy Spirit comfort my soul. In Jesus' name, Amen.",
    related: ["comfort", "peace", "hope"],
  },
  {
    id: "rest",
    title: "Rest & Sabbath",
    category: "Peace & Comfort",
    summary: "Receiving God's gift of soul rest in a hurried world",
    intro:
      "We live in a culture that measures worth by productivity. God instituted Sabbath not as a restriction, but as a grace — a weekly invitation to cease striving and rest in His sufficiency.",
    passages: [
      { reference: "Matthew 11:28-30", insight: "Come to Me, all who labor and are heavy laden, and I will give you rest." },
      { reference: "Exodus 20:8-10", insight: "God designed rhythm: six days of labor, followed by sacred rest." },
      { reference: "Psalm 127:2", insight: "It is vain to rise up early and sit up late eating the bread of sorrows; He gives His beloved sleep." },
      { reference: "Mark 2:27", insight: "The Sabbath was made for man, not man for the Sabbath." },
      { reference: "Hebrews 4:9-10", insight: "There remains therefore a rest for the people of God." },
    ],
    reflection: [
      "Is my soul tired from overwork, anxiety, or ceaseless striving?",
      "What is one practical boundary I can set to honor real rest this week?",
      "How does trusting God allow me to lay down my work without fear?",
    ],
    prayer:
      "Lord Jesus, I bring my hurried and weary soul to You. Forgive me for measuring my value by my activity. Teach me the gentle art of resting in Your finished work, and refresh my body and spirit. In Your name, Amen.",
    related: ["stillness", "peace", "trust"],
  },
  {
    id: "stillness",
    title: "Stillness Before God",
    category: "Peace & Comfort",
    summary: "Silencing the noise to know and hear Him",
    intro:
      "Stillness is rarely passive; it is an active decision to turn down the world's volume so that God's gentle whisper can be heard. In quietness and trust is our strength.",
    passages: [
      { reference: "Psalm 46:10", insight: "Be still, and know that I am God; I will be exalted among the nations." },
      { reference: "1 Kings 19:11-12", insight: "God was not in the wind, earthquake, or fire, but in a still small voice." },
      { reference: "Isaiah 30:15", insight: "In quietness and confidence shall be your strength." },
      { reference: "Psalm 62:1-2", insight: "Truly my soul silently waits for God; from Him comes my salvation." },
      { reference: "Mark 6:31", insight: "Come aside by yourselves to a deserted place and rest a while." },
    ],
    reflection: [
      "How much noise and digital clutter is filling my daily routine?",
      "When was the last time I sat in silence before God without an agenda?",
      "What does 'Be still and know that I am God' mean for my present concern?",
    ],
    prayer:
      "Lord, quiet the storm of thoughts within me. In this busy world, teach me the beauty of holy silence. Help me listen for Your still, small voice and find my security in simply knowing You are God. Amen.",
    related: ["rest", "prayer", "peace"],
  },
  {
    id: "fear",
    title: "Overcoming Fear",
    category: "Peace & Comfort",
    summary: "Replacing terror with the perfect love of God",
    intro:
      "Fear is one of the enemy's most frequent tactics to paralyze believers. Over 300 times Scripture tells us, 'Do not be afraid' — not because danger doesn't exist, but because God is with us.",
    passages: [
      { reference: "2 Timothy 1:7", insight: "God has not given us a spirit of fear, but of power and of love and of a sound mind." },
      { reference: "1 John 4:18", insight: "There is no fear in love; but perfect love casts out fear." },
      { reference: "Psalm 23:4", insight: "Yea, though I walk through the valley of the shadow of death, I will fear no evil, for You are with me." },
      { reference: "Isaiah 41:10", insight: "Fear not, for I am with you; be not dismayed, for I am your God." },
      { reference: "Psalm 34:4", insight: "I sought the Lord, and He heard me, and delivered me from all my fears." },
    ],
    reflection: [
      "What specific fear is threatening to control my thoughts today?",
      "How does meditating on God's love dissolve that fear?",
      "What truth from Scripture can I declare whenever anxiety or fear knocks?",
    ],
    prayer:
      "Father, thank You that You have not given me a spirit of fear, but of power, love, and a sound mind. Drive out every lie of the enemy with the reality of Your presence and Your perfect love. In Jesus' name, Amen.",
    related: ["peace", "courage", "trust"],
  },
  {
    id: "comfort",
    title: "God of All Comfort",
    category: "Peace & Comfort",
    summary: "Receiving divine comfort to share with those around us",
    intro:
      "God does not observe our suffering from a cold distance. He comes close as the 'God of all comfort,' wrapping His eternal arms around our hurts so that we can become conduits of that same comfort.",
    passages: [
      { reference: "2 Corinthians 1:3-4", insight: "The Father of mercies and God of all comfort comforts us in all our affliction." },
      { reference: "Isaiah 66:13", insight: "As one whom his mother comforts, so I will comfort you." },
      { reference: "Psalm 119:50", insight: "This is my comfort in my affliction, for Your word has given me life." },
      { reference: "Matthew 11:28", insight: "Come to Me, all you who are weary and burdened, and I will give you rest." },
      { reference: "John 14:16", insight: "He will give you another Helper, that He may abide with you forever." },
    ],
    reflection: [
      "Where in my life do I most need God's tender comfort today?",
      "How has a past painful trial prepared me to encourage someone else?",
      "Who can I reach out to with words of comfort this week?",
    ],
    prayer:
      "Holy Spirit, our Comforter, breathe Your gentle peace into every weary place in my heart today. Help me experience Your tender mercy and use me as an instrument of Your healing comfort to others. Amen.",
    related: ["grief", "suffering", "peace"],
  },

  // --- Grace & Redemption ---
  {
    id: "forgiveness",
    title: "Forgiveness",
    category: "Grace & Redemption",
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
    related: ["grace", "mercy", "freedom"],
  },
  {
    id: "grace",
    title: "The Gift of Grace",
    category: "Grace & Redemption",
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
    related: ["forgiveness", "mercy", "redemption"],
  },
  {
    id: "mercy",
    title: "New Mercies Every Morning",
    category: "Grace & Redemption",
    summary: "Waking up to God's unfailing compassion",
    intro:
      "While justice gives us what we deserve, mercy holds back the punishment we earned. God's mercies are not a finite reservoir; they are freshly replenished with every sunrise.",
    passages: [
      { reference: "Lamentations 3:22-23", insight: "Through the Lord's mercies we are not consumed; they are new every morning." },
      { reference: "Psalm 103:8", insight: "The Lord is merciful and gracious, slow to anger, and abounding in mercy." },
      { reference: "Titus 3:5", insight: "Not by works of righteousness which we have done, but according to His mercy He saved us." },
      { reference: "Micah 7:18-19", insight: "He delights in mercy; He will cast all our sins into the depths of the sea." },
      { reference: "Luke 6:36", insight: "Therefore be merciful, just as your Father also is merciful." },
    ],
    reflection: [
      "How does starting today with the thought 'God's mercies are new' shift my mindset?",
      "Am I holding myself to an impossible standard of perfection instead of resting in mercy?",
      "How can I show mercy to someone who made a mistake recently?",
    ],
    prayer:
      "Lord God, thank You that Your compassions never fail. Thank You for waking me up to fresh mercy today. Teach my heart to rejoice in Your kindness and to be as merciful to others as You are to me. In Jesus' name, Amen.",
    related: ["grace", "forgiveness", "love"],
  },
  {
    id: "redemption",
    title: "Redeemed and Restored",
    category: "Grace & Redemption",
    summary: "Bought with a price and given a brand new identity",
    intro:
      "Redemption means to buy back out of slavery. Christ paid the ultimate price to rescue us from the bondage of sin, not to leave us broken, but to restore our dignity as children of God.",
    passages: [
      { reference: "1 Peter 1:18-19", insight: "Redeemed not with corruptible things like silver or gold, but with the precious blood of Christ." },
      { reference: "Ephesians 1:7", insight: "In Him we have redemption through His blood, the forgiveness of sins." },
      { reference: "Galatians 3:13", insight: "Christ has redeemed us from the curse of the law, having become a curse for us." },
      { reference: "Isaiah 43:1", insight: "Fear not, for I have redeemed you; I have called you by your name; you are Mine." },
      { reference: "Colossians 1:13-14", insight: "He has delivered us from the power of darkness and conveyed us into the kingdom of the Son." },
    ],
    reflection: [
      "Do I live like someone who has been bought and valued by the blood of Jesus?",
      "What old identity or label is God asking me to abandon?",
      "How does knowing I belong to God give me dignity and purpose?",
    ],
    prayer:
      "Lord Jesus, thank You for paying the price I could never pay to redeem me. You have called me by name; I am Yours. Help me walk in the dignity, freedom, and holiness of a redeemed child of God. Amen.",
    related: ["grace", "freedom", "newlife"],
  },
  {
    id: "freedom",
    title: "Freedom from Shame",
    category: "Grace & Redemption",
    summary: "Living without condemnation in Christ Jesus",
    intro:
      "Guilt says 'I did something wrong,' but shame says 'I am flawed and unlovable.' The gospel silences shame forever: there is now no condemnation for those who are in Christ Jesus.",
    passages: [
      { reference: "Romans 8:1-2", insight: "There is therefore now no condemnation to those who are in Christ Jesus." },
      { reference: "Galatians 5:1", insight: "Stand fast in the liberty by which Christ has made us free, and do not be entangled again with a yoke of bondage." },
      { reference: "Hebrews 12:2", insight: "Looking unto Jesus, who endured the cross, despising the shame, and is set down at the right hand of God." },
      { reference: "Psalm 34:5", insight: "They looked to Him and were radiant, and their faces were not ashamed." },
      { reference: "2 Corinthians 3:17", insight: "Where the Spirit of the Lord is, there is liberty." },
    ],
    reflection: [
      "What past failures still try to whisper condemnation in my ear?",
      "How does Romans 8:1 protect my mind from the accuser?",
      "What would it feel like to walk into every room completely free from shame?",
    ],
    prayer:
      "Lord Jesus, You bore my cross and despised the shame so I could walk with my head held high in Your righteousness. When accusations rise, remind me that Your blood has spoken a better word. I stand free in You today. Amen.",
    related: ["redemption", "forgiveness", "grace"],
  },
  {
    id: "newlife",
    title: "A New Creation",
    category: "Grace & Redemption",
    summary: "Leaving the past behind and walking in resurrection life",
    intro:
      "When we come to Christ, God doesn't just patch up our old nature; He makes us an entirely new creation. The old has passed away, and the new has begun.",
    passages: [
      { reference: "2 Corinthians 5:17", insight: "If anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new." },
      { reference: "Ezekiel 36:26", insight: "I will give you a new heart and put a new spirit within you." },
      { reference: "Romans 6:4", insight: "Just as Christ was raised from the dead by the glory of the Father, even so we should walk in newness of life." },
      { reference: "Colossians 3:9-10", insight: "Put off the old man with his deeds, and put on the new man who is renewed in knowledge." },
      { reference: "Ephesians 4:22-24", insight: "Be renewed in the spirit of your mind, and put on the new self created after the likeness of God." },
    ],
    reflection: [
      "What old habit or thought pattern belongs to the 'old man' that I need to lay down?",
      "How is the Holy Spirit currently renewing my desires and mind?",
      "How does knowing I am a new creation give me hope for positive change?",
    ],
    prayer:
      "Father, thank You for giving me a new heart and putting Your Spirit within me. Today, I put off the old ways of thinking and choose to walk in the vitality, purity, and freedom of resurrection life. In Jesus' name, Amen.",
    related: ["redemption", "grace", "guidance"],
  },

  // --- Prayer & Worship ---
  {
    id: "prayer",
    title: "Prayer",
    category: "Prayer & Worship",
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
    related: ["praise", "hearing", "waiting"],
  },
  {
    id: "worship",
    title: "Worship in Spirit & Truth",
    category: "Prayer & Worship",
    summary: "Offering our whole lives to God as living worship",
    intro:
      "Worship is far more than Sunday songs — it is offering our entire lives to God in awe of who He is and what He has done.",
    passages: [
      { reference: "John 4:23-24", insight: "The Father is seeking true worshipers who will worship in spirit and truth." },
      { reference: "Romans 12:1", insight: "Present your bodies a living sacrifice, holy, acceptable to God, which is your reasonable service." },
      { reference: "Psalm 95:6", insight: "Oh come, let us worship and bow down; let us kneel before the Lord our Maker." },
      { reference: "Hebrews 13:15", insight: "Continually offer the sacrifice of praise to God, that is, the fruit of our lips giving thanks to His name." },
      { reference: "Psalm 29:2", insight: "Give unto the Lord the glory due to His name; worship the Lord in the beauty of holiness." },
    ],
    reflection: [
      "How can my everyday work and ordinary moments become acts of worship?",
      "What does it mean to worship God in 'spirit and truth'?",
      "What idol or distraction is competing for the adoration of my heart?",
    ],
    prayer:
      "Lord God Almighty, You alone are worthy of all honor, praise, and glory. I yield my body, mind, and affections to You today as a living sacrifice. Let everything I do be an act of worship. In Jesus' name, Amen.",
    related: ["prayer", "gratitude", "praise"],
  },
  {
    id: "gratitude",
    title: "Gratitude & Thanksgiving",
    category: "Prayer & Worship",
    summary: "Cultivating a thankful heart that transforms every circumstance",
    intro:
      "Gratitude turns what we have into enough, and more. A thankful heart is a shield against bitterness, envy, and despair, anchoring our focus on God's unending goodness.",
    passages: [
      { reference: "Psalm 100:4-5", insight: "Enter His gates with thanksgiving and His courts with praise; be thankful to Him and bless His name." },
      { reference: "Psalm 103:1-5", insight: "Bless the Lord, O my soul, and forget not all His benefits." },
      { reference: "1 Thessalonians 5:18", insight: "In everything give thanks; for this is the will of God in Christ Jesus for you." },
      { reference: "Colossians 3:15", insight: "Let the peace of God rule in your hearts... and be thankful." },
      { reference: "Philippians 4:6", insight: "In everything by prayer and supplication, with thanksgiving, let your requests be made known to God." },
    ],
    reflection: [
      "What are three specific blessings I have taken for granted recently?",
      "How can giving thanks even in a difficult season protect my joy?",
      "Who can I write or call today to say 'thank you'?",
    ],
    prayer:
      "Lord, forgive me for grumbling or taking Your kindness for granted. Open my eyes to the countless blessings You pour into my life each day. Fill my speech with heartfelt thanksgiving. In Jesus' name, Amen.",
    related: ["worship", "praise", "contentment"],
  },
  {
    id: "praise",
    title: "The Power of Praise",
    category: "Prayer & Worship",
    summary: "Breaking chains through heartfelt praise",
    intro:
      "Praise is not dependent on our emotions; it is a declaration of who God is regardless of how we feel. Scripture demonstrates that praise breaks spiritual chains and shifts atmospheres.",
    passages: [
      { reference: "Acts 16:25-26", insight: "At midnight Paul and Silas were praying and singing hymns to God, and suddenly there was an earthquake." },
      { reference: "Psalm 145:1-3", insight: "Great is the Lord, and greatly to be praised; and His greatness is unsearchable." },
      { reference: "Psalm 34:1", insight: "I will bless the Lord at all times; His praise shall continually be in my mouth." },
      { reference: "Habakkuk 3:17-18", insight: "Though the fig tree does not blossom... yet I will rejoice in the Lord, I will joy in the God of my salvation." },
      { reference: "Psalm 150:6", insight: "Let everything that has breath praise the Lord. Praise the Lord!" },
    ],
    reflection: [
      "Can I choose to praise God even when circumstances look bleak?",
      "How does focusing on God's greatness shrink the perceived size of my problems?",
      "What is one song of praise I can sing or meditate on today?",
    ],
    prayer:
      "Lord, I lift high Your holy name! You are majestic, loving, and good beyond measure. Even when tears fill my eyes, I declare that You are worthy of all my praise. In Jesus' name, Amen.",
    related: ["worship", "gratitude", "joy"],
  },
  {
    id: "waiting",
    title: "Waiting on the Lord",
    category: "Prayer & Worship",
    summary: "Quietly relying on God's strength and salvation",
    intro:
      "Waiting on the Lord is not wasted time; it is where our spiritual strength is renewed. While we wait in prayer, God is secretly moving mountains behind the scenes.",
    passages: [
      { reference: "Isaiah 40:31", insight: "Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles." },
      { reference: "Psalm 62:5", insight: "My soul, wait silently for God alone, for my expectation is from Him." },
      { reference: "Psalm 130:5-6", insight: "I wait for the Lord, my soul waits, and in His word I do hope." },
      { reference: "Micah 7:7", insight: "I will look to the Lord; I will wait for the God of my salvation; my God will hear me." },
      { reference: "Lamentations 3:25-26", insight: "The Lord is good to those who wait for Him, to the soul who seeks Him." },
    ],
    reflection: [
      "In what area of my life is God inviting me to wait silently on Him?",
      "How can I turn restless waiting into watchful prayer?",
      "What does 'mounting up with wings like eagles' look like in my daily walk?",
    ],
    prayer:
      "Father, my soul waits on You. When my natural strength runs out, renew me with Your Spirit. Grant me the patience to let You work out Your purposes without getting ahead of You. In Jesus' name, Amen.",
    related: ["timing", "stillness", "prayer"],
  },
  {
    id: "hearing",
    title: "Hearing God's Voice",
    category: "Prayer & Worship",
    summary: "Tuning our spiritual ears to the Good Shepherd",
    intro:
      "Jesus declared, 'My sheep hear My voice, and I know them, and they follow Me.' God still speaks today — through His Scripture, His Spirit, and wise godly counsel.",
    passages: [
      { reference: "John 10:27", insight: "My sheep hear My voice, and I know them, and they follow Me." },
      { reference: "1 Samuel 3:9-10", insight: "Speak, Lord, for Your servant hears." },
      { reference: "Hebrews 4:12", insight: "The word of God is living and powerful, and sharper than any two-edged sword." },
      { reference: "Romans 8:14", insight: "For as many as are led by the Spirit of God, these are sons of God." },
      { reference: "Revelation 3:20", insight: "Behold, I stand at the door and knock. If anyone hears My voice and opens the door, I will come in." },
    ],
    reflection: [
      "Am I taking enough time in Scripture to train my ears to hear the Shepherd's voice?",
      "How do I distinguish God's voice from the voice of fear or the world?",
      "What is one truth God spoke to me recently that I need to act on?",
    ],
    prayer:
      "Good Shepherd, teach me to recognize Your gentle voice amidst the clamor of the world. Give me a heart like young Samuel, saying, 'Speak, Lord, for Your servant hears.' I desire to follow wherever You lead. Amen.",
    related: ["guidance", "prayer", "wisdom"],
  },

  // --- Wisdom & Guidance ---
  {
    id: "wisdom",
    title: "Wisdom for Decisions",
    category: "Wisdom & Guidance",
    summary: "Asking God for wisdom in choices big and small",
    intro:
      "Human intelligence can analyze facts, but only God's wisdom can reveal the right path and the right heart posture. God promises to give wisdom generously to anyone who asks in faith.",
    passages: [
      { reference: "James 1:5", insight: "If any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach." },
      { reference: "Proverbs 9:10", insight: "The fear of the Lord is the beginning of wisdom, and the knowledge of the Holy One is understanding." },
      { reference: "Proverbs 3:13-15", insight: "Happy is the man who finds wisdom... she is more precious than rubies." },
      { reference: "Colossians 1:9", insight: "Filled with the knowledge of His will in all wisdom and spiritual understanding." },
      { reference: "James 3:17", insight: "The wisdom that is from above is first pure, then peaceable, gentle, willing to yield, full of mercy." },
    ],
    reflection: [
      "What choice or situation requires divine wisdom in my life right now?",
      "Does the advice I'm considering line up with the wisdom described in James 3:17?",
      "Have I earnestly asked God for insight before leaning on my own instincts?",
    ],
    prayer:
      "Father, I need Your wisdom. Clear away my confusion and selfish motives. Grant me spiritual insight from above that is pure, gentle, and peaceable, so that every step I take honors You. In Jesus' name, Amen.",
    related: ["guidance", "guardingheart", "trust"],
  },
  {
    id: "guidance",
    title: "Seeking Divine Guidance",
    category: "Wisdom & Guidance",
    summary: "Allowing God's Word to light the next step of our journey",
    intro:
      "God rarely gives us a five-year roadmap; He gives us a lamp for our feet to light just the next step. Walking with God is a daily adventure of following His guiding hand.",
    passages: [
      { reference: "Psalm 119:105", insight: "Your word is a lamp to my feet and a light to my path." },
      { reference: "Proverbs 16:9", insight: "A man's heart plans his way, but the Lord directs his steps." },
      { reference: "Psalm 32:8", insight: "I will instruct you and teach you in the way you should go; I will guide you with My eye." },
      { reference: "Isaiah 30:21", insight: "Your ears shall hear a word behind you, saying, 'This is the way, walk in it.'" },
      { reference: "Romans 12:2", insight: "Be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God." },
    ],
    reflection: [
      "Am I asking God to show me the whole journey when He only wants me to take the next faithful step?",
      "How is my daily Bible reading actively lighting my path?",
      "Where do I need to hold my own plans loosely so God can direct my steps?",
    ],
    prayer:
      "Lord, I commit my path to You. Be the lamp to my feet. Where I am uncertain, illuminate the right step. Protect me from wrong turns and lead me in the way everlasting. In Jesus' name, Amen.",
    related: ["wisdom", "trust", "hearing"],
  },
  {
    id: "guardingheart",
    title: "Guarding Your Heart",
    category: "Wisdom & Guidance",
    summary: "Protecting the wellspring of your life and thoughts",
    intro:
      "Scripture instructs us to guard our hearts with all diligence, for out of it flow the issues of life. What we allow into our minds and affections ultimately shapes who we become.",
    passages: [
      { reference: "Proverbs 4:23", insight: "Keep your heart with all diligence, for out of it spring the issues of life." },
      { reference: "Philippians 4:8", insight: "Whatever things are true, noble, just, pure, lovely, of good report... meditate on these things." },
      { reference: "Psalm 139:23-24", insight: "Search me, O God, and know my heart; test me and know my anxious thoughts." },
      { reference: "Romans 12:2", insight: "Do not be conformed to this world, but be transformed by the renewing of your mind." },
      { reference: "Colossians 3:2", insight: "Set your mind on things above, not on things on the earth." },
    ],
    reflection: [
      "What media, conversations, or habits are poisoning the reservoir of my heart?",
      "How can I proactively fill my thoughts with what is pure, lovely, and praiseworthy?",
      "When was the last time I invited God to examine my motives and hidden thoughts?",
    ],
    prayer:
      "Lord, create in me a clean heart. Stand guard over the gates of my eyes, ears, and mind. Help me filter out anything that grieves Your Holy Spirit, and let my affections remain centered on Christ. Amen.",
    related: ["speech", "integrity", "contentment"],
  },
  {
    id: "speech",
    title: "Words of Life",
    category: "Wisdom & Guidance",
    summary: "Using our tongue to build up, encourage, and bless",
    intro:
      "Death and life are in the power of the tongue. Our words have the power to wound or heal, tear down or construct. God calls us to season all our speech with grace.",
    passages: [
      { reference: "Proverbs 18:21", insight: "Death and life are in the power of the tongue, and those who love it will eat its fruit." },
      { reference: "Ephesians 4:29", insight: "Let no corrupt word proceed out of your mouth, but what is good for necessary edification." },
      { reference: "Colossians 4:6", insight: "Let your speech always be with grace, seasoned with salt, that you may know how to answer." },
      { reference: "James 3:5-6", insight: "The tongue is a little member and boasts great things; see how great a forest a little fire kindles!" },
      { reference: "Psalm 19:14", insight: "Let the words of my mouth and the meditation of my heart be acceptable in Your sight, O Lord." },
    ],
    reflection: [
      "Have my words in recent days built people up or torn them down?",
      "Is there someone I need to apologize to for speaking in anger or careless gossip?",
      "Who can I send a sincere, encouraging word to today?",
    ],
    prayer:
      "O Lord, set a guard over my mouth; keep watch over the door of my lips. Forgive me for careless, critical words. Let my speech be filled with grace, truth, and kindness that honors You and ministers life to hearers. Amen.",
    related: ["guardingheart", "kindness", "wisdom"],
  },
  {
    id: "contentment",
    title: "True Contentment",
    category: "Wisdom & Guidance",
    summary: "Finding complete satisfaction in Christ alone",
    intro:
      "The world preaches that happiness lies in the next purchase, accomplishment, or milestone. Biblical contentment is the secret art of rejoicing in Christ regardless of what we have or lack.",
    passages: [
      { reference: "Philippians 4:11-13", insight: "I have learned in whatever state I am, to be content... I can do all things through Christ who strengthens me." },
      { reference: "1 Timothy 6:6-8", insight: "Godliness with contentment is great gain... having food and clothing, with these we shall be content." },
      { reference: "Hebrews 13:5", insight: "Let your conduct be without covetousness; be content with such things as you have; for He has said, 'I will never leave you.'" },
      { reference: "Psalm 23:1", insight: "The Lord is my shepherd; I shall not want." },
      { reference: "Luke 12:15", insight: "Take heed and beware of covetousness, for one's life does not consist in the abundance of things." },
    ],
    reflection: [
      "What circumstance or possession am I falsely believing will make me finally happy?",
      "How does the promise 'I will never leave you' answer my deepest insecurity?",
      "What is one area where I can choose gratitude instead of comparison today?",
    ],
    prayer:
      "Jesus, You are my Shepherd; in You I lack nothing. Uproot the seeds of comparison and envy in my soul. Teach me the blessed freedom of contentment, knowing that having You is more than enough. Amen.",
    related: ["gratitude", "humility", "peace"],
  },
  {
    id: "humility",
    title: "The Way of Humility",
    category: "Wisdom & Guidance",
    summary: "Walking low before God and lifting others higher",
    intro:
      "In God's kingdom, the way up is down. Jesus, the Lord of glory, wrapped a towel around His waist and washed feet. True humility is not thinking less of ourselves; it is thinking of ourselves less.",
    passages: [
      { reference: "Philippians 2:3-5", insight: "Let nothing be done through selfish ambition or conceit, but in lowliness of mind let each esteem others better than himself." },
      { reference: "James 4:6", insight: "God resists the proud, but gives grace to the humble." },
      { reference: "1 Peter 5:5-6", insight: "Humble yourselves under the mighty hand of God, that He may exalt you in due time." },
      { reference: "Micah 6:8", insight: "What does the Lord require of you but to do justly, to love mercy, and to walk humbly with your God?" },
      { reference: "Proverbs 11:2", insight: "When pride comes, then comes shame; but with the humble is wisdom." },
    ],
    reflection: [
      "Where is subtle pride or self-promotion creeping into my motives?",
      "Whom can I quietly serve today without seeking credit or applause?",
      "How does looking at the humility of Jesus at the cross soften my heart?",
    ],
    prayer:
      "Lord Jesus, meek and lowly of heart, forgive my pride and craving for recognition. Clothe me with genuine humility. Help me consider others before myself and walk gently in Your footsteps today. Amen.",
    related: ["servanthood", "grace", "contentment"],
  },
  {
    id: "diligence",
    title: "Work as Unto the Lord",
    category: "Wisdom & Guidance",
    summary: "Glorifying God through excellence, integrity, and daily labor",
    intro:
      "Our work is not a secular chore disconnected from our faith; it is our mission field and an act of worship. Whether we are cleaning floors or leading corporations, we serve the Lord Christ.",
    passages: [
      { reference: "Colossians 3:23-24", insight: "Whatever you do, do it heartily, as to the Lord and not to men, knowing that from the Lord you will receive the reward." },
      { reference: "Proverbs 12:24", insight: "The hand of the diligent will rule, but the lazy man will be put to forced labor." },
      { reference: "Proverbs 16:3", insight: "Commit your works to the Lord, and your thoughts will be established." },
      { reference: "1 Corinthians 10:31", insight: "Whether you eat or drink, or whatever you do, do all to the glory of God." },
      { reference: "Galatians 6:9", insight: "Let us not grow weary while doing good, for in due season we shall reap if we do not lose heart." },
    ],
    reflection: [
      "Do I view my daily responsibilities as worship or merely as a means to an end?",
      "Where have I been tempted to cut corners or work with a complaining attitude?",
      "How can my diligence shine as a witness to colleagues and family today?",
    ],
    prayer:
      "Lord, I dedicate the work of my hands to You. Give me focus, energy, and integrity in every task before me today. Let my diligence reflect Your excellence, and may Christ be glorified through what I do. Amen.",
    related: ["integrity", "wisdom", "servanthood"],
  },
  {
    id: "integrity",
    title: "Walking in Integrity",
    category: "Wisdom & Guidance",
    summary: "Aligning our private character with God's truth",
    intro:
      "Integrity is who we are when no one is looking. A life of integrity produces an unshakeable foundation, protecting our conscience and preserving a pure testimony for the gospel.",
    passages: [
      { reference: "Proverbs 10:9", insight: "He who walks with integrity walks securely, but he who perverts his ways will become known." },
      { reference: "Psalm 15:1-2", insight: "Lord, who may abide in Your tabernacle? He who walks uprightly, and works righteousness, and speaks the truth in his heart." },
      { reference: "Proverbs 11:3", insight: "The integrity of the upright will guide them, but the perversity of the unfaithful will destroy them." },
      { reference: "2 Corinthians 8:21", insight: "Providing honorable things, not only in the sight of the Lord, but also in the sight of men." },
      { reference: "Titus 2:7-8", insight: "In all things showing yourself to be a pattern of good works; in doctrine showing integrity, reverence, incorruptibility." },
    ],
    reflection: [
      "Is there any double-standard between my public persona and private habits?",
      "What does walking securely in integrity mean for my financial and personal dealings?",
      "How does a clear conscience before God liberate me from fear?",
    ],
    prayer:
      "Righteous Father, You examine the heart and delight in uprightness. Give me a steadfast spirit of truth and integrity. Help me choose honesty over convenience, and guard my steps so my life honors Your name. Amen.",
    related: ["diligence", "guardingheart", "wisdom"],
  },

  // --- Love & Community ---
  {
    id: "love",
    title: "God's Steadfast Love",
    category: "Love & Community",
    summary: "Known, loved, and empowered to love others deeply",
    intro:
      "Everything in the Christian life flows from God's love — a love shown most clearly at the cross, and one that nothing can ever separate us from.",
    passages: [
      { reference: "John 3:16", insight: "God's love is so great that He gave His only Son." },
      { reference: "Romans 5:8", insight: "God showed His love while we were still sinners." },
      { reference: "Romans 8:38-39", insight: "Nothing in all creation can separate us from God's love in Christ." },
      { reference: "1 John 4:19", insight: "We love because He first loved us." },
      { reference: "1 Corinthians 13:4-7", insight: "A portrait of what real, patient love looks like in action." },
      { reference: "John 13:34-35", insight: "Love for one another is how the world recognizes Jesus' followers." },
    ],
    reflection: [
      "Do I truly believe God loves me, not just people in general?",
      "Which line of 1 Corinthians 13 is hardest for me to live out?",
      "Who could I show Christ's love to in a practical way this week?",
    ],
    prayer:
      "Loving Father, thank You that nothing can separate me from Your love in Christ Jesus. Let Your love settle deep in my heart, and let it overflow into kindness, patience, and care for the people around me. In Jesus' name, Amen.",
    related: ["kindness", "unity", "servanthood"],
  },
  {
    id: "unity",
    title: "Unity in the Body",
    category: "Love & Community",
    summary: "Pursuing harmony and mutual love among believers",
    intro:
      "Jesus prayed that His disciples would be one, just as He and the Father are one. Christian unity is a supernatural witness to a fractured, divided world.",
    passages: [
      { reference: "Psalm 133:1", insight: "Behold, how good and how pleasant it is for brethren to dwell together in unity!" },
      { reference: "Ephesians 4:1-3", insight: "Walk worthy of the calling... endeavoring to keep the unity of the Spirit in the bond of peace." },
      { reference: "John 17:21", insight: "That they all may be one, as You, Father, are in Me, and I in You... that the world may believe." },
      { reference: "Romans 12:16", insight: "Be of the same mind toward one another. Do not set your mind on high things, but associate with the humble." },
      { reference: "1 Corinthians 12:12-13", insight: "For as the body is one and has many members... so also is Christ." },
    ],
    reflection: [
      "Is there any brother or sister in Christ against whom I am harboring critical thoughts?",
      "How can I be a peacemaker instead of fueling division or debate?",
      "How does our unity as believers showcase the gospel to unbelievers?",
    ],
    prayer:
      "Lord Jesus, thank You for adopting us into one holy family. Break down walls of division, pride, and offense in my heart. Teach me to preserve the unity of the Spirit in the bond of peace, loving my spiritual family deeply. Amen.",
    related: ["love", "kindness", "servanthood"],
  },
  {
    id: "kindness",
    title: "Gentleness & Kindness",
    category: "Love & Community",
    summary: "Reflecting God's tender-hearted care in our daily interactions",
    intro:
      "In a harsh, abrasive world, kindness is a revolutionary act. God's kindness leads us to repentance, and our gentleness can melt hardened hearts when arguments fail.",
    passages: [
      { reference: "Colossians 3:12", insight: "Put on tender mercies, kindness, humility, meekness, longsuffering." },
      { reference: "Proverbs 3:3-4", insight: "Let not mercy and truth forsake you; bind them around your neck... so find favor and high esteem." },
      { reference: "Galatians 5:22-23", insight: "The fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness." },
      { reference: "Romans 2:4", insight: "Do you despise the riches of His goodness... not knowing that the goodness of God leads you to repentance?" },
      { reference: "1 Peter 3:15", insight: "Always be ready to give a defense to everyone who asks you... with meekness and fear." },
    ],
    reflection: [
      "Have I been reacting with harshness or defensiveness when challenged recently?",
      "How does remembering God's immense kindness toward me inspire me to be gentle?",
      "What random act of kindness can I do today without drawing attention to myself?",
    ],
    prayer:
      "Father, soften any rough edges in my personality. Let the fruit of Your Holy Spirit flourish in me — especially kindness and gentleness. May everyone who interacts with me taste something of the tenderness of Christ. Amen.",
    related: ["love", "speech", "unity"],
  },
  {
    id: "servanthood",
    title: "Serving One Another",
    category: "Love & Community",
    summary: "Finding greatness in selfless, humble service",
    intro:
      "The world equates greatness with having servants; the kingdom of God equates greatness with being one. When we serve others in love, we walk the exact path Jesus walked.",
    passages: [
      { reference: "Mark 10:43-45", insight: "Whoever desires to be great among you shall be your servant... For even the Son of Man came not to be served, but to serve." },
      { reference: "Galatians 5:13", insight: "Through love serve one another." },
      { reference: "John 13:14-15", insight: "If I then, your Lord and Teacher, have washed your feet, you also ought to wash one another's feet." },
      { reference: "1 Peter 4:10", insight: "As each one has received a gift, minister it to one another, as good stewards of the manifold grace of God." },
      { reference: "Matthew 25:40", insight: "Inasmuch as you did it to one of the least of these My brethren, you did it to Me." },
    ],
    reflection: [
      "What gifts, skills, or resources has God given me that I can use to serve others?",
      "Do I serve with joy, or do I feel resentful when my efforts are not acknowledged?",
      "Who is 'the least of these' in my community that I can reach out to?",
    ],
    prayer:
      "Lord Jesus, King of Kings who washed dusty feet, strip away my selfishness. Give me the heart of a servant. Show me where I can meet someone's practical need today with joyful humility. In Your name, Amen.",
    related: ["humility", "love", "unity"],
  },

  // --- Spiritual Strength & Victory ---
  {
    id: "suffering",
    title: "Strength in Suffering",
    category: "Strength & Victory",
    summary: "God's presence, comfort, and purpose in difficult seasons",
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
    related: ["strength", "perseverance", "comfort"],
  },
  {
    id: "strength",
    title: "Strength in Weakness",
    category: "Strength & Victory",
    summary: "Discovering that Christ's power rests on our acknowledged limits",
    intro:
      "We often try to hide our limitations, thinking God only uses the strong and self-sufficient. Yet Paul discovered that God's power is perfected not in our competence, but right where we are weak.",
    passages: [
      { reference: "2 Corinthians 12:9-10", insight: "My grace is sufficient for you, for My strength is made perfect in weakness... when I am weak, then I am strong." },
      { reference: "Isaiah 40:29", insight: "He gives power to the weak, and to those who have no might He increases strength." },
      { reference: "Psalm 73:26", insight: "My flesh and my heart fail; but God is the strength of my heart and my portion forever." },
      { reference: "Philippians 4:13", insight: "I can do all things through Christ who strengthens me." },
      { reference: "Nehemiah 8:10", insight: "Do not sorrow, for the joy of the Lord is your strength." },
    ],
    reflection: [
      "What weakness or limitation have I been resenting instead of yielding to Christ?",
      "How does resting in Christ's sufficiency bring freedom from performance anxiety?",
      "In what area of my life do I need to pray, 'Lord, be my strength' today?",
    ],
    prayer:
      "Jesus, I stop pretending to be strong on my own. I boast gladly in my weaknesses so that Your power may rest on me. Be the strength of my heart today and let Your glory shine through my cracked vessel. Amen.",
    related: ["suffering", "warfare", "perseverance"],
  },
  {
    id: "warfare",
    title: "The Armor of God",
    category: "Strength & Victory",
    summary: "Standing firm against the enemy with spiritual weaponry",
    intro:
      "We are in a real spiritual battle, but we do not fight for victory — we fight from the victory Jesus already won. God equips us with His heavenly armor so we can stand firm against every scheme.",
    passages: [
      { reference: "Ephesians 6:10-11", insight: "Be strong in the Lord and in the power of His might. Put on the whole armor of God." },
      { reference: "Ephesians 6:14-17", insight: "Stand therefore, having girded your waist with truth, having put on the breastplate of righteousness..." },
      { reference: "2 Corinthians 10:4-5", insight: "The weapons of our warfare are not carnal but mighty in God for pulling down strongholds." },
      { reference: "James 4:7", insight: "Submit to God. Resist the devil and he will flee from you." },
      { reference: "1 John 4:4", insight: "He who is in you is greater than he who is in the world." },
    ],
    reflection: [
      "Which piece of the armor of God do I most need to actively put on today?",
      "What negative thought pattern is a stronghold that needs to be taken captive to Christ?",
      "How does remembering 'He who is in you is greater' instill quiet confidence?",
    ],
    prayer:
      "Mighty God, I put on the belt of truth, the breastplate of righteousness, the gospel of peace, the shield of faith, the helmet of salvation, and take up the sword of the Spirit. Strengthen me to stand firm in Your victory today. Amen.",
    related: ["strength", "courage", "perseverance"],
  },
  {
    id: "perseverance",
    title: "Running the Race",
    category: "Strength & Victory",
    summary: "Fixing our eyes on Jesus and persevering to the finish",
    intro:
      "The Christian journey is not a sprint; it is an endurance marathon. When fatigue sets in, we keep our eyes fixed on Jesus, who ran before us and is cheering us across the finish line.",
    passages: [
      { reference: "Hebrews 12:1-2", insight: "Let us run with endurance the race that is set before us, looking unto Jesus, the author and finisher of our faith." },
      { reference: "James 1:2-4", insight: "The testing of your faith produces patience... let patience have its perfect work." },
      { reference: "2 Timothy 4:7", insight: "I have fought the good fight, I have finished the race, I have kept the faith." },
      { reference: "1 Corinthians 9:24", insight: "Run in such a way that you may obtain it." },
      { reference: "Romans 5:3-4", insight: "Tribulation produces perseverance; and perseverance, character; and character, hope." },
    ],
    reflection: [
      "Where am I feeling weary and tempted to give up or slack off?",
      "What weight or distraction is slowing down my spiritual run?",
      "How does focusing on Jesus at the finish line rekindle my endurance?",
    ],
    prayer:
      "Lord Jesus, Pioneer and Perfecter of my faith, I fix my eyes on You. When my legs grow tired and the road is steep, give me holy endurance. Help me lay aside every encumbrance and run my race with joy until I see You face to face. Amen.",
    related: ["strength", "joy", "hope"],
  },
  {
    id: "joy",
    title: "Unshakable Joy",
    category: "Strength & Victory",
    summary: "Rejoicing in the Lord when happiness fades",
    intro:
      "Happiness depends on happenstance, but joy is a supernatural fruit of the Holy Spirit rooted in the unshakeable reality of our salvation. The joy of the Lord is our strength.",
    passages: [
      { reference: "Nehemiah 8:10", insight: "Do not sorrow, for the joy of the Lord is your strength." },
      { reference: "Philippians 4:4", insight: "Rejoice in the Lord always. Again I will say, rejoice!" },
      { reference: "Psalm 16:11", insight: "In Your presence is fullness of joy; at Your right hand are pleasures forevermore." },
      { reference: "John 15:11", insight: "These things I have spoken to you, that My joy may remain in you, and that your joy may be full." },
      { reference: "1 Peter 1:8", insight: "Though now you do not see Him, yet believing, you rejoice with joy inexpressible and full of glory." },
    ],
    reflection: [
      "Has my joy been stolen by circumstance or superficial disappointment?",
      "How does meditating on the permanence of my salvation restore deep joy?",
      "How can I radiate the joy of the Lord to someone having a gloomy day?",
    ],
    prayer:
      "God of all joy, thank You that in Your presence is fullness of joy. When worldly happiness fades, fill me with the inexpressible, holy joy of knowing Jesus. Let Your joy be my daily strength and my song. In Jesus' name, Amen.",
    related: ["gratitude", "praise", "peace"],
  },
];

/** Lookup a single devotional by its slug ID. */
export function getDevotional(id: string | undefined): Devotional | undefined {
  if (!id) return undefined;
  return DEVOTIONALS.find((d) => d.id === id);
}

/**
 * Returns a devotional deterministically for any calendar date.
 * Uses a multi-year procedural hash (combining year and dayOfYear) so that
 * topics cycle endlessly across days and years, giving users an infinite stream
 * of daily devotionals without requiring any network connection.
 */
export function devotionalForDate(date = new Date()): Devotional {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  // Hash combining year and dayOfYear to avoid repeating the exact same offset every year:
  const hash = Math.abs(year * 367 + dayOfYear);
  return DEVOTIONALS[hash % DEVOTIONALS.length];
}

/** Devotional chosen for today. */
export function devotionalOfTheDay(date = new Date()): Devotional {
  return devotionalForDate(date);
}

/** Get a random devotional, optionally excluding a given ID. */
export function getRandomDevotional(excludeId?: string): Devotional {
  const pool = excludeId ? DEVOTIONALS.filter((d) => d.id !== excludeId) : DEVOTIONALS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? DEVOTIONALS[0];
}

/** Get adjacent devotional (next or prev in the list). */
export function getAdjacentDevotional(currentId: string, direction: "next" | "prev"): Devotional {
  const idx = DEVOTIONALS.findIndex((d) => d.id === currentId);
  if (idx === -1) return DEVOTIONALS[0];
  const nextIdx = direction === "next" ? (idx + 1) % DEVOTIONALS.length : (idx - 1 + DEVOTIONALS.length) % DEVOTIONALS.length;
  return DEVOTIONALS[nextIdx];
}

/** Filter and search devotionals by search query and optional category. */
export function searchDevotionals(query: string, category?: DevotionalCategory | "All"): Devotional[] {
  const q = query.trim().toLowerCase();
  return DEVOTIONALS.filter((d) => {
    if (category && category !== "All" && d.category !== category) return false;
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.intro.toLowerCase().includes(q) ||
      d.passages.some((p) => p.reference.toLowerCase().includes(q) || p.insight.toLowerCase().includes(q))
    );
  });
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
