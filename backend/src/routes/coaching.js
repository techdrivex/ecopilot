const express = require('express');
const { body, validationResult } = require('express-validator');
const aiCoachingService = require('../services/aiCoachingService');
const Trip = require('../models/Trip');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/coaching/analyze-trip:
 *   post:
 *     summary: Analyze trip data and get AI coaching insights
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: ID of the trip to analyze
 *     responses:
 *       200:
 *         description: Trip analysis completed successfully
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Analysis failed
 */
router.post('/analyze-trip', [
  body('tripId').isMongoId().withMessage('Valid trip ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tripId } = req.body;
    const userId = req.user._id;

    // Find trip
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Analyze trip with AI
    const analysis = await aiCoachingService.analyzeTrip(trip);

    // Update trip with insights
    trip.insights = analysis.recommendations.map(rec => ({
      type: rec.type,
      message: rec.description,
      impact: rec.potentialSavings.fuel > 0 ? 'positive' : 'negative',
      fuelSavings: rec.potentialSavings.fuel,
      co2Savings: rec.potentialSavings.co2,
      timestamp: new Date()
    }));

    await trip.save();

    res.json({
      success: true,
      message: 'Trip analysis completed successfully',
      data: {
        analysis,
        trip: {
          id: trip._id,
          ecoScore: trip.ecoScore,
          insights: trip.insights
        }
      }
    });

  } catch (error) {
    logger.error('Trip analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze trip'
    });
  }
});

/**
 * @swagger
 * /api/coaching/recommendations:
 *   get:
 *     summary: Get personalized coaching recommendations
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 */
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent trips for analysis
    const recentTrips = await Trip.find({ userId })
      .sort({ startTime: -1 })
      .limit(20)
      .populate('vehicleId', 'make model year fuelType');

    if (recentTrips.length === 0) {
      return res.json({
        success: true,
        message: 'No trips found for analysis',
        data: {
          recommendations: [],
          summary: {
            totalTrips: 0,
            averageEcoScore: 0,
            totalFuelSaved: 0,
            totalCo2Saved: 0
          }
        });
    }

    // Generate recommendations based on recent trips
    const recommendations = await aiCoachingService.generateRecommendations({
      userId,
      trips: recentTrips
    });

    // Calculate summary statistics
    const totalTrips = recentTrips.length;
    const averageEcoScore = recentTrips.reduce((sum, trip) => sum + trip.ecoScore, 0) / totalTrips;
    const totalFuelSaved = recentTrips.reduce((sum, trip) => sum + (trip.fuelConsumed || 0), 0);
    const totalCo2Saved = recentTrips.reduce((sum, trip) => sum + (trip.co2Emissions || 0), 0);

    res.json({
      success: true,
      message: 'Recommendations retrieved successfully',
      data: {
        recommendations: recommendations.slice(0, limit),
        summary: {
          totalTrips,
          averageEcoScore: Math.round(averageEcoScore),
          totalFuelSaved: Math.round(totalFuelSaved * 100) / 100,
          totalCo2Saved: Math.round(totalCo2Saved * 100) / 100
        }
      }
    });

  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

/**
 * @swagger
 * /api/coaching/insights:
 *   get:
 *     summary: Get driving insights and analytics
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for insights
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 */
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || 'month';

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get trips for the period
    const trips = await Trip.find({
      userId,
      startTime: { $gte: startDate }
    }).sort({ startTime: -1 });

    if (trips.length === 0) {
      return res.json({
        success: true,
        message: 'No trips found for the selected period',
        data: {
          insights: [],
          trends: {},
          summary: {}
        }
      });
    }

    // Calculate insights
    const insights = {
      efficiency: {
        averageEcoScore: trips.reduce((sum, trip) => sum + trip.ecoScore, 0) / trips.length,
        bestTrip: trips.reduce((best, trip) => trip.ecoScore > best.ecoScore ? trip : best),
        worstTrip: trips.reduce((worst, trip) => trip.ecoScore < worst.ecoScore ? trip : worst)
      },
      behavior: {
        totalHarshAccelerations: trips.reduce((sum, trip) => sum + trip.drivingBehavior.harshAccelerations, 0),
        totalHarshBraking: trips.reduce((sum, trip) => sum + trip.drivingBehavior.harshBraking, 0),
        totalIdleTime: trips.reduce((sum, trip) => sum + trip.drivingBehavior.idleTime, 0),
        averageSpeed: trips.reduce((sum, trip) => sum + trip.averageSpeed, 0) / trips.length
      },
      environmental: {
        totalCo2Emissions: trips.reduce((sum, trip) => sum + trip.co2Emissions, 0),
        totalFuelConsumed: trips.reduce((sum, trip) => sum + trip.fuelConsumed, 0),
        totalDistance: trips.reduce((sum, trip) => sum + trip.distance, 0)
      },
      trends: {
        ecoScoreTrend: this.calculateTrend(trips.map(trip => trip.ecoScore)),
        fuelEfficiencyTrend: this.calculateTrend(trips.map(trip => trip.fuelEfficiency)),
        distanceTrend: this.calculateTrend(trips.map(trip => trip.distance))
      }
    };

    res.json({
      success: true,
      message: 'Insights retrieved successfully',
      data: {
        insights,
        period,
        tripCount: trips.length
      }
    });

  } catch (error) {
    logger.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights'
    });
  }
});

/**
 * @swagger
 * /api/coaching/tips:
 *   get:
 *     summary: Get eco-driving tips
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [acceleration, braking, speed, idling, route, general]
 *         description: Category of tips to retrieve
 *     responses:
 *       200:
 *         description: Tips retrieved successfully
 */
