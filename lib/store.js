const fs = require('fs');
const path = require('path');

class Store {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  }
  all() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (e) { return []; }
  }
  add(record) {
    const list = this.all();
    const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...record, submittedAt: new Date().toISOString() };
    list.push(item);
    fs.writeFileSync(this.file, JSON.stringify(list, null, 2));
    return item;
  }
}
module.exports = { Store };
