const express = require('express');
const bcrypt = require('bcryptjs');
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { User } = require('../../db/models');

const router = express.Router();


/*
The POST /api/users signup route will expect the body of the request
to have a key of username, email, and password with the password
of the user being created.
Check these keys and validate them:
*/

  const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be 6 characters or more.'),
    check('firstName')
      .exists({ checkFalsy: true })
      .isLength({ min: 2 })
      .withMessage('Valid first name requires more than 2 letters.'),
    check('lastName')
      .exists({ checkFalsy: true })
      .isLength({ min: 2 })
      .withMessage('Valid last name requires more than 2 letters.'),
    handleValidationErrors
  ];


  //___________________________________________________________________

  // SIGN UP:


router.post('/', validateSignup, async (req, res) => {
    const {email, password, username, firstName, lastName} = req.body;
    const hashedPassword = bcrypt.hashSync(password);

    const user = await User.create({email, username, hashedPassword, firstName, lastName});

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    await setTokenCookie(res, safeUser);

    return res.json({ user: safeUser });
  }
);


//___________________________________________________________________


module.exports = router;
