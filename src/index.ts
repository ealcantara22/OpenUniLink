#!/usr/bin/env node
import { mainCli } from './cli/openUniLinkCtl';
import { mainDaemon } from './deamon';

async function main() {
  const [, , modeOrCommand, ...rest] = process.argv;

  // If the first arg is literally "daemon", treat it as daemon mode.
  if (modeOrCommand === 'daemon') {
    const configFlagIndex = rest.indexOf('--config');
    const configPath
      = configFlagIndex >= 0 && rest[configFlagIndex + 1]
        ? rest[configFlagIndex + 1]
        : '/etc/openunilink/config.yaml';

    await mainDaemon(configPath);
    return;
  }

  // Otherwise, passing everything to the CLI
  await mainCli(process.argv.slice(2));
}

void main();
