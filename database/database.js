const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "franz1023  ",
  database: "staffflow",
});

db.connect((error) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    return;
  }

  console.log("Connected to StaffFlow database!");
});

module.exports = db;
