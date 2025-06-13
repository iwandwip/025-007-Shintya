export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

export const validateRequired = (value) => {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length > 0;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (!password || !confirmPassword || typeof password !== 'string' || typeof confirmPassword !== 'string') return false;
  return password === confirmPassword;
};