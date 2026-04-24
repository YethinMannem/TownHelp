-- Add OTP-based job start fields to bookings
-- start_otp: 4-digit code generated when booking is confirmed; provider enters it to start the job
-- start_otp_generated_at: when the OTP was created (for audit purposes)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_otp VARCHAR(6),
  ADD COLUMN IF NOT EXISTS start_otp_generated_at TIMESTAMPTZ;
