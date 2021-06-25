import { Document } from "mongoose";

// Publication's representation

export type Likes = {
  identifier: string;
};

export type Comment = {
  id?: string;
  body: string;
  name: string;
  perfil?: string;
  identifier: string;
  createdAt: string;
  likesComments?: Likes[];
};

export interface Ipub extends Document {
  id?: string;
  body: string;

  photo: string;

  creator: {
    name: string;
    perfil?: string;
    identifier: string;
  };

  likes?: Likes[];

  comments?: Comment[];

  createdAt: string;
}
