const pg = require("pg");
const express = require("express");
const bodyParser = require("body-parser");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream_shop_db"
);
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        Select * from flavors order by name;
    `;

    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          Select * from flavors where id = $1;
      `;

    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          update flavors set name = $2, is_favorite = $3, updated_at= now() where id = $1 returning *;
      `;

    const response = await client.query(SQL, [
      req.params.id,
      req.body.name,
      !req.body.is_favorite ? false: req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/flavors/", async (req, res, next) => {
  try {
    const SQL = `
          insert into flavors(name) values ($1) returning *;
      `;

    const response = await client.query(SQL, [req.body.name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          delete from flavors where id = $1;
      `;

    const response = await client.query(SQL, [
      req.params.id,
      req.body.name,
      req.body.is_favorite,
    ]);
    // res.send("Successfully Deleted");
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("Connected to database");
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) not null,
        is_favorite BOOLEAN  DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    )
    `;

  await client.query(SQL);
  console.log("tables created");

  SQL = `
    insert into flavors(name) values ('chocolate')
  `;

  await client.query(SQL);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
