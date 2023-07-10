import express, { Router } from 'express';
import { connectToDatabase } from '../db/mongodb';
import { ObjectId } from 'bson';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtSecret, jwtExpiration } from '../config.js';
const userRouter = new Router();


userRouter.post('/registerUser', (req, res) => {
    const { user_email, password, vehicleId } = req.body;
    
    connectToDatabase()
      .then((db) => {
        const userCollection = db.collection('users');
        return userCollection.findOne({ user_email })
          .then((user) => {
            if (user) {
              return res.status(400).json({ error: 'User already exists' });
            }
            return bcrypt.hash(password, 10)
              .then((hashedPassword) => {
                const newUser = {
                  user_email: user_email,
                  user_location: faker.location.city(),
                  user_info: faker.lorem.sentences(),
                  password: hashedPassword,
                  vehicle_info: vehicleId
                };
  
                return userCollection.insertOne(newUser)
                  .then(() => {
                    res.status(201).json({ message: 'User registered successfully' });
                  });
              });
          });
      })
      .catch((error) => {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'An error occurred' });
      });
  });
  

userRouter.get('/user/login', (req, res) => {
    const { user_email, password } = req.body;
    connectToDatabase()
        .then((db) => {
            const usersCollection = db.collection('users');

            // Find the user by email
            return usersCollection.findOne({ user_email })
                .then((user) => {
                    if (!user) {
                        throw new Error('Invalid credentials')
                    }
                    return bcrypt.compare(password, user.password)
                        .then((isvalidPassword) => {
                            if (!isvalidPassword) {
                                throw new Error('Invalid credentials')
                            }
                            const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: jwtExpiration });

                            res.json({ token });
                        })
                })
                .catch((error) => {
                    console.log('Error logging in user:', error)
                    res.status(401).json({ error: 'Invalid credentials' });
                })
        })
        .catch(error => {
            console.error('Error connecting to database:', error);
            res.status(500).json({ error: 'An error occurred' });
        });
})


userRouter.get('/cars', (req, res) => {
    connectToDatabase()
        .then((db) => {
            const carsCollection = db.collection('cars');
            return carsCollection.find().toArray();
        })
        .then((cars) => {
            res.json(cars)
        })
        .catch((e) => {
            console.log('Error in retrieving cars', e)
            res.status(500).json({ e: 'Internal Server Error' })
        })

})

userRouter.get('/dealerships/:dealershipId/cars', (req, res) => {
    const { dealershipId } = req.params;

    connectToDatabase()
        .then((db) => {
            const dealershipCollection = db.collection('dealership');
            return dealershipCollection.findOne({ _id: new ObjectId(dealershipId) })
                .then((dealership) => {
                    if (!dealership) {
                        return res.status(404).json({ error: 'Dealership not found' });
                    }

                    const carsCollection = db.collection('cars');
                    const carIds = dealership.cars.map((carId) => new ObjectId(carId));

                    return carsCollection.find({ _id: { $in: carIds } }).toArray();
                })
                .then((cars) => {
                    res.json(cars);
                })
                .catch((error) => {
                    console.error('Error retrieving cars in dealership:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch((error) => {
            console.error('Error connecting to the database:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});
//  view dealership with certain car
userRouter.get('/cars/:carId/dealership', (req, res) => {
    const { carId } = req.params;
    connectToDatabase()
        .then((db) => {
            const dealershipCollection = db.collection('dealership');
            return dealershipCollection.find({ cars: new ObjectId(carId) }).toArray();
        })
        .then((dealerships) => {
            res.json(dealerships);
        })
        .catch((error) => {
            console.error('Error retrieving dealerships with car:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


userRouter.get('/users/:userId/vehicles', (req, res) => {
    const { userId } = req.params;
    connectToDatabase()
        .then((db) => {
            const userCollection = db.collection('users');
            return userCollection.findOne({ _id: new ObjectId(userId) })
                .then((user) => {
                    if (!user) {
                        return Promise.reject({ status: 404, message: 'User not found' });
                    }
                    const soldVehiclesCollection = db.collection('sold_vehicles');
                    const vehicleInfoArray = Array.isArray(user.vehicle_info) ? user.vehicle_info : [user.vehicle_info];
                    return soldVehiclesCollection.find({ _id: { $in: vehicleInfoArray } }).toArray();
                })
                .then((vehicles) => {
                    res.json(vehicles);
                })
                .catch((error) => {
                    console.error('Error retrieving user vehicles:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch((error) => {
            console.error('Error connecting to the database:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

userRouter.get('/cars/:carId/deals', (req, res) => {
    const { carId } = req.params;
    connectToDatabase()
        .then((db) => {
            const dealCollection = db.collection('deals');
            return dealCollection.find({ car_id: new ObjectId(carId) }).toArray();
        })
        .then((deals) => {
            res.json(deals);
        })
        .catch((error) => {
            console.error('Error retrieving deals on car:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


// Endpoint to view all deals from a certain dealership
userRouter.get('/dealerships/:dealershipId/deals', (req, res) => {
    const { dealershipId } = req.params;
    connectToDatabase()
        .then((db) => {
            const dealershipCollection = db.collection('dealership');
            return dealershipCollection.findOne({ _id: new ObjectId(dealershipId) })
                .then((dealership) => {
                    if (!dealership) {
                        return Promise.reject({ status: 404, message: 'Dealership not found' });
                    }
                    // const dealCollection = db.collection('deals');
                    // return dealCollection.find({ _id: { $in: dealership.deals } }).toArray();
                    const dealCollection = db.collection('deals');
                    const dealIds = Object.values(dealership.deals[0]);
                    return dealCollection.find({ _id: { $in: dealIds } }).toArray();
                })
                .then((deals) => {
                    res.json(deals);
                })
                .catch((error) => {
                    console.error('Error retrieving dealership deals:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch((error) => {
            console.error('Error connecting to the database:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


export default userRouter;
