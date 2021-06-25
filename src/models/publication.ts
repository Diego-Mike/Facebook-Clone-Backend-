import { Schema, model } from "mongoose";
import { Ipub } from "../helpers/PublicationInterfaces";

const publication = new Schema<Ipub>({
  body: { type: String },

  photo: { type: String },

  creator: {
    name: { required: true, type: String },
    perfil: { type: String },
    identifier: { required: true, type: String }
  },

  likes: [
    {
      identifier: { type: String }
    }
  ],

  comments: [
    {
      body: { type: String },
      name: { type: String },
      perfil: { type: String },
      identifier: { type: String },
      createdAt: { type: Date, default: new Date() },
      likesComments: [
        {
          identifier: { type: String }
        }
      ]
    }
  ],

  createdAt: { required: true, type: Date, default: new Date() }
});

export default model("Publications", publication);
