-- Creating doctors' availability table
CREATE TABLE medscheduler.availabilities (
    id SERIAL PRIMARY KEY,
    doctor_id UUID REFERENCES public.users(uuid) ON DELETE CASCADE,
    weekday INT CHECK (weekday BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    consultation_duration INTERVAL NOT NULL DEFAULT '30 minutes'
);

CREATE TABLE medscheduler.available_slots (
    id SERIAL PRIMARY KEY,
    doctor_id UUID REFERENCES public.users(uuid) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    reserved BOOLEAN DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION is_not_holiday(appointment_date DATE) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (SELECT 1 FROM medscheduler.holidays WHERE date = appointment_date);
END;
$$ LANGUAGE plpgsql;

CREATE TABLE medscheduler.appointments (
    id SERIAL PRIMARY KEY,
    doctor_id UUID REFERENCES public.users(uuid) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.users(uuid) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    UNIQUE (doctor_id, date, time),
    CONSTRAINT prevent_holiday CHECK (is_not_holiday(date))
);

CREATE TABLE medscheduler.holidays (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL
);

ALTER TABLE medscheduler.availabilities 
ADD CONSTRAINT no_overlapping_availabilities 
EXCLUDE USING gist (
    doctor_id WITH =, 
    weekday WITH =, 
    numrange(EXTRACT(EPOCH FROM start_time), EXTRACT(EPOCH FROM end_time), '[)') WITH &&
);

