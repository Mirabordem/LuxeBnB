const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { Spot, SpotImage, Review, User, ReviewImage, Booking } = require('../../db/models');

const router = express.Router();


//___________________________________________________________________

// GET ALL OF CURRENT USER BOOKINGS:


router.get('/current', requireAuth, async (req, res) => {
    const {user} = req;

    const bookings = await Booking.findAll({
        where: {
          userId: user.id      //  only spots created by current user
        },
        include: [
            {
                model: Spot,
                attributes: {exclude: ['description', 'updatedAt', 'createdAt']},
                include: [SpotImage]
            }
        ]
      });

      let allBookings = [];
        bookings.forEach(booking => {
        allBookings.push(booking.toJSON())
      });

// add reviewImage:
      allBookings.forEach(booking => {
        for(let key in booking.Spot) {
          booking.Spot.SpotImages.forEach(spot => {
            if(spot.preview) {
              booking.Spot.previewImage = spot.url
            }
          })
        }
        delete booking.Spot.SpotImages
      })

        return res.json({Bookings: allBookings})
      });


//___________________________________________________________________

// EDIT/UPDATE AN EXISTING BOOKING:


router.put('/:bookingId', requireAuth, async(req, res) => {
  const { user } = req;
  const { startDate, endDate } = req.body;

  const booking = await Booking.findByPk(req.params.bookingId);

  if(!booking) {
    res.status(404);
    return res.json({
      message: "Booking couldn't be found"
    })
  };

  if(booking.userId !== user.id) {
    res.status(403);
    return res.json({
      message: "Forbidden: this booking doesn't belong to current user"
    })
  };

  const userStart = new Date(startDate);
  const userEnd = new Date(endDate);

  let newStart = userStart.getTime(); // number
  let newEnd = userEnd.getTime();

// validate booking dates:
  if(newStart > newEnd) {
    res.status(400);
    return res.json({message: "Bad Request: endDate cannot be on or before startDate"})
  };

// validate booking is still ahead:
  let currentDate = new Date();
  currentDate = JSON.stringify(currentDate);
  currentDate = currentDate.slice(1, 11)

  let currentDateFormat = new Date(currentDate)
  currentDateFormat = currentDateFormat.getTime(); // number

  let endCheck = new Date(booking.endDate);
  endCheck = endCheck.getTime();  // number

  if(currentDateFormat > newEnd || currentDateFormat > newStart) {
    res.status(400);
    return res.json({message: "Booking date cannot be a date in the past."})
  }

  if(currentDateFormat > endCheck) {
    res.status(403);
    return res.json({message: "Past bookings can't be modified"})
  };

// booking conflicts:
  let conflict = false;

  const spot = await Spot.findByPk(booking.spotId);
  const spotBookings = await spot.getBookings();

  let spotBookingsJson = [];
  spotBookings.forEach(booking => {
    spotBookingsJson.push(booking.toJSON())
  });

  spotBookingsJson.forEach(booking => {
    let formatStart = JSON.stringify(booking.startDate);
    formatStart = formatStart.slice(1,11);
    let bookingStart = new Date(formatStart);

    let formatEnd = JSON.stringify(booking.endDate);
    formatEnd = formatEnd.slice(1,11);
    let bookingEnd = new Date(formatEnd);

    bookingStart = bookingStart.getTime();
    bookingEnd = bookingEnd.getTime();

    if(bookingStart <= newStart && newStart <= bookingEnd) conflict = true;
    if(newStart <= bookingStart && bookingStart <= newEnd && newEnd <= bookingStart) conflict = true;
    if(newStart <= bookingStart && newEnd >= bookingStart) conflict = true;
  });

  if(conflict) {
    res.status(403);
    return res.json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking"
      }
    })
  };

  booking.startDate = startDate;
  booking.endDate = endDate;

  await booking.save();

  res.status(200);
  res.json(booking)
});



//___________________________________________________________________

  // DELETE A BOOKING:

  router.delete('/:bookingId', requireAuth, async(req,res) => {
  const { user } = req;

  const booking = await Booking.findByPk(req.params.bookingId);


  if(!booking) {
    res.status(404);
    return res.json({ message: "Booking couldn't be found" })
  };

  const spot = await booking.getSpot();

  if(user.id !== booking.userId && user.id !== spot.ownerId) {
    res.status(403);
    return res.json({message: "Forbidden: user is not the owner of this booking."})
  };


// validate booking didn't start yet:
  let jsonStart = JSON.stringify(booking.startDate);
  jsonStart = jsonStart.slice(1, 11);
  let bookingStart = new Date(jsonStart);


  bookingStart = bookingStart.getTime(); // number


  let currentDate = new Date();
  currentDate = JSON.stringify(currentDate);
  currentDate = currentDate.slice(1, 11)

  let currentDateFormat = new Date(currentDate)
  currentDateFormat = currentDateFormat.getTime(); //number

  if(currentDateFormat < bookingStart){  // comparing
    await booking.destroy();

    res.status(200);
    return res.json({ message: "Successfully deleted" })
  } else {
    res.status(400);
    return res.json({ message: "Bookings that have been started can't be deleted" })
  }
})



//___________________________________________________________________













module.exports = router;
