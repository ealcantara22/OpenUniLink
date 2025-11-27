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

  program.name('openunilink').description('OpenUniLink control CLI');
  program
    .option(
      '-c, --config <path>',
      'Config file path',
      '/etc/openunilink/config.yaml',
    );

  program
    .command('discover')
    .description('Discover supported devices (e.g. L-Wireless receivers)')
    .action(discoverHandler);

  program
    .command('sensors')
    .description('Show temperatures as seen by OpenUniLink')
    .action(async () => {
      const opts = program.opts<{ config: string }>();

      return sensorsHandler(opts);
    });

  program
    .command('status')
    .description('Show current profile and per-cluster target PWM based on temps')
    .action(async () => {
      const opts = program.opts<{ config: string }>();

      return statusHandler(opts);
    });

  program
    .command('list')
    .description('List configured clusters')
    .action(async () => {
      const opts = program.opts<{ config: string }>();

      return listHandler(opts);
    });

  program
    .command('temp')
    .description('Print current temps')
    .action(async () => {
      const opts = program.opts<{ config: string }>();

      return tempHandler(opts);
    });

  await program.parseAsync(argv);
}
