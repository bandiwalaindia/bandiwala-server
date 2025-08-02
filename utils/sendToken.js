export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  // Calculate expiration date
  const expiresIn = process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const expirationDate = new Date(Date.now() + expiresIn);

  // Set cookie options
  const cookieOptions = {
    expires: expirationDate,
    httpOnly: true,
    path: '/',
    // In development, we need to set sameSite to 'Lax' to allow cookies to be sent in cross-site requests
    // In production, it should be 'None' with secure: true
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    // Only set secure: true in production or if explicitly configured
    secure: process.env.NODE_ENV === 'production'
  };

  console.log('Setting token cookie with options:', {
    expiresIn: `${process.env.COOKIE_EXPIRE} days`,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  });

  // Set the cookie and send the response
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      user,
      message,
      token,
    });
};