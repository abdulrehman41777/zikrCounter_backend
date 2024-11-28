import Joi from "joi";
import validateData from "../utils/validator.js";
import User from "../models/User.js";

const HandleGetAllUsers = (req, res) => {
  try {
    res.send("MVC WORKING, Welcome");
  } catch (error) {
    console.log(error);
  }
};

// @POST
// ENDPOINT: /api/signup
// const HandleSignup = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       username: Joi.string().min(3).max(30).required(),
//       email: Joi.string()
//         .required()
//         .custom((value, helpers) => {
//           console.log(Joi.string().email());
//           if (Joi.string().email().validate(value).error === null) {
//             return value;
//           }

//           if (/^\+?\d{11,12}$/.test(value)) {
//             return value;
//           }

//           return helpers.message("Invalid email or phone number format");
//         }),
//       password: Joi.string().min(8).required().messages({
//         "any.required": "Password is required",
//         "string.min": "Password must be at least 8 characters long",
//       }),
//     });

//     const { error, value } = validateData(schema, req.body);

//     console.log(error);

//     if (error) {
//       return res.status(400).send({ message: error });
//     }

//     const { username, email, password } = value;

//     const findExistingUser = await User.findOne({ email: email });

//     if (findExistingUser) {
//       return res
//         .status(409)
//         .json({ message: "email or phone number must be unique" });
//     }

//     const newUser = new User({ username, email, password });
//     await newUser.save();

//     const token = {
//       _id: newUser._id,
//       username: newUser.username,
//       email: newUser.email,
//       role: ["User"],
//     };

//     res.status(201).json({ message: "User created successfully", token });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const HandleSignup = async (req, res) => {
  try {
    const schema = Joi.object({
      username: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required().messages({
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters long",
      }),
    });

    const { error, value } = validateData(schema, req.body);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const { username, email, password } = value;

    const findExistingUser = await User.findOne({ email: email });

    if (findExistingUser) {
      return res
        .status(409)
        .json({ message: "Email or phone number must be unique" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: ["User"],
    };

    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @POST
// ENDPOINT: /api/login
const HandleLogin = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required().messages({
        "any.required": "Password is required",
        "string.min": "Password must be at least 8 characters long",
      }),
    });

    const { error, value } = validateData(schema, req.body);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const { email, password } = value;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password.toString() !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({ message: "Logged in successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @POST
// ENDPOINT: /api/forget-password
const HandleForgotPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error, value } = validateData(schema, req.body);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const { email } = value;
    const findUser = await User.findOne({ email: email });

    if (!findUser) {
      return res
        .status(404)
        .json({ message: "Sorry, Account With This Email Doesn't Exists" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const getOtpCode = otpCode;
    const getOtpExpire = Date.now() + 600000;

    findUser.OtpCode = getOtpCode || findUser.OtpCode;
    findUser.OtpExp = getOtpExpire || findUser.OtpExp;

    await findUser.save();

    res.status(200).json({ message: "OTP Sent To Your Email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @PATCH
// ENDPOINT: /api/verify-otp
const HandleVerifyOtp = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      OtpCode: Joi.number().required(),
    });

    const { error, value } = validateData(schema, req.body);
    if (error) {
      return res.status(400).send({ message: error });
    }
    const { email, OtpCode } = value;

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return res.status(404).json({
        message: "Sorry, We couldn't send your OTP Verification Code",
      });
    }
    if (OtpCode === "") {
      return res.status(404).json({ message: "OTP Field Is Required" });
    }
    if (findUser.OtpCode !== Number(OtpCode)) {
      console.log(findUser.OtpCode);
      console.log(OtpCode);
      return res.status(404).json({ message: "Invalid OTP Verification Code" });
    }
    if (
      findUser.OtpCode === Number(OtpCode) &&
      findUser.OtpExp &&
      findUser.OtpExp > new Date()
    ) {
      return res.status(200).json({ message: "OTP Verified Successfully" });
    } else {
      return res.status(404).json({ message: "OTP has expired or is invalid" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @PATCH
// ENDPOINT: /api/reset-password
const HandleResetPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.string().min(8).required(),
    });

    const { error, value } = validateData(schema, req.body);
    if (error) {
      return res.status(400).send({ message: error });
    }
    const { email, password, confirmPassword } = value;

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return res.status(404).json({
        message: "Sorry, Some Error Occured While Resetting Password",
      });
    }
    if (password !== confirmPassword) {
      return res.status(404).json({ message: "Passwords Must Be Same" });
    }
    findUser.password = password || findUser.password;
    await findUser.save();
    res.status(200).json({ message: "Password Reset Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @PATCH
// ENDPOINT: /api/resend-otp
const HandleResendOtp = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error, value } = validateData(schema, req.body);
    if (error) {
      return res.status(400).send({ message: error });
    }
    const { email } = value;

    const userExists = await User.findOne({ email: email });

    if (!userExists) {
      return res.status(404).json({ message: "This Email Doesn't Exist" });
    }

    const otpCode = await Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const getOtpCode = otpCode;
    const getOtpExpire = Date.now() + 600000;

    userExists.OtpCode = getOtpCode || userExists.OtpCode;
    userExists.OtpExp = getOtpExpire || userExists.OtpExp;

    await userExists.save();

    res.status(200).json({ message: "OTP Re-Sent Successfully To Your Email" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  HandleGetAllUsers,
  HandleSignup,
  HandleLogin,
  HandleForgotPassword,
  HandleVerifyOtp,
  HandleResetPassword,
  HandleResendOtp,
};
