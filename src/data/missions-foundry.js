const AI_AUDIT_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-sharing', text: 'AI training was already off', severity: 'safe' },
      { value: 'was-on', text: 'AI training was on — now disabled', severity: 'warn' },
      { value: 'no-option', text: 'No opt-out available for my region', severity: 'crit' },
      { value: 'skip', text: "Couldn't check right now", severity: 'skip' },
    ],
  },
];

const AI_OPTOUT_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you complete the opt-out?',
    options: [
      { value: 'opted-out', text: 'Yes, AI training is now disabled', severity: 'safe' },
      { value: 'no-account', text: "I don't use this service", severity: 'safe' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

const HISTORY_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you clear your AI history?',
    options: [
      { value: 'cleared', text: 'Yes, deleted AI conversation history', severity: 'safe' },
      { value: 'opted-out', text: 'Opted out but kept history', severity: 'warn' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

export const FOUNDRY_MISSIONS = [
  // ═══════════════════════════════════════
  // META AI
  // ═══════════════════════════════════════
  {
    id: 'ai_meta-recon',
    accountId: 'ai_meta',
    phase: 'recon',
    title: 'AI Training Audit: Meta',
    briefing: "Meta uses your public Facebook posts, Instagram photos, comments, and Meta AI conversations to train their AI models. In the US, there is no toggle to opt out — but you can limit exposure by making accounts private and avoiding Meta AI. EU/UK users have a 'Right to object' form in the Privacy Centre.",
    steps: [
      { text: 'Open Meta Privacy Centre', url: 'https://www.facebook.com/privacy/center/' },
      { text: 'Check your Instagram privacy: Settings > Account > Data use for AI improvement' },
      { text: 'Review if your posts are set to Public (these feed the AI)' },
      { text: 'Note whether you have opt-out options (varies by region)' },
    ],
    debriefQs: AI_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"Meta is training their AI on every public post, photo, and comment you\'ve ever made. Let\'s see what options you have."',
      debrief: {
        'no-sharing': '"Already locked down. Rare for Meta — nice work."',
        'was-on': '"Good catch. That toggle was feeding years of your content into their models."',
        'no-option': '"No opt-out available in your region. We\'ll focus on limiting what\'s public instead."',
        'skip': '"No rush. Meta isn\'t going anywhere — unfortunately."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'ai_meta-optout',
    accountId: 'ai_meta',
    phase: 'fortify',
    title: 'Limit Meta AI Training',
    briefing: "Since Meta doesn't offer a universal opt-out for US users, the best defense is reducing what's public. Make your Instagram private, restrict Facebook post visibility to Friends, and avoid using Meta AI features — every conversation with Meta AI is training data.",
    steps: [
      { text: 'Instagram: Settings > Account privacy > Toggle "Private account" on' },
      { text: 'Facebook: Settings > Audience > Change default post audience to "Friends"' },
      { text: 'Instagram: Settings > Account > Data use for AI improvement > Don\'t allow (if available)' },
      { text: 'Avoid using Meta AI in chats — every message trains the model' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"Can\'t stop Meta entirely, but we can starve the pipeline. Less public data means less training fuel."',
      debrief: {
        'opted-out': '"Accounts locked down. They can\'t train on what they can\'t see."',
        'no-account': '"No Meta accounts — that\'s the strongest opt-out there is."',
        'later': '"Come back when you can. Every day public is another training cycle."',
      },
    },
    estimatedMinutes: 5,
  },

  // ═══════════════════════════════════════
  // GOOGLE GEMINI
  // ═══════════════════════════════════════
  {
    id: 'ai_google-recon',
    accountId: 'ai_google',
    phase: 'recon',
    title: 'AI Training Audit: Google',
    briefing: "Google uses your Gemini prompts, shared files, and connected app data to train their AI models. The 'Gemini Apps Activity' setting controls whether your conversations are reviewed and used for training. Even when turned off, chats are still saved for 72 hours for safety.",
    steps: [
      { text: 'Open Gemini Activity settings', url: 'https://myactivity.google.com/product/gemini' },
      { text: 'Check if "Gemini Apps Activity" is on or off' },
      { text: 'Review your stored Gemini conversations' },
      { text: 'Check Google Account > Data & privacy for broader AI settings' },
    ],
    debriefQs: AI_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"Google keeps everything. Your Gemini chats, your searches, your docs — check what\'s feeding their models."',
      debrief: {
        'no-sharing': '"Activity was already off. Good instinct."',
        'was-on': '"Was on — now fixed. Note: they still keep chats 72 hours even with it off."',
        'no-option': '"Check again — Google usually offers this to all users."',
        'skip': '"Take your time."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'ai_google-optout',
    accountId: 'ai_google',
    phase: 'fortify',
    title: 'Disable Gemini Training',
    briefing: "Turn off Gemini Apps Activity to stop Google from using your conversations for training. Then clear your existing Gemini history so past conversations aren't used in future training cycles.",
    steps: [
      { text: 'Open Gemini Activity', url: 'https://myactivity.google.com/product/gemini' },
      { text: 'Turn off "Gemini Apps Activity"' },
      { text: 'Click "Delete activity" to clear conversation history' },
      { text: 'Select "All time" and confirm deletion' },
    ],
    debriefQs: HISTORY_DEBRIEF,
    scoutDialog: {
      briefing: '"Two steps: stop the flow, then clear the reservoir. Both matter."',
      debrief: {
        'cleared': '"Pipeline cut and history wiped. Clean slate."',
        'opted-out': '"Training stopped. Consider clearing history too — it sits there until you do."',
        'later': '"Come back when you can."',
      },
    },
    estimatedMinutes: 5,
  },

  // ═══════════════════════════════════════
  // CHATGPT / OPENAI
  // ═══════════════════════════════════════
  {
    id: 'ai_openai-recon',
    accountId: 'ai_openai',
    phase: 'recon',
    title: 'AI Training Audit: ChatGPT',
    briefing: "OpenAI uses your ChatGPT conversations to improve their models unless you opt out. Every prompt, every uploaded file, every code snippet you paste — it all potentially feeds the next training run. Business and API users are excluded by default, but consumer users are opted in.",
    steps: [
      { text: 'Open ChatGPT Settings', url: 'https://chat.openai.com/settings' },
      { text: 'Go to Data controls' },
      { text: 'Check if "Improve the model for everyone" is toggled on' },
      { text: 'Review what data ChatGPT stores about you' },
    ],
    debriefQs: AI_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"Every question you\'ve asked ChatGPT could be training data for the next model. Let\'s check if that pipeline is open."',
      debrief: {
        'no-sharing': '"Already off — you were ahead of the game."',
        'was-on': '"Was on. Every conversation until now was fair game for training. We\'ll fix that next."',
        'no-option': '"That\'s unusual — the toggle should be there for all consumer users."',
        'skip': '"When you\'re ready."',
      },
    },
    estimatedMinutes: 3,
  },
  {
    id: 'ai_openai-optout',
    accountId: 'ai_openai',
    phase: 'fortify',
    title: 'Disable ChatGPT Training',
    briefing: "One toggle stops OpenAI from using your conversations to train future models. Your chats still work normally — you just stop contributing to the training dataset.",
    steps: [
      { text: 'Open ChatGPT Settings', url: 'https://chat.openai.com/settings' },
      { text: 'Click "Data controls"' },
      { text: 'Toggle off "Improve the model for everyone"' },
      { text: 'Confirm the change is saved' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"One switch. That\'s it. They made this one easy, at least."',
      debrief: {
        'opted-out': '"Done. Your prompts stay private from here on."',
        'no-account': '"No ChatGPT account — nothing to train on."',
        'later': '"Come back for this one. It\'s quick."',
      },
    },
    estimatedMinutes: 3,
  },

  // ═══════════════════════════════════════
  // MICROSOFT COPILOT
  // ═══════════════════════════════════════
  {
    id: 'ai_microsoft-optout',
    accountId: 'ai_microsoft',
    phase: 'fortify',
    title: 'Manage Copilot Privacy',
    briefing: "Microsoft Copilot processes your prompts and connected documents. The Microsoft Privacy Dashboard lets you review and delete stored data. For Copilot in Office 365, your organization's admin controls data usage — but personal Copilot data is yours to manage.",
    steps: [
      { text: 'Open Microsoft Privacy Dashboard', url: 'https://account.microsoft.com/privacy/' },
      { text: 'Review "Browsing history" and "Search history" sections' },
      { text: 'Clear Copilot conversation history' },
      { text: 'Check Bing/Edge settings for AI data sharing toggles' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft weaves Copilot into everything — Word, Outlook, Edge, Bing. Check the privacy dashboard for the master controls."',
      debrief: {
        'opted-out': '"Dashboard cleaned up. Keep an eye on it — Microsoft likes to reset these."',
        'no-account': '"No Microsoft account — clean."',
        'later': '"When you\'re ready."',
      },
    },
    estimatedMinutes: 5,
  },

  // ═══════════════════════════════════════
  // LINKEDIN
  // ═══════════════════════════════════════
  {
    id: 'ai_linkedin-optout',
    accountId: 'ai_linkedin',
    phase: 'fortify',
    title: 'Disable LinkedIn AI Training',
    briefing: "LinkedIn silently opted everyone in to AI training in 2024, before most people noticed. Your profile, posts, articles, and engagement data are used to train their generative AI. There's a toggle — but they buried it. Turning it off doesn't affect your visibility to recruiters.",
    steps: [
      { text: 'Open LinkedIn Privacy Settings', url: 'https://www.linkedin.com/mypreferences/d/categories/privacy' },
      { text: 'Find "Data for Generative AI Improvement"' },
      { text: 'Toggle it OFF' },
      { text: 'Confirm the change saved' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"LinkedIn turned this on for everyone without asking. Your resume, your posts, your articles — all training data until you flip this switch."',
      debrief: {
        'opted-out': '"LinkedIn AI training cut off. Your professional history stays yours."',
        'no-account': '"No LinkedIn — no training data from you."',
        'later': '"Come back for this. It\'s one toggle but it matters."',
      },
    },
    estimatedMinutes: 3,
  },

  // ═══════════════════════════════════════
  // ADOBE
  // ═══════════════════════════════════════
  {
    id: 'ai_adobe-optout',
    accountId: 'ai_adobe',
    phase: 'fortify',
    title: 'Disable Adobe AI Training',
    briefing: "Adobe's Content Analysis setting lets them analyze your creative work to train Firefly and other AI models. If you use Photoshop, Illustrator, or Lightroom with cloud storage, your art could be training data. Adobe reversed some policies after backlash, but the settings still need checking.",
    steps: [
      { text: 'Open Adobe Account Privacy', url: 'https://account.adobe.com/privacy' },
      { text: 'Find "Content analysis" settings' },
      { text: 'Disable content analysis for AI training' },
      { text: 'Check Creative Cloud app settings for local analysis toggles' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"Your art, your photos, your designs — Adobe was analyzing them all. Let\'s shut that down."',
      debrief: {
        'opted-out': '"Creative work secured. Your art trains you, not their models."',
        'no-account': '"No Adobe account — your creative work is safe."',
        'later': '"Come back for this, especially if you do creative work."',
      },
    },
    estimatedMinutes: 5,
  },

  // ═══════════════════════════════════════
  // AMAZON ALEXA
  // ═══════════════════════════════════════
  {
    id: 'ai_amazon-recon',
    accountId: 'ai_amazon',
    phase: 'recon',
    title: 'Voice Data Audit: Alexa',
    briefing: "Amazon stores your Alexa voice recordings and uses them to improve AI models. Every 'Hey Alexa' command, every music request, every smart home command — recorded and stored. You can review and delete these recordings, and opt out of the human review program.",
    steps: [
      { text: 'Open Alexa Privacy', url: 'https://www.amazon.com/alexa-privacy/apd/rvd' },
      { text: 'Review your voice recording history' },
      { text: 'Check "Manage Your Alexa Data" for how long recordings are kept' },
      { text: 'Note if "Help improve Amazon services" is enabled' },
    ],
    debriefQs: AI_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"Alexa is always listening. Let\'s see how much she\'s been remembering."',
      debrief: {
        'no-sharing': '"Already opted out — good."',
        'was-on': '"Years of voice recordings stored. Time to clean house."',
        'no-option': '"Check the Alexa app directly — the web settings can be limited."',
        'skip': '"When you\'re ready."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'ai_amazon-optout',
    accountId: 'ai_amazon',
    phase: 'fortify',
    title: 'Disable Alexa AI Training',
    briefing: "Stop Amazon from using your voice recordings for AI training, and delete your stored voice history. You keep all Alexa functionality — she just stops sending your recordings to Amazon's training pipeline.",
    steps: [
      { text: 'Alexa app: More > Settings > Alexa Privacy' },
      { text: 'Tap "Manage Your Alexa Data"' },
      { text: 'Turn off "Help improve Amazon services and develop new features"' },
      { text: 'Delete voice recording history: Choose "Delete all recordings"' },
    ],
    debriefQs: HISTORY_DEBRIEF,
    scoutDialog: {
      briefing: '"Two moves: stop the recording pipeline, then wipe what they already have. Alexa still works — she just stops snitching."',
      debrief: {
        'cleared': '"Voice history gone, training pipeline cut. Alexa works the same — just privately."',
        'opted-out': '"Training stopped. Consider deleting the history too."',
        'later': '"This one\'s worth doing. Your voice is uniquely identifying."',
      },
    },
    estimatedMinutes: 5,
  },

  // ═══════════════════════════════════════
  // APPLE INTELLIGENCE / SIRI
  // ═══════════════════════════════════════
  {
    id: 'ai_apple-optout',
    accountId: 'ai_apple',
    phase: 'fortify',
    title: 'Manage Apple AI Privacy',
    briefing: "Apple processes most AI on-device, which is more private than cloud-based alternatives. But Siri requests that go to Apple's servers can be used for improvement. The 'Improve Siri & Dictation' toggle controls whether Apple reviews your voice data.",
    steps: [
      { text: 'iPhone/iPad: Settings > Privacy & Security > Analytics & Improvements' },
      { text: 'Turn off "Improve Siri & Dictation"' },
      { text: 'Settings > Siri > Siri & Dictation History > Delete Siri & Dictation History' },
      { text: 'Review Apple Intelligence settings under Settings > Apple Intelligence & Siri' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple is better than most on privacy, but Siri still phones home. One toggle and a history clear locks it down."',
      debrief: {
        'opted-out': '"Siri training disabled. Apple\'s on-device processing keeps the rest private."',
        'no-account': '"No Apple devices — nothing to train on."',
        'later': '"Low urgency compared to others, but worth doing."',
      },
    },
    estimatedMinutes: 3,
  },

  // ═══════════════════════════════════════
  // X / GROK
  // ═══════════════════════════════════════
  {
    id: 'ai_x-optout',
    accountId: 'ai_x',
    phase: 'fortify',
    title: 'Disable Grok Training on X',
    briefing: "X (formerly Twitter) uses your public posts, engagement data, and Grok conversations to train xAI's models. They also share data with third-party AI collaborators. The opt-out is buried in privacy settings — most users don't even know it exists.",
    steps: [
      { text: 'Open X Privacy Settings', url: 'https://x.com/settings/privacy_and_safety' },
      { text: 'Find "Data sharing and personalization"' },
      { text: 'Open "Grok" settings and uncheck the training data box' },
      { text: 'Also uncheck "Third-party Collaborators" data sharing' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"X feeds your posts and engagement straight into Grok. Two checkboxes control it — uncheck both."',
      debrief: {
        'opted-out': '"Grok cut off from your data. Your posts stay social, not training material."',
        'no-account': '"No X account — nothing for Grok to learn from."',
        'later': '"Come back for this. It\'s quick but impactful."',
      },
    },
    estimatedMinutes: 3,
  },

  // ═══════════════════════════════════════
  // REDDIT
  // ═══════════════════════════════════════
  {
    id: 'ai_reddit-optout',
    accountId: 'ai_reddit',
    phase: 'fortify',
    title: 'Manage Reddit AI Usage',
    briefing: "Reddit licensed its entire archive to Google and OpenAI for AI training. Individual opt-outs are limited — Reddit's terms of service grant them broad rights to public posts. But you can limit personalization, control visibility, and be aware of what's exposed.",
    steps: [
      { text: 'Open Reddit Privacy Settings', url: 'https://www.reddit.com/settings/privacy' },
      { text: 'Disable all personalization toggles' },
      { text: 'Review your post history for sensitive content that\'s now AI training data' },
      { text: 'Consider editing or deleting posts you don\'t want in training sets' },
    ],
    debriefQs: AI_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: '"Reddit sold the whole archive. Your posts, your comments, your AMAs — all in the training set. We can limit future exposure."',
      debrief: {
        'opted-out': '"Personalization cut. Future posts are still at risk, but you\'ve reduced the surface."',
        'no-account': '"No Reddit account — your words aren\'t in the training set."',
        'later': '"This one\'s a rabbit hole. Come back when you have time."',
      },
    },
    estimatedMinutes: 8,
  },
];
