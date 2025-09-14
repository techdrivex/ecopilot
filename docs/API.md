# EcoPilot API Documentation

## Overview

The EcoPilot API provides endpoints for managing users, vehicles, trips, analytics, and AI-powered coaching features. This document describes the REST API endpoints, request/response formats, and authentication methods.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://api.ecopilot.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isEmailVerified": false
    },
    "token": "jwt_token"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "role": "user",
      "stats": {
        "totalTrips": 25,
        "totalDistance": 1250.5,
        "totalFuelSaved": 45.2,
        "totalCo2Saved": 12.8,
        "averageEfficiency": 8.5,
        "ecoScore": 85
      }
    },
    "token": "jwt_token"
  }
}
```

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "newpassword123"
}
```

#### GET /auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "isEmailVerified": true,
      "role": "user",
      "preferences": {
        "units": {
          "distance": "km",
          "fuel": "liters",
          "temperature": "celsius"
        },
        "notifications": {
          "email": true,
          "push": true,
          "sms": false
        }
      },
      "stats": {
        "totalTrips": 25,
        "totalDistance": 1250.5,
        "totalFuelSaved": 45.2,
        "totalCo2Saved": 12.8,
        "averageEfficiency": 8.5,
        "ecoScore": 85
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Vehicles

#### GET /vehicles
Get user's vehicles.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "vehicle_id",
        "make": "Toyota",
        "model": "Prius",
        "year": 2022,
        "fuelType": "hybrid",
        "isPrimary": true,
        "fuelEfficiency": {
          "city": 5.5,
          "highway": 4.8,
          "combined": 5.1
        }
      }
    ]
  }
}
```

#### POST /vehicles
Add a new vehicle.

**Request Body:**
```json
{
  "make": "Toyota",
  "model": "Prius",
  "year": 2022,
  "vin": "1HGBH41JXMN109186",
  "licensePlate": "ABC123",
  "fuelType": "hybrid",
  "engineSize": 1.8,
  "transmission": "cvt",
  "drivetrain": "fwd",
  "bodyType": "sedan",
  "color": "Silver",
  "mileage": 15000,
  "fuelCapacity": 45,
  "fuelEfficiency": {
    "city": 5.5,
    "highway": 4.8,
    "combined": 5.1
  },
  "weight": 1520,
  "co2Emissions": 89,
  "isPrimary": true
}
```

#### PUT /vehicles/:id
Update vehicle information.

#### DELETE /vehicles/:id
Delete a vehicle.

#### PUT /vehicles/:id/primary
Set vehicle as primary.

### Trips

#### GET /trips
Get user's trips with optional filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `startDate`: Filter trips from this date
- `endDate`: Filter trips to this date
- `vehicleId`: Filter by vehicle ID

**Response:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip_id",
        "vehicleId": "vehicle_id",
        "startTime": "2024-01-01T08:00:00.000Z",
        "endTime": "2024-01-01T08:30:00.000Z",
        "startLocation": {
          "address": "123 Main St, City",
          "coordinates": {
            "latitude": 40.7128,
            "longitude": -74.0060
          }
        },
        "endLocation": {
          "address": "456 Oak Ave, City",
          "coordinates": {
            "latitude": 40.7589,
            "longitude": -73.9851
          }
        },
        "distance": 15.5,
        "duration": 1800,
        "fuelConsumed": 1.2,
        "fuelEfficiency": 12.9,
        "averageSpeed": 31,
        "maxSpeed": 65,
        "ecoScore": 85,
        "co2Emissions": 2.8,
        "route": {
          "type": "city",
          "waypoints": []
        },
        "drivingBehavior": {
          "harshAccelerations": 2,
          "harshBraking": 1,
          "harshCornering": 0,
          "speedingEvents": 0,
          "idleTime": 120,
          "rapidLaneChanges": 0
        },
        "insights": [
          {
            "type": "tip",
            "message": "Great eco-driving! You maintained steady speeds.",
            "impact": "positive",
            "fuelSavings": 0.1,
            "co2Savings": 0.2,
            "timestamp": "2024-01-01T08:30:00.000Z"
          }
        ],
        "tags": ["commute"],
        "createdAt": "2024-01-01T08:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### POST /trips
Create a new trip.

#### GET /trips/:id
Get trip details.

#### PUT /trips/:id
Update trip information.

#### DELETE /trips/:id
Delete a trip.

#### POST /trips/start
Start a new trip tracking session.

**Request Body:**
```json
{
  "vehicleId": "vehicle_id",
  "startLocation": {
    "address": "123 Main St, City",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

#### POST /trips/:id/end
End trip tracking session.

**Request Body:**
```json
{
  "endLocation": {
    "address": "456 Oak Ave, City",
    "coordinates": {
      "latitude": 40.7589,
      "longitude": -73.9851
    }
  },
  "distance": 15.5,
  "fuelConsumed": 1.2,
  "telematics": {
    "engineRpm": {
      "average": 2500,
      "max": 4000
    },
    "throttlePosition": {
      "average": 35,
      "max": 80
    },
    "brakePressure": {
      "average": 15,
      "max": 45
    }
  }
}
```

### Analytics

#### GET /analytics/dashboard
Get dashboard analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "ecoScore": 85,
      "fuelSaved": 45.2,
      "co2Reduced": 12.8,
      "totalTrips": 25,
      "averageEfficiency": 8.5
    },
    "recentTrips": [],
    "insights": {
      "ecoScoreTrend": "improving",
      "fuelSavingsTrend": "stable",
      "co2Trend": "improving",
      "tripsTrend": "increasing"
    }
  }
}
```

#### GET /analytics/efficiency-trends
Get fuel efficiency trends over time.

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)
- `vehicleId`: Filter by vehicle ID

#### GET /analytics/behavior-analysis
Get driving behavior analysis.

#### GET /analytics/environmental-impact
Get environmental impact metrics.

### Coaching

#### GET /coaching/recommendations
Get personalized coaching recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "acceleration",
        "priority": "high",
        "title": "Smooth Acceleration",
        "description": "Reduce harsh accelerations to improve fuel efficiency by up to 15%",
        "tips": [
          "Gradually press the accelerator pedal",
          "Anticipate traffic flow to avoid sudden stops",
          "Use cruise control on highways when possible"
        ],
        "potentialSavings": {
          "fuel": 0.5,
          "co2": 1.2
        }
      }
    ],
    "summary": {
      "totalTrips": 25,
      "averageEcoScore": 85,
      "totalFuelSaved": 45.2,
      "totalCo2Saved": 12.8
    }
  }
}
```

