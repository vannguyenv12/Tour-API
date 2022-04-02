const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, tourController.createTour);

router.use(authController.protect);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

router.post(
  '/:tourId/reviews',
  authController.restrictTo('user', 'admin'),
  reviewController.setTourUserId,
  reviewController.createReview
);

router.get('/:tourId/reviews', reviewController.getAllReviews);

module.exports = router;
