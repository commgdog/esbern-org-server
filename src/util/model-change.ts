const fieldBlacklist = ['password'];
const fieldCensors = ['password'];

export default class ModelChange {
  before: Record<string, unknown> = {};

  after: Record<string, unknown> = {};

  constructor(before: Record<string, unknown>) {
    this.before = before;
  }

  getChanges(): string {
    const fields = Object.keys(this.before);
    const changes: object[] = [];
    fields.forEach((field: string) => {
      if (fieldBlacklist.includes(field)) {
        return;
      }
      if (
        JSON.stringify(this.before[field]) !== JSON.stringify(this.after[field])
      ) {
        changes.push({
          field,
          before: fieldCensors.includes(field) ? '*****' : this.before[field],
          after: fieldCensors.includes(field) ? '*****' : this.after[field],
        });
      }
    });
    return JSON.stringify(changes);
  }
}
