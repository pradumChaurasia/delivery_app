import express, { Router } from 'express';
import { connectToDatabase } from '../db/mongodb';
import { ObjectId } from 'bson';
const dealershipRouter = Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtSecret, jwtExpiration } from '../config';

dealershipRouter.post('/registerdealership', (req, res) => {
    const { email, dealership_name, dealership_location, password, dealership_info, carsId, dealsId, sold_vehiclesId } = req.body;
    connectToDatabase()
        .then((db) => {
            const dealershipCollection = db.collection('dealership');

            // Check if the dealership already exists
            return dealershipCollection.findOne({ dealership_email: email })
                .then((existingDealer) => {
                    if (existingDealer) {
                        throw new Error('Dealer already exists');
                    }

                    // Hash the password
                    return bcrypt.hash(password, 10);
                })
                .then((hashedPassword) => {
                    const newDealer = {
                        dealership_email: email,
                        dealership_name: dealership_name,
                        dealership_location: dealership_location,
                        password: hashedPassword,
                        dealership_info: dealership_info,
                        cars: carsId,
                        deals: dealsId,
                        sold_vehicles: sold_vehiclesId
                    };

                    // Insert the new dealership into the database
                    return dealershipCollection.insertOne(newDealer);
                })
                .then(() => {
                    res.status(201).json({ message: 'Dealer registered successfully' });
                })
                .catch((error) => {
                    console.error('Error registering dealer:', error);
                    res.status(500).json({ error: 'An error occurred' });
                })
        })
})

dealershipRouter.get('/dealership/login', (req, res, next) => {

    const token = req.header('Authorization').replace('Bearer ', '');
    connectToDatabase()
        .then((db) => {
            const dealershipCollection = db.collection('dealership');

            // Verify the token
            return jwt.verify(token, jwtSecret)
                .then((decoded) => {
                    return dealershipCollection.findOne({ _id: decoded._id, 'tokens.token': token });
                })
                .then((dealer) => {
                    if (!dealer) {
                        throw new Error();
                    }

                    req.token = token;
                    req.dealer = dealer;

                    next();
                })
                .catch(() => {
                    res.status(401).json({ error: 'Please authenticate' });
                })
        })
        .catch((error) => {
            console.error('Error connecting to database:', error);
            res.status(500).json({ error: 'An error occurred' });
        })
})




// view all  cars
dealershipRouter.get('/dealerships', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const carsCollection = db.collection('cars');
            return carsCollection.find().toArray();
        })
        .then((cars) => {
            res.json(cars);
        })
        .catch((error) => {
            console.log('Error in retrieving cars', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// view all the cars sold by dealership
dealershipRouter.get('/sold-cars', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const soldVehiclesCollection = db.collection('sold_vehicles');
            return soldVehiclesCollection.find().toArray()
        })
        .then((soldCars) => {
            res.json(soldCars)
        })
        .catch((error) => {
            console.error('Error fetching sold cars:', error);
            res.status(500).json({ error: 'An error occurred' });
        })
})

// add cars to dealership
dealershipRouter.post('/cars', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const carsCollection = db.collection('cars');
            const newCar = req.body;
            return carsCollection.insertOne(newCar);
        })
        .then(() => {
            res.json({ message: 'Car added successfully' });
        })
        .catch((error) => {
            console.error('Error adding car:', error);
            res.status(500).json({ error: 'An error occurred' });
        });
});

// view deals provided by the dealership
dealershipRouter.get('/view-deals', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const dealCollection = db.collection('deals');
            return dealCollection.find().toArray();
        })
        .then((deals) => {
            res.json(deals)
        })
        .catch((error) => {
            console.log('Error in viewing cars:', error)
            res.status.apply(500).json({ error: "An error occurred" })
        })
})

// add deals to dealership
dealershipRouter.post('/deals', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const dealCollection = db.collection('deals');
            const newDeal = req.body;
            return dealCollection.insertOne(newDeal);
        })
        .then(() => {
            res.json({ message: 'Deal added successfully' });
        })
        .catch((error) => {
            console.error('Error adding deal:', error);
            res.status(500).json({ error: 'An error occurred' });
        });
});

// view all the vehicles ,dealership has sold
dealershipRouter.get('/all-vehicles', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const soldVehiclesCollection = db.collection('sold_vehicles');
            return soldVehiclesCollection.find().toArray();
        })
        .then((soldvehicles) => {
            res.json(soldvehicles);
        })
        .catch((error) => {
            console.error('Error fetching sold vehicles:', error);
            res.status(500).json({ error: 'An error occurred' });
        })
})

// add new vehicle to the list of sold vehicles after dealership is made
dealershipRouter.post('/sold-vehicles', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const soldVehiclesCollection = db.collection('sold_vehicles');
            const newSoldVehicle = req.body;
            return soldVehiclesCollection.insertOne(newSoldVehicle);
        })
        .then(() => {
            res.json({ message: 'Sold vehicle added successfully' });
        })
        .catch((error) => {
            console.error('Error adding sold vehicle:', error);
            res.status(500).json({ error: 'An error occurred' });
        });
});


export default dealershipRouter