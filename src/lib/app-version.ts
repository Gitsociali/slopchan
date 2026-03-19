import packageJson from '../../package.json';

const resolveCurrentAppVersion = (): string => {
  const configuredVersion = import.meta.env.VITE_APP_VERSION;

  if (typeof configuredVersion === 'string' && configuredVersion.trim().length > 0) {
    return configuredVersion.trim();
  }

  return packageJson.version;
};

const currentAppVersion = resolveCurrentAppVersion();

export { currentAppVersion };
