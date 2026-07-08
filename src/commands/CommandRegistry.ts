import type { Command } from "./Command";

export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  registerMany(commands: Command[]): void {
    commands.forEach((command) => this.register(command));
  }

  list(): Command[] {
    return [...this.commands.values()].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  get(commandId: string): Command | undefined {
    return this.commands.get(commandId);
  }

  run(commandId: string): boolean {
    const command = this.get(commandId);
    if (!command) return false;
    command.run();
    return true;
  }
}

