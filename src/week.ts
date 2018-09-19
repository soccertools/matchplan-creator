export class Week {
  public days = [];

  constructor() {
    for (let i = 0; i < 7; i++) {
        this.days.push([]);
    }
  }
}
