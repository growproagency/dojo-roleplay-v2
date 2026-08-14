export const NEW_USER_TOUR_KEY = 'new-user-tour';
export const NEW_USER_TOUR_VERSION = 1;

export const newUserTourSteps = [
  {
    id: 'welcome',
    route: '/dashboard',
    title: 'Welcome to Dojo Roleplay',
    content: 'Take a quick tour of the training workflow. Nothing will be started or changed while you look around.',
  },
  {
    id: 'start-practice',
    route: '/dashboard',
    target: '[data-tour="start-practice"]',
    title: 'Begin a practice session',
    content: 'Use this button whenever you are ready to set up a new AI roleplay call.',
  },
  {
    id: 'choose-scenario',
    route: '/practice',
    target: '[data-tour="scenario-list"]',
    title: 'Choose a scenario',
    content: 'Each scenario gives the AI caller a situation, character, and set of training objectives.',
  },
  {
    id: 'choose-difficulty',
    route: '/practice',
    target: '[data-tour="difficulty"]',
    title: 'Set the difficulty',
    content: 'Choose Easy, Medium, or Hard to control how challenging the conversation will be.',
  },
  {
    id: 'start-call',
    route: '/practice',
    target: '[data-tour="start-call"]',
    title: 'Start the AI caller',
    content: 'When your setup is ready, this button begins the call. This tour will never start one for you.',
  },
  {
    id: 'review-results',
    route: '/practice',
    target: '[data-tour="call-history-nav"]',
    title: 'Review your results',
    content: 'Call History is where you can revisit completed sessions, scores, transcripts, and coaching feedback.',
  },
  {
    id: 'finish',
    route: '/practice',
    title: 'You are ready to practice',
    content: 'Choose a scenario and difficulty, then start your first roleplay whenever you are ready.',
  },
];

