import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/user";
import Publication from "../models/publication";
import { Iauth, friends } from "../helpers/UserInterface";
import { Ipub } from "../helpers/PublicationInterfaces";

dotenv.config();

// Interfaces

interface Iupdate {
  banner?: string;
  perfil?: string;
}

interface Ierrors {
  email?: string;
  validate?: string;
}

// Get them all

export const fullUsers = async (req: Request, res: Response) => {
  try {
    const all = await User.find();

    return res.json(all);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "API request went wrong !" });
  }
};

// Get all users - Except One

export const getAll = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const Allusers = await User.find();

    const Exception = Allusers.filter((u: Iauth) => u.id !== id);

    return res.json(Exception);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "API request went wrong !" });
  }
};

// Get single user

export const singleUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const findSingleU: Iauth = await User.findById(id);

    return res.json(findSingleU);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "API request went wrong !" });
  }
};

// Register

export const register = async (req: Request, res: Response) => {
  const { name, email, password }: Iauth = req.body;

  let handleErrors: Ierrors = {};

  // make sure if user already exists

  const findUser: Iauth = await User.findOne({ email });

  if (findUser) {
    handleErrors.email = "Usuario ya creado";
  }

  if (Object.keys(handleErrors).length > 0)
    return res.status(404).json(handleErrors);

  // validatin The Email

  const validateEmail = /^\w+([\.-]?\w+)+@\w+([\.:]?\w+)+(\.[a-zA-Z0-9]{2,3})+$/;

  if (!email!.match(validateEmail)) {
    handleErrors.validate = "El email debe de ser valido";
  }

  if (Object.keys(handleErrors).length > 0)
    return res.status(400).json(handleErrors);

  try {
    const hashedPassword = await bcrypt.hash(password!, 12);

    const newUser: Iauth = new User({
      name,
      email,
      password: hashedPassword
    });

    const SECRET = process.env.SECRET!;

    const token = jwt.sign({ email, id: newUser.id }, SECRET);

    await newUser.save();

    return res.status(201).json({
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "The API failed" });
  }
};

// Login

export const login = async (req: Request, res: Response) => {
  const { email, password }: Iauth = req.body;

  let handleLoginErrors: Ierrors = {};

  // validate email - password

  const findUser: Iauth = await User.findOne({ email });

  if (!findUser) {
    handleLoginErrors.validate = "Email/Password Are Not Correct";
  }

  if (Object.keys(handleLoginErrors).length > 0)
    return res.status(400).json(handleLoginErrors);

  const validatePassword: boolean = await bcrypt.compare(
    password!,
    findUser!.password!
  );

  if (!validatePassword) {
    handleLoginErrors.validate = "Email/Password Are Not Correct";
  }

  if (Object.keys(handleLoginErrors).length > 0)
    return res.status(404).json(handleLoginErrors);

  // If eveything's great, create token

  try {
    const token = jwt.sign({ email, id: findUser!.id }, process.env.SECRET!);

    return res.status(201).json({
      user: { id: findUser!.id, email: findUser!.email, name: findUser!.name },
      token
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ Error: "The API Failed" });
  }
};

// update perfil - banner

export const updatePhoto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { banner, perfil }: Iupdate = req.body;

  // find user - check user

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).json({ Message: "Unvalid Id" });

  const specificUser: Iauth = await User.findById(id);

  if (!specificUser)
    return res.status(404).json({ Message: "Couldnt find the user" });

  // check data

  if (banner === "" && perfil === "")
    return res.status(404).json({ Message: "No Data Provided" });

  // Look for user's publications

  const usersPub: Ipub[] = await Publication.find();

  const updatePub = usersPub.filter(
    (p: Ipub) => p.creator.identifier === specificUser.id
  );

  // look for user added as friend

  const allUsers: Iauth[] = await User.find();

  // update photo - publication? and user's perfil as friend

  try {
    if (banner !== "" && perfil !== "") {
      specificUser.banner = banner;

      specificUser.perfil = perfil;

      // Update pubs

      updatePub.length > 0 &&
        updatePub.map(
          async (pub: Ipub) => ((pub.creator.perfil = perfil), await pub.save())
        );

      // Update friend

      allUsers.map(async (u: Iauth) => {
        const findFriend = u.friends!.find((f: friends) => f.identifier === id);
        if (findFriend) {
          findFriend.perfil = perfil;
          await u.save();
        }
      });
    } else if (banner !== "" && !perfil) {
      specificUser.banner = banner;
    } else if (perfil !== "" && !banner) {
      specificUser.perfil = perfil;

      // Update pubs

      updatePub.length > 0 &&
        updatePub.map(
          async (pub: Ipub) => ((pub.creator.perfil = perfil), await pub.save())
        );

      // Update friend

      allUsers.map(async (u: Iauth) => {
        const findFriend = u.friends!.find((f: friends) => f.identifier === id);
        if (findFriend) {
          findFriend.perfil = perfil;
          await u.save();
        }
      });
    }

    await specificUser.save();

    return res.json(specificUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "The API Failed" });
  }
};

