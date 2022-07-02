const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { pool, mssql } = require("../db/mssql");
// const User = require('../models/user');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
// const Email = require("../utils/email");

// Random User Id
function generateUserId() {
  return "U" + new Date().getTime() + Math.random().toFixed(3).split(".")[1];
}

function generateUserPass() {
  return (
    Math.random().toString(36).substring(2) + new Date().getTime().toString(36)
  );
}

//accessible on instances
const correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.userId);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV.trim() === "production") cookieOptions.secure = true;

  //Remove Password from the output
  delete user.userPassword;
  res.cookie("jwt", token, cookieOptions);
  res.set("authorization", `Bearer ${token}`);
  res.status(statusCode).json({
    status: "success",
    message: `${
      req.url.includes("/login")
        ? "Login Successfully"
        : "User Created Successfully"
    }`,
    token,
    data: {
      user,
    },
  });
};

// works
exports.signup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    username,
    lastName,
    phone,
    email,
    password,
    gender,
    profile,
    userImage = null,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !username ||
    !phone ||
    !email ||
    !password ||
    !gender ||
    !profile
  ) {
    return res.status(400).json({
      success: false,
      message: `Provide all user details!!`,
    });
    // return next(new AppError("Provide all your details!", 400));
  }
  // email validation
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: `Write a valid email!`,
    });
    // return next(new AppError("Write a valid email!!", 400));
  }

  // Verifying if passwords are the same

  // Unique email
  const queryEmail = `SELECT * FROM Users WHERE email='${email}'`;
  const sqlEmail = await pool.request().query(queryEmail);
  // Checking if email already exist
  if (sqlEmail.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Email already exist!!!`,
    });
    // return next(new AppError("Email already exist!!", 400));
  }
  // Unique Username
  const queryUsername = `SELECT * FROM Users WHERE username='${username}'`;
  const sqlUsername = await pool.request().query(queryUsername);
  // Checking if username already exist
  if (sqlUsername.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Username already exist!!`,
    });
    // return next(new AppError("Username already exist!!", 400));
  }
  // hashing the password
  const hashedPassword = await bcrypt.hash(password, 12);

  // --------------------------

  const query = `INSERT INTO Users 
( 
  userId,
  firstName,
  lastName,
  username,
  phone,
  email,
  userPassword,
  passwordModified,
  dateCreated,
  dateModified,
  active,
  accessLevel,
  gender,
  userImage,
  origUserPassword
  ) 
  Output Inserted.userId
  values (

    @userId,
    @firstName,
    @lastName,
    @username,
    @phone,
    @email,
    @userPassword,
    @passwordModified,
    @dateCreated,
    @dateModified,
    @active,
    @accessLevel,
    @gender,
    @userImage,
    @origUserPassword
  ) `;

  const sql = await pool
    .request()
    .input("userId", mssql.VarChar, generateUserId())
    .input("firstName", mssql.VarChar, firstName)
    .input("lastName", mssql.VarChar, lastName)
    .input("username", mssql.VarChar, username)
    .input("phone", mssql.VarChar, phone)
    .input("email", mssql.VarChar, email)
    .input("userPassword", mssql.VarChar, hashedPassword)
    .input("origUserPassword", mssql.VarChar, password)
    .input("passwordModified", mssql.VarChar, new Date().toISOString())
    .input("dateCreated", mssql.VarChar, new Date().toISOString())
    .input("dateModified", mssql.VarChar, new Date().toISOString())
    .input("active", mssql.Bit, 1)
    .input("accessLevel", mssql.Int, req.accessLevel)
    .input("gender", mssql.VarChar, gender)
    .input("userImage", mssql.VarChar, userImage)
    .query(query);

  // --------------------------

  const newUser = sql.recordset[0];
  createSendToken(newUser, 201, req, res);
});

