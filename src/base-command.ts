
import {Command} from '@oclif/command';
import inquirer, {
  Answers,
  DistinctQuestion,
  InputQuestion,
  ListChoiceOptions,
  Validator,
} from 'inquirer';
import {inspect} from 'util';

/**
 * Base command for CollabLand CLI
 */
export abstract class BaseCommand extends Command {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected options: Record<string, any>;
  protected arguments: Record<string, string>;

  /**
   * Initialize the command
   */
  async init() {
    await super.init();

    const result = this.parse(this.constructor as typeof BaseCommand);
    this.options = result.flags;
    this.arguments = result.args;
  }

  /**
   * Print out the help
   */
  help() {
    return this._help();
  }

  /**
   * Format the json object
   * @param obj - JSON object
   */
  print(obj: object) {
    return inspect(obj, false, null, true);
  }

  /**
   * Prompt questions if they are not answered by the initial answers,
   * options, or arguments
   * @param questions - One or more questions
   * @param initialAnswers - Initial answers
   */
  async prompt<T extends Answers = Answers>(
    questions: DistinctQuestion<T> | ReadonlyArray<DistinctQuestion<T>>,
    initialAnswers?: Partial<T>,
    skipAnsweredQuestions = true,
  ) {
    if (!skipAnsweredQuestions) {
      return inquirer.prompt(questions, initialAnswers);
    }
    initialAnswers = {
      ...this.options,
      ...this.arguments,
      ...initialAnswers,
    } as Partial<T>;
    const answers = await inquirer.prompt(questions, initialAnswers);
    return answers;
  }

  /**
   * Prompt for confirmation (Y/n)
   * @param message - Message for the prompt
   * @param name - Name of the question to be answered
   * @param defaultValue - Default value
   */
  async confirm(message: string, name?: string, defaultValue?: boolean) {
    name = name ?? 'yes';
    const answers = await this.prompt([
      {
        type: 'confirm',
        name,
        default: defaultValue,
        message: message,
      },
    ]);
    return !!answers[name];
  }

  /**
   * Prompt a list of menu items to choose from
   * @param items - An object that maps name to value
   * @param message - Message
   */
  async menu(
    items: Record<string, string>,
    message = 'Main menu',
    name = 'action',
  ) {
    const choices = Object.entries(items).map(i => ({name: i[1], value: i[0]}));
    const answers: Answers = await this.prompt([
      {
        type: 'list',
        name,
        choices,
        default: 0,
        message: message,
      },
    ]);
    return answers[name];
  }

  async promptInput(
    message: string,
    options?: Omit<InputQuestion, 'type' | 'message'>,
  ) {
    const name = options?.name ?? 'text';
    const answers = await this.prompt([
      {
        type: 'input',
        name,
        message: message,
        validate: stringRequired,
        ...options,
      },
    ]);
    return answers[name] as string;
  }
}

/**
 * A validator to ensure the input is a non-empty string
 * @param input - Input value
 */
export const stringRequired: Validator = input =>
  input != null && input.length > 0 ? true : 'The input cannot be empty';