// Send notification to make a new friend

export const sendNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).json({ Message: "Unvalid Id" });

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(404).json({ Message: "Unvalid Id" });

  const me: Iauth = await User.findById(id);

  const theUser: Iauth = await User.findById(userId);

  // Check that they're not already friends
  const alreadyNotificated = theUser.friends!.find(u => u.identifier === me.id);
  const alreadyFriends = me.friends!.find(u => u.identifier === theUser.id);

  if (alreadyNotificated || alreadyFriends)
    return res
      .status(400)
      .json({ Error: "User already notificated / a friend" });

  try {
    if (theUser && me) {
      theUser.friends!.unshift({
        createdAt: new Date().toISOString(),
        name: me.name,
        identifier: me.id,
        perfil: me.perfil,
        notification: true,
        friend: false
      });
    }

    await theUser.save();

    return res.json(theUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "The API Failed" });
  }
};

// Accept notification

export const acceptNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).json({ Message: "Unvalid Id" });

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(404).json({ Message: "Unvalid Id" });

  const me: Iauth = await User.findById(id);

  const theUser: Iauth = await User.findById(userId);

  // Check that they're not already friends
  const alreadyAccepted = theUser.friends!.find(u => u.identifier === me.id);
  const alreadyFriends = me.friends!.find(u => u.identifier === theUser.id);

  if (alreadyAccepted && alreadyFriends)
    return res.status(400).json({ Error: "Users already friends" });

  try {
    if (
      me.friends!.find(({ identifier }) => identifier === theUser.id)!
        .friend === false
    ) {
      // Find the user and create a new friend

      theUser.friends!.unshift({
        createdAt: new Date().toISOString(),
        name: me.name,
        identifier: me.id,
        perfil: me.perfil,
        notification: true,
        friend: true
      });

      //  Find notification and changed values

      const findNotification: number = me.friends!.findIndex(
        u => u.identifier === theUser.id
      );

      if (findNotification !== -1) {
        me.friends![findNotification].notification = false;
        me.friends![findNotification].friend = true;
      } else {
        me.friends!.unshift({
          createdAt: new Date().toISOString(),
          name: theUser.name,
          identifier: theUser.id,
          perfil: theUser.perfil,
          notification: true,
          friend: true
        });
      }

      await me.save();
      await theUser.save();

      return res.json({ me, theUser });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "The API Failed" });
  }
};

// Reject

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).json({ Message: "Unvalid Id" });

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(404).json({ Message: "Unvalid Id" });

  const me: Iauth = await User.findById(id);

  const theUser: Iauth = await User.findById(userId);

  // Find if users have as friends or just notification

  const findTheUserFriend = me.friends!.find(f => f.identifier === theUser.id);

  const findMeFriend = theUser.friends!.find(f => f.identifier === me.id);

  if (!findTheUserFriend && !findMeFriend)
    return res.status(400).json({ Error: "Users are not friends" });

  try {
    // If both are added as friends, delete them

    if (findTheUserFriend && findMeFriend) {
      const findToDeletetheUser: number = me.friends!.findIndex(
        f => f === findTheUserFriend
      );

      const findToDeleteMe: number = theUser.friends!.findIndex(
        f => f === findMeFriend
      );

      

      if (findToDeletetheUser !== -1 && findToDeleteMe !== -1) {
        me.friends!.splice(findToDeletetheUser, 1);
        theUser.friends!.splice(findToDeleteMe, 1);

        

        await theUser.save();
        await me.save();
      }
    }

    // If only notification, reject notification

    if (findTheUserFriend && !findMeFriend) {
      const findToDelete: number = me.friends!.findIndex(
        f => f === findTheUserFriend
      );
     
      if (findToDelete !== -1) {
        me.friends!.splice(findToDelete, 1);

        await me.save();
      }
    } else if (findMeFriend && !findTheUserFriend) {
      const findToDelete: number = theUser.friends!.findIndex(
        f => f === findMeFriend
      );
     
      if (findToDelete !== -1) {
        theUser.friends!.splice(findToDelete, 1);

        await theUser.save();
      }
    }

    return res.json("Notification/Friend deleted");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "The API Failed" });
  }
};
