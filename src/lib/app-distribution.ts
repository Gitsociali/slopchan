const appDistribution = import.meta.env.VITE_APP_DISTRIBUTION?.trim().toLowerCase();
const isAppUpdateEnabled = appDistribution !== 'fdroid';

export { isAppUpdateEnabled };