router.get('/tips', async (req, res) => {
  try {
    const category = req.query.category;
    const userId = req.user._id;

    // Get user's vehicle for personalized tips
    const user = await User.findById(userId).populate('vehicles');
    const primaryVehicle = user.vehicles?.find(v => v.isPrimary);

    const tips = {
      acceleration: [
        'Gradually press the accelerator pedal instead of flooring it',
        'Anticipate traffic flow to avoid sudden stops and starts',
        'Use cruise control on highways when traffic conditions allow',
        'Accelerate smoothly from stops and maintain steady speeds'
      ],
      braking: [
        'Brake gently and early to avoid harsh stops',
        'Look ahead and anticipate traffic to reduce sudden braking',
        'Use engine braking when going downhill',
        'Maintain safe following distance to avoid emergency braking'
      ],
      speed: [
        'Maintain steady speeds within posted limits',
        'Use cruise control on highways for consistent speed',
        'Avoid rapid speed changes and aggressive acceleration',
        'Drive at optimal speeds for your vehicle (usually 50-80 km/h)'
      ],
      idling: [
        'Turn off your engine when parked for more than 30 seconds',
        'Avoid warming up your engine for extended periods',
        'Use remote start sparingly and only when necessary',
        'Plan your routes to minimize waiting time'
      ],
      route: [
        'Plan your route to avoid heavy traffic and construction',
        'Use navigation apps to find the most efficient routes',
        'Combine multiple errands into one trip',
        'Consider alternative routes during peak traffic hours'
      ],
      general: [
        'Keep your vehicle well-maintained for optimal efficiency',
        'Remove unnecessary weight from your vehicle',
        'Use air conditioning efficiently',
        'Check tire pressure regularly for better fuel economy'
      ]
    };

    // Add vehicle-specific tips if available
    if (primaryVehicle) {
      const vehicleTips = primaryVehicle.getEcoDrivingTips();
      tips.vehicle_specific = vehicleTips;
    }

    const selectedTips = category ? tips[category] || tips.general : tips;

    res.json({
      success: true,
      message: 'Tips retrieved successfully',
      data: {
        tips: selectedTips,
        category: category || 'all',
        personalized: !!primaryVehicle
      }
    });

  } catch (error) {
    logger.error('Get tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tips'
    });
  }
});

/**
 * @swagger
 * /api/coaching/goals:
 *   post:
 *     summary: Set eco-driving goals
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ecoScoreTarget:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               fuelSavingsTarget:
 *                 type: number
 *                 minimum: 0
 *               co2ReductionTarget:
 *                 type: number
 *                 minimum: 0
 *               timeframe:
 *                 type: string
 *                 enum: [week, month, quarter, year]
 *     responses:
 *       200:
 *         description: Goals set successfully
 */
router.post('/goals', [
  body('ecoScoreTarget').optional().isFloat({ min: 0, max: 100 }),
  body('fuelSavingsTarget').optional().isFloat({ min: 0 }),
  body('co2ReductionTarget').optional().isFloat({ min: 0 }),
  body('timeframe').optional().isIn(['week', 'month', 'quarter', 'year'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { ecoScoreTarget, fuelSavingsTarget, co2ReductionTarget, timeframe } = req.body;

    // Update user goals
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store goals in user preferences or create a separate goals collection
    user.preferences.goals = {
      ecoScoreTarget,
      fuelSavingsTarget,
      co2ReductionTarget,
      timeframe: timeframe || 'month',
      createdAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Goals set successfully',
      data: {
        goals: user.preferences.goals
      }
    });

  } catch (error) {
    logger.error('Set goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set goals'
    });
  }
});

/**
 * @swagger
 * /api/coaching/progress:
 *   get:
 *     summary: Get progress towards goals
 *     tags: [Coaching]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress retrieved successfully
 */
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user || !user.preferences.goals) {
      return res.json({
        success: true,
        message: 'No goals set',
        data: {
          progress: null,
          goals: null
        });
    }

    const goals = user.preferences.goals;
    const timeframe = goals.timeframe;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get trips for the period
    const trips = await Trip.find({
      userId,
      startTime: { $gte: startDate }
    });

    // Calculate current progress
    const currentEcoScore = trips.length > 0 ? 
      trips.reduce((sum, trip) => sum + trip.ecoScore, 0) / trips.length : 0;
    
    const currentFuelSavings = trips.reduce((sum, trip) => sum + (trip.fuelConsumed || 0), 0);
    const currentCo2Reduction = trips.reduce((sum, trip) => sum + (trip.co2Emissions || 0), 0);

    const progress = {
      ecoScore: {
        current: Math.round(currentEcoScore),
        target: goals.ecoScoreTarget,
        percentage: goals.ecoScoreTarget ? Math.round((currentEcoScore / goals.ecoScoreTarget) * 100) : 0
      },
      fuelSavings: {
        current: Math.round(currentFuelSavings * 100) / 100,
        target: goals.fuelSavingsTarget,
        percentage: goals.fuelSavingsTarget ? Math.round((currentFuelSavings / goals.fuelSavingsTarget) * 100) : 0
      },
      co2Reduction: {
        current: Math.round(currentCo2Reduction * 100) / 100,
        target: goals.co2ReductionTarget,
        percentage: goals.co2ReductionTarget ? Math.round((currentCo2Reduction / goals.co2ReductionTarget) * 100) : 0
      }
    };

    res.json({
      success: true,
      message: 'Progress retrieved successfully',
      data: {
        progress,
        goals,
        timeframe,
        tripCount: trips.length
      }
    });

  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress'
    });
  }
});

// Helper function to calculate trends
function calculateTrend(values) {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
}

module.exports = router;