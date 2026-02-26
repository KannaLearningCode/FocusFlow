import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
    _id?: string;
    email: string;
    password?: string; // Optional for Google OAuth users
    name?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
