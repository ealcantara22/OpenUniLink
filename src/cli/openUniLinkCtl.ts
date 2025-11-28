import { Command } from 'commander';
import discoverHandler from './handlers/discoverHandler';
import listHandler from './handlers/listHandler';
import sensorsHandler from './handlers/sensorsHandler';
import statusHandler from './handlers/statusHandler';
import tempHandler from './handlers/tempHandler';

/**
 * The main CLI entry point function for OpenUniLink. This function sets up and executes
 * the command-line interface for controlling and interacting with the OpenUniLink system.
 *
 * @param {string[]} argv - The array of command-line arguments passed to the CLI, typically
 * including the command name and additional options or parameters.
 * @return {Promise<void>} A promise representing the asynchronous execution of the CLI.
 */
export async function mainCli(argv: string[]): Promise<void> {
  const program = new Command();
  const DEFAULT_CONFIG = '/etc/openunilink/config.yaml';

  program.name('openunilink').description('OpenUniLink control CLI');

  program
    .command('discover')
    .option('-c, --config <string>', 'Config file path', DEFAULT_CONFIG)
    .description('Discover supported devices (e.g. L-Wireless receivers)')
    .action(discoverHandler);

  program
    .command('sensors')
    .description('Show temperatures as seen by OpenUniLink')
    .option('-c, --config <string>', 'Config file path', DEFAULT_CONFIG)
    .action(async (opts: { config: string }) => sensorsHandler(opts));

  program
    .command('status')
    .description('Show current profile and per-cluster target PWM based on temps')
    .option('-c, --config <string>', 'Config file path', DEFAULT_CONFIG)
    .action(async (opts: { config: string }) => statusHandler(opts));

  program
    .command('list')
    .description('List configured clusters')
    .option('-c, --config <string>', 'Config file path', DEFAULT_CONFIG)
    .action(async (opts: { config: string }) => listHandler(opts));

  program
    .command('temp')
    .description('Print current temps')
    .option('-c, --config <string>', 'Config file path', DEFAULT_CONFIG)
    .action(async (opts: { config: string }) => tempHandler(opts));

  await program.parseAsync(argv, { from: 'user' });
}
