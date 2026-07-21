import { findTutorialProgress, upsertTutorialProgress } from '../db/tutorialProgress.queries.js';

export function getProgress(userId, tutorialKey, tutorialVersion) {
  return findTutorialProgress(userId, tutorialKey, tutorialVersion);
}

export function saveProgress(userId, tutorialKey, tutorialVersion, progress) {
  return upsertTutorialProgress(userId, tutorialKey, tutorialVersion, progress);
}

