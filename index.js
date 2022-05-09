const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbidden" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i7lva.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const itemsCollection = client.db("wirehouse").collection("foods");
    const myItemsCollection = client.db("wirehouse").collection("my-items");

    // All fruits items
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = itemsCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    // Fruits Details
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id:ObjectId(id) };
      const item = await itemsCollection.findOne(query);
      res.send(item);
    });

    // Update Fruits quantity
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updateFruits = req.body;
      const filter = {_id:id};
      const options = { upsert: true };
      const updated = {
        $set: {
          quantity: updateFruits.quantity,
        },
      };
      const result = await itemsCollection.updateOne(filter, updated, options);
      res.send(result);
    });

    // Inventory Items DELETE
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id:id };
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });

    // POST(Add Fruits))
    app.post("/myItems", async (req, res) => {
      const newItems = req.body;
    await itemsCollection.insertOne(newItems);
      const result = await myItemsCollection.insertOne(newItems);
    
     
    });

    // myItems Fruits Collection
    app.get("/myItems", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = myItemsCollection.find(query);
        
        const myItems = await cursor.toArray();
        res.send(myItems);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    // myItems Delete
    app.delete("/myItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await myItemsCollection.deleteOne(query);
      res.send(result);
    });

    // Deliver Button
    app.put("/items/deliver/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id:ObjectId(id)};
      const product=itemsCollection.findOne(query)
      const deliver = product.quantity - 1;
      const updateDoc = {
        $set: {
          quantity: deliver,
        },
      };

      const result = await itemsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // JWT login
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "28d",
      });
      res.send({ accessToken });
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("CRUD Operation Running.........");
});

app.listen(port, () => {
  console.log(`Server Side Running...... ${port}`);
});
