export interface UndoCommand {
  label: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

/** Bounded linear history. A new command clears the redo branch. */
export class UndoStack {
  private past: UndoCommand[] = [];
  private future: UndoCommand[] = [];

  constructor(private readonly depth = 100) {}

  push(command: UndoCommand): void {
    this.past.push(command);
    if (this.past.length > this.depth) this.past.shift();
    this.future = [];
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get nextUndoLabel(): string | undefined {
    return this.past[this.past.length - 1]?.label;
  }

  get nextRedoLabel(): string | undefined {
    return this.future[this.future.length - 1]?.label;
  }

  /** The command only moves between stacks once it succeeds, so failures can be retried. */
  async undo(): Promise<UndoCommand | undefined> {
    const command = this.past[this.past.length - 1];
    if (!command) return undefined;
    await command.undo();
    this.past.pop();
    this.future.push(command);
    return command;
  }

  async redo(): Promise<UndoCommand | undefined> {
    const command = this.future[this.future.length - 1];
    if (!command) return undefined;
    await command.redo();
    this.future.pop();
    this.past.push(command);
    return command;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
