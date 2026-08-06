const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT;


const app = express();
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

const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks")
)

//midleware
const verifyToken = async(req, res, next) => {
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).json({message: "Unauthorized"});
    }

    const token = authHeader.split(" ")[1];
    if(!token){
        return res.status(401).json({message: "Unauthorized"});
    }
    console.log(token)

    try{
        const {payload} = await jwtVerify(token, JWKS)
        console.log('payload', payload)
        next()
    } catch(error){
        return res.status(403).json({message: "Forbidden"})
    }

}


async function run() {
    try {
        await client.connect();
        
        const db = client.db("docappoints");
        const appointCollection = db.collection("appoints");
        const doctorsCollection = db.collection("doctors");

        app.get("/doctors", async(req, res) => {
            const result = await doctorsCollection.find().toArray();
            res.json(result);
        });

        
        app.get("/doctors/:id", verifyToken, async (req, res) => {
            const {id} = req.params;
            const doctorId = new ObjectId(id);
            const result = await doctorsCollection.findOne({_id: doctorId})
            res.send(result)
        })

         app.get("/appoint", verifyToken, async (req, res) => {
            const result = await appointCollection.find().toArray();
            res.send(result)
        })

        app.post("/appoint", verifyToken, async(req, res)=> {
            const appointData = req.body;
            console.log('appointment data', appointData);
            const result = await appointCollection.insertOne(appointData)
            res.send(result)
        })
        app.patch("/appoint/:id", verifyToken, async(req, res)=> {
            const {id} = req.params;
            const updatedAppoint = req.body;

            const result = await appointCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: updatedAppoint}
            )
            res.send(result)
        })
        app.delete("/appoint/:id", verifyToken,  async(req, res) =>{
            const {id} = req.params;
            const result = await appointCollection.deleteOne({_id: new ObjectId(id)})
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