require("dotenv").config();
const express = require("express");
const db = require("./db/index");
const cors = require("cors");

const morgan = require("morgan");
const app = express();

app.use(cors()); // <== to connect different domain / port, from backend to frontend
app.use(express.json());

// Get All Restaurants
app.get("/api/v1/restaurants", async (req, res) => {

  try {
    // const results = await db.query("select * from restaurants");
    const restaurantRatingsData = await db.query(
      "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id;"
    )

    res.status(200).json({
      status: "success",
      results: restaurantRatingsData.rows.length,
      data: {
        restaurants: restaurantRatingsData.rows,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// Get a Restaurant
app.get("/api/v1/restaurants/:id", async (req, res) => {
  console.log(req.params.id);

  try {
    const restaurant = await db.query(
      "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id where id = $1;", 
    [req.params.id,]);

    const reviews = await db.query("select * from reviews where restaurant_id = $1", [
      req.params.id,
    ]);
    
    res.status(200).json({
      status: "success",
      data: {
        restaurant: restaurant.rows[0],
        reviews: reviews.rows,
      },
    });
  } catch(err) {
    console.log(err);
  } 
});

//Create a Restaurant
app.post("/api/v1/restaurants", async (req,res) => {
  console.log(req.body);
  
  try {
    const results = await db.query("INSERT INTO restaurants (name, location, price_range) values ($1, $2, $3) returning *", [
      req.body.name,
      req.body.location,
      req.body.price_range
    ])
    console.log(results);
    res.status(201).json({
      status: "success",
      data: {
        restaurant: results.rows[0],
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// Update Restaurants
app.put("/api/v1/restaurants/:id", async (req, res) => {
  try {
    const results = await db.query(
      "UPDATE restaurants SET name =$1, location = $2, price_range= $3 where id = $4 returning *", 
      [req.body.name, req.body.location, req.body.price_range, req.params.id]
    );
    res.status(200).json({
      status: "success",
      data: {
        restaurant: results.rows[0],
      },
    });
  } catch (err) {
    console.log(err);
  }
  console.log(req.params.id);
  console.log(req.body);
});

// Delete Restaurant
app.delete("/api/v1/restaurants/:id", async (req, res) => {
  try{
    const resultsReviews = await db.query("DELETE FROM reviews WHERE reviews.restaurant_id = $1", [req.params.id])
    const results = await db.query("DELETE FROM restaurants WHERE restaurants.id = $1 returning *", [req.params.id])

    res.status(204).json({
      status: "success",
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/v1/restaurants/:id/addReview", async (req,res) => {
  try {
    const newReview = await db.query("INSERT INTO reviews (restaurant_id, name, review, rating) values ($1, $2, $3, $4) returning *;", 
    [req.params.id, req.body.name, req.body.review, req.body.rating]);

    res.status(201).json({
      status: "success",
      data: {
        review: newReview.rows[0],
      }
    });
  } catch (err) {
    console.log(err);
  }
})

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`server is up and listening on port ${port}`)
});