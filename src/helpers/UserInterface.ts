import { Document } from "mongoose";

// User representation

export type friends = {
  name?: string;
  perfil?: string;
  identifier?: string;
  notification?: boolean;
  friend?: boolean;
  createdAt?: string;
};

export interface Iauth extends Document {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  friends?: friends[];
  banner?: string;
  perfil?: string;
}