#### GET /coaching/insights
Get driving insights and analytics.

#### GET /coaching/tips
Get eco-driving tips.

**Query Parameters:**
- `category`: Tip category (acceleration, braking, speed, idling, route, general)

#### POST /coaching/goals
Set eco-driving goals.

**Request Body:**
```json
{
  "ecoScoreTarget": 90,
  "fuelSavingsTarget": 50,
  "co2ReductionTarget": 15,
  "timeframe": "month"
}
```

#### GET /coaching/progress
Get progress towards goals.

#### POST /coaching/analyze-trip
Analyze trip data with AI coaching.

**Request Body:**
```json
{
  "tripId": "trip_id"
}
```

### Gamification

#### GET /gamification/achievements
Get user achievements.

#### GET /gamification/badges
Get available badges.

#### GET /gamification/leaderboard
Get leaderboard rankings.

#### GET /gamification/challenges
Get available challenges.

#### POST /gamification/challenges/:id/join
Join a challenge.

#### POST /gamification/challenges/:id/complete
Complete a challenge.

### Telematics

#### POST /telematics/start-tracking
Start real-time trip tracking.

**Request Body:**
```json
{
  "vehicleId": "vehicle_id",
  "startLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### POST /telematics/update-location
Update current location during trip.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 10,
    "speed": 45,
    "heading": 90,
    "timestamp": "2024-01-01T08:15:00.000Z"
  },
  "telematics": {
    "engineRpm": 2500,
    "throttlePosition": 35,
    "brakePressure": 15,
    "steeringAngle": 5
  }
}
```

#### POST /telematics/end-tracking/:sessionId
End real-time trip tracking.

#### GET /telematics/real-time/:sessionId
Get real-time trip data.

## WebSocket Events

The API also supports real-time communication via WebSocket connections.

### Connection
Connect to: `ws://localhost:3000` (or `wss://api.ecopilot.com` for production)

### Events

#### trip-started
Emitted when a trip starts.

```json
{
  "event": "trip-started",
  "data": {
    "tripId": "trip_id",
    "userId": "user_id",
    "startTime": "2024-01-01T08:00:00.000Z"
  }
}
```

#### location-updated
Emitted when location is updated during a trip.

```json
{
  "event": "location-updated",
  "data": {
    "tripId": "trip_id",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "speed": 45,
      "timestamp": "2024-01-01T08:15:00.000Z"
    }
  }
}
```

#### coaching-tip
Emitted when a real-time coaching tip is available.

```json
{
  "event": "coaching-tip",
  "data": {
    "tripId": "trip_id",
    "tip": {
      "type": "acceleration",
      "message": "Consider easing off the accelerator for better fuel efficiency",
      "priority": "medium",
      "timestamp": "2024-01-01T08:15:00.000Z"
    }
  }
}
```

#### trip-ended
Emitted when a trip ends.

```json
{
  "event": "trip-ended",
  "data": {
    "tripId": "trip_id",
    "summary": {
      "distance": 15.5,
      "duration": 1800,
      "ecoScore": 85,
      "fuelConsumed": 1.2
    }
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:

```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

### Filtering
Use query parameters to filter results:
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)
- `vehicleId`: Filter by vehicle
- `routeType`: Filter by route type (city, highway, mixed, rural)

### Sorting
Use `sort` parameter with field name and direction:
- `sort=createdAt:desc` - Sort by creation date descending
- `sort=ecoScore:asc` - Sort by eco score ascending
- `sort=distance:desc` - Sort by distance descending

## File Uploads

Some endpoints support file uploads (e.g., vehicle images, trip photos):

**Content-Type:** `multipart/form-data`

**Request Body:**
```
file: <binary data>
caption: "Optional caption"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://api.ecopilot.com/uploads/vehicles/image.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "uploadedAt": "2024-01-01T08:00:00.000Z"
  }
}
```

## SDKs and Libraries

Official SDKs are available for:

- **JavaScript/Node.js**: `npm install ecopilot-sdk`
- **Python**: `pip install ecopilot-sdk`
- **React Native**: `npm install ecopilot-react-native`
- **Flutter**: `pub add ecopilot_flutter`

## Support

For API support and questions:

- Email: api-support@ecopilot.com
- Documentation: https://docs.ecopilot.com
- Status Page: https://status.ecopilot.com