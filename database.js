const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    return console.error(
      "❌Error connecting to the SQLite database:",
      err.message
    );
  }
  console.log("Connected to the SQLite database.");
  db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
    if (err) {
      console.error("❌Error listing tables:", err.message);
    } else {
      console.log(
        "Database tables:",
        tables.map((table) => table.name)
      );
    }
  });
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS configurations (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_ids TEXT NOT NULL,
    duration INTEGER NOT NULL
  )`);
});

function addConfiguration(guildId, channelIds, duration) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO configurations (guild_id, channel_ids, duration) VALUES (?, ?, ?)`;
    db.run(
      query,
      [guildId, JSON.stringify(channelIds), duration],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function getConfigurations(guildId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT channel_ids, duration FROM configurations WHERE guild_id = ?`;
    db.all(query, [guildId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          rows.map((row) => ({
            channel_ids: JSON.parse(row.channel_ids),
            duration: row.duration,
          }))
        );
      }
    });
  });
}

module.exports = { addConfiguration, getConfigurations };
