const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;


// middlewares 
app.use(cors())
app.use(express.json())
// car_doctor
// 



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstdb.zlsfblg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorize access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'unauthorize access' })
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const serviceCollection = client.db('carDoctor').collection('services')
        const bookingCollection = client.db('carDoctor').collection('bookings')

        // jwt 
        app.post('/jwt', (req, res) => {
            const user = req.body;

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            // console.log(token)
            res.send({ token })
        })


        // get all services 
        app.get('/services', async (req, res) => {

            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // get one services 

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {

                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, img: 1, service_id: 1 },
            };
            const result = await serviceCollection.findOne(query, options)
            res.send(result)
        })

        // bookings 
        // app.get('/bookings', async (req, res) => {
        //     const email = req.query.email;
        //     let query = {}
        //     if (req.query.email) {
        //         query = { email: req.query.email }
        //     }
        //     const result = await 
        // })

        app.get('/bookings', verifyJWT, async (req, res) => {
            const decoded = req.decoded.email;

            // console.log('after verify i am coming', decoded)
            const email = req.query.email;

            if (!decoded.email === email) {
                return res.status(402).send({ error: true, message: 'access forbidden' })
            }


            let query = {}
            if (email) {
                query = { email }
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        // delete booking 
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)

            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const updateBooking = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateBooking.status
                }
            };

            const result = await bookingCollection.updateOne(filter, updateDoc)
            res.send(result)

        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('car doctor server is running')

})


app.listen(port, () => {
    console.log('car doctor server is running on port', port)
})
