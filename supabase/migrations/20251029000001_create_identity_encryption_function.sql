-- ================================================================
-- IDENTITY ENCRYPTION HELPER FUNCTION
-- ================================================================
-- This function is called by the intake-identity Edge Function
-- Uses pgcrypto to encrypt sensitive driver data

CREATE OR REPLACE FUNCTION public.encrypt_driver_identity(
  p_driver_id UUID,
  p_dob TEXT,
  p_ssn TEXT,
  p_dl_number TEXT,
  p_dl_state TEXT,
  p_encryption_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encrypted_dob BYTEA;
  v_encrypted_ssn BYTEA;
  v_encrypted_dl BYTEA;
BEGIN
  -- Encrypt the sensitive data
  v_encrypted_dob := pgp_sym_encrypt(p_dob, p_encryption_key);
  v_encrypted_ssn := pgp_sym_encrypt(p_ssn, p_encryption_key);
  v_encrypted_dl := pgp_sym_encrypt(p_dl_number, p_encryption_key);

  -- Insert or update the encrypted identity
  INSERT INTO public.driver_identity (
    driver_id,
    date_of_birth_encrypted,
    ssn_encrypted,
    dl_number_encrypted,
    dl_state
  )
  VALUES (
    p_driver_id,
    v_encrypted_dob,
    v_encrypted_ssn,
    v_encrypted_dl,
    p_dl_state
  )
  ON CONFLICT (driver_id) DO UPDATE
  SET
    date_of_birth_encrypted = v_encrypted_dob,
    ssn_encrypted = v_encrypted_ssn,
    dl_number_encrypted = v_encrypted_dl,
    dl_state = p_dl_state;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Identity encrypted and stored successfully'
  );
END;
$$;

-- Function to decrypt identity (only for authorized operations)
CREATE OR REPLACE FUNCTION public.decrypt_driver_identity(
  p_driver_id UUID,
  p_encryption_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identity RECORD;
  v_decrypted_dob TEXT;
  v_decrypted_ssn TEXT;
  v_decrypted_dl TEXT;
BEGIN
  -- Get encrypted data
  SELECT * INTO v_identity
  FROM public.driver_identity
  WHERE driver_id = p_driver_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Identity not found');
  END IF;

  -- Decrypt the data
  v_decrypted_dob := pgp_sym_decrypt(v_identity.date_of_birth_encrypted, p_encryption_key);
  v_decrypted_ssn := pgp_sym_decrypt(v_identity.ssn_encrypted, p_encryption_key);
  v_decrypted_dl := pgp_sym_decrypt(v_identity.dl_number_encrypted, p_encryption_key);

  RETURN jsonb_build_object(
    'dateOfBirth', v_decrypted_dob,
    'ssn', v_decrypted_ssn,
    'dlNumber', v_decrypted_dl,
    'dlState', v_identity.dl_state
  );
END;
$$;

