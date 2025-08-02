# API Documentation

Base URL: `http://localhost:4000`

## Register User
- **URL**: `/register`
- **Method**: `POST`
- **Sample Request**:
```json
{
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+919001234567",
    "password": "password123",
    "verificationMethod": "email" // or "phone"
}
```

## Verify OTP
- **URL**: `/otp-verification`
- **Method**: `POST`
- **Sample Request**:
```json
{
    "email": "johndoe@example.com",
    "phone": "+923001234567",
    "otp": "12345"
}
```

## Login
- **URL**: `/login`
- **Method**: `POST`
- **Sample Request**:
```json
{
    "email": "johndoe@example.com",
    "password": "password123"
}
```

## Logout
- **URL**: `/logout`
- **Method**: `GET`
- **Headers Required**: 
  - `Authorization: Bearer {token}`
- **No Request Body Required**

## Get User Profile
- **URL**: `/me`
- **Method**: `GET`
- **Headers Required**: 
  - `Authorization: Bearer {token}`
- **No Request Body Required**

## Forgot Password
- **URL**: `/password/forgot`
- **Method**: `POST`
- **Sample Request**:
```json
{
    "email": "johndoe@example.com"
}
```

## Reset Password
- **URL**: `/password/reset/{token}`
- **Method**: `PUT`
- **Sample Request**:
```json
{
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
}
```


## Vendor fetch
- **URL**: `/api/vendors`
- **Method**: `GET`
- **Sample Request**:
```json
{
}
```


### Notes:
1. All endpoints are prefixed with `/api/v1`
2. For authenticated routes (logout, me), include the JWT token in the Authorization header
3. Phone numbers must follow the format: +923xxxxxxxxx
4. OTP is a 5-digit number
5. Password must be between 8-32 characters