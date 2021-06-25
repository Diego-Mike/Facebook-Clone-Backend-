import { Request, Response } from "express";
import mongoose from "mongoose";

import Publication from "../models/publication";
import User from "../models/user";
import { Iauth } from "../helpers/UserInterface";
import { Ipub } from "../helpers/PublicationInterfaces";

// interfaces

interface Ipublication {
  identifier?: string;
  body?: string;
  photo?: string;
}

// Get all pubs

export const getPublications = async (_: Request, res: Response) => {
  try {
    const allPubs: Ipub[] = await Publication.find().sort({ createdAt: -1 });

    return res.json(allPubs);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Get single pub

export const singlePublication = async (req: Request, res: Response) => {
  const { publicationId } = req.params;

  try {
    const singlePub: Ipub = await Publication.findById(publicationId);

    return res.json(singlePub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// make a publication

export const postPublication = async (req: Request, res: Response) => {
  const { body, photo, identifier }: Ipublication = req.body;

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (body === "" && photo === "")
    return res.status(400).json({ Message: "no data provided" });

  const findUser: Iauth | null = await User.findById(identifier);

  try {
    const newPublication: Ipub = await new Publication({
      body,
      photo,
      creator: { identifier, name: findUser!.name, perfil: findUser!.perfil },
      createdAt: new Date().toISOString()
    });

    await newPublication.save();

    return res.status(201).json(newPublication);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Edit publication

export const editPublication = async (req: Request, res: Response) => {
  const { publicationId } = req.params;
  const { body, identifier, photo }: Ipublication = req.body;

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find user

  const findUser: Iauth = await User.findById(identifier);

  // Find publication

  const findPub: Ipub = await Publication.findById(publicationId);

  // Make sure if user does own that publication

  if (findPub.creator.identifier !== findUser.id)
    return res
      .status(405)
      .json({ Message: "You are not the owner of the pub" });

  // Make sure data is provided

  if (!body && !photo)
    return res.status(404).json({ Message: "No data provided" });

  try {
    // Are you changing the body or the photo
    if (body && photo) {
      findPub.body = body;
      findPub.photo = photo;
    } else if (body && !photo) {
      findPub.body = body;
    } else if (photo && !body) {
      findPub.photo = photo;
    }

    // update publication

    await findPub.save();

    return res.json(findPub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Like Publication

export const likePublication = async (req: Request, res: Response) => {
  const { publicationId } = req.params;

  const { identifier } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find pub

  const thePub: Ipub = await Publication.findById(publicationId);

  if (!thePub)
    return res.status(400).json({ Message: "Publication doesn't exist" });

  // Find user

  const theUser: Iauth = await User.findById(identifier);

  if (!theUser) return res.status(400).json({ Message: "User doesn't exist" });

  try {
    // Check if user already liked, if not, like the pub
    if (thePub.likes!.find(f => f.identifier === theUser.id) === undefined) {
      thePub.likes!.push({ identifier: theUser.id! });
    }
    // Check if user already liked, if user liked, cut like
    else if (thePub.likes!.find(f => f.identifier === theUser.id)) {
      thePub.likes = thePub.likes!.filter(
        filt => filt.identifier !== theUser.id!
      );
    }

    // Save

    await thePub.save();

    return res.json(thePub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Delete publication

export const deletePublication = async (req: Request, res: Response) => {
  const { publicationId } = req.params;

  const { identifier } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Add if the user that is requesting is the owner of the post

  const findPost: Ipub = await Publication.findById(publicationId);

  if (findPost.creator.identifier !== identifier)
    return res
      .status(405)
      .json({ Message: "You are not the owner of the pub" });

  try {
    await Publication.findByIdAndDelete(publicationId);

    return res.json("Publication deleted succesfully");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Make comment

export const createComment = async (req: Request, res: Response) => {
  const { publicationId } = req.params;
  const { body, identifier } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find user

  const theUser: Iauth = await User.findById(identifier);

  if (!theUser) return res.status(400).json({ Message: "User doesn't exist" });

  // Find pub

  const thePub: Ipub = await Publication.findById(publicationId);

  if (!thePub)
    return res.status(400).json({ Message: "Publication doesn't exist" });

  // Check body is not empty

  if (!body) return res.status(404).json({ Message: "No data provided" });

  try {
    // Create comment

    thePub.comments!.unshift({
      createdAt: new Date().toISOString(),
      name: theUser.name!,
      body,
      identifier: theUser.id!,
      perfil: theUser.perfil!
    });

    await thePub.save();

    return res.json(thePub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Edit comment

export const editComment = async (req: Request, res: Response) => {
  const { publicationId } = req.params;

  const { identifier, body, commentId } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(commentId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find pub

  const thePub: Ipub = await Publication.findById(publicationId);

  if (!thePub)
    return res.status(400).json({ Message: "Publication doesn't exist" });

  // Find user

  const theUser: Iauth = await User.findById(identifier);

  if (!theUser) return res.status(400).json({ Message: "User doesn't exist" });

  // Find comment, make sure that comment is from that user

  const theComment = thePub.comments!.find(
    f => f.id === commentId && f.identifier === theUser.id
  );

  if (!theComment)
    return res.status(405).json({
      Message: "You are not the owner of the comment || Comment doesn't exist"
    }); 

  // Make sure body is not empty

  if (!body) return res.status(404).json({ Message: "No data provided" });

  try {
    // Update comment and perfil if it has changed

    theComment.body = body;

    if (theComment.perfil !== theUser.perfil) {
      theComment.perfil = theUser.perfil;
    }

    await thePub.save();

    return res.json(thePub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// Like comment * this one is hard, you've tried it before, let's see what we can do

export const likeComment = async (req: Request, res: Response) => {
  const { publicationId } = req.params;

  const { identifier, commentId } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(identifier!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(commentId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find pub

  const thePub: Ipub = await Publication.findById(publicationId);

  if (!thePub)
    return res.status(400).json({ Message: "Publication doesn't exist" });

  // Find user

  const theUser: Iauth = await User.findById(identifier);

  if (!theUser) return res.status(400).json({ Message: "User doesn't exist" });

  // Find comment

  const theComment = thePub.comments!.find(f => f.id === commentId)!;

  if (!theComment)
    return res.status(400).json({ Message: "Comment doesn't exist" });

  // Find comment owner

  const ownerComment: Iauth = await User.findById(theComment.identifier);

  if (!ownerComment)
    return res.status(400).json({ Message: "User doesn't exist" });

  try {
    // Have you liked the comment ? no ? ok, like it

    if (
      theComment.likesComments!.length < 1 ||
      !theComment.likesComments!.find(f => f.identifier === theUser.id)
    ) {
      theComment.likesComments!.push({ identifier: theUser.id! });
    }
    // Do you want to unlike the comment ? You do ? ok, cut the like
    else if (theComment.likesComments!.find(f => f.identifier === theUser.id)) {
      theComment.likesComments = theComment.likesComments!.filter(
        ({ identifier }) => identifier !== theUser.id
      );
    }

    // If photo has changed, update

    if (theComment.perfil !== ownerComment.perfil) {
      theComment.perfil = ownerComment.perfil;
    }

    await thePub.save();

    return res.json(theComment);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};

// TODO Delete comment

export const deleteComment = async (req: Request, res: Response) => {
  const { publicationId } = req.params;
  const { commentId, userId } = req.body;

  // Check id's

  if (!mongoose.Types.ObjectId.isValid(userId!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(publicationId!))
    return res.status(400).json({ Message: "identifier not valid" });

  if (!mongoose.Types.ObjectId.isValid(commentId!))
    return res.status(400).json({ Message: "identifier not valid" });

  // Find pub

  const thePub: Ipub = await Publication.findById(publicationId);

  if (!thePub)
    return res.status(400).json({ Message: "Publication doesn't exist" });

  // Find user

  const theUser: Iauth = await User.findById(userId);

  if (!theUser) return res.status(400).json({ Message: "User doesn't exist" });

  // Find comment

  const theComment = thePub.comments!.find(f => f.id === commentId)!;

  if (!theComment)
    return res.status(400).json({ Message: "Comment doesn't exist" });

  try {
    if (theComment.identifier === userId) {
      thePub.comments = thePub.comments!.filter(({ id }) => id !== commentId);
    } else {
      return res
        .status(400)
        .json({ Message: "You are not the owner of the comment" });
    }

    await thePub.save();

    return res.json(thePub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ Error: "the API failed" });
  }
};
