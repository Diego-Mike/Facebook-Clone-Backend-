import { Schema, model } from "mongoose";
import { Iauth } from "../helpers/UserInterface";

const userModel = new Schema<Iauth>({
  name: { required: true, type: String },

  email: { required: true, type: String },

  password: { required: true, type: String },

  perfil: { type: String },

  banner: { type: String },

  friends: [
    {
      name: { type: String },
      perfil: { type: String },
      identifier: { type: String },
      notification: { type: Boolean, default: false },
      friend: { type: Boolean, default: false },
      createdAt: { type: Date, default: new Date() }
    }
  ]
});

export default model("Users", userModel);
