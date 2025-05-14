const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { getDistanceFromLatLonInKm } = require("../helper/helper");
const dayjs = require("dayjs");

exports.registerUser = async (req, response) => {
  const { name, email, password, address, latitude, longitude, status } =
    req.body;

  if (!name || !password || !email || !address || !latitude || !longitude) {
    return response.status(400).json({
      status: false,
      message: "All Field is required",
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return response.status(400).json({
        succes: false,
        message: "User already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      // password,
      address,
      latitude,
      longitude,
      status,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    response.json({
      succes: true,
      status_code: "200",
      message: "User registered successfully",
      token,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        latitude: newUser.latitude,
        longitude: newUser.longitude,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      succes: false,
      message: "Server error",
    });
  }
};

exports.changeUserSatatus = async (req, res) => {
  try {
    // Step 1: Fetch all users
    const users = await User.find();

    // Step 2: Prepare bulk update operations
    const updates = users.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: { status: user.status === "active" ? "inactive" : "active" },
        },
      },
    }));

    // Step 3: Execute bulk write
    const updatedUser = await User.bulkWrite(updates);

    res.status(200).json({
      status: true,
      status_code: "200",
      message: "User statuses toggled successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

exports.getDistance = async (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: false,
        message: "Destination coordinates required",
      });
    }

    const distance = getDistanceFromLatLonInKm(
      user.latitude,
      user.longitude,
      parseFloat(latitude),
      parseFloat(longitude)
    ).toFixed(2);

    res.status(200).json({
      status: true,
      status_code: "200",
      message: "Distance calculated successfully",
      distance: `${distance}km`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

exports.getUserListing = async (req, res) => {
  try {
    const { week_number } = req.query;

    if (!week_number) {
      return res.status(400).json({
        status: false,
        message: "week_number query param is required",
      });
    }

    // Parse and validate
    const weekNumbers = week_number
      .split(",")
      .map((num) => parseInt(num.trim()));
    const validDays = [0, 1, 2, 3, 4, 5, 6];
    const filterDays = weekNumbers.filter((day) => validDays.includes(day));

    if (filterDays.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid week_number values",
      });
    }

    // Get users registered on days
    const users = await User.find(
      {
        createdAt: {
          $exists: true,
        },
      },
      { name: 1, email: 1, createdAt: 1 }
    ).lean();

    // Group users by weekday (0-6)
    const grouped = {};
    for (const user of users) {
      const day = dayjs(user.createdAt).day();
      // 0 = Sunday, 1 = Monday, 2 = Tuesday, 4 = Wednesday, 5 = Thrusday, 6 = Friday, 7 = Sunday
      if (filterDays.includes(day)) {
        const dayName = dayjs().day(day).format("dddd").toLowerCase();
        if (!grouped[dayName]) grouped[dayName] = [];
        grouped[dayName].push({ name: user.name, email: user.email });
      }
    }

    return res.status(200).json({
      status: true,
      status_code: "200",
      message: "User listing fetched successfully",
      data: grouped,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};
