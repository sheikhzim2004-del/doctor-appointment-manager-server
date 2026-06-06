const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const uri = process.env.MONGODB_URI;


const app = express();
const PORT = process.env.PORT;
app.use(cors())
app.use(express.json())

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();
        
        const db = client.db("docappoints")
        const appointCollection = db.collection("appoints")
        const doctorsCollection = db.collection("doctors")

        app.get("/doctors", async(req, res) => {
            const result = await doctorsCollection.find().toArray();
            res.json(result);
        });

        app.get("/doctors/:id", async (req, res) => {
            const {id} = req.params;
            const result = await doctorsCollection.findOne({_id: new ObjectId(id)})
            res.send(result)
        })

        app.post("/appoint", async(req, res)=> {
            const appointData = req.body
            console.log(appointData);
            const result = await appointCollection.insertOne(appointData)

            res.send(result)
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server is running Perfectly")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})