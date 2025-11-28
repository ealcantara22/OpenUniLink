#!/usr/bin/env node
import { mainCli } from './cli/openUniLinkCtl';
import { mainDaemon } from './deamon';

async function main() {
  const argv = process.argv.slice(2);
  const modeOrCommand = argv[0];

  if (modeOrCommand === 'daemon') {
    // Daemon mode: parse a very simple --config and run forever
    const configFlagIndex = argv.indexOf('--config');
    const configPath
      = configFlagIndex >= 0 && argv[configFlagIndex + 1]
        ? argv[configFlagIndex + 1]
        : '/etc/openunilink/config.yaml';

    await mainDaemon(configPath);
    return;
  }

  // CLI mode (discover, sensors, status, etc.)
  await mainCli(argv);

  process.exit(process.exitCode ?? 0);
}

void main();
