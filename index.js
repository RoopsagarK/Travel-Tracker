import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "roop9854",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function getUsers() {
  const result = await db.query("SELECT * FROM users;");
  return result.rows;
}

async function checkVisisted(user) {
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id = $1;",
    [user]
  );
  const color_res = await db.query("SELECT color FROM users WHERE id = $1", [
    user,
  ]);
  const color = color_res.rows[0].color;
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return { countries: countries, color: color };
}
app.get("/", async (req, res) => {
  const response = await checkVisisted(currentUserId);
  const users = await getUsers();
  console.log(response);
  res.render("index.ejs", {
    countries: response.countries,
    total: response.countries.length,
    users: users,
    color: response.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT * FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    let findex = 0;
    result.rows.forEach((row, index) => {
      if (row.country_name.toLowerCase() == input) {
        findex = index;
      }
    });
    const data = result.rows[findex];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  console.log(req.body);
  if (req.body.add) {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const newUser = req.body;
  const data = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [newUser.name, newUser.color]
  );
  currentUserId = data.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
