class LRUCache {
  constructor(limit = 500) {
    this.limit = Math.max(1, Number(limit));
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, val);
    if (this.map.size > this.limit) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
  }
}

module.exports = LRUCache;