// works
exports.login = catchAsync(async (req, res, next) => {
  //destructuring
  const { email, username, password } = req.body;
  //1. check if email and password exist
  if ((!email && !password) || (!username && !password)) {
    return res.status(400).json({
      success: false,
      message: `Please provide either email or username and password!`,
    });
    // return next(
    //   new AppError(
    //     "Please provide either email or username and password!!",
    //     400
    //   )
    // );
  }
  //2. check if user exist && password is correct

  const query = `SELECT id,phone,firstName,lastName,email,username,userId,accessLevel,userImage,userPassword,gender FROM Users WHERE (email='${email}' OR username='${username}')`;
  const sql = await pool.request().query(query);
  const user = sql.recordset[0];

  if (!user || !(await correctPassword(password, user.userPassword))) {
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password",
    });
    // return next(new AppError("Incorrect email or password", 401));
  }
  //3. if everything is okay, send token to the client

  createSendToken(user, 200, req, res);
});

exports.authMember = catchAsync(async (req, res, next) => {
  //destructuring
  const { member_name, photo, member_opinion } = req.body;

  //1. check if field exist
  if (!member_name || !req.file || !member_opinion) {
    return next(
      new AppError("Please provide a name,a photo and opinion!!", 400)
    );
  }
  req.body.photo = req.file.filename;
  next();
});

// Logging out
exports.logout = (req, res) => {
  res.cookie("jwt", "anythingToCorruptTheTokenLogsUserOut", {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, token: "", message: "Logout success" });
};

// Protecting routes
// Protecting routes
exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting the token and checking if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "You are not logged in! Please login to get access.",
    });
    // return next(
    //   new AppError("You are not logged in! Please login to get access.", 401)
    // );
  }

  //2. verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. check if user still exists

  const query = `SELECT * FROM Users WHERE userId='${decoded.id}'`;
  const sql = await pool.request().query(query);
  const currentUser = sql.recordset[0];
  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: "The user belonging to this token does not exist",
    });
    // return next(
    //   new AppError("The user belonging to this token does not exist", 401)
    // );
  }
  // 4. check if user changed passwords after the token was issued
  const queryPasswordMod = `SELECT passwordModified FROM Users WHERE userId='${decoded.id}'`;
  const sqlPass = await pool.request().query(queryPasswordMod);
  const passwordModifiedDate = sqlPass.recordset[0];
  const { passwordModified } = passwordModifiedDate;
  const changedTimestamp = parseInt(passwordModified.getTime() / 1000, 10);
  //Getting the time JWT was signed
  const JWTTimestamp = decoded.iat;
  // console.log("changed", changedTimestamp);
  // console.log("Jwt", JWTTimestamp);
  if (JWTTimestamp < changedTimestamp) {
    return res.status(401).json({
      success: false,
      message: "Password has been changed,Please Login again",
    });
    // return next(
    //   new AppError("Password has been changed,Please Login again", 401)
    // );
  }
  // console.log("protect", currentUser);

  const queryAccess = `SELECT userType FROM Profiles WHERE accessLevel=${currentUser.accessLevel}`;
  const sqlAccess = await pool.request().query(queryAccess);
  // console.log("This here", sqlAccess);
  // Copying userType to the current user
  Object.assign(currentUser, sqlAccess.recordset[0]);
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // console.log(req.user);

  next();
});

// Current user profile => /api/me
exports.currentUserProfile = catchAsync(async (req, res) => {
  // console.log("current", req.user);
  const query = `SELECT * FROM Users WHERE userId='${req.user.userId}'`;
  const sql = await pool.request().query(query);
  const currentUser = sql.recordset[0];
  res.status(200).json({
    success: true,
    currentUser,
  });
});

//Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.session.user) {
      console.log(req.session.user);
      //1. verification of the token
      // const decoded = await promisify(jwt.verify)(
      //   req.cookies.jwt,
      //   process.env.JWT_SECRET
      // );
      //2. check if user still exists
      const currentUser = await User.findById(req.session.user._id);
      if (!currentUser) {
        return next();
      }
      //3. check if user changed passwords after the token was issued
      // if (currentUser.changedPasswordAfter(decoded.iat)) {
      //   return next();
      // }
      //There is a logged in user
      res.locals.user = currentUser;
      return next();
    }
    res.locals.user = "";
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ["admin","lead-guide"]. role="user"
    const rolesLowerCased = roles.map((role) => role.toLowerCase());
    if (!rolesLowerCased.includes(req.user.userType.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
      // return next(
      //   new AppError("You do not have permission to perform this action.", 403)
      // );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email address!", 404));
  }
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password
 and passwordConfirm to ${resetURL}. \n If you didn't forget your password, please 
 ignore this email.`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token is valid for 10 minutes',
    //   message,
    // });
    res.status(200).json({
      status: "Success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending an email. Try again later!", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2. Set new password if token has not expired and there is a user
  if (!user) {
    return next(new AppError("Token is invalid or has expired!", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3. Update changedPasswordAt property for the user

  //4. Log the user in, send JWT to the client
  createSendToken(user, 200, req, res);
});

exports.userPassword = catchAsync(async (req, res, next) => {
  // Checking if the user exists
  const queryUser = `SELECT * FROM Users WHERE (active=1 AND id=${req.params.id}) `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }
  // Getting User's Password
  const queryUserPass = `SELECT origUserPassword FROM Users WHERE id=${req.params.id}`;
  const sqlPass = await pool.request().query(queryUserPass);
  const originalPassWord = sqlPass.recordset[0].origUserPassword;
  // setting User's Password to null
  const querySetUserPassNull = `UPDATE Users SET origUserPassword=null WHERE id=${req.params.id}`;
  await pool.request().query(querySetUserPassNull);
  res.status(200).json({
    success: true,
    password: originalPassWord,
  });
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  // Checking if the user exists
  const queryUser = `SELECT * FROM Users WHERE (active=1 AND id=${req.params.id}) `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }

  const queryPass = `SELECT userPassword FROM Users WHERE id=${req.params.id}`;
  const sqlQueryPass = await pool.request().query(queryPass);
  const user = sqlQueryPass.recordset[0];

  if (!user || !(await correctPassword(currentPassword, user.userPassword))) {
    return res.status(400).json({
      success: false,
      message: "Your current password is wrong!",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  //3. If so, update the password
  const queryUpdatePass = `UPDATE Users SET 
  origUserPassword=@origUserPassword, 
  userPassword=@userPassword,
  passwordModified=@passwordModified  
  WHERE id=${req.params.id}
  `;

  await pool
    .request()

    .input("userPassword", mssql.VarChar, hashedPassword)
    .input("origUserPassword", mssql.VarChar, newPassword)
    .input("passwordModified", mssql.VarChar, new Date().toISOString())

    .query(queryUpdatePass);

  res.status(200).json({
    success: true,
    message: "Password Changed successfully!",
  });
});
exports.updatePasswordAdmin = catchAsync(async (req, res, next) => {
  // const { password, passwordConfirm } = req.body;
  // console.log(req.body);
  // if (!password || !passwordConfirm) {
  //   return next(new AppError("Provide both passwords!", 400));
  // }
  // if (password !== passwordConfirm) {
  //   return next(new AppError("Passwords are not the same!", 400));
  // }
  // Checking if the user exists
  const queryUser = `SELECT * FROM Users WHERE (active=1 AND id=${req.params.id}) `;
  const sql = await pool.request().query(queryUser);
  if (sql.recordset.length === 0) {
    return next(new AppError("User not found!", 404));
  }
  const password = generateUserPass();
  const hashedPassword = await bcrypt.hash(password, 12);

  //3. If so, update the password
  const queryUpdatePass = `UPDATE Users SET 
  userPassword=@userPassword,
  origUserPassword=@origUserPassword,
  passwordModified=@passwordModified  
  WHERE id=${req.params.id}
  `;

  await pool
    .request()

    .input("origUserPassword", mssql.VarChar, password)
    .input("userPassword", mssql.VarChar, hashedPassword)
    .input("passwordModified", mssql.DateTimeOffset, new Date().toISOString())

    .query(queryUpdatePass);

  res.status(200).json({
    success: true,
    password,
    Message: "Password Changed successfully!",
  });
});

exports.passwordsUsed = catchAsync(async (req, res, next) => {
  const { userId, pass } = req.body;
  // const passToken = crypto.randomBytes(32).toString("hex");

  const password = crypto.createHash("sha256").update(pass).digest("hex");
  let passwordsUsed = [password];

  const queryUsedPass = `SELECT passwordsUsed FROM UserPasswords WHERE userId='${userId}'`;
  const sqlUsed = await pool.request().query(queryUsedPass);
  const passArr = sqlUsed.recordset;
  if (passArr.length > 0) {
    const passwordsArr = JSON.parse(sqlUsed.recordset[0].passwordsUsed);
    const adjustedArr = passwordsArr.concat(passwordsUsed);
    const queryUpdatePass = `UPDATE UserPasswords SET 
    passwordsUsed=@passwordsUsed 
    WHERE userId='${userId}'
    `;

    await pool
      .request()
      .input("passwordsUsed", mssql.VarChar, JSON.stringify(adjustedArr))
      .query(queryUpdatePass);

    return res.json({
      success: "sem",
    });
  }

  // --------------------------

  const query = `INSERT INTO UserPasswords 
( 
  userId,
  passwordsUsed
  ) 
  Output Inserted.userId
  values (
    @userId,
    @passwordsUsed
  ) `;

  await pool
    .request()
    .input("userId", mssql.VarChar, userId)
    .input("passwordsUsed", mssql.VarChar, JSON.stringify(passwordsUsed))
    .query(query);

  // --------------------------

  // next();
  res.json({
    success: true,
  });
});
exports.getPasswordsUsed = catchAsync(async (req, res, next) => {
  const queryUsedPass = `SELECT passwordsUsed FROM UserPasswords WHERE userId='${req.params.userId}'`;
  const sqlUsed = await pool.request().query(queryUsedPass);
  const passArr = sqlUsed.recordset;
  if (passArr.length === 0) {
    return next();
  }
  const passwords = JSON.parse(sqlUsed.recordset[0].passwordsUsed);
  req.passwords = passwords;
  // next();
  res.json(passwords);
});
exports.checkPasswordsUsed = catchAsync(async (req, res, next) => {
  const { pass } = req.body;
  const passwordHashed = crypto.createHash("sha256").update(pass).digest("hex");
  let isPasswordUsed = [
    "6d115644eb5b28faa780f5f755fa0f29f88d02d682c14148de76d7656ff92cb8",
    "ba4d81ee2be34fb6cd109aca688f35860b819aa7854e1fa394a016e2737444f4",
    "b23cf18983b0a0d4f35f11c97a290be0fb9481c40f171f7745f2704e5a1c44ac",
    "72b289ec78e0a928c565480a435453e30acb92eddb3b78ff168b28737cf6a849",
    "72b289ec78e0a928c565480a435453e30acb92eddb3b78ff168b28737cf6a849",
    "b70c43e814c1d8f7eff8f3b563a1e7ca818b82916d3d68cb062b990de4f573ee",
    "b70c43e814c1d8f7eff8f3b563a1e7ca818b82916d3d68cb062b990de4f573ee",
    "b70c43e814c1d8f7eff8f3b563a1e7ca818b82916d3d68cb062b990de4f573ee",
  ].findIndex((hash) => hash === passwordHashed);
  // next();
  console.log(!isPasswordUsed);
  isPasswordUsed = isPasswordUsed > 0 ? true : false;

  res.json({
    success: true,
    isPasswordUsed,
  });
});
