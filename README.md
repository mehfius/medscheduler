# MedScheduler API

A cloud-based medical appointment scheduling system built with Google Cloud Functions and Supabase.

## Features

- Generate available time slots for doctors based on their availability
- Schedule appointments with conflict prevention
- Holiday management to prevent scheduling on holidays
- Doctor and patient management using UUIDs
- RESTful API with standardized JSON responses
- Error handling with specific error codes

## API Endpoint

The API has a single endpoint that handles different actions based on the `action` parameter in the request body.

### Base URL
`https://your-cloud-function-url/medscheduler`

### Request Format
All requests should be `POST` requests with a JSON body.

### Available Actions

1. **Generate Slots**
   - Action: `generate_slots`
   - Required Parameters:
     - `doctor_uuid`: UUID of the doctor
     - `start_date`: Start date for slot generation (YYYY-MM-DD)
     - `end_date`: End date for slot generation (YYYY-MM-DD)

   Example Request:
   ```json
   {
       "action": "generate_slots",
       "doctor_uuid": "doctor-uuid-here",
       "start_date": "2024-01-01",
       "end_date": "2024-01-31"
   }
   ```

   Example Response:
   ```json
   {
       "code": "SLOTS_GENERATED",
       "message": "Slots generated successfully",
       "data": {
           "slots_generated": 42
       }
   }
   ```

2. **Schedule Appointment**
   - Action: `schedule_appointment`
   - Required Parameters:
     - `doctor_uuid`: UUID of the doctor
     - `patient_uuid`: UUID of the patient
     - `date`: Appointment date (YYYY-MM-DD)
     - `time`: Appointment time (HH:MM)

   Example Request:
   ```json
   {
       "action": "schedule_appointment",
       "doctor_uuid": "doctor-uuid-here",
       "patient_uuid": "patient-uuid-here",
       "date": "2024-01-15",
       "time": "09:00"
   }
   ```

   Example Response:
   ```json
   {
       "code": "APPOINTMENT_SCHEDULED",
       "message": "Appointment scheduled successfully",
       "data": {
           "appointment_id": 123
       }
   }
   ```

3. **Create Availability**
   - Action: `create_availability`
   - Required Parameters:
     - `doctor_uuid`: UUID of the doctor
     - `weekday`: Day of the week (0 = Sunday, 6 = Saturday)
     - `start_time`: Start time of availability (HH:MM)
     - `end_time`: End time of availability (HH:MM)
   - Optional Parameters:
     - `consultation_duration`: Duration of each consultation (default: 30 minutes)

   Example Request:
   ```json
   {
       "action": "create_availability",
       "doctor_uuid": "doctor-uuid-here",
       "weekday": 1,
       "start_time": "09:00",
       "end_time": "17:00",
       "consultation_duration": "30 minutes"
   }
   ```

   Example Response:
   ```json
   {
       "code": "AVAILABILITY_CREATED",
       "message": "Availability created successfully",
       "data": {
           "availability_id": 123
       }
   }
   ```

## Error Responses

All error responses follow the same format:

```json
{
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
}
```

Common error codes:
- `MISSING_REQUIRED_PARAMETERS`: Required parameters are missing
- `DOCTOR_AVAILABILITY_NOT_FOUND`: Doctor's availability not found
- `SLOT_NOT_AVAILABLE`: Requested time slot is not available
- `DOCTOR_NOT_AVAILABLE`: Doctor not available on requested day
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Database Schema

The system uses the following tables in a PostgreSQL database:

- `medscheduler.availabilities`: Stores doctor's availability
- `medscheduler.available_slots`: Stores generated time slots
- `medscheduler.appointments`: Stores scheduled appointments
- `medscheduler.holidays`: Stores holiday dates

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-repo/medscheduler.git
   cd medscheduler
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with the following content:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   ```

4. Run locally
   ```bash
   npm start
   ```

5. Deploy to Google Cloud Functions
   ```bash
   npm run deploy
   ```

## Testing

You can test the API using `curl` or Postman. See the [Postman collection](postman.json) for pre-configured requests.

Example curl command for generating slots:
```bash
curl -X POST http://localhost:8080/ \
-H "Content-Type: application/json" \
-d '{
    "action": "generate_slots",
    "doctor_uuid": "doctor-uuid-here",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
}'
```

## Dependencies

- @google-cloud/functions-framework
- @supabase/supabase-js

## License

MIT License