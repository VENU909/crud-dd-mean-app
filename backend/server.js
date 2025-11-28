const express = require("express");
const app = express();
const db = require("./app/models");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.error("Cannot connect to the database!", err);
  });

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Test application." });
});

// Tutorial routes
require("./app/routes/turorial.routes")(app);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}.`);
});
