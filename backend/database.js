const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "franz102307",
  database: "staffflow",
});

connection.connect((error) => {
  if (error) {
    console.error("MySQL connection failed:", error.message);
    return;
  }

  console.log("Connected to StaffFlow database!");
});

module.exports = connection;